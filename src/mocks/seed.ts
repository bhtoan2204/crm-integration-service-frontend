import { parseISO } from 'date-fns'
import type {
  ActivityType,
  CallDirection,
  CallLog,
  CallResult,
  CallStatus,
  Credential,
  Document,
  DocumentCategory,
  Integration,
  Lead,
  LeadActivity,
  LeadSource,
  LeadStatus,
  Order,
  OrderStatus,
  PipelineStageId,
  Priority,
  Quotation,
  QuotationStatus,
  Team,
  UnmetDemand,
  UnmetReason,
  User,
} from '@/models'
import { STAGE_ORDER, stageIndex, stageName } from '@/models/labels'

export interface MockDb {
  users: User[]
  teams: Team[]
  credentials: Credential[]
  leads: Lead[]
  activities: LeadActivity[]
  calls: CallLog[]
  orders: Order[]
  quotations: Quotation[]
  documents: Document[]
  integrations: Integration[]
  unmetDemands: UnmetDemand[]
}

const STAGES: PipelineStageId[] = [
  'caring', 'caring', 'caring', 'caring', 'caring', 'caring',
  'order_info', 'order_info', 'order_info', 'order_info',
  'price_summary', 'price_summary', 'price_summary',
  'quotation', 'quotation', 'quotation', 'quotation',
  'agreed', 'agreed', 'agreed',
  'booking', 'booking', 'booking',
  'agent_selection', 'agent_selection',
  'send_documents', 'send_documents',
  'customs_declaration', 'customs_declaration',
  'post_customs_documents', 'post_customs_documents',
  'dispatch', 'dispatch',
  'delivery', 'delivery',
  'payment', 'payment',
  'completed', 'completed', 'completed', 'completed', 'completed',
]

const UNMET_AT: Array<{ index: number; reason: UnmetReason }> = [
  { index: 0, reason: 'price' },
  { index: 1, reason: 'no_route' },
  { index: 2, reason: 'no_agent' },
  { index: 11, reason: 'capacity' },
  { index: 18, reason: 'customer_cancelled' },
  { index: 27, reason: 'other' },
]

interface CompanySeed {
  company: string
  contact: string
  domain: string
  address: string
  source: LeadSource
}

const COMPANIES: CompanySeed[] = [
  { company: 'Công ty TNHH XNK Ánh Dương', contact: 'Nguyễn Văn An', domain: 'anhduong.vn', address: '18 Lê Thánh Tông, Ngô Quyền, Hải Phòng', source: 'website' },
  { company: 'Công ty CP Chế biến gỗ Bình Dương', contact: 'Trần Thị Mai', domain: 'gobinhduong.vn', address: 'KCN Sóng Thần, Dĩ An, Bình Dương', source: 'referral' },
  { company: 'Công ty TNHH Dệt may Hòa Bình', contact: 'Lê Hoàng Nam', domain: 'detmayhb.vn', address: '25 Lý Thường Kiệt, TP Hòa Bình', source: 'excel' },
  { company: 'Công ty CP Thủy sản Minh Phát', contact: 'Phạm Thị Hồng', domain: 'minhphatseafood.vn', address: '12 Trần Hưng Đạo, TP Cà Mau', source: 'call_center' },
  { company: 'Công ty TNHH Điện tử Sao Việt', contact: 'Ngô Quang Huy', domain: 'saovietelec.vn', address: 'Lô B2, KCN Quang Minh, Hà Nội', source: 'api' },
  { company: 'Công ty CP Nông sản Tây Nguyên', contact: 'Đặng Thu Hà', domain: 'nongsan-tn.vn', address: '88 Nguyễn Tất Thành, Buôn Ma Thuột', source: 'event' },
  { company: 'Công ty TNHH Nhựa Đại Phát', contact: 'Võ Minh Khoa', domain: 'nhuadaiphat.vn', address: 'KCN Amata, Biên Hòa, Đồng Nai', source: 'website' },
  { company: 'Công ty CP May mặc Thái Bình', contact: 'Lý Thị Ngọc', domain: 'maythaibinh.vn', address: '40 Hai Bà Trưng, TP Thái Bình', source: 'referral' },
  { company: 'Công ty TNHH Thép Miền Trung', contact: 'Phan Đức Thịnh', domain: 'thepmientrung.vn', address: 'KCN Hòa Khánh, Liên Chiểu, Đà Nẵng', source: 'other' },
  { company: 'Công ty CP Hóa chất Đông Á', contact: 'Trịnh Văn Long', domain: 'hoachatdonga.vn', address: '15 Nguyễn Văn Linh, Hải An, Hải Phòng', source: 'excel' },
  { company: 'Công ty TNHH Giày da An Phát', contact: 'Bùi Thị Lan', domain: 'giayanphat.vn', address: 'KCN Hải Sơn, Đức Hòa, Long An', source: 'call_center' },
  { company: 'Công ty CP Cà phê Đắk Lắk', contact: 'Hoàng Minh Đức', domain: 'caphedaklak.vn', address: '210 Nguyễn Chí Thanh, Buôn Ma Thuột', source: 'event' },
  { company: 'Công ty TNHH Nội thất Phương Nam', contact: 'Đinh Gia Bảo', domain: 'noithatpn.vn', address: 'KCN Tân Bình, Tân Phú, TP.HCM', source: 'website' },
  { company: 'Công ty CP Linh kiện ô tô Việt Nhật', contact: 'Mai Thanh Tùng', domain: 'vietnhat-auto.vn', address: 'KCN Thăng Long, Đông Anh, Hà Nội', source: 'api' },
  { company: 'Công ty TNHH Thực phẩm sạch Sông Hồng', contact: 'Nguyễn Thị Kim Oanh', domain: 'songhongfoods.vn', address: '9 Bạch Đằng, Hồng Bàng, Hải Phòng', source: 'referral' },
  { company: 'Công ty CP Bao bì Tân Tiến', contact: 'Trần Văn Sơn', domain: 'baobitantien.vn', address: 'KCN Biên Hòa 2, Đồng Nai', source: 'excel' },
  { company: 'Công ty TNHH Dược phẩm Hoa Sen', contact: 'Lê Thị Mỹ Duyên', domain: 'duocphamhoasen.vn', address: '120 Cách Mạng Tháng 8, Quận 3, TP.HCM', source: 'website' },
  { company: 'Công ty CP Gốm sứ Bát Tràng', contact: 'Phạm Hoàng Long', domain: 'gomsu-battrang.vn', address: 'Làng gốm Bát Tràng, Gia Lâm, Hà Nội', source: 'event' },
  { company: 'Công ty TNHH Cao su Phú Riềng', contact: 'Vũ Đình Khải', domain: 'caosupr.vn', address: 'QL14, Huyện Phú Riềng, Bình Phước', source: 'referral' },
  { company: 'Công ty CP Hải sản Phú Quốc', contact: 'Đoàn Thị Hạnh', domain: 'haisanpq.vn', address: 'Dương Đông, Phú Quốc, Kiên Giang', source: 'call_center' },
  { company: 'Công ty TNHH Cơ khí Chính xác Hà Nội', contact: 'Lưu Quang Vinh', domain: 'cokhi-hn.vn', address: 'KCN Nội Bài, Sóc Sơn, Hà Nội', source: 'api' },
  { company: 'Công ty CP Sợi chỉ Đồng Nai', contact: 'Ngô Thị Thanh', domain: 'soichidn.vn', address: 'KCN Nhơn Trạch 3, Đồng Nai', source: 'website' },
  { company: 'Công ty TNHH Mỹ phẩm Lá Xanh', contact: 'Đỗ Minh Anh', domain: 'myphamlaxanh.vn', address: '45 Nguyễn Huệ, Quận 1, TP.HCM', source: 'other' },
  { company: 'Công ty CP Đồ chơi gỗ Việt', contact: 'Trương Quốc Khánh', domain: 'dochoigoviet.vn', address: 'KCN Đồng An, Thuận An, Bình Dương', source: 'excel' },
  { company: 'Công ty TNHH Vải sợi Nam Định', contact: 'Nguyễn Đức Mạnh', domain: 'vaisoinamdinh.vn', address: '12 Trần Phú, TP Nam Định', source: 'referral' },
  { company: 'Công ty CP Năng lượng Á Châu', contact: 'Phan Thị Quỳnh', domain: 'achau-energy.vn', address: 'KCN VSIP, Từ Sơn, Bắc Ninh', source: 'website' },
  { company: 'Công ty TNHH Container lạnh Mekong', contact: 'Hoàng Văn Tài', domain: 'mekongreefer.vn', address: 'Cảng Cái Cui, Cái Răng, Cần Thơ', source: 'call_center' },
  { company: 'Công ty CP Xuất khẩu tiêu Bình Phước', contact: 'Lê Quốc Việt', domain: 'tieu-binhphuoc.vn', address: 'QL14, Đồng Xoài, Bình Phước', source: 'event' },
  { company: 'Công ty TNHH Đồ gia dụng Minh Khang', contact: 'Trần Ngọc Bích', domain: 'minhkhanghome.vn', address: 'KCN Tân Tạo, Bình Tân, TP.HCM', source: 'api' },
  { company: 'Công ty CP Thủy tinh Đáp Cầu', contact: 'Phạm Văn Hùng', domain: 'thuytinhdapcau.vn', address: 'Đáp Cầu, TP Bắc Ninh', source: 'excel' },
  { company: 'Công ty TNHH Vận tải Sao Mai', contact: 'Đặng Hoàng Phúc', domain: 'vantaisaomai.vn', address: 'ICD Long Bình, Biên Hòa, Đồng Nai', source: 'referral' },
  { company: 'Công ty CP Nhôm định hình Việt Đức', contact: 'Võ Thành Trung', domain: 'nhomvietduc.vn', address: 'KCN Mỹ Phước, Bến Cát, Bình Dương', source: 'website' },
  { company: 'Công ty TNHH Hạt điều Bình Phước', contact: 'Nguyễn Thị Thu', domain: 'hatdieu-bp.vn', address: 'Phước Long, Bình Phước', source: 'call_center' },
  { company: 'Công ty CP Đèn LED Phương Đông', contact: 'Bùi Văn Cường', domain: 'ledphuongdong.vn', address: 'KCN Quế Võ, Bắc Ninh', source: 'api' },
  { company: 'Công ty TNHH Giấy bao bì Đông Hải', contact: 'Lý Minh Tuấn', domain: 'donghaipaper.vn', address: 'KCN Hiệp Phước, Nhà Bè, TP.HCM', source: 'other' },
  { company: 'Công ty CP Thực phẩm đông lạnh An Việt', contact: 'Mai Thị Phương', domain: 'anvietfrozen.vn', address: 'KCN Trà Nóc, Bình Thủy, Cần Thơ', source: 'excel' },
  { company: 'Công ty TNHH Máy móc Tân Long', contact: 'Đinh Công Danh', domain: 'tanlong-machine.vn', address: 'KCN Hòa Cầm, Cẩm Lệ, Đà Nẵng', source: 'referral' },
  { company: 'Công ty CP Găng tay y tế Vĩnh Phúc', contact: 'Trần Quốc Toản', domain: 'gangtayvinhphuc.vn', address: 'KCN Khai Quang, Vĩnh Yên, Vĩnh Phúc', source: 'website' },
  { company: 'Công ty TNHH Sơn công nghiệp Hải Âu', contact: 'Lê Văn Bình', domain: 'sonhaiau.vn', address: 'KCN Đình Vũ, Hải An, Hải Phòng', source: 'event' },
  { company: 'Công ty CP Nhang hương Huế', contact: 'Phạm Gia Huy', domain: 'nhanghue.vn', address: 'Thủy Xuân, TP Huế', source: 'call_center' },
  { company: 'Công ty TNHH Phụ tùng Đồng Tâm', contact: 'Hoàng Thị Yến', domain: 'phutungdongtam.vn', address: 'KCN Hòa Khánh, Đà Nẵng', source: 'referral' },
  { company: 'Công ty CP Nông nghiệp CNC Lâm Đồng', contact: 'Nguyễn Hoàng Nam', domain: 'nongnghiepcnc.vn', address: 'Phường 8, TP Đà Lạt, Lâm Đồng', source: 'website' },
]

const SHIPMENTS = [
  { service: 'Đường biển FCL', shipmentType: 'Cont 40HC', origin: 'Cảng Cát Lái', destination: 'Los Angeles', weightKg: 18600, volumeCbm: 62, value: 486000000 },
  { service: 'Đường biển FCL', shipmentType: 'Cont 20DC', origin: 'Cảng Hải Phòng', destination: 'Rotterdam', weightKg: 12400, volumeCbm: 28, value: 312000000 },
  { service: 'Đường biển LCL', shipmentType: 'Hàng lẻ', origin: 'Cảng Cái Mép', destination: 'Hamburg', weightKg: 3200, volumeCbm: 11.5, value: 68000000 },
  { service: 'Hàng không', shipmentType: 'Air freight', origin: 'Sân bay Nội Bài', destination: 'Incheon', weightKg: 860, volumeCbm: 4.2, value: 145000000 },
  { service: 'Đường biển FCL', shipmentType: 'Cont 40HC', origin: 'Cảng Đà Nẵng', destination: 'Busan', weightKg: 16800, volumeCbm: 55, value: 228000000 },
  { service: 'Hàng không', shipmentType: 'Air express', origin: 'Sân bay Tân Sơn Nhất', destination: 'Singapore', weightKg: 420, volumeCbm: 2.1, value: 76000000 },
  { service: 'Đường biển FCL', shipmentType: 'Cont lạnh 40RF', origin: 'Cảng Hải Phòng', destination: 'Tokyo', weightKg: 19200, volumeCbm: 54, value: 540000000 },
  { service: 'Đường biển LCL', shipmentType: 'Hàng lẻ', origin: 'Cảng Cát Lái', destination: 'Melbourne', weightKg: 2800, volumeCbm: 9.4, value: 92000000 },
  { service: 'Đường biển FCL', shipmentType: 'Cont 40HC', origin: 'Cảng Cái Mép', destination: 'New York', weightKg: 17400, volumeCbm: 60, value: 720000000 },
  { service: 'Nội địa', shipmentType: 'Xe tải 15 tấn', origin: 'ICD Long Bình', destination: 'Kho Bangkok', weightKg: 9800, volumeCbm: 32, value: 48000000 },
]

const NOTES = [
  'Khách cần lịch tàu trong tuần này, ưu tiên transit ngắn.',
  'Hàng cần kiểm fumigation trước khi xếp cont.',
  'Khách so sánh thêm phương án hàng không nếu biển chậm.',
  'Yêu cầu tách invoice theo từng lô sản xuất.',
  'Cần xác nhận đại lý giao cuối tại cảng đến.',
  'Khách muốn giữ booking và chờ xác nhận sản xuất.',
  'Hàng dễ vỡ, cần bao bì gia cố và ảnh đóng gói.',
  'Đã gửi packing list nháp, chờ số cont thực tế.',
]

const SALES_CYCLE = ['u-sales-1', 'u-sales-2', 'u-sales-3', 'u-sales-4', 'u-sales-1', 'u-sales-2', 'u-sales-5']
const PRIORITY_CYCLE: Priority[] = ['high', 'medium', 'urgent', 'medium', 'low', 'high', 'medium', 'urgent']
const RESPONSE_MINUTES = [4, 8, 3, 12, 22, 6, 41, 9, 15, 2, 28, 7, 11, 55, 5, 18, 36, 14, 9, 27]

function stripVi(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

function emailOf(contact: string, domain: string) {
  const parts = stripVi(contact).toLowerCase().split(/\s+/).filter(Boolean)
  const given = parts[parts.length - 1] ?? 'contact'
  const surname = parts[0] ?? 'sales'
  return `${given}.${surname}@${domain}`
}

function phoneOf(index: number) {
  const prefixes = ['0903', '0912', '0934', '0987', '0868', '0886', '0326', '0338', '0703', '0795']
  const prefix = prefixes[index % prefixes.length] ?? '0903'
  const rest = String(100000 + index * 17389).padStart(6, '0').slice(0, 6)
  return `${prefix}${rest}`
}

function atDaysAgo(days: number, hour: number, minute: number) {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

function addMinutes(iso: string, minutes: number) {
  return new Date(parseISO(iso).getTime() + minutes * 60_000).toISOString()
}

function addDays(iso: string, days: number) {
  return new Date(parseISO(iso).getTime() + days * 86_400_000).toISOString()
}

function pad(value: number, size = 4) {
  return String(value).padStart(size, '0')
}

function orderStatusFor(stage: PipelineStageId): OrderStatus {
  switch (stage) {
    case 'booking':
    case 'agent_selection':
      return 'booking'
    case 'send_documents':
    case 'customs_declaration':
    case 'post_customs_documents':
      return 'customs'
    case 'dispatch':
      return 'transporting'
    case 'delivery':
    case 'payment':
      return 'delivered'
    case 'completed':
      return 'completed'
    default:
      return 'processing'
  }
}

export function buildDatabase(): MockDb {
  const teams: Team[] = [
    { id: 't-exec', name: 'Ban điều hành', managerId: 'u-admin' },
    { id: 't-north', name: 'Kinh doanh miền Bắc', managerId: 'u-manager-1' },
    { id: 't-south', name: 'Kinh doanh miền Nam', managerId: 'u-manager-2' },
    { id: 't-cs', name: 'Chăm sóc khách hàng', managerId: 'u-manager-1' },
  ]

  const users: User[] = [
    { id: 'u-admin', name: 'Nguyễn Thị Hương', email: 'admin@logiscrm.vn', phone: '0901001001', role: 'admin', teamId: 't-exec', jobTitle: 'Giám đốc vận hành', status: 'active' },
    { id: 'u-manager-1', name: 'Trần Quốc Bảo', email: 'bao.tran@logiscrm.vn', phone: '0902002002', role: 'manager', teamId: 't-north', jobTitle: 'Trưởng nhóm kinh doanh miền Bắc', status: 'active' },
    { id: 'u-manager-2', name: 'Lê Minh Châu', email: 'chau.le@logiscrm.vn', phone: '0903003003', role: 'manager', teamId: 't-south', jobTitle: 'Trưởng nhóm kinh doanh miền Nam', status: 'active' },
    { id: 'u-sales-1', name: 'Phạm Văn Khôi', email: 'khoi.pham@logiscrm.vn', phone: '0914111222', role: 'sales', teamId: 't-north', jobTitle: 'Nhân viên kinh doanh', status: 'active' },
    { id: 'u-sales-2', name: 'Hoàng Thu Trang', email: 'trang.hoang@logiscrm.vn', phone: '0984222333', role: 'sales', teamId: 't-north', jobTitle: 'Nhân viên kinh doanh', status: 'active' },
    { id: 'u-sales-3', name: 'Đỗ Anh Tú', email: 'tu.do@logiscrm.vn', phone: '0935333444', role: 'sales', teamId: 't-south', jobTitle: 'Nhân viên kinh doanh', status: 'active' },
    { id: 'u-sales-4', name: 'Vũ Ngọc Lan', email: 'lan.vu@logiscrm.vn', phone: '0866444555', role: 'sales', teamId: 't-south', jobTitle: 'Nhân viên kinh doanh', status: 'active' },
    { id: 'u-sales-5', name: 'Bùi Đức Huy', email: 'huy.bui@logiscrm.vn', phone: '0887555666', role: 'sales', teamId: 't-cs', jobTitle: 'Chuyên viên chăm sóc khách hàng', status: 'inactive' },
  ]

  const credentials: Credential[] = [
    { userId: 'u-admin', email: 'admin@logiscrm.vn', password: 'Admin@123' },
    { userId: 'u-manager-1', email: 'bao.tran@logiscrm.vn', password: 'Manager@123' },
    { userId: 'u-manager-2', email: 'chau.le@logiscrm.vn', password: 'Manager@123' },
    { userId: 'u-sales-1', email: 'khoi.pham@logiscrm.vn', password: 'Sales@123' },
    { userId: 'u-sales-2', email: 'trang.hoang@logiscrm.vn', password: 'Sales@123' },
    { userId: 'u-sales-3', email: 'tu.do@logiscrm.vn', password: 'Sales@123' },
    { userId: 'u-sales-4', email: 'lan.vu@logiscrm.vn', password: 'Sales@123' },
    { userId: 'u-sales-5', email: 'huy.bui@logiscrm.vn', password: 'Sales@123' },
  ]

  const leads: Lead[] = []
  const activities: LeadActivity[] = []
  const calls: CallLog[] = []
  const orders: Order[] = []
  const quotations: Quotation[] = []
  const documents: Document[] = []
  const unmetDemands: UnmetDemand[] = []

  let activitySeq = 1
  let callSeq = 1
  let quoteSeq = 1
  let docSeq = 1
  let orderSeq = 1

  const pushActivity = (activity: Omit<LeadActivity, 'id'>) => {
    activities.push({ ...activity, id: `act-${pad(activitySeq)}` })
    activitySeq += 1
  }

  COMPANIES.forEach((company, index) => {
    const stage = STAGES[index] ?? 'caring'
    const currentIndex = stageIndex(stage)
    let createdDays = Math.min(36, currentIndex * 2 + (index % 5))
    if (index === 4 || index === 5 || index === 8) createdDays = 0
    const lastDays = Math.min(createdDays, index % 5)
    const createdAt = atDaysAgo(createdDays, 8 + (index % 8), (index * 13) % 60)
    const lastContactAt = atDaysAgo(lastDays, 9 + (index % 7), (index * 7) % 60)
    const nextFollowUpAt = addDays(new Date().toISOString(), (index % 7) - 2)
    const shipment = SHIPMENTS[index % SHIPMENTS.length]!
    const salesId = SALES_CYCLE[index % SALES_CYCLE.length] ?? 'u-sales-1'
    const unmetReason = UNMET_AT.find((item) => item.index === index)?.reason

    let leadStatus: LeadStatus = 'nurturing'
    if (stage === 'completed') leadStatus = 'converted'
    else if (unmetReason) leadStatus = 'unmet'
    else if (index === 9) leadStatus = 'paused'
    else if (createdDays === 0) leadStatus = 'new'

    const lead: Lead = {
      id: `lead-${pad(index + 1)}`,
      code: `KH-2026-${pad(index + 1)}`,
      name: company.contact,
      phone: phoneOf(index),
      email: emailOf(company.contact, company.domain),
      company: company.company,
      address: company.address,
      source: company.source,
      assignedSalesId: salesId,
      stage,
      priority: PRIORITY_CYCLE[index % PRIORITY_CYCLE.length] ?? 'medium',
      createdAt,
      lastContactAt,
      nextFollowUpAt,
      leadStatus,
      expectedValue: shipment.value,
      notes: NOTES[index % NOTES.length] ?? '',
      firstResponseMinutes: RESPONSE_MINUTES[index % RESPONSE_MINUTES.length] ?? 15,
    }
    leads.push(lead)

    pushActivity({
      customerId: lead.id,
      type: 'note',
      title: 'Tiếp nhận khách hàng',
      description: `Ghi nhận lead từ nguồn ${company.source === 'call_center' ? 'tổng đài' : 'kinh doanh'}. ${lead.notes}`,
      actorId: salesId,
      createdAt,
    })

    for (let step = 1; step <= currentIndex; step += 1) {
      const from = STAGE_ORDER[step - 1] ?? 'caring'
      const to = STAGE_ORDER[step] ?? stage
      const at = addMinutes(createdAt, step * 18 * 60 + index * 3)
      const type: ActivityType = to === 'booking' ? 'booking' : 'stage_changed'
      pushActivity({
        customerId: lead.id,
        type,
        title: to === 'booking' ? 'Xác nhận booking' : 'Chuyển trạng thái',
        description: `${stageName(from)} → ${stageName(to)}`,
        actorId: salesId,
        createdAt: at,
        metadata: { from, to },
      })
    }

    const callCount = 2 + (currentIndex % 4)
    for (let n = 0; n < callCount; n += 1) {
      const direction: CallDirection = (index + n) % 3 === 0 ? 'inbound' : 'outbound'
      const missed = n === callCount - 1 && index % 4 === 0
      const busy = !missed && n === 0 && index % 6 === 0
      const status: CallStatus = missed ? 'missed' : busy ? 'busy' : 'answered'
      const result: CallResult = missed
        ? 'no_answer'
        : busy
          ? 'callback'
          : stage === 'completed' || currentIndex >= stageIndex('booking')
            ? 'booked'
            : currentIndex >= stageIndex('quotation')
              ? 'quoted'
              : index % 5 === 0
                ? 'callback'
                : 'interested'
      const durationSeconds = status === 'answered' ? 70 + ((index * 53 + n * 97) % 820) : status === 'busy' ? 18 : 0
      const hoursBack = n === 0 && (index % 5 === 0 || index === 4) ? 0.4 + (index % 3) * 0.6 : 20 + n * 18 + index
      const startedAt = new Date(Date.now() - hoursBack * 3600_000).toISOString()
      const safeStart = parseISO(startedAt) < parseISO(createdAt) ? addMinutes(createdAt, 30 + n * 80) : startedAt
      const id = `call-${pad(callSeq)}`
      callSeq += 1
      const call: CallLog = {
        id,
        customerId: lead.id,
        salesId,
        phone: lead.phone,
        direction,
        startedAt: safeStart,
        endedAt: addMinutes(safeStart, durationSeconds / 60),
        durationSeconds,
        status,
        result,
        recordingUrl: status === 'answered' && durationSeconds > 90 ? `mock://recordings/${id}` : undefined,
      }
      calls.push(call)
      const minutes = Math.floor(durationSeconds / 60)
      const seconds = durationSeconds % 60
      pushActivity({
        customerId: lead.id,
        type: 'call',
        title: `${users.find((user) => user.id === salesId)?.name ?? 'Nhân viên'} gọi khách hàng`,
        description: `Thời lượng: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        actorId: salesId,
        createdAt: safeStart,
        metadata: { callId: id, direction, result },
      })
    }

    if (index % 3 === 0) {
      pushActivity({
        customerId: lead.id,
        type: 'message',
        title: 'Tin nhắn gửi khách hàng',
        description: 'Đã gửi tin nhắn xác nhận thông tin lô hàng và lịch liên hệ tiếp theo.',
        actorId: salesId,
        createdAt: addMinutes(lastContactAt, -40),
      })
    }

    if (unmetReason) {
      unmetDemands.push({
        id: `unmet-${pad(index + 1)}`,
        customerId: lead.id,
        salesId,
        reason: unmetReason,
        note: NOTES[index % NOTES.length] ?? '',
        createdAt: lastContactAt,
      })
    }

    const pushQuote = (status: QuotationStatus, version: number, when: string, amount: number) => {
      const id = `quote-${pad(quoteSeq)}`
      quoteSeq += 1
      const quote: Quotation = {
        id,
        code: `BG-2026-${pad(quoteSeq)}`,
        customerId: lead.id,
        amount,
        createdById: salesId,
        createdAt: when,
        status,
        version,
        note: status === 'rejected' ? 'Khách chưa chốt vì phương án giá.' : 'Báo giá cước và phụ phí theo tuyến yêu cầu.',
      }
      quotations.push(quote)
      const type: ActivityType =
        status === 'accepted'
          ? 'quotation_accepted'
          : status === 'rejected'
            ? 'quotation_rejected'
            : status === 'sent'
              ? 'quotation_sent'
              : 'quotation_created'
      pushActivity({
        customerId: lead.id,
        type,
        title: status === 'rejected' ? 'Khách hàng chưa đồng ý báo giá' : `Báo giá ${quote.code}`,
        description:
          status === 'rejected'
            ? 'Khách hàng chưa đồng ý báo giá. Lead được giữ ở bước chăm sóc, lịch sử báo giá không bị xóa.'
            : `Phiên bản ${version} · ${status}`,
        actorId: salesId,
        createdAt: when,
        metadata: { quoteId: id },
      })
      return quote
    }

    if (index < 2) {
      pushQuote('rejected', 1, addMinutes(createdAt, 26 * 60), Math.round(shipment.value * 1.08))
    } else if (currentIndex === stageIndex('price_summary')) {
      pushQuote('draft', 1, addMinutes(createdAt, 20 * 60), shipment.value)
    } else if (currentIndex === stageIndex('quotation')) {
      if (index % 2 === 0) {
        pushQuote('expired', 1, addMinutes(createdAt, 10 * 60), Math.round(shipment.value * 0.96))
        pushQuote('sent', 2, addMinutes(lastContactAt, -30), shipment.value)
      } else {
        pushQuote('sent', 1, addMinutes(lastContactAt, -80), shipment.value)
      }
    } else if (currentIndex > stageIndex('quotation')) {
      const sent = pushQuote('sent', 1, addMinutes(createdAt, 12 * 60), shipment.value)
      sent.status = 'accepted'
      pushActivity({
        customerId: lead.id,
        type: 'quotation_accepted',
        title: `Khách chấp nhận ${sent.code}`,
        description: 'Báo giá được chấp nhận để chuyển sang các bước chứng từ và vận hành.',
        actorId: salesId,
        createdAt: addMinutes(createdAt, 30 * 60),
        metadata: { quoteId: sent.id },
      })
    }

    if (currentIndex >= 1) {
      const id = `order-${pad(orderSeq)}`
      orderSeq += 1
      const status = orderStatusFor(stage)
      const order: Order = {
        id,
        code: `DH-2026-${pad(orderSeq)}`,
        customerId: lead.id,
        salesId,
        service: shipment.service,
        origin: shipment.origin,
        destination: shipment.destination,
        shipmentType: shipment.shipmentType,
        weightKg: shipment.weightKg,
        volumeCbm: shipment.volumeCbm,
        amount: shipment.value,
        estimatedPrice: shipment.value,
        status,
        stage,
        createdAt: addMinutes(createdAt, 6 * 60),
        expectedDeliveryAt: addDays(createdAt, 18 + (index % 10)),
        completedAt: status === 'completed' ? lastContactAt : undefined,
      }
      orders.push(order)
      pushActivity({
        customerId: lead.id,
        orderId: id,
        type: 'order_updated',
        title: `Cập nhật đơn ${order.code}`,
        description: `Trạng thái vận hành: ${status}. Tuyến ${order.origin} → ${order.destination}.`,
        actorId: salesId,
        createdAt: lastContactAt,
        metadata: { orderId: id, status },
      })
    }

    if (currentIndex >= stageIndex('send_documents')) {
      const categories: DocumentCategory[] = ['booking', 'invoice', 'packing_list']
      if (currentIndex >= stageIndex('customs_declaration')) categories.push('customs')
      if (currentIndex >= stageIndex('delivery')) categories.push('delivery')
      categories.forEach((category, docIndex) => {
        const id = `doc-${pad(docSeq)}`
        docSeq += 1
        const filename =
          category === 'booking'
            ? `Booking-${lead.code}.pdf`
            : category === 'invoice'
              ? `Invoice-${lead.code}.pdf`
              : category === 'packing_list'
                ? `PackingList-${lead.code}.xlsx`
                : category === 'customs'
                  ? `ToKhai-${lead.code}.pdf`
                  : `POD-${lead.code}.pdf`
        const document: Document = {
          id,
          customerId: lead.id,
          filename,
          category,
          uploadedAt: addMinutes(createdAt, (20 + docIndex * 8) * 60),
          uploadedById: salesId,
          status: docIndex === categories.length - 1 && index % 5 === 0 ? 'pending' : 'verified',
          sizeKb: 180 + docIndex * 46 + (index % 7) * 12,
        }
        documents.push(document)
        pushActivity({
          customerId: lead.id,
          type: 'document_uploaded',
          title: `Tải lên ${filename}`,
          description: `Nhóm chứng từ: ${category}.`,
          actorId: salesId,
          createdAt: document.uploadedAt,
          metadata: { documentId: id },
        })
      })
    }
  })

  orders[3]!.status = 'cancelled'
  orders[11]!.status = 'cancelled'

  const integrations: Integration[] = [
    {
      id: 'int-crm',
      type: 'crm',
      name: 'CRM',
      description: 'Đồng bộ dữ liệu khách hàng từ hệ thống CRM bên ngoài.',
      status: 'disconnected',
    },
    {
      id: 'int-telephony',
      type: 'telephony',
      name: 'Tổng đài',
      description: 'Đồng bộ lịch sử cuộc gọi, thời lượng cuộc gọi và nhân viên thực hiện cuộc gọi.',
      status: 'disconnected',
    },
    {
      id: 'int-messaging',
      type: 'messaging',
      name: 'Tin nhắn',
      description: 'Kênh tin nhắn khách hàng sẽ được kết nối ở giai đoạn sau.',
      status: 'disconnected',
    },
    {
      id: 'int-webhook',
      type: 'webhook',
      name: 'Webhook / API',
      description: 'Nhận và đẩy dữ liệu qua API hoặc webhook tổng quát.',
      status: 'disconnected',
    },
  ]

  return {
    users,
    teams,
    credentials,
    leads,
    activities,
    calls,
    orders,
    quotations,
    documents,
    integrations,
    unmetDemands,
  }
}
