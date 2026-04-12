# Plan: Tổng hợp yêu cầu chỉnh sửa Data Quality Tool sau Review

> **Date:** 2026-04-09
> **Nguồn:** 2 cuộc họp review demo DQ (08/04/2026) + post-meeting feedback
> **Mode:** @plan — Phân tích, phản biện, đề xuất

---

## Context

Sau khi demo công cụ Data Quality cho stakeholder (chị + chị Vân), nhận được feedback qua 3 nguồn:
- `speech_to_text/MN_20260408_DataQuality_Review.md` — meeting notes cuộc họp 1
- `speech_to_text/dataquality2.txt` — AI summary + transcript cuộc họp 2
- `speech_to_text/Bản ghi mới 75.txt` — transcript cuộc họp 2 (bản khác)

Hệ thống hiện tại: React 18 + TS + Vite + Tailwind, 6 module (Danh mục, Ngưỡng, Quy tắc, Lịch chạy, Vấn đề & Sự cố, Dashboard). Pipeline: Pentaho ETL → HDFS L1-L6 → SparkSQL → DB. ~11,000 bảng (trong đó ~3,000 bảng thực tế cần DQ, còn lại là bảng staging/copy).

**Nguồn bổ sung (09/04/2026):**
- `speech_to_text/dq.txt` — transcript cuộc họp 3, chủ yếu về Dashboard (chưa implement, sẽ plan riêng)

---

## Tổng hợp yêu cầu — 20 mục

### Nhóm A: Tái cấu trúc Module (UI/UX)

#### A1. Gộp "Danh mục dữ liệu" + "Ngưỡng cảnh báo" thành 1 module
- **Nguồn:** Cuộc họp 1 (MN mục post-meeting) + Cuộc họp 2
- **Yêu cầu:** Khi khai báo bảng, nhập luôn ngưỡng W/C cho từng chiều. Không cần trang "Ngưỡng cảnh báo" riêng.
- **Thay đổi:** Xóa module Ngưỡng cảnh báo. Bổ sung section ngưỡng vào form khai báo bảng.
- **Phản biện BA:** Đồng ý. Ngưỡng gắn liền với bảng nên gộp hợp lý hơn. Tuy nhiên cần giữ khả năng **set ngưỡng mặc định (default)** cho toàn hệ thống — user chỉ override khi cần. Nếu không, mỗi bảng phải nhập lại 6 cặp W/C rất mất thời gian.
- **Đề xuất:** Thêm "Ngưỡng mặc định" ở Settings/Cấu hình chung. Form khai báo bảng kế thừa mặc định, cho phép override từng chiều.

#### A2. Module "Quy tắc" giữ riêng
- **Nguồn:** Cuộc họp 2
- **Yêu cầu:** Xác nhận quy tắc (rules) tách riêng, không gộp vào danh mục.
- **Thay đổi:** Giữ nguyên module Quy tắc. Chỉnh UI cho rõ: Quy tắc là nơi cấu hình chi tiết từng metric, còn Danh mục là nơi khai báo bảng + ngưỡng tổng quan.
- **Phản biện BA:** Đồng ý. Quy tắc có nhiều field phức tạp (khác nhau theo metric type), gộp vào danh mục sẽ overload form. Tuy nhiên cần **liên kết rõ ràng**: từ danh mục bảng có thể nhảy sang xem/tạo quy tắc cho bảng đó.

#### ~~A3. Sửa tên loại kiểm tra cho dễ hiểu~~ → **LOẠI BỎ** (stakeholder xác nhận giữ nguyên tên hiện tại)

---

### Nhóm B: Import & Bulk Operations

#### B1. Multi-select dropdown cho bảng nguồn (L1-L6)
- **Nguồn:** Cuộc họp 1 (MN post-meeting)
- **Yêu cầu:** Khi thêm bảng nguồn, hiển thị dropdown cho phép chọn nhiều bảng cùng lúc. Phân tầng theo layer (L1-L6).
- **Thay đổi:** Thay thế input text bằng searchable multi-select dropdown, có filter theo layer.
- **Phản biện BA:** Với ~11,000 bảng, dropdown thông thường sẽ rất chậm. Cần:
  - Lazy loading / virtual scroll
  - Filter theo layer trước (L1/L2/.../L6), sau đó search tên bảng
  - Hoặc dùng tree-select: Layer → Area → Table
- **Đề xuất:** Dùng 2-step filter: Bước 1 chọn Layer(s), Bước 2 search/select bảng trong layer đã chọn. Không load tất cả 11k bảng cùng lúc.

#### B2. Import file cho khai báo bảng + ngưỡng + rules
- **Nguồn:** Cuộc họp 1 + 2 + feedback sau họp
- **Yêu cầu:** Cho phép import Excel để khai báo hàng loạt: bảng + ngưỡng + rules cùng lúc.
- **Thay đổi:** Thêm nút "Import" + template Excel tải về. Validate sau import.
- **Phản biện BA:** Đồng ý tính năng rất cần. Thách thức chính: 28 metric types có bộ field khác nhau → template rules phức tạp. Xem phân tích chi tiết tại **Phụ lục: Thiết kế Import Template**.

#### B3. Đồng bộ metadata từ SQLWF (SQL Workflow tool)
- **Nguồn:** Cuộc họp 2 + xác nhận từ BA
- **Yêu cầu:** Tool SQLWF đã có đầy đủ catalog bảng. DQ tool đồng bộ trực tiếp, không nhập tay.
- **Metadata có sẵn trên SQLWF:**
  - Tên bảng, loại (parquet), area (vd: `bi_business_zone`), path HDFS
  - Mode (append/overwrite), người tạo (owner)
  - partition_by, order_by, group_by, và nhiều metadata khác
  - **Job management:** job có nodes, bảng input/output (bảng/báo cáo — bản chất đều là bảng), job owner
- **Thay đổi:** Đồng bộ metadata bảng + job lineage (input/output) từ SQLWF sang DQ tool. Không cần nhập tay.
- **Phản biện BA:** Đây là yêu cầu quan trọng nhất. SQLWF đã có data → chỉ cần đồng bộ, không redesign.
  - Phase 1: Đồng bộ bảng metadata (tên, area, mode, partition_by, owner)
  - Phase 2: Đồng bộ job lineage (input/output tables) → phục vụ cascade alerting (D3)
- **Lưu ý:** Job owner cũng cần nhận cảnh báo khi bảng trong luồng job lỗi/trễ (xem D3).

---

### Nhóm C: Logic & Tính toán

#### C1. Override vs Append mode
- **Nguồn:** Cuộc họp 1
- **Yêu cầu:** 
  - Override: quét toàn bảng mỗi lần, score 0-100%.
  - Append: chỉ quét partition mới (ví dụ: dữ liệu ngày hôm nay). Hiện tại dev chưa xử lý case score > 100% khi cộng dồn.
- **Thay đổi:** Backend cần WHERE clause lọc theo partition khi mode = Append. Score chỉ tính trên partition mới, không cộng dồn.
- **Phản biện BA:** Score > 100% là bug logic, không phải feature. Với Append mode:
  - SQL cần thêm `WHERE partition_col = 'YYYY-MM-DD'` (daily) hoặc `WHERE partition_col = 'YYYY-MM'` (monthly)
  - Score vẫn là tỷ lệ % trên tập dữ liệu được quét (0-100)
  - Dashboard nên hiển thị rõ: "Kết quả quét partition 2026-04-08" thay vì "Kết quả quét bảng X"
- **Đề xuất:** Metadata bảng cần trường `partition_by` (daily/monthly/none) + `partition_column`. Rules tự động thêm WHERE clause dựa trên metadata này.

#### C2. Cách tính DQ Score
- **Nguồn:** Cuộc họp 1 + 2
- **Yêu cầu đã chốt:**
  - Metric score: % pass (0-100) — mỗi rule cho ra 1 con số
  - Dimension score = Trung bình các metric score trong chiều đó
  - Table score = Trung bình 6 dimension score (chỉ tính chiều có cài rule)
  - System score = Trung bình table score
- **Thay đổi:** Implement đúng công thức trên. Hiện tại cách tính chưa rõ ràng.
- **Phản biện BA:** Cách tính "trung bình đều" có hạn chế:
  - 1 chiều có 10 rules, 1 chiều có 1 rule → chiều 1 rule có trọng số bằng chiều 10 rules ở cấp bảng
  - Chiều Timeliness chỉ có 1-2 metric (on_time, freshness) nhưng rất quan trọng
- **Đề xuất:** Phase 1 dùng trung bình đều (đơn giản, dễ giải thích). Phase 2 xem xét weighted average nếu stakeholder cần. Quan trọng nhất là **tooltip giải thích cách tính** trên dashboard (đã được yêu cầu trong cuộc họp 2).

#### C3. Auto-schedule rules theo partition type
- **Nguồn:** Cuộc họp 2 (Bản ghi mới 75)
- **Yêu cầu:** Bảng có partition_by = daily → rules tự chạy hàng ngày. Monthly → hàng tháng. Không cần user set lịch thủ công cho từng bảng.
- **Thay đổi:** Module "Lịch chạy" chuyển từ manual sang auto-suggest dựa trên partition metadata. User vẫn có thể override.
- **Phản biện BA:** Đồng ý, giảm công sức cấu hình rất nhiều. Nhưng cần bổ sung:
  - Bảng không có partition (mode = override, full load) → mặc định chạy daily
  - Cho phép user tùy chỉnh giờ chạy (ví dụ: chạy sau ETL xong, không phải 00:00)
  - Cần biết lịch ETL hiện tại (Rundeck) để set thời gian quét DQ sau khi data đã load xong

---

### Nhóm D: Phân loại Bảng / Báo cáo / Chỉ tiêu

#### D1. Báo cáo: dùng "bảng nguồn liên kết" thay vì "bảng output"
- **Nguồn:** Cuộc họp 1 (MN post-meeting)
- **Yêu cầu:** Khi khai báo báo cáo, thay vì khai báo bảng output (trùng với danh mục bảng), chuyển sang khai báo **bảng nguồn liên kết** — tức là các bảng input mà báo cáo đó sử dụng.
- **Thay đổi:** Form "Thêm báo cáo" → bỏ field "Bảng đầu ra", thay bằng multi-select "Bảng nguồn liên kết".
- **Phản biện BA:** Hợp lý. Báo cáo về bản chất là consumer của data, cần biết nó dùng bảng nào → khi bảng nguồn lỗi, cảnh báo cascade lên báo cáo. Tuy nhiên:
  - Mối quan hệ này chính là **Input/Output relationship** (Nhóm D3 bên dưới)
  - Nên thiết kế chung: 1 cơ chế Input/Output cho tất cả, không riêng cho báo cáo
- **Đề xuất:** Bảng = entity gốc. Báo cáo và Chỉ tiêu chỉ là tag/view khác, nhưng mối liên kết nguồn được quản lý qua cơ chế Input/Output chung.

#### D2. Chỉ tiêu KPI: khai báo rule ngay khi tạo
- **Nguồn:** Cuộc họp 1 (MN post-meeting)
- **Yêu cầu:** Khi tạo chỉ tiêu KPI, cho phép khai báo rule kiểm tra luôn (ví dụ: kpi_variance, statistics_bound) thay vì phải sang module Quy tắc.
- **Thay đổi:** Form "Thêm chỉ tiêu" có section "Quick Rule" với 2-3 metric phổ biến cho KPI.
- **Phản biện BA:** Cẩn thận — đừng biến form thành quá phức tạp. KPI thường chỉ cần:
  - `kpi_variance`: biến động so kỳ trước
  - `value_range` hoặc `statistics_bound`: giá trị nằm trong khoảng hợp lý
- **Đề xuất:** Thêm 1-2 "Quick Rule" template cho KPI form. Rules phức tạp hơn vẫn phải vào module Quy tắc.

#### D3. Input/Output relationship cho cascade alerting
- **Nguồn:** Cuộc họp 2 + feedback
- **Yêu cầu:** Khai báo bảng A là input của bảng B. Khi A lỗi → cảnh báo cascade cho B (và các downstream khác).
- **Nguồn lineage:** SQLWF đã có job management với input/output tables → đồng bộ sang (B3).
- **Thay đổi:** Import dependency graph từ SQLWF. Backend xây cascade logic.
- **Cảnh báo gửi cho ai:**
  - **Mặc định:** Job owner + Table owner (bắt buộc)
  - **Tùy chọn:** Cho phép thêm người nhận (team lead, custom list) trong cấu hình bảng/job
- **Phản biện BA:** Rất quan trọng cho operational intelligence. Nhưng:
  - Với 11k bảng, dependency graph có thể rất phức tạp
  - Cần giới hạn depth (ví dụ: cascade tối đa 3 cấp)
  - SQLWF đã có lineage → Phase 1 import từ đó, không cần khai báo manual
- **Đề xuất:** Hiển thị dependency dạng tree khi xem chi tiết bảng. Cảnh báo cascade hiển thị rõ: "Bảng B lỗi do bảng nguồn A chưa có dữ liệu → Job XYZ bị ảnh hưởng".

---

### Nhóm E: Dashboard & Báo cáo

#### E1. Dashboard tổng quan (chưa làm — sẽ plan riêng)
- **Nguồn:** Cuộc họp 1 + 2 + 3 (dq.txt)
- **Yêu cầu:** 
  - System DQ Score tổng
  - Score theo từng chiều (6 chiều)
  - Top 10 bảng điểm thấp nhất / gặp lỗi nhiều nhất
  - Biểu đồ trend theo thời gian
  - Icon (i) tooltip tại các thẻ score, title, mục
- **Bổ sung từ cuộc họp 3 (dq.txt):**
  - 2 hướng tiếp cận: (a) trung bình qua thời gian, (b) lấy lần quét cuối cùng → cần filter (hôm nay / 7 ngày)
  - Top 10 bảng điểm thấp nhất HOẶC gặp lỗi nhiều nhất trong 1 tuần
  - Các lỗi thường xuyên gặp: bảng 2 cột (tên rule, số lần mắc phải) + bar chart
  - Các lỗi mới phát sinh so với tuần trước
  - Drill-down 2-3 tầng: Tổng quan → Danh sách bảng (với điểm) → Chi tiết từng bảng
  - ~3,000 bảng thực tế (trong 11k), chỉ bảng đã khai báo DQ mới hiển thị
- **Thay đổi:** Build mới hoàn toàn. Phase 1 dùng layout cứng (hardcoded charts), không configurable.
- **Trạng thái:** CHƯA IMPLEMENT — sẽ tạo plan riêng cho Dashboard sau khi hoàn thành Phase 1 Foundation.

#### E2. Top lỗi thường xuyên (chưa làm — sẽ plan riêng)
- **Nguồn:** Cuộc họp 1 + 3 (dq.txt)
- **Yêu cầu:** Dashboard hiển thị top lỗi gặp thường xuyên (7 ngày, theo tuần).
- **Bổ sung từ cuộc họp 3:**
  - Bảng: Mã rule | Số lần vi phạm (trong 7 ngày)
  - Bar chart cho top rules fail nhiều nhất
  - Lỗi mới phát sinh so với tuần trước
- **Phản biện BA:** Nên phân biệt:
  - Top rules fail nhiều nhất (cùng 1 rule fail trên nhiều bảng)
  - Top bảng fail nhiều nhất (1 bảng có nhiều rules fail)
  - Top chiều yếu nhất
- **Đề xuất:** 3 góc nhìn: top rules, top tables, top dimensions. Filter theo thời gian (7d / 30d).
- **Trạng thái:** CHƯA IMPLEMENT — thuộc Dashboard plan.

#### E3. Drill-down chi tiết từng bảng (chưa làm — sẽ plan riêng)
- **Nguồn:** Cuộc họp 1 + 3 (dq.txt)
- **Yêu cầu:** Click bảng → chi tiết: score theo chiều, rules đang chạy, lịch sử, sự cố.
- **Bổ sung từ cuộc họp 3:**
  - 2-3 tầng: Tầng 1 (tổng quan) → Tầng 2 (danh sách bảng + điểm) → Tầng 3 (chi tiết từng bảng/bản ghi)
  - Giống Tableau drill-down
  - Dev xác nhận 2 tầng là đủ scope hiện tại
- **Thay đổi:** Tạo trang "Chi tiết bảng" với tabs: Overview / Rules / History / Issues / Lineage.
- **Trạng thái:** CHƯA IMPLEMENT — thuộc Dashboard plan.

---

### Nhóm F: Vòng đời sự cố

#### F1. Trạng thái sự cố chi tiết
- **Nguồn:** Cuộc họp 1
- **Yêu cầu:** Hiện tại chỉ có: Mới → Đang xử lý. Cần bổ sung đầy đủ.
- **Thay đổi:**
  ```
  Mới → Đang xử lý → Đã xử lý → Đóng
              ↓              ↓
         Tạm hoãn      Mở lại → Đang xử lý
  ```
  - Assign người xử lý
  - Ghi chú / comment
  - Đổi mức độ (Warning ↔ Critical)
  - Lịch sử thay đổi trạng thái
- **Phản biện BA:** Nên đơn giản hóa Phase 1: Mới → Đang xử lý → Đã xử lý → Đóng (4 trạng thái). Tạm hoãn / Mở lại thêm ở Phase 2. Quá nhiều trạng thái sớm → user bối rối.

---

### Nhóm G: Tích hợp & Metadata

#### G1. Owner = người tạo bảng trên Workflow
- **Nguồn:** Cuộc họp 2 (Bản ghi mới 75)
- **Yêu cầu:** Owner không nhập tay. Lấy từ workflow platform (người tạo bảng trên đó).
- **Thay đổi:** Import owner cùng metadata bảng (B3). Field owner trên DQ tool là read-only (sync từ workflow).
- **Phản biện BA:** Đồng ý. Nhưng cần fallback: nếu bảng chưa có trên workflow → cho phép nhập tay. Và cần cơ chế re-sync khi owner thay đổi trên workflow.

#### G2. Partition metadata cho auto-scheduling
- **Nguồn:** Cuộc họp 2
- **Yêu cầu:** Mỗi bảng có metadata: partition_by (daily/monthly/none), partition_column. Import từ workflow.
- **Thay đổi:** Thêm field partition_by, partition_column vào data model bảng. Dùng cho C1 (Override/Append) và C3 (auto-schedule).
- **Phản biện BA:** Đồng ý. Đây là foundation cho nhiều tính năng khác. Ưu tiên cao.

---

## Phân tích ưu tiên & Dependency

### Phase 1 — Foundation (Sprint 1-2)

| # | Yêu cầu | Lý do ưu tiên |
|---|----------|---------------|
| A1 | Gộp Danh mục + Ngưỡng | Thay đổi cấu trúc module → làm trước để tránh rework |
| B3 | Đồng bộ metadata từ SQLWF | Blocker cho adoption — 11k bảng không thể nhập tay |
| G2 | Partition metadata (từ SQLWF) | Foundation cho C1, C3 |
| C1 | Override vs Append logic | Fix bug score > 100% |
| C2 | Chốt cách tính DQ Score | Cần chốt trước khi build dashboard |
| F1 | Vòng đời sự cố (4 trạng thái) | Đơn giản, cần cho operational use |

### Phase 2 — Core Features (Sprint 3-4)

| # | Yêu cầu | Dependency |
|---|----------|-----------|
| B1 | Multi-select dropdown L1-L6 | Cần B3 (metadata đã sync) |
| B2 | Import file bảng + ngưỡng + rules | Cần A1 (form mới). Xem Phụ lục Template |
| C3 | Auto-schedule theo partition | Cần G2 |
| D3 | Input/Output + cascade alerting | Cần B3 (job lineage từ SQLWF) |
| D1 | BC: bảng nguồn liên kết | Cần D3 |
| E1 | Dashboard tổng quan + tooltip (i) | Cần C2 (score calculation) |
| E3 | Drill-down chi tiết bảng | Cần E1 |

### Phase 3 — Enhancement (Sprint 5+)

| # | Yêu cầu |
|---|----------|
| A2 | Liên kết Danh mục ↔ Quy tắc (deep link) |
| D2 | KPI quick-add rule |
| E2 | Top lỗi thường xuyên (3 góc nhìn) |
| G1 | Owner re-sync mechanism |
| - | Configurable dashboard layout |
| - | Tạm hoãn / Mở lại sự cố |

---

## Dependency Graph

```
B3 (Sync SQLWF) ──→ G2 (Partition) ──→ C1 (Override/Append)
                │                  └──→ C3 (Auto-schedule)
                └──→ D3 (Input/Output + Job alerting) ──→ D1 (BC liên kết)
                     
A1 (Gộp module) ──→ B2 (Import file bảng + ngưỡng + rules)
                └──→ D2 (KPI quick-add)

C2 (Score calc) ──→ E1 (Dashboard + tooltip) ──→ E2 (Top lỗi)
                                              └──→ E3 (Drill-down)
```

---

## Tổng kết phản biện BA

| Vấn đề | Đề xuất BA |
|---------|-----------|
| Gộp module quá mạnh tay | Gộp Danh mục + Ngưỡng = OK. Quy tắc giữ riêng = OK. Nhưng cần ngưỡng mặc định ở Settings |
| 11k bảng trên dropdown | Không load hết. Dùng 2-step filter: Layer → Search. Hoặc tree-select |
| Import rules từ file | Khả thi nhưng phức tạp — xem Phụ lục thiết kế template. Dùng flat columns + metric_type xác định field nào bắt buộc |
| Score trung bình đều | Chấp nhận Phase 1. Cần tooltip (i) giải thích. Phase 2 cân nhắc weighted average |
| Cascade alerting | Mặc định: job owner + table owner. Giới hạn 3 cấp. Import lineage từ SQLWF |
| Vòng đời sự cố phức tạp | Phase 1: 4 trạng thái đơn giản. Phase 2 mới thêm Tạm hoãn/Mở lại |
| Auto-schedule | Cần biết lịch ETL (Rundeck) để set DQ scan SAU khi data load xong |
| Owner management | Sync từ SQLWF. Fallback nhập tay cho bảng chưa có trên SQLWF |

---

## Phụ lục: Thiết kế Import Template (Bảng + Ngưỡng + Rules)

### Thách thức

28 metric types, mỗi loại có bộ field khác nhau:
- `not_null`: chỉ cần bảng + cột
- `value_range`: cần bảng + cột + min + max
- `format_regex`: cần bảng + cột + pattern
- `referential_integrity`: cần bảng + cột + ref_table + ref_column
- `aggregate_reconciliation`: cần source_table + report_table + cột so sánh
- ...

### Phương án đề xuất: Excel multi-sheet

**Sheet 1: Danh mục bảng + Ngưỡng**

| Tên bảng | Tag | Mode | Partition by | W_Completeness | C_Completeness | W_Accuracy | C_Accuracy | W_Timeliness | C_Timeliness | W_Consistency | C_Consistency | W_Validity | C_Validity | W_Uniqueness | C_Uniqueness |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KH_KHACHHANG | bảng | append | daily | 90 | 80 | 95 | 85 | ... | ... | ... | ... | ... | ... | ... | ... |
| BC_DOANHTHU | báo cáo | overwrite | monthly | 95 | 90 | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

> Nếu W/C để trống → kế thừa ngưỡng mặc định.
> Metadata (area, path, owner) tự sync từ SQLWF → không cần nhập trong template.

**Sheet 2: Rules — Flat format**

Dùng **union tất cả field** thành cột, cột `metric_type` xác định field nào bắt buộc:

| Tên bảng | metric_type | dimension | Cột | min | max | pattern | ref_table | ref_column | expression | allowed_values | min_fill_pct | min_pass_pct | granularity | time_column | max_age_hours | sla_time | source_table | source_column | W | C |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KH_KHACHHANG | not_null | completeness | CCCD | | | | | | | | | | | | | | | | 95 | 85 |
| KH_KHACHHANG | format_regex | validity | EMAIL | | | `^[\\w.-]+@` | | | | | | | | | | | | | 90 | 80 |
| KH_KHACHHANG | value_range | validity | TUOI | 18 | 120 | | | | | | | | | | | | | | 95 | 90 |
| KH_KHACHHANG | referential_integrity | consistency | MA_CN | | | | DM_CHINHANH | MA_CN | | | | | | | | | | | 100 | 95 |
| BC_DOANHTHU | aggregate_reconciliation | consistency | | | | | | | | | | | | | | | GD_GIAODICH | SO_TIEN | 99 | 95 |

**Quy tắc validate:**

| metric_type | Field bắt buộc | Field không dùng (bỏ trống) |
|---|---|---|
| `not_null` | Cột | min, max, pattern, ref_*, expression, ... |
| `fill_rate` | Cột, min_fill_pct | min, max, pattern, ref_*, ... |
| `format_regex` | Cột, pattern | min, max, ref_*, expression, ... |
| `value_range` | Cột, min, max | pattern, ref_*, expression, ... |
| `referential_integrity` | Cột, ref_table, ref_column | min, max, pattern, expression, ... |
| `row_count` | min, max | Cột, pattern, ref_*, ... |
| `aggregate_reconciliation` | source_table, source_column | Cột (dùng khác), pattern, ... |
| ... | ... | ... |

**Ưu điểm:**
- 1 sheet duy nhất cho tất cả rules → dễ dùng
- Cột thừa để trống → không gây lỗi
- Validate phía backend dựa trên metric_type
- User quen Excel, không cần học tool mới

**Nhược điểm:**
- Nhiều cột (ước tính ~20 cột) → bảng rộng
- User có thể nhầm field nào cần điền cho metric nào

**Giải pháp nhược điểm:**
- Sheet "Hướng dẫn" trong cùng file Excel: bảng mapping metric_type → field bắt buộc
- Highlight (conditional formatting) các cột bắt buộc dựa trên metric_type
- Backend validate và trả lỗi rõ ràng: "Dòng 5: metric `format_regex` thiếu field `pattern`"

### Phương án thay thế: Multi-sheet theo nhóm metric

Nhóm các metric có field giống nhau vào 1 sheet:

| Sheet | Metrics | Cột đặc trưng |
|---|---|---|
| Sheet "Cột đơn giản" | not_null, fill_rate, duplicate_single, fixed_datatype | Cột |
| Sheet "Min-Max" | value_range, statistics_bound, sum_range, row_count, table_size | min, max |
| Sheet "Pattern" | format_regex, blacklist_pattern | pattern |
| Sheet "Reference" | referential_integrity, reference_match | ref_table, ref_column |
| Sheet "Cross-table" | aggregate_reconciliation, report_row_count_match, parent_child_match | source_table, source_column |
| Sheet "Time" | on_time, freshness | sla_time / max_age_hours |
| Sheet "Expression" | custom_expression, expression_pct, conditional_not_null | expression |

**Ưu điểm:** Mỗi sheet ít cột hơn, rõ ràng hơn.
**Nhược điểm:** 7 sheet → phức tạp, 1 bảng có rules ở nhiều sheet khác nhau.

### Đề xuất BA

**Dùng phương án 1 (Flat format)** vì:
- Đơn giản hơn cho user (1 sheet = 1 nơi)
- Backend dễ validate hơn
- Có thể bổ sung sheet "Hướng dẫn" để giảm nhầm lẫn
- Phù hợp cho cả export (xuất rules hiện tại → file Excel → sửa → import lại)

---

## Files cần chỉnh sửa (khi implement)

| # | File/Module | Thay đổi |
|---|------------|----------|
| 1 | `src/pages/DataCatalog/` | Gộp form ngưỡng, thêm multi-select, import, partition fields |
| 2 | `src/pages/ThresholdConfig/` | Xóa hoặc chuyển thành Settings "Ngưỡng mặc định" |
| 3 | `src/pages/Rules/` | Liên kết từ Danh mục, import rules từ Excel |
| 4 | `src/pages/Schedule/` | Auto-suggest dựa trên partition_by |
| 5 | `src/pages/Issues/` | Bổ sung trạng thái, assign, comment, lịch sử |
| 6 | `src/pages/Dashboard/` | Build mới: score cards, radar, trend, top 10, tooltip (i) |
| 7 | `src/pages/TableDetail/` | Trang mới: chi tiết bảng (drill-down) |
| 8 | `src/types/` | Cập nhật data model: partition_by, owner, input/output, job lineage |
| 9 | `HDSD.md` | Cập nhật tài liệu theo UI mới |

---

## Verification

- [ ] Tất cả yêu cầu từ 3 nguồn meeting được liệt kê và có phân tích
- [ ] Mỗi yêu cầu có: nguồn, mô tả thay đổi, phản biện BA
- [ ] A3 đã loại bỏ theo feedback stakeholder
- [ ] B3 cập nhật: đồng bộ từ SQLWF (không phải CSV export)
- [ ] B2 có phụ lục thiết kế template cho import rules
- [ ] D3 có cảnh báo mặc định: job owner + table owner + tùy chọn thêm
- [ ] Tooltip (i) được ghi nhận tại E1 và các dashboard components
- [ ] Phân phase hợp lý (dependency đúng)
- [ ] Stakeholder review và confirm priority
