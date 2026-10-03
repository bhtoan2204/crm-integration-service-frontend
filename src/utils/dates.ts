import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns'
import type { DatePreset } from '@/models'

export interface ResolvedRange {
  start: Date
  end: Date
  previousStart: Date
  previousEnd: Date
}

export function resolveRange(preset: DatePreset, from?: string, to?: string): ResolvedRange {
  const now = new Date()
  let start = startOfDay(subDays(now, 29))
  let end = endOfDay(now)

  if (preset === 'today') {
    start = startOfDay(now)
    end = endOfDay(now)
  } else if (preset === '7d') {
    start = startOfDay(subDays(now, 6))
  } else if (preset === '30d') {
    start = startOfDay(subDays(now, 29))
  } else if (preset === 'week') {
    start = startOfWeek(now, { weekStartsOn: 1 })
    end = endOfDay(now)
  } else if (preset === 'month') {
    start = startOfMonth(now)
    end = endOfDay(now)
  } else if (preset === 'custom') {
    start = from ? startOfDay(parseISO(from)) : start
    end = to ? endOfDay(parseISO(to)) : end
  }

  const length = Math.max(end.getTime() - start.getTime(), 24 * 3600 * 1000)
  const previousEnd = new Date(start.getTime() - 1)
  const previousStart = new Date(previousEnd.getTime() - length)

  return { start, end, previousStart, previousEnd }
}

export function inRange(iso: string, start: Date, end: Date) {
  return isWithinInterval(parseISO(iso), { start, end })
}

export function startOfTodayIso() {
  return startOfDay(new Date()).toISOString()
}

export function weekRange(date = new Date()) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  }
}

export function monthRange(date = new Date()) {
  return { start: startOfMonth(date), end: endOfMonth(date) }
}

export function dayKey(iso: string) {
  const date = parseISO(iso)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function eachDay(start: Date, end: Date) {
  const days: Date[] = []
  const cursor = startOfDay(start)
  const last = startOfDay(end)
  while (cursor.getTime() <= last.getTime()) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}
