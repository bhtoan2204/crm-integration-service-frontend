import type { DocumentCategory } from '@/models'
import { getDb, nextId, updateDb } from '@/mocks/store'
import { delay } from './delay'

export const documentService = {
  async listByCustomer(customerId: string) {
    await delay()
    return getDb()
      .documents.filter((document) => document.customerId === customerId)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
  },

  async addMock(input: { customerId: string; filename: string; category: DocumentCategory; actorId: string }) {
    await delay(60)
    updateDb((db) => {
      const id = nextId('doc')
      db.documents.unshift({
        id,
        customerId: input.customerId,
        filename: input.filename,
        category: input.category,
        uploadedAt: new Date().toISOString(),
        uploadedById: input.actorId,
        status: 'uploaded',
        sizeKb: 128,
      })
      db.activities.unshift({
        id: nextId('act'),
        customerId: input.customerId,
        type: 'document_uploaded',
        title: `Tải lên ${input.filename}`,
        description: 'Tệp được ghi nhận ở chế độ mô phỏng, chưa có kho lưu trữ thật.',
        actorId: input.actorId,
        createdAt: new Date().toISOString(),
        metadata: { documentId: id },
      })
    })
  },
}

export const activityService = {
  async addNote(customerId: string, note: string, actorId: string) {
    await delay(40)
    updateDb((db) => {
      const lead = db.leads.find((item) => item.id === customerId)
      if (lead) lead.lastContactAt = new Date().toISOString()
      db.activities.unshift({
        id: nextId('act'),
        customerId,
        type: 'note',
        title: 'Ghi chú',
        description: note,
        actorId,
        createdAt: new Date().toISOString(),
      })
    })
  },
}
