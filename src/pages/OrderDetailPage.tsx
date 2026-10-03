import { Link, useNavigate, useParams } from 'react-router-dom'
import { OrderStatusBadge, StageBadge } from '@/components/common/badges'
import { ErrorState, TableSkeleton } from '@/components/common/StateView'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStoreQuery } from '@/hooks/useStoreQuery'
import { PIPELINE_STAGES, stageIndex } from '@/models/labels'
import { orderService } from '@/services/orderService'
import { formatDate, formatVnd } from '@/utils/format'
import { cn } from '@/lib/utils'

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const detail = useStoreQuery(() => orderService.getDetail(id), [id])

  if (detail.loading) return <TableSkeleton />
  if (detail.error) return <ErrorState message={detail.error} onRetry={detail.reload} />
  if (!detail.data) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p>Không tìm thấy đơn hàng</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate('/orders')}>Quay lại</Button>
      </div>
    )
  }
  const { order, lead, sales } = detail.data
  const current = stageIndex(order.stage)

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{order.code}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <StageBadge stage={order.stage} />
          </div>
          <p><span className="text-muted-foreground">Khách: </span>{lead ? <Link className="font-medium text-primary" to={`/leads/${lead.id}`}>{lead.name}</Link> : '—'}</p>
          <p><span className="text-muted-foreground">Công ty: </span>{lead?.company}</p>
          <p><span className="text-muted-foreground">Sales: </span>{sales?.name}</p>
          <p><span className="text-muted-foreground">Dịch vụ: </span>{order.service} · {order.shipmentType}</p>
          <p><span className="text-muted-foreground">Tuyến: </span>{order.origin} → {order.destination}</p>
          <p><span className="text-muted-foreground">Khối lượng: </span>{order.weightKg.toLocaleString('vi-VN')} kg · {order.volumeCbm} cbm</p>
          <p><span className="text-muted-foreground">Giá trị: </span>{formatVnd(order.amount)}</p>
          <p><span className="text-muted-foreground">Tạo ngày: </span>{formatDate(order.createdAt)}</p>
          <p><span className="text-muted-foreground">Dự kiến giao: </span>{formatDate(order.expectedDeliveryAt)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Dòng thời gian vận hành</CardTitle></CardHeader>
        <CardContent>
          {order.status === 'cancelled' ? <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">Đơn đã hủy. Các mốc bên dưới giữ lại để đối chiếu.</p> : null}
          <ol className="space-y-0">
            {PIPELINE_STAGES.map((stage, index) => {
              const state = order.status === 'cancelled' ? 'muted' : index < current ? 'done' : index === current ? 'current' : 'todo'
              return (
                <li key={stage.id} className="grid grid-cols-[20px_1fr] gap-3">
                  <div className="flex flex-col items-center">
                    <span className={cn('mt-1 h-3 w-3 rounded-full', state === 'done' && 'bg-emerald-600', state === 'current' && 'bg-primary ring-4 ring-blue-100', state === 'todo' && 'bg-slate-300', state === 'muted' && 'bg-slate-300')} />
                    {index < PIPELINE_STAGES.length - 1 ? <span className="w-px flex-1 bg-slate-200" /> : null}
                  </div>
                  <div className="pb-4">
                    <p className={cn('text-sm font-medium', state === 'todo' && 'text-muted-foreground')}>{stage.order}. {stage.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {state === 'done' ? 'Đã qua' : state === 'current' ? 'Đang thực hiện' : 'Chưa tới'}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
