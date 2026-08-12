import { useEffect, useMemo, useState } from 'react'
import { adminApi, authApi, customerApi } from './services/inventoryApi'
import { getErrorMessage } from './services/api'
import './App.css'

const emptyLogin = { email: '', phone_number: '' }

function stockClass(status) {
  return (status || 'IN STOCK').toLowerCase().replaceAll(' ', '-')
}

function App() {
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('user') || 'null'))
  const [route, setRoute] = useState(() => window.location.pathname)

  useEffect(() => {
    const target = user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'customer' ? '/customer/dashboard' : '/login'
    if (route !== target && (route === '/' || route === '/login')) {
      window.history.replaceState(null, '', target)
      setRoute(target)
    }
  }, [user, route])

  function loginSuccess(data) {
    sessionStorage.setItem('accessToken', data.access_token)
    sessionStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    const target = data.user.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard'
    window.history.pushState(null, '', target)
    setRoute(target)
  }

  function logout() {
    sessionStorage.clear()
    setUser(null)
    window.history.pushState(null, '', '/login')
    setRoute('/login')
  }

  if (!user) return <LoginPage onLogin={loginSuccess} />
  if (route.startsWith('/admin') && user.role !== 'admin') return <AccessDenied onLogout={logout} />
  if (route.startsWith('/customer') && user.role !== 'customer') return <AccessDenied onLogout={logout} />

  return user.role === 'admin' ? <AdminDashboard user={user} onLogout={logout} /> : <CustomerDashboard user={user} onLogout={logout} />
}

function LoginPage({ onLogin }) {
  const [form, setForm] = useState(emptyLogin)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!form.email || !form.phone_number) {
      setError('Email and phone number are both required.')
      return
    }
    setLoading(true)
    try {
      onLogin(await authApi.login(form))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-shell"><form className="login-panel" onSubmit={submit}><p className="eyebrow">Smart Restock</p><h1>Inventory Access</h1><label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Phone number<input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} /></label>{error && <p className="error">{error}</p>}<button disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button></form></main>
}

function Shell({ title, user, onLogout, children }) {
  return <main className="app-shell"><aside><p className="eyebrow">Smart Restock</p><h1>{title}</h1><div className="user-card"><strong>{user.name || user.email}</strong><span>{user.role}</span></div><button className="secondary" onClick={onLogout}>Logout</button></aside><section className="workspace">{children}</section></main>
}

function AdminDashboard({ user, onLogout }) {
  const [data, setData] = useState({ dashboard: null, products: [], transactions: [], alerts: [] })
  const [filters, setFilters] = useState({ search: '', status: '', sort_by: 'product_name' })
  const [error, setError] = useState('')

  async function load() {
    try {
      const [dashboard, products, transactions, alerts] = await Promise.all([adminApi.dashboard(), adminApi.products(filters), adminApi.transactions(), adminApi.alerts()])
      setData({ dashboard, products, transactions, alerts })
    } catch (err) { setError(getErrorMessage(err)) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => { adminApi.products(filters).then((products) => setData((d) => ({ ...d, products }))).catch((err) => setError(getErrorMessage(err))) }, [filters])
  const cards = data.dashboard || {}

  return <Shell title="Admin Dashboard" user={user} onLogout={onLogout}>{error && <p className="error">{error}</p>}<div className="toolbar"><button onClick={load}>Refresh</button></div><section className="metrics">{['total_products','total_current_stock','low_stock_products','out_of_stock_products','active_alerts','pending_reorder_recommendations'].map((key) => <div className="metric" key={key}><span>{key.replaceAll('_',' ')}</span><strong>{cards[key] ?? 0}</strong></div>)}</section><section><h2>Products / Inventory</h2><div className="filters"><input placeholder="Search products" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All status</option><option>IN STOCK</option><option>LOW STOCK</option><option>CRITICAL</option><option>OUT OF STOCK</option></select><select value={filters.sort_by} onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}><option value="product_name">Name</option><option value="current_stock">Stock</option><option value="minimum_threshold">Threshold</option><option value="expiration_date">Expiration</option></select></div><Table rows={data.products} columns={['product_name','category','unit_price','current_stock','minimum_threshold','safety_stock','reorder_quantity','expiration_date','stock_status']} status /></section><section><h2>Transaction History</h2><Table rows={data.transactions} columns={['transaction_id','transaction_type','quantity_changed','stock_after_transaction','minimum_threshold','created_at','notes']} /></section><section><h2>Active Alerts</h2><Table rows={data.alerts} columns={['alert_type','stock_at_trigger','threshold_at_trigger','status','created_at','sent_at','severity']} statusKey="severity" /></section></Shell>
}

function CustomerDashboard({ user, onLogout }) {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [cart, setCart] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function load() { const [p, o] = await Promise.all([customerApi.products(), customerApi.orders()]); setProducts(p); setOrders(o) }
  useEffect(() => { load().catch((err) => setError(getErrorMessage(err))) }, [])
  const items = useMemo(() => Object.entries(cart).filter(([, quantity]) => quantity > 0).map(([product_id, quantity]) => ({ product_id, quantity })), [cart])
  async function placeOrder() { setError(''); setMessage(''); try { const result = await customerApi.placeOrder(items); setMessage(result.message); setCart({}); await load() } catch (err) { setError(getErrorMessage(err)) } }
  return <Shell title="Customer Dashboard" user={user} onLogout={onLogout}>{error && <p className="error">{error}</p>}{message && <p className="success">{message}</p>}<section><h2>Products</h2><div className="product-grid">{products.map((p) => <article className="product" key={p.product_id}><h3>{p.product_name}</h3><p>{p.category || 'Uncategorized'}</p><strong>{p.unit_price ?? 'N/A'}</strong><span>{p.current_stock} available</span><input type="number" min="0" max={p.current_stock || 0} value={cart[p.product_id] || ''} onChange={(e) => setCart({ ...cart, [p.product_id]: Number(e.target.value) })} /></article>)}</div></section><section><h2>Cart / Current Order</h2><p>{items.length ? `${items.length} product(s) selected` : 'No products selected.'}</p><button disabled={!items.length} onClick={placeOrder}>Place simulated order</button></section><section><h2>My Orders / Transactions</h2><Table rows={orders} columns={['transaction_id','transaction_type','quantity_changed','stock_after_transaction','created_at','notes']} /></section></Shell>
}

function Table({ rows, columns, status, statusKey }) {
  return <div className="table-wrap"><table><thead><tr>{columns.map((c) => <th key={c}>{c.replaceAll('_',' ')}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, i) => <tr key={row.transaction_id || row.product_id || row.alert_id || i}>{columns.map((c) => <td key={c}>{status && c === 'stock_status' ? <span className={`pill ${stockClass(row[c])}`}>{row[c]}</span> : statusKey === c ? <span className={`pill ${row[c]}`}>{row[c]}</span> : String(row[c] ?? '')}</td>)}</tr>) : <tr><td colSpan={columns.length}>No records found.</td></tr>}</tbody></table></div>
}

function AccessDenied({ onLogout }) { return <main className="login-shell"><div className="login-panel"><h1>Access denied</h1><p>This account cannot access that dashboard.</p><button onClick={onLogout}>Back to login</button></div></main> }

export default App
