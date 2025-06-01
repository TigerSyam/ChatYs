import React, { useState } from 'react';
import axios from 'axios';

export default function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const payload = { messages: updated.map(m => m.text) };
      const resp = await axios.post(
        import.meta.env.VITE_BACKEND_URL + '/chat',
        payload
      );
      const botMsg = { sender: 'bot', text: resp.data.response };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col">
      <div className="overflow-auto h-96 mb-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`my-2 p-2 rounded-lg ${m.sender === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'}`}>
            <strong>{m.sender === 'user' ? 'You' : 'Bot'}:</strong> {m.text}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          className="flex-1 border rounded-l-lg p-2 focus:outline-none"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-500 text-white px-4 rounded-r-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}