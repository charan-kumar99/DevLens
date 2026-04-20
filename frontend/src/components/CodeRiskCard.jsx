import './CodeRiskCard.css';

const SeverityBadge = ({ severity }) => {
  const s = severity?.toLowerCase() || 'medium';
  return (
    <span className={`risk-badge risk-badge--${s}`} aria-label={`Severity: ${severity}`}>
      {severity}
    </span>
  );
};

export default function CodeRiskCard({ risks }) {
  if (!risks || risks.length === 0) {
    return (
      <div className="risk-card risk-card--empty" role="status">
        <p>✅ No significant code risks detected. Great job maintaining this repository!</p>
      </div>
    );
  }

  const critical = risks.filter(r => r.severity?.toLowerCase() === 'critical' || r.severity?.toLowerCase() === 'high');
  const medium  = risks.filter(r => r.severity?.toLowerCase() === 'medium');
  const low     = risks.filter(r => r.severity?.toLowerCase() === 'low');

  return (
    <div>
      {/* Risk Summary Overview */}
      {risks.length > 2 && (
        <div className="risk-summary" aria-label="Risk summary counts">
          <div className="risk-summary__item risk-summary__item--critical">
            <div className="risk-summary__count">{critical.length}</div>
            <div className="risk-summary__label">Critical</div>
          </div>
          <div className="risk-summary__item risk-summary__item--medium">
            <div className="risk-summary__count">{medium.length}</div>
            <div className="risk-summary__label">Medium</div>
          </div>
          <div className="risk-summary__item risk-summary__item--low">
            <div className="risk-summary__count">{low.length}</div>
            <div className="risk-summary__label">Low</div>
          </div>
        </div>
      )}

      {/* Risk List */}
      <div className="risk-grid" role="list">
        {risks.map((risk, i) => (
          <div
            key={i}
            className="risk-item"
            data-severity={risk.severity?.toLowerCase() || 'medium'}
            style={{ animationDelay: `${i * 60}ms` }}
            role="listitem"
          >
            <div className="risk-header">
              <h3 className="risk-title">{risk.title}</h3>
              <SeverityBadge severity={risk.severity} />
            </div>
            {risk.category && (
              <div className="risk-meta">
                <span className="risk-category">{risk.category}</span>
              </div>
            )}
            <p className="risk-description">{risk.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
