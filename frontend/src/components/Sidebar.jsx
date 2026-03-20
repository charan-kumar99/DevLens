import { Link, useNavigate } from 'react-router-dom';
import { generatePDFReport } from '../utils/pdfExport';
import { clearCache } from '../utils/api';
import './Sidebar.css';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'commits', label: 'Commit Activity' },
  { id: 'contributors', label: 'Contributors' },
  { id: 'readme', label: 'README Score' },
  { id: 'issues', label: 'Issues & PRs' },
  { id: 'ai', label: 'AI Summary' },
  { id: 'risks', label: 'Code Risks' },
  { id: 'readme-gen', label: 'README Generator' },
];

export default function Sidebar({ current, onNavigate, repoLabel, result }) {
  const navigate = useNavigate();
  
  // Extract just the repo name from "owner/repo" format
  const repoName = repoLabel ? repoLabel.split('/')[1] || repoLabel : '';
  
  const handleRefresh = async () => {
    if (result?.owner && result?.repo) {
      try {
        await clearCache(result.owner, result.repo);
        // Navigate back to home with the URL to re-analyze
        navigate('/', { state: { url: `https://github.com/${result.owner}/${result.repo}` } });
        // Trigger form submission automatically
        setTimeout(() => {
          const form = document.querySelector('.home__form');
          if (form) form.requestSubmit();
        }, 100);
      } catch (err) {
        // Silently handle cache clear errors
      }
    }
  };
  
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <img src="/devlens-logo.svg" alt="DevLens" className="sidebar__logo" />
        <span className="sidebar__brand">DevLens</span>
      </div>
      {repoName && (
        <div className="sidebar__repo">
          <span className="sidebar__repo-label">{repoName}</span>
        </div>
      )}
      <button
        type="button"
        className="sidebar__new-btn"
        onClick={() => navigate('/')}
        aria-label="Analyze another repository"
      >
        + Analyze another repo
      </button>
      <nav className="sidebar__nav" aria-label="Dashboard sections">
        {sections.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`sidebar__link ${current === id ? 'sidebar__link--active' : ''}`}
            onClick={() => onNavigate(id)}
            aria-label={`Navigate to ${label} section`}
            aria-current={current === id ? 'page' : undefined}
          >
            {label}
          </button>
        ))}
        <Link 
          to="/compare" 
          state={{ result }} 
          className="sidebar__link sidebar__link--compare"
          aria-label="Go to Compare Mode"
        >
          Compare Mode
        </Link>
      </nav>
      
      <div className="sidebar__footer">
        <button 
          className="sidebar__export-btn"
          onClick={async () => {
            try {
              await generatePDFReport(result);
            } catch (error) {
              alert('Failed to generate PDF: ' + error.message);
            }
          }}
          title="Export detailed PDF report"
          aria-label="Export analysis report as PDF"
        >
          📥 Export Report
        </button>
      </div>
    </aside>
  );
}
