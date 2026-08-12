import { useEffect, useState } from 'react'
import { adminApi } from '../services/inventoryApi'
import { getErrorMessage } from '../services/api'
import StatCard from '../components/StatCard'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

function formatTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

const RECENT_TX_COLUMNS = [
  { key: 'transaction_type', label: 'Type', render: (v) => <StatusBadge value={v} /> },
  {
    key: 'product',
    label: 'Product',
    render: (_, row) => row.product?.product_name || row.products?.product_name || '—',
  },
  { key: 'quantity_changed', label: 'Qty' },
  { key: 'stock_after_transaction', label: 'Stock After' },
  { key: 'created_at', label: 'Time', render: (v) => <span className="table-cell-secondary">{formatTime(v)}</span> },
]

const STATS_CONFIG = [
  { key: 'total_products',                  label: 'Total Products',      icon: '📦', color: '#2d9f5e' },
  { key: 'total_current_stock',             label: 'Current Stock',       icon: '🏷️', color: '#1a56db' },
  { key: 'low_stock_products',              label: 'Low Stock',           icon: '⚠️', color: '#d97706' },
  { key: 'out_of_stock_products',           label: 'Out of Stock',        icon: '🚫', color: '#b71c1c' },
  { key: 'active_alerts',                   label: 'Active Alerts',       icon: '🔔', color: '#bf4e00' },
  { key: 'pending_reorder_recommendations', label: 'Pending Reorders',    icon: '🔄', color: '#7c3aed' },
]

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      setData(await adminApi.dashboard())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <LoadingState message="Loading dashboard…" />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your inventory and recent activity.</p>
      </div>

      <div className="stats-grid">
        {STATS_CONFIG.map((s) => (
          <StatCard
            key={s.key}
            icon={s.icon}
            label={s.label}
            value={data?.[s.key] ?? 0}
            color={s.color}
          />
        ))}
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Recent Transactions</h2>
          <button className="btn btn-secondary btn-sm" onClick={load}>Refresh</button>
        </div>
        <DataTable
          columns={RECENT_TX_COLUMNS}
          rows={data?.recent_transactions || []}
          rowKey={(row, i) => row.transaction_id || i}
          emptyIcon="🔄"
          emptyTitle="No recent transactions"
          emptyDescription="Transaction activity will appear here."
        />
      </div>
    </>
  )
}
