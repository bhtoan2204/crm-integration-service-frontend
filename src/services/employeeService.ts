import type { User, UserRole } from '@/models'
import { getDb, nextId, updateDb } from '@/mocks/store'
import { startOfDay } from 'date-fns'
import { delay, MockServiceError } from './delay'

export interface EmployeeStats {
  user: User
  teamName: string
  leads: number
  activeCustomers: number
  completedOrders: number
  callsToday: number
}

export interface EmployeeProfileInput {
  name: string
  email: string
  phone: string
  jobTitle: string
  teamId: string
}

export const employeeService = {
  teamName(teamId: string) {
    return getDb().teams.find((team) => team.id === teamId)?.name ?? '—'
  },

  async list(params: { search?: string; role?: UserRole | 'all'; teamId?: string; status?: 'all' | 'active' | 'inactive' } = {}) {
    await delay()
    const db = getDb()
    const today = startOfDay(new Date()).toISOString()
    return db.users
      .filter((user) => {
        if (params.role && params.role !== 'all' && user.role !== params.role) return false
        if (params.teamId && params.teamId !== 'all' && user.teamId !== params.teamId) return false
        if (params.status && params.status !== 'all' && user.status !== params.status) return false
        if (params.search) {
          const haystack = `${user.name} ${user.email} ${user.phone}`.toLowerCase()
          if (!haystack.includes(params.search.trim().toLowerCase())) return false
        }
        return true
      })
      .map((user): EmployeeStats => {
        const leads = db.leads.filter((lead) => lead.assignedSalesId === user.id)
        return {
          user,
          teamName: db.teams.find((team) => team.id === user.teamId)?.name ?? '—',
          leads: leads.length,
          activeCustomers: leads.filter((lead) => lead.stage !== 'completed' && lead.leadStatus !== 'unmet').length,
          completedOrders: db.orders.filter((order) => order.salesId === user.id && order.status === 'completed').length,
          callsToday: db.calls.filter((call) => call.salesId === user.id && call.startedAt >= today).length,
        }
      })
  },

  async getDetail(id: string) {
    await delay()
    const db = getDb()
    const user = db.users.find((item) => item.id === id)
    if (!user) return null
    const leads = db.leads.filter((lead) => lead.assignedSalesId === id)
    const calls = db.calls.filter((call) => call.salesId === id).sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    const orders = db.orders.filter((order) => order.salesId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return {
      user,
      team: db.teams.find((team) => team.id === user.teamId) ?? null,
      leads,
      calls,
      orders,
    }
  },

  async updateProfile(id: string, input: EmployeeProfileInput) {
    await delay(60)
    updateDb((db) => {
      const user = db.users.find((item) => item.id === id)
      if (!user) return
      user.name = input.name.trim()
      user.email = input.email.trim()
      user.phone = input.phone.trim()
      user.jobTitle = input.jobTitle.trim()
      user.teamId = input.teamId
      const credential = db.credentials.find((item) => item.userId === id)
      if (credential) credential.email = input.email.trim().toLowerCase()
    })
  },

  async create(input: EmployeeProfileInput & { role: UserRole }) {
    await delay(80)
    const id = nextId('user')
    updateDb((db) => {
      db.users.push({
        id,
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        role: input.role,
        teamId: input.teamId,
        jobTitle: input.jobTitle.trim(),
        status: 'active',
      })
      db.credentials.push({
        userId: id,
        email: input.email.trim().toLowerCase(),
        password: 'Sales@123',
      })
    })
    return id
  },
}

export const authService = {
  async login(email: string, password: string) {
    await delay(240)
    const credential = getDb().credentials.find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password,
    )
    if (!credential) throw new MockServiceError('Email hoặc mật khẩu không đúng.')
    const user = getDb().users.find((item) => item.id === credential.userId)
    if (!user) throw new MockServiceError('Không tìm thấy tài khoản.')
    if (user.status !== 'active') throw new MockServiceError('Tài khoản đang ngưng hoạt động.')
    return user
  },

  async requestPasswordReset(email: string) {
    await delay(180)
    const exists = getDb().credentials.some((item) => item.email.toLowerCase() === email.trim().toLowerCase())
    return {
      accepted: true,
      message: exists
        ? 'Nếu tài khoản tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi. Đây là thao tác mô phỏng.'
        : 'Nếu tài khoản tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi. Đây là thao tác mô phỏng.',
    }
  },

  async changePassword(userId: string, currentPassword: string, nextPassword: string) {
    await delay(80)
    const credential = getDb().credentials.find((item) => item.userId === userId)
    if (!credential || credential.password !== currentPassword) {
      throw new MockServiceError('Mật khẩu hiện tại không đúng.')
    }
    if (nextPassword.length < 8) throw new MockServiceError('Mật khẩu mới cần ít nhất 8 ký tự.')
    updateDb((db) => {
      const row = db.credentials.find((item) => item.userId === userId)
      if (row) row.password = nextPassword
    })
  },
}
