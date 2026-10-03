import type { QuotationStatus } from '@/models'
import { getDb, nextId, updateDb } from '@/mocks/store'
import { delay } from './delay'

export const quotationService = {
  async listByCustomer(customerId: string) {
    await delay()
    return getDb()
      .quotations.filter((quote) => quote.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async create(input: { customerId: string; amount: number; note: string; actorId: string; status?: QuotationStatus }) {
    await delay(60)
    const id = nextId('quote')
    updateDb((db) => {
      const version = db.quotations.filter((quote) => quote.customerId === input.customerId).length + 1
      const code = `BG-2026-${String(db.quotations.length + 1).padStart(4, '0')}`
      db.quotations.unshift({
        id,
        code,
        customerId: input.customerId,
        amount: input.amount,
        createdById: input.actorId,
        createdAt: new Date().toISOString(),
        status: input.status ?? 'draft',
        version,
        note: input.note,
      })
      db.activities.unshift({
        id: nextId('act'),
        customerId: input.customerId,
        type: 'quotation_created',
        title: `Tạo báo giá ${code}`,
        description: input.note || `Phiên bản ${version}.`,
        actorId: input.actorId,
        createdAt: new Date().toISOString(),
        metadata: { quoteId: id },
      })
    })
    return id
  },
}
