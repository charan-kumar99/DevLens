import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { discoverRepos } from '../utils/api';
import Footer from '../components/Footer';
import './Discover.css';

const TOPICS = [
  { id: 'trending', label: '🔥 Trending', query: 'stars:>1000' },
  { id: 'ai', label: '🧠 AI & ML', query: 'topic:machine-learning' },
  { id: 'react', label: '⚛️ React', query: 'topic:react' },
  { id: 'javascript', label: '🟨 JavaScript', query: 'topic:javascript' },
  { id: 'python', label: '🐍 Python', query: 'topic:python' },
  { id: 'rust', label: '🦀 Rust', query: 'topic:rust' },
];

export default function Discover() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRepos();
  }, [topic]);

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await discoverRepos(topic.query);
      setRepos(data);
    } catch (err) {
      setError('Failed to fetch trending repos. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = (owner, repo) => {
    navigate('/', { state: { url: `https://github.com/${owner}/${repo}` } });
  };

  return (
    <div className="discover">
      <header className="discover__header">
        <div className="discover__header-top">
          <Link to="/" className="discover__back">← Back to Home</Link>
          <h1 className="discover__title">Discover 🔎</h1>
        </div>
        <p className="discover__subtitle">Discover top-rated repositories and analyze them instantly.</p>
        
        <div className="discover__tabs">
          {TOPICS.map(t => (
            <button
              key={t.id}
              className={`discover__tab ${topic.id === t.id ? 'active' : ''}`}
              onClick={() => setTopic(t)}
              aria-label={`Filter by ${t.label}`}
              aria-pressed={topic.id === t.id}
            >
              {t.label}
              {topic.id === t.id && (
                <motion.div layoutId="activeTab" className="active-tab-indicator" />
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="discover__main">
        {loading ? (
          <div className="discover__loading">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="repo-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="discover__error">{error}</div>
        ) : (
          <motion.div 
            className="discover__grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AnimatePresence mode="popLayout">
              {repos.map((repo, i) => (
                <motion.div
                  key={`${repo.owner}/${repo.repo}`}
                  className="discover__card"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
                >
                  <div className="discover__card-top">
                    <span className="repo-owner">{repo.owner}</span>
                    <h3 className="repo-name">{repo.repo}</h3>
                  </div>
                  <p className="repo-desc text-clamp">{repo.description || 'No description provided.'}</p>
                  <div className="discover__card-footer">
                    <div className="repo-meta">
                      <span className="repo-stars">★ {repo.stars.toLocaleString()}</span>
                      {repo.language && <span className="repo-lang">{repo.language}</span>}
                    </div>
                    <button 
                      className="discover__analyze-btn"
                      onClick={() => handleAnalyze(repo.owner, repo.repo)}
                      aria-label={`Analyze ${repo.owner}/${repo.repo}`}
                    >
                      Analyze
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}
