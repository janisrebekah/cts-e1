import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'

const ADMIN_NAV = [
  { to: '/admin',              label: 'Dashboard',    icon: '📊', end: true },
  { to: '/admin/products',     label: 'Products',     icon: '📦' },
  { to: '/admin/transactions', label: 'Transactions', icon: '🔄' },
  { to: '/admin/alerts',       label: 'Alerts',       icon: '🔔' },
]

export default function AdminLayout({ user, onLogout }) {
  return (
    <div className="app-shell">
      <Sidebar navItems={ADMIN_NAV} user={user} onLogout={onLogout} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
