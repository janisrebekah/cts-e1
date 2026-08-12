import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './App.css'

// Layouts
import AdminLayout from './components/AdminLayout'
import CustomerLayout from './components/CustomerLayout'

// Pages
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import AdminProducts from './pages/AdminProducts'
import AdminTransactions from './pages/AdminTransactions'
import AdminAlerts from './pages/AdminAlerts'
import CustomerProducts from './pages/CustomerProducts'
import CustomerOrders from './pages/CustomerOrders'

function App() {
  const [user, setUser] = useState(() =>
    JSON.parse(sessionStorage.getItem('user') || 'null')
  )
  const navigate = useNavigate()

  function handleLogin(data) {
    sessionStorage.setItem('accessToken', data.access_token)
    sessionStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    const target = data.user.role === 'admin' ? '/admin' : '/customer'
    navigate(target, { replace: true })
  }

  function handleLogout() {
    sessionStorage.clear()
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          user
            ? <Navigate to={user.role === 'admin' ? '/admin' : '/customer'} replace />
            : <Login onLogin={handleLogin} />
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          !user ? <Navigate to="/login" replace /> :
          user.role !== 'admin' ? <Navigate to="/customer" replace /> :
          <AdminLayout user={user} onLogout={handleLogout} />
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="alerts" element={<AdminAlerts />} />
      </Route>

      {/* Customer routes */}
      <Route
        path="/customer"
        element={
          !user ? <Navigate to="/login" replace /> :
          user.role !== 'customer' ? <Navigate to="/admin" replace /> :
          <CustomerLayout user={user} onLogout={handleLogout} />
        }
      >
        <Route index element={<CustomerProducts />} />
        <Route path="products" element={<CustomerProducts />} />
        <Route path="orders" element={<CustomerOrders />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/customer') : '/login'} replace />} />
    </Routes>
  )
}

export default App
