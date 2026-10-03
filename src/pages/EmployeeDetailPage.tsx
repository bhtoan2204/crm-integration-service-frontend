import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { LegacyColumnDef } from '@tanstack/react-table/legacy'
import { DataTable } from '@/components/common/DataTable'
import { MetricCard } from '@/components/common/MetricCard'
import { UserAvatar } from '@/components/common/PageHeader'
import { ErrorState, TableSkeleton } from '@/components/common/StateView'
import { StageBadge } from '@/components/common/badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStoreQuery } from '@/hooks/useStoreQuery'
import type { Lead, Order } from '@/models'
import { CALL_RESULT_LABEL, ROLE_LABEL } from '@/models/labels'
import { employeeService } from '@/services/employeeService'
import { formatDateTime, formatDuration, formatDurationClock, formatNumber, formatPercent, formatPhone, formatVnd } from '@/utils/format'
import { eachDay } from '@/utils/dates'
import { format, parseISO, startOfDay, subDays } from 'date-fns'

export function EmployeeDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const detail = useStoreQuery(() => employeeService.getDetail(id), [id])

  const series = useMemo(() => {
    if (!detail.data) return []
    const days = eachDay(subDays(new Date(), 13), new Date())
    return days.map((day) => {
      const start = startOfDay(day).getTime()
      const end = start + 86_400_000
      const calls = detail.data!.calls.filter((call) => {
        const time = parseISO(call.startedAt).getTime()
        return time >= start && time < end
      })
      const leads = detail.data!.leads.filter((lead) => {
        const time = parseISO(lead.createdAt).getTime()
        return time >= start && time < end
      })
      return {
        label: format(day, 'dd/MM'),
        calls: calls.length,
        minutes: Math.round(calls.reduce((sum, call) => sum + call.durationSeconds, 0) / 60),
        leads: leads.length,
      }
    })
  }, [detail.data])

  if (detail.loading) return <TableSkeleton />
  if (detail.error) return <ErrorState message={detail.error} onRetry={detail.reload} />
  if (!detail.data) {
    return <div className="rounded-lg border bg-white p-8 text-center"><p>Không tìm thấy nhân viên</p><Button className="mt-4" onClick={() => navigate('/employees')}>Quay lại</Button></div>
  }

  const { user, team, leads, calls, orders } = detail.data
  const completed = orders.filter((order) => order.status === 'completed').length
  const bookings = orders.filter((order) => order.status !== 'cancelled' && order.status !== 'processing').length
  const duration = calls.reduce((sum, call) => sum + call.durationSeconds, 0)
  const responses = leads.map((lead) => lead.firstResponseMinutes).filter((value) => value > 0)
  const avgResponse = responses.length ? responses.reduce((sum, value) => sum + value, 0) / responses.length : 0
  const conversion = leads.length ? (completed / leads.length) * 100 : 0

  const leadColumns: LegacyColumnDef<Lead>[] = [
    { accessorKey: 'code', header: 'Mã' },
    { accessorKey: 'name', header: 'Khách hàng' },
    { accessorKey: 'company', header: 'Công ty' },
    { accessorKey: 'stage', header: 'Bước', cell: ({ row }) => <StageBadge stage={row.original.stage} /> },
    { accessorKey: 'expectedValue', header: 'Giá trị', cell: ({ row }) => formatVnd(row.original.expectedValue) },
  ]
  const orderColumns: LegacyColumnDef<Order>[] = [
    { accessorKey: 'code', header: 'Mã đơn' },
    { accessorKey: 'origin', header: 'Điểm đi' },
    { accessorKey: 'destination', header: 'Điểm đến' },
    { accessorKey: 'amount', header: 'Giá trị', cell: ({ row }) => formatVnd(row.original.amount) },
    { accessorKey: 'status', header: 'Trạng thái' },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <UserAvatar name={user.name} className="h-16 w-16 text-base" />
          <div>
            <h1 className="text-xl font-semibold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.jobTitle}</p>
            <p className="mt-1 text-sm">{user.email} · {formatPhone(user.phone)}</p>
            <p className="text-sm text-muted-foreground">{ROLE_LABEL[user.role]} · {team?.name ?? '—'} · {user.status === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động'}</p>
          </div>
        </CardContent>
      </Card>
      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="calls">Cuộc gọi</TabsTrigger>
          <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
          <TabsTrigger value="performance">Hiệu suất</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Lead phụ trách" value={formatNumber(leads.length)} />
            <MetricCard label="Cuộc gọi" value={formatNumber(calls.length)} />
            <MetricCard label="Thời gian gọi" value={formatDuration(duration)} />
            <MetricCard label="Đơn hoàn thành" value={formatNumber(completed)} />
            <MetricCard label="Booking" value={formatNumber(bookings)} />
            <MetricCard label="Tỷ lệ chuyển đổi" value={formatPercent(conversion)} hint="Đơn hoàn thành / lead phụ trách" />
            <MetricCard label="Phản hồi trung bình" value={`${formatNumber(avgResponse, 1)} phút`} />
          </div>
        </TabsContent>
        <TabsContent value="leads">
          <div className="rounded-lg border bg-white">
            <DataTable columns={leadColumns} data={leads} onRowClick={(row) => navigate(`/leads/${row.id}`)} />
          </div>
        </TabsContent>
        <TabsContent value="calls">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>{['Thời gian', 'Khách hàng', 'Chiều', 'Thời lượng', 'Kết quả'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}</tr>
                </thead>
                <tbody>
                  {calls.map((call) => {
                    const lead = leads.find((item) => item.id === call.customerId)
                    return (
                      <tr key={call.id} className="border-b">
                        <td className="px-3 py-3">{formatDateTime(call.startedAt)}</td>
                        <td className="px-3 py-3">{lead ? <Link className="text-primary" to={`/leads/${lead.id}`}>{lead.name}</Link> : call.phone}</td>
                        <td className="px-3 py-3">{call.direction === 'inbound' ? 'Gọi đến' : 'Gọi đi'}</td>
                        <td className="px-3 py-3">{formatDurationClock(call.durationSeconds)}</td>
                        <td className="px-3 py-3">{CALL_RESULT_LABEL[call.result]}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="orders">
          <div className="rounded-lg border bg-white">
            <DataTable columns={orderColumns} data={orders} onRowClick={(row) => navigate(`/orders/${row.id}`)} />
          </div>
        </TabsContent>
        <TabsContent value="performance">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Cuộc gọi và phút gọi</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="calls" name="Cuộc gọi" fill="#1d4e89" />
                    <Bar yAxisId="right" dataKey="minutes" name="Phút gọi" fill="#d97706" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Lead mới theo ngày</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="leads" name="Lead" fill="#0f766e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <MetricCard label="Booking" value={formatNumber(bookings)} hint="Đơn đã qua bước xử lý ban đầu" />
            <MetricCard label="Đơn hoàn thành" value={formatNumber(completed)} />
            <MetricCard label="Tỷ lệ chuyển đổi" value={formatPercent(conversion)} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
