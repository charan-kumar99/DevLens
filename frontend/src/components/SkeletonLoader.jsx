import './SkeletonLoader.css';

export default function SkeletonLoader({ lines = 1, className = '' }) {
  return (
    <div className={`skeleton ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton__line" />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card__line skeleton-card__line--short" />
      <div className="skeleton-card__line skeleton-card__line--long" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="skeleton-chart">
      <div className="skeleton-chart__bar" style={{ height: '40%' }} />
      <div className="skeleton-chart__bar" style={{ height: '70%' }} />
      <div className="skeleton-chart__bar" style={{ height: '55%' }} />
      <div className="skeleton-chart__bar" style={{ height: '90%' }} />
      <div className="skeleton-chart__bar" style={{ height: '60%' }} />
    </div>
  );
}
