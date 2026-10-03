import type { CallLog, IntegrationDraft, IntegrationType } from '@/models'
import type { CRMProvider, TelephonyProvider } from '@/models/providers'
import { getDb } from '@/mocks/store'
import { delay, MockServiceError } from './delay'

export class MockCRMProvider implements CRMProvider {
  id = 'mock-crm'
  name = 'CRM bên ngoài'
  isConfigured = false

  async testConnection() {
    await delay(200)
    return {
      ok: false,
      message: 'Chưa cấu hình. Kết nối CRM bên ngoài sẽ được gắn khi nhà cung cấp được chốt.',
    }
  }

  async syncCustomers() {
    await delay(200)
    if (!this.isConfigured) {
      throw new MockServiceError('Chưa cấu hình CRM.')
    }
    return { imported: 0, updated: 0, skipped: 0 }
  }
}

export class MockTelephonyProvider implements TelephonyProvider {
  id = 'mock-telephony'
  name = 'Tổng đài'
  isConfigured = false

  async testConnection() {
    await delay(200)
    return {
      ok: false,
      message: 'Chưa cấu hình tổng đài. Lịch sử cuộc gọi hiện đang dùng dữ liệu mô phỏng.',
    }
  }

  async getCalls(params?: { from?: string; to?: string; salesId?: string }) {
    await delay()
    return getDb().calls.filter((call) => {
      if (params?.salesId && call.salesId !== params.salesId) return false
      if (params?.from && call.startedAt.slice(0, 10) < params.from) return false
      if (params?.to && call.startedAt.slice(0, 10) > params.to) return false
      return true
    })
  }

  async startCall(input: { phone: string; customerId?: string; salesId: string }) {
    await delay(120)
    return {
      sessionId: `sim-${Date.now()}`,
      status: 'simulated' as const,
      message: `Cuộc gọi tới ${input.phone} đang được mô phỏng. Tổng đài bên ngoài chưa kết nối.`,
    }
  }
}

export const crmProvider: CRMProvider = new MockCRMProvider()
export const telephonyProvider: TelephonyProvider = new MockTelephonyProvider()

export const integrationService = {
  async list() {
    await delay()
    return getDb().integrations
  },

  async test(type: IntegrationType, _draft: IntegrationDraft) {
    await delay(220)
    if (type === 'crm') return crmProvider.testConnection()
    if (type === 'telephony') return telephonyProvider.testConnection()
    return {
      ok: false,
      message: 'Kênh này chưa được cấu hình. Thông tin xác thực không được lưu.',
    }
  },

  async syncCrm() {
    return crmProvider.syncCustomers()
  },

  async getCalls(): Promise<CallLog[]> {
    return telephonyProvider.getCalls()
  },
}
