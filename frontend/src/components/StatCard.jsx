export default function StatCard({ icon, label, value, color }) {
  const iconStyle = color
    ? { background: `${color}18`, color }
    : { background: 'var(--accent-light)', color: 'var(--accent)' }

  return (
    <div className="stat-card">
      {icon && (
        <div className="stat-card-icon" style={iconStyle}>
          {icon}
        </div>
      )}
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{value ?? 0}</span>
    </div>
  )
}
