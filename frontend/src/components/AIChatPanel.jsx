import { useState, useRef, useEffect } from 'react';
import { askAI } from '../utils/api';
import './AIChatPanel.css';

export default function AIChatPanel({ owner, repo, repoUrl }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: `Hi! I'm your AI assistant for ${owner}/${repo}. Ask me anything about this repository!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await askAI(repoUrl, input);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: response,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setError(err.message || 'Failed to get response from AI');
      const errorMessage = {
        id: Date.now() + 2,
        type: 'error',
        text: err.message || 'Failed to get response from AI',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat-panel">
      <div className="ai-chat__header">
        <h3 className="ai-chat__title">💬 AI Assistant</h3>
      </div>

      <div className="ai-chat__messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`ai-chat__message ai-chat__message--${msg.type}`}>
            <div className="ai-chat__bubble">
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-chat__message ai-chat__message--bot">
            <div className="ai-chat__bubble ai-chat__bubble--loading">
              <span className="ai-chat__typing">●</span>
              <span className="ai-chat__typing">●</span>
              <span className="ai-chat__typing">●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="ai-chat__input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="ai-chat__input"
          placeholder="Ask about the project..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="ai-chat__send-btn"
          disabled={loading || !input.trim()}
        >
          {loading ? '…' : '→'}
        </button>
      </form>

      {error && (
        <div className="ai-chat__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
