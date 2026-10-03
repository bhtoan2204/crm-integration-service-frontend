import type { CallLog } from './types'

export interface ConnectionTestResult {
  ok: boolean
  message: string
}

export interface SyncResult {
  imported: number
  updated: number
  skipped: number
}

/**
 * Generic CRM connector. The concrete vendor is unknown, so pages depend on
 * this contract and a mock implementation until a provider is chosen.
 */
export interface CRMProvider {
  id: string
  name: string
  isConfigured: boolean
  testConnection(): Promise<ConnectionTestResult>
  syncCustomers(): Promise<SyncResult>
}

/**
 * Generic telephony / virtual call-center connector.
 * Call history, duration and agent identity are expected to arrive from this API later.
 */
export interface TelephonyProvider {
  id: string
  name: string
  isConfigured: boolean
  testConnection(): Promise<ConnectionTestResult>
  getCalls(params?: { from?: string; to?: string; salesId?: string }): Promise<CallLog[]>
  startCall(input: { phone: string; customerId?: string; salesId: string }): Promise<{
    sessionId: string
    status: 'simulated' | 'connected'
    message: string
  }>
}
