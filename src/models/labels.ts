import type {
  ActivityType,
  CallDirection,
  CallResult,
  CallStatus,
  DocumentCategory,
  DocumentStatus,
  IntegrationType,
  LeadSource,
  LeadStatus,
  OrderStatus,
  PipelineStage,
  PipelineStageId,
  Priority,
  QuotationStatus,
  UnmetReason,
  UserRole,
} from './types'

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'caring', name: 'Đang chăm sóc', order: 1 },
  { id: 'order_info', name: 'Thông tin đơn hàng', order: 2 },
  { id: 'price_summary', name: 'Tổng hợp giá', order: 3 },
  { id: 'quotation', name: 'Báo giá', order: 4 },
  { id: 'agreed', name: 'Đồng ý', order: 5 },
  { id: 'booking', name: 'Booking', order: 6 },
  { id: 'agent_selection', name: 'Lựa chọn đại lý', order: 7 },
  { id: 'send_documents', name: 'Gửi chứng từ', order: 8 },
  { id: 'customs_declaration', name: 'Khai báo Hải Quan', order: 9 },
  { id: 'post_customs_documents', name: 'Gửi chứng từ sau khai báo', order: 10 },
  { id: 'dispatch', name: 'Điều xe', order: 11 },
  { id: 'delivery', name: 'Giao hàng', order: 12 },
  { id: 'payment', name: 'Thanh toán', order: 13 },
  { id: 'completed', name: 'Hoàn thành', order: 14 },
]

export const STAGE_ORDER = PIPELINE_STAGES.map((stage) => stage.id)

export function stageName(id: PipelineStageId) {
  return PIPELINE_STAGES.find((stage) => stage.id === id)?.name ?? id
}

export function stageIndex(id: PipelineStageId) {
  return STAGE_ORDER.indexOf(id)
}

export const STAGE_BADGE: Record<PipelineStageId, string> = {
  caring: 'bg-slate-100 text-slate-700 ring-slate-200',
  order_info: 'bg-sky-50 text-sky-800 ring-sky-200',
  price_summary: 'bg-cyan-50 text-cyan-800 ring-cyan-200',
  quotation: 'bg-amber-50 text-amber-800 ring-amber-200',
  agreed: 'bg-lime-50 text-lime-800 ring-lime-200',
  booking: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  agent_selection: 'bg-teal-50 text-teal-800 ring-teal-200',
  send_documents: 'bg-blue-50 text-blue-800 ring-blue-200',
  customs_declaration: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  post_customs_documents: 'bg-violet-50 text-violet-800 ring-violet-200',
  dispatch: 'bg-purple-50 text-purple-800 ring-purple-200',
  delivery: 'bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200',
  payment: 'bg-orange-50 text-orange-800 ring-orange-200',
  completed: 'bg-green-50 text-green-800 ring-green-200',
}

export const STAGE_BAR: Record<PipelineStageId, string> = {
  caring: 'bg-slate-400',
  order_info: 'bg-sky-500',
  price_summary: 'bg-cyan-500',
  quotation: 'bg-amber-500',
  agreed: 'bg-lime-600',
  booking: 'bg-emerald-500',
  agent_selection: 'bg-teal-500',
  send_documents: 'bg-blue-500',
  customs_declaration: 'bg-indigo-500',
  post_customs_documents: 'bg-violet-500',
  dispatch: 'bg-purple-500',
  delivery: 'bg-fuchsia-500',
  payment: 'bg-orange-500',
  completed: 'bg-green-600',
}

export const SOURCE_LABEL: Record<LeadSource, string> = {
  website: 'Website',
  referral: 'Giới thiệu',
  excel: 'Excel / Import',
  call_center: 'Tổng đài',
  api: 'API',
  event: 'Hội chợ',
  other: 'Khác',
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn',
}

export const PRIORITY_BADGE: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-600 ring-slate-200',
  medium: 'bg-blue-50 text-blue-700 ring-blue-200',
  high: 'bg-amber-50 text-amber-800 ring-amber-200',
  urgent: 'bg-red-50 text-red-700 ring-red-200',
}

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Mới',
  nurturing: 'Đang chăm sóc',
  converted: 'Đã chuyển đổi',
  unmet: 'Không đáp ứng',
  paused: 'Tạm dừng',
}

export const LEAD_STATUS_BADGE: Record<LeadStatus, string> = {
  new: 'bg-sky-50 text-sky-800 ring-sky-200',
  nurturing: 'bg-blue-50 text-blue-800 ring-blue-200',
  converted: 'bg-green-50 text-green-800 ring-green-200',
  unmet: 'bg-rose-50 text-rose-700 ring-rose-200',
  paused: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  manager: 'Quản lý',
  sales: 'Nhân viên kinh doanh',
}

export const CALL_DIRECTION_LABEL: Record<CallDirection, string> = {
  inbound: 'Gọi đến',
  outbound: 'Gọi đi',
}

export const CALL_STATUS_LABEL: Record<CallStatus, string> = {
  answered: 'Thành công',
  missed: 'Không nghe',
  busy: 'Máy bận',
  failed: 'Thất bại',
  voicemail: 'Hộp thư thoại',
}

export const CALL_RESULT_LABEL: Record<CallResult, string> = {
  interested: 'Quan tâm',
  callback: 'Hẹn gọi lại',
  not_interested: 'Không quan tâm',
  quoted: 'Đã báo giá',
  no_answer: 'Không nghe máy',
  wrong_number: 'Sai số',
  booked: 'Đã booking',
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  processing: 'Đang xử lý',
  booking: 'Booking',
  customs: 'Hải quan',
  transporting: 'Đang vận chuyển',
  delivered: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  processing: 'bg-sky-50 text-sky-800 ring-sky-200',
  booking: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  customs: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  transporting: 'bg-violet-50 text-violet-800 ring-violet-200',
  delivered: 'bg-teal-50 text-teal-800 ring-teal-200',
  completed: 'bg-green-50 text-green-800 ring-green-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
}

export const QUOTE_STATUS_LABEL: Record<QuotationStatus, string> = {
  draft: 'Nháp',
  sent: 'Đã gửi',
  accepted: 'Đã chấp nhận',
  rejected: 'Từ chối',
  expired: 'Hết hạn',
}

export const QUOTE_STATUS_BADGE: Record<QuotationStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 ring-slate-200',
  sent: 'bg-blue-50 text-blue-800 ring-blue-200',
  accepted: 'bg-green-50 text-green-800 ring-green-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  expired: 'bg-amber-50 text-amber-800 ring-amber-200',
}

export const DOCUMENT_CATEGORY_LABEL: Record<DocumentCategory, string> = {
  booking: 'Booking',
  invoice: 'Invoice',
  packing_list: 'Packing List',
  customs: 'Customs',
  delivery: 'Delivery',
  other: 'Other',
}

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  pending: 'Chờ bổ sung',
  uploaded: 'Đã tải lên',
  verified: 'Đã kiểm tra',
  rejected: 'Cần chỉnh',
}

export const UNMET_REASON_LABEL: Record<UnmetReason, string> = {
  price: 'Giá không phù hợp',
  no_route: 'Không có tuyến',
  no_agent: 'Không có đại lý',
  capacity: 'Không đủ năng lực vận chuyển',
  customer_cancelled: 'Khách hàng hủy',
  other: 'Khác',
}

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  call: 'Cuộc gọi',
  message: 'Tin nhắn',
  note: 'Ghi chú',
  stage_changed: 'Chuyển trạng thái',
  quotation_created: 'Tạo báo giá',
  quotation_sent: 'Gửi báo giá',
  quotation_accepted: 'Chấp nhận báo giá',
  quotation_rejected: 'Từ chối báo giá',
  booking: 'Booking',
  document_uploaded: 'Tải chứng từ',
  order_updated: 'Cập nhật đơn hàng',
}

export const INTEGRATION_META: Record<
  IntegrationType,
  { name: string; description: string }
> = {
  crm: {
    name: 'CRM',
    description: 'Đồng bộ dữ liệu khách hàng từ hệ thống CRM bên ngoài.',
  },
  telephony: {
    name: 'Tổng đài',
    description:
      'Đồng bộ lịch sử cuộc gọi, thời lượng cuộc gọi và nhân viên thực hiện cuộc gọi.',
  },
  messaging: {
    name: 'Tin nhắn',
    description: 'Kênh tin nhắn khách hàng sẽ được kết nối ở giai đoạn sau.',
  },
  webhook: {
    name: 'Webhook / API',
    description: 'Nhận và đẩy dữ liệu qua API hoặc webhook tổng quát.',
  },
}
