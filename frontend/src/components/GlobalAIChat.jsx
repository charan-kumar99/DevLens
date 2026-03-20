import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { askSupport } from '../utils/api';
import { renderMarkdown } from '../utils/markdown';
import './GlobalAIChat.css';

const SUGGESTED_QUESTIONS = [
  'What does the Overall Score mean?',
  'What does "Potentially abandoned" mean?',
  'How do I export a report?',
  'What is the README Score?',
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  type: 'bot',
  text: "Hi! 👋 I'm DevLens AI Support. Ask me quick questions about features, metrics, or how to use the app!",
};

export default function GlobalAIChat() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Close when path changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (question) => {
    const text = (question || input).trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), type: 'user', text };
    const currentHistory = [...messages];
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Send question and history (skip welcome message)
      const history = currentHistory.filter(m => m.id !== 'welcome');
      const answer = await askSupport(text, history);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, type: 'bot', text: answer ?? 'Sorry, I could not get a response.' },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, type: 'error', text: err.message || 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleNewChat = (e) => {
    e.stopPropagation();
    setMessages([WELCOME_MESSAGE]);
    setInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleSuggestion = (q) => {
    if (loading) return;
    sendMessage(q);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        id="ai-support-toggle"
        className={`global-ai-toggle ${isOpen ? 'global-ai-toggle--active' : ''}`}
        onClick={isOpen ? handleClose : handleOpen}
        title={isOpen ? 'Close AI Support' : 'AI Support — Ask me anything!'}
        aria-label={isOpen ? 'Close AI Support' : 'Open AI Support'}
      >
        {isOpen ? (
          <span className="global-ai-toggle-icon">✕</span>
        ) : (
          <span className="global-ai-toggle-icon">🤖</span>
        )}
        {!isOpen && <span className="global-ai-badge">?</span>}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="global-ai-chat" role="dialog" aria-label="AI Support Chat">
          {/* Header */}
          <div className="global-ai-header">
            <div className="global-ai-header-left">
              <span className="global-ai-avatar">🤖</span>
              <div>
                <div className="global-ai-header-row">
                  <h3 className="global-ai-title">AI Support</h3>
                </div>
                <span className="global-ai-subtitle">Powered by Gemini</span>
              </div>
            </div>
            <div className="global-ai-header-status">
              <span className="global-ai-online-dot" />
              <span className="global-ai-online-label">Online</span>
            </div>
          </div>

          {/* Messages area */}
          <div className="global-ai-messages" role="log" aria-live="polite">
            {messages.map((msg) => (
              <div key={msg.id} className={`global-ai-message global-ai-message--${msg.type}`}>
                {msg.type === 'bot' && (
                  <span className="global-ai-msg-avatar">🤖</span>
                )}
                <div className={`global-ai-bubble global-ai-bubble--${msg.type}`}>
                  {renderMarkdown(msg.text)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="global-ai-message global-ai-message--bot">
                <span className="global-ai-msg-avatar">🤖</span>
                <div className="global-ai-bubble global-ai-bubble--bot global-ai-bubble--loading">
                  <span className="global-ai-typing" />
                  <span className="global-ai-typing" />
                  <span className="global-ai-typing" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions (show only at start) */}
          {messages.length <= 1 && !loading && (
            <div className="global-ai-suggestions">
              <p className="global-ai-suggestions-label">Try asking:</p>
              <div className="global-ai-suggestions-grid">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    className="global-ai-chip"
                    onClick={() => handleSuggestion(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <form className="global-ai-input-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              id="ai-support-input"
              type="text"
              className="global-ai-question"
              placeholder="Ask anything about DevLens…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
            <div className="global-ai-input-actions">
              {messages.length > 1 && (
                <button
                  type="button"
                  id="ai-support-new-chat"
                  className="global-ai-clear-btn"
                  onClick={handleNewChat}
                  title="Clear conversation"
                >
                  🗑️
                </button>
              )}
              <button
                type="submit"
                id="ai-support-send"
                className="global-ai-send"
                disabled={loading || !input.trim()}
                title="Send"
              >
                {loading ? '…' : '↑'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

