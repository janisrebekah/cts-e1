import LoadingState, { TableSkeleton } from './LoadingState'
import EmptyState from './EmptyState'
import ErrorState from './ErrorState'

/**
 * Reusable data table with built-in loading, empty, and error states.
 *
 * columns: [{ key, label, render? }]
 * rows: array of data objects
 * rowKey: function(row, index) => unique key
 */
export default function DataTable({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}) {
  if (loading) {
    return (
      <div className="table-container">
        <TableSkeleton rows={6} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="table-container">
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="table-container">
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle || 'No records found'}
          description={emptyDescription}
        />
      </div>
    )
  }

  return (
    <div className="table-container">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={rowKey ? rowKey(row, index) : index}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
