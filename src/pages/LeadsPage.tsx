import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Phone, Plus, Upload } from 'lucide-react'
import type { LegacyColumnDef } from '@tanstack/react-table/legacy'
import { toast } from 'sonner'
import { CallDialog } from '@/features/calls/CallDialog'
import { ImportWizard } from '@/features/leads/ImportWizard'
import { LeadFormDialog } from '@/features/leads/LeadFormDialog'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { LeadStatusBadge, PriorityBadge, StageBadge } from '@/components/common/badges'
import { ErrorState, TableSkeleton } from '@/components/common/StateView'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDebouncedValue, useStoreQuery } from '@/hooks/useStoreQuery'
import type { Lead, LeadSource, PipelineStageId } from '@/models'
import { PIPELINE_STAGES, SOURCE_LABEL } from '@/models/labels'
import { customerService } from '@/services/customerService'
import { employeeService } from '@/services/employeeService'
import { downloadCsv, formatDate, formatPhone } from '@/utils/format'

export function LeadsPage() {
  const navigate = useNavigate()
  const { user, can } = useAuth()
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search)
  const [salesId, setSalesId] = useState('all')
  const [stage, setStage] = useState<PipelineStageId | 'all'>('all')
  const [source, setSource] = useState<LeadSource | 'all'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const [callLeadId, setCallLeadId] = useState<string>()

  const leads = useStoreQuery(
    () => customerService.list({ search: debounced, salesId, stage, source, from, to }),
    [debounced, salesId, stage, source, from, to],
  )
  const directory = useStoreQuery(() => employeeService.list(), [])
  const sales = (directory.data ?? []).map((item) => item.user).filter((item) => item.role === 'sales' && item.status === 'active')
  const nameOf = (id: string) => directory.data?.find((item) => item.user.id === id)?.user.name ?? '—'

  const columns = useMemo<LegacyColumnDef<Lead>[]>(
    () => [
      { accessorKey: 'code', header: 'Mã KH' },
      { accessorKey: 'name', header: 'Tên khách hàng', cell: ({ row }) => <div><p className="font-medium">{row.original.name}</p><p className="text-xs text-muted-foreground">{row.original.company}</p></div> },
      { accessorKey: 'company', header: 'Công ty' },
      { accessorKey: 'phone', header: 'Số điện thoại', cell: ({ row }) => formatPhone(row.original.phone) },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'source', header: 'Nguồn', cell: ({ row }) => SOURCE_LABEL[row.original.source] },
      { id: 'sales', header: 'Sales phụ trách', accessorFn: (row) => nameOf(row.assignedSalesId) },
      { accessorKey: 'leadStatus', header: 'Trạng thái', cell: ({ row }) => <LeadStatusBadge status={row.original.leadStatus} /> },
      { accessorKey: 'stage', header: 'Bước hiện tại', cell: ({ row }) => <StageBadge stage={row.original.stage} /> },
      { accessorKey: 'priority', header: 'Ưu tiên', cell: ({ row }) => <PriorityBadge priority={row.original.priority} /> },
      { accessorKey: 'lastContactAt', header: 'Lần liên hệ cuối', cell: ({ row }) => formatDate(row.original.lastContactAt) },
      {
        accessorKey: 'nextFollowUpAt',
        header: 'Lần liên hệ tiếp theo',
        cell: ({ row }) => {
          const overdue = new Date(row.original.nextFollowUpAt).getTime() < Date.now()
          return <span className={overdue ? 'font-medium text-rose-700' : ''}>{formatDate(row.original.nextFollowUpAt)}</span>
        },
      },
      { accessorKey: 'createdAt', header: 'Ngày tạo', cell: ({ row }) => formatDate(row.original.createdAt) },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation()
              setCallLeadId(row.original.id)
              setCallOpen(true)
            }}
          >
            <Phone className="h-3.5 w-3.5" /> Gọi
          </Button>
        ),
      },
    ],
    [directory.data],
  )

  const exportRows = () => {
    const rows = leads.data ?? []
    downloadCsv('khach-hang.csv', [
      ['Mã KH', 'Tên', 'Công ty', 'Điện thoại', 'Email', 'Nguồn', 'Sales', 'Trạng thái', 'Bước', 'Ngày tạo'],
      ...rows.map((lead) => [
        lead.code,
        lead.name,
        lead.company,
        lead.phone,
        lead.email,
        SOURCE_LABEL[lead.source],
        nameOf(lead.assignedSalesId),
        lead.leadStatus,
        lead.stage,
        formatDate(lead.createdAt),
      ]),
    ])
    toast.success(`Đã xuất ${rows.length} dòng.`)
  }

  return (
    <div>
      <PageHeader
        title="Khách hàng tiềm năng"
        description="Danh sách lead nội bộ. Nguồn CRM, Excel hoặc tổng đài sẽ được nối sau."
        actions={
          <>
            <Button variant="outline" onClick={() => (can('calls.dial') ? setCallOpen(true) : toast.error('Bạn không có quyền gọi điện.'))}><Phone className="h-4 w-4" /> Gọi điện</Button>
            <Button variant="outline" onClick={exportRows}><Download className="h-4 w-4" /> Export</Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4" /> Import dữ liệu</Button>
            <Button onClick={() => (can('leads.create') ? setCreateOpen(true) : toast.error('Bạn không có quyền thêm khách hàng.'))}><Plus className="h-4 w-4" /> Thêm khách hàng</Button>
          </>
        }
      />
      <div className="mb-4 grid gap-2 rounded-lg border bg-white p-3 md:grid-cols-2 xl:grid-cols-6">
        <Input className="xl:col-span-2" placeholder="Tìm tên, công ty, số điện thoại..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="h-9 rounded-md border bg-white px-2 text-sm" value={salesId} onChange={(event) => setSalesId(event.target.value)}>
          <option value="all">Mọi nhân viên</option>
          {sales.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-white px-2 text-sm" value={stage} onChange={(event) => setStage(event.target.value as PipelineStageId | 'all')}>
          <option value="all">Mọi bước</option>
          {PIPELINE_STAGES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-white px-2 text-sm" value={source} onChange={(event) => setSource(event.target.value as LeadSource | 'all')}>
          <option value="all">Mọi nguồn</option>
          {(Object.keys(SOURCE_LABEL) as LeadSource[]).map((item) => <option key={item} value={item}>{SOURCE_LABEL[item]}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="date" className="h-9 w-full rounded-md border px-2 text-sm" value={from} onChange={(event) => setFrom(event.target.value)} />
          <input type="date" className="h-9 w-full rounded-md border px-2 text-sm" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
      </div>
      <div className="rounded-lg border bg-white">
        {leads.loading ? <TableSkeleton cols={6} /> : null}
        {leads.error ? <ErrorState message={leads.error} onRetry={leads.reload} /> : null}
        {leads.data ? (
          <DataTable columns={columns} data={leads.data} onRowClick={(row) => navigate(`/leads/${row.id}`)} />
        ) : null}
      </div>
      {user ? (
        <LeadFormDialog open={createOpen} onOpenChange={setCreateOpen} sales={sales} actorId={user.id} />
      ) : null}
      {user ? <ImportWizard open={importOpen} onOpenChange={setImportOpen} sales={sales} actorId={user.id} /> : null}
      <CallDialog open={callOpen} onOpenChange={setCallOpen} customerId={callLeadId} />
    </div>
  )
}
