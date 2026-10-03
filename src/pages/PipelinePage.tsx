import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState } from '@/components/common/StateView'
import { PriorityBadge, StageBadge } from '@/components/common/badges'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDebouncedValue, useStoreQuery } from '@/hooks/useStoreQuery'
import type { PipelineStageId } from '@/models'
import { PIPELINE_STAGES, STAGE_BAR } from '@/models/labels'
import { customerService } from '@/services/customerService'
import { employeeService } from '@/services/employeeService'
import { formatDate, formatVnd } from '@/utils/format'
import { cn } from '@/lib/utils'

export function PipelinePage() {
  const navigate = useNavigate()
  const { user, can } = useAuth()
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search)
  const [salesId, setSalesId] = useState('all')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const board = useStoreQuery(() => customerService.board(), [])
  const directory = useStoreQuery(() => employeeService.list(), [])
  const sales = (directory.data ?? []).filter((item) => item.user.role === 'sales')

  const cards = (board.data ?? []).filter((card) => {
    const haystack = `${card.lead.name} ${card.lead.company} ${card.salesName}`.toLowerCase()
    if (debounced && !haystack.includes(debounced.toLowerCase())) return false
    if (salesId !== 'all' && card.lead.assignedSalesId !== salesId) return false
    return true
  })

  const move = async (leadId: string, stage: PipelineStageId) => {
    if (!user || !can('pipeline.move')) {
      toast.error('Bạn không có quyền chuyển bước.')
      return
    }
    const changed = await customerService.updateStage(leadId, stage, user.id)
    if (changed) {
      const lead = board.data?.find((card) => card.lead.id === leadId)?.lead
      toast.success(`Đã chuyển ${lead?.name ?? 'khách hàng'} sang bước mới.`)
    }
  }

  return (
    <div>
      <PageHeader
        title="Pipeline bán hàng"
        description="Kéo thả để đổi bước. Thao tác chỉ cập nhật dữ liệu mô phỏng."
        actions={
          <div className="flex gap-2">
            <Input placeholder="Tìm khách hoặc công ty" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className="h-9 rounded-md border bg-white px-2 text-sm" value={salesId} onChange={(event) => setSalesId(event.target.value)}>
              <option value="all">Mọi nhân viên</option>
              {sales.map((item) => <option key={item.user.id} value={item.user.id}>{item.user.name}</option>)}
            </select>
          </div>
        }
      />
      {board.error ? <ErrorState message={board.error} onRetry={board.reload} /> : null}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const column = cards.filter((card) => card.lead.stage === stage.id)
          return (
            <section
              key={stage.id}
              className="w-72 shrink-0 rounded-lg border bg-slate-100/70"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const leadId = event.dataTransfer.getData('text/plain')
                if (leadId) void move(leadId, stage.id)
              }}
            >
              <header className="border-b bg-white px-3 py-2">
                <div className={cn('mb-2 h-1 rounded-full', STAGE_BAR[stage.id])} />
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">{stage.name}</h2>
                  <span className="rounded-full bg-slate-100 px-2 text-xs">{column.length}</span>
                </div>
              </header>
              <div className="space-y-2 p-2">
                {column.length === 0 ? <p className="px-2 py-6 text-center text-xs text-muted-foreground">Chưa có khách hàng</p> : null}
                {column.map((card) => (
                  <article
                    key={card.lead.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData('text/plain', card.lead.id)}
                    className="cursor-grab rounded-lg border bg-white p-3 shadow-sm active:cursor-grabbing"
                  >
                    <button type="button" className="text-left" onClick={() => navigate(`/leads/${card.lead.id}`)}>
                      <p className="font-medium">{card.lead.name}</p>
                      <p className="text-xs text-muted-foreground">{card.lead.company}</p>
                    </button>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <PriorityBadge priority={card.lead.priority} />
                      <StageBadge stage={card.lead.stage} className="hidden" />
                    </div>
                    <dl className="mt-2 space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between gap-2"><dt>Sales</dt><dd className="text-right">{card.salesName}</dd></div>
                      <div className="flex justify-between gap-2"><dt>Giá trị</dt><dd>{formatVnd(card.lead.expectedValue)}</dd></div>
                      <div className="flex justify-between gap-2"><dt>Hoạt động cuối</dt><dd className="max-w-[9rem] truncate text-right">{card.lastActivity}</dd></div>
                      <div className="flex justify-between gap-2"><dt>Liên hệ tiếp</dt><dd>{formatDate(card.lead.nextFollowUpAt)}</dd></div>
                    </dl>
                    {card.rejectedQuotes > 0 ? <p className="mt-2 text-xs text-rose-700">Có {card.rejectedQuotes} báo giá bị từ chối, lịch sử vẫn giữ.</p> : null}
                    {stage.id === 'quotation' ? (
                      <button
                        type="button"
                        className="mt-2 text-xs font-medium text-rose-700"
                        onClick={() => setRejectId(card.lead.id)}
                      >
                        Khách hàng không đồng ý
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </div>
      <ConfirmDialog
        open={Boolean(rejectId)}
        title="Khách hàng không đồng ý"
        description="Khách sẽ được chuyển về Đang chăm sóc. Báo giá hiện tại chuyển sang từ chối và không bị xóa."
        confirmLabel="Chuyển về chăm sóc"
        destructive
        onOpenChange={(open) => { if (!open) setRejectId(null) }}
        onConfirm={() => {
          if (!rejectId || !user) return
          void customerService.rejectQuotation(rejectId, user.id).then(() => {
            toast.success('Đã chuyển khách về Đang chăm sóc. Lịch sử báo giá được giữ nguyên.')
          })
        }}
      />
    </div>
  )
}
