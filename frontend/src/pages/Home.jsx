import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { analyzeRepo } from '../utils/api';
import { SkeletonCard, SkeletonChart } from '../components/SkeletonLoader';
import Footer from '../components/Footer';
import './Home.css';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.url) {
      setUrl(location.state.url);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a GitHub repository URL.');
      return;
    }
    setLoading(true);
    try {
      const result = await analyzeRepo(trimmed);
      navigate('/dashboard', { state: { result } });
    } catch (err) {
      setError(err.message || 'Analysis failed. Check the URL and try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="home-loading__header">
          <h2 className="home-loading__title">Analyzing Repository...</h2>
          <p className="home-loading__subtitle">This may take a few moments</p>
        </div>
        <div className="home-loading__content">
          <div className="home-loading__grid">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      <div className="home__bg" aria-hidden="true" />
      <div className="home__mesh" aria-hidden="true" />
      <main className="home__main">
        <div className="home__content">
          <h1 className="home__title">DevLens</h1>
          <p className="home__subtitle">AI-powered GitHub repository analyzer</p>
          <form className="home__form" onSubmit={handleSubmit}>
            <div className="home__input-wrap">
              <input
                type="text"
                className="home__input"
                placeholder="https://github.com/owner/repo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                autoFocus
                aria-label="GitHub repository URL"
              />
            </div>
            <button type="submit" className="home__btn" disabled={loading}>
              Analyze
            </button>
          </form>
          {error && (
            <div className="home__error" role="alert">
              {error}
            </div>
          )}
          <p className="home__link">
            Try <a href="/dashboard" onClick={(e) => { e.preventDefault(); setUrl('https://github.com/facebook/react'); setError(null); }}>facebook/react</a> or any public repo.
          </p>

          <div className="home__actions">
            <Link to="/compare" className="home__link-action">
              <span className="action-icon">⚔️</span> Compare Repos
            </Link>
            <span className="action-divider"> | </span>
            <Link to="/discover" className="home__link-action">
              <span className="action-icon">🔎</span> Discover Trending
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
