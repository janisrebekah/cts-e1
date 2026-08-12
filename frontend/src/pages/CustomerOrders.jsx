import { useEffect, useState } from 'react'
import { customerApi } from '../services/inventoryApi'
import { getErrorMessage } from '../services/api'
import DataTable from '../components/DataTable'

function formatTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function formatPrice(value) {
  if (value == null) return '—'
  return `$${Number(value).toFixed(2)}`
}

const COLUMNS = [
  {
    key: 'transaction_id',
    label: 'Order ID',
    render: (v) => <span className="table-cell-mono">{v ? String(v).slice(0, 8) : '—'}</span>,
  },
  {
    key: 'products',
    label: 'Product',
    render: (_, row) => row.products?.product_name || '—',
  },
  {
    key: 'products_category',
    label: 'Category',
    render: (_, row) => <span className="table-cell-secondary">{row.products?.category || '—'}</span>,
  },
  {
    key: 'quantity_changed',
    label: 'Quantity',
    render: (v) => (v != null ? Math.abs(v) : '—'),
  },
  {
    key: 'products_price',
    label: 'Unit Price',
    render: (_, row) => formatPrice(row.products?.unit_price),
  },
  {
    key: 'stock_after_transaction',
    label: 'Stock After',
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

export default function CustomerOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      setOrders(await customerApi.orders())
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
        <h1>My Orders</h1>
        <p>Your order history and transaction details.</p>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={orders}
        rowKey={(row) => row.transaction_id}
        loading={loading}
        error={error}
        onRetry={load}
        emptyIcon="📋"
        emptyTitle="No orders yet"
        emptyDescription="Your orders will appear here after you place your first order."
      />
    </>
  )
}
