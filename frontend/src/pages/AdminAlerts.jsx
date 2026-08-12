import { useEffect, useState } from 'react'
import { adminApi } from '../services/inventoryApi'
import { getErrorMessage } from '../services/api'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'

function formatTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resolvingId, setResolvingId] = useState(null)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  async function load() {
    setLoading(true)
    setError('')
    try {
      setAlerts(await adminApi.alerts())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleResolve(alertId) {
    setResolvingId(alertId)
    setFeedback({ type: '', message: '' })
    try {
      await adminApi.resolveAlert(alertId)
      setFeedback({ type: 'success', message: 'Alert resolved successfully.' })
      // Remove the resolved alert from the list immediately
      setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId))
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setResolvingId(null)
    }
  }

  const columns = [
    {
      key: 'product',
      label: 'Product',
      render: (_, row) => row.product?.product_name || row.products?.product_name || '—',
    },
    {
      key: 'alert_type',
      label: 'Alert Type',
      render: (v) => <StatusBadge value={v} />,
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (v) => <StatusBadge value={v} />,
    },
    { key: 'stock_at_trigger', label: 'Stock at Trigger' },
    { key: 'threshold_at_trigger', label: 'Threshold' },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <StatusBadge value={v} />,
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (v) => <span className="table-cell-secondary">{formatTime(v)}</span>,
    },
    {
      key: 'alert_id',
      label: 'Action',
      render: (_, row) => (
        <button
          className="btn btn-primary btn-sm"
          disabled={resolvingId === row.alert_id}
          onClick={() => handleResolve(row.alert_id)}
        >
          {resolvingId === row.alert_id ? 'Resolving…' : 'Resolve'}
        </button>
      ),
    },
  ]

  return (
    <>
      <div className="page-header">
        <h1>Alerts</h1>
        <p>Active inventory alerts requiring attention.</p>
      </div>

      {feedback.message && (
        <div className={`alert-banner alert-${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={alerts}
        rowKey={(row) => row.alert_id}
        loading={loading}
        error={error}
        onRetry={load}
        emptyIcon="✅"
        emptyTitle="No active alerts"
        emptyDescription="Your inventory looks healthy. Alerts will appear here when stock levels need attention."
      />
    </>
  )
}
