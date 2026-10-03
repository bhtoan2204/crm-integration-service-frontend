import type { UserRole } from '@/models'

export const PERMISSIONS = [
  'dashboard.view',
  'leads.view',
  'leads.create',
  'leads.import',
  'leads.export',
  'pipeline.view',
  'pipeline.move',
  'calls.view',
  'calls.dial',
  'orders.view',
  'reports.view',
  'employees.view',
  'employees.manage',
  'integrations.view',
  'integrations.configure',
  'settings.view',
  'settings.manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]

const SALES_PERMISSIONS: Permission[] = [
  'dashboard.view',
  'leads.view',
  'leads.create',
  'leads.import',
  'leads.export',
  'pipeline.view',
  'pipeline.move',
  'calls.view',
  'calls.dial',
  'orders.view',
  'reports.view',
  'employees.view',
  'integrations.view',
  'settings.view',
]

const MANAGER_PERMISSIONS: Permission[] = [
  ...SALES_PERMISSIONS,
  'employees.manage',
  'integrations.configure',
]

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [...PERMISSIONS],
  manager: MANAGER_PERMISSIONS,
  sales: SALES_PERMISSIONS,
}

export const PERMISSION_LABEL: Record<Permission, string> = {
  'dashboard.view': 'Xem tổng quan',
  'leads.view': 'Xem khách hàng',
  'leads.create': 'Thêm khách hàng',
  'leads.import': 'Nhập dữ liệu',
  'leads.export': 'Xuất dữ liệu',
  'pipeline.view': 'Xem pipeline',
  'pipeline.move': 'Chuyển bước pipeline',
  'calls.view': 'Xem cuộc gọi',
  'calls.dial': 'Gọi điện',
  'orders.view': 'Xem đơn hàng',
  'reports.view': 'Xem báo cáo',
  'employees.view': 'Xem nhân viên',
  'employees.manage': 'Quản lý nhân viên',
  'integrations.view': 'Xem tích hợp',
  'integrations.configure': 'Cấu hình tích hợp',
  'settings.view': 'Xem cài đặt',
  'settings.manage': 'Sửa cài đặt hệ thống',
}

export function can(role: UserRole | undefined, permission: Permission) {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}
