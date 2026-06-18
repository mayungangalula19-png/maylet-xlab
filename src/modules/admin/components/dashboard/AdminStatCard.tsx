import { Link } from 'react-router-dom';

interface AdminStatCardProps {
  icon: string;
  label: string;
  value: number | string;
  hint?: string;
  color: string;
  link: string;
  suffix?: string;
}

export function AdminStatCard({
  icon,
  label,
  value,
  hint,
  color,
  link,
  suffix = '',
}: AdminStatCardProps) {
  return (
    <Link to={link} className="admin-stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="admin-stat-icon" style={{ background: `${color}20` }}>
        {icon}
      </div>
      <div className="admin-stat-content">
        <div className="admin-stat-value">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix}
        </div>
        <div className="admin-stat-label">{label}</div>
        {hint ? <div className="admin-stat-hint">{hint}</div> : null}
      </div>
    </Link>
  );
}
