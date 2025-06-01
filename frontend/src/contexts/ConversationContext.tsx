import React, { createContext, useContext, useState, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  user_id: string;
  created_at: string;
  last_updated: string;
  messages: Message[];
  metadata: Record<string, any>;
}

interface ConversationContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  loading: boolean;
  error: string | null;
  createNewConversation: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  clearConversations: () => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with actual user ID management
  const userId = 'user-1';

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/conversations/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: 'Hello',
          metadata: { title: 'New Conversation' }
        }),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      const data = await response.json();
      await fetchConversations();
      await selectConversation(data.conversation_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conversationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/conversation/${conversationId}`);
      if (!response.ok) throw new Error('Failed to fetch conversation');
      const data = await response.json();
      setCurrentConversation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (!currentConversation) return;
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          conversation_id: currentConversation.id,
          message,
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      await selectConversation(currentConversation.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/conversation/${conversationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete conversation');
      await fetchConversations();
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/conversations/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear conversations');
      setConversations([]);
      setCurrentConversation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        currentConversation,
        loading,
        error,
        createNewConversation,
        selectConversation,
        sendMessage,
        deleteConversation,
        clearConversations,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}; 