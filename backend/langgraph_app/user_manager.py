from typing import Dict, Optional
from datetime import datetime
import json
import os

class UserProfile:
    def __init__(self, user_id: str, username: str = None):
        self.user_id = user_id
        self.username = username or f"User_{user_id[:8]}"
        self.created_at = datetime.now()
        self.last_active = datetime.now()
        self.preferences = {
            "language": "English",
            "theme": "dark",
            "voice_enabled": True,
            "auto_scroll": True
        }
        self.conversation_history = []
        self.personality_traits = {
            "formality": 0.5,  # 0-1 scale
            "humor": 0.5,
            "creativity": 0.5,
            "detail_level": 0.5
        }

    def update_preferences(self, new_preferences: dict):
        self.preferences.update(new_preferences)
        self.last_active = datetime.now()

    def update_personality(self, new_traits: dict):
        self.personality_traits.update(new_traits)
        self.last_active = datetime.now()

    def add_to_history(self, interaction: dict):
        self.conversation_history.append({
            **interaction,
            "timestamp": datetime.now().isoformat()
        })
        self.last_active = datetime.now()

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "username": self.username,
            "created_at": self.created_at.isoformat(),
            "last_active": self.last_active.isoformat(),
            "preferences": self.preferences,
            "personality_traits": self.personality_traits
        }

class UserManager:
    def __init__(self, storage_path: str = "user_data"):
        self.users: Dict[str, UserProfile] = {}
        self.storage_path = storage_path
        self._ensure_storage_dir()
        self._load_users()

    def _ensure_storage_dir(self):
        if not os.path.exists(self.storage_path):
            os.makedirs(self.storage_path)

    def _load_users(self):
        try:
            for filename in os.listdir(self.storage_path):
                if filename.endswith('.json'):
                    with open(os.path.join(self.storage_path, filename), 'r') as f:
                        user_data = json.load(f)
                        user = UserProfile(user_data['user_id'], user_data['username'])
                        user.preferences = user_data['preferences']
                        user.personality_traits = user_data['personality_traits']
                        user.created_at = datetime.fromisoformat(user_data['created_at'])
                        user.last_active = datetime.fromisoformat(user_data['last_active'])
                        self.users[user.user_id] = user
        except Exception as e:
            print(f"Error loading users: {str(e)}")

    def _save_user(self, user: UserProfile):
        try:
            filename = f"{user.user_id}.json"
            with open(os.path.join(self.storage_path, filename), 'w') as f:
                json.dump(user.to_dict(), f, indent=2)
        except Exception as e:
            print(f"Error saving user {user.user_id}: {str(e)}")

    def create_user(self, user_id: str, username: str = None) -> UserProfile:
        if user_id not in self.users:
            user = UserProfile(user_id, username)
            self.users[user_id] = user
            self._save_user(user)
        return self.users[user_id]

    def get_user(self, user_id: str) -> Optional[UserProfile]:
        return self.users.get(user_id)

    def update_user(self, user_id: str, updates: dict) -> Optional[UserProfile]:
        user = self.get_user(user_id)
        if user:
            if 'preferences' in updates:
                user.update_preferences(updates['preferences'])
            if 'personality_traits' in updates:
                user.update_personality(updates['personality_traits'])
            if 'username' in updates:
                user.username = updates['username']
            self._save_user(user)
        return user

    def delete_user(self, user_id: str) -> bool:
        if user_id in self.users:
            try:
                filename = f"{user_id}.json"
                os.remove(os.path.join(self.storage_path, filename))
                del self.users[user_id]
                return True
            except Exception as e:
                print(f"Error deleting user {user_id}: {str(e)}")
        return False

    def get_all_users(self) -> list:
        return list(self.users.values())

# Create a global user manager instance
user_manager = UserManager() 