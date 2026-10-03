import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { LegacyColumnDef } from '@tanstack/react-table/legacy'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader, UserAvatar } from '@/components/common/PageHeader'
import { ErrorState, TableSkeleton } from '@/components/common/StateView'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDebouncedValue, useStoreQuery } from '@/hooks/useStoreQuery'
import type { UserRole } from '@/models'
import { ROLE_LABEL } from '@/models/labels'
import { employeeService, type EmployeeStats } from '@/services/employeeService'

export function EmployeesPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search)
  const [role, setRole] = useState<UserRole | 'all'>('all')
  const [teamId, setTeamId] = useState('all')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', jobTitle: 'Nhân viên kinh doanh', teamId: 't-north', role: 'sales' as UserRole })
  const employees = useStoreQuery(() => employeeService.list({ search: debounced, role, teamId, status }), [debounced, role, teamId, status])
  const teams = Array.from(new Map((employees.data ?? []).map((item) => [item.user.teamId, item.teamName])).entries())

  const columns = useMemo<LegacyColumnDef<EmployeeStats>[]>(
    () => [
      { id: 'avatar', header: '', enableSorting: false, cell: ({ row }) => <UserAvatar name={row.original.user.name} /> },
      { id: 'name', header: 'Tên', accessorFn: (row) => row.user.name, cell: ({ row }) => <div><p className="font-medium">{row.original.user.name}</p><p className="text-xs text-muted-foreground">{row.original.user.jobTitle}</p></div> },
      { id: 'email', header: 'Email', accessorFn: (row) => row.user.email },
      { id: 'role', header: 'Vai trò', accessorFn: (row) => ROLE_LABEL[row.user.role] },
      { accessorKey: 'teamName', header: 'Nhóm' },
      { accessorKey: 'leads', header: 'Leads' },
      { accessorKey: 'activeCustomers', header: 'Khách đang xử lý' },
      { accessorKey: 'completedOrders', header: 'Đơn hoàn thành' },
      { accessorKey: 'callsToday', header: 'Cuộc gọi hôm nay' },
      { id: 'status', header: 'Trạng thái', accessorFn: (row) => row.user.status, cell: ({ row }) => row.original.user.status === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động' },
    ],
    [],
  )

  return (
    <div>
      <PageHeader
        title="Nhân viên"
        description="Danh sách người dùng nội bộ và số liệu đang phụ trách."
        actions={
          <Button onClick={() => (can('employees.manage') ? setOpen(true) : toast.error('Bạn không có quyền thêm nhân viên.'))}>
            <Plus className="h-4 w-4" /> Thêm nhân viên
          </Button>
        }
      />
      <div className="mb-4 grid gap-2 rounded-lg border bg-white p-3 md:grid-cols-4">
        <Input placeholder="Tìm tên, email, số điện thoại" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="h-9 rounded-md border bg-white px-2 text-sm" value={role} onChange={(event) => setRole(event.target.value as UserRole | 'all')}>
          <option value="all">Mọi vai trò</option>
          {(Object.keys(ROLE_LABEL) as UserRole[]).map((item) => <option key={item} value={item}>{ROLE_LABEL[item]}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-white px-2 text-sm" value={teamId} onChange={(event) => setTeamId(event.target.value)}>
          <option value="all">Mọi nhóm</option>
          {teams.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-white px-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value as 'all' | 'active' | 'inactive')}>
          <option value="all">Mọi trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Ngưng hoạt động</option>
        </select>
      </div>
      <div className="rounded-lg border bg-white">
        {employees.loading ? <TableSkeleton /> : null}
        {employees.error ? <ErrorState message={employees.error} onRetry={employees.reload} /> : null}
        {employees.data ? <DataTable columns={columns} data={employees.data} onRowClick={(row) => navigate(`/employees/${row.user.id}`)} /> : null}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm nhân viên</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Họ tên</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
            <div><Label>Số điện thoại</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
            <div><Label>Chức danh</Label><Input value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} /></div>
            <div>
              <Label>Vai trò</Label>
              <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as UserRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(ROLE_LABEL) as UserRole[]).map((item) => <SelectItem key={item} value={item}>{ROLE_LABEL[item]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nhóm</Label>
              <Select value={form.teamId} onValueChange={(value) => setForm({ ...form, teamId: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="t-north">Kinh doanh miền Bắc</SelectItem>
                  <SelectItem value="t-south">Kinh doanh miền Nam</SelectItem>
                  <SelectItem value="t-cs">Chăm sóc khách hàng</SelectItem>
                  <SelectItem value="t-exec">Ban điều hành</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!form.name || !form.email) {
                  toast.error('Cần họ tên và email.')
                  return
                }
                void employeeService.create(form).then(() => {
                  toast.success('Đã thêm nhân viên. Mật khẩu mô phỏng mặc định là Sales@123.')
                  setOpen(false)
                })
              }}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
