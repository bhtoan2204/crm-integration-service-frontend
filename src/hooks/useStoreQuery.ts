import { useEffect, useState } from 'react'
import { subscribeStore } from '@/mocks/store'

export function useStoreQuery<T>(query: () => Promise<T>, deps: readonly unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => subscribeStore(() => setTick((value) => value + 1)), [])

  useEffect(() => {
    let active = true
    setError(null)
    setLoading((current) => (data === null ? true : current))
    query()
      .then((result) => {
        if (!active) return
        setData(result)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // The caller passes an explicit dependency list for the query closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = () => setTick((value) => value + 1)

  return { data, loading: loading && data === null, refreshing: loading && data !== null, error, reload }
}

export function useDebouncedValue<T>(value: T, delayMs = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}
