import { Link, useNavigate } from 'react-router-dom';
import { generatePDFReport } from '../utils/pdfExport';
import { clearCache } from '../utils/api';
import './Sidebar.css';

const sections = [
  { id: 'overview',     label: 'Overview',          icon: '⬛' },
  { id: 'commits',      label: 'Commit Activity',    icon: '📈' },
  { id: 'contributors', label: 'Contributors',        icon: '👥' },
  { id: 'readme',       label: 'README Score',        icon: '📄' },
  { id: 'issues',       label: 'Issues & PRs',        icon: '🔀' },
  { id: 'ai',           label: 'AI Summary',          icon: '✨', isAI: true },
  { id: 'risks',        label: 'Code Risks',          icon: '🛡', isAI: true },
  { id: 'readme-gen',   label: 'README Generator',    icon: '🪄', isAI: true },
];

export default function Sidebar({ current, onNavigate, repoLabel, result }) {
  const navigate = useNavigate();

  // Extract just the repo name from "owner/repo" format
  const repoName = repoLabel ? repoLabel.split('/')[1] || repoLabel : '';

  const handleRefresh = async () => {
    if (result?.owner && result?.repo) {
      try {
        await clearCache(result.owner, result.repo);
        navigate('/', { state: { url: `https://github.com/${result.owner}/${result.repo}` } });
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
    <aside className="sidebar" aria-label="Dashboard navigation">
      {/* Brand Header */}
      <Link to="/" className="sidebar__header" aria-label="DevLens Home">
        <img src="/devlens-logo.svg" alt="" className="sidebar__logo" aria-hidden="true" />
        <span className="sidebar__brand">DevLens</span>
      </Link>

      {/* Repo Context */}
      {repoLabel && (
        <div className="sidebar__repo">
          <span className="sidebar__repo-label-prefix">Repository</span>
          <span className="sidebar__repo-label" title={repoLabel}>{repoLabel}</span>
        </div>
      )}

      {/* Analyze another CTA */}
      <button
        type="button"
        className="sidebar__new-btn"
        onClick={() => navigate('/')}
        aria-label="Analyze another repository"
        id="analyze-another-btn"
      >
        Analyze another repo
      </button>

      {/* Navigation */}
      <nav className="sidebar__nav" aria-label="Dashboard sections">
        {sections.map(({ id, label, icon, isAI }) => (
          <button
            key={id}
            type="button"
            className={[
              'sidebar__link',
              current === id && 'sidebar__link--active',
              isAI && 'sidebar__link--ai',
            ].filter(Boolean).join(' ')}
            onClick={() => onNavigate(id)}
            aria-label={`Navigate to ${label} section`}
            aria-current={current === id ? 'page' : undefined}
            id={`nav-${id}`}
          >
            <span className="sidebar__nav-icon" aria-hidden="true">{icon}</span>
            {label}
          </button>
        ))}

        <div className="sidebar__divider" role="separator" aria-hidden="true" />

        <Link
          to="/compare"
          state={{ result }}
          className="sidebar__link sidebar__link--compare"
          aria-label="Go to Compare Mode"
          id="nav-compare"
        >
          <span className="sidebar__nav-icon" aria-hidden="true">⚔️</span>
          Compare Mode
        </Link>
      </nav>

      {/* Footer */}
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
          id="export-report-btn"
        >
          📥 Export Report
        </button>
      </div>
    </aside>
  );
}
