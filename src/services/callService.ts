import type { CallDirection, CallResult, CallStatus } from '@/models'
import { findUser, getDb, nextId, updateDb } from '@/mocks/store'
import { delay } from './delay'

export interface CallListParams {
  search?: string
  salesId?: string
  direction?: CallDirection | 'all'
  result?: CallResult | 'all'
  from?: string
  to?: string
}

export interface CreateCallInput {
  customerId: string
  salesId: string
  phone: string
  direction: CallDirection
  durationSeconds: number
  status: CallStatus
  result: CallResult
}

export const callService = {
  async list(params: CallListParams = {}) {
    await delay()
    const db = getDb()
    return db.calls
      .filter((call) => {
        if (params.salesId && params.salesId !== 'all' && call.salesId !== params.salesId) return false
        if (params.direction && params.direction !== 'all' && call.direction !== params.direction) return false
        if (params.result && params.result !== 'all' && call.result !== params.result) return false
        if (params.from && call.startedAt.slice(0, 10) < params.from) return false
        if (params.to && call.startedAt.slice(0, 10) > params.to) return false
        if (params.search) {
          const lead = db.leads.find((item) => item.id === call.customerId)
          const sales = findUser(call.salesId)
          const haystack = `${lead?.name ?? ''} ${lead?.company ?? ''} ${call.phone} ${sales?.name ?? ''}`.toLowerCase()
          if (!haystack.includes(params.search.trim().toLowerCase())) return false
        }
        return true
      })
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  },

  async create(input: CreateCallInput) {
    await delay(60)
    const id = nextId('call')
    const startedAt = new Date(Date.now() - input.durationSeconds * 1000).toISOString()
    const endedAt = new Date().toISOString()
    updateDb((db) => {
      const sales = db.users.find((user) => user.id === input.salesId)
      db.calls.unshift({
        id,
        customerId: input.customerId,
        salesId: input.salesId,
        phone: input.phone,
        direction: input.direction,
        startedAt,
        endedAt,
        durationSeconds: input.durationSeconds,
        status: input.status,
        result: input.result,
        recordingUrl: input.status === 'answered' ? `mock://recordings/${id}` : undefined,
      })
      const lead = db.leads.find((item) => item.id === input.customerId)
      if (lead) {
        lead.lastContactAt = endedAt
        if (lead.firstResponseMinutes === 0) {
          lead.firstResponseMinutes = Math.max(1, Math.round((Date.now() - new Date(lead.createdAt).getTime()) / 60000))
        }
      }
      const minutes = Math.floor(input.durationSeconds / 60)
      const seconds = input.durationSeconds % 60
      db.activities.unshift({
        id: nextId('act'),
        customerId: input.customerId,
        type: 'call',
        title: `${sales?.name ?? 'Nhân viên'} gọi khách hàng`,
        description: `Thời lượng: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        actorId: input.salesId,
        createdAt: endedAt,
        metadata: { callId: id, direction: input.direction, result: input.result },
      })
    })
    return id
  },
}
