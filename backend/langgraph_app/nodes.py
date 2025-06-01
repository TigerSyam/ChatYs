# backend/langgraph_app/nodes.py

from .model import model
from .state import State
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, trim_messages

trimmer = trim_messages(
    max_tokens=1000,
    strategy="last",
    token_counter=model,
    include_system=True,
    allow_partial=False,
    start_on="human",
)

prompt_template = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are a helpful and friendly AI assistant. You should:
1. Provide clear and concise responses
2. Be helpful and informative
3. Maintain a friendly and professional tone
4. If you're not sure about something, be honest about it
5. Use simple and understandable language
6. Maintain consistency in your responses
7. Don't make assumptions about user information unless explicitly provided
8. Remember previous context within the same conversation
9. If you don't know something, say so instead of making assumptions"""
        ),
        MessagesPlaceholder(variable_name="messages"),
    ]
)

def call_model(state: State) -> State:
    try:
        # Get existing messages or initialize empty list
        messages = state.get("messages", [])
        
        # Convert input message to HumanMessage if it's a string
        if isinstance(state.get("message"), str):
            input_message = HumanMessage(content=state["message"])
            messages.append(input_message)
        
        # Trim messages if needed
        trimmed_messages = trimmer.invoke(messages)
        
        # Get language from state or default to English
        language = state.get("language", "English")
        
        # Generate response
        prompt = prompt_template.invoke(
            {"messages": trimmed_messages, "language": language}
        )
        
        # Get response from model
        response = model.invoke(prompt)
        
        # Ensure we have a valid response
        if not response or not hasattr(response, 'content'):
            return {
                "messages": messages,
                "response": "I apologize, but I'm having trouble generating a response right now. Please try again.",
                "language": language
            }
        
        # Create AI message from response
        ai_message = AIMessage(content=response.content)
        
        # Update state with response and maintain conversation history
        return {
            "messages": messages + [ai_message],
            "response": response.content,
            "language": language
        }
    except Exception as e:
        print(f"Error in model call: {str(e)}")
        return {
            "messages": state.get("messages", []),
            "response": "I apologize, but I encountered an error while processing your request. Please try again.",
            "language": state.get("language", "English")
        }
 


