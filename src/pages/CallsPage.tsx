import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone } from 'lucide-react'
import type { LegacyColumnDef } from '@tanstack/react-table/legacy'
import { CallDialog } from '@/features/calls/CallDialog'
import { DataTable } from '@/components/common/DataTable'
import { MetricCard } from '@/components/common/MetricCard'
import { PageHeader } from '@/components/common/PageHeader'
import { CallResultText, CallStatusBadge } from '@/components/common/badges'
import { ErrorState, TableSkeleton } from '@/components/common/StateView'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useDebouncedValue, useStoreQuery } from '@/hooks/useStoreQuery'
import type { CallDirection, CallLog, CallResult } from '@/models'
import { CALL_DIRECTION_LABEL, CALL_RESULT_LABEL } from '@/models/labels'
import { callService } from '@/services/callService'
import { customerService } from '@/services/customerService'
import { employeeService } from '@/services/employeeService'
import { formatDateTime, formatDuration, formatDurationClock, formatPhone } from '@/utils/format'

export function CallsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search)
  const [salesId, setSalesId] = useState('all')
  const [direction, setDirection] = useState<CallDirection | 'all'>('all')
  const [result, setResult] = useState<CallResult | 'all'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [open, setOpen] = useState(false)
  const [recording, setRecording] = useState<CallLog | null>(null)
  const calls = useStoreQuery(
    () => callService.list({ search: debounced, salesId, direction, result, from, to }),
    [debounced, salesId, direction, result, from, to],
  )
  const leads = useStoreQuery(() => customerService.list(), [])
  const directory = useStoreQuery(() => employeeService.list(), [])
  const leadOf = (id: string) => leads.data?.find((lead) => lead.id === id)
  const salesName = (id: string) => directory.data?.find((item) => item.user.id === id)?.user.name ?? '—'
  const rows = calls.data ?? []
  const success = rows.filter((call) => call.status === 'answered').length
  const missed = rows.filter((call) => call.status === 'missed').length
  const duration = rows.reduce((sum, call) => sum + call.durationSeconds, 0)

  const columns = useMemo<LegacyColumnDef<CallLog>[]>(
    () => [
      { accessorKey: 'startedAt', header: 'Ngày giờ', cell: ({ row }) => formatDateTime(row.original.startedAt) },
      {
        id: 'customer',
        header: 'Khách hàng',
        accessorFn: (row) => leadOf(row.customerId)?.name ?? '',
        cell: ({ row }) => {
          const lead = leadOf(row.original.customerId)
          return lead ? <button type="button" className="text-left font-medium text-primary" onClick={(event) => { event.stopPropagation(); navigate(`/leads/${lead.id}`) }}>{lead.name}</button> : '—'
        },
      },
      { accessorKey: 'phone', header: 'SĐT', cell: ({ row }) => formatPhone(row.original.phone) },
      { id: 'sales', header: 'Nhân viên', accessorFn: (row) => salesName(row.salesId) },
      { accessorKey: 'direction', header: 'Inbound / Outbound', cell: ({ row }) => CALL_DIRECTION_LABEL[row.original.direction] },
      { accessorKey: 'status', header: 'Trạng thái', cell: ({ row }) => <CallStatusBadge status={row.original.status} /> },
      { accessorKey: 'durationSeconds', header: 'Thời lượng', cell: ({ row }) => formatDurationClock(row.original.durationSeconds) },
      { accessorKey: 'result', header: 'Kết quả', cell: ({ row }) => <CallResultText result={row.original.result} /> },
      {
        id: 'recording',
        header: 'Recording',
        enableSorting: false,
        cell: ({ row }) => row.original.recordingUrl ? (
          <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); setRecording(row.original) }}>Nghe</Button>
        ) : '—',
      },
    ],
    [leads.data, directory.data],
  )

  return (
    <div>
      <PageHeader
        title="Cuộc gọi"
        description="Lịch sử đang lấy từ lớp mô phỏng. Khi tổng đài được chốt, telephonyService.getCalls() sẽ đọc API bên ngoài."
        actions={<Button onClick={() => setOpen(true)}><Phone className="h-4 w-4" /> Gọi điện</Button>}
      />
      <Card className="mb-4">
        <CardContent className="p-4 text-sm text-slate-600">
          Dữ liệu cuộc gọi, thời lượng và nhân viên thực hiện sẽ được đồng bộ từ nhà cung cấp tổng đài. Hiện trạng tích hợp: chưa kết nối.
        </CardContent>
      </Card>
      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Tổng cuộc gọi" value={String(rows.length)} hint="Theo bộ lọc hiện tại" />
        <MetricCard label="Cuộc gọi thành công" value={String(success)} hint="Trạng thái nghe máy" />
        <MetricCard label="Cuộc gọi không nghe" value={String(missed)} />
        <MetricCard label="Tổng thời lượng" value={formatDuration(duration)} />
        <MetricCard label="Thời lượng trung bình" value={rows.length ? formatDuration(duration / rows.length) : '00:00'} />
      </div>
      <div className="mb-4 grid gap-2 rounded-lg border bg-white p-3 md:grid-cols-2 xl:grid-cols-6">
        <Input className="xl:col-span-2" placeholder="Tìm khách, số điện thoại, nhân viên" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="h-9 rounded-md border bg-white px-2 text-sm" value={salesId} onChange={(event) => setSalesId(event.target.value)}>
          <option value="all">Mọi nhân viên</option>
          {(directory.data ?? []).filter((item) => item.user.role === 'sales').map((item) => <option key={item.user.id} value={item.user.id}>{item.user.name}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-white px-2 text-sm" value={direction} onChange={(event) => setDirection(event.target.value as CallDirection | 'all')}>
          <option value="all">Mọi chiều gọi</option>
          {(Object.keys(CALL_DIRECTION_LABEL) as CallDirection[]).map((item) => <option key={item} value={item}>{CALL_DIRECTION_LABEL[item]}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-white px-2 text-sm" value={result} onChange={(event) => setResult(event.target.value as CallResult | 'all')}>
          <option value="all">Mọi kết quả</option>
          {(Object.keys(CALL_RESULT_LABEL) as CallResult[]).map((item) => <option key={item} value={item}>{CALL_RESULT_LABEL[item]}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="date" className="h-9 w-full rounded-md border px-2 text-sm" value={from} onChange={(event) => setFrom(event.target.value)} />
          <input type="date" className="h-9 w-full rounded-md border px-2 text-sm" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
      </div>
      <div className="rounded-lg border bg-white">
        {calls.loading ? <TableSkeleton /> : null}
        {calls.error ? <ErrorState message={calls.error} onRetry={calls.reload} /> : null}
        {calls.data ? <DataTable columns={columns} data={calls.data} /> : null}
      </div>
      <CallDialog open={open} onOpenChange={setOpen} />
      <Dialog open={Boolean(recording)} onOpenChange={() => setRecording(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ghi âm mô phỏng</DialogTitle></DialogHeader>
          <p className="text-sm">Thời lượng {recording ? formatDurationClock(recording.durationSeconds) : '—'}. File thật sẽ đến từ API tổng đài.</p>
          <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full w-2/5 rounded-full bg-primary" /></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
