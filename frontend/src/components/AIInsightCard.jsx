import { useState } from 'react';
import { regenerateSummary } from '../utils/api';
import { renderParagraphs } from '../utils/markdown';
import './AIInsightCard.css';

export default function AIInsightCard({ owner, repo, summary, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegenerate = async () => {
    setError(null);
    setLoading(true);
    try {
      const updated = await regenerateSummary(owner, repo);
      if (updated && onUpdate) onUpdate(updated);
    } catch (err) {
      setError(err.message || 'Failed to regenerate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-insight">
      <div className="ai-insight__header">
        <h3 className="ai-insight__title">AI architectural summary</h3>
        <button
          type="button"
          className="ai-insight__btn"
          onClick={handleRegenerate}
          disabled={loading}
        >
          {loading ? 'Regenerating…' : 'Regenerate'}
        </button>
      </div>
      <div className="ai-insight__content">
        {summary ? (
          renderParagraphs(summary, 'ai-insight__text')
        ) : (
          <p className="ai-insight__empty">No summary available.</p>
        )}
      </div>
      {error && (
        <div className="ai-insight__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
