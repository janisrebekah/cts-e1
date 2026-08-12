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

const COLUMNS = [
  {
    key: 'transaction_id',
    label: 'ID',
    render: (v) => <span className="table-cell-mono">{v ? String(v).slice(0, 8) : '—'}</span>,
  },
  {
    key: 'product',
    label: 'Product',
    render: (_, row) => row.product?.product_name || '—',
  },
  {
    key: 'transaction_type',
    label: 'Type',
    render: (v) => <StatusBadge value={v} />,
  },
  {
    key: 'quantity_changed',
    label: 'Qty Changed',
    render: (v) => {
      if (v == null) return '—'
      const isNeg = v < 0
      return (
        <span style={{ color: isNeg ? 'var(--status-danger-text)' : 'var(--status-healthy-text)', fontWeight: 600 }}>
          {isNeg ? v : `+${v}`}
        </span>
      )
    },
  },
  { key: 'stock_after_transaction', label: 'Stock After' },
  {
    key: 'user',
    label: 'User',
    render: (_, row) => row.user?.name || row.user?.email || '—',
  },
  {
    key: 'notes',
    label: 'Notes',
    render: (v) => <span className="table-cell-secondary">{v || '—'}</span>,
  },
  {
    key: 'created_at',
    label: 'Date',
    render: (v) => <span className="table-cell-secondary">{formatTime(v)}</span>,
  },
]

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      setTransactions(await adminApi.transactions())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <div className="page-header">
        <h1>Transactions</h1>
        <p>Complete history of inventory movements.</p>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={transactions}
        rowKey={(row) => row.transaction_id}
        loading={loading}
        error={error}
        onRetry={load}
        emptyIcon="🔄"
        emptyTitle="No transactions yet"
        emptyDescription="Inventory transactions will appear here as orders are placed and stock changes."
      />
    </>
  )
}
