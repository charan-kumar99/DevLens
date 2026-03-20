import './CompareSkeletonLoader.css';

export default function CompareSkeletonLoader() {
  return (
    <div className="compare-skeleton">
      {/* Loading Header */}
      <div className="compare-skeleton__header">
        <div className="loading-icon">
          <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: '#58a6ff', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: '#bc8cff', stopOpacity: 1}} />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill="url(#grad1)" opacity="0.15"/>
            <circle cx="32" cy="32" r="22" stroke="url(#grad1)" strokeWidth="3" fill="none"/>
            <circle cx="32" cy="32" r="14" stroke="url(#grad1)" strokeWidth="2" fill="none" opacity="0.6"/>
            <circle cx="32" cy="32" r="4" fill="url(#grad1)"/>
            <path d="M 20 20 Q 22 18, 26 20" stroke="url(#grad1)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8"/>
            <path d="M 24 16 Q 25 15, 28 16" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
            <path d="M 12 26 L 8 32 L 12 38" stroke="url(#grad1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M 52 26 L 56 32 L 52 38" stroke="url(#grad1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
        <h2 className="loading-title">Comparing Repositories</h2>
        <p className="loading-subtitle">Analyzing metrics and generating AI insights...</p>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* AI Verdict Skeleton */}
      <div className="compare-skeleton__verdict">
        <div className="skeleton-badge"></div>
        <div className="skeleton-line skeleton-line--full"></div>
        <div className="skeleton-line skeleton-line--full"></div>
        <div className="skeleton-line skeleton-line--80"></div>
      </div>

      {/* Two Column Grid */}
      <div className="compare-skeleton__grid">
        {/* Left Column */}
        <div className="compare-skeleton__col">
          <div className="skeleton-title"></div>
          <div className="skeleton-description"></div>
          <div className="skeleton-description skeleton-description--short"></div>
          
          <div className="compare-skeleton__stats">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-stat-card">
                <div className="skeleton-stat-label"></div>
                <div className="skeleton-stat-value"></div>
              </div>
            ))}
          </div>
          
          <div className="skeleton-lang"></div>
        </div>

        {/* Right Column */}
        <div className="compare-skeleton__col">
          <div className="skeleton-title"></div>
          <div className="skeleton-description"></div>
          <div className="skeleton-description skeleton-description--short"></div>
          
          <div className="compare-skeleton__stats">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-stat-card">
                <div className="skeleton-stat-label"></div>
                <div className="skeleton-stat-value"></div>
              </div>
            ))}
          </div>
          
          <div className="skeleton-lang"></div>
        </div>
      </div>
    </div>
  );
}
