import { useState } from 'react';
import { generateReadme } from '../utils/api';
import './ReadmeGenerator.css';

export default function ReadmeGenerator({ owner, repo }) {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setMarkdown('');
    try {
      const res = await generateReadme(owner, repo);
      setMarkdown(res.readme);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="readme-gen">
      <div className="readme-gen__header">
        <p className="readme-gen__intro">
          Generate a high-quality, professional README.md for <strong>{owner}/{repo}</strong>{' '}
          using AI based on the repository's analyzed metadata.
        </p>
        <button 
          className="btn-primary" 
          onClick={handleGenerate} 
          disabled={loading}
        >
          {loading ? 'Generating...' : '✨ Generate README'}
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {markdown && (
        <div className="readme-gen__content">
          <div className="readme-gen__actions">
            <button className="btn-secondary" onClick={copyToClipboard}>
              {copied ? '✅ Copied!' : '📋 Copy Markdown'}
            </button>
          </div>
          <pre className="readme-gen__preview">
            <code>{markdown}</code>
          </pre>
        </div>
      )}

      {loading && (
        <div className="readme-gen__loading">
          <div className="spinner"></div>
          <p>Analyzing architecture and crafting your documentation...</p>
        </div>
      )}
    </div>
  );
}
