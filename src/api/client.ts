/**
 * Placeholder for the future HTTP client.
 * Page components must not call this directly.
 * When a backend exists, replace the implementations in `src/services`
 * so they delegate here instead of reading the in-memory mock store.
 */
export async function apiRequest<T>(path: string, _init?: RequestInit): Promise<T> {
  throw new Error(`API chưa được kết nối: ${path}`)
}
