import { useState } from 'react'
import { authApi } from '../services/inventoryApi'
import { getErrorMessage } from '../services/api'

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', phone_number: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.email.trim() || !form.phone_number.trim()) {
      setError('Email and phone number are both required.')
      return
    }

    setLoading(true)
    try {
      const data = await authApi.login(form)
      onLogin(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <div className="login-brand-icon">📦</div>
          <div>
            <div className="login-eyebrow">Smart Restock</div>
          </div>
        </div>

        <h1 className="login-title">Sign in to your account</h1>

        <div className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              className="input"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-phone">Phone number</label>
            <input
              id="login-phone"
              className="input"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              autoComplete="tel"
              required
            />
          </div>

          {error && <div className="alert-banner alert-error">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </main>
  )
}
