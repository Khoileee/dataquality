# Hiện trạng Data Quality Tool — Phân tích toàn luồng

> **Ngày:** 14/04/2026  
> **Mục đích:** Tổng hợp luồng nghiệp vụ, data flow, nguồn thông tin từng màn hình, câu hỏi cần làm rõ  
> **Đối chiếu:** 3 cuộc họp review DQ (08/04/2026) + prototype UI hiện tại  
> **Lưu ý:** UI hiện tại ở mức prototype. Tài liệu tập trung phân tích LUỒNG và NGHIỆP VỤ.

---

## Mục lục

1. [Hệ sinh thái và vai trò DQ Tool](#1-hệ-sinh-thái-và-vai-trò-dq-tool)
2. [Luồng nghiệp vụ tổng thể](#2-luồng-nghiệp-vụ-tổng-thể)
3. [Chi tiết từng màn hình — Luồng & Dữ liệu](#3-chi-tiết-từng-màn-hình)
4. [Luồng khai báo: User phải làm gì, ở đâu, theo thứ tự nào](#4-luồng-khai-báo)
5. [Data Flow: Mỗi thông tin trên UI đến từ đâu](#5-data-flow)
6. [Đối chiếu yêu cầu meeting notes](#6-đối-chiếu-yêu-cầu-meeting-notes)
7. [Câu hỏi nghiệp vụ & Mâu thuẫn cần giải quyết](#7-câu-hỏi--mâu-thuẫn)

---

## 1. Hệ sinh thái và vai trò DQ Tool

### 1.1. DQ Tool nằm ở đâu trong hệ sinh thái?

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PIPELINE DỮ LIỆU HIỆN TẠI                       │
│                                                                     │
│  [Hệ thống   ]   [Pentaho]   [HDFS L1→L6]   [SparkSQL]   [DB/DM] │
│  [Product     ] → [ETL    ] → [Lưu trữ   ] → [Xử lý  ] → [Kết   ]│
│  [nguồn       ]   [Load   ]   [raw → clean]   [tính toán]  [quả  ]│
│                                                                     │
│  Lập lịch: Rundeck          Quản lý: SQLWF & Ambari                │
└─────────────────────────────────────────────────────────────────────┘

DQ Tool = tầng kiểm soát chất lượng, "gác cổng" trên pipeline này:
  → Giám sát: data có đúng? đủ? kịp thời? nhất quán?
  → Cảnh báo: khi dữ liệu vi phạm ngưỡng cho phép
  → Báo cáo: tổng hợp tình trạng sức khỏe dữ liệu
```

### 1.2. Các hệ thống liên quan — cung cấp thông tin gì cho DQ?

| Hệ thống | Đã có thông tin gì | DQ Tool cần lấy gì |
|---|---|---|
| **SQLWF** | Catalog ~11k bảng (3k thực dùng), job ETL (input/output), owner, area, layer | Metadata bảng, lineage bảng-job, owner |
| **Rundeck** | Lịch chạy job ETL, lịch sử chạy, trạng thái (success/fail), thời gian chạy | Giờ ETL hoàn thành → biết khi nào quét DQ |
| **Pentaho** | Job ETL thực tế, log kết quả | Trạng thái ETL: thành công/thất bại |
| **HDFS (L1→L6)** | Dữ liệu thực trên cluster | Dữ liệu để chạy query kiểm tra chất lượng |

### 1.3. Câu hỏi nền tảng

| # | Câu hỏi |
|---|---|
| Q1 | SQLWF có API để lấy danh sách bảng + job + lineage không? |
| Q2 | Rundeck có API/webhook để biết khi nào job ETL chạy xong không? |
| Q3 | DQ Tool quét dữ liệu bằng gì? SparkSQL trực tiếp? Hay tạo Pentaho job? |

---

## 2. Luồng nghiệp vụ tổng thể

### 2.1. Ba phase chính

```
Phase 1: KHAI BÁO (user cấu hình)
════════════════════════════════════
  ① Đăng ký bảng    — Bảng nào cần giám sát DQ? Loại gì? Ngưỡng bao nhiêu?
  ② Khai báo quy tắc — Kiểm tra gì? Cột nào? Metric nào? Ngưỡng riêng?
  ③ Đặt lịch quét    — Quét khi nào? Daily? Hourly? Theo khung giờ nào?
  ④ Cấu hình cảnh báo — Gửi cho ai? Qua kênh nào? Khi nào trigger?

Phase 2: VẬN HÀNH (hệ thống tự chạy)
════════════════════════════════════════
  ⑤ Quét theo lịch → Chạy từng rule → Tính score → So ngưỡng
  ⑥ Phát hiện vi phạm → Sinh Issue tự động
  ⑦ Gửi cảnh báo → Thông báo cho người chịu trách nhiệm
  ⑧ Tính toán cascade → Bảng lỗi ảnh hưởng downstream nào?

Phase 3: XỬ LÝ & BÁO CÁO (user xử lý)
════════════════════════════════════════
  ⑨ Xem issue → Assign → Xử lý → Đóng
  ⑩ Xem Dashboard/Báo cáo → Trend, score, đối soát
```

### 2.2. Cách tính DQ Score

```
Metric score (1 rule)
  = % bản ghi pass / tổng bản ghi kiểm tra
  VD: 9500/10000 not null → score = 95

Dimension score (1 chiều × 1 bảng)
  = Trung bình các metric score thuộc chiều đó
  VD: Completeness = TB(not_null_col1: 95, not_null_col2: 88) = 91.5

Table score (1 bảng)
  = Trung bình 6 dimension scores (chỉ chiều CÓ rule)
  VD: TB(Completeness: 91.5, Validity: 87, Timeliness: 100) = 92.8

System score (toàn hệ thống)
  = Trung bình table scores của tất cả bảng đã quét
```

### 2.3. 6 chiều chất lượng dữ liệu

| Chiều | Ý nghĩa | Ví dụ metric |
|---|---|---|
| **Completeness** (Đầy đủ) | Dữ liệu có thiếu không? | not_null, row_count |
| **Validity** (Hợp lệ) | Dữ liệu có đúng format/range? | format_regex, value_range, enum_check |
| **Consistency** (Nhất quán) | Dữ liệu có khớp giữa các bảng? | referential_integrity, aggregate_reconciliation |
| **Timeliness** (Kịp thời) | Dữ liệu có đến đúng giờ? | data_freshness, time_coverage |
| **Uniqueness** (Duy nhất) | Có bản ghi trùng không? | duplicate_single, duplicate_composite |
| **Accuracy** (Chính xác) | Dữ liệu có đúng thực tế? | statistical_outlier, custom_expression |

### 2.4. Ngưỡng Warning / Critical

```
Score ≥ Warning threshold   → ✅ Pass (xanh)
Critical ≤ Score < Warning  → ⚠️ Warning (vàng) — cảnh báo nhẹ
Score < Critical threshold  → ❌ Fail (đỏ) — sinh Issue

Mặc định global: Warning = 90, Critical = 80 (tùy chiều)
Có thể override: theo bảng, theo rule
Kế thừa: Rule → Bảng → Global (ưu tiên từ nhỏ đến lớn)
```

---

## 3. Chi tiết từng màn hình

### Menu sidebar hiện tại

```
Tổng quan
  └── Dashboard                          /

Quản lý dữ liệu
  ├── Danh mục dữ liệu                  /data-catalog
  ├── Phân tích dữ liệu                 /profiling
  ├── Quản lý Job                        /pipeline          ← SẼ BỎ (trùng SQLWF)
  └── Giám sát Pipeline                 /pipeline-monitor

Cấu hình DQ
  ├── Quản lý quy tắc                   /rules
  ├── Lịch chạy                         /schedules
  └── Ngưỡng cảnh báo                   /thresholds         ← ĐÃ GỘP vào Danh mục

Giám sát & Báo cáo
  ├── Vấn đề & Sự cố                    /issues
  └── Báo cáo chất lượng                /reports

Hệ thống
  ├── Quản lý thông báo                 /notifications
  └── Cài đặt                           /settings
        ├── Quy tắc mặc định
        ├── Lịch mặc định
        └── Quản lý người dùng
```

---

### 3.1. Dashboard (`/`)

**Vai trò:** Tổng quan sức khỏe DQ toàn hệ thống — dành cho quản lý và staff vận hành

**Thông tin hiển thị và nguồn gốc:**

| Thông tin | Ý nghĩa | Từ đâu ra? |
|---|---|---|
| System Score | Điểm DQ trung bình toàn bộ bảng đã quét | Tính từ kết quả quét gần nhất → TB table scores |
| Radar 6 chiều | Score theo từng chiều (completeness, validity,...) | TB dimension scores từ tất cả bảng |
| Trend chart (30 ngày) | Xu hướng score theo thời gian | Lịch sử mỗi lần quét → query theo khoảng thời gian |
| Top bảng điểm thấp | 10 bảng có score thấp nhất | Sort bảng theo overallScore ASC |
| Issues gần nhất | Vấn đề mới phát sinh | Từ danh sách issues, filter status = open |
| Bảng chi tiết | Score, dimension, số issue, scan status per bảng | Tổng hợp từ kết quả quét + issues |

**Câu hỏi nghiệp vụ:**

| # | Câu hỏi |
|---|---|
| 1 | Score hiển thị là **lần quét cuối** hay **trung bình theo khoảng thời gian**? (MN họp 3: "2 hướng — TB thời gian vs lần cuối cùng") |
| 2 | Top 10 là top bảng **điểm thấp nhất** hay **gặp lỗi nhiều nhất**? 2 danh sách khác nhau (MN họp 3) |
| 3 | Cần filter theo thời gian: hôm nay / 7 ngày / 30 ngày (MN họp 3) — chưa có |
| 4 | "Drill-down 2-3 tầng" — click bảng → chi tiết bảng → chi tiết rule. Tầng trung gian (danh sách bảng filter) cần không? |

**Liên kết màn hình:**
- Click bảng → `/data-catalog/:id` (chi tiết bảng)
- Click issue → `/issues/:id` (chi tiết sự cố)

---

### 3.2. Danh mục dữ liệu (`/data-catalog`)

**Vai trò:** Đăng ký bảng/báo cáo/KPI cần giám sát DQ — là **điểm bắt đầu** của luồng khai báo

**Cấu trúc:**
- 3 tab phân loại: **Bảng nguồn** / **Báo cáo** / **Chỉ tiêu KPI**
- Mỗi tab = danh sách bảng thuộc loại đó + score + trạng thái quét

**Form "Thêm bảng" — phân tích từng trường:**

| Trường | Ý nghĩa | Nguồn | Ghi chú |
|---|---|---|---|
| Tên bảng | Bảng cần giám sát | **SQLWF** (chọn từ catalog) hoặc nhập tay | ~11k bảng trên SQLWF, cần lazy search |
| Loại | Bảng nguồn / Báo cáo / KPI | User chọn | Quyết định hệ thống mẫu nào áp dụng |
| Schema | Schema DB | **SQLWF** (auto-fill khi chọn bảng) | Không nên bắt user nhập lại |
| Owner | Người chịu trách nhiệm | **SQLWF** (người tạo bảng) | ⚠️ Hiện tại nhập tay → nên auto-fill |
| Mode | Append / Overwrite | User chọn (hoặc từ SQLWF nếu có) | Ảnh hưởng cách quét: append → chỉ quét partition mới |
| Partition | daily / monthly / none | User chọn (hoặc từ SQLWF nếu có) | Ảnh hưởng auto-schedule: daily → quét daily |
| Area | Khu vực / phân vùng dữ liệu | **SQLWF** | Dùng để filter, phân nhóm |
| Ngưỡng 6 chiều | W/C cho Completeness, Validity,... | User nhập (hoặc kế thừa global) | Đã gộp từ trang Ngưỡng vào đây (theo MN họp 1) |
| Bảng nguồn liên kết | (Chỉ Báo cáo) Input tables mà BC này dùng | **SQLWF** (job input/output) hoặc user chọn | Dùng cho cascade: input lỗi → BC bị ảnh hưởng |
| KPI config | (Chỉ KPI) KPI cha, con, công thức, kỳ | User nhập | Chưa rõ logic tính DQ cho KPI |

**Import từ Excel:**
- Sheet 1: Danh sách bảng + ngưỡng override
- Sheet 2: Danh sách rule cho các bảng
- ⚠️ Template Excel cần validate: bảng có tồn tại trên SQLWF? Metric type hợp lệ? Cột có tồn tại?

**Chi tiết bảng** (`/data-catalog/:id`) — trang "hồ sơ sức khỏe" của 1 bảng:
- Score tổng + 6 chiều + trend
- Danh sách rules + kết quả
- Issues liên quan
- Profiling (nếu có)

**Câu hỏi nghiệp vụ:**

| # | Câu hỏi |
|---|---|
| 1 | Khi chọn bảng từ SQLWF → metadata (schema, owner, mode, partition) có tự fill không? Hay vẫn nhập tay? |
| 2 | SQLWF có ~11k bảng. UX chọn bảng: search autocomplete? filter theo layer/area? phân trang? |
| 3 | "Bảng nguồn liên kết" cho Báo cáo — lấy từ SQLWF (job input) tự động hay user chọn tay? |
| 4 | KPI: logic tính DQ cho KPI là gì? Check đúng công thức? Check số liệu đầu vào? |
| 5 | Khi thêm bảng mới, có **tự gợi ý mẫu bảng** (table profile) để áp rule nhanh không? |

**Liên kết màn hình:**
- Sau khi thêm bảng → qua `/rules` tạo rule cho bảng đó
- Sau khi có rule → qua `/schedules` tạo lịch quét
- Chi tiết bảng hiển thị rules, issues → click dẫn đến `/rules`, `/issues/:id`

---

### 3.3. Phân tích dữ liệu — Profiling (`/profiling`)

**Vai trò:** Phân tích cấu trúc và đặc điểm dữ liệu — KHÁC với Rules (mô tả ≠ đánh giá)

**Profiling cho biết gì:**
- Số dòng, số cột
- Phân bố giá trị từng cột (min, max, avg, median, distinct count)
- Tỷ lệ null từng cột
- Kiểu dữ liệu thực tế (so với declared type)
- Pattern phổ biến (VD: email, phone format)

**Mối quan hệ Profiling ↔ Rules:**

```
Profiling = khám sức khỏe tổng quát → "biết đặc điểm gì"
Rules     = xét nghiệm chỉ định     → "đo chỉ số, so ngưỡng"

Profiling giúp user BIẾT cần tạo rule gì:
  → Cột có 15% null   → nên tạo rule not_null
  → Cột DATE có "N/A" → nên tạo rule format_check
  → Cột ID có trùng   → nên tạo rule duplicate_check
```

**Câu hỏi nghiệp vụ:**

| # | Câu hỏi |
|---|---|
| 1 | Profiling chạy khi nào? Manual (nút bấm) hay tự động khi thêm bảng? |
| 2 | Kết quả profiling có **gợi ý rule** tự động không? VD: "Cột X có 15% null — Tạo rule not_null?" |
| 3 | MN họp 2: "tách Profiling ra khỏi Data Catalog, làm chi tiết" → đã tách. Cần gì thêm? |

---

### 3.4. Quản lý Job (`/pipeline`) — SẼ BỎ

**Vai trò hiện tại:** CRUD tạo/sửa/xóa job, khai báo input/output tables

**Vấn đề:** **Trùng lặp hoàn toàn với SQLWF** — SQLWF đã quản lý job ETL đầy đủ.

**Quyết định (từ MN họp 2 + Plan):**
- Bỏ CRUD job trên DQ Tool
- Đồng bộ danh sách job từ SQLWF — read-only
- Trang `/pipeline-monitor` (Giám sát Pipeline) thay thế

**Câu hỏi:** Xóa hẳn khỏi sidebar? Hay redirect sang Pipeline Monitor?

---

### 3.5. Giám sát Pipeline (`/pipeline-monitor`)

**Vai trò:** Nhìn **bức tranh toàn cảnh** — bảng input → job ETL → bảng output, bảng nào lỗi, ảnh hưởng downstream nào

**Cấu trúc 2 tầng:**

**Tầng 1 — Danh sách job:**

| Thông tin | Ý nghĩa | Từ đâu ra? |
|---|---|---|
| Tên Job | Job ETL | **SQLWF** (đồng bộ) |
| DQ Score | Điểm TB các bảng output | **DQ Engine** (kết quả quét output) |
| Tiến độ quét | 7/10 bảng OK | **DQ Engine** (đếm bảng pass/fail) |
| Input / Output count | Số bảng đầu vào/ra | **SQLWF** (job configuration) |
| Last run | Lần chạy ETL cuối | **Rundeck** (job execution history) |
| Grade | A/B/C/D/F | Tính từ DQ Score (A ≥ 95, B ≥ 85,...) |

**Tầng 2 — Chi tiết job (ReactFlow graph):**

```
[Input Table 1] ──→ ┌──────────┐ ──→ [Output Table 1]
[Input Table 2] ──→ │  JOB ETL │ ──→ [Output Table 2]
[Input Table 3] ──→ └──────────┘ ──→ [Output Table 3]
```

- **Node bảng** hiển thị: tên, score, grade (A-F), scan status (✓/⚠/✗), số issues
- **Node job** hiển thị: tên, technology (Pentaho/SparkSQL), lần chạy cuối
- **Edge** đổi màu theo trạng thái (xanh = OK, đỏ = fail)
- **Click node bảng** → mở Drawer chi tiết bên phải

**Drawer chi tiết bảng (slide in từ phải):**

| Section | Thông tin | Từ đâu ra? |
|---|---|---|
| Header | Tên bảng, score, grade, scan status | Kết quả quét DQ |
| Lịch quét | Lần quét cuối, lần tiếp theo, tần suất | Cấu hình lịch chạy |
| Kết quả quy tắc | Pass/Warning/Fail count + chi tiết từng rule | Kết quả quét DQ |
| Issues đang mở | Danh sách vấn đề active cho bảng | Module Issues |

**Tương tác từ Drawer:**
- Click issue → `/issues/:id`
- Click "Xem tổng quan bảng" → `/data-catalog/:tableId`

**Câu hỏi nghiệp vụ — TRỌNG TÂM:**

| # | Câu hỏi |
|---|---|
| 1 | **Job chạy nhiều lần/ngày** — DQ quét mỗi lần hay chỉ lần cuối? Score hiển thị lần nào? |
| 2 | **Lịch ETL vs Lịch DQ** — ETL (Rundeck) chạy 7h, DQ scan phải SAU. Làm sao biết ETL xong? |
| 3 | **Lineage đa cấp** — Output job A = Input job B. Hiện chỉ 1 cấp. Phase 2 cần multi-level? |
| 4 | **Input lỗi → thông báo output** — "Bảng nguồn X lỗi → BC Y bị ảnh hưởng". Logic tự động hay chỉ visual? |
| 5 | **"Quét theo khung giờ, kết quả tổng hợp"** (MN họp 2) — 10h quét: 3 NOT OK; 12h quét: 1 vẫn NOT OK. View theo khung giờ hay chỉ mới nhất? |

**Case phân tích: Job chạy nhiều lần/ngày**

```
Ví dụ: RPT_BAO_CAO_NGAY — ETL chạy 3 lần: 7h, 11h, 17h

Lần 1 (7h): Input chưa đủ → DQ scan fail (60%)
Lần 2 (11h): Input đã load → DQ scan warning (94%)  
Lần 3 (17h): Data hoàn chỉnh → DQ scan pass (98%)

Câu hỏi:
  - Pipeline node hiển thị score nào? 98% (lần cuối)? hay 84% (TB)?
  - Issue sinh ở lần 1 (fail) → lần 3 pass → auto-resolve?
  - Drawer có "Lịch sử quét trong ngày" để xem các lần trước không?

Đề xuất: Hiển thị lần quét cuối cùng. Drawer có tab "Lịch sử quét"
cho phép xem từng lần.
```

---

### 3.6. Quản lý quy tắc (`/rules`)

**Vai trò:** Khai báo CÁI GÌ cần kiểm tra — là **lõi nghiệp vụ** của DQ Tool

**Cấu trúc 3 tab:**

| Tab | Chức năng |
|---|---|
| **Quy tắc** | Danh sách rule đã khai báo. Mỗi rule = 1 metric × 1 bảng (× 1 cột nếu cần) |
| **Mẫu quy tắc** (Templates) | Template metric dùng lại. Chọn mẫu → fill nhanh form tạo rule |
| **Mẫu bảng** (Table Profiles) | Nhóm templates theo đặc điểm bảng (loại + mode + partition) → áp batch |

**Hệ thống mẫu 3 tầng:**

```
Tầng 1: Mẫu metric (Rule Templates)
  │     VD: "not_null" — Kiểm tra cột bắt buộc không null
  │         Áp dụng: chọn bảng + chọn cột → tạo 1 rule
  │
  ├── Tầng 2: Mẫu cột (Column Profiles)
  │     VD: Nhóm "EMAIL" — áp sẵn 2 mẫu metric: not_null + format_regex
  │         Áp dụng: chọn bảng + chọn cột email → tạo 2 rules
  │
  └── Tầng 3: Mẫu bảng (Table Profiles)
        VD: "Bảng daily append" — gồm column profiles + table-level metrics
            Áp dụng: chọn bảng → tạo 5-10 rules cùng lúc
```

**28 loại metric hiện có:**

| Chiều | Metric types |
|---|---|
| Completeness | not_null, row_count, column_count, completeness_ratio |
| Validity | format_regex, value_range, enum_check, data_type_check |
| Consistency | referential_integrity, cross_table_compare, aggregate_reconciliation |
| Timeliness | data_freshness, time_coverage, arrival_time |
| Uniqueness | duplicate_single, duplicate_composite, primary_key_unique |
| Accuracy | statistical_outlier, custom_expression, checksum_compare |

**Form tạo rule:**

```
├── Chọn bảng (từ danh sách bảng đã đăng ký ở Danh mục)
├── Chọn metric type (28 loại — hoặc chọn từ mẫu)
├── Chọn chiều DQ (auto-fill theo metric type)
├── Cấu hình metric (khác nhau tùy loại):
│   ├── not_null: chọn cột
│   ├── format_regex: chọn cột + nhập regex pattern
│   ├── value_range: chọn cột + min + max
│   ├── referential_integrity: chọn cột + ref_table + ref_column
│   ├── aggregate_reconciliation: source_table + source_column + agg function
│   └── custom_expression: viết SQL expression
├── Ngưỡng W/C (pre-fill từ global/bảng, cho phép override)
└── Tên rule + Mô tả
```

**Câu hỏi nghiệp vụ:**

| # | Câu hỏi |
|---|---|
| 1 | **Multi-select cột** (MN họp 2) — "tích chọn nhiều cột cùng lúc, áp 1 rule" → mỗi cột tạo 1 rule riêng hay 1 rule check nhiều cột? |
| 2 | **"Mẫu bảng" gợi ý khi nào?** — Thêm bảng ở Danh mục → system tự suggest mẫu matching? Hay user tự tìm ở tab Mẫu bảng? |
| 3 | **Custom SQL** — `custom_expression` cho phép viết SQL tùy ý? Giới hạn gì? Validate gì? |
| 4 | **"Áp nhanh cho nhiều bảng"** — Chọn 1 mẫu → áp cho 50 bảng cùng lúc? Hay tạo từng bảng? |
| 5 | **Danh sách cột** — Lấy từ đâu để user chọn? SQLWF metadata? Profiling? Hay nhập tay tên cột? |

---

### 3.7. Lịch chạy (`/schedules`)

**Vai trò:** Cấu hình KHI NÀO quét DQ cho từng bảng

**Thông tin hiển thị:**

| Thông tin | Ý nghĩa | Từ đâu ra? |
|---|---|---|
| Tên lịch | Mô tả | User đặt |
| Bảng | Bảng được quét | Từ Danh mục (bảng đã đăng ký) |
| Tần suất | daily / hourly / weekly / monthly / custom | User chọn |
| Giờ chạy | VD: 08:00 | User nhập |
| Ngày trong tuần | (weekly) Thứ 2, 4, 6 | User chọn |
| Last run | Lần quét gần nhất | Scheduler ghi khi quét xong |
| Next run | Lần quét tiếp | Tính từ frequency + last run |
| Số quy tắc | Bao nhiêu rule active cho bảng | Đếm từ Rules filter by tableId |
| Active/Inactive | Bật tắt | User toggle |

**Logic quan trọng: Phối hợp lịch DQ vs ETL**

```
LUỒNG ĐÚNG:
  ETL (Rundeck) chạy 7:00 → load data vào HDFS
  DQ scan chạy 7:30       → quét data vừa load → score chính xác

LUỒNG SAI (false alarm):
  DQ scan chạy 6:00       → data chưa load → thiếu → score thấp giả
  ETL chạy 7:00            → data load xong nhưng DQ đã quét rồi

  → CẦN: biết giờ ETL xong (từ Rundeck) → schedule DQ scan sau ETL
```

**Câu hỏi nghiệp vụ:**

| # | Câu hỏi |
|---|---|
| 1 | **"Giờ cần dữ liệu"** (MN họp 2) — Khai báo "bảng X cần data trước 8h". Nếu 8h chưa có → issue Timeliness. Trường này ở Danh mục hay Lịch chạy? |
| 2 | **Auto-schedule theo partition** (Plan C3) — Bảng daily → tự lịch daily. Tự áp hay chỉ suggest? |
| 3 | **"Sau ETL xong tự trigger DQ"** (MN họp 2) — Event-driven (Rundeck webhook → trigger) hay time-based (chạy sau ETL 30 phút)? |
| 4 | **Khung giờ batch** (MN họp 2) — Thay vì per bảng, có khung giờ cố định (7h, 10h, 14h) quét tất cả bảng đến hạn? |
| 5 | **"Nút chạy ngay"** — Ai có quyền? Chạy tất cả rule hay chọn? |
| 6 | **Ignore false alarm** (MN họp 2) — Bảng chưa đến giờ đồng bộ → DQ quét trước → ignore. Cần trường "giờ dữ liệu sẵn sàng" |

---

### 3.8. Ngưỡng cảnh báo (`/thresholds`)

**Vai trò:** Set ngưỡng mặc định Warning/Critical cho 6 chiều — toàn hệ thống

**Trạng thái:** Đã gộp vào form "Thêm bảng" tại Danh mục (theo MN họp 1). **Nhưng trang riêng vẫn còn trên sidebar.**

**Logic kế thừa ngưỡng:**

```
Ưu tiên 1: Ngưỡng tại Rule (user override khi tạo rule)
Ưu tiên 2: Ngưỡng tại Bảng (user override khi đăng ký bảng)
Ưu tiên 3: Ngưỡng Global (set tại trang này / Settings)
```

**Quyết định cần:**
- Xóa trang này khỏi sidebar? Chuyển global thresholds vào `/settings`?
- Hay giữ riêng vì quản lý cả "danh sách bảng có override"?

---

### 3.9. Vấn đề & Sự cố (`/issues`)

**Vai trò:** Quản lý vấn đề DQ phát hiện được — xem, assign, theo dõi, xử lý

**Vòng đời issue:**

```
Mới (new)
  → Đã phân công (assigned)        ← assign cho user xử lý
    → Đang xử lý (in_progress)     ← user bắt đầu fix
      → Chờ duyệt (pending_review) ← fix xong, chờ xác nhận
        → Đã xử lý (resolved)      ← confirmed fix
          → Đóng (closed)           ← chốt

Mở rộng (Phase 2 theo MN):
  + Tạm hoãn (deferred)            ← biết lỗi nhưng chưa fix
  + Mở lại (reopened)              ← đã resolve nhưng lỗi tái phát
```

**Thông tin trên issue:**

| Thông tin | Ý nghĩa | Từ đâu ra? |
|---|---|---|
| Title | Mô tả ngắn | Auto-generate: "Bảng X vi phạm rule Y" |
| Severity | Warning / Critical | So score vs ngưỡng |
| Bảng | Bảng liên quan | Từ rule.tableId |
| Chiều DQ | Completeness / Validity /... | Từ rule.dimension |
| Rule liên quan | Rule nào fail | Từ rule.id |
| Phát hiện lúc | Timestamp | Thời điểm quét |
| Người xử lý | Ai sẽ fix | User assign (hoặc auto = owner bảng?) |
| Timeline | Lịch sử thay đổi trạng thái, comment | Log mỗi action |
| Cascade chain | Bảng downstream bị ảnh hưởng | Traverse lineage từ SQLWF job input/output |

**Câu hỏi nghiệp vụ:**

| # | Câu hỏi |
|---|---|
| 1 | **Issue sinh tự động** — Mọi warning → issue? Hay chỉ critical? ⚠️ Tránh spam |
| 2 | **De-duplication** — Rule X fail lần quét 1, fail lần quét 2 → 2 issue hay cập nhật issue cũ? |
| 3 | **Auto-resolve** — Rule fail → issue. Lần sau pass → tự đóng? Hay cần người duyệt? |
| 4 | **Assign mặc định** — Assign cho ai? Owner bảng (SQLWF)? Hay cấu hình riêng? |
| 5 | **Action buttons** — Assign, comment, đổi trạng thái, đổi severity → cần UI action. Prototype chưa có |
| 6 | **"Download bản ghi lỗi"** (MN họp 2) — Click issue → bao nhiêu bản ghi fail, tỷ lệ %, trường nào, download list |

**Liên kết màn hình:**
- Click bảng → `/data-catalog/:id`
- Click rule → xem rule tại `/rules`
- Từ Pipeline Drawer → click issue → `/issues/:id`

---

### 3.10. Báo cáo chất lượng (`/reports`)

**Vai trò:** Tổng hợp báo cáo DQ — score theo thời gian, theo bảng, đối soát

**3 tab:**

| Tab | Nội dung | Dữ liệu từ đâu |
|---|---|---|
| Tổng quan | Trend chart, score cards, danh sách bảng + score | Lịch sử kết quả quét tính theo thời gian |
| Đối soát | So sánh SUM/COUNT bảng nguồn vs bảng báo cáo | Kết quả rule type `aggregate_reconciliation` |
| Chi tiết | Chọn 1 bảng → radar 6 chiều, rules, score breakdown | Kết quả quét bảng |

**Câu hỏi nghiệp vụ:**

| # | Câu hỏi |
|---|---|
| 1 | **Khác gì Dashboard?** Dashboard = summary realtime, Reports = phân tích historical? Hay overlap? |
| 2 | **"Export PDF"** — Format? DQ tool render hay link BI tool? |
| 3 | **"Top lỗi thường xuyên"** (MN họp 3) — Rule nào fail nhiều nhất tuần/tháng? |
| 4 | **"Lỗi mới phát sinh vs tuần trước"** (MN họp 3) — So sánh 2 kỳ |

---

### 3.11. Quản lý thông báo (`/notifications`)

**Vai trò:** Cấu hình AI nhận cảnh báo, qua kênh gì, khi nào

**Form cấu hình:**

| Trường | Ý nghĩa | Ghi chú |
|---|---|---|
| Tên | Mô tả config | |
| Kênh | Email / SMS / Webhook | ⚠️ MN muốn thêm Telegram |
| Người nhận | Email / phone / URL | ⚠️ Nên link với owner bảng |
| Trigger events | Warning / Critical / Resolved | Khi nào gửi |
| Bảng áp dụng | Chọn bảng hoặc "tất cả" | |
| Active/Inactive | Bật tắt | |

**Cấu hình cascade:**

| Tùy chọn | Ý nghĩa |
|---|---|
| Thông báo downstream | Input lỗi → gửi cảnh báo cho owner output |
| Tự đặt "Chờ dữ liệu" | Input lỗi → output chuyển status "Waiting for data" |
| Tự chạy lại | Input OK lại → trigger re-scan output |
| Tự resolve | Issue gốc resolve → resolve cascade issues |
| Cascade depth | Spread bao nhiêu cấp (1, 2, 3, unlimited) |

**Câu hỏi nghiệp vụ:**

| # | Câu hỏi |
|---|---|
| 1 | **Gửi cho ai mặc định?** Không cấu hình → có gửi cho owner bảng tự động không? |
| 2 | **"1 email tổng hợp"** (MN họp 2) — 8h sáng, 1 email list tất cả lỗi trong đêm. Hiện thiết kế gửi riêng per event |
| 3 | **Telegram** (MN: "Kênh: tool + Telegram") — Thêm Telegram hay dùng webhook → Telegram bot? |
| 4 | **Owner ↔ Recipients** — Đổi owner bảng → notification cũ vẫn gửi cho người cũ? |
| 5 | **Cascade depth** — Unlimited có gây spam? Nên giới hạn? |

---

### 3.12. Cài đặt (`/settings`)

| Trang | Vai trò | Câu hỏi |
|---|---|---|
| Quy tắc mặc định | Chọn rule templates áp dụng tự động khi thêm bảng mới | Link với mẫu 3 tầng ở Rules? Hay hoạt động riêng? |
| Lịch mặc định | Lịch quét mặc định theo loại bảng | Link với auto-schedule theo partition? Hay riêng? |
| Quản lý người dùng | CRUD user, phân quyền role | Bao nhiêu role? Admin / Config / Viewer? MN: "phân quyền khai báo rule" |

---

## 4. Luồng khai báo

### 4.1. User phải làm gì, ở đâu, theo thứ tự nào

```
Bước 1: NGƯỠNG MẶC ĐỊNH
┌─────────────────────────────────────────────────────────┐
│ Màn hình: /thresholds (hoặc /settings)                  │
│ Làm gì:  Set 6 cặp Warning/Critical mặc định            │
│ VD:      Completeness W=90 C=80, Validity W=85 C=70     │
│ Tại sao: Rule tạo sau sẽ kế thừa ngưỡng này             │
│ Ai làm:  Admin / Data Quality Manager                    │
│ Tần suất: 1 lần setup, hiếm khi đổi                     │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
Bước 2: ĐĂNG KÝ BẢNG
┌─────────────────────────────────────────────────────────┐
│ Màn hình: /data-catalog                                  │
│ Làm gì:  Thêm bảng cần giám sát DQ                      │
│          - Chọn bảng từ SQLWF (hoặc import Excel)        │
│          - Chọn loại: Bảng nguồn / Báo cáo / KPI        │
│          - Override ngưỡng nếu cần                       │
│          - Nếu Báo cáo: chọn bảng nguồn liên kết        │
│ Tại sao: Bảng chưa đăng ký = không quét DQ              │
│ Ai làm:  Staff vận hành / Phụ trách bảng                │
│ Tần suất: Khi có bảng mới cần giám sát                  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
Bước 3: TẠO QUY TẮC
┌─────────────────────────────────────────────────────────┐
│ Màn hình: /rules                                         │
│ Làm gì:  Tạo rule kiểm tra cho bảng ĐÃ đăng ký          │
│          - Chọn metric type (28 loại) hoặc dùng mẫu     │
│          - Hoặc import từ Excel                          │
│ Tại sao: Bảng không có rule = KHÔNG ĐƯỢC QUÉT            │
│ Ai làm:  Staff vận hành / BA / Data Engineer             │
│ Tần suất: Khi thêm bảng mới, khi cần check thêm metric  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
Bước 4: ĐẶT LỊCH QUÉT
┌─────────────────────────────────────────────────────────┐
│ Màn hình: /schedules                                     │
│ Làm gì:  Tạo lịch quét DQ cho bảng ĐÃ có rule           │
│          - Chọn tần suất (daily/weekly/monthly/custom)   │
│          - Set giờ chạy (SAU giờ ETL load data)          │
│ Tại sao: Không có lịch = rule KHÔNG TỰ CHẠY             │
│ Ai làm:  Staff vận hành                                 │
│ Tần suất: Khi thêm bảng mới (hoặc auto theo partition?) │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
Bước 5: CẤU HÌNH THÔNG BÁO
┌─────────────────────────────────────────────────────────┐
│ Màn hình: /notifications                                 │
│ Làm gì:  Cấu hình kênh + người nhận cảnh báo            │
│          - Chọn kênh (email/SMS/webhook)                 │
│          - Nhập danh sách người nhận                     │
│          - Chọn trigger events (warning/critical)        │
│          - Chọn bảng áp dụng                             │
│ Tại sao: Không cấu hình = KHÔNG AI NHẬN thông báo       │
│ Ai làm:  Admin / Staff vận hành                         │
│ Tần suất: 1 lần setup + update khi thay đổi phụ trách   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
        HỆ THỐNG TỰ VẬN HÀNH
┌─────────────────────────────────────────────────────────┐
│ Quét theo lịch → Chạy rules → Tính score                │
│ → So ngưỡng → Sinh issue nếu fail                       │
│ → Gửi cảnh báo cho recipients đã cấu hình               │
│ → Tính cascade nếu input lỗi ảnh hưởng output           │
└─────────────────────────────────────────────────────────┘
```

### 4.2. Rủi ro trải nghiệm user

| Rủi ro | Mô tả | Đề xuất |
|---|---|---|
| **Không biết luồng** | 5 bước ở 5 trang, không có hướng dẫn | Wizard / Checklist tiến độ trên Dashboard |
| **Quên tạo rule** | Đăng ký bảng nhưng quên tạo rule → bảng không quét | Cảnh báo: "Bảng X chưa có rule — Tạo rule?" |
| **Quên tạo lịch** | Có rule nhưng quên lịch → rule không tự chạy | Auto-suggest lịch khi tạo rule. Hoặc auto-schedule theo partition |
| **Quên cấu hình thông báo** | Có issue nhưng không ai nhận | Default: gửi cho owner bảng (không cần cấu hình riêng) |
| **Ngưỡng khó hiểu** | 3 tầng kế thừa (Global → Bảng → Rule) | Hiển thị rõ trên UI: "Đang dùng ngưỡng: Global (90/80)" |

---

## 5. Data Flow

### 5.1. Mỗi thông tin trên UI đến từ đâu

#### Nhóm 1: Metadata — từ SQLWF

| Thông tin | Chi tiết |
|---|---|
| Tên bảng, schema | Catalog bảng trên SQLWF |
| Owner bảng | Người tạo/sở hữu bảng trên SQLWF |
| Mode (Append/Overwrite) | Metadata bảng trên SQLWF (hoặc user bổ sung) |
| Partition (daily/monthly) | Metadata bảng trên SQLWF (hoặc user bổ sung) |
| Area / Layer | Phân khu dữ liệu trên SQLWF |
| Job ETL (tên, technology) | Job management trên SQLWF |
| Job input/output tables | Cấu hình job trên SQLWF (lineage) |

#### Nhóm 2: Scheduling — từ Rundeck

| Thông tin | Chi tiết |
|---|---|
| Lịch chạy ETL | Schedule config trên Rundeck |
| History chạy ETL | Execution history trên Rundeck |
| Giờ ETL hoàn thành | Dùng để trigger DQ scan hoặc check false alarm |
| Trạng thái ETL | Success/Fail — ảnh hưởng DQ interpretation |

#### Nhóm 3: Cấu hình DQ — user khai báo trên DQ Tool

| Thông tin | Chi tiết |
|---|---|
| Loại module (Bảng nguồn/BC/KPI) | User chọn khi đăng ký bảng |
| Ngưỡng W/C | User set (global + per bảng + per rule) |
| Rules (metric config) | User khai báo (hoặc import Excel) |
| Lịch quét DQ | User tạo (tần suất, giờ chạy) |
| Notification config | User cấu hình (kênh, recipients, trigger) |

#### Nhóm 4: Kết quả quét — DQ Engine sinh ra

| Thông tin | Chi tiết |
|---|---|
| DQ Score (metric → dimension → table → system) | Engine quét chạy query → tính % pass → so ngưỡng |
| Rule results (pass/warning/fail) | Engine chạy metric → so với threshold |
| Scan status (đã quét / chưa / lỗi) | Scheduler + Engine ghi log |
| Issues | Engine sinh tự động khi rule fail vượt ngưỡng |
| Trend data (score theo thời gian) | Lưu lịch sử mỗi lần quét → query |
| Cascade chain | Engine traverse lineage (từ SQLWF) khi phát hiện lỗi |
| Profiling results | Engine analyze cấu trúc bảng |

### 5.2. Sơ đồ data flow giữa các màn hình

```
                      SQLWF ──────────────────────┐
                        │                         │
                   (catalog bảng)            (job lineage)
                        │                         │
                        ▼                         ▼
                ┌───────────────┐        ┌──────────────────┐
           ┌───>│ Danh mục      │        │ Giám sát         │
           │    │ dữ liệu      │───────→│ Pipeline         │
           │    └───────┬───────┘        └────────┬─────────┘
           │            │                         │
           │      (bảng đã đăng ký)         (click node)
           │            │                         │
           │            ▼                         │
           │    ┌───────────────┐                 │
           │    │ Quản lý       │                 │
           │    │ quy tắc      │                 │
           │    └───────┬───────┘                 │
           │            │                         │
           │      (rules cho bảng)                │
           │            │                         │
    ┌──────┴────┐       ▼                         │
    │ Ngưỡng    │ ┌───────────────┐               │
    │ (global)  │ │ Lịch chạy    │               │
    └───────────┘ └───────┬───────┘               │
                          │                       │
                    (schedule)                    │
                          │                       │
                          ▼                       │
                ┌─────────────────┐               │
                │  ENGINE QUÉT DQ │               │
                └──┬──────────┬───┘               │
                   │          │                   │
             (score,result) (violations)          │
                   │          │                   │
                   ▼          ▼                   │
          ┌────────────┐ ┌──────────────┐         │
          │ Dashboard  │ │ Vấn đề &    │←────────┘
          │            │ │ Sự cố       │
          │ Báo cáo    │ └──────┬───────┘
          └────────────┘        │
                           (issue sinh)
                                │
                                ▼
                        ┌───────────────┐
                        │ Quản lý       │
                        │ thông báo     │──→ Email / SMS / Webhook
                        └───────────────┘
```

---

## 6. Đối chiếu yêu cầu meeting notes

| # | Yêu cầu (từ MN) | Nguồn | Trạng thái | Ghi chú |
|---|---|---|---|---|
| A1 | Gộp Danh mục + Ngưỡng | Họp 1 | ✅ Đã gộp | Nhưng trang `/thresholds` riêng chưa xóa |
| A2 | Quy tắc giữ riêng | Họp 1 | ✅ OK | 3 tab: Rules / Templates / Table Profiles |
| B1 | Dropdown bảng SQLWF (lazy load, filter) | Họp 2 | ⚠️ Chưa đủ | Prototype hardcode 12 bảng |
| B2 | Import Excel (bảng + ngưỡng + rules) | Họp 2 | ✅ UI có | Template cần finalize |
| B3 | Đồng bộ metadata từ SQLWF | Họp 2 | ❌ Chưa | Cần SQLWF API |
| C1 | Mode Append: chỉ quét partition mới | Họp 2 | ❌ Chưa | Cần logic engine |
| C2 | Cách tính DQ Score | Họp 1 | ✅ Đã xác định | TB metric → dimension → table → system |
| C3 | Auto-schedule theo partition | Họp 2 | ❌ Chưa | |
| D1 | Báo cáo: bảng nguồn liên kết | Họp 1 | ✅ Có | `sourceTableIds` trong form |
| D2 | KPI quick-add rule | Họp 1 | ❌ Chưa | |
| D3 | Input/Output + cascade alerting | Họp 2 | ⚠️ UI có | Pipeline graph + cascade config có. Logic runtime chưa |
| E1 | Dashboard tổng quan | Họp 1+3 | ⚠️ Có | Thiếu filter thời gian, thiếu top rules |
| E2 | Top lỗi thường xuyên | Họp 3 | ❌ Chưa | |
| E3 | Drill-down chi tiết bảng | Họp 1+3 | ✅ Có | Click → chi tiết bảng |
| F1 | Trạng thái sự cố chi tiết | Họp 1 | ⚠️ Có status | Thiếu action UI (assign, comment) |
| G1 | Owner = người tạo trên SQLWF | Họp 2 | ❌ Chưa | Cần SQLWF API |
| | "Giờ cần dữ liệu" khi khai báo bảng | Họp 2 | ❌ Chưa | Không có trường này |
| | Quét theo khung giờ batch + tổng hợp | Họp 2 | ❌ Chưa | |
| | Telegram notification | Họp 2 | ❌ Chưa | Chỉ Email/SMS/Webhook |
| | Multi-select cột áp rule | Họp 2 | ❌ Chưa | 1 rule = 1 cột |
| | Sau ETL xong tự trigger DQ | Họp 2 | ❌ Chưa | DQ schedule độc lập |
| | Download bản ghi lỗi | Họp 2 | ❌ Chưa | |
| | Filter thời gian Dashboard | Họp 3 | ❌ Chưa | |
| | Email tổng hợp batch 1 lần/ngày | Họp 2 | ❌ Chưa | |
| | Phân quyền khai báo rule | Họp 2 | ❌ Chưa | |

---

## 7. Câu hỏi & Mâu thuẫn

### 7.1. Câu hỏi nền tảng

| # | Câu hỏi | Ảnh hưởng |
|---|---|---|
| **Q1** | SQLWF có REST API để lấy catalog bảng, job lineage, owner không? | Quyết định cách Danh mục + Pipeline lấy dữ liệu |
| **Q2** | Rundeck có API/webhook khi job ETL chạy xong không? | Quyết định cách phối hợp lịch DQ vs ETL |
| **Q3** | DQ Engine quét bằng gì? SparkSQL? Pentaho job? Microservice? | Quyết định architecture |
| **Q4** | Kết quả quét lưu ở đâu? DB nào? | Quyết định storage layer |
| **Q5** | User/Auth? Đăng nhập qua gì? Role nào? | Quyết định phân quyền |

### 7.2. Mâu thuẫn phát hiện

| # | Mâu thuẫn | Chi tiết |
|---|---|---|
| **M1** | **Trang Ngưỡng vẫn tồn tại** | MN nói gộp vào Danh mục → form Danh mục đã có section ngưỡng. Nhưng `/thresholds` vẫn trên sidebar |
| **M2** | **Quản lý Job vẫn tồn tại** | Plan chốt bỏ CRUD, chuyển Pipeline Monitor. Nhưng `/pipeline` vẫn trên sidebar có Thêm/Sửa/Xóa |
| **M3** | **Owner bảng 2 nguồn** | SQLWF có owner. DQ Tool cũng yêu cầu nhập owner. 2 nguồn có thể conflict |
| **M4** | **"Bảng nguồn liên kết" 2 nguồn** | SQLWF biết job input/output (lineage tự động). DQ form bắt user khai thủ công. Nên dùng 1 nguồn |
| **M5** | **Notification recipients vs Owner** | Notification config có `recipients` riêng. Owner bảng ở Danh mục. Đổi owner → notification cũ gửi email cũ |
| **M6** | **Mẫu bảng không link Danh mục** | Thêm bảng mới → system không gợi ý mẫu bảng phù hợp. User phải tự tìm ở Rules → tab Mẫu bảng |

### 7.3. Design decisions cần chốt

| # | Câu hỏi | Lựa chọn | Đề xuất |
|---|---|---|---|
| **D1** | Rule fail → sinh issue tự động? | A: Mọi fail → issue. B: Chỉ critical → issue, warning → cảnh báo nhẹ | **B** — tránh spam |
| **D2** | Rule fail liên tiếp → issue mới hay cập nhật? | A: De-dup (1 rule + 1 bảng = 1 issue, cập nhật timeline). B: Mỗi lần tạo mới | **A** — gọn gàng |
| **D3** | Issue auto-resolve khi rule pass lại? | A: Auto resolve. B: Cần người duyệt | **A** Phase 1, **B** Phase 2 |
| **D4** | Lịch DQ: per bảng hay khung giờ batch? | A: Each bảng 1 lịch. B: Khung giờ batch (7h, 10h, 14h) | **B** (theo MN) + cho phép override |
| **D5** | Xóa `/thresholds` + `/pipeline` khỏi sidebar? | A: Xóa. B: Giữ, redirect | **A** — tránh nhầm |
| **D6** | Default notification: gửi cho owner bảng tự động? | A: Phải cấu hình mới gửi. B: Mặc định gửi owner | **B** — không miss |
| **D7** | DQ scan trigger: time-based hay event-driven? | A: Chạy theo lịch cố định. B: Chạy SAU ETL xong (Rundeck webhook) | **B** ưu tiên, **A** fallback |
