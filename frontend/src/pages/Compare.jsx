import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { compareRepos } from '../utils/api';
import StatCard from '../components/StatCard';
import { formatDate } from '../utils/formatters';
import CompareSkeletonLoader from '../components/CompareSkeletonLoader';
import Footer from '../components/Footer';
import './Compare.css';

export default function Compare() {
  const location = useLocation();
  const previousResult = location.state?.result;
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setData(null);
    const u1 = url1.trim();
    const u2 = url2.trim();
    if (!u1 || !u2) {
      setError('Please enter both repository URLs.');
      return;
    }
    if (u1 === u2) {
      setError('Please enter two different repositories.');
      return;
    }
    setLoading(true);
    try {
      const res = await compareRepos(u1, u2);
      setData(res);
    } catch (err) {
      setError(err.message || 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="compare home">
      {loading ? (
        <CompareSkeletonLoader />
      ) : (
        <>
          <header className="compare__header">
            <Link to="/dashboard" state={{ result: previousResult }} className="compare__back">
              ← Back to Dashboard
            </Link>
            <h1 className="compare__title">Compare repositories</h1>
            <p className="compare__subtitle">Enter two GitHub repo URLs to see key metrics side by side.</p>
          </header>

          <form className="compare__form" onSubmit={handleSubmit}>
            <div className="compare__inputs">
              <input
                type="url"
                className="compare__input"
                placeholder="https://github.com/owner/repo1"
                value={url1}
                onChange={(e) => setUrl1(e.target.value)}
                disabled={loading}
                aria-label="First repository URL"
              />
              <span className="compare__vs" aria-hidden="true">vs</span>
              <input
                type="url"
                className="compare__input"
                placeholder="https://github.com/owner/repo2"
                value={url2}
                onChange={(e) => setUrl2(e.target.value)}
                disabled={loading}
                aria-label="Second repository URL"
              />
            </div>
            <button type="submit" className="compare__btn" disabled={loading} aria-label="Compare repositories">
              Compare
            </button>
          </form>

          {error && (
            <div className="compare__error" role="alert">
              {error}
            </div>
          )}

          {data && data.repo1 && data.repo2 && (
            <>
              {data.aiVerdict && (
                <div className="compare__verdict">
                  <div className="verdict__header">
                    <span className="verdict__badge">AI Smart Verdict</span>
                  </div>
          <p className="compare__description" 
             dangerouslySetInnerHTML={{ 
               __html: (data.aiVerdict || '')
                 .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/&lt;strong&gt;/g, '<strong>')
                 .replace(/&lt;\/strong&gt;/g, '</strong>')
                 .replace(/\n\n/g, '<br/><br/>') 
             }} 
          />
                </div>
              )}
              <div className="compare__grid">
                <div className="compare__col">
                  <h2 className="compare__repo-name">{data.repo1.repo}</h2>
                  <p className="compare__description">{data.repo1.description || '—'}</p>
                  <div className="compare__stats">
                    <StatCard label="Stars" value={data.repo1.stars} icon="★" />
                    <StatCard label="Forks" value={data.repo1.forks} icon="⎇" />
                    <StatCard label="Open issues" value={data.repo1.openIssues} icon="!" />
                    <StatCard label="Last commit" value={formatDate(data.repo1.lastCommit)} icon="◷" />
                    <StatCard label="Score" value={`${data.repo1.overallScore ?? 0}/100`} icon="🎯" />
                    <StatCard label="Status" value={data.repo1.projectStatus} icon="🚦" />
                  </div>
                  <p className="compare__lang">
                    Top languages: {Object.entries(data.repo1.languages || {}).slice(0, 3).map(([k]) => k).join(', ') || '—'}
                  </p>
                </div>
                <div className="compare__col">
                  <h2 className="compare__repo-name">{data.repo2.repo}</h2>
                  <p className="compare__description">{data.repo2.description || '—'}</p>
                  <div className="compare__stats">
                    <StatCard label="Stars" value={data.repo2.stars} icon="★" />
                    <StatCard label="Forks" value={data.repo2.forks} icon="⎇" />
                    <StatCard label="Open issues" value={data.repo2.openIssues} icon="!" />
                    <StatCard label="Last commit" value={formatDate(data.repo2.lastCommit)} icon="◷" />
                    <StatCard label="Score" value={`${data.repo2.overallScore ?? 0}/100`} icon="🎯" />
                    <StatCard label="Status" value={data.repo2.projectStatus} icon="🚦" />
                  </div>
                  <p className="compare__lang">
                    Top languages: {Object.entries(data.repo2.languages || {}).slice(0, 3).map(([k]) => k).join(', ') || '—'}
                  </p>
                </div>
              </div>
            </>
          )}
        </>
      )}
      <Footer />
    </div>
  );
}
