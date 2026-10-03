import { Link } from 'react-router-dom'
import { ArrowDown, Phone, RotateCcw } from 'lucide-react'
import { PIPELINE_STAGES } from '@/models/labels'

const CHAPTERS: Array<{
  title: string
  plain: string
  stageIds: string[]
}> = [
  {
    title: 'Gặp khách',
    plain: 'Nhân viên gọi điện, ghi lại khách cần gì, và hẹn lần liên hệ sau.',
    stageIds: ['caring'],
  },
  {
    title: 'Tính giá',
    plain: 'Hỏi hàng đi đâu, gom giá, gửi báo giá. Khách gật đầu thì mới làm tiếp.',
    stageIds: ['order_info', 'price_summary', 'quotation', 'agreed'],
  },
  {
    title: 'Làm giấy tờ',
    plain: 'Giữ chỗ tàu hoặc xe, chọn đại lý, gửi chứng từ và khai hải quan.',
    stageIds: ['booking', 'agent_selection', 'send_documents', 'customs_declaration', 'post_customs_documents'],
  },
  {
    title: 'Giao hàng và thu tiền',
    plain: 'Điều xe, giao hàng, khách trả tiền. Xong bước này là đơn hoàn thành.',
    stageIds: ['dispatch', 'delivery', 'payment', 'completed'],
  },
]

const SOURCES = [
  { title: 'Nhân viên tự thêm', detail: 'Gõ tên, số điện thoại, công ty vào sổ khách.' },
  { title: 'Đưa file Excel vào', detail: 'Có file danh sách thì tải lên, xem trước, rồi mới nhập.' },
  { title: 'Lấy từ CRM khác', detail: 'Chưa nối. Khi chốt hệ thống bên ngoài sẽ kéo khách về đây.' },
  { title: 'Từ tổng đài', detail: 'Chưa nối. Sau này cuộc gọi và thời lượng sẽ tự chép vào hồ sơ.' },
]

function stageName(id: string) {
  return PIPELINE_STAGES.find((stage) => stage.id === id)?.name ?? id
}

export function FlowPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Khách đi như thế nào?</h1>
        <p className="mt-2 text-base leading-7 text-slate-600">
          Đọc từ trên xuống. Mỗi khung là một việc phải xong trước khi sang việc kế tiếp. Tên trong khung nhỏ là đúng các cột trên bảng làm việc.
        </p>
      </header>

      <ol className="space-y-0">
        {CHAPTERS.map((chapter, index) => (
          <li key={chapter.title} className="grid grid-cols-[3rem_1fr] gap-4">
            <div className="flex flex-col items-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {index + 1}
              </span>
              {index < CHAPTERS.length - 1 ? <span className="my-1 w-px flex-1 bg-slate-300" /> : null}
            </div>
            <div className={index < CHAPTERS.length - 1 ? 'pb-6' : ''}>
              <h2 className="text-xl font-semibold text-slate-900">{chapter.title}</h2>
              <p className="mt-1 text-base leading-7 text-slate-600">{chapter.plain}</p>
              <ol className="mt-3 space-y-2">
                {chapter.stageIds.map((id) => {
                  const stage = PIPELINE_STAGES.find((item) => item.id === id)
                  return (
                    <li key={id} className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                        {stage?.order}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{stageName(id)}</span>
                    </li>
                  )
                })}
              </ol>
              {index < CHAPTERS.length - 1 ? (
                <p className="mt-3 flex items-center gap-1 text-sm text-slate-500">
                  <ArrowDown className="h-4 w-4" /> Xong thì xuống bước sau
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-amber-700">
            <RotateCcw className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Khách chưa ưng báo giá thì sao?</h2>
            <p className="mt-1 text-base leading-7 text-slate-700">
              Nhân viên bấm <span className="font-medium">Khách hàng không đồng ý</span>. Hồ sơ quay về bước <span className="font-medium">Đang chăm sóc</span> để gọi lại và làm giá mới.
            </p>
            <p className="mt-2 text-base leading-7 text-slate-700">
              Báo giá cũ không bị xóa. Mở hồ sơ khách vẫn xem được lần báo giá nào đã gửi, lần nào bị từ chối.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900">Khách vào sổ bằng cách nào?</h2>
        <p className="mt-1 text-base leading-7 text-slate-600">Bốn cửa. Cửa nào cũng đổ vào cùng một hồ sơ khách.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SOURCES.map((source) => (
            <div key={source.title} className="rounded-xl border bg-white p-4">
              <p className="font-semibold text-slate-900">{source.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{source.detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col items-center gap-2 text-center">
          <ArrowDown className="h-5 w-5 text-slate-400" />
          <div className="w-full rounded-xl bg-primary px-4 py-4 text-primary-foreground">
            <p className="text-lg font-semibold">Một hồ sơ khách</p>
            <p className="mt-1 text-sm text-blue-100">Tên, số điện thoại, công ty, nhân viên phụ trách, đang ở bước nào.</p>
          </div>
          <ArrowDown className="h-5 w-5 text-slate-400" />
          <div className="w-full rounded-xl border bg-white px-4 py-4">
            <p className="flex items-center justify-center gap-2 text-lg font-semibold text-slate-900">
              <Phone className="h-5 w-5" /> Nhân viên chăm sóc trên bảng các bước
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Gọi điện, ghi chú, chuyển bước. Mỗi lần làm đều lưu lại để người khác mở hồ sơ là thấy.</p>
          </div>
          <ArrowDown className="h-5 w-5 text-slate-400" />
          <div className="w-full rounded-xl border bg-white px-4 py-4">
            <p className="text-lg font-semibold text-slate-900">Sếp xem Báo cáo</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Số cuộc gọi, thời gian gọi, khách mới, đơn xong, lý do không nhận làm. Chỉ có số, không gắn chữ tốt hay chưa tốt.</p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to="/pipeline" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Mở bảng các bước
        </Link>
        <Link to="/leads" className="inline-flex h-10 items-center rounded-md border bg-white px-4 text-sm font-medium">
          Mở sổ khách
        </Link>
      </div>
    </div>
  )
}
