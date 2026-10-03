import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatPercent } from '@/utils/format'

export function MetricCard({
  label,
  value,
  hint,
  change,
}: {
  label: string
  value: string
  hint?: string
  change?: number
}) {
  const positive = (change ?? 0) >= 0
  return (
    <Card>
      <CardContent className="p-4">
        <p className="min-h-8 text-xs font-medium leading-4 text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        <div className="mt-2 flex items-start justify-between gap-3 text-xs text-muted-foreground">
          <span>{hint}</span>
          {change !== undefined && Math.abs(change) <= 300 ? (
            <span className={cn('shrink-0 font-medium', positive ? 'text-emerald-700' : 'text-rose-700')}>
              {positive ? '+' : ''}
              {formatPercent(change)}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
