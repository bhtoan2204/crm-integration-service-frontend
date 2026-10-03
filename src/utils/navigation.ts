import type { Permission } from '@/utils/permissions'

export interface NavItem {
  to: string
  label: string
  permission: Permission
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/quy-trinh', label: 'Quy trình', permission: 'dashboard.view' },
  { to: '/dashboard', label: 'Tổng quan', permission: 'dashboard.view' },
  { to: '/leads', label: 'Khách hàng tiềm năng', permission: 'leads.view' },
  { to: '/pipeline', label: 'Pipeline', permission: 'pipeline.view' },
  { to: '/calls', label: 'Cuộc gọi', permission: 'calls.view' },
  { to: '/orders', label: 'Đơn hàng', permission: 'orders.view' },
  { to: '/reports', label: 'Báo cáo', permission: 'reports.view' },
  { to: '/employees', label: 'Nhân viên', permission: 'employees.view' },
  { to: '/integrations', label: 'Tích hợp', permission: 'integrations.view' },
  { to: '/settings', label: 'Cài đặt', permission: 'settings.view' },
]
