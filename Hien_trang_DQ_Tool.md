# Hiện trạng Data Quality Tool — Phân tích toàn luồng

> **Ngày:** 14/04/2026
> **Mục đích:** Tổng hợp hiện trạng tool, logic từng màn hình, nguồn dữ liệu, câu hỏi cần làm rõ
> **Đối chiếu:** 3 cuộc họp review DQ ngày 08/04/2026 + phân tích code thực tế
> **Mode:** @plan — Phân tích, phản biện

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Luồng nghiệp vụ tổng thể](#2-luồng-nghiệp-vụ-tổng-thể)
3. [Chi tiết từng màn hình](#3-chi-tiết-từng-màn-hình)
   - 3.1 Dashboard
   - 3.2 Danh mục dữ liệu
   - 3.3 Phân tích dữ liệu (Profiling)
   - 3.4 Quản lý Job
   - 3.5 Giám sát Pipeline
   - 3.6 Quản lý quy tắc
   - 3.7 Lịch chạy
   - 3.8 Ngưỡng cảnh báo
   - 3.9 Vấn đề & Sự cố
   - 3.10 Báo cáo chất lượng
   - 3.11 Quản lý thông báo
   - 3.12 Cài đặt
4. [Data Flow — Dữ liệu đi từ đâu đến đâu](#4-data-flow)
5. [Luồng user phải khai báo theo thứ tự](#5-luồng-user-phải-khai-báo-theo-thứ-tự)
6. [Đối chiếu yêu cầu từ meeting notes](#6-đối-chiếu-yêu-cầu-từ-meeting-notes)
7. [Câu hỏi tổng hợp & Mâu thuẫn](#7-câu-hỏi-tổng-hợp--mâu-thuẫn)

---

## 1. Tổng quan hệ thống

### 1.1. Kiến trúc hiện tại

```
Tool DQ (React frontend, mock data)
  │
  └── 12 màn hình chức năng + 3 trang cài đặt
       │
       └── Tất cả dữ liệu đều là MOCK (mockData.ts)
            Chưa có backend / API / database thật
```

### 1.2. Hệ sinh thái liên quan

| Hệ thống | Vai trò | Dữ liệu có | Tích hợp với DQ? |
|---|---|---|---|
| **SQLWF** (SQL Workflow) | Quản lý bảng, quản lý job ETL (kéo thả, viết SQL) | Catalog bảng (~11k), job + input/output, owner, metadata | Chưa — chỉ mock `SQLWF_TABLES` cứng trong code |
| **Pentaho** | Chạy job ETL thực tế | Log chạy job, kết quả ETL | Chưa |
| **Rundeck** | Lập lịch chạy job ETL | Schedule, history, job run status | Chưa |
| **Ambari/HDFS** | Cluster Hadoop, lưu trữ dữ liệu L1-L6 | Dữ liệu thực tế trên HDFS | Chưa |
| **SparkSQL** | Engine xử lý | Chạy query kiểm tra DQ thực tế | Chưa |

### 1.3. Menu sidebar hiện tại

```
📊 Dashboard                          /
─── Quản lý dữ liệu ──────────────────
📦 Danh mục dữ liệu                   /data-catalog
📈 Phân tích dữ liệu                  /profiling
🔀 Quản lý Job                        /pipeline
📡 Giám sát Pipeline                  /pipeline-monitor
─── Cấu hình DQ ───────────────────────
📖 Quản lý quy tắc                    /rules
📅 Lịch chạy                          /schedules
🎚️ Ngưỡng cảnh báo                    /thresholds
─── Giám sát & Báo cáo ───────────────
⚠️ Vấn đề & Sự cố                     /issues
📊 Báo cáo chất lượng                 /reports
─── Hệ thống ──────────────────────────
🔔 Quản lý thông báo                  /notifications
⚙️ Cài đặt                            /settings
    ├── Quy tắc mặc định              /settings/default-rules
    ├── Lịch mặc định                 /settings/default-schedules
    └── Quản lý người dùng            /settings/users
```

---

## 2. Luồng nghiệp vụ tổng thể

### 2.1. Luồng khai báo → vận hành → xử lý

```
Phase 1: KHAI BÁO (user thực hiện)
──────────────────────────────────
  ① Danh mục dữ liệu: Khai báo bảng cần giám sát DQ
       → Nhập tên bảng, chọn loại (Bảng nguồn / Báo cáo / KPI)
       → Set ngưỡng W/C cho 6 chiều (hoặc dùng mặc định)
       
  ② Ngưỡng cảnh báo: Set ngưỡng mặc định cho toàn hệ thống
       → 6 chiều × 2 ngưỡng (Warning / Critical)
       → Nếu không override ở bảng → rule kế thừa ngưỡng này
       
  ③ Quản lý quy tắc: Khai báo metric kiểm tra cho từng bảng
       → Mỗi rule = 1 metric × 1 cột × 1 bảng
       → Có hệ thống mẫu: Mẫu metric / Mẫu cột / Mẫu bảng
       
  ④ Lịch chạy: Cấu hình lịch quét DQ
       → Gán lịch cho từng bảng (daily/weekly/monthly/...)
       → Set giờ chạy, chọn ngày trong tuần

  ⑤ Quản lý thông báo: Cấu hình người nhận cảnh báo
       → Email / SMS / Webhook
       → Trigger: warning / critical / resolved
       → Chọn bảng áp dụng

Phase 2: VẬN HÀNH (hệ thống tự thực hiện)
──────────────────────────────────────────
  ⑥ Engine quét: Chạy rule theo lịch
       → ⚠️ CHƯA CÓ — hiện tại chỉ là mock data
       → Khi có backend: SparkSQL chạy query → tính score → lưu kết quả
       
  ⑦ Tính điểm: Score 0-100 cho mỗi metric
       → Metric score = % pass
       → Dimension score = TB các metric score trong chiều đó
       → Table score = TB 6 dimension scores (chỉ chiều có rule)
       
  ⑧ Sinh Issue: Khi rule vi phạm ngưỡng
       → result = fail/warning → tạo Issue tại "Vấn đề & Sự cố"
       → ⚠️ Logic de-duplication chưa rõ (xem mục 7)

Phase 3: XỬ LÝ (user thực hiện)
────────────────────────────────
  ⑨ Vấn đề & Sự cố: Xem, assign, xử lý issue
       → Assign người xử lý
       → Theo dõi timeline: Mới → Đang xử lý → Đã xử lý → Đóng
       
  ⑩ Báo cáo chất lượng: Xem tổng quan, trend, đối soát
       → Score tổng, theo chiều, theo bảng
       → Drill-down chi tiết
```

### 2.2. Câu hỏi nghiêm trọng về luồng

| # | Câu hỏi | Mức độ |
|---|---|---|
| Q1 | Phase 2 (Engine quét) **chưa tồn tại** — toàn bộ score/result trên UI là mock. Khi nào build backend? | CRITICAL |
| Q2 | Issue được **sinh tự động** (khi quét) hay **tạo thủ công**? Hiện tại mock data có sẵn, không rõ logic sinh | CRITICAL |
| Q3 | User phải khai báo ở **4 màn hình riêng biệt** (Danh mục → Ngưỡng → Quy tắc → Lịch chạy) theo đúng thứ tự. Có guided workflow không? | HIGH |

---

## 3. Chi tiết từng màn hình

---

### 3.1. Dashboard (`/`)

**Mục đích:** Tổng quan sức khỏe chất lượng dữ liệu toàn hệ thống

**Hiện trạng trên UI:**

| Thành phần | Mô tả | Nguồn dữ liệu |
|---|---|---|
| System Score | Điểm DQ tổng hệ thống | `mockDataSources` → tính TB `overallScore` |
| Score theo 6 chiều | Radar chart | `mockDataSources` → `dimensionScores` |
| Trend 30 ngày | Line chart | `mockTrendData` — **dữ liệu mock cứng** |
| Top bảng điểm thấp | Bảng 10 dòng | `mockDataSources` sort by `overallScore` ASC |
| Issues mới nhất | Danh sách | `mockIssues` filter status |
| Bảng chi tiết score | Table + filter | `mockDataSources` + `mockIssues` |

**Phản biện:**

| # | Vấn đề | Chi tiết |
|---|---|---|
| 1 | **Score tổng lấy từ đâu?** | Hiện tại: TB `overallScore` từ mock. Thực tế: phải là kết quả tính TOÁN từ rule → metric score → dimension score → table score → system score. Chưa có engine tính |
| 2 | **Trend data** | `mockTrendData` là dữ liệu giả cứng. Thực tế: phải lưu lịch sử mỗi lần quét → query ra trend. Cần bảng `scan_history` hoặc tương đương |
| 3 | **"Dashboard chưa làm"** (theo MN họp 1) | Nhưng code hiện tại CÓ Dashboard khá đầy đủ (recharts, radar, trend). Mâu thuẫn: đã làm hay chưa? Hay dashboard này là version cũ, stakeholder muốn xây lại? |
| 4 | **Filter chưa có** (theo MN họp 3) | Stakeholder muốn: filter "hôm nay / 7 ngày / 30 ngày". UI hiện tại không có filter thời gian |

**Đối chiếu MN:**
- Họp 3 (dq.txt): "2 hướng — trung bình theo thời gian vs lần quét cuối cùng" → **chưa implement**
- Họp 3: "top 10 điểm thấp nhất HOẶC gặp lỗi nhiều nhất" → UI hiện tại chỉ có top bảng, chưa có top rules
- Họp 1+3: "drill-down 2-3 tầng" → click bảng → `/data-catalog/:id` → có. Nhưng thiếu tầng trung gian (danh sách bảng có điểm)

---

### 3.2. Danh mục dữ liệu (`/data-catalog`)

**Mục đích:** Khai báo các bảng/báo cáo/KPI cần giám sát DQ

**Hiện trạng trên UI:**

| Thành phần | Chức năng | Nguồn dữ liệu |
|---|---|---|
| 3 tab: Bảng nguồn / Báo cáo / Chỉ tiêu KPI | Phân loại moduleType | `mockDataSources` filter `moduleType` |
| Bảng danh sách | Tên, loại, score, 6 chiều, owner, trạng thái | `mockDataSources` |
| Nút "Thêm bảng" | Form thêm mới | Nhập thủ công / chọn từ `SQLWF_TABLES` mock |
| Nút "Import" | Upload file Excel | Template bảng + ngưỡng, Template rule (2 sheet) |
| Chi tiết bảng (`/data-catalog/:id`) | Score, rules, issues, profiling, trend | `mockDataSources` + `mockRules` + `mockIssues` |

**Phân tích form "Thêm bảng":**

```
Form hiện tại gồm:
├── Chọn bảng từ SQLWF (dropdown 12 bảng mock) ← hoặc nhập tay
├── Loại: Bảng nguồn / Báo cáo / Chỉ tiêu KPI
├── Mô tả
├── Schema
├── Chủ sở hữu (owner)
├── Danh mục (category)  
├── Mode: Append / Overwrite
├── Partition: daily / monthly / none
├── Section Ngưỡng: 6 chiều × 2 (W / C) — có thể để trống = kế thừa mặc định
└── Nếu loại = Báo cáo: chọn bảng nguồn liên kết
    Nếu loại = KPI: KPI cha, KPI con, công thức, kỳ báo cáo
```

**Phản biện:**

| # | Vấn đề | Chi tiết |
|---|---|---|
| 1 | **Dropdown SQLWF chỉ có 12 bảng mock** | Thực tế: SQLWF có ~11,000 bảng (3,000 thực dùng). Không thể load hết vào dropdown. Cần: lazy loading + filter theo layer/area + search |
| 2 | **"Bảng đã có trên SQLWF rồi, DQ chỉ cần khai báo cài đặt DQ"** (stakeholder nói) | Nhưng form hiện tại vẫn yêu cầu nhập lại tên, schema, owner,... → **nên lấy metadata từ SQLWF**, user chỉ bổ sung: moduleType, ngưỡng, mode, partition |
| 3 | **Nút Import có 2 chế độ** (Import bảng + Import rule) | Form import bảng có sẵn, import rule cũng có. Nhưng template Excel chưa rõ: sheet nào? cột nào? validate gì? |
| 4 | **Score trên danh sách lấy từ đâu?** | Từ `mockDataSources.overallScore` — dữ liệu mock cứng. Thực tế: phải tính từ kết quả quét → chưa có engine |
| 5 | **"Bảng nguồn liên kết" cho Báo cáo** | Đúng theo MN họp 1: "thay vì khai báo output → khai báo input mà BC dùng". Code đã có `sourceTableIds`. Tuy nhiên, thông tin này cũng có sẵn trên SQLWF (job input/output) |

**Đối chiếu MN:**
- Họp 1 (mục A1): "gộp Danh mục + Ngưỡng" → code đã gộp (form Danh mục đã có section ngưỡng). **Nhưng** màn Ngưỡng cảnh báo riêng vẫn còn trên sidebar
- Họp 2: "đồng bộ metadata từ SQLWF" → `SQLWF_TABLES` mock chỉ 12 bảng, chưa gọi API thật
- Họp 2: "import file Excel cho bảng + ngưỡng + rules" → UI import có sẵn, template đề xuất trong Plan

---

### 3.3. Phân tích dữ liệu — Profiling (`/profiling`)

**Mục đích:** Xem kết quả phân tích cấu trúc dữ liệu (data profiling) — thống kê cột, phân bố giá trị, null rate

**Hiện trạng trên UI:**

| Thành phần | Chức năng | Nguồn dữ liệu |
|---|---|---|
| Bảng danh sách | Tên bảng, loại, lần chạy cuối, score, trạng thái | `mockProfilingResults` + `mockDataSources` |
| Filter | Loại module, trạng thái | State nội bộ |
| Nút "Chạy profiling" | Trigger profiling manual | ⚠️ Chỉ mock (thay đổi state, không chạy thật) |
| Chi tiết profiling (`/profiling/:id`) | Thống kê cột, distribution, null rate | `mockProfilingResults` |

**Phản biện:**

| # | Vấn đề | Chi tiết |
|---|---|---|
| 1 | **Profiling chạy ở đâu?** | Nút "Chạy profiling" chỉ đổi state. Thực tế: cần SparkSQL query analyze bảng trên HDFS → tính null rate, distribution, min/max... Chưa có backend |
| 2 | **Mối quan hệ Profiling vs Rules** | Profiling = phân tích cấu trúc (mô tả dữ liệu). Rules = kiểm tra chất lượng (đánh giá dữ liệu). 2 thứ khác nhau nhưng UI dễ nhầm |
| 3 | **MN họp 2**: "Module Data Profiling bỏ ra khỏi Data Catalog, làm chi tiết ở DQ tool" | Profiling hiện tại ĐÃ là trang riêng (`/profiling`). Stakeholder muốn gì thêm? |

---

### 3.4. Quản lý Job (`/pipeline`)

**Mục đích:** CRUD job ETL (tạo/sửa/xóa job, khai báo input/output tables)

**Hiện trạng trên UI:**

| Thành phần | Chức năng | Nguồn dữ liệu |
|---|---|---|
| Bảng danh sách | Tên job, input, output, schedule, last run, status | `mockPipelineJobs` |
| Nút "Thêm job" | Form tạo job mới (tên, mô tả, owner, technology, input/output tables) | Nhập thủ công |
| Nút Sửa/Xóa | Edit/Delete job | State nội bộ |
| Cột Input/Output | Chips tên bảng (max 1 + "+N") | `mockDataSources` lookup by ID |

**Phản biện:**

| # | Vấn đề | Urgency |
|---|---|---|
| 1 | **TRÙNG LẶP VỚI SQLWF** — SQLWF đã có quản lý job đầy đủ (kéo thả, viết SQL, cấu hình pipeline). Tạo/sửa/xóa job trên DQ vô nghĩa | CRITICAL |
| 2 | **Mock 12 jobs** — thực tế số job trên SQLWF? 10? 100? 1000? | HIGH |
| 3 | **Plan đã chốt**: chuyển sang read-only, bỏ CRUD, đồng bộ từ SQLWF | ĐÃ CÓ PLAN |

**Đối chiếu MN:**
- Họp 2: "Job có sẵn trong SQLWF rồi, ở đây chỉ đồng bộ sang"
- Plan_GiamSatPipeline.md: xóa Thêm/Sửa/Xóa, chuyển sang Giám sát Pipeline

**⚠️ Quyết định:** Trang này sẽ bị thay thế hoặc loại bỏ. Giám sát Pipeline (`/pipeline-monitor`) là trang TO-BE.

---

### 3.5. Giám sát Pipeline (`/pipeline-monitor`)

**Mục đích:** Theo dõi trạng thái DQ trên chuỗi pipeline (Input → Job → Output) — read-only, không CRUD

**Hiện trạng trên UI:**

| Thành phần | Chức năng | Nguồn dữ liệu |
|---|---|---|
| Danh sách job | Bảng phẳng: Tên job, DQ score, tiến độ quét, input/output count | `mockPipelineJobs` + `mockDataSources` + `mockSchedules` |
| Chi tiết job (`/pipeline-monitor/:jobId`) | Card thông tin + ReactFlow graph (Input nodes → Job node → Output nodes) | Same as above |
| ReactFlow graph | Node bảng: tên, score, grade, scan status, issues count. Node job: tên, technology, last run | `mockDataSources` → score, grade. `mockSchedules` → scan status. `mockIssues` → issues count |
| Click node bảng | Mở Drawer chi tiết bên phải: score, rule results, issues | `mockRules` filter by tableId, `mockIssues` filter by tableId |
| Click issue trong Drawer | Navigate → `/issues/:id` (trang chi tiết issue) | |
| Nút "Xem tổng quan bảng" | Navigate → `/data-catalog/:tableId` | |
| Background canvas | Cross grid mờ + MiniMap + Legend + Controls | ReactFlow built-in |

**Phản biện — Các câu hỏi trọng tâm:**

| # | Câu hỏi | Chi tiết | Urgency |
|---|---|---|---|
| 1 | **Job chạy nhiều lần/ngày → scan status hiển thị lần nào?** | Job ETL có thể chạy 3-4 lần/ngày (7h, 10h, 14h, 18h theo MN họp 2). Hiện tại `mockSchedules` chỉ có 1 `lastRun` / `nextRun` per bảng → chỉ hiển thị lần gần nhất. Các lần trước mất. **Cần `scan_runs[]` array** để lưu lịch sử nhiều lần quét | CRITICAL |
| 2 | **Scan status lấy từ đâu?** | `mockSchedules.lastRunStatus`: success/failed/partial. Thực tế: ai ghi giá trị này? Cần backend engine scan → ghi kết quả → DQ tool đọc | CRITICAL |
| 3 | **DQ Score trên node lấy từ đâu?** | `mockDataSources.overallScore` — cứng. Thực tế: kết quả quét gần nhất → tính score → ghi vào DataSource. Chưa có engine | CRITICAL |
| 4 | **Issues count lấy từ đâu?** | `mockIssues` filter `tableId + status != resolved/closed`. Thực tế: issue phải được sinh từ kết quả quét (khi rule fail) → chưa có logic sinh tự động | HIGH |
| 5 | **Job lineage — chỉ 1 cấp** | Hiện tại mỗi job hiển thị input → job → output (1 cấp). Nhưng output của job A có thể là input của job B → cần multi-layer lineage. Phase 1 chấp nhận 1 cấp, Phase 2 mới mở rộng? | MEDIUM |
| 6 | **"Quét theo khung giờ, trả kết quả tổng hợp"** (MN họp 2, mục 4) | Stakeholder muốn: 10h quét lần 1 → 3 bảng NOT OK; 12h quét lần 2 → 1 bảng vẫn NOT OK. UI hiện tại **không có view theo khung giờ** — chỉ hiển thị trạng thái mới nhất | HIGH |

**Case phân tích: Job chạy nhiều lần/ngày**

```
Ví dụ: RPT_BAO_CAO_NGAY chạy 3 lần/ngày (7h, 11h, 17h)

Lần 1 (7h): Input GD_GD chưa có dữ liệu → scan result = fail
Lần 2 (11h): GD_GD đã load → scan result = warning (94%)
Lần 3 (17h): GD_GD đã chuẩn hóa → scan result = pass (98%)

Câu hỏi:
- Node trên pipeline hiển thị score nào? Lần cuối (98%) hay trung bình (?)
- Drawer chi tiết hiển thị 3 lần quét hay chỉ lần cuối?
- Issue ở lần 1 (fail) → lần 3 pass → tự đóng issue?

Đề xuất: Node hiển thị lần quét cuối cùng. Drawer có tab "Lịch sử quét" 
cho phép xem các lần trước trong ngày.
```

**Đối chiếu MN:**
- Họp 2: "visualization pipeline nguồn → báo cáo" → code đã có ReactFlow graph
- Họp 2: "summary trạng thái nguồn của 1 báo cáo: 7/10 OK, 3 NOT OK" → Drawer hiện có rule results summary. Nhưng chưa có summary ở cấp pipeline card
- Họp 2: "bảng input lỗi → raise cảnh báo output" → code chưa có impact message tự động. Chỉ có visual (edge color đỏ khi input fail)

---

### 3.6. Quản lý quy tắc (`/rules`)

**Mục đích:** Khai báo các metric kiểm tra chất lượng dữ liệu cho từng bảng

**Hiện trạng trên UI — 3 tab:**

| Tab | Chức năng | Nguồn dữ liệu |
|---|---|---|
| **Quy tắc** | Danh sách rule đã khai báo. Mỗi rule = 1 metric × 1 bảng (× 1 cột nếu cần). Filter theo chiều, trạng thái, bảng, loại module | `mockRules` (43 rules) |
| **Mẫu quy tắc** (Templates) | Mẫu metric dùng lại. VD: "Kiểm tra cột bắt buộc không null". Chọn mẫu → fill nhanh form tạo rule | `mockRuleTemplates` |
| **Mẫu bảng** (Table Profiles) | Nhóm các metric templates + column profiles theo loại bảng + mode + partition. VD: "Bảng daily append" → tự gợi ý set rule | `mockTableProfiles` |

**Hệ thống mẫu 3 tầng:**

```
Mẫu metric (Rule Templates)
  └── Mẫu có sẵn: not_null, format_regex, value_range, duplicate_single,...
  └── User chọn mẫu → điền bảng + cột → tạo rule nhanh

Mẫu cột (Column Profiles)  
  └── Nhóm cột giống nhau (VD: cột "email" ở nhiều bảng)
  └── Gán sẵn metric templates cho nhóm cột
  └── VD: Cột "EMAIL" → áp 2 rule: not_null + format_regex

Mẫu bảng (Table Profiles)
  └── Gom: loại bảng (source/report/kpi) + mode + partition
  └── Chứa: table-level metric templates + column profiles
  └── VD: "Bảng daily append" → gợi ý: row_count, time_coverage, volume_change
```

**Form tạo rule:**

```
Form gồm:
├── Chọn bảng (dropdown từ mockDataSources)
├── Chọn metric type (28 loại: not_null, format_regex, value_range,...)
├── Chọn chiều DQ (completeness / validity / consistency / ...)
├── Cấu hình metric (khác nhau theo metric type):
│   ├── not_null: chọn cột
│   ├── format_regex: chọn cột + nhập pattern
│   ├── value_range: chọn cột + min + max
│   ├── referential_integrity: chọn cột + ref_table + ref_column
│   ├── aggregate_reconciliation: chọn source_table + source_column
│   └── ... (28 loại)
├── Ngưỡng W/C (kế thừa global hoặc override)
└── Tên + Mô tả
```

**Phản biện:**

| # | Vấn đề | Chi tiết |
|---|---|---|
| 1 | **28 metric types** → form phức tạp | Mỗi metric type có bộ field riêng. UI hiện tại handle bằng conditional rendering (show/hide field theo metric_type). Khá ổn nhưng user lần đầu sẽ bối rối |
| 2 | **Rule lấy score từ đâu?** | `mockRules` có `lastScore`, `lastResult`, `lastRunAt` — mock cứng. Thực tế: engine quét chạy rule → ghi kết quả. Chưa có engine |
| 3 | **"Mẫu bảng" gợi ý khi nào?** | Khi thêm bảng ở Danh mục, có tự suggest mẫu bảng không? → **Chưa có liên kết**. Mẫu bảng hiện chỉ nằm ở tab 3 trong trang Rules, user phải tự vào xem |
| 4 | **Import rule từ Excel** | Tab Import có trên trang Danh mục. Nhưng validate rule phức tạp (28 metric types × fields khác nhau). Đã có thiết kế template flat trong Plan |
| 5 | **"Tích chọn nhiều cột cùng lúc"** (MN họp 2) | MN yêu cầu: multi-select cột để áp cùng 1 rule. Code hiện tại chỉ chọn 1 cột per rule. Chưa implement multi-select |

**Đối chiếu MN:**
- Họp 2 mục 2: "Tạo template metric theo nhóm, dùng mẫu áp nhanh" → code có Mẫu quy tắc (templates). Tuy nhiên chỉ dùng khi tạo rule mới trong form, không có nút "áp nhanh cho nhiều bảng"
- Họp 2 mục 5: "custom SQL trong rule" → metric type `custom_expression` đã có. Nhưng user có thể viết SQL tùy ý không? Hay chỉ expression đơn giản?

---

### 3.7. Lịch chạy (`/schedules`)

**Mục đích:** Cấu hình lịch quét DQ cho từng bảng

**Hiện trạng trên UI:**

| Thành phần | Chức năng | Nguồn dữ liệu |
|---|---|---|
| Bảng danh sách | Tên lịch, bảng, tần suất, giờ chạy, Last run, Next run, trạng thái, số QT (quy tắc) | `mockSchedules` (10 entries) |
| Nút "Thêm lịch" | Form: chọn bảng, tần suất, giờ chạy, ngày trong tuần | Nhập thủ công |
| Nút Sửa/Xóa | Edit/Delete schedule | State nội bộ |
| Switch Active/Inactive | Bật tắt lịch | State nội bộ |
| Nút "Chạy ngay" | Trigger quét thủ công | ⚠️ Chỉ mock — thay đổi `lastRunStatus` |

**Phản biện:**

| # | Câu hỏi | Chi tiết | Urgency |
|---|---|---|---|
| 1 | **Lịch chạy DQ hay lịch chạy ETL?** | Trang này là lịch quét DQ (chạy rule kiểm tra). Lịch chạy ETL (Pentaho/Rundeck) là riêng. 2 lịch này CẦN PHỐI HỢP: DQ scan phải chạy SAU khi ETL load data xong. Hiện tại 2 lịch hoàn toàn độc lập | CRITICAL |
| 2 | **"Giờ cần dữ liệu"** (MN họp 2) | Stakeholder muốn: khi khai báo bảng, nhập "giờ mong muốn có dữ liệu" (VD: 8h sáng). Hệ thống tự phân loại vào khung quét phù hợp. UI hiện tại **không có trường này** | HIGH |
| 3 | **Auto-schedule theo partition** (MN họp 2, Plan mục C3) | Bảng partition_by = daily → tự lịch daily. Monthly → monthly. Hiện tại: user phải tạo lịch thủ công cho từng bảng | HIGH |
| 4 | **"Quét trước khi dữ liệu đồng bộ xong → cảnh báo vô nghĩa"** (MN họp 2, mục 1) | Nếu DQ scan 6h nhưng ETL chạy 7h → scan thiếu data → false alarm. Cần biết lịch ETL từ Rundeck | CRITICAL |
| 5 | **Số QT (quy tắc) trên mỗi lịch** | Cột hiển thị `schedule.rulesCount`. Nhưng con số này lấy từ đâu? `mockSchedules` có field `rulesCount` nhưng không link trực tiếp với `mockRules`. Thực tế: số rule active cho bảng đó | MEDIUM |
| 6 | **Last run, Next run lấy từ đâu?** | Mock cứng. Thực tế: Rundeck/scheduler ghi. DQ tool cần đọc từ scheduler | MEDIUM |
| 7 | **"Nút chạy ngay" thực tế chạy gì?** | Hiện tại: chỉ mock. Thực tế: phải trigger SparkSQL job chạy tất cả active rules cho bảng đó. Qua Rundeck? Qua API trực tiếp? | HIGH |

**Đối chiếu MN:**
- Họp 2 mục 4.1: "Phân loại nhóm bảng theo khung giờ: daily/monthly/weekly lịch khác nhau" — UI hiện tại có field frequency nhưng chưa auto-suggest
- Họp 2 mục 4.5: "Staff nhận tổng hợp 1 lần: 8h → nhận list tổng hợp tất cả lỗi" — chưa implement
- Họp 2 mục 4.7: "Ignore cảnh báo vô nghĩa: nếu bảng chưa đến giờ đồng bộ mà quét → ignore" — chưa có trường "giờ cần dữ liệu" nên chưa thể implement

---

### 3.8. Ngưỡng cảnh báo (`/thresholds`)

**Mục đích:** Cấu hình ngưỡng Warning / Critical cho 6 chiều DQ — áp dụng toàn hệ thống (mặc định) hoặc từng bảng

**Hiện trạng trên UI:**

| Thành phần | Chức năng | Nguồn dữ liệu |
|---|---|---|
| 6 card chiều DQ | Mỗi card: slider/input W và C | `mockThresholds` + `_globalThresholds` (module-level store) |
| Bảng override | Ngưỡng riêng cho từng bảng (nếu có) | `mockThresholds` filter `tableId != null` |
| Nút Thêm override | Form: chọn bảng, chọn chiều, nhập W/C | Nhập thủ công |

**Phản biện:**

| # | Vấn đề | Chi tiết |
|---|---|---|
| 1 | **Trang này TỒN TẠI song song với section ngưỡng ở Danh mục** | Form "Thêm bảng" trong Danh mục ĐÃ có 6 cặp W/C. Nhưng trang Ngưỡng cảnh báo riêng vẫn còn trên sidebar. Trùng lặp |
| 2 | **MN họp 1 (mục A1): "gộp Danh mục + Ngưỡng thành 1"** | Stakeholder yêu cầu xóa trang Ngưỡng riêng, gộp vào Danh mục. Code Danh mục đã gộp (có section ngưỡng). Nhưng trang `/thresholds` chưa xóa |
| 3 | **Ngưỡng mặc định → rule kế thừa** | Logic: trang này set global default → khi tạo rule, ngưỡng W/C pre-fill từ global → user override nếu cần. Logic này hoạt động qua hàm `getGlobalThreshold()` export từ trang Thresholds |

**Quyết định cần:** Xóa trang Ngưỡng khỏi sidebar? Chuyển global thresholds vào Settings? Hay giữ nguyên?

---

### 3.9. Vấn đề & Sự cố (`/issues`)

**Mục đích:** Quản lý các vấn đề chất lượng dữ liệu phát hiện được — assign, theo dõi, xử lý

**Hiện trạng trên UI:**

| Thành phần | Chức năng | Nguồn dữ liệu |
|---|---|---|
| Bảng danh sách | Title, mức độ, trạng thái, bảng, loại, chiều DQ, phát hiện lúc, người xử lý | `mockIssues` (11 issues) |
| Filter | Severity, status, dimension, module, search | State nội bộ |
| Chi tiết issue (`/issues/:id`) | Mô tả, severity, status, timeline (events), rule liên quan | `mockIssues` → find by id |
| Cascade chain | Hiển thị: bảng A lỗi → ảnh hưởng bảng B, C (downstream) | `mockCascadeChains` |
| Timeline | Events: created → assigned → comment → status_changed → resolved | `issue.timeline` array |

**Trạng thái vòng đời hiện tại:**

```
new → assigned → in_progress → pending_review → resolved → closed
```

**Phản biện:**

| # | Câu hỏi | Chi tiết | Urgency |
|---|---|---|---|
| 1 | **Issue được sinh tự động hay tạo thủ công?** | Mock data có 11 issues sẵn. Không có nút "Tạo issue". Ngụ ý: issue sinh tự động khi rule fail. Nhưng logic này chưa tồn tại (chưa có engine quét) | CRITICAL |
| 2 | **1 rule fail = 1 issue? Hay gộp?** | Mock data: mỗi issue gắn 1 ruleId. Nhưng nếu rule fail liên tiếp 3 lần quét → tạo 3 issue hay cập nhật issue cũ? Logic de-duplication chưa rõ | CRITICAL |
| 3 | **"Tạm hoãn / Mở lại"** (MN họp 1, mục F1) | Stakeholder muốn thêm. UI hiện tại chưa có nút "Tạm hoãn". Plan: Phase 1 giữ 4 trạng thái đơn giản, Phase 2 thêm | MEDIUM |
| 4 | **Cascade chain hiển thị nhưng logic tạo ra như thế nào?** | `mockCascadeChains` mock cứng. Thực tế: khi bảng A lỗi → traverse dependency graph (từ job input/output) → tìm downstream → tạo cascade chain. Logic này chưa có | HIGH |
| 5 | **Assign người xử lý** | UI cho thấy `assignedTo` trên mock data. Nhưng không có form để assign. Chi tiết issue chỉ hiển thị timeline, không có action buttons (assign/change status/comment) | HIGH |
| 6 | **"Gửi cảnh báo cho owner bảng" (MN họp 2)** | Khi issue sinh → gửi cho ai? Logic notification trigger chưa link với issue creation | HIGH |

**Đối chiếu MN:**
- Họp 1 mục F1: "trạng thái chi tiết: Mới → Đang xử lý → Đã xử lý → Đóng + Tạm hoãn + Mở lại" → code có 6 status nhưng thiếu action UI
- Họp 1: "assign người xử lý, ghi chú/comment, đổi mức độ, lịch sử thay đổi" → Timeline có nhưng là mock. Chưa có form comment/assign
- Họp 2 mục 3: "bấm vào lỗi → mô tả lỗi: bao nhiêu bản ghi lỗi, tỷ lệ %, trường nào, download danh sách" → chưa implement drill-down bản ghi lỗi

---

### 3.10. Báo cáo chất lượng (`/reports`)

**Mục đích:** Xuất báo cáo tổng hợp DQ — score theo thời gian, theo bảng, đối soát

**Hiện trạng trên UI:**

| Thành phần | Chức năng | Nguồn dữ liệu |
|---|---|---|
| Tab "Tổng quan" | Chart trend, score cards, danh sách bảng + score | `mockTrendData`, `mockDataSources` |
| Tab "Đối soát" | So sánh giá trị aggregation giữa bảng nguồn và bảng báo cáo | `reconciliationResults` mock |
| Tab "Chi tiết" | Chọn bảng → xem score theo chiều, rules, radar chart | `mockDataSources`, `mockRules` |
| Nút "Tải PDF" | Export báo cáo | ⚠️ Chưa implement thực tế |

**Phản biện:**

| # | Câu hỏi | Chi tiết |
|---|---|---|
| 1 | **Trend data lấy từ đâu?** | `mockTrendData` — mock 30 ngày. Thực tế: mỗi lần quét → lưu score → query lịch sử. Cần bảng `scan_history` |
| 2 | **Đối soát: so sánh AI gì?** | `reconciliationResults` mock: so SUM cột báo cáo vs SUM cột nguồn. Thực tế: rule type `aggregate_reconciliation` chạy query thật. Kết quả đối soát = kết quả rule |
| 3 | **Stakeholder muốn gì thêm?** (MN họp 3) | "drill-down 2-3 tầng", "top lỗi thường xuyên", "lỗi mới phát sinh vs tuần trước" → chưa có |

---

### 3.11. Quản lý thông báo (`/notifications`)

**Mục đích:** Cấu hình kênh gửi thông báo khi có vấn đề DQ

**Hiện trạng trên UI:**

| Thành phần | Chức năng | Nguồn dữ liệu |
|---|---|---|
| Danh sách notification config | Mỗi config: tên, loại (email/sms/webhook), recipients, triggers, bảng áp dụng | `mockNotifications` |
| Form tạo/sửa | Email/SMS/Webhook, recipients, trigger events (warning/critical/resolved), chọn bảng | Nhập thủ công |
| Switch Active/Inactive | Bật tắt thông báo | State nội bộ |
| Nút "Gửi thử" | Test notification | ⚠️ Mock — chỉ hiện toast |
| Section "Cấu hình cascade" | Toggle: tự đặt trạng thái downstream, tự chạy lại, tự resolve, cascade depth | `cascadeConfig` mock |

**Phản biện:**

| # | Câu hỏi | Chi tiết | Urgency |
|---|---|---|---|
| 1 | **Gửi mail cho ai?** | Config có `recipients` (danh sách email). Nhưng ai nhận? Owner bảng? Staff vận hành? Quản lý? | CRITICAL |
| 2 | **Trigger khi nào?** | Config: trigger on warning/critical/resolved. Nhưng trigger từ đâu? Từ kết quả quét (engine chưa có) hay từ issue status change? | CRITICAL |
| 3 | **"Gửi cho owner bảng" (MN họp 2)** | Owner ghi ở `DataSource.owner`. Notification config ghi `recipients` = email list. 2 thứ không link. Nếu owner bảng thay đổi → notification config vẫn gửi email cũ? | HIGH |
| 4 | **"Staff nhận tổng hợp 1 lần" (MN họp 2)** | Stakeholder muốn: 1 email tổng hợp tất cả lỗi lúc 8h. UI hiện tại: gửi riêng lẻ per event. Chưa có batch summary mode | HIGH |
| 5 | **"Kênh: Telegram" (MN họp 2)** | MN ghi kênh thông báo = "Tool + Telegram". UI chỉ có: email/sms/webhook. Chưa có Telegram integration | MEDIUM |
| 6 | **Cascade notification** | Config có `notifyDownstream`, `cascadeDepth`. Nhưng logic cascade chạy trên engine nào? Mock chỉ config, chưa có runtime logic | HIGH |

**Đối chiếu MN:**
- Họp 2 mục 4.4: "Gửi cảnh báo cho owner bảng" → chưa link owner ↔ notification
- Họp 2 mục 4.5: "1 lần list tổng hợp tất cả lỗi" → chưa có batch mode
- Họp 2 mục 4.6: "Kênh: màn hình tool + Telegram" → thiếu Telegram

---

### 3.12. Cài đặt (`/settings`)

**3 trang con:**

| Trang | Mục đích | Nội dung |
|---|---|---|
| Quy tắc mặc định (`/settings/default-rules`) | Cấu hình rule templates mặc định khi tạo bảng mới | Chọn templates áp dụng tự động |
| Lịch mặc định (`/settings/default-schedules`) | Cấu hình lịch quét mặc định theo loại bảng | Daily/weekly/monthly defaults |
| Quản lý người dùng (`/settings/users`) | CRUD user, phân quyền | Danh sách user, role, department |

**Phản biện:**
- "Quy tắc mặc định" link với hệ thống mẫu 3 tầng ở Rules hay hoạt động riêng?
- "Lịch mặc định" link với auto-schedule theo partition (Plan mục C3) hay riêng?
- Phân quyền: ai được tạo rule? ai được assign issue? → MN họp 2 mục 5: "phân quyền khai báo rule"

---

## 4. Data Flow — Dữ liệu đi từ đâu đến đâu

### 4.1. Sơ đồ tổng thể nguồn dữ liệu

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HỆ THỐNG BÊN NGOÀI                              │
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐       │
│  │  SQLWF   │   │ Pentaho  │   │ Rundeck  │   │  HDFS    │       │
│  │          │   │          │   │          │   │ L1-L6    │       │
│  │ • Bảng   │   │ • ETL    │   │ • Lịch   │   │ • Data   │       │
│  │ • Job    │   │ • Log    │   │ • History │   │   thật   │       │
│  │ • Owner  │   │ • Status │   │ • Status  │   │          │       │
│  │ • Area   │   │          │   │           │   │          │       │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘       │
│       │               │               │               │            │
└───────┼───────────────┼───────────────┼───────────────┼────────────┘
        │               │               │               │
        ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DQ TOOL (hiện tại = MOCK)                        │
│                                                                     │
│  ┌─────────────────┐    CHƯA CÓ     ┌──────────────────┐          │
│  │ USER KHAI BÁO   │──────────→     │ ENGINE QUÉT (❌) │          │
│  │                 │   ← cần build   │                  │          │
│  │ • Bảng (DM)     │                 │ SparkSQL query   │          │
│  │ • Rule (QT)     │                 │ trên HDFS data   │          │
│  │ • Lịch (LC)     │                 │ → tính score     │          │
│  │ • Ngưỡng (NC)   │                 │ → sinh issue     │          │
│  │ • Thông báo     │                 │ → gửi alert      │          │
│  └────────┬────────┘                 └────────┬─────────┘          │
│           │                                    │                    │
│           ▼                                    ▼                    │
│  ┌──────────────────────────────────────────────────┐              │
│  │              UI HIỂN THỊ                          │              │
│  │                                                   │              │
│  │  Dashboard: score, trend, top lỗi                │              │
│  │  Pipeline: graph, node status                     │              │
│  │  Issues: danh sách vấn đề                        │              │
│  │  Reports: báo cáo tổng hợp                       │              │
│  │                                                   │              │
│  │  ⚠️ TẤT CẢ SỐ LIỆU TRÊN UI = MOCK DATA         │              │
│  └──────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2. Tracing từng thông tin trên UI — "Lấy từ đâu?"

| Thông tin trên UI | Hiện tại lấy từ | Thực tế phải lấy từ | Gap |
|---|---|---|---|
| Tên bảng, schema | `mockDataSources` (nhập tay) | SQLWF API (catalog bảng) | Chưa tích hợp SQLWF |
| Owner bảng | `mockDataSources.owner` (nhập tay) | SQLWF (người tạo bảng) | Chưa sync |
| Mode (append/overwrite) | `mockDataSources.mode` (nhập tay) | SQLWF metadata | Chưa sync |
| Partition by | `mockDataSources.partitionBy` (nhập tay) | SQLWF metadata | Chưa sync |
| Jobs (danh sách) | `mockPipelineJobs` (nhập tay/mock) | SQLWF API (quản lý job) | Chưa tích hợp |
| Job input/output | `mockPipelineJobs.inputTableIds` | SQLWF nodes (bảng in/out mỗi job) | Chưa sync |
| Job run status | `mockPipelineJobs.lastRunStatus` | Pentaho log + Rundeck history | Chưa tích hợp |
| Job schedule | `mockPipelineJobs.schedule` | Rundeck schedule config | Chưa tích hợp |
| DQ Score (overallScore) | `mockDataSources.overallScore` (cứng) | Engine quét → tính từ rule results | **ENGINE CHƯA CÓ** |
| Dimension scores | `mockDataSources.dimensionScores` (cứng) | Engine quét → TB metric scores theo chiều | **ENGINE CHƯA CÓ** |
| Rule results (pass/fail) | `mockRules.lastResult` (cứng) | Engine quét → chạy SparkSQL → so ngưỡng | **ENGINE CHƯA CÓ** |
| Rule score | `mockRules.lastScore` (cứng) | Engine quét → % pass | **ENGINE CHƯA CÓ** |
| Scan status | `mockSchedules.lastRunStatus` (cứng) | Scheduler (Rundeck/custom) chạy → ghi kết quả | **ENGINE CHƯA CÓ** |
| Last run time | `mockSchedules.lastRun` (cứng) | Scheduler ghi | **SCHEDULER CHƯA CÓ** |
| Issues | `mockIssues` (cứng) | Engine quét → rule fail → sinh issue tự động | **ENGINE CHƯA CÓ** |
| Cascade chains | `mockCascadeChains` (cứng) | Engine → traverse lineage graph → tìm downstream | **ENGINE CHƯA CÓ** |
| Trend data (30 ngày) | `mockTrendData` (cứng) | Lưu lịch sử mỗi lần quét → query | **HISTORY TABLE CHƯA CÓ** |
| Profiling results | `mockProfilingResults` (cứng) | SparkSQL analyze table → null rate, distribution | **ENGINE CHƯA CÓ** |
| Thông báo gửi | Mock toast | Email/SMS/Webhook API gửi thật | **NOTIFICATION SERVICE CHƯA CÓ** |

---

## 5. Luồng user phải khai báo theo thứ tự

### 5.1. Luồng khai báo lần đầu (first-time setup)

```
Bước 1: Cài đặt → Ngưỡng mặc định
────────────────────────────────────
  Vào: /thresholds (hoặc /settings)
  Làm: Set 6 cặp W/C mặc định cho toàn hệ thống
  VD:  Completeness: W=90, C=80
       Validity: W=85, C=70
       ...
  Vì:  Rule tạo sau sẽ kế thừa ngưỡng này

       ↓

Bước 2: Danh mục dữ liệu → Thêm bảng
──────────────────────────────────────
  Vào: /data-catalog
  Làm: Thêm bảng cần giám sát DQ
       - Chọn bảng từ SQLWF (hoặc nhập tay)
       - Chọn loại: Bảng nguồn / Báo cáo / KPI
       - Override ngưỡng nếu cần (không thì kế thừa Bước 1)
       - Nếu Báo cáo: chọn bảng nguồn liên kết
       - Nếu KPI: khai báo KPI cha/con, công thức
  Import: Hoặc import hàng loạt từ Excel

       ↓

Bước 3: Quản lý quy tắc → Tạo rule
───────────────────────────────────
  Vào: /rules
  Làm: Tạo rule kiểm tra cho bảng (ĐÃ khai ở Bước 2)
       - Chọn bảng → chọn metric type → chọn cột
       - Hoặc: dùng Mẫu quy tắc (template)
       - Hoặc: dùng Mẫu bảng (áp batch)
  Import: Hoặc import từ Excel (Sheet 2 trong template)
  
  ⚠️ NẾU KHÔNG TẠO RULE → BẢNG KHÔNG ĐƯỢC QUÉT → 
     SCORE = "CHƯA QUÉT" → VÔ NGHĨA

       ↓

Bước 4: Lịch chạy → Tạo lịch quét
──────────────────────────────────
  Vào: /schedules
  Làm: Tạo lịch cho bảng (ĐÃ có rule ở Bước 3)
       - Chọn bảng, tần suất (daily/weekly/...)
       - Set giờ chạy
  
  ⚠️ NẾU KHÔNG TẠO LỊCH → RULE KHÔNG TỰ CHẠY → 
     CHỈ CÓ THỂ "CHẠY THỦ CÔNG"

       ↓

Bước 5: Quản lý thông báo → Cấu hình alert
────────────────────────────────────────────
  Vào: /notifications
  Làm: - Chọn kênh (email/sms/webhook)
       - Nhập recipients
       - Chọn trigger events (warning/critical/resolved)
       - Chọn bảng áp dụng
  
  ⚠️ NẾU KHÔNG CẤU HÌNH → KHÔNG AI NHẬN THÔNG BÁO
     KHI CÓ LỖI

       ↓

Bước 6: (AUTO) Engine quét chạy
───────────────────────────────
  Hệ thống: Theo lịch (Bước 4), tự chạy rules (Bước 3)
  Kết quả: Score, pass/fail per rule → hiển thị trên Dashboard, Pipeline, Reports
  Nếu fail: Sinh Issue ở "Vấn đề & Sự cố" + Gửi thông báo (Bước 5)
  
  ⚠️ BƯỚC NÀY CHƯA TỒN TẠI — CẦN BACKEND
```

### 5.2. Nguy cơ usability

| Nguy cơ | Mô tả | Giải pháp đề xuất |
|---|---|---|
| User không biết luồng | 5 bước ở 5 trang khác nhau, không có hướng dẫn | Wizard/"Getting started" hoặc checklist tiến độ |
| Quên tạo lịch | Có rule nhưng không lịch → bảng không được quét | Auto-suggest lịch khi tạo rule |
| Quên cấu hình thông báo | Có lỗi nhưng không ai nhận | Default: gửi cho owner bảng (không cần cấu hình riêng) |
| Ngưỡng inconsistent | Global ≠ bảng ≠ rule → khó hiểu | Hiển thị rõ: "Đang dùng ngưỡng: Global / Bảng / Rule" |

---

## 6. Đối chiếu yêu cầu từ meeting notes

### Trạng thái implement vs yêu cầu

| # | Yêu cầu (từ MN) | Trạng thái | Ghi chú |
|---|---|---|---|
| **A1** | Gộp Danh mục + Ngưỡng | ✅ Đã gộp (form có section ngưỡng) | Nhưng trang `/thresholds` riêng vẫn tồn tại |
| **A2** | Quy tắc giữ riêng | ✅ Giữ riêng | Có 3 tab: Rules / Templates / Table Profiles |
| **B1** | Multi-select dropdown cho bảng (L1-L6) | ⚠️ Partial | Có dropdown nhưng chỉ 12 bảng mock. Chưa lazy load/filter layer |
| **B2** | Import file bảng + ngưỡng + rules | ✅ UI có | 2 mode import trên trang Danh mục. Template cần test |
| **B3** | Đồng bộ metadata từ SQLWF | ❌ Chưa | `SQLWF_TABLES` mock 12 bảng cứng trong code, không gọi API |
| **C1** | Override vs Append mode | ⚠️ Partial | Field `mode` có trên DataSource. Logic scan WHERE partition chưa có (backend) |
| **C2** | Cách tính DQ Score | ⚠️ Partial | Code tính TB nhưng từ mock data. Engine tính thật chưa có |
| **C3** | Auto-schedule theo partition | ❌ Chưa | Lịch hoàn toàn thủ công |
| **D1** | BC: bảng nguồn liên kết | ✅ Có | `sourceTableIds` trên DataSource, form báo cáo có multi-select |
| **D2** | KPI quick-add rule | ❌ Chưa | Form KPI không có section "Quick Rule" |
| **D3** | Input/Output + cascade alerting | ⚠️ Partial | Pipeline graph có. Cascade chain có mock. Logic runtime chưa có |
| **E1** | Dashboard tổng quan + tooltip | ⚠️ Partial | Dashboard có (khá đầy đủ). Tooltip (i) có. Thiếu filter thời gian |
| **E2** | Top lỗi thường xuyên | ❌ Chưa | Dashboard chỉ có top bảng score thấp, chưa có top rules fail |
| **E3** | Drill-down chi tiết bảng | ✅ Có | `/data-catalog/:id` hiển thị chi tiết. Thiếu tầng trung gian |
| **F1** | Trạng thái sự cố chi tiết | ⚠️ Partial | 6 status có nhưng thiếu action UI (assign, comment, change status) |
| **G1** | Owner = người tạo bảng trên SQLWF | ❌ Chưa | Owner nhập tay trên DQ |
| **G2** | Partition metadata | ✅ Có | Field `partitionBy`, `mode` có trên DataSource |
| **Họp 2** | "Giờ cần dữ liệu" khi khai báo bảng | ❌ Chưa | Không có field này. Cần để phối hợp lịch quét DQ vs lịch ETL |
| **Họp 2** | Quét theo khung giờ, trả kết quả tổng hợp | ❌ Chưa | Lịch chạy per bảng, không có khung giờ batch + summary |
| **Họp 2** | Telegram notification | ❌ Chưa | Chỉ có email/sms/webhook |
| **Họp 2** | "Tích chọn nhiều cột cùng lúc" áp rule | ❌ Chưa | 1 rule = 1 cột |
| **Họp 2** | "Retry / chạy lại manual" | ⚠️ Partial | Nút "Chạy ngay" trên Lịch chạy, nhưng chỉ mock |
| **Họp 2** | "Sau ETL xong tự trigger quét DQ" | ❌ Chưa | 2 lịch (ETL + DQ) hoàn toàn độc lập |
| **Họp 2** | Download danh sách bản ghi lỗi | ❌ Chưa | Issue chỉ hiện mô tả, không có data-level drill-down |
| **Họp 3** | Filter "hôm nay / 7 ngày / 30 ngày" cho Dashboard | ❌ Chưa | Dashboard không có filter thời gian |

---

## 7. Câu hỏi tổng hợp & Mâu thuẫn

### 7.1. Câu hỏi CRITICAL — cần trả lời trước khi phát triển tiếp

| # | Câu hỏi | Context | Impact |
|---|---|---|---|
| **Q1** | **Backend engine quét chạy trên platform nào?** SparkSQL trực tiếp? Qua Pentaho? Qua Rundeck schedule? Microservice riêng? | Toàn bộ giá trị score/result/issue trên UI phụ thuộc engine này | Blocker cho tất cả tính năng DQ thật |
| **Q2** | **SQLWF có REST API không?** Endpoint nào lấy catalog bảng? Job? Input/Output? | Quyết định cách đồng bộ metadata (B3) | Blocker cho Danh mục + Pipeline |
| **Q3** | **Kết quả quét lưu ở đâu?** DB nào (PostgreSQL? Hive? HDFS)? Schema nào? | Quyết định architecture backend | Blocker cho tất cả |
| **Q4** | **Lịch ETL (Rundeck) lấy được không?** API? Webhook khi job xong? | Phối hợp lịch DQ scan vs ETL | Tránh false alarm (quét trước khi data load) |
| **Q5** | **Ai quản lý user/auth?** DQ tool có hệ thống đăng nhập? SSO? Role-based? | Phân quyền: ai tạo rule, ai assign issue | Security + governance |

### 7.2. Mâu thuẫn & không nhất quán

| # | Mâu thuẫn | Chi tiết |
|---|---|---|
| **M1** | **Dashboard "chưa làm" vs code đã có** | MN họp 1: "Báo cáo tổng quan — chưa làm". Nhưng code `/` (Dashboard) CÓ recharts, radar, trend, tables. Có thể: version demo có dashboard cơ bản, stakeholder muốn xây lại khác? |
| **M2** | **Trang Ngưỡng tồn tại song song** | MN họp 1: "gộp Danh mục + Ngưỡng". Code Danh mục đã có section ngưỡng. Nhưng trang `/thresholds` vẫn trên sidebar → user nhầm |
| **M3** | **Quản lý Job vs Giám sát Pipeline** | 2 trang cùng hiển thị job: `/pipeline` (CRUD) và `/pipeline-monitor` (read-only graph). Theo Plan: `/pipeline` sẽ bỏ. Nhưng hiện tại cả 2 đều trên sidebar |
| **M4** | **Score trên UI = con số cứng** | User có thể tưởng system đang chạy thật. Cần disclaimer "Demo mode — dữ liệu mẫu" |
| **M5** | **"Bảng nguồn liên kết" vs "Job input/output"** | Khi tạo Báo cáo: user khai `sourceTableIds` thủ công. Khi xem Pipeline: dùng `PipelineJob.inputTableIds` từ SQLWF sync. 2 nguồn có thể conflict. Nên dùng 1 nguồn duy nhất (SQLWF) |
| **M6** | **Notification recipients vs Owner bảng** | Notification config có `recipients` (email list riêng). Owner bảng ghi ở `DataSource.owner`. Nên: mặc định gửi cho owner, cho phép thêm recipients |
| **M7** | **Mẫu bảng (Table Profiles) không link với Danh mục** | Khi thêm bảng mới ở Danh mục, system KHÔNG tự gợi ý mẫu bảng phù hợp. User phải tự vào Rules → Tab "Mẫu bảng" → tìm |

### 7.3. Câu hỏi design cần chốt

| # | Câu hỏi | Options | Đề xuất |
|---|---|---|---|
| **D1** | Rule fail → sinh issue tự động hay cần duyệt? | A: Auto tạo issue khi fail. B: Auto khi critical, manual khi warning | **Option B** — tránh spam issue |
| **D2** | Rule fail liên tiếp → tạo issue mới hay cập nhật cũ? | A: 1 rule fail = 1 issue (de-dup by ruleId + tableId). B: Mỗi lần quét tạo mới | **Option A** — cập nhật timeline issue cũ |
| **D3** | Issue auto-resolve khi rule pass lại? | A: Auto resolve. B: Cần người duyệt mới resolve | **Option A Phase 1**, **Option B Phase 2** |
| **D4** | Lịch quét DQ: per bảng hay per khung giờ batch? | A: Mỗi bảng có lịch riêng. B: Khung giờ cố định (7h, 10h, 14h) quét batch | **Option B** (theo MN họp 2) + override per bảng |
| **D5** | Xóa trang `/thresholds` + `/pipeline` khỏi sidebar? | A: Xóa. B: Giữ nhưng redirect | **Option A** — tránh nhầm lẫn |

---

## Phụ lục: Bảng mapping Màn hình ↔ Hệ thống nguồn

| Màn hình DQ | Dữ liệu hiển thị | Nguồn hiện tại (mock) | Nguồn thực tế (TO-BE) |
|---|---|---|---|
| Dashboard | Score tổng, trend, top bảng | mockDataSources, mockTrendData | Engine quét → scan_history DB |
| Danh mục dữ liệu | Bảng, metadata, score | mockDataSources | SQLWF API (metadata) + Engine (score) |
| Phân tích dữ liệu | Profiling results | mockProfilingResults | SparkSQL analyze → profiling DB |
| Quản lý Job | Jobs, input/output | mockPipelineJobs | SQLWF API (sync) |
| Giám sát Pipeline | Graph, node status, scan status | mockPipelineJobs + mockDataSources + mockSchedules + mockRules + mockIssues | SQLWF (jobs) + Engine (score/status) + Rundeck (schedule) |
| Quản lý quy tắc | Rules, templates, results | mockRules, mockRuleTemplates | User khai báo → Rule DB + Engine (results) |
| Lịch chạy | Schedules, last/next run | mockSchedules | User khai báo → Schedule DB + Rundeck/Scheduler |
| Ngưỡng cảnh báo | W/C per dimension | mockThresholds | User khai báo → Threshold DB |
| Vấn đề & Sự cố | Issues, timeline, cascade | mockIssues, mockCascadeChains | Engine quét → sinh issue → Issue DB |
| Báo cáo chất lượng | Score trend, đối soát | mockTrendData, reconciliationResults | scan_history DB + Engine |
| Quản lý thông báo | Notification config | mockNotifications | User khai báo → Notification DB + Email/SMS/Webhook service |
| Cài đặt | Default rules, schedules, users | Mock stores | Config DB + Auth service |
