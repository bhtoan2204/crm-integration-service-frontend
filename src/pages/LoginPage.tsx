import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/AuthProvider'
import { authService } from '@/services/employeeService'

const DEMOS = [
  { role: 'Quản trị viên', email: 'admin@logiscrm.vn', password: 'Admin@123' },
  { role: 'Quản lý', email: 'bao.tran@logiscrm.vn', password: 'Manager@123' },
  { role: 'Nhân viên kinh doanh', email: 'khoi.pham@logiscrm.vn', password: 'Sales@123' },
]

export function LoginPage() {
  const { user, ready, login, rememberedEmail } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(rememberedEmail)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(Boolean(rememberedEmail))
  const [submitting, setSubmitting] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')

  useEffect(() => {
    if (rememberedEmail) {
      setEmail(rememberedEmail)
      setRemember(true)
    }
  }, [rememberedEmail])

  if (!ready) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Đang tải...</div>
  if (user) return <Navigate to="/dashboard" replace />

  const submit = async () => {
    setSubmitting(true)
    try {
      await login(email, password, remember)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không đăng nhập được.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div>
          <p className="text-sm font-medium text-blue-100">LogisCRM</p>
          <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight">CRM nội bộ cho đội kinh doanh logistics</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-blue-100">
            Theo dõi lead, pipeline chứng từ, cuộc gọi và đơn vận chuyển trên một màn hình. Dữ liệu nhà cung cấp sẽ được nối sau.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-white/10 p-3">
            <p className="text-2xl font-semibold">14</p>
            <p className="text-blue-100">bước pipeline</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3">
            <p className="text-2xl font-semibold">3</p>
            <p className="text-blue-100">vai trò nội bộ</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3">
            <p className="text-2xl font-semibold">0</p>
            <p className="text-blue-100">nhà cung cấp đã chốt</p>
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold">Đăng nhập</h2>
          <p className="mt-1 text-sm text-muted-foreground">Dùng tài khoản nội bộ để vào bảng điều hành.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email / tên đăng nhập</Label>
              <Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@congty.vn" autoComplete="username" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={remember} onCheckedChange={(value) => setRemember(value === true)} />
                Ghi nhớ đăng nhập
              </label>
              <button type="button" className="text-sm font-medium text-primary" onClick={() => setForgotOpen(true)}>
                Quên mật khẩu
              </button>
            </div>
            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
          <div className="mt-6 rounded-lg border bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">Tài khoản mô phỏng</p>
            <div className="mt-2 space-y-2">
              {DEMOS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  className="flex w-full items-center justify-between rounded-md bg-white px-3 py-2 text-left text-sm hover:bg-slate-100"
                  onClick={() => {
                    setEmail(demo.email)
                    setPassword(demo.password)
                  }}
                >
                  <span>{demo.role}</span>
                  <span className="text-xs text-muted-foreground">{demo.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quên mật khẩu</DialogTitle>
            <DialogDescription>Nhập email tài khoản. Hệ thống chưa gửi email thật trong giai đoạn prototype.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email">Email</Label>
            <Input id="forgot-email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                void authService.requestPasswordReset(forgotEmail).then((result) => {
                  toast.success(result.message)
                  setForgotOpen(false)
                })
              }}
            >
              Gửi hướng dẫn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
