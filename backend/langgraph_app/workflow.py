# backend/langgraph_app/workflow.py

from langgraph.graph import StateGraph, START, END
from .state import State
from .nodes import call_model
from .memory import memory
from langchain_core.messages import HumanMessage, SystemMessage

# Build graph
def get_chat_app():
    workflow = StateGraph(state_schema=State)
    
    # Add nodes
    workflow.add_node("model", call_model)
    
    # Add edges
    workflow.add_edge(START, "model")
    workflow.add_edge("model", END)
    
    # Set entry point
    workflow.set_entry_point("model")
    
    # Compile the graph
    app = workflow.compile(checkpointer=memory)
    
    return app
