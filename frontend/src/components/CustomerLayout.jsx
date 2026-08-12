import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const CUSTOMER_NAV = [
  { to: '/customer',          label: 'Products',  icon: '🛍️', end: true },
  { to: '/customer/orders',   label: 'My Orders', icon: '📋' },
]

export default function CustomerLayout({ user, onLogout }) {
  return (
    <div className="app-shell">
      <Sidebar navItems={CUSTOMER_NAV} user={user} onLogout={onLogout} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
