import { useEffect, useState } from 'react'
import { customerApi } from '../services/inventoryApi'
import { getErrorMessage } from '../services/api'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

function formatPrice(value) {
  if (value == null) return null
  return `$${Number(value).toFixed(2)}`
}

export default function CustomerProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantities, setQuantities] = useState({})
  const [orderingId, setOrderingId] = useState(null)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  async function load() {
    setLoading(true)
    setError('')
    try {
      setProducts(await customerApi.products())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function setQty(productId, value) {
    setQuantities((prev) => ({ ...prev, [productId]: value }))
  }

  function increment(productId, max) {
    setQuantities((prev) => {
      const current = prev[productId] || 0
      return { ...prev, [productId]: Math.min(current + 1, max) }
    })
  }

  function decrement(productId) {
    setQuantities((prev) => {
      const current = prev[productId] || 0
      return { ...prev, [productId]: Math.max(current - 1, 0) }
    })
  }

  async function placeOrder(productId) {
    const qty = quantities[productId] || 0
    if (qty <= 0) return

    setOrderingId(productId)
    setFeedback({ type: '', message: '' })
    try {
      const result = await customerApi.placeOrder([{ product_id: productId, quantity: qty }])
      setFeedback({ type: 'success', message: result.message || 'Order placed successfully!' })
      setQuantities((prev) => ({ ...prev, [productId]: 0 }))
      // Refresh products to get updated stock
      await load()
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err) })
    } finally {
      setOrderingId(null)
    }
  }

  if (loading && products.length === 0) return <LoadingState message="Loading products…" />
  if (error && products.length === 0) return <ErrorState message={error} onRetry={load} />

  return (
    <>
      <div className="page-header">
        <h1>Products</h1>
        <p>Browse available products and place orders.</p>
      </div>

      {feedback.message && (
        <div className={`alert-banner alert-${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title="No products available"
          description="Check back later for available inventory."
        />
      ) : (
        <div className="product-grid">
          {products.map((p) => {
            const qty = quantities[p.product_id] || 0
            const stock = p.current_stock || 0
            const isOrdering = orderingId === p.product_id
            const price = formatPrice(p.unit_price)

            return (
              <div className="product-card" key={p.product_id}>
                <div className="product-card-header">
                  <div>
                    <div className="product-card-name">{p.product_name}</div>
                    <div className="product-card-category">{p.category || 'Uncategorized'}</div>
                  </div>
                  {price && <div className="product-card-price">{price}</div>}
                </div>

                <div className="product-card-stock">
                  {stock > 0
                    ? `${stock} in stock`
                    : 'Out of stock'
                  }
                </div>

                <div className="product-card-footer">
                  <div className="qty-control">
                    <button
                      onClick={() => decrement(p.product_id)}
                      disabled={qty <= 0 || isOrdering}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={stock}
                      value={qty}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(Number(e.target.value) || 0, stock))
                        setQty(p.product_id, val)
                      }}
                      disabled={isOrdering}
                      aria-label="Quantity"
                    />
                    <button
                      onClick={() => increment(p.product_id, stock)}
                      disabled={qty >= stock || isOrdering}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={qty <= 0 || isOrdering || stock <= 0}
                    onClick={() => placeOrder(p.product_id)}
                  >
                    {isOrdering ? 'Ordering…' : 'Order'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
