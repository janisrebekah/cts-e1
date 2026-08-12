import { api } from './api'

export const authApi = {
  login: (payload) => api.post('/api/auth/login', payload).then((res) => res.data),
}

export const adminApi = {
  dashboard: () => api.get('/api/admin/dashboard').then((res) => res.data),
  products: (params) => api.get('/api/admin/products', { params }).then((res) => res.data),
  transactions: () => api.get('/api/admin/transactions').then((res) => res.data),
  alerts: () => api.get('/api/admin/alerts').then((res) => res.data),
  resolveAlert: (alertId) => api.put(`/api/admin/alerts/${alertId}/resolve`).then((res) => res.data),
}

export const customerApi = {
  products: () => api.get('/api/customer/products').then((res) => res.data),
  orders: () => api.get('/api/customer/orders').then((res) => res.data),
  placeOrder: (items) => api.post('/api/customer/orders', { items }).then((res) => res.data),
}
