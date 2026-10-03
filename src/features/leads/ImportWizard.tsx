import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { User } from '@/models'
import { classifyImportRows, customerService, type ImportRow } from '@/services/customerService'
import { downloadCsv } from '@/utils/format'
import { cn } from '@/lib/utils'

const TARGETS = [
  { key: 'customer_name', label: 'customer_name' },
  { key: 'phone', label: 'phone' },
  { key: 'email', label: 'email' },
  { key: 'company', label: 'company' },
  { key: 'source', label: 'source' },
  { key: 'note', label: 'note' },
] as const

type TargetKey = (typeof TARGETS)[number]['key']

const SAMPLE_ROWS: ImportRow[] = [
  { customer_name: 'Lâm Gia Hưng', phone: '0904555123', email: 'hung.lam@xuatkhautay.vn', company: 'Công ty TNHH Xuất khẩu Tây', source: 'Hội chợ', note: 'Cần báo giá FCL đi Rotterdam trong tháng này' },
  { customer_name: 'Nguyễn Văn An', phone: '0903100000', email: 'an.nguyen@anhduong.vn', company: 'Công ty TNHH XNK Ánh Dương', source: 'Website', note: 'Dòng này trùng số đã có trong CRM' },
  { customer_name: '', phone: '123', email: 'sai-email', company: 'Thiếu tên', source: 'Excel', note: 'Dòng không hợp lệ để minh họa kiểm tra' },
  { customer_name: 'Trịnh Mỹ Linh', phone: '0988123987', email: 'linh.trinh@linhkien.vn', company: 'Công ty TNHH Linh kiện Ánh Kim', source: 'Giới thiệu', note: 'Hàng điện tử, cần tờ khai riêng' },
]

const HEADER_ALIASES: Record<TargetKey, string[]> = {
  customer_name: ['customer_name', 'ten', 'họ tên', 'ho ten', 'tên khách hàng', 'ten khach hang', 'name'],
  phone: ['phone', 'sdt', 'sđt', 'điện thoại', 'dien thoai', 'so dien thoai'],
  email: ['email', 'e-mail'],
  company: ['company', 'công ty', 'cong ty'],
  source: ['source', 'nguồn', 'nguon'],
  note: ['note', 'ghi chú', 'ghi chu'],
}

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
  const rows = lines.map((line) => {
    const cells: string[] = []
    let current = ''
    let quoted = false
    for (const char of line) {
      if (char === '"') {
        quoted = !quoted
      } else if (char === ',' && !quoted) {
        cells.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    cells.push(current.trim())
    return cells
  })
  const headers = rows[0] ?? []
  const records = rows.slice(1).map((cells) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? ''
    })
    return record
  })
  return { headers, records }
}

function guessMapping(headers: string[]) {
  const mapping = {} as Record<TargetKey, string>
  for (const target of TARGETS) {
    const found = headers.find((header) => HEADER_ALIASES[target.key].includes(header.trim().toLowerCase()))
    mapping[target.key] = found ?? ''
  }
  return mapping
}

export function ImportWizard({
  open,
  onOpenChange,
  sales,
  actorId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sales: User[]
  actorId: string
}) {
  const [step, setStep] = useState(0)
  const [headers, setHeaders] = useState<string[]>([])
  const [records, setRecords] = useState<Array<Record<string, string>>>([])
  const [mapping, setMapping] = useState<Record<TargetKey, string>>({
    customer_name: '',
    phone: '',
    email: '',
    company: '',
    source: '',
    note: '',
  })
  const [salesId, setSalesId] = useState(actorId)
  const [confirm, setConfirm] = useState(false)
  const [result, setResult] = useState<{ imported: number; invalid: number; duplicates: number } | null>(null)
  const [fileNote, setFileNote] = useState('')

  const reset = () => {
    setStep(0)
    setHeaders([])
    setRecords([])
    setResult(null)
    setFileNote('')
  }

  const rows = useMemo<ImportRow[]>(
    () =>
      records.map((record) => ({
        customer_name: record[mapping.customer_name] ?? '',
        phone: record[mapping.phone] ?? '',
        email: record[mapping.email] ?? '',
        company: record[mapping.company] ?? '',
        source: record[mapping.source] ?? '',
        note: record[mapping.note] ?? '',
      })),
    [records, mapping],
  )
  const classified = useMemo(() => classifyImportRows(rows), [rows])
  const validCount = classified.filter((row) => row.kind === 'valid').length

  const loadSample = () => {
    const headersNext = ['Họ tên', 'Điện thoại', 'Email', 'Công ty', 'Nguồn', 'Ghi chú']
    setHeaders(headersNext)
    setMapping(guessMapping(headersNext))
    setRecords(
      SAMPLE_ROWS.map((row) => ({
        'Họ tên': row.customer_name,
        'Điện thoại': row.phone,
        Email: row.email,
        'Công ty': row.company,
        Nguồn: row.source,
        'Ghi chú': row.note,
      })),
    )
    setFileNote('Đang dùng dữ liệu mẫu.')
    setStep(1)
  }

  const onFile = async (file: File) => {
    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.csv') && !lower.endsWith('.txt')) {
      setFileNote('Bản prototype đọc trực tiếp file CSV. Với Excel, hãy xuất CSV hoặc dùng dữ liệu mẫu để xem đủ các bước.')
      return
    }
    const text = await file.text()
    const parsed = parseCsv(text)
    if (parsed.headers.length === 0) {
      toast.error('File không có dữ liệu.')
      return
    }
    setHeaders(parsed.headers)
    setRecords(parsed.records)
    setMapping(guessMapping(parsed.headers))
    setFileNote(`${file.name} · ${parsed.records.length} dòng`)
    setStep(1)
  }

  const runImport = async () => {
    const summary = await customerService.importRows(rows, salesId || actorId, actorId)
    setResult(summary)
    setStep(4)
    toast.success(`Đã nhập ${summary.imported} khách hàng.`)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next) }}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Nhập khách hàng</DialogTitle>
          <DialogDescription>Luồng Excel/CSV chạy trên trình duyệt. CRM API, tổng đài và API khác chưa được cấu hình.</DialogDescription>
        </DialogHeader>
        <ol className="mb-4 grid gap-2 text-xs sm:grid-cols-5">
          {['Tải file', 'Xem trước', 'Ghép cột', 'Kiểm tra', 'Kết quả'].map((label, index) => (
            <li key={label} className={cn('rounded-md border px-2 py-1.5', index === step ? 'border-primary bg-blue-50 font-medium text-primary' : 'text-muted-foreground')}>
              {index + 1}. {label}
            </li>
          ))}
        </ol>
        {step === 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50 px-4 py-10 text-center">
              <span className="text-sm font-medium">Upload Excel/CSV</span>
              <span className="mt-1 text-xs text-muted-foreground">Kéo thả hoặc bấm để chọn file .csv</span>
              <input
                type="file"
                accept=".csv,.txt,.xlsx,.xls"
                className="mt-3 text-xs"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void onFile(file)
                }}
              />
            </label>
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">Nguồn khác</p>
              <SourcePlaceholder title="CRM API" />
              <SourcePlaceholder title="Tổng đài" />
              <SourcePlaceholder title="API khác" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={loadSample}>Dùng dữ liệu mẫu</Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    downloadCsv('mau-khach-hang.csv', [
                      ['Họ tên', 'Điện thoại', 'Email', 'Công ty', 'Nguồn', 'Ghi chú'],
                      ...SAMPLE_ROWS.map((row) => [row.customer_name, row.phone, row.email, row.company, row.source, row.note]),
                    ])
                  }
                >
                  Tải file mẫu
                </Button>
              </div>
            </div>
            {fileNote ? <p className="text-sm text-amber-700 md:col-span-2">{fileNote}</p> : null}
          </div>
        ) : null}
        {step === 1 ? (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">{fileNote} · {records.length} dòng</p>
            <div className="max-h-80 overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>{headers.map((header) => <th key={header} className="px-3 py-2 font-medium">{header}</th>)}</tr>
                </thead>
                <tbody>
                  {records.slice(0, 8).map((record, index) => (
                    <tr key={index} className="border-t">
                      {headers.map((header) => <td key={header} className="px-3 py-2">{record[header]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {TARGETS.map((target) => (
              <div key={target.key}>
                <Label className="mb-1.5 block">{target.label}</Label>
                <Select value={mapping[target.key] || 'none'} onValueChange={(value) => setMapping((current) => ({ ...current, [target.key]: value === 'none' ? '' : value }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn cột" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không ghép</SelectItem>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div>
              <Label className="mb-1.5 block">Sales nhận lead</Label>
              <Select value={salesId} onValueChange={setSalesId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sales.map((person) => <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Count label="Dòng hợp lệ" value={validCount} tone="text-emerald-700" />
              <Count label="Dòng không hợp lệ" value={classified.filter((row) => row.kind === 'invalid').length} tone="text-rose-700" />
              <Count label="Dòng trùng" value={classified.filter((row) => row.kind === 'duplicate').length} tone="text-amber-700" />
            </div>
            <div className="max-h-64 overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Dòng</th>
                    <th className="px-3 py-2">Tên</th>
                    <th className="px-3 py-2">Điện thoại</th>
                    <th className="px-3 py-2">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {classified.map((row) => (
                    <tr key={row.rowNumber} className="border-t">
                      <td className="px-3 py-2">{row.rowNumber}</td>
                      <td className="px-3 py-2">{row.customer_name || '—'}</td>
                      <td className="px-3 py-2">{row.phone || '—'}</td>
                      <td className="px-3 py-2">{row.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        {step === 4 && result ? (
          <div className="rounded-lg border bg-emerald-50 p-4 text-sm text-emerald-900">
            Đã nhập {result.imported} khách hàng vào bước Đang chăm sóc. Bỏ qua {result.invalid} dòng không hợp lệ và {result.duplicates} dòng trùng. Lịch sử này chỉ tồn tại trong phiên mô phỏng.
          </div>
        ) : null}
        <DialogFooter>
          {step > 0 && step < 4 ? <Button variant="outline" onClick={() => setStep((value) => value - 1)}>Quay lại</Button> : null}
          {step === 1 ? <Button onClick={() => setStep(2)}>Tiếp tục ghép cột</Button> : null}
          {step === 2 ? <Button onClick={() => setStep(3)} disabled={!mapping.customer_name || !mapping.phone}>Kiểm tra dữ liệu</Button> : null}
          {step === 3 ? <Button onClick={() => setConfirm(true)} disabled={validCount === 0}>Nhập dòng hợp lệ</Button> : null}
          {step === 4 ? <Button onClick={() => { reset(); onOpenChange(false) }}>Đóng</Button> : null}
        </DialogFooter>
        <ConfirmDialog
          open={confirm}
          title="Xác nhận nhập dữ liệu"
          description={`Nhập ${validCount} dòng hợp lệ? Dòng lỗi và dòng trùng sẽ được bỏ qua, không ghi đè khách hàng hiện có.`}
          confirmLabel="Nhập dữ liệu"
          onOpenChange={setConfirm}
          onConfirm={() => void runImport()}
        />
      </DialogContent>
    </Dialog>
  )
}

function SourcePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">Chưa cấu hình</p>
      </div>
      <Button variant="outline" size="sm" onClick={() => toast.message('Mở trang Tích hợp để cấu hình khi nhà cung cấp được chốt.')}>
        Cấu hình
      </Button>
    </div>
  )
}

function Count({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-2xl font-semibold', tone)}>{value}</p>
    </div>
  )
}
