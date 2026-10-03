import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  Columns3,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Phone,
  Plug,
  Route,
  Settings,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { UserAvatar } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/AuthProvider'
import { ROLE_LABEL } from '@/models/labels'
import { NAV_ITEMS } from '@/utils/navigation'
import { cn } from '@/lib/utils'

const ICONS = {
  '/dashboard': LayoutDashboard,
  '/quy-trinh': Route,
  '/leads': Users,
  '/pipeline': Columns3,
  '/calls': Phone,
  '/orders': Package,
  '/reports': BarChart3,
  '/employees': Users,
  '/integrations': Plug,
  '/settings': Settings,
} as const

const TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: '/dashboard', title: 'Tổng quan' },
  { prefix: '/quy-trinh', title: 'Quy trình' },
  { prefix: '/leads', title: 'Khách hàng tiềm năng' },
  { prefix: '/pipeline', title: 'Pipeline' },
  { prefix: '/calls', title: 'Cuộc gọi' },
  { prefix: '/orders', title: 'Đơn hàng' },
  { prefix: '/reports', title: 'Báo cáo' },
  { prefix: '/employees', title: 'Nhân viên' },
  { prefix: '/profile', title: 'Hồ sơ cá nhân' },
  { prefix: '/integrations', title: 'Tích hợp' },
  { prefix: '/settings', title: 'Cài đặt' },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const title = TITLES.find((item) => location.pathname.startsWith(item.prefix))?.title ?? 'LogisCRM'

  return (
    <div className="flex h-full min-h-screen bg-slate-50">
      {open ? <button className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} aria-label="Đóng menu" /> : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-white transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">L</div>
          <div>
            <p className="text-sm font-semibold">LogisCRM</p>
            <p className="text-xs text-muted-foreground">Kinh doanh logistics</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.to as keyof typeof ICONS]
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                    isActive ? 'bg-blue-50 font-medium text-blue-800' : 'text-slate-600 hover:bg-slate-50',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        {user ? (
          <div className="border-t p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-slate-50">
                  <UserAvatar name={user.name} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{user.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserRound className="h-4 w-4" /> Hồ sơ cá nhân
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setConfirmLogout(true)}>
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)}>
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="text-xs text-muted-foreground">CRM nội bộ · dữ liệu mô phỏng</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Thông báo">
                <Bell className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-2 py-1.5 text-xs font-semibold uppercase text-muted-foreground">Thông báo</div>
              <DropdownMenuItem className="items-start whitespace-normal">Lead mới từ tổng đài cần phân công trong hôm nay.</DropdownMenuItem>
              <DropdownMenuItem className="items-start whitespace-normal">Có cuộc gọi nhỡ từ khách hàng đang ở bước báo giá.</DropdownMenuItem>
              <DropdownMenuItem className="items-start whitespace-normal">Một báo giá đã gửi sắp hết hạn theo dõi.</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <ConfirmDialog
        open={confirmLogout}
        title="Đăng xuất"
        description="Bạn sẽ thoát phiên làm việc hiện tại trên trình duyệt này."
        confirmLabel="Đăng xuất"
        onOpenChange={setConfirmLogout}
        onConfirm={logout}
      />
    </div>
  )
}
