# backend/langgraph_app/model.py
from dotenv import load_dotenv
load_dotenv()

from langchain.chat_models import init_chat_model
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
import os

# Load from .env or environment
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Set up callback manager
callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])

# Set up Groq LLM with proper configuration
model = init_chat_model(
    "llama3-8b-8192",
    model_provider="groq",
    temperature=0.7,
    max_tokens=1000,
    top_p=0.95,
    callback_manager=callback_manager,
    streaming=True
)




