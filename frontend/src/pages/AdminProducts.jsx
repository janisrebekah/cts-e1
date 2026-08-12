import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '../services/inventoryApi'
import { getErrorMessage } from '../services/api'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatPrice(value) {
  if (value == null) return '—'
  return `$${Number(value).toFixed(2)}`
}

const COLUMNS = [
  { key: 'product_name', label: 'Product' },
  { key: 'category', label: 'Category', render: (v) => v || '—' },
  { key: 'unit_price', label: 'Price', render: (v) => formatPrice(v) },
  { key: 'current_stock', label: 'Stock' },
  { key: 'minimum_threshold', label: 'Min Threshold' },
  { key: 'safety_stock', label: 'Safety Stock' },
  { key: 'reorder_quantity', label: 'Reorder Qty' },
  { key: 'expiration_date', label: 'Expires', render: (v) => <span className="table-cell-secondary">{formatDate(v)}</span> },
  { key: 'stock_status', label: 'Status', render: (v) => <StatusBadge value={v} /> },
]

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ search: '', status: '', sort_by: 'product_name' })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.products(filters)
      setProducts(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  return (
    <>
      <div className="page-header">
        <h1>Products</h1>
        <p>Manage and monitor your product inventory.</p>
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search products…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <select
          className="select"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All statuses</option>
          <option value="IN STOCK">In Stock</option>
          <option value="LOW STOCK">Low Stock</option>
          <option value="CRITICAL">Critical</option>
          <option value="OUT OF STOCK">Out of Stock</option>
        </select>
        <select
          className="select"
          value={filters.sort_by}
          onChange={(e) => setFilters((f) => ({ ...f, sort_by: e.target.value }))}
        >
          <option value="product_name">Sort by Name</option>
          <option value="current_stock">Sort by Stock</option>
          <option value="minimum_threshold">Sort by Threshold</option>
          <option value="expiration_date">Sort by Expiration</option>
        </select>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={products}
        rowKey={(row) => row.product_id}
        loading={loading}
        error={error}
        onRetry={load}
        emptyIcon="📦"
        emptyTitle="No products found"
        emptyDescription="Try adjusting your search or filter criteria."
      />
    </>
  )
}
