# backend/langgraph_app/workflow.py

from langgraph.graph import StateGraph
from .state import State
from .nodes import call_model
from .memory import memory
from langchain_core.messages import HumanMessage, SystemMessage

# Build graph
def get_chat_app():
    workflow = StateGraph(state_schema=State)
    
    # Add nodes
    workflow.add_node("model", call_model)
    
    # Add edges (use string literals "__start__" and "__end__")
    workflow.add_edge("__start__", "model")
    workflow.add_edge("model", "__end__")
    
    # Set entry and finish points
    workflow.set_entry_point("__start__")
    workflow.set_finish_point("__end__")
    
    # Compile the graph
    app = workflow.compile(checkpointer=memory)
    
    return app
