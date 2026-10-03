import type { LeadSource, PipelineStageId, Priority, UnmetReason } from '@/models'
import { stageIndex, stageName } from '@/models/labels'
import { findUser, getDb, nextId, updateDb } from '@/mocks/store'
import { delay, MockServiceError } from './delay'

export interface CustomerListParams {
  search?: string
  salesId?: string
  stage?: PipelineStageId | 'all'
  source?: LeadSource | 'all'
  from?: string
  to?: string
}

export interface LeadInput {
  name: string
  phone: string
  email: string
  company: string
  address: string
  source: LeadSource
  assignedSalesId: string
  priority: Priority
  expectedValue: number
  notes: string
  nextFollowUpAt: string
}

export interface ImportRow {
  customer_name: string
  phone: string
  email: string
  company: string
  source: string
  note: string
}

export interface ClassifiedImportRow extends ImportRow {
  rowNumber: number
  kind: 'valid' | 'invalid' | 'duplicate'
  message: string
}

const SOURCE_HINTS: Array<[LeadSource, string[]]> = [
  ['website', ['web', 'website']],
  ['referral', ['giới thiệu', 'gioi thieu', 'referral']],
  ['excel', ['excel', 'csv', 'import']],
  ['call_center', ['tổng đài', 'tong dai', 'call']],
  ['api', ['api']],
  ['event', ['hội chợ', 'hoi cho', 'event']],
]

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

export function mapImportSource(value: string): LeadSource {
  const text = value.trim().toLowerCase()
  for (const [source, hints] of SOURCE_HINTS) {
    if (hints.some((hint) => text.includes(hint))) return source
  }
  return 'excel'
}

export function classifyImportRows(rows: ImportRow[]): ClassifiedImportRow[] {
  const existing = new Set(getDb().leads.map((lead) => normalizePhone(lead.phone)))
  const seen = new Set<string>()
  return rows.map((row, index) => {
    const phone = normalizePhone(row.phone)
    const email = row.email.trim()
    let kind: ClassifiedImportRow['kind'] = 'valid'
    let message = 'Hợp lệ'
    if (!row.customer_name.trim() || phone.length < 9) {
      kind = 'invalid'
      message = !row.customer_name.trim() ? 'Thiếu tên khách hàng' : 'Số điện thoại không hợp lệ'
    } else if (email && !email.includes('@')) {
      kind = 'invalid'
      message = 'Email không đúng định dạng'
    } else if (existing.has(phone) || seen.has(phone)) {
      kind = 'duplicate'
      message = existing.has(phone) ? 'Trùng số điện thoại đã có trong CRM' : 'Trùng số điện thoại trong file'
    }
    if (phone) seen.add(phone)
    return { ...row, rowNumber: index + 1, kind, message }
  })
}

function matchesSearch(lead: { name: string; company: string; phone: string; email: string; code: string }, search: string) {
  const haystack = `${lead.name} ${lead.company} ${lead.phone} ${lead.email} ${lead.code}`.toLowerCase()
  return haystack.includes(search.trim().toLowerCase())
}

export const customerService = {
  async board() {
    await delay()
    const db = getDb()
    return db.leads.map((lead) => {
      const activity = db.activities
        .filter((item) => item.customerId === lead.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      return {
        lead,
        salesName: db.users.find((user) => user.id === lead.assignedSalesId)?.name ?? 'Chưa phân công',
        lastActivity: activity?.title ?? 'Chưa có hoạt động',
        rejectedQuotes: db.quotations.filter((quote) => quote.customerId === lead.id && quote.status === 'rejected').length,
      }
    })
  },

  async list(params: CustomerListParams = {}) {
    await delay()
    return getDb()
      .leads.filter((lead) => {
        if (params.search && !matchesSearch(lead, params.search)) return false
        if (params.salesId && params.salesId !== 'all' && lead.assignedSalesId !== params.salesId) return false
        if (params.stage && params.stage !== 'all' && lead.stage !== params.stage) return false
        if (params.source && params.source !== 'all' && lead.source !== params.source) return false
        if (params.from && lead.createdAt.slice(0, 10) < params.from) return false
        if (params.to && lead.createdAt.slice(0, 10) > params.to) return false
        return true
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async getById(id: string) {
    await delay()
    return getDb().leads.find((lead) => lead.id === id) ?? null
  },

  async getDetail(id: string) {
    await delay()
    const db = getDb()
    const lead = db.leads.find((item) => item.id === id)
    if (!lead) return null
    return {
      lead,
      sales: db.users.find((user) => user.id === lead.assignedSalesId) ?? null,
      activities: db.activities
        .filter((activity) => activity.customerId === id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      calls: db.calls
        .filter((call) => call.customerId === id)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
      orders: db.orders.filter((order) => order.customerId === id),
      quotations: db.quotations
        .filter((quote) => quote.customerId === id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      documents: db.documents
        .filter((document) => document.customerId === id)
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    }
  },

  async create(input: LeadInput, actorId: string) {
    await delay(80)
    const id = nextId('lead')
    const count = getDb().leads.length + 1
    updateDb((db) => {
      db.leads.unshift({
        id,
        code: `KH-2026-${String(count).padStart(4, '0')}`,
        name: input.name.trim(),
        phone: normalizePhone(input.phone),
        email: input.email.trim(),
        company: input.company.trim(),
        address: input.address.trim(),
        source: input.source,
        assignedSalesId: input.assignedSalesId,
        stage: 'caring',
        priority: input.priority,
        createdAt: new Date().toISOString(),
        lastContactAt: new Date().toISOString(),
        nextFollowUpAt: input.nextFollowUpAt,
        leadStatus: 'new',
        expectedValue: input.expectedValue,
        notes: input.notes.trim(),
        firstResponseMinutes: 0,
      })
      db.activities.unshift({
        id: nextId('act'),
        customerId: id,
        type: 'note',
        title: 'Tạo khách hàng mới',
        description: input.notes.trim() || 'Khách hàng được tạo thủ công trên CRM.',
        actorId,
        createdAt: new Date().toISOString(),
      })
    })
    return id
  },

  async update(id: string, input: LeadInput, actorId: string) {
    await delay(80)
    updateDb((db) => {
      const lead = db.leads.find((item) => item.id === id)
      if (!lead) return
      Object.assign(lead, {
        name: input.name.trim(),
        phone: normalizePhone(input.phone),
        email: input.email.trim(),
        company: input.company.trim(),
        address: input.address.trim(),
        source: input.source,
        assignedSalesId: input.assignedSalesId,
        priority: input.priority,
        expectedValue: input.expectedValue,
        notes: input.notes.trim(),
        nextFollowUpAt: input.nextFollowUpAt,
      })
      db.activities.unshift({
        id: nextId('act'),
        customerId: id,
        type: 'note',
        title: 'Cập nhật thông tin khách hàng',
        description: 'Thông tin liên hệ và phân công đã được chỉnh sửa.',
        actorId,
        createdAt: new Date().toISOString(),
      })
    })
  },

  async updateStage(id: string, stage: PipelineStageId, actorId: string) {
    await delay(40)
    let changed = false
    updateDb((db) => {
      const lead = db.leads.find((item) => item.id === id)
      if (!lead || lead.stage === stage) return
      const from = lead.stage
      lead.stage = stage
      lead.lastContactAt = new Date().toISOString()
      if (stage === 'completed') lead.leadStatus = 'converted'
      else if (lead.leadStatus === 'new' || lead.leadStatus === 'converted') lead.leadStatus = 'nurturing'
      changed = true
      db.activities.unshift({
        id: nextId('act'),
        customerId: id,
        type: stage === 'booking' ? 'booking' : 'stage_changed',
        title: 'Chuyển trạng thái',
        description: `${stageName(from)} → ${stageName(stage)}`,
        actorId,
        createdAt: new Date().toISOString(),
        metadata: { from, to: stage },
      })
      db.orders
        .filter((order) => order.customerId === id && order.status !== 'cancelled')
        .forEach((order) => {
          order.stage = stage
        })
      if (stage === 'agreed') {
        const quote = db.quotations
          .filter((item) => item.customerId === id && (item.status === 'sent' || item.status === 'draft'))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
        if (quote) quote.status = 'accepted'
      }
    })
    return changed
  },

  async rejectQuotation(id: string, actorId: string) {
    await delay(40)
    updateDb((db) => {
      const lead = db.leads.find((item) => item.id === id)
      if (!lead) throw new MockServiceError('Không tìm thấy khách hàng')
      const from = lead.stage
      lead.stage = 'caring'
      lead.leadStatus = 'nurturing'
      lead.lastContactAt = new Date().toISOString()
      const quote = db.quotations
        .filter((item) => item.customerId === id && item.status !== 'rejected' && item.status !== 'expired')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      if (quote) quote.status = 'rejected'
      db.activities.unshift({
        id: nextId('act'),
        customerId: id,
        type: 'quotation_rejected',
        title: 'Khách hàng chưa đồng ý báo giá',
        description: `${stageName(from)} → ${stageName('caring')}. Lịch sử báo giá được giữ nguyên.`,
        actorId,
        createdAt: new Date().toISOString(),
        metadata: { from, to: 'caring' },
      })
    })
  },

  async markUnmet(id: string, reason: UnmetReason, note: string, actorId: string) {
    await delay(40)
    updateDb((db) => {
      const lead = db.leads.find((item) => item.id === id)
      if (!lead) return
      lead.leadStatus = 'unmet'
      lead.lastContactAt = new Date().toISOString()
      db.unmetDemands.unshift({
        id: nextId('unmet'),
        customerId: id,
        salesId: lead.assignedSalesId,
        reason,
        note,
        createdAt: new Date().toISOString(),
      })
      db.activities.unshift({
        id: nextId('act'),
        customerId: id,
        type: 'note',
        title: 'Ghi nhận yêu cầu không đáp ứng',
        description: note || 'Khách hàng được đánh dấu không đáp ứng được.',
        actorId,
        createdAt: new Date().toISOString(),
      })
    })
  },

  async importRows(rows: ImportRow[], assignedSalesId: string, actorId: string) {
    await delay(120)
    const classified = classifyImportRows(rows)
    const valid = classified.filter((row) => row.kind === 'valid')
    updateDb((db) => {
      valid.forEach((row) => {
        const id = nextId('lead')
        const codeNumber = db.leads.length + 1
        db.leads.unshift({
          id,
          code: `KH-2026-${String(codeNumber).padStart(4, '0')}`,
          name: row.customer_name.trim(),
          phone: normalizePhone(row.phone),
          email: row.email.trim(),
          company: row.company.trim() || 'Chưa cập nhật',
          address: '',
          source: mapImportSource(row.source),
          assignedSalesId,
          stage: 'caring',
          priority: 'medium',
          createdAt: new Date().toISOString(),
          lastContactAt: new Date().toISOString(),
          nextFollowUpAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
          leadStatus: 'new',
          expectedValue: 0,
          notes: row.note.trim(),
          firstResponseMinutes: 0,
        })
        db.activities.unshift({
          id: nextId('act'),
          customerId: id,
          type: 'note',
          title: 'Nhập từ Excel/CSV',
          description: row.note.trim() || 'Khách hàng được nhập từ file.',
          actorId,
          createdAt: new Date().toISOString(),
        })
      })
    })
    return {
      imported: valid.length,
      invalid: classified.filter((row) => row.kind === 'invalid').length,
      duplicates: classified.filter((row) => row.kind === 'duplicate').length,
    }
  },
}

export function salesName(salesId: string) {
  return findUser(salesId)?.name ?? 'Chưa phân công'
}

export function isLaterStage(stage: PipelineStageId, than: PipelineStageId) {
  return stageIndex(stage) > stageIndex(than)
}
