const BADGE_MAP = {
  'IN STOCK':     'badge-in-stock',
  'LOW STOCK':    'badge-low-stock',
  'CRITICAL':     'badge-critical',
  'OUT OF STOCK': 'badge-out-of-stock',
  // Severity / alert types
  'info':         'badge-info',
  'warning':      'badge-warning',
  'critical':     'badge-critical',
  // Generic
  'resolved':     'badge-resolved',
  'active':       'badge-danger',
}

export default function StatusBadge({ value }) {
  if (!value) return null
  const cls = BADGE_MAP[value] || 'badge-info'
  return <span className={`badge ${cls}`}>{value}</span>
}
