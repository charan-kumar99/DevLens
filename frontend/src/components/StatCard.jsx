import './StatCard.css';

export default function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      {icon && <span className="stat-card__icon" aria-hidden="true">{icon}</span>}
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  );
}
