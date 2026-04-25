import { useState } from 'react';
import { regenerateSummary } from '../utils/api';
import ReactMarkdown from 'react-markdown';
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
    <div className="ai-insight" role="region" aria-label="AI Repository Analysis">
      <div className="ai-insight__header">
        <span className="ai-insight__pulse" aria-hidden="true" />
        <h3 className="ai-insight__title">Repository Intelligence Report</h3>
      </div>

      <div className="ai-insight__content">
        {summary ? (
          <div className="ai-insight__markdown">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        ) : (
          <p className="ai-insight__empty">
            No summary available yet. Click Regenerate to generate an AI analysis.
          </p>
        )}
      </div>

      {error && (
        <div className="ai-insight__error" role="alert">
          {error}
        </div>
      )}

      <div className="ai-insight__actions">
        <button
          type="button"
          className={`ai-insight__btn ${loading ? 'ai-insight__btn--loading' : ''}`}
          onClick={handleRegenerate}
          disabled={loading}
          aria-label="Regenerate AI analysis"
          id="regenerate-ai-btn"
        >
          {loading ? 'Regenerating…' : '↺ Regenerate Analysis'}
        </button>
      </div>
    </div>
  );
}
