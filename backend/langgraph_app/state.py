# backend/langgraph_app/state.py

from typing import Sequence, Optional
from typing_extensions import Annotated, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    language: str
    message: Optional[str]
    response: Optional[str]
