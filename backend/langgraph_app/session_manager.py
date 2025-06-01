from typing import Dict, List, Optional
from datetime import datetime
import uuid

class ChatSession:
    def __init__(self, user_id: str, session_id: str = None):
        self.user_id = user_id
        self.session_id = session_id or str(uuid.uuid4())
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        self.messages: List[dict] = []

    def add_message(self, role: str, content: str):
        self.messages.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        self.last_activity = datetime.now()

    def get_messages(self) -> List[dict]:
        return self.messages

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, Dict[str, ChatSession]] = {}  # user_id -> {session_id -> ChatSession}

    def create_session(self, user_id: str) -> ChatSession:
        if user_id not in self.sessions:
            self.sessions[user_id] = {}
        
        session = ChatSession(user_id)
        self.sessions[user_id][session.session_id] = session
        return session

    def get_session(self, user_id: str, session_id: str) -> Optional[ChatSession]:
        return self.sessions.get(user_id, {}).get(session_id)

    def get_user_sessions(self, user_id: str) -> List[ChatSession]:
        return list(self.sessions.get(user_id, {}).values())

    def delete_session(self, user_id: str, session_id: str) -> bool:
        if user_id in self.sessions and session_id in self.sessions[user_id]:
            del self.sessions[user_id][session_id]
            if not self.sessions[user_id]:
                del self.sessions[user_id]
            return True
        return False

    def cleanup_inactive_sessions(self, max_age_hours: int = 24):
        current_time = datetime.now()
        for user_id in list(self.sessions.keys()):
            for session_id in list(self.sessions[user_id].keys()):
                session = self.sessions[user_id][session_id]
                age = (current_time - session.last_activity).total_seconds() / 3600
                if age > max_age_hours:
                    self.delete_session(user_id, session_id)

# Create a global session manager instance
session_manager = SessionManager() 