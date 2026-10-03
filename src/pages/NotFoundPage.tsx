import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Không tìm thấy trang</h1>
      <p className="mt-2 text-sm text-muted-foreground">Đường dẫn không khớp với màn hình nào trong CRM.</p>
      <Button asChild className="mt-5">
        <Link to="/dashboard">Về tổng quan</Link>
      </Button>
    </div>
  )
}
