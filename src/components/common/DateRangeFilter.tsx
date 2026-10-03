import type { DatePreset } from '@/models'
import { cn } from '@/lib/utils'

const DASHBOARD_PRESETS: Array<{ id: DatePreset; label: string }> = [
  { id: 'today', label: 'Hôm nay' },
  { id: '7d', label: '7 ngày' },
  { id: '30d', label: '30 ngày' },
  { id: 'month', label: 'Tháng này' },
  { id: 'custom', label: 'Tùy chọn' },
]

const REPORT_PRESETS: Array<{ id: DatePreset; label: string }> = [
  { id: 'today', label: 'Ngày' },
  { id: 'week', label: 'Tuần' },
  { id: 'month', label: 'Tháng' },
  { id: 'custom', label: 'Tùy chọn' },
]

export function DateRangeFilter({
  preset,
  from,
  to,
  mode = 'dashboard',
  onChange,
}: {
  preset: DatePreset
  from: string
  to: string
  mode?: 'dashboard' | 'report'
  onChange: (next: { preset: DatePreset; from: string; to: string }) => void
}) {
  const options = mode === 'report' ? REPORT_PRESETS : DASHBOARD_PRESETS
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap rounded-lg border bg-white p-1">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={cn(
              'rounded-md px-3 py-1.5 text-sm',
              preset === option.id ? 'bg-primary text-primary-foreground' : 'text-slate-600 hover:bg-slate-50',
            )}
            onClick={() => onChange({ preset: option.id, from, to })}
          >
            {option.label}
          </button>
        ))}
      </div>
      {preset === 'custom' ? (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(event) => onChange({ preset, from: event.target.value, to })}
            className="h-9 rounded-md border bg-white px-2 text-sm"
          />
          <span className="text-sm text-muted-foreground">đến</span>
          <input
            type="date"
            value={to}
            onChange={(event) => onChange({ preset, from, to: event.target.value })}
            className="h-9 rounded-md border bg-white px-2 text-sm"
          />
        </div>
      ) : null}
    </div>
  )
}
