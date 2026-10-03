import { useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DateRangeFilter } from '@/components/common/DateRangeFilter'
import { MetricCard } from '@/components/common/MetricCard'
import { PageHeader } from '@/components/common/PageHeader'
import { CardSkeleton, ErrorState } from '@/components/common/StateView'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useStoreQuery } from '@/hooks/useStoreQuery'
import type { DatePreset } from '@/models'
import { employeeService } from '@/services/employeeService'
import { reportService } from '@/services/reportService'
import { formatDuration, formatMetric, formatNumber, formatPercent } from '@/utils/format'

export function ReportsPage() {
  const [preset, setPreset] = useState<DatePreset>('month')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [teamId, setTeamId] = useState('all')
  const [employeeId, setEmployeeId] = useState('all')
  const report = useStoreQuery(() => reportService.getSummary({ preset, from, to, teamId, employeeId }), [preset, from, to, teamId, employeeId])
  const directory = useStoreQuery(() => employeeService.list(), [])
  const teams = Array.from(new Map((directory.data ?? []).map((item) => [item.user.teamId, item.teamName])).entries())

  return (
    <div>
      <PageHeader
        title="Báo cáo"
        description="Các chỉ số được tính từ dữ liệu mô phỏng. Bảng nhân viên chỉ hiển thị số liệu, không gắn nhận định tốt hay chưa tốt."
        actions={
          <DateRangeFilter
            mode="report"
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
      <div className="mb-4 flex flex-wrap gap-2">
        <select className="h-9 rounded-md border bg-white px-2 text-sm" value={teamId} onChange={(event) => setTeamId(event.target.value)}>
          <option value="all">Mọi nhóm</option>
          {teams.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-white px-2 text-sm" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
          <option value="all">Mọi nhân viên</option>
          {(directory.data ?? []).filter((item) => item.user.role === 'sales').map((item) => <option key={item.user.id} value={item.user.id}>{item.user.name}</option>)}
        </select>
      </div>
      {report.loading ? <div className="grid gap-3 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <CardSkeleton key={index} />)}</div> : null}
      {report.error ? <ErrorState message={report.error} onRetry={report.reload} /> : null}
      {report.data ? (
        <div className="space-y-4">
          <Section title="Cuộc gọi" description={report.data.rangeLabel}>
            {report.data.callMetrics.map((metric) => <MetricCard key={metric.id} label={metric.label} value={formatMetric(metric.value, metric.unit)} hint={metric.hint} />)}
          </Section>
          <Section title="Khách hàng">
            {report.data.customerMetrics.map((metric) => <MetricCard key={metric.id} label={metric.label} value={formatMetric(metric.value, metric.unit)} hint={metric.hint} />)}
          </Section>
          <Section title="Đơn hàng">
            {report.data.orderMetrics.map((metric) => <MetricCard key={metric.id} label={metric.label} value={formatMetric(metric.value, metric.unit)} hint={metric.hint} />)}
          </Section>
          <Section title="Thời gian phản hồi">
            {report.data.responseMetrics.map((metric) => <MetricCard key={metric.id} label={metric.label} value={formatMetric(metric.value, metric.unit)} hint={metric.hint} />)}
          </Section>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cuộc gọi theo thời gian</CardTitle>
                <CardDescription>Cột xanh là số cuộc gọi, cột vàng là phút gọi.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.data.callTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="calls" name="Số cuộc gọi" fill="#1d4e89" />
                    <Bar yAxisId="right" dataKey="minutes" name="Phút gọi" fill="#d97706" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Yêu cầu không đáp ứng</CardTitle>
                <CardDescription>{formatNumber(report.data.unmetTotal)} yêu cầu trong kỳ, chia theo lý do.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.data.unmetByReason} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="label" width={180} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Số yêu cầu" fill="#be123c" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Bảng số liệu nhân viên</CardTitle>
              <CardDescription>Sắp theo số đơn hoàn thành trong kỳ. Không có cột đánh giá định tính.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    {['Nhân viên', 'Nhóm', 'Cuộc gọi', 'Thời gian gọi', 'Lead', 'Booking', 'Đơn hoàn thành', 'Tỷ lệ chuyển đổi', 'Phản hồi TB'].map((head) => (
                      <th key={head} className="px-3 py-3">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...report.data.ranking].sort((a, b) => b.completed - a.completed).map((row) => (
                    <tr key={row.salesId} className="border-b">
                      <td className="px-3 py-3 font-medium">{row.name}</td>
                      <td className="px-3 py-3">{row.teamName}</td>
                      <td className="px-3 py-3">{formatNumber(row.calls)}</td>
                      <td className="px-3 py-3">{formatDuration(row.durationSeconds)}</td>
                      <td className="px-3 py-3">{formatNumber(row.leads)}</td>
                      <td className="px-3 py-3">{formatNumber(row.bookings)}</td>
                      <td className="px-3 py-3">{formatNumber(row.completed)}</td>
                      <td className="px-3 py-3">{formatPercent(row.conversionRate)}</td>
                      <td className="px-3 py-3">{formatNumber(row.avgResponseMinutes, 1)} phút</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tỷ lệ chuyển đổi theo mốc</CardTitle>
              <CardDescription>Đơn hoàn thành chia cho lead mới của từng mốc thời gian.</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.data.conversionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Tỷ lệ']} />
                  <Line type="monotone" dataKey="conversion" name="Tỷ lệ chuyển đổi" stroke="#0f766e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">{title}{description ? <span className="ml-2 font-normal text-muted-foreground">{description}</span> : null}</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  )
}
