import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LegacyColumnDef } from '@tanstack/react-table/legacy'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { OrderStatusBadge, StageBadge } from '@/components/common/badges'
import { ErrorState, TableSkeleton } from '@/components/common/StateView'
import { Input } from '@/components/ui/input'
import { useDebouncedValue, useStoreQuery } from '@/hooks/useStoreQuery'
import type { Order, OrderStatus } from '@/models'
import { ORDER_STATUS_LABEL } from '@/models/labels'
import { customerService } from '@/services/customerService'
import { employeeService } from '@/services/employeeService'
import { orderService } from '@/services/orderService'
import { formatDate, formatVnd } from '@/utils/format'

export function OrdersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search)
  const [salesId, setSalesId] = useState('all')
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const orders = useStoreQuery(() => orderService.list({ search: debounced, salesId, status, from, to }), [debounced, salesId, status, from, to])
  const leads = useStoreQuery(() => customerService.list(), [])
  const directory = useStoreQuery(() => employeeService.list(), [])
  const leadOf = (id: string) => leads.data?.find((lead) => lead.id === id)
  const salesName = (id: string) => directory.data?.find((item) => item.user.id === id)?.user.name ?? '—'

  const columns = useMemo<LegacyColumnDef<Order>[]>(
    () => [
      { accessorKey: 'code', header: 'Mã đơn' },
      {
        id: 'customer',
        header: 'Khách hàng',
        accessorFn: (row) => leadOf(row.customerId)?.name ?? '',
        cell: ({ row }) => {
          const lead = leadOf(row.original.customerId)
          return lead ? <div><p className="font-medium">{lead.name}</p><p className="text-xs text-muted-foreground">{lead.company}</p></div> : '—'
        },
      },
      { id: 'sales', header: 'Nhân viên', accessorFn: (row) => salesName(row.salesId) },
      { accessorKey: 'origin', header: 'Điểm đi' },
      { accessorKey: 'destination', header: 'Điểm đến' },
      { accessorKey: 'service', header: 'Dịch vụ' },
      { accessorKey: 'amount', header: 'Giá trị', cell: ({ row }) => formatVnd(row.original.amount) },
      { accessorKey: 'stage', header: 'Bước hiện tại', cell: ({ row }) => <StageBadge stage={row.original.stage} /> },
      { accessorKey: 'createdAt', header: 'Ngày tạo', cell: ({ row }) => formatDate(row.original.createdAt) },
      { accessorKey: 'expectedDeliveryAt', header: 'Ngày giao dự kiến', cell: ({ row }) => formatDate(row.original.expectedDeliveryAt) },
      { accessorKey: 'status', header: 'Trạng thái', cell: ({ row }) => <OrderStatusBadge status={row.original.status} /> },
    ],
    [leads.data, directory.data],
  )

  return (
    <div>
      <PageHeader title="Đơn hàng" description="Đơn vận chuyển gắn với khách hàng. Bấm một dòng để xem dòng thời gian logistics." />
      <div className="mb-4 grid gap-2 rounded-lg border bg-white p-3 md:grid-cols-2 xl:grid-cols-5">
        <Input className="xl:col-span-2" placeholder="Tìm mã đơn, khách, tuyến" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="h-9 rounded-md border bg-white px-2 text-sm" value={salesId} onChange={(event) => setSalesId(event.target.value)}>
          <option value="all">Mọi nhân viên</option>
          {(directory.data ?? []).filter((item) => item.user.role === 'sales').map((item) => <option key={item.user.id} value={item.user.id}>{item.user.name}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-white px-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value as OrderStatus | 'all')}>
          <option value="all">Mọi trạng thái</option>
          {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((item) => <option key={item} value={item}>{ORDER_STATUS_LABEL[item]}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="date" className="h-9 w-full rounded-md border px-2 text-sm" value={from} onChange={(event) => setFrom(event.target.value)} />
          <input type="date" className="h-9 w-full rounded-md border px-2 text-sm" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
      </div>
      <div className="rounded-lg border bg-white">
        {orders.loading ? <TableSkeleton /> : null}
        {orders.error ? <ErrorState message={orders.error} onRetry={orders.reload} /> : null}
        {orders.data ? <DataTable columns={columns} data={orders.data} onRowClick={(row) => navigate(`/orders/${row.id}`)} /> : null}
      </div>
    </div>
  )
}
