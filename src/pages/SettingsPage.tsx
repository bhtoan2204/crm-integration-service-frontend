import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/AuthProvider'
import { PIPELINE_STAGES, ROLE_LABEL } from '@/models/labels'
import { dataService } from '@/services/dataService'
import { PERMISSION_LABEL, PERMISSIONS, ROLE_PERMISSIONS } from '@/utils/permissions'
import type { UserRole } from '@/models'

export function SettingsPage() {
  const { can } = useAuth()
  const [company, setCompany] = useState({ name: 'Đơn vị kinh doanh logistics', phone: '1900 0000', email: 'crm@noibo.vn' })

  return (
    <div className="space-y-4">
      <PageHeader title="Cài đặt" description="Thiết lập hiển thị của bản prototype. Phân quyền thật sẽ được gắn khi có backend." />
      <Card>
        <CardHeader><CardTitle>Thông tin đơn vị</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div><Label>Tên hiển thị</Label><Input value={company.name} onChange={(event) => setCompany({ ...company, name: event.target.value })} /></div>
          <div><Label>Điện thoại</Label><Input value={company.phone} onChange={(event) => setCompany({ ...company, phone: event.target.value })} /></div>
          <div><Label>Email liên hệ</Label><Input value={company.email} onChange={(event) => setCompany({ ...company, email: event.target.value })} /></div>
          <div>
            <Button
              onClick={() => {
                if (!can('settings.manage')) {
                  toast.error('Chỉ quản trị viên được lưu cài đặt hệ thống.')
                  return
                }
                toast.success('Đã lưu cài đặt mô phỏng trên phiên này.')
              }}
            >
              Lưu
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Pipeline</CardTitle></CardHeader>
        <CardContent>
          <ol className="grid gap-2 sm:grid-cols-2">
            {PIPELINE_STAGES.map((stage) => (
              <li key={stage.id} className="rounded-md border px-3 py-2 text-sm">{stage.order}. {stage.name}</li>
            ))}
          </ol>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Ma trận phân quyền</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-3">Quyền</th>
                {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => <th key={role} className="px-3 py-3">{ROLE_LABEL[role]}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((permission) => (
                <tr key={permission} className="border-b">
                  <td className="px-3 py-2">{PERMISSION_LABEL[permission]}</td>
                  {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => (
                    <td key={role} className="px-3 py-2">{ROLE_PERMISSIONS[role].includes(permission) ? 'Có' : '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Dữ liệu mẫu</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Khôi phục lại dữ liệu mô phỏng ban đầu của phiên làm việc. Thao tác này không gọi máy chủ.</p>
          <Button
            variant="outline"
            onClick={() => {
              if (!can('settings.manage')) {
                toast.error('Chỉ quản trị viên được khôi phục dữ liệu mẫu.')
                return
              }
              dataService.reset()
              toast.success('Đã khôi phục dữ liệu mẫu.')
            }}
          >
            Khôi phục dữ liệu mẫu
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
