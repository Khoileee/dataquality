# DMP — Nền tảng Quản trị Dữ liệu

Demo front-end chạy được của **DMP (Data Management Platform)** — công cụ quản trị dữ liệu tập trung,
tách ra từ SQLWF và mở rộng theo yêu cầu của đội BDA (Giai đoạn 1 → 5).

> **8 module · 27 menu · 96 màn hình** — bấm được, chuyển tab được, mở popup được, có wizard nhiều bước và các ràng buộc nghiệp vụ thật.

---

## Chạy demo

```bash
npm install
npm run dev          # mở http://localhost:5173
```

Build production và triển khai:

```bash
npm run build        # ra thư mục dist/
npm run preview      # xem thử bản build
```

Deploy lên Vercel: đẩy repo lên GitHub rồi import vào Vercel — không cần cấu hình gì thêm.
Tệp `vercel.json` đã có sẵn quy tắc rewrite cho ứng dụng một trang (SPA).

| | |
|---|---|
| **Công nghệ** | React 18 · TypeScript · Vite 5 · Tailwind CSS 3 · React Router 6 |
| **Backend** | Không có — toàn bộ dữ liệu là dữ liệu minh hoạ trong `src/data/` |
| **Lưu dữ liệu** | Không lưu. Bấm Lưu → hiện thông báo → quay lại, danh sách giữ nguyên |
| **Kích thước tối thiểu** | 1280px — demo trình chiếu trên màn hình lớn |

---

## Tám module · 27 menu

| Module | Menu | Phục vụ giai đoạn BDA |
|---|---|---|
| **① DATA CATALOG** | Tìm kiếm toàn hệ thống 🆕 · Bảng dữ liệu · Hệ thống & Nguồn dữ liệu 🆕 · Kênh trao đổi dữ liệu 🆕 · Báo cáo & Chỉ tiêu 🆕 · Nhóm bảng · Miền dữ liệu · Danh mục tham chiếu | GĐ2 |
| **② GOVERNANCE** | Từ điển nghiệp vụ · Phân loại & Nhãn · Truy vết luồng dữ liệu 🆕 · Phê duyệt & Phiên bản 🆕 | GĐ2 · GĐ4 |
| **③ DATA QUALITY** | Thư viện luật · Luật & Kết quả · Phân tích dữ liệu · Sự cố chất lượng · Cảnh báo | GĐ3 |
| **④ NẠP & ĐIỀU PHỐI** | Luồng xử lý (Job) · Cửa nạp dữ liệu · Theo dõi & Pipeline | GĐ2 · GĐ3 |
| **⑤ DATA SECURITY** | Người dùng & Nhóm · Chính sách truy cập · Yêu cầu cấp quyền · Nhật ký kiểm toán · Báo cáo quyền & Giám sát | GĐ4 |
| **⑥ CHÍNH SÁCH & TUÂN THỦ** 🆕 | Chính sách dữ liệu 🆕 · Vòng đời & Lưu trữ 🆕 · Đánh giá tuân thủ 🆕 | GĐ4 |
| **⑦ DỮ LIỆU CHỦ (MDM)** 🆕 | Mô hình dữ liệu chủ 🆕 · Bản ghi nguồn 🆕 · Nghi ngờ trùng & Hợp nhất 🆕 · Bản ghi chuẩn & Phân phối 🆕 | GĐ5 |
| **⑧ OPERATIONS** | Sức khoẻ dữ liệu · Cấu hình hệ thống | Xuyên suốt |

🆕 = menu bổ sung sau khi review đối chiếu với yêu cầu BDA. Xem chi tiết lý do tại
[`docs/DMP-Review-Doi-chieu-Yeu-cau-BDA.md`](../zeppelin/docs/DMP-Review-Doi-chieu-Yeu-cau-BDA.md) của repo tài liệu.

---

## Kịch bản trình bày 12 phút

| # | Màn | Nói gì |
|:---:|---|---|
| **1** | `/operations/health` | *"Điểm chất lượng 87 — nhưng chỉ tính trên 0,6% số bảng. 7.578 bảng không ai nhận."* Mở tab **Tiến độ theo giai đoạn** để cho thấy tool phủ đủ cả 5 giai đoạn của lộ trình. |
| **2** | `/catalog/tables` → bấm `bi.doi_soat_giao_dich_A` | *"Đây là nguồn sự thật duy nhất."* Chuyển đủ 6 tab: Tổng quan · Cột · Chất lượng · Nguồn gốc · Quyền · Lịch sử. |
| **3** | tab **Nguồn gốc** → nút **Phân tích ảnh hưởng** | *"Bảng này hỏng thì ảnh hưởng tới đâu — hiện không ai trả lời được."* Popup liệt kê báo cáo, chỉ tiêu và người dùng bị ảnh hưởng, xuất được danh sách. |
| **4** | `/catalog/reports` → `BC-001` | ⭐ **Gap lớn nhất đã bịt.** *"Trước đây báo cáo chỉ là chuỗi chữ. Nay là thực thể có chỉ tiêu, công thức, bảng nguồn — nên lineage mới đi hết được tới đích."* |
| **5** | `/governance/lineage` | Đổi qua 4 mức truy vết: **Hệ thống → Bảng → Cột → Nghiệp vụ**. Tab **Quan hệ đã khai báo** cho thấy khai báo thủ công có phê duyệt. |
| **6** | `/quality/incidents/SC-0231` | *"Cảnh báo thành việc có người chịu trách nhiệm và có hạn."* Chỉ khối **Kiểm tra lại tự động** và **Nguyên tắc bốn mắt** — nút Đóng bị khoá vì người đang xem là người xử lý. Đổi vai ở góc phải để thấy nút mở ra. |
| **7** | `/orchestration/monitor` | *"Job chạy thành công vẫn có thể sinh ra số sai — 42 lượt hôm nay."* Sơ đồ pipeline phủ badge chất lượng lên từng nút. |
| **8** | `/security/policies/mask` → **Thêm chính sách che** | *"412 cột CCCD và số điện thoại hiện trả về nguyên giá trị."* Đổi kiểu che → câu SQL viết lại đổi theo. Bước cuối hiện tác động: 144 cột · 184 người · 11 báo cáo. |
| **9** | `/security/policies/rowfilter/create` | *"41 bảng sao chép chỉ để phân quyền theo chi nhánh — bỏ được hết."* Nút Lưu bị khoá tới khi chạy đối chiếu 5 tài khoản. |
| **10** | `/security/requests` → `YC-0231` | *"Xin quyền hiện qua chat. 87% quyền không có thời hạn."* Màn duyệt có 3 mức quyết định và cột loại trừ. |
| **11** | `/compliance/assessments/DG-2026-Q2` | 🆕 *"Kiểm toán hỏi có tuân thủ không — đây là câu trả lời."* 20 mục checklist, 7 không đạt, mỗi phát hiện gắn với một kế hoạch khắc phục có hạn. |
| **12** | `/mdm/duplicates` → bấm **Xem xét** | 🆕 *"Giai đoạn 5 cũng đã có đường đi."* Popup so sánh bản ghi từ nhiều nguồn, ô vàng là giá trị khác nhau, cột xanh là giá trị chuẩn đề xuất. |

**Chuỗi bấm liên thông để chứng minh dữ liệu nối được với nhau:**

```
KENH-01 → NAP-012 → raw.doi_soat_A_tho → JOB-0412 → bi.doi_soat_giao_dich_A
        → CT-002 → BC-004 → SC-0231 → YC-0231
```

---

## Sáu ràng buộc nghiệp vụ chạy thật trong demo

| Ở đâu | Ràng buộc |
|---|---|
| `/catalog/tables/create` | Gõ tên bảng sai chuẩn → báo lỗi đỏ ngay · chọn Tier 1 → hiện khối điều kiện bắt buộc · nút gửi duyệt khoá tới khi đủ trường |
| `/quality/incidents/:id` | **Nguyên tắc bốn mắt** — người xử lý không tự đóng được sự cố · đóng phải chọn 1 trong 6 lý do |
| `/ingestion/quarantine` | Cho qua lô dữ liệu bị giữ **bắt buộc điền lý do ≥ 20 ký tự** |
| `/security/policies/mask/create` | Đổi kiểu che → **câu SQL viết lại đổi theo** ngay lập tức |
| `/security/policies/rowfilter/create` | Nút Lưu **khoá** tới khi bấm *Chạy đối chiếu 5 tài khoản* |
| `/security/requests/create` | Ô lý do **đếm ký tự**, dưới 30 thì viền đỏ · ô thời hạn **không có** lựa chọn vô thời hạn |
| `/governance/approvals` | Từ chối hoặc yêu cầu chỉnh sửa **bắt buộc nêu lý do ≥ 20 ký tự** |
| `/orchestration/jobs/create` | Bảng đích Tier 1 → **không tắt được** quét quan hệ luồng dữ liệu |

---

## Cấu trúc mã nguồn

```
src/
├── config.ts                  ⭐ tên tool · 5 vai trò · danh sách người dùng demo
├── app/
│   ├── menu.ts                ⭐ 8 module × 27 menu — sửa ở đây là sửa cả thanh bên
│   └── UserContext.tsx        đổi vai khi trình bày
├── components/
│   ├── layout/                AppShell · Sidebar · Topbar
│   ├── common/                ⭐ bộ component dùng chung — dựng 96 màn từ đây
│   │   ├── Chip.tsx           chip · trạng thái · mức quan trọng · 6 chiều chất lượng
│   │   ├── DataTable.tsx      bảng chuẩn · ô đầu bảng · trạng thái rỗng
│   │   ├── Layout.tsx         Panel · PageHeader · KpiRow · FilterBar · Tabs · Note · InfoGrid
│   │   ├── Form.tsx           Field · Steps · OptionCards · Toggle · ChipInput
│   │   ├── Overlay.tsx        Modal · Drawer · Toast · ConfirmModal
│   │   ├── Viz.tsx            FlowDiagram · ProgressBar · Timeline · TreeView · CodeBlock
│   │   └── Actions.tsx        nút hành động · nút biểu tượng · liên kết thực thể
│   └── ui/                    primitive kế thừa từ repo Data Quality
├── data/                      ⭐ toàn bộ dữ liệu minh hoạ — không viết dữ liệu cứng trong trang
│   ├── stats.ts               số liệu chủ chốt dùng chung mọi màn
│   ├── types.ts               định nghĩa kiểu cho mọi thực thể
│   ├── catalog.ts             hệ thống · bảng · cột · miền · nhóm · danh mục · kênh · báo cáo · chỉ tiêu
│   ├── governance.ts          thuật ngữ · nhãn phân loại · lineage · hàng đợi phê duyệt
│   ├── quality.ts             28 loại kiểm tra · luật đã gán · profiling · sự cố · cảnh báo
│   ├── orchestration.ts       job · bước · lần chạy · phiên bản · mẫu nạp · vùng chờ
│   ├── security.ts            người dùng · nhóm · chính sách · yêu cầu quyền · nhật ký · bất thường
│   ├── compliance.ts          chính sách · vòng đời · chia sẻ · đánh giá · khắc phục
│   ├── mdm.ts                 mô hình · bản ghi nguồn · nghi ngờ trùng · bản ghi chuẩn · phân phối
│   ├── operations.ts          sức khoẻ · tiến độ giai đoạn · kết nối · Tier · chuẩn tên · tham số
│   └── search.ts              chỉ mục tìm kiếm toàn hệ thống
└── pages/                     96 màn, gom theo module
```

**Ba nguyên tắc khi sửa demo**

1. Mọi số liệu lấy từ `src/data/` — sửa một chỗ, cả hệ thống đổi theo, không lệch số giữa các màn.
2. Mọi màn chỉ dùng component trong `src/components/common/` — không viết lại HTML thẻ, bảng, chip.
3. Đổi tên tool, khẩu hiệu, danh sách người dùng demo ở `src/config.ts`; đổi menu ở `src/app/menu.ts`.

---

## Số liệu chủ chốt — giữ nhất quán trên mọi màn

| Con số | Giá trị | Ý nghĩa khi trình bày |
|---|---|---|
| Tổng số bảng | **11.482** | quy mô hệ thống |
| Bảng đang được kiểm chất lượng | **64** — 0,6% | điểm chất lượng 87 chỉ tính trên số này |
| Bảng chưa có người phụ trách | **7.578** — 66% | gốc của việc không gán được sự cố |
| Bảng chưa gán miền | **4.334** — 38% | không ai chịu trách nhiệm |
| Cột nhạy cảm | **412** — 268 cơ bản + 144 nhạy cảm cao | rủi ro lộ dữ liệu |
| Cột đã có chính sách che | **0 / 412** | tính năng chưa tồn tại trong SQLWF |
| Chính sách quyền | **1.847** — 87% vô thời hạn · 76% cấp thủ công | rủi ro quyền tồn đọng |
| Tài khoản nghỉ việc chưa khoá | **9** — còn quyền trên 132 bảng | phát hiện kiểm toán |
| Báo cáo truy vết được tới nguồn | **58 / 186** — 31% | chỉ số nghiệm thu GĐ2 |
| Bản ghi nghi ngờ trùng chưa xử lý | **3.182** | chỉ số nghiệm thu GĐ5 |

---

## Những gì demo này **không** làm

- ❌ Không có back-end, API, cơ sở dữ liệu — dữ liệu cố định trong mã nguồn
- ❌ Không đăng nhập thật — người dùng hiện tại đổi bằng bộ chọn ở góc phải trên
- ❌ Không lưu dữ liệu — bấm Lưu hiện thông báo rồi quay lại, danh sách không đổi
- ❌ Không responsive điện thoại — thiết kế cho màn hình từ 1280px trở lên
