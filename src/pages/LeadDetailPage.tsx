import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MoreHorizontal, Phone, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { CallDialog } from '@/features/calls/CallDialog'
import { LeadFormDialog } from '@/features/leads/LeadFormDialog'
import { CallResultText, CallStatusBadge, DocumentStatusBadge, PriorityBadge, QuoteStatusBadge, StageBadge } from '@/components/common/badges'
import { ErrorState, TableSkeleton } from '@/components/common/StateView'
import { UserAvatar } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/AuthProvider'
import { useStoreQuery } from '@/hooks/useStoreQuery'
import type { DocumentCategory, UnmetReason } from '@/models'
import { ACTIVITY_LABEL, DOCUMENT_CATEGORY_LABEL, ORDER_STATUS_LABEL, SOURCE_LABEL, UNMET_REASON_LABEL, stageName } from '@/models/labels'
import { activityService, documentService } from '@/services/documentService'
import { customerService } from '@/services/customerService'
import { employeeService } from '@/services/employeeService'
import { quotationService } from '@/services/quotationService'
import { formatDate, formatDateTime, formatDurationClock, formatPhone, formatTime, formatVnd } from '@/utils/format'

export function LeadDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const detail = useStoreQuery(() => customerService.getDetail(id), [id])
  const directory = useStoreQuery(() => employeeService.list(), [])
  const [callOpen, setCallOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [unmetOpen, setUnmetOpen] = useState(false)
  const [note, setNote] = useState('')
  const [amount, setAmount] = useState(0)
  const [quoteNote, setQuoteNote] = useState('')
  const [reason, setReason] = useState<UnmetReason>('price')
  const [unmetNote, setUnmetNote] = useState('')
  const [filename, setFilename] = useState('Chung-tu.pdf')
  const [category, setCategory] = useState<DocumentCategory>('other')
  const [recording, setRecording] = useState<string | null>(null)

  if (detail.loading) return <TableSkeleton />
  if (detail.error) return <ErrorState message={detail.error} onRetry={detail.reload} />
  if (!detail.data || !user) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="font-medium">Không tìm thấy khách hàng</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate('/leads')}>Quay lại danh sách</Button>
      </div>
    )
  }

  const { lead, sales, activities, calls, orders, quotations, documents } = detail.data
  const salesUsers = (directory.data ?? []).map((item) => item.user).filter((item) => item.role === 'sales')
  const latest = activities[0]
  const nameOf = (personId: string) => directory.data?.find((item) => item.user.id === personId)?.user.name ?? '—'

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <UserAvatar name={lead.name} className="h-12 w-12 text-sm" />
            <div>
              <h1 className="text-xl font-semibold">{lead.name}</h1>
              <p className="text-sm text-muted-foreground">{lead.company}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StageBadge stage={lead.stage} />
                <PriorityBadge priority={lead.priority} />
                <span className="text-sm text-muted-foreground">Phụ trách: {sales?.name ?? '—'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setCallOpen(true)}><Phone className="h-4 w-4" /> Gọi điện</Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Sửa khách hàng</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setNoteOpen(true)}>Thêm ghi chú</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setAmount(lead.expectedValue); setQuoteOpen(true) }}>Tạo báo giá</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setUnmetOpen(true)}>Đánh dấu không đáp ứng</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="activity">Hoạt động</TabsTrigger>
          <TabsTrigger value="calls">Cuộc gọi</TabsTrigger>
          <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
          <TabsTrigger value="quotes">Báo giá</TabsTrigger>
          <TabsTrigger value="documents">Chứng từ</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Thông tin khách hàng</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
                <Info label="Mã khách hàng" value={lead.code} />
                <Info label="Tên" value={lead.name} />
                <Info label="Số điện thoại" value={formatPhone(lead.phone)} />
                <Info label="Email" value={lead.email} />
                <Info label="Công ty" value={lead.company} />
                <Info label="Địa chỉ" value={lead.address} />
                <Info label="Nguồn" value={SOURCE_LABEL[lead.source]} />
                <Info label="Ngày tạo" value={formatDateTime(lead.createdAt)} />
                <Info label="Sales phụ trách" value={sales?.name ?? '—'} />
                <Info label="Bước hiện tại" value={stageName(lead.stage)} />
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Việc gần nhất</CardTitle></CardHeader>
                <CardContent className="text-sm">
                  <p className="font-medium">{latest ? latest.title : 'Chưa có hoạt động'}</p>
                  <p className="mt-1 text-muted-foreground">{latest?.description}</p>
                  <p className="mt-3 text-xs uppercase text-muted-foreground">Việc tiếp theo</p>
                  <p className="mt-1">{formatDateTime(lead.nextFollowUpAt)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Ghi chú</CardTitle></CardHeader>
                <CardContent className="text-sm text-slate-700">{lead.notes || 'Chưa có ghi chú.'}</CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="activity">
          <Card>
            <CardContent className="space-y-4 p-5">
              {activities.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có hoạt động.</p> : null}
              {activities.map((activity) => (
                <div key={activity.id} className="grid grid-cols-[88px_1fr] gap-3 border-b pb-3 text-sm last:border-0">
                  <p className="text-muted-foreground">{formatTime(activity.createdAt)}<span className="block text-xs">{formatDate(activity.createdAt)}</span></p>
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-muted-foreground">{activity.description}</p>
                    <p className="mt-1 text-xs text-slate-500">{ACTIVITY_LABEL[activity.type]} · {nameOf(activity.actorId)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calls">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>{['Thời gian', 'Nhân viên', 'Số điện thoại', 'Chiều', 'Thời lượng', 'Kết quả', 'Ghi âm'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}</tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr key={call.id} className="border-b">
                      <td className="px-3 py-3">{formatDateTime(call.startedAt)}</td>
                      <td className="px-3 py-3">{nameOf(call.salesId)}</td>
                      <td className="px-3 py-3">{formatPhone(call.phone)}</td>
                      <td className="px-3 py-3">{call.direction === 'inbound' ? 'Gọi đến' : 'Gọi đi'}</td>
                      <td className="px-3 py-3">{formatDurationClock(call.durationSeconds)}</td>
                      <td className="px-3 py-3"><CallStatusBadge status={call.status} /> <CallResultText result={call.result} /></td>
                      <td className="px-3 py-3">{call.recordingUrl ? <Button size="sm" variant="outline" onClick={() => setRecording(call.recordingUrl ?? null)}>Nghe</Button> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="orders">
          <div className="grid gap-3">
            {orders.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted-foreground">Chưa có đơn hàng.</CardContent></Card> : null}
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <Info label="Mã đơn" value={<Link className="font-medium text-primary" to={`/orders/${order.id}`}>{order.code}</Link>} />
                  <Info label="Dịch vụ" value={order.service} />
                  <Info label="Điểm đi" value={order.origin} />
                  <Info label="Điểm đến" value={order.destination} />
                  <Info label="Loại hàng" value={order.shipmentType} />
                  <Info label="Khối lượng" value={`${order.weightKg.toLocaleString('vi-VN')} kg`} />
                  <Info label="Thể tích" value={`${order.volumeCbm} cbm`} />
                  <Info label="Giá ước tính" value={formatVnd(order.estimatedPrice)} />
                  <Info label="Trạng thái" value={ORDER_STATUS_LABEL[order.status]} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="quotes">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>{['Mã báo giá', 'Giá trị', 'Người tạo', 'Ngày tạo', 'Trạng thái', 'Phiên bản'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}</tr>
                </thead>
                <tbody>
                  {quotations.length === 0 ? <tr><td className="px-3 py-6 text-muted-foreground" colSpan={6}>Chưa có báo giá.</td></tr> : null}
                  {quotations.map((quote) => (
                    <tr key={quote.id} className="border-b">
                      <td className="px-3 py-3 font-medium">{quote.code}</td>
                      <td className="px-3 py-3">{formatVnd(quote.amount)}</td>
                      <td className="px-3 py-3">{nameOf(quote.createdById)}</td>
                      <td className="px-3 py-3">{formatDate(quote.createdAt)}</td>
                      <td className="px-3 py-3"><QuoteStatusBadge status={quote.status} /></td>
                      <td className="px-3 py-3">v{quote.version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex-row items-end justify-between gap-3">
              <CardTitle>Chứng từ</CardTitle>
              <div className="flex flex-wrap items-end gap-2">
                <Input className="w-48" value={filename} onChange={(event) => setFilename(event.target.value)} />
                <Select value={category} onValueChange={(value) => setCategory(value as DocumentCategory)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DOCUMENT_CATEGORY_LABEL) as DocumentCategory[]).map((item) => (
                      <SelectItem key={item} value={item}>{DOCUMENT_CATEGORY_LABEL[item]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    void documentService.addMock({ customerId: lead.id, filename, category, actorId: user.id }).then(() => {
                      toast.success('Đã ghi nhận tệp mô phỏng. Chưa có kho lưu trữ thật.')
                    })
                  }}
                >
                  Thêm tệp
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>{['Tệp', 'Loại', 'Ngày tải', 'Người tải', 'Trạng thái'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}</tr>
                </thead>
                <tbody>
                  {documents.map((document) => (
                    <tr key={document.id} className="border-b">
                      <td className="px-3 py-3">{document.filename}<span className="block text-xs text-muted-foreground">{document.sizeKb} KB</span></td>
                      <td className="px-3 py-3">{DOCUMENT_CATEGORY_LABEL[document.category]}</td>
                      <td className="px-3 py-3">{formatDate(document.uploadedAt)}</td>
                      <td className="px-3 py-3">{nameOf(document.uploadedById)}</td>
                      <td className="px-3 py-3"><DocumentStatusBadge status={document.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <CallDialog open={callOpen} onOpenChange={setCallOpen} customerId={lead.id} />
      <LeadFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        sales={salesUsers}
        actorId={user.id}
        leadId={lead.id}
        initial={{
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          company: lead.company,
          address: lead.address,
          source: lead.source,
          assignedSalesId: lead.assignedSalesId,
          priority: lead.priority,
          expectedValue: lead.expectedValue,
          notes: lead.notes,
          nextFollowUpAt: lead.nextFollowUpAt,
        }}
      />
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm ghi chú</DialogTitle></DialogHeader>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nội dung trao đổi với khách" />
          <DialogFooter>
            <Button onClick={() => void activityService.addNote(lead.id, note, user.id).then(() => { toast.success('Đã lưu ghi chú.'); setNote(''); setNoteOpen(false) })}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo báo giá</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Giá trị</Label><Input type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></div>
            <div><Label>Ghi chú</Label><Textarea value={quoteNote} onChange={(event) => setQuoteNote(event.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button onClick={() => void quotationService.create({ customerId: lead.id, amount, note: quoteNote, actorId: user.id }).then(() => { toast.success('Đã tạo báo giá nháp.'); setQuoteOpen(false) })}>Tạo nháp</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={unmetOpen} onOpenChange={setUnmetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Không đáp ứng được yêu cầu</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={reason} onValueChange={(value) => setReason(value as UnmetReason)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(UNMET_REASON_LABEL) as UnmetReason[]).map((item) => <SelectItem key={item} value={item}>{UNMET_REASON_LABEL[item]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea value={unmetNote} onChange={(event) => setUnmetNote(event.target.value)} placeholder="Mô tả ngắn" />
          </div>
          <DialogFooter>
            <Button onClick={() => void customerService.markUnmet(lead.id, reason, unmetNote, user.id).then(() => { toast.success('Đã ghi nhận yêu cầu không đáp ứng.'); setUnmetOpen(false) })}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(recording)} onOpenChange={() => setRecording(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ghi âm mô phỏng</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">File ghi âm sẽ được lấy từ tổng đài khi tích hợp. Bản này chỉ hiển thị trình phát giả.</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-1/3 bg-primary" /></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  )
}
