import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/features/auth/AuthProvider'
import { ROLE_LABEL } from '@/models/labels'
import { authService, employeeService } from '@/services/employeeService'

export function ProfilePage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', jobTitle: '', teamId: '' })
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' })
  const [notify, setNotify] = useState({ lead: true, call: true, quote: false })

  useEffect(() => {
    if (!user) return
    setForm({ name: user.name, email: user.email, phone: user.phone, jobTitle: user.jobTitle, teamId: user.teamId })
  }, [user])

  if (!user) return null
  const teamName = employeeService.teamName(user.teamId)

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <UserAvatar name={form.name || user.name} className="h-16 w-16 text-base" />
          <div>
            <h1 className="text-xl font-semibold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{ROLE_LABEL[user.role]} · {teamName}</p>
            <Button className="mt-2" variant="outline" size="sm" onClick={() => toast.message('Ảnh đại diện sẽ được lưu khi có kho tệp. Hiện chỉ hiển thị chữ cái.')}>Đổi ảnh</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Thông tin cá nhân</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div><Label>Họ tên</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          <div><Label>Email</Label><Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
          <div><Label>Số điện thoại</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
          <div><Label>Chức danh</Label><Input value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Phòng ban / nhóm</Label><Input value={teamName} disabled /></div>
          <div className="sm:col-span-2">
            <Button
              onClick={() => {
                void employeeService.updateProfile(user.id, form).then(() => toast.success('Đã lưu hồ sơ mô phỏng.'))
              }}
            >
              Lưu thông tin
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Đổi mật khẩu</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div><Label>Mật khẩu hiện tại</Label><Input type="password" value={password.current} onChange={(event) => setPassword({ ...password, current: event.target.value })} /></div>
          <div><Label>Mật khẩu mới</Label><Input type="password" value={password.next} onChange={(event) => setPassword({ ...password, next: event.target.value })} /></div>
          <div><Label>Nhập lại</Label><Input type="password" value={password.confirm} onChange={(event) => setPassword({ ...password, confirm: event.target.value })} /></div>
          <div>
            <Button
              variant="outline"
              onClick={() => {
                if (password.next !== password.confirm) {
                  toast.error('Mật khẩu nhập lại không khớp.')
                  return
                }
                void authService.changePassword(user.id, password.current, password.next).then(() => {
                  toast.success('Đã đổi mật khẩu mô phỏng.')
                  setPassword({ current: '', next: '', confirm: '' })
                }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Không đổi được mật khẩu.'))
              }}
            >
              Cập nhật mật khẩu
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Thông báo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Toggle label="Lead mới được giao" checked={notify.lead} onChange={(lead) => setNotify({ ...notify, lead })} />
          <Toggle label="Cuộc gọi nhỡ" checked={notify.call} onChange={(call) => setNotify({ ...notify, call })} />
          <Toggle label="Báo giá sắp hết hạn" checked={notify.quote} onChange={(quote) => setNotify({ ...notify, quote })} />
          <Button variant="outline" onClick={() => toast.success('Đã lưu tùy chọn thông báo trên trình duyệt này.')}>Lưu thông báo</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}
