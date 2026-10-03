import { useEffect, useState } from 'react'
import { Phone } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/features/auth/AuthProvider'
import type { CallResult, CallStatus, Lead } from '@/models'
import { CALL_RESULT_LABEL, CALL_STATUS_LABEL } from '@/models/labels'
import { callService } from '@/services/callService'
import { customerService } from '@/services/customerService'
import { telephonyProvider } from '@/services/integrationService'
import { formatDurationClock, formatPhone } from '@/utils/format'

export function CallDialog({
  open,
  onOpenChange,
  customerId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId?: string
}) {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Lead[]>([])
  const [selectedId, setSelectedId] = useState(customerId ?? '')
  const [phase, setPhase] = useState<'ready' | 'calling' | 'wrap'>('ready')
  const [seconds, setSeconds] = useState(0)
  const [status, setStatus] = useState<CallStatus>('answered')
  const [result, setResult] = useState<CallResult>('interested')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!open) return
    setPhase('ready')
    setSeconds(0)
    setStatus('answered')
    setResult('interested')
    setSelectedId(customerId ?? '')
    void customerService.list().then(setCustomers)
  }, [open, customerId])

  useEffect(() => {
    if (phase !== 'calling') return
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  const customer = customers.find((item) => item.id === selectedId)

  const start = async () => {
    if (!customer || !user) return
    const session = await telephonyProvider.startCall({
      phone: customer.phone,
      customerId: customer.id,
      salesId: user.id,
    })
    setMessage(session.message)
    setPhase('calling')
  }

  const save = async () => {
    if (!customer || !user) return
    await callService.create({
      customerId: customer.id,
      salesId: user.id,
      phone: customer.phone,
      direction: 'outbound',
      durationSeconds: status === 'answered' ? Math.max(seconds, 1) : 0,
      status,
      result: status === 'missed' ? 'no_answer' : result,
    })
    toast.success('Đã lưu cuộc gọi mô phỏng vào lịch sử.')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gọi điện</DialogTitle>
          <DialogDescription>
            Cuộc gọi sẽ được thực hiện qua tổng đài bên ngoài. Nhà cung cấp chưa được kết nối, nên phiên này chỉ mô phỏng và ghi vào dữ liệu cục bộ.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Khách hàng</Label>
            <Select value={selectedId} onValueChange={setSelectedId} disabled={phase !== 'ready'}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn khách hàng" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} · {item.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm">
            <p className="text-muted-foreground">Số điện thoại</p>
            <p className="font-medium">{customer ? formatPhone(customer.phone) : '—'}</p>
          </div>
          {phase === 'calling' ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-4 text-center">
              <Phone className="mx-auto h-5 w-5 text-emerald-700" />
              <p className="mt-2 text-2xl font-semibold tabular-nums">{formatDurationClock(seconds)}</p>
              <p className="text-sm text-emerald-800">{message || 'Đang mô phỏng cuộc gọi...'}</p>
            </div>
          ) : null}
          {phase === 'wrap' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as CallStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CALL_STATUS_LABEL) as CallStatus[]).map((item) => (
                      <SelectItem key={item} value={item}>{CALL_STATUS_LABEL[item]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Kết quả</Label>
                <Select value={result} onValueChange={(value) => setResult(value as CallResult)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CALL_RESULT_LABEL) as CallResult[]).map((item) => (
                      <SelectItem key={item} value={item}>{CALL_RESULT_LABEL[item]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          {phase === 'ready' ? (
            <Button onClick={() => void start()} disabled={!customer}>Bắt đầu gọi</Button>
          ) : null}
          {phase === 'calling' ? <Button onClick={() => setPhase('wrap')}>Kết thúc</Button> : null}
          {phase === 'wrap' ? <Button onClick={() => void save()}>Lưu cuộc gọi</Button> : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
