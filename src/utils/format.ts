import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

export function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)
}

export function formatPercent(value: number, digits = 1) {
  return `${new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)}%`
}

export function formatDate(iso: string) {
  return format(parseISO(iso), 'dd/MM/yyyy', { locale: vi })
}

export function formatDateTime(iso: string) {
  return format(parseISO(iso), 'dd/MM/yyyy HH:mm', { locale: vi })
}

export function formatTime(iso: string) {
  return format(parseISO(iso), 'HH:mm', { locale: vi })
}

export function formatDayLabel(iso: string) {
  return format(parseISO(iso), 'dd/MM', { locale: vi })
}

export function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.round(seconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const remain = safe % 60
  if (hours > 0) {
    return `${hours} giờ ${String(minutes).padStart(2, '0')} phút`
  }
  return `${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`
}

export function formatDurationClock(seconds: number) {
  const safe = Math.max(0, Math.round(seconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const remain = safe % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  return phone
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return `${first}${last}`.toUpperCase()
}

const AVATAR_COLORS = [
  'bg-sky-100 text-sky-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-violet-100 text-violet-800',
  'bg-rose-100 text-rose-800',
  'bg-teal-100 text-teal-800',
  'bg-indigo-100 text-indigo-800',
]

export function avatarTone(name: string) {
  const sum = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function formatMetric(value: number, unit?: string) {
  if (unit === 'vnd') return formatVnd(value)
  if (unit === 'percent') return formatPercent(value)
  if (unit === 'seconds') return formatDuration(value)
  if (unit === 'minutes') return `${formatNumber(value, 1)} phút`
  return formatNumber(value)
}

export function changePercent(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}
