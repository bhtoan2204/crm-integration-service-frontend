import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { LeadSource, Priority, User } from '@/models'
import { PRIORITY_LABEL, SOURCE_LABEL } from '@/models/labels'
import { customerService, type LeadInput } from '@/services/customerService'

const EMPTY: LeadInput = {
  name: '',
  phone: '',
  email: '',
  company: '',
  address: '',
  source: 'website',
  assignedSalesId: '',
  priority: 'medium',
  expectedValue: 0,
  notes: '',
  nextFollowUpAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
}

function toInputValue(iso: string) {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function LeadFormDialog({
  open,
  onOpenChange,
  sales,
  initial,
  leadId,
  actorId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sales: User[]
  initial?: LeadInput
  leadId?: string
  actorId: string
}) {
  const [form, setForm] = useState<LeadInput>(EMPTY)

  useEffect(() => {
    if (!open) return
    setForm(initial ?? { ...EMPTY, assignedSalesId: actorId || sales[0]?.id || '' })
    // Reset only when the dialog is opened for a specific lead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId])

  const set = (patch: Partial<LeadInput>) => setForm((current) => ({ ...current, ...patch }))

  const save = async () => {
    if (!form.name.trim() || form.phone.replace(/\D/g, '').length < 9) {
      toast.error('Cần tên khách hàng và số điện thoại hợp lệ.')
      return
    }
    if (!form.assignedSalesId) {
      toast.error('Chọn nhân viên phụ trách.')
      return
    }
    if (leadId) {
      await customerService.update(leadId, form, actorId)
      toast.success('Đã cập nhật khách hàng.')
    } else {
      await customerService.create(form, actorId)
      toast.success('Đã thêm khách hàng.')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{leadId ? 'Sửa khách hàng' : 'Thêm khách hàng'}</DialogTitle>
          <DialogDescription>Thông tin được lưu trong dữ liệu mô phỏng của phiên làm việc.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tên khách hàng"><Input value={form.name} onChange={(event) => set({ name: event.target.value })} /></Field>
          <Field label="Số điện thoại"><Input value={form.phone} onChange={(event) => set({ phone: event.target.value })} /></Field>
          <Field label="Email"><Input value={form.email} onChange={(event) => set({ email: event.target.value })} /></Field>
          <Field label="Công ty"><Input value={form.company} onChange={(event) => set({ company: event.target.value })} /></Field>
          <Field label="Địa chỉ" className="sm:col-span-2"><Input value={form.address} onChange={(event) => set({ address: event.target.value })} /></Field>
          <Field label="Nguồn">
            <Select value={form.source} onValueChange={(value) => set({ source: value as LeadSource })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(SOURCE_LABEL) as LeadSource[]).map((source) => (
                  <SelectItem key={source} value={source}>{SOURCE_LABEL[source]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Mức ưu tiên">
            <Select value={form.priority} onValueChange={(value) => set({ priority: value as Priority })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PRIORITY_LABEL) as Priority[]).map((priority) => (
                  <SelectItem key={priority} value={priority}>{PRIORITY_LABEL[priority]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Sales phụ trách">
            <Select value={form.assignedSalesId} onValueChange={(value) => set({ assignedSalesId: value })}>
              <SelectTrigger><SelectValue placeholder="Chọn nhân viên" /></SelectTrigger>
              <SelectContent>
                {sales.map((person) => (
                  <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Giá trị dự kiến (VND)">
            <Input type="number" value={form.expectedValue} onChange={(event) => set({ expectedValue: Number(event.target.value) })} />
          </Field>
          <Field label="Lần liên hệ tiếp theo" className="sm:col-span-2">
            <Input
              type="datetime-local"
              value={toInputValue(form.nextFollowUpAt)}
              onChange={(event) => set({ nextFollowUpAt: new Date(event.target.value).toISOString() })}
            />
          </Field>
          <Field label="Ghi chú" className="sm:col-span-2">
            <Textarea value={form.notes} onChange={(event) => set({ notes: event.target.value })} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={() => void save()}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  )
}
