# LogisCRM

CRM nội bộ cho đội kinh doanh logistics. Bản này là prototype giao diện: toàn bộ dữ liệu, đăng nhập và tích hợp đều là mô phỏng, để có thể thay bằng API thật khi đã chốt CRM và tổng đài.

## Chạy dự án

```bash
npm install
npm run dev
```

Kiểm tra kiểu và bản build:

```bash
npx tsc -b --noEmit
npm run build
```

Ứng dụng chạy tại địa chỉ Vite in ra, thường là `http://localhost:5173`.

### Tài khoản mô phỏng

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Quản trị viên | `admin@logiscrm.vn` | `Admin@123` |
| Quản lý | `bao.tran@logiscrm.vn` | `Manager@123` |
| Nhân viên kinh doanh | `khoi.pham@logiscrm.vn` | `Sales@123` |

Đăng nhập không gọi máy chủ. "Ghi nhớ đăng nhập" lưu phiên trong `localStorage`; không ghi nhớ thì phiên nằm trong `sessionStorage`.

## Cấu trúc thư mục

```text
src/
  api/          Lớp HTTP dự phòng. Trang không gọi trực tiếp.
  components/   UI shadcn và thành phần dùng chung (bảng, badge, bộ lọc).
  features/     Luồng dùng lại: đăng nhập, gọi điện, nhập Excel/CSV, form khách hàng.
  hooks/        Hook tải dữ liệu và debounce tìm kiếm.
  layouts/      Khung sidebar + header.
  mocks/        Dữ liệu mẫu và kho nhớ trong phiên làm việc.
  models/       Kiểu TypeScript, nhãn tiếng Việt, hợp đồng CRMProvider / TelephonyProvider.
  pages/        Một trang cho mỗi route.
  routes/       React Router và cổng đăng nhập.
  services/     Hàm nghiệp vụ trả về Promise. Đây là chỗ thay mock bằng API.
  utils/        Định dạng, khoảng ngày, phân quyền theo vai trò.
```

Trang chỉ gọi service. Service đọc `src/mocks/store.ts` và trả về Promise có độ trễ giả. Khi đổi bước pipeline, từ chối báo giá hoặc nhập file, store cập nhật và các màn đang mở tự tải lại.

## Routes

| Đường dẫn | Màn hình |
| --- | --- |
| `/login` | Đăng nhập |
| `/quy-trinh` | Sơ đồ quy trình, viết cho người không làm kỹ thuật |
| `/dashboard` | Tổng quan |
| `/leads` | Khách hàng tiềm năng |
| `/leads/:id` | Chi tiết khách hàng |
| `/pipeline` | Kanban 14 bước |
| `/calls` | Cuộc gọi |
| `/orders` | Đơn hàng |
| `/orders/:id` | Chi tiết đơn và dòng thời gian |
| `/reports` | Báo cáo |
| `/employees` | Nhân viên |
| `/employees/:id` | Hồ sơ nhân viên |
| `/profile` | Hồ sơ của người đang đăng nhập |
| `/integrations` | Tích hợp |
| `/settings` | Cài đặt và ma trận quyền |

## Kiến trúc mock

- `src/models/types.ts` định nghĩa `User`, `Team`, `Customer`, `Lead`, `LeadActivity`, `PipelineStage`, `CallLog`, `Order`, `Quotation`, `Document`, `Integration`, `ReportMetric`.
- `src/models/providers.ts` định nghĩa `CRMProvider` và `TelephonyProvider`. Bản giả là `MockCRMProvider` và `MockTelephonyProvider` trong `src/services/integrationService.ts`. Giao diện không ghi tên nhà cung cấp.
- `src/mocks/seed.ts` tạo dữ liệu logistics tiếng Việt. `src/mocks/store.ts` giữ dữ liệu trong bộ nhớ và phát sự kiện khi có thay đổi.
- Quyền nằm ở `src/utils/permissions.ts` (`admin`, `manager`, `sales`). Chưa có backend phân quyền; một số nút như cấu hình tích hợp và cài đặt hệ thống đã kiểm tra quyền trên giao diện.

Ví dụ service:

```ts
customerService.list()
customerService.getById()
customerService.updateStage()
callService.list()
reportService.getSummary()
crmProvider.syncCustomers()
telephonyProvider.getCalls()
```

Nhập Excel/CSV chạy trên trình duyệt: tải file CSV hoặc dùng dữ liệu mẫu, xem trước, ghép cột, kiểm tra dòng hợp lệ / lỗi / trùng, rồi ghi vào store. File Excel chưa được đọc nhị phân; người dùng xuất CSV hoặc dùng dữ liệu mẫu. CRM API, tổng đài và API khác hiển thị "Chưa cấu hình".

Form cấu hình tích hợp không lưu API key hay secret.

## Chỗ gắn backend sau này

1. Thay phần thân các hàm trong `src/services/*` bằng lời gọi `apiRequest` ở `src/api/client.ts`. Giữ nguyên chữ ký hàm để không viết lại trang.
2. Cài đặt `CRMProvider` và `TelephonyProvider` cho nhà cung cấp đã chốt, rồi gán vào `crmProvider` / `telephonyProvider`.
3. Đăng nhập: thay `authService.login` bằng API phiên làm việc. `AuthProvider` đã tách khỏi trang.
4. Tệp chứng từ và ghi âm: thay `documentService.addMock` và hộp thoại ghi âm bằng URL thật từ kho tệp / tổng đài.
5. Phân quyền: mở rộng `ROLE_PERMISSIONS` hoặc lấy ma trận từ API. `useAuth().can()` đã được các nút nhạy cảm sử dụng.

Không có cơ sở dữ liệu, máy chủ, thanh toán hay gửi tin nhắn thật trong bản này.
