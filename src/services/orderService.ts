import type { OrderStatus } from '@/models'
import { getDb } from '@/mocks/store'
import { delay } from './delay'

export interface OrderListParams {
  search?: string
  salesId?: string
  status?: OrderStatus | 'all'
  from?: string
  to?: string
}

export const orderService = {
  async list(params: OrderListParams = {}) {
    await delay()
    const db = getDb()
    return db.orders
      .filter((order) => {
        if (params.salesId && params.salesId !== 'all' && order.salesId !== params.salesId) return false
        if (params.status && params.status !== 'all' && order.status !== params.status) return false
        if (params.from && order.createdAt.slice(0, 10) < params.from) return false
        if (params.to && order.createdAt.slice(0, 10) > params.to) return false
        if (params.search) {
          const lead = db.leads.find((item) => item.id === order.customerId)
          const haystack = `${order.code} ${lead?.name ?? ''} ${lead?.company ?? ''} ${order.origin} ${order.destination}`.toLowerCase()
          if (!haystack.includes(params.search.trim().toLowerCase())) return false
        }
        return true
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async getDetail(id: string) {
    await delay()
    const db = getDb()
    const order = db.orders.find((item) => item.id === id)
    if (!order) return null
    const lead = db.leads.find((item) => item.id === order.customerId) ?? null
    return {
      order,
      lead,
      sales: db.users.find((user) => user.id === order.salesId) ?? null,
      activities: db.activities
        .filter((activity) => activity.customerId === order.customerId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      documents: db.documents.filter((document) => document.customerId === order.customerId),
    }
  },
}
