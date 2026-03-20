import './CodeRiskCard.css';

const SeverityBadge = ({ severity }) => {
  const s = severity?.toLowerCase() || 'medium';
  return (
    <span className={`risk-badge risk-badge--${s}`}>
      {severity}
    </span>
  );
};

export default function CodeRiskCard({ risks }) {
  if (!risks || risks.length === 0) {
    return (
      <div className="risk-card risk-card--empty">
        <p>No significant code risks detected for this repository. Great job!</p>
      </div>
    );
  }

  return (
    <div className="risk-grid">
      {risks.map((risk, i) => (
        <div key={i} className="risk-item">
          <div className="risk-header">
            <h3 className="risk-title">{risk.title}</h3>
            <SeverityBadge severity={risk.severity} />
          </div>
          <div className="risk-meta">
            <span className="risk-category">{risk.category}</span>
          </div>
          <p className="risk-description">{risk.description}</p>
        </div>
      ))}
    </div>
  );
}
