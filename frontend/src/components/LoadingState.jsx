export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p className="loading-text">{message}</p>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div style={{ padding: 'var(--sp-4)' }}>
      {Array.from({ length: rows }, (_, i) => (
        <div className="skeleton-row" key={i} />
      ))}
    </div>
  )
}
