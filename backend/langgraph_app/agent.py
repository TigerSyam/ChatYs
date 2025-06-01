from typing import Dict, List, Optional
from datetime import datetime
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from .model import model
from .user_manager import user_manager

class Agent:
    def __init__(self):
        self.capabilities = {
            "search": True,
            "code_generation": True,
            "data_analysis": True,
            "creative_writing": True,
            "task_planning": True
        }
        
        self.system_prompt = """You are an advanced AI assistant with multiple capabilities. You should:
1. Adapt your responses based on user preferences and personality traits
2. Use appropriate formality and detail level based on user settings
3. Maintain context and remember important information about the user
4. Be proactive in suggesting relevant capabilities
5. Break down complex tasks into manageable steps
6. Provide explanations for your actions and reasoning
7. Learn from user feedback and adjust your behavior accordingly
8. Maintain a consistent personality while being flexible in your approach"""

    def _get_user_context(self, user_id: str) -> dict:
        user = user_manager.get_user(user_id)
        if not user:
            return {}
        
        return {
            "preferences": user.preferences,
            "personality_traits": user.personality_traits,
            "username": user.username
        }

    def _create_prompt(self, user_id: str, messages: List[dict]) -> List[dict]:
        user_context = self._get_user_context(user_id)
        
        # Create dynamic system message based on user context
        system_content = self.system_prompt
        if user_context:
            system_content += f"\n\nUser Context:\n"
            system_content += f"Username: {user_context.get('username', 'User')}\n"
            system_content += f"Language: {user_context.get('preferences', {}).get('language', 'English')}\n"
            system_content += f"Formality Level: {user_context.get('personality_traits', {}).get('formality', 0.5)}\n"
            system_content += f"Detail Level: {user_context.get('personality_traits', {}).get('detail_level', 0.5)}"

        return [
            SystemMessage(content=system_content),
            *[HumanMessage(content=msg["content"]) for msg in messages]
        ]

    def process_message(self, user_id: str, message: str, session_id: str) -> dict:
        try:
            # Get or create user
            user = user_manager.get_user(user_id)
            if not user:
                user = user_manager.create_user(user_id)

            # Convert message to LangChain format
            messages = [{"content": message}]
            
            # Create prompt with user context
            prompt_messages = self._create_prompt(user_id, messages)
            
            # Generate response
            response = model.invoke(prompt_messages)
            
            # Update user history
            user.add_to_history({
                "type": "chat",
                "session_id": session_id,
                "message": message,
                "response": response.content
            })
            
            return {
                "response": response.content,
                "user_context": self._get_user_context(user_id)
            }
            
        except Exception as e:
            print(f"Error in agent processing: {str(e)}")
            return {
                "response": "I apologize, but I encountered an error while processing your request. Please try again.",
                "user_context": {}
            }

    def update_capabilities(self, new_capabilities: Dict[str, bool]):
        self.capabilities.update(new_capabilities)

    def get_capabilities(self) -> Dict[str, bool]:
        return self.capabilities

# Create a global agent instance
agent = Agent() 