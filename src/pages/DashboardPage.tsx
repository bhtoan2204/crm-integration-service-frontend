import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangeFilter } from '@/components/common/DateRangeFilter'
import { CardSkeleton, ErrorState } from '@/components/common/StateView'
import { MetricCard } from '@/components/common/MetricCard'
import { PageHeader } from '@/components/common/PageHeader'
import { useStoreQuery } from '@/hooks/useStoreQuery'
import type { DatePreset } from '@/models'
import { reportService } from '@/services/reportService'
import { formatDuration, formatMetric, formatNumber, formatPercent, formatVnd } from '@/utils/format'

export function DashboardPage() {
  const [preset, setPreset] = useState<DatePreset>('30d')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const query = useStoreQuery(
    () => reportService.getDashboard({ preset, from, to }),
    [preset, from, to],
  )

  return (
    <div>
      <Link
        to="/quy-trinh"
        className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950"
      >
        <span>Muốn xem khách đi từ bước nào sang bước nào? Mở sơ đồ quy trình, viết bằng lời thường.</span>
        <span className="shrink-0 font-medium">Xem quy trình</span>
      </Link>
      <PageHeader
        title="Tổng quan kinh doanh"
        description={query.data ? `Số liệu ${query.data.rangeLabel.toLowerCase()}. Phễu khách hàng là ảnh chụp pipeline hiện tại.` : 'Đang tổng hợp số liệu mô phỏng.'}
        actions={
          <DateRangeFilter
            preset={preset}
            from={from}
            to={to}
            onChange={(next) => {
              setPreset(next.preset)
              setFrom(next.from)
              setTo(next.to)
            }}
          />
        }
      />
      {query.loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <CardSkeleton key={index} />)}
        </div>
      ) : null}
      {query.error ? <ErrorState message={query.error} onRetry={query.reload} /> : null}
      {query.data ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {query.data.metrics.map((metric) => (
              <MetricCard
                key={metric.id}
                label={metric.label}
                value={formatMetric(metric.value, metric.unit)}
                hint={metric.hint}
                change={metric.changePercent}
              />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Phễu bán hàng</CardTitle>
                <CardDescription>Số khách hàng đang đứng ở từng bước pipeline.</CardDescription>
              </CardHeader>
              <CardContent className="h-[520px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={query.data.funnel} layout="vertical" margin={{ left: 24, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={168} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [`${value} khách`, 'Số lượng']} />
                    <Bar dataKey="count" name="Số khách" fill="#1d4e89" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng lead</CardTitle>
                <CardDescription>Lead mới và khách hoàn thành theo ngày trong kỳ.</CardDescription>
              </CardHeader>
              <CardContent className="h-[520px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={query.data.leadTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="newLeads" name="Lead mới" stroke="#1d4e89" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="completed" name="Khách hoàn thành" stroke="#0f766e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động cuộc gọi</CardTitle>
              <CardDescription>Số cuộc gọi và tổng phút gọi của từng nhân viên trong kỳ. Hai trục vì đơn vị khác nhau.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={query.data.callActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="calls" name="Số cuộc gọi" fill="#1d4e89" radius={4} />
                  <Bar yAxisId="right" dataKey="minutes" name="Phút gọi" fill="#d97706" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Hiệu suất kinh doanh</CardTitle>
              <CardDescription>Số liệu trong kỳ. Tỷ lệ chuyển đổi = đơn hoàn thành / lead mới của nhân viên.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    {['Nhân viên', 'Leads', 'Calls', 'Thời gian gọi', 'Báo giá', 'Booking', 'Completed', 'Conversion rate'].map((head) => (
                      <th key={head} className="px-3 py-3 font-semibold">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {query.data.performance.map((row) => (
                    <tr key={row.salesId} className="border-b">
                      <td className="px-3 py-3 font-medium">{row.name}</td>
                      <td className="px-3 py-3">{formatNumber(row.leads)}</td>
                      <td className="px-3 py-3">{formatNumber(row.calls)}</td>
                      <td className="px-3 py-3">{formatDuration(row.durationSeconds)}</td>
                      <td className="px-3 py-3">{formatNumber(row.quotations)}</td>
                      <td className="px-3 py-3">{formatNumber(row.bookings)}</td>
                      <td className="px-3 py-3">{formatNumber(row.completed)}</td>
                      <td className="px-3 py-3">{formatPercent(row.conversionRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-3 py-3 text-xs text-muted-foreground">Doanh thu dự kiến đang mở: các lead chưa hoàn thành trong kỳ được cộng ở thẻ KPI ({formatVnd(query.data.metrics.find((metric) => metric.id === 'revenue')?.value ?? 0)}).</p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
