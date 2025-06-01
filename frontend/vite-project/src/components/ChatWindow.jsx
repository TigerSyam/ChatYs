import React, { useState, useRef, useEffect } from 'react';
import './ChatWindow.css';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useSpeechSynthesis } from 'react-speech-kit';
import UserSettings from './UserSettings';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [userContext, setUserContext] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [userId] = useState(() => {
    const saved = localStorage.getItem("chaty-user-id");
    if (!saved) {
      const newId = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("chaty-user-id", newId);
      return newId;
    }
    return saved;
  });

  const chatEndRef = useRef(null);
  const { speak } = useSpeechSynthesis();
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId);
    }
  }, [currentSessionId]);

  // Effect to scroll to bottom
  useEffect(() => {
    if (userContext?.preferences?.auto_scroll) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadSessions = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/sessions/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
        if (data.length > 0 && !currentSessionId) {
          setCurrentSessionId(data[0].session_id);
        }
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    }
  };

  const loadSessionMessages = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "",
          user_id: userId,
          session_id: sessionId,
          language: userContext?.preferences?.language || "English"
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setUserContext(data.user_context);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSendMessage = async (inputText = null, regenerate = false) => {
    const text = inputText || userInput.trim();
    if (!text) return;

    if (!regenerate) {
      const newMessages = [...messages, { sender: "user", text }];
      setMessages(newMessages);
      setUserInput("");
    }

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          user_id: userId,
          session_id: currentSessionId,
          language: userContext?.preferences?.language || "English",
          regenerate: regenerate
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.response) {
        throw new Error('Invalid response format');
      }

      setCurrentSessionId(data.session_id);
      setUserContext(data.user_context);
      
      if (regenerate) {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { sender: "bot", text: data.response };
          return newMessages;
        });
      } else {
        setMessages(prev => [...prev, { sender: "bot", text: data.response }]);
      }
      
      loadSessions();

      if (userContext?.preferences?.voice_enabled) {
        speak({ text: data.response });
      }
    } catch (err) {
      console.error('Error:', err);
      const errorReply = "I apologize, but I'm having trouble processing your request. Please try again.";
      if (!regenerate) {
        setMessages(prev => [...prev, { sender: "bot", text: errorReply }]);
      }
      if (userContext?.preferences?.voice_enabled) {
        speak({ text: errorReply });
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Start new conversation",
          user_id: userId,
          language: userContext?.preferences?.language || "English"
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(data.session_id);
        setMessages([]);
        setUserContext(data.user_context);
        loadSessions();
      }
    } catch (err) {
      console.error('Error creating new session:', err);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/sessions/${userId}/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadSessions();
        if (sessionId === currentSessionId) {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const startListening = () => {
    if (!userContext?.preferences?.voice_enabled) return;
    resetTranscript();
    SpeechRecognition.startListening({ continuous: false });
  };

  const stopListeningAndSend = () => {
    SpeechRecognition.stopListening();
    handleSendMessage(transcript);
  };

  const handleSettingsUpdate = (newSettings) => {
    setUserContext(newSettings);
    setShowSettings(false);
  };

  const regenerateResponse = async () => {
    if (messages.length === 0) return;
    const lastUserMessage = messages.findLast(msg => msg.sender === "user");
    if (!lastUserMessage) return;
    
    setIsRegenerating(true);
    await handleSendMessage(lastUserMessage.text, true);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className={`chaty-container ${userContext?.preferences?.theme || 'dark'}`}>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {showSidebar ? '◀' : '▶'}
      </button>
      
      {showSidebar && (
        <aside className="chaty-sidebar">
          <h2>ChatY</h2>
          <button onClick={createNewSession} className="new-chat-btn">
            New Chat
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="settings-btn">
            {showSettings ? "Hide Settings" : "Settings"}
          </button>
          <button onClick={() => setShowMemory(!showMemory)} className="memory-btn">
            {showMemory ? "Hide Memory" : "Show Memory"}
          </button>
          {showSettings ? (
            <UserSettings userId={userId} onSettingsUpdate={handleSettingsUpdate} />
          ) : showMemory ? (
            <div className="memory-view">
              <h3>Conversation Memory</h3>
              <div className="memory-content">
                {userContext?.memory?.map((item, idx) => (
                  <div key={idx} className="memory-item">
                    <strong>{item.type}:</strong> {item.content}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="sessions-list">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  className={`session-item ${session.session_id === currentSessionId ? 'active' : ''}`}
                  onClick={() => setCurrentSessionId(session.session_id)}
                >
                  <span className="session-title">
                    Chat {new Date(session.created_at).toLocaleDateString()}
                  </span>
                  <button
                    className="delete-session-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.session_id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>
      )}

      <div className="chaty-main">
        <div className="chaty-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chaty-message ${msg.sender}`}>
              <div className="avatar">
                {msg.sender === "user" ? "👤" : "🤖"}
              </div>
              <div className="message-content">
                <div className={`chaty-bubble ${msg.sender}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="chaty-input-area">
          <div className="input-controls">
            <select
              value={userContext?.preferences?.language || "English"}
              onChange={(e) => handleSettingsUpdate({
                ...userContext,
                preferences: {
                  ...userContext?.preferences,
                  language: e.target.value
                }
              })}
              className="language-select"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </select>
            <button
              onClick={regenerateResponse}
              disabled={isRegenerating || messages.length === 0}
              className="regenerate-btn"
            >
              {isRegenerating ? "Regenerating..." : "🔄 Regenerate"}
            </button>
          </div>
          
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type or speak your message..."
          />

          <button onClick={handleSendMessage}>Send</button>
          <button 
            onClick={listening ? stopListeningAndSend : startListening}
            disabled={!userContext?.preferences?.voice_enabled}
          >
            {listening ? "Stop 🎤" : "Speak 🎙️"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
