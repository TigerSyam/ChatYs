from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from langgraph_app.workflow import get_chat_app
from langgraph_app.session_manager import session_manager
from langgraph_app.user_manager import user_manager
from langgraph_app.agent import agent
from typing import Optional, List, Dict
import uvicorn
import json
from auth.routes import router as auth_router

langgraph_app = get_chat_app()

# Define FastAPI app
app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the auth routes
app.include_router(auth_router, prefix="/auth", tags=["auth"])

# Input schemas
class ChatInput(BaseModel):
    message: str
    user_id: str
    session_id: Optional[str] = None
    language: str = "English"

class ChatMessage(BaseModel):
    message: str
    user_id: str
    session_id: Optional[str] = None
    language: str

class ChatResponse(BaseModel):
    response: str
    session_id: str
    user_context: Dict
    error: Optional[str] = None

class SessionInfo(BaseModel):
    session_id: str
    created_at: str
    last_activity: str
    message_count: int

class UserPreferences(BaseModel):
    language: str
    theme: str
    voice_enabled: bool
    auto_scroll: bool

class UserPersonality(BaseModel):
    formality: float
    humor: float
    creativity: float
    detail_level: float

class UserUpdate(BaseModel):
    username: Optional[str] = None
    preferences: Optional[UserPreferences] = None
    personality_traits: Optional[UserPersonality] = None

# Routes
@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_bot(chat_message: ChatMessage):
    try:
        # Get or create session
        session = None
        if chat_message.session_id:
            session = session_manager.get_session(chat_message.user_id, chat_message.session_id)
        
        if not session:
            session = session_manager.create_session(chat_message.user_id)
        
        # Add user message to session
        session.add_message("user", chat_message.message)
        
        # Process message through agent
        result = agent.process_message(
            chat_message.user_id,
            chat_message.message,
            session.session_id
        )
        
        # Add bot response to session
        session.add_message("assistant", result["response"])
        
        return ChatResponse(
            response=result["response"],
            session_id=session.session_id,
            user_context=result["user_context"]
        )
    except Exception as e:
        print(f"Error in chat processing: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/api/sessions/{user_id}", response_model=List[SessionInfo])
async def get_user_sessions(user_id: str):
    try:
        sessions = session_manager.get_user_sessions(user_id)
        return [
            SessionInfo(
                session_id=session.session_id,
                created_at=session.created_at.isoformat(),
                last_activity=session.last_activity.isoformat(),
                message_count=len(session.messages)
            )
            for session in sessions
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/sessions/{user_id}/{session_id}")
async def delete_session(user_id: str, session_id: str):
    try:
        if session_manager.delete_session(user_id, session_id):
            return {"message": "Session deleted successfully"}
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    try:
        user = user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/users/{user_id}")
async def update_user(user_id: str, updates: UserUpdate):
    try:
        user = user_manager.update_user(user_id, updates.dict(exclude_unset=True))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agent/capabilities")
async def get_agent_capabilities():
    return agent.get_capabilities()

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to ChatY API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)