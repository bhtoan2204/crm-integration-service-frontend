export type UserRole = 'admin' | 'manager' | 'sales'

export type UserStatus = 'active' | 'inactive'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  teamId: string
  jobTitle: string
  status: UserStatus
}

export interface Team {
  id: string
  name: string
  managerId: string
}

export type PipelineStageId =
  | 'caring'
  | 'order_info'
  | 'price_summary'
  | 'quotation'
  | 'agreed'
  | 'booking'
  | 'agent_selection'
  | 'send_documents'
  | 'customs_declaration'
  | 'post_customs_documents'
  | 'dispatch'
  | 'delivery'
  | 'payment'
  | 'completed'

export interface PipelineStage {
  id: PipelineStageId
  name: string
  order: number
}

export type LeadSource =
  | 'website'
  | 'referral'
  | 'excel'
  | 'call_center'
  | 'api'
  | 'event'
  | 'other'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export type LeadStatus = 'new' | 'nurturing' | 'converted' | 'unmet' | 'paused'

export interface Customer {
  id: string
  code: string
  name: string
  phone: string
  email: string
  company: string
  address: string
  source: LeadSource
  assignedSalesId: string
  stage: PipelineStageId
  priority: Priority
  createdAt: string
  lastContactAt: string
  nextFollowUpAt: string
}

export interface Lead extends Customer {
  leadStatus: LeadStatus
  expectedValue: number
  notes: string
  firstResponseMinutes: number
}

export type ActivityType =
  | 'call'
  | 'message'
  | 'note'
  | 'stage_changed'
  | 'quotation_created'
  | 'quotation_sent'
  | 'quotation_accepted'
  | 'quotation_rejected'
  | 'booking'
  | 'document_uploaded'
  | 'order_updated'

export interface LeadActivity {
  id: string
  customerId: string
  orderId?: string
  type: ActivityType
  title: string
  description: string
  actorId: string
  createdAt: string
  metadata?: Record<string, string>
}

export type CallDirection = 'inbound' | 'outbound'

export type CallStatus = 'answered' | 'missed' | 'busy' | 'failed' | 'voicemail'

export type CallResult =
  | 'interested'
  | 'callback'
  | 'not_interested'
  | 'quoted'
  | 'no_answer'
  | 'wrong_number'
  | 'booked'

export interface CallLog {
  id: string
  customerId: string
  salesId: string
  phone: string
  direction: CallDirection
  startedAt: string
  endedAt: string
  durationSeconds: number
  status: CallStatus
  result: CallResult
  recordingUrl?: string
}

export type OrderStatus =
  | 'processing'
  | 'booking'
  | 'customs'
  | 'transporting'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export interface Order {
  id: string
  code: string
  customerId: string
  salesId: string
  service: string
  origin: string
  destination: string
  shipmentType: string
  weightKg: number
  volumeCbm: number
  amount: number
  estimatedPrice: number
  status: OrderStatus
  stage: PipelineStageId
  createdAt: string
  expectedDeliveryAt: string
  completedAt?: string
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export interface Quotation {
  id: string
  code: string
  customerId: string
  orderId?: string
  amount: number
  createdById: string
  createdAt: string
  status: QuotationStatus
  version: number
  note?: string
}

export type DocumentCategory =
  | 'booking'
  | 'invoice'
  | 'packing_list'
  | 'customs'
  | 'delivery'
  | 'other'

export type DocumentStatus = 'pending' | 'uploaded' | 'verified' | 'rejected'

export interface Document {
  id: string
  customerId: string
  orderId?: string
  filename: string
  category: DocumentCategory
  uploadedAt: string
  uploadedById: string
  status: DocumentStatus
  sizeKb: number
}

export type IntegrationType = 'crm' | 'telephony' | 'messaging' | 'webhook'

export type IntegrationStatus = 'disconnected' | 'connected' | 'error'

export interface Integration {
  id: string
  type: IntegrationType
  name: string
  description: string
  status: IntegrationStatus
}

export interface IntegrationDraft {
  name: string
  baseUrl: string
  apiKey: string
  secret: string
  webhookUrl: string
  syncEnabled: boolean
}

export type UnmetReason =
  | 'price'
  | 'no_route'
  | 'no_agent'
  | 'capacity'
  | 'customer_cancelled'
  | 'other'

export interface UnmetDemand {
  id: string
  customerId: string
  salesId: string
  reason: UnmetReason
  note: string
  createdAt: string
}

export interface ReportMetric {
  id: string
  label: string
  value: number
  unit?: string
  changePercent?: number
  hint?: string
}

export interface Credential {
  userId: string
  email: string
  password: string
}

export type DatePreset = 'today' | '7d' | '30d' | 'week' | 'month' | 'custom'

export interface DateRange {
  preset: DatePreset
  from?: string
  to?: string
}
