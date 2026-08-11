# Data Quality Management System — Tổng quan luồng vận hành

> Tài liệu mô tả toàn bộ luồng hoạt động của hệ thống Quản lý Chất lượng Dữ liệu (DQ Tool), từ tổng quan đến chi tiết từng module. Dành cho người dùng mới bắt đầu sử dụng hệ thống.

---

## Mục lục

1. [Hệ thống DQ Tool là gì?](#1-hệ-thống-dq-tool-là-gì)
2. [Cấu trúc menu](#2-cấu-trúc-menu)
3. [Luồng vận hành tổng quan](#3-luồng-vận-hành-tổng-quan)
4. [Luồng chi tiết từng giai đoạn](#4-luồng-chi-tiết-từng-giai-đoạn)
   - 4.1 [Giai đoạn 1: Khai báo — Quản lý quy tắc (Rules)](#41-giai-đoạn-1-khai-báo--quản-lý-quy-tắc-rules)
   - 4.2 [Giai đoạn 2: Đăng ký dữ liệu — Danh mục dữ liệu (Data Catalog)](#42-giai-đoạn-2-đăng-ký-dữ-liệu--danh-mục-dữ-liệu-data-catalog)
   - 4.3 [Giai đoạn 3: Lên lịch vận hành — Lịch chạy (Schedules)](#43-giai-đoạn-3-lên-lịch-vận-hành--lịch-chạy-schedules)
   - 4.4 [Giai đoạn 4: Giám sát — Pipeline Monitor](#44-giai-đoạn-4-giám-sát--pipeline-monitor)
   - 4.5 [Giai đoạn 5: Xử lý sự cố — Vấn đề & Sự cố (Issues)](#45-giai-đoạn-5-xử-lý-sự-cố--vấn-đề--sự-cố-issues)
   - 4.6 [Giai đoạn 6: Thông báo — Quản lý thông báo (Notifications)](#46-giai-đoạn-6-thông-báo--quản-lý-thông-báo-notifications)
   - 4.7 [Giai đoạn 7: Báo cáo — Báo cáo chất lượng (Reports)](#47-giai-đoạn-7-báo-cáo--báo-cáo-chất-lượng-reports)
5. [Các module hỗ trợ](#5-các-module-hỗ-trợ)
   - 5.1 [Dashboard — Tổng quan hệ thống](#51-dashboard--tổng-quan-hệ-thống)
   - 5.2 [Phân tích dữ liệu (Profiling)](#52-phân-tích-dữ-liệu-profiling)
   - 5.3 [Cài đặt (Settings)](#53-cài-đặt-settings)
6. [Tổng quan 28 metrics kiểm tra chất lượng](#6-tổng-quan-28-metrics-kiểm-tra-chất-lượng)
7. [Hệ thống mẫu 3 tầng (Template System)](#7-hệ-thống-mẫu-3-tầng-template-system)
8. [Luồng điều hướng giữa các màn hình](#8-luồng-điều-hướng-giữa-các-màn-hình)

---

## 1. Hệ thống DQ Tool là gì?

Data Quality Management System (DQ Tool) là hệ thống quản lý chất lượng dữ liệu trên nền tảng Data Platform (HDFS/SparkSQL). Hệ thống giúp:

- **Đăng ký và quản lý** các bảng dữ liệu cần giám sát (bảng nguồn, báo cáo, chỉ tiêu KPI)
- **Khai báo quy tắc** kiểm tra chất lượng trên 6 chiều dữ liệu (28 loại metric)
- **Tự động quét** theo lịch đã cấu hình, cho điểm chất lượng từ 0–100
- **Phát hiện sự cố** khi điểm chất lượng vi phạm ngưỡng, tự động tạo issue
- **Thông báo** qua email, SMS, Telegram, webhook
- **Báo cáo** tổng hợp điểm chất lượng theo thời gian, chiều dữ liệu, bảng

### 6 chiều chất lượng dữ liệu (DQ Dimensions)

| # | Chiều (EN) | Chiều (VN) | Mô tả |
|---|-----------|------------|-------|
| 1 | Completeness | Đầy đủ | Dữ liệu có đầy đủ, không thiếu giá trị? |
| 2 | Validity | Hợp lệ | Dữ liệu đúng định dạng, nằm trong phạm vi cho phép? |
| 3 | Consistency | Nhất quán | Dữ liệu giữa các bảng/hệ thống có đồng nhất? |
| 4 | Uniqueness | Duy nhất | Dữ liệu không bị trùng lặp? |
| 5 | Accuracy | Chính xác | Dữ liệu phản ánh đúng thực tế? |
| 6 | Timeliness | Kịp thời | Dữ liệu có được cập nhật đúng hạn? |

### Đối tượng dữ liệu

Hệ thống quản lý 3 loại đối tượng dữ liệu:

| Loại | Mô tả | Ví dụ |
|------|--------|-------|
| **Bảng nguồn** (source) | Bảng dữ liệu gốc trong hệ thống core | KH_KHACHHANG, GD_GIAODICH |
| **Báo cáo** (report) | Bảng tổng hợp báo cáo từ các bảng nguồn | BC_DOANHTHU_NGAY |
| **Chỉ tiêu** (kpi) | Chỉ tiêu KPI kinh doanh tổng hợp | CT_DOANHTHU_Q1 |

---

## 2. Cấu trúc menu

```
┌──────────────────────────────────────────────────────────┐
│  Data Quality Management System                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ▸ TỔNG QUAN                                             │
│      Dashboard                     /                     │
│                                                          │
│  ▸ QUẢN LÝ DỮ LIỆU                                       │
│      Danh mục dữ liệu             /data-catalog          │
│      Phân tích dữ liệu            /profiling             │
│      ̶Q̶u̶ả̶n̶ ̶l̶ý̶ ̶J̶o̶b̶ (deprecated)      /pipeline ← gộp SQLWF │
│      Giám sát Pipeline            /pipeline-monitor      │
│                                                          │
│  ▸ CHẤT LƯỢNG                                            │
│      Quản lý quy tắc              /rules                 │
│      Lịch chạy                     /schedules            │
│      ̶N̶g̶ư̶ỡ̶n̶g̶ ̶c̶ả̶n̶h̶ ̶b̶á̶o̶ (deprecated) /thresholds ← gộp vào  │
│                                    Danh mục & Cài đặt    │
│                                                          │
│  ▸ GIÁM SÁT                                              │
│      Vấn đề & Sự cố               /issues                │
│      Báo cáo chất lượng           /reports               │
│                                                          │
│  ▸ CẤU HÌNH                                              │
│      Quản lý thông báo            /notifications         │
│      Cài đặt                                             │
│        ├─ Ngưỡng mặc định         /settings/default-thresholds│
│        ├─ Quy tắc mặc định        /settings/default-rules     │
│        ├─ Lịch mặc định           /settings/default-schedules │
│        └─ Quản lý người dùng      /settings/users             │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Mô tả chức năng từng menu

| Menu | Chức năng chính |
|------|----------------|
| **Dashboard** | Tổng quan hệ thống: điểm DQ trung bình, trend, phân bổ theo chiều, bảng kém nhất, onboarding checklist |
| **Danh mục dữ liệu** | Đăng ký/import bảng, gán mẫu quy tắc, cấu hình ngưỡng riêng, xem điểm chi tiết |
| **Phân tích dữ liệu** | Xem lịch sử quét thống kê cột (profiling snapshot), chạy phân tích mới |
| **Giám sát Pipeline** | Theo dõi tiến độ quét DQ trên từng pipeline ETL, đồng bộ danh sách job từ SQLWF |
| **Quản lý quy tắc** | Khai báo metric template (mẫu metric → mẫu cột → mẫu bảng), tạo rule cho bảng cụ thể |
| **Lịch chạy** | Đặt lịch quét DQ tự động cho từng bảng, xem theo khung giờ (batch view) |
| **Vấn đề & Sự cố** | Danh sách issue phát sinh từ kết quả quét, quản lý vòng đời issue, cascade impact |
| **Báo cáo chất lượng** | Báo cáo tổng hợp: overview, chi tiết từng bảng, trend, đối soát nguồn-báo cáo |
| **Quản lý thông báo** | Cấu hình kênh thông báo (email, SMS, Telegram, webhook), trigger condition |
| **Cài đặt** | Cấu hình mặc định hệ thống: ngưỡng, quy tắc, lịch, quản lý người dùng |

---

## 3. Luồng vận hành tổng quan

Toàn bộ quy trình DQ hoạt động theo 3 giai đoạn lớn:

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    LUỒNG VẬN HÀNH DQ TOOL                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │              GIAI ĐOẠN 1: KHAI BÁO & CẤU HÌNH                       │  ║
║  │                                                                     │  ║
║  │  [Cài đặt ngưỡng]  →  [Khai báo mẫu quy tắc]  →  [Đăng ký bảng]     │  ║
║  │   (Settings)           (Rules: Templates)        (Data Catalog)     │  ║
║  │                                                      │              │  ║
║  │                                         áp mẫu quy tắc + ngưỡng     │  ║
║  │                                                      ↓              │  ║
║  │                                            [Đặt lịch chạy DQ]       │  ║
║  │                                             (Schedules)             │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                              │                                            ║
║                              ▼                                            ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │              GIAI ĐOẠN 2: VẬN HÀNH TỰ ĐỘNG                          │  ║
║  │                                                                     │  ║
║  │  [Lịch chạy kích hoạt]  →  [Quét DQ: chạy rules trên bảng]          │  ║
║  │                              │                                      │  ║
║  │                    ┌─────────┴──────────┐                           │  ║
║  │                    ▼                    ▼                           │  ║
║  │             [Đạt ngưỡng]        [Vi phạm ngưỡng]                    │  ║
║  │                │                      │                             │  ║
║  │         Cập nhật điểm          Tạo Issue tự động                    │  ║
║  │                                       │                             │  ║
║  │                              Gửi thông báo (email/Telegram/...)     │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                              │                                            ║
║                              ▼                                            ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │              GIAI ĐOẠN 3: GIÁM SÁT & BÁO CÁO                        │  ║
║  │                                                                     │  ║
║  │  [Dashboard]  ←  [Báo cáo chất lượng]  ←  [Vấn đề & Sự cố]          │  ║
║  │       │                                          │                  │  ║
║  │       │              [Pipeline Monitor]          │                  │  ║
║  │       │                  (theo dõi tiến độ       Phân công, xử lý   │  ║
║  │       │                   quét theo pipeline)    Cascade tracking   │  ║
║  │       │                                                             │  ║
║  │       └─── Drill-down vào từng bảng, chiều, rule, issue ───────┘    │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### Tóm tắt luồng theo bước

```
Bước 1  ──→  Cấu hình ngưỡng mặc định (Settings)
Bước 2  ──→  Khai báo mẫu quy tắc: Mẫu Metric → Mẫu Cột → Mẫu Bảng (Rules)
Bước 3  ──→  Đăng ký bảng dữ liệu: import từ SQLWF hoặc thêm thủ công (Data Catalog)
Bước 4  ──→  Áp mẫu quy tắc cho bảng (Data Catalog → gợi ý khớp tự động)
Bước 5  ──→  Đặt lịch chạy DQ cho bảng (Schedules — có auto-suggest từ metadata)
Bước 6  ──→  Hệ thống tự động chạy, cho điểm, tạo issue nếu vi phạm
Bước 7  ──→  Xem kết quả trên Dashboard, Reports, Issues, Pipeline Monitor
Bước 8  ──→  Nhận thông báo qua email/Telegram/webhook (Notifications)
```

---

## 4. Luồng chi tiết từng giai đoạn

### 4.1 Giai đoạn 1: Khai báo — Quản lý quy tắc (Rules)

**Đường dẫn:** `/rules`

**Mục đích:** Khai báo "quy tắc kiểm tra" — mỗi quy tắc = 1 phép kiểm tra trên 1 bảng/cột, thuộc 1 trong 28 loại metric.

#### Cấu trúc trang Rules

Trang Rules có **3 tab**:

| Tab | Nội dung | Mục đích |
|-----|----------|----------|
| **Quy tắc kiểm tra** | Danh sách tất cả rules đã tạo | Xem, tìm, lọc, chạy thử, xem lịch sử chạy |
| **Mẫu quy tắc (Templates)** | 3 tầng mẫu: Metric → Cột → Bảng | Tạo sẵn mẫu để áp nhanh khi đăng ký bảng |
| **Tạo mới / Chỉnh sửa** (dialog) | Form tạo rule | Chọn bảng, chiều, metric, cấu hình thông số |

#### Luồng tạo Rule

```
Mở Rules → Tab "Quy tắc kiểm tra" → [+ Tạo quy tắc mới]
  │
  ├─ Chọn bảng dữ liệu (dropdown danh sách từ Data Catalog)
  ├─ Chọn chiều dữ liệu (6 chiều: Đầy đủ, Hợp lệ, ...)
  ├─ Chọn loại metric (danh sách lọc theo chiều đã chọn)
  ├─ Cấu hình thông số metric (khác nhau tùy loại metric)
  │   VD: NOT NULL → chọn cột
  │   VD: Value Range → chọn cột + nhập min/max
  │   VD: Regex → chọn cột + nhập pattern
  ├─ Thiết lập ngưỡng Warning / Critical
  ├─ Chọn trạng thái (Active / Inactive)
  └─ [Lưu]
```

**Chế độ tạo hàng loạt:** Khi bật toggle "Tạo hàng loạt", user có thể chọn nhiều cột cùng lúc. Hệ thống sẽ tạo N rule độc lập với cùng cấu hình metric/threshold. VD: chọn 10 cột cho metric `not_null` → tạo 10 rule.

#### Luồng chạy thử Rule

```
Danh sách Rules → Bấm [▶ Chạy] trên 1 rule
  │
  ├─ Hệ thống chạy kiểm tra (mock: 1–2 giây)
  ├─ Cho điểm 0–100
  └─ Nếu điểm < ngưỡng Warning hoặc Critical:
       → Tự động tạo Issue trong module Vấn đề & Sự cố
       → Hiển thị badge cảnh báo trên rule
```

#### Luồng xem lịch sử chạy

```
Danh sách Rules → Bấm [⌛ Lịch sử] trên 1 rule
  │
  └─ Mở panel lịch sử: danh sách các lần chạy gần nhất
       Mỗi mục: thời gian, trigger (Tự động/Thủ công), kết quả (Pass/Warning/Fail), điểm
```

#### Hệ thống mẫu 3 tầng (Tab "Mẫu quy tắc")

*(Xem chi tiết ở [Mục 7](#7-hệ-thống-mẫu-3-tầng-template-system))*

---

### 4.2 Giai đoạn 2: Đăng ký dữ liệu — Danh mục dữ liệu (Data Catalog)

**Đường dẫn:** `/data-catalog`

**Mục đích:** Đăng ký các bảng dữ liệu cần giám sát chất lượng. Mỗi bảng sau khi đăng ký sẽ có các rule gắn liền, có lịch chạy riêng, và được tính điểm DQ.

#### Cấu trúc trang Data Catalog

- **3 tab** phân loại theo loại đối tượng: Bảng nguồn | Báo cáo | Chỉ tiêu
- Mỗi tab hiển thị danh sách bảng dạng table, có phân trang
- Hỗ trợ: tìm kiếm, lọc theo schema/owner/status, export CSV

#### Luồng thêm bảng

Có **2 cách** thêm bảng:

**Cách 1: Thêm thủ công**
```
Data Catalog → [+ Thêm bảng] → Điền form
  │
  ├─ Tên hiển thị, mô tả
  ├─ Loại kết nối (database/file/api)
  ├─ Schema, tên bảng vật lý
  ├─ Danh mục, chủ sở hữu, nhóm
  ├─ Loại đối tượng (Bảng nguồn / Báo cáo / Chỉ tiêu)
  ├─ Partition (none / daily / monthly)
  ├─ Mode (append / overwrite)
  ├─ Giờ dữ liệu sẵn sàng (dataRequiredByTime)
  ├─ Cấu hình ngưỡng riêng 6 chiều (Warning / Critical)
  │   └─ Mặc định lấy từ Settings → Ngưỡng mặc định
  └─ [Lưu]
```

**Cách 2: Import CSV hàng loạt**
```
Data Catalog → [Import CSV]
  │
  ├─ Tải template CSV mẫu
  ├─ Điền thông tin bảng vào file CSV
  ├─ Upload file → Hệ thống validate
  │   ├─ Kiểm tra tên bảng không trống
  │   ├─ Kiểm tra tag hợp lệ (bảng/báo cáo/chỉ tiêu)
  │   ├─ Kiểm tra W > C cho mỗi chiều
  │   └─ Hiển thị kết quả validation (lỗi/cảnh báo)
  └─ [Xác nhận import]
```

**Import CSV rule hàng loạt:**
```
Data Catalog → [Import CSV Rule]
  │
  ├─ Tải template CSV rule mẫu
  ├─ Điền các rule: tên bảng, metric_type, dimension, cột, thông số
  ├─ Upload → Validate (kiểm tra metric_type, dimension hợp lệ)
  └─ [Xác nhận] → Tạo rules tự động
```

#### Luồng áp mẫu quy tắc (Template Suggestion)

```
Data Catalog → Mở chi tiết 1 bảng
  │
  ├─ Hệ thống tự khớp (match) mẫu bảng (TableProfile) dựa trên:
  │     moduleType + partition + mode → tìm TableProfile phù hợp nhất
  │
  ├─ Hệ thống tự khớp mẫu cột (ColumnProfile) cho từng cột:
  │     Tên cột chứa keyword → tìm ColumnProfile phù hợp
  │     VD: cột "EMAIL" → khớp mẫu "Email/Thư điện tử" (regex email, fill_rate, ...)
  │
  └─ User xem gợi ý → [Áp dụng mẫu] → Tạo rules tự động cho bảng
```

#### Trang chi tiết bảng (`/data-catalog/:id`)

```
┌──────────────────────────────────────────────────────────┐
│  KH_KHACHHANG                                            │
│  [▶ Chạy phân tích ngay]  [+ Tạo rule]  [📅 Đặt lịch]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Thông tin chung: schema, owner, mode, partition, ...    │
│                                                          │
│  Điểm tổng: 82/100                                       │
│  6 chiều: ██ Đầy đủ 87 | ██ Hợp lệ 81 | ...            │
│                                                          │
│  Danh sách Rules gắn bảng này                            │
│  Trend điểm 30 ngày                                      │
│  Upstream / Downstream jobs (quan hệ pipeline)           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Các nút hành động trên trang chi tiết:**
- **Chạy phân tích ngay**: Chạy quét profiling tức thì
- **Tạo rule cho bảng này**: Chuyển đến Rules với bảng đã được chọn sẵn
- **Đặt lịch chạy**: Chuyển đến Schedules với bảng đã được chọn sẵn (deep link)

---

### 4.3 Giai đoạn 3: Lên lịch vận hành — Lịch chạy (Schedules)

**Đường dẫn:** `/schedules`

**Mục đích:** Cấu hình lịch quét DQ tự động cho từng bảng. Mỗi bảng cần ít nhất 1 lịch chạy để hệ thống tự động kiểm tra theo chu kỳ.

#### Cấu trúc trang Schedules

- **2 chế độ xem:** Danh sách | Khung giờ (batch view)
- Bộ lọc: bảng dữ liệu, tần suất, trạng thái
- Hỗ trợ deep link: truy cập `/schedules?tableId=xxx` → tự filter hoặc mở form thêm mới

#### Luồng thêm lịch chạy

```
Schedules → [+ Thêm lịch chạy]
  │
  ├─ Nhập tên lịch
  ├─ Chọn bảng dữ liệu
  │     ↓
  │   ┌───────────────────────────────────────────┐
  │   │  ✨ Đề xuất tự động (Auto-suggest)       │
  │   │                                           │
  │   │  Hệ thống phân tích metadata bảng:        │
  │   │  - Partition: daily/monthly/none           │
  │   │  - Mode: append/overwrite                  │
  │   │  - Giờ dữ liệu sẵn sàng                   │
  │   │                                           │
  │   │  → Đề xuất: Hàng ngày, 06:30              │
  │   │  "Bảng partition Daily (append),           │
  │   │   DL sẵn sàng 06:00 → quét 06:30"        │
  │   │                                           │
  │   │  [Áp dụng]                                │
  │   └───────────────────────────────────────────┘
  │
  ├─ Chọn tần suất: Thực thời / Hàng giờ / Hàng ngày / Hàng tuần / Hàng tháng / Cron
  ├─ (Nếu daily/weekly) Chọn giờ chạy
  ├─ (Nếu weekly) Chọn ngày trong tuần
  ├─ (Nếu custom) Nhập cron expression
  ├─ Bật/tắt kích hoạt
  └─ [Lưu lịch chạy]
```

#### Chế độ xem khung giờ (Batch View)

Gom nhóm tất cả lịch chạy theo 6 khung giờ:

```
┌────────────────────────────────────────────────────────────┐
│  Lịch chạy theo khung giờ    [5 lịch]                     │
├──────────┬──────────┬──────────┬──────────┬────────┬──────┤
│ 🌙 Rạng  │ 🌅 Sáng  │ ☀️ Trưa  │ 🌤️ Chiều │ 🌆 Tối │ ⚡RT │
│ 00-06    │ 06-10    │ 10-14    │ 14-18    │ 18-24  │ Liên │
│          │          │          │          │        │ tục  │
│ 0 lịch   │ 3 lịch   │ 1 lịch   │ 0 lịch   │ 1 lịch │ 0    │
│          │ ┌──────┐ │          │          │        │      │
│          │ │06:30 │ │          │          │        │      │
│          │ │TB_KH │ │          │          │        │      │
│          │ │ ! ←── │ │          │          │        │      │
│          │ └──────┘ │          │          │        │      │
└──────────┴──────────┴──────────┴──────────┴────────┴──────┘
  ! = Quét sớm (trước giờ DL sẵn sàng)
```

**Mục đích batch view:**
- Phát hiện lịch trùng giờ → nghẽn hệ thống
- Cân đối tải xử lý giữa các khung giờ
- Cảnh báo bảng quét trước khi ETL load xong (badge "Quét sớm")

#### Cột "Giờ DL sẵn sàng" trong bảng danh sách

- Hiển thị giờ `dataRequiredByTime` của bảng (lấy từ Data Catalog)
- Nếu giờ quét < giờ DL sẵn sàng → badge "Quét sớm" cảnh báo

#### Nút "Chạy ngay"

Cho phép trigger quét DQ tức thì mà không cần đợi lịch:
```
[▶ Chạy ngay] → Hiển thị "Đang chạy..." → Cập nhật kết quả (lastRun, lastRunStatus)
```

---

### 4.4 Giai đoạn 4: Giám sát — Pipeline Monitor

**Đường dẫn:** `/pipeline-monitor`

**Mục đích:** Theo dõi tiến độ quét chất lượng dữ liệu trên từng pipeline ETL. Dữ liệu pipeline được đồng bộ từ hệ thống SQLWF.

#### Cấu trúc trang Pipeline Monitor

**Trang danh sách (`/pipeline-monitor`):**

```
┌──────────────────────────────────────────────────────────┐
│  Giám sát Pipeline                                       │
│  Lần sync: 13/04/2026 08:00  [🔄 Đồng bộ SQLWF]          │
├──────────────────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐             │
│  │ 8      │ │ 3      │ │ 5      │ │ 82     │             │
│  │Pipeline│ │Có lỗi  │ │Bảng lỗi│ │Đ.bình  │             │
│  └────────┘ └────────┘ └────────┘ └────────┘             │
│                                                          │
│  Bảng danh sách pipeline jobs:                           │
│  │ Tên Job │ Input Tables │ Output Tables │ DQ Input │   │ 
│  │         │              │               │ DQ Output│   │
│  │         │              │               │ Tiến độ  │   │
│  │         │              │               │ [👁 Xem] │   │
└──────────────────────────────────────────────────────────┘
```

**Trang chi tiết pipeline (`/pipeline-monitor/:jobId`):**

```
┌──────────────────────────────────────────────────────────┐
│  Job: Load KH → DataMart                                 │
│  ← Quay lại                                              │
├──────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│  │Tiến độ│ │Chạy  │ │Input │ │Output│ │Owner │           │
│  │3/5   │ │cuối  │ │      │ │      │ │      │            │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘            │
│                                                          │
│  ┌────────────────────────────────────────────────┐      │
│  │           Pipeline Graph (ReactFlow)           │      │
│  │                                                │      │
│  │  [InputTbl1] ──┐                               │      │
│  │                ├──→ [ETL Job] ──→ [OutputTbl1] │      │
│  │  [InputTbl2] ──┘                               │      │
│  │                                                │      │
│  │  Mỗi node = 1 bảng, có màu DQ grade:           │      │
│  │    🟢 Pass (≥85)                               │      │
│  │    🟡 Warning (70-84)                          │      │
│  │    🔴 Fail (<70)                               │      │
│  │    ⚪ No Data (chưa quét)                      │      │
│  └────────────────────────────────────────────────┘      │
│                                                          │
│  Bấm vào node bảng → Mở drawer chi tiết bảng:            │
│    Tên bảng, điểm tổng, 6 chiều, danh sách rules         │
│    Links: Xem chi tiết | Tạo rule | Đặt lịch             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### Luồng sử dụng

```
1. Pipeline Monitor → Danh sách job → Bấm [👁 Xem] vào 1 job
2. Xem pipeline graph → Nhận diện bảng lỗi (node đỏ)
3. Bấm vào node bảng lỗi → Xem chi tiết DQ trong drawer
4. Từ drawer:
   - [Xem chi tiết] → Chuyển đến Data Catalog chi tiết bảng
   - [Tạo rule] → Chuyển đến Rules với bảng đã chọn
   - [Đặt lịch] → Chuyển đến Schedules với bảng đã chọn
```

---

### 4.5 Giai đoạn 5: Xử lý sự cố — Vấn đề & Sự cố (Issues)

**Đường dẫn:** `/issues`

**Mục đích:** Quản lý vòng đời các vấn đề chất lượng dữ liệu phát sinh từ kết quả quét DQ.

#### Nguồn gốc Issue

Issues được tạo **tự động** khi:
- Rule chạy (thủ công hoặc theo lịch) cho điểm dưới ngưỡng Warning hoặc Critical
- Hệ thống tự tính severity dựa trên khoảng cách giữa điểm và ngưỡng

#### Cấu trúc trang Issues

- **3 tab:** Tất cả Issues | Cascade Impact | (filter theo trạng thái)
- Bộ lọc: severity, status, bảng, chiều dữ liệu
- Mỗi issue: tiêu đề, mức độ (critical/high/medium), trạng thái, bảng, chiều, thời gian, người gán

#### Vòng đời Issue

```
[Mới]  →  [Đã phân công]  →  [Đang xử lý]  →  [Chờ duyệt]  →  [Đã xử lý]  →  [Đóng]
  │            │                   │                │
  └────────────┴───────────────────┴────────────────┘
              User thao tác qua Quick Actions
```

#### Quick Actions trên Issue

| Hành động | Mô tả |
|-----------|-------|
| **Thay đổi trạng thái** | Chuyển trạng thái theo vòng đời |
| **Phân công** | Gán issue cho người phụ trách |
| **Xem chi tiết bảng** | Link đến Data Catalog chi tiết |
| **Xem rule gốc** | Link đến rule đã gây ra issue |
| **Export CSV** | Xuất danh sách issue ra file CSV |

#### Tab Cascade Impact

Theo dõi ảnh hưởng lan truyền (cascade) khi 1 bảng nguồn có lỗi → ảnh hưởng đến báo cáo/KPI phụ thuộc:

```
Ví dụ chuỗi cascade:

  [KH_KHACHHANG] ──lỗi──→ [BC_DOANHTHU_NGAY] ──ảnh hưởng──→ [CT_DOANHTHU_Q1]
       (Nguồn)                  (Báo cáo)                      (Chỉ tiêu)

Timeline sự kiện:
  09:00  🔴 Phát hiện: KH_KHACHHANG completeness = 65 (< 70 Critical)
  09:01  🟡 Cascade: BC_DOANHTHU_NGAY — bảng nguồn có lỗi, báo cáo có thể sai
  09:05  📧 Thông báo gửi cho owner
  09:30  🔄 Đang xử lý: team data fix lỗi nguồn
  10:00  ✅ Giải quyết: KH_KHACHHANG đã fix → revalidate → pass
```

---

### 4.6 Giai đoạn 6: Thông báo — Quản lý thông báo (Notifications)

**Đường dẫn:** `/notifications`

**Mục đích:** Cấu hình kênh thông báo tự động khi phát hiện vấn đề chất lượng dữ liệu.

#### Các loại kênh thông báo

| Kênh | Mô tả |
|------|-------|
| **Email** | Gửi email cho danh sách người nhận. Hỗ trợ custom subject/body |
| **SMS** | Gửi tin nhắn SMS |
| **Telegram** | Gửi vào Telegram channel/group |
| **Webhook** | Gọi HTTP webhook (tích hợp hệ thống ngoài) |

#### Luồng cấu hình thông báo

```
Notifications → [+ Thêm cấu hình]
  │
  ├─ Tên cấu hình
  ├─ Loại kênh: Email / SMS / Telegram / Webhook
  ├─ Người nhận / URL webhook
  ├─ Điều kiện kích hoạt:
  │     ☑ Cảnh báo (Warning)
  │     ☑ Nghiêm trọng (Critical)
  │     ☐ Đã giải quyết (Resolved)
  ├─ Phạm vi bảng: Tất cả bảng / Chọn bảng cụ thể
  ├─ Tùy chọn Digest: gộp thông báo mỗi N phút
  ├─ Bật/tắt kích hoạt
  └─ [Lưu]
```

#### Tính năng Digest

Khi bật Digest, hệ thống gộp nhiều thông báo trong khoảng thời gian cấu hình (VD: 15 phút) thành 1 thông báo tổng hợp, tránh gửi quá nhiều tin nhắn riêng lẻ.

#### Tính năng thông báo downstream

Khi bật "Thông báo downstream", nếu bảng A có lỗi → thông báo sẽ gửi thêm cho owner của các bảng phụ thuộc vào bảng A.

---

### 4.7 Giai đoạn 7: Báo cáo — Báo cáo chất lượng (Reports)

**Đường dẫn:** `/reports`

**Mục đích:** Báo cáo tổng hợp điểm chất lượng dữ liệu, hỗ trợ người quản lý ra quyết định.

#### Các tab báo cáo

| Tab | Nội dung |
|-----|----------|
| **Tổng quan** (Overview) | KPI cards (điểm trung bình, số bảng đạt/không, số rule pass/fail/warning, issues mở), radar chart 6 chiều, trend 30 ngày, top 10 bảng kém nhất, top 10 rule kém nhất |
| **Chi tiết bảng** (Table Detail) | Chọn 1 bảng → xem điểm từng chiều, danh sách rules + kết quả, trend riêng |
| **Đối soát** (Reconciliation) | So sánh giá trị cột tổng hợp trên bảng báo cáo vs SUM từ bảng nguồn. Phát hiện chênh lệch |

#### Luồng drill-down trong báo cáo

```
Overview → Bấm KPI card "Điểm trung bình 82.5"
  └─ Hiển thị bảng tất cả bảng + điểm + xếp hạng (A/B/C/D/F)

Overview → Bấm "Bảng đạt: 12"
  └─ Hiển thị danh sách chỉ bảng đạt (≥80)

Overview → Bấm "Issues mở: 8"
  └─ Hiển thị danh sách issues đang mở + quick actions

Overview → Bấm vào tên bảng bất kỳ
  └─ Chuyển sang tab Chi tiết bảng → hiển thị rules, trend, từng chiều

Chi tiết bảng → Bấm vào 1 rule
  └─ Hiển thị lịch sử chạy rule (5 lần gần nhất)

Chi tiết bảng → Bấm vào 1 issue
  └─ Hiển thị chi tiết issue + timeline
```

#### Tab Đối soát (Reconciliation)

```
┌────────────────────────────────────────────────────────────────┐
│  Đối soát: Báo cáo vs Nguồn                                   │
├──────┬──────────┬──────┬──────┬──────┬──────┬──────┬──────────┤
│ Báo  │ Bảng     │ Cột  │ GT   │ GT   │ Chênh│ Ngưỡng│ Kết quả │
│ cáo  │ nguồn    │ soát │ BC   │nguồn │ lệch │      │         │
├──────┼──────────┼──────┼──────┼──────┼──────┼──────┼──────────┤
│ BC_  │ GD_      │TONG  │500M  │500.5M│0.1%  │0.5%  │ ✅ Pass  │
│ DT   │ GIAODICH │TIEN  │      │      │      │      │         │
└──────┴──────────┴──────┴──────┴──────┴──────┴──────┴──────────┘
```

---

## 5. Các module hỗ trợ

### 5.1 Dashboard — Tổng quan hệ thống

**Đường dẫn:** `/`

Dashboard là trang đầu tiên khi truy cập hệ thống, cung cấp cái nhìn tổng quan.

#### Thành phần Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  Tổng quan hệ thống               [Hôm nay] [7 ngày] [30d] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✨ Lộ trình thiết lập DQ ──────────── 5/5 bước (100%)      │
│  │ ✅ Cấu hình ngưỡng  │ ✅ Đăng ký bảng  │ ✅ Tạo quy tắc │
│  │ ✅ Đặt lịch chạy    │ ✅ Cấu hình thông báo              │
│                                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                        │
│  │ 15   │ │ 82.5 │ │ 12/3 │ │ 8    │                        │
│  │Bảng  │ │Đ.bình│ │Đạt/KĐ│ │Issues│                        │
│  └──────┘ └──────┘ └──────┘ └──────┘                        │
│                                                              │
│  Biểu đồ trend 7/30 ngày         │ Phân bổ 6 chiều (bar)   │
│  ┌──────────────────┐             │ ┌────────────────┐      │
│  │    ⟋ ───────     │             │ │ ████ Đầy đủ 87│       │
│  │   ⟋              │             │ │ ███  Hợp lệ 81│       │
│  │  ⟋               │             │ │ ██  Nhất quán │       │
│  └──────────────────┘             │ └────────────────┘      │
│                                                              │
│  Top 8 bảng điểm thấp nhất  │  Top 8 rule lỗi nhiều nhất   │
│  ┌──────────────────┐        │  ┌──────────────────┐         │
│  │ TB_RISK    62    │        │  │ NOT NULL — Mã KH │         │
│  │ TB_FEE     65    │        │  │ Format — SĐT     │         │
│  └──────────────────┘        │  └──────────────────┘         │
│                                                              │
│  Issues gần đây (8 mục)                                      │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ 🔴 Critical │ NOT NULL — Mã KH │ KH_KHACHHANG │ 2h ago ││
│  │ 🟡 Warning  │ Fill Rate — Email │ KH_TAIKHOAN  │ 5h ago ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

#### Onboarding Checklist (Lộ trình thiết lập)

5 bước cần hoàn tất để hệ thống DQ hoạt động đầy đủ:

| Bước | Tên | Mô tả | Link |
|------|-----|-------|------|
| 1 | Cấu hình ngưỡng mặc định | Đặt ngưỡng Warning/Critical cho 6 chiều DQ | → Settings |
| 2 | Đăng ký bảng dữ liệu | Import hoặc thêm bảng cần giám sát | → Data Catalog |
| 3 | Tạo quy tắc kiểm tra | Khai báo rules kiểm tra cho bảng | → Rules |
| 4 | Đặt lịch chạy DQ | Cấu hình lịch quét tự động | → Schedules |
| 5 | Cấu hình thông báo | Bật kênh nhận cảnh báo | → Notifications |

Mỗi bước bấm vào sẽ chuyển đến trang tương ứng. Progress bar hiển thị % hoàn thành.

---

### 5.2 Phân tích dữ liệu (Profiling)

**Đường dẫn:** `/profiling`

**Mục đích:** Xem lịch sử quét thống kê cột (profiling snapshot). Mỗi lần chạy tạo 1 snapshot chứa thống kê: tổng dòng, điểm, thời gian, profile từng cột.

**Lưu ý:** Điểm profiling là snapshot tại thời điểm quét, **độc lập** với điểm tổng hợp từ Rules hiển thị trên Data Catalog.

#### Luồng sử dụng

```
Profiling → Lọc theo bảng/loại/trạng thái/ngày
  │
  ├─ Xem danh sách lịch sử quét
  ├─ Bấm [👁 Xem] → Chi tiết profiling 1 bảng
  │     Xem profile từng cột: kiểu dữ liệu, null%, distinct, min/max, ...
  ├─ Bấm [🔄 Chạy lại] → Re-run profiling
  └─ Bấm [▶ Chạy phân tích mới] → Chọn bảng → Chạy
```

---

### 5.3 Cài đặt (Settings)

**Đường dẫn:** `/settings/*`

| Trang | Đường dẫn | Chức năng |
|-------|-----------|-----------|
| Ngưỡng mặc định | `/settings/default-thresholds` | Đặt ngưỡng Warning/Critical mặc định cho 6 chiều. Khi tạo bảng mới, ngưỡng này được áp dụng nếu không cấu hình riêng |
| Quy tắc mặc định | `/settings/default-rules` | Cấu hình danh sách rule mặc định áp cho bảng mới |
| Lịch mặc định | `/settings/default-schedules` | Cấu hình lịch chạy mặc định |
| Quản lý người dùng | `/settings/users` | Quản lý user, vai trò, phân quyền |

---

## 6. Tổng quan 28 metrics kiểm tra chất lượng

Hệ thống hỗ trợ **28 loại metric** phân bổ trên 6 chiều dữ liệu:

| Chiều | # Metric | Cấp | Metrics |
|-------|----------|-----|---------|
| **Đầy đủ** (Completeness) | 8 | 4 cột + 4 bảng | not_null, fill_rate, null_rate_by_period, conditional_not_null, row_count, time_coverage, volume_change, report_row_count_match |
| **Hợp lệ** (Validity) | 5 | 4 cột + 1 bảng | format_regex, blacklist_pattern, value_range, allowed_values, custom_expression |
| **Nhất quán** (Consistency) | 4 | 3 cột + 1 bảng | fixed_datatype, mode_check, referential_integrity, parent_child_match |
| **Duy nhất** (Uniqueness) | 2 | 1 cột + 1 bảng | duplicate_single, duplicate_composite |
| **Chính xác** (Accuracy) | 7 | 4 cột + 3 bảng | reference_match, statistics_bound, sum_range, expression_pct, table_size, aggregate_reconciliation, kpi_variance |
| **Kịp thời** (Timeliness) | 2 | 2 cột | on_time, freshness |

**Tổng:** 10 metric cấp bảng + 18 metric cấp cột = **28 metric**

> Chi tiết cấu hình từng metric (thông số, giải thích, ví dụ SQL) xem tại tài liệu [HDSD.md](HDSD.md).

---

## 7. Hệ thống mẫu 3 tầng (Template System)

Hệ thống mẫu giúp tạo nhanh quy tắc cho nhiều bảng thay vì cấu hình từng rule một theo cách thủ công.

### 3 tầng mẫu

```
┌─────────────────────────────────────────────────────────┐
│  Tầng 1: Mẫu Metric (Metric Template)                   │
│  = 1 metric + thông số + ngưỡng mặc định                │
│  VD: "Not Null — fill ≥ 95% — W:95 C:85"                │
│      "Format Regex — email — W:90 C:80"                 │
│      "Freshness — max 24h — W:80 C:60"                  │
└────────────────────┬────────────────────────────────────┘
                     │ Gom nhiều Mẫu Metric
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Tầng 2: Mẫu Cột (Column Profile)                       │
│  = 1 nhóm cột tương tự + danh sách Mẫu Metric           │
│  VD: "Cột Email" → gán 3 metric: not_null, format_regex,│
│       fill_rate                                         │
│      "Cột Số tiền" → gán 2 metric: value_range, not_null│
│  Khớp tự động: dựa trên keywords trong tên cột          │
│  VD: cột "EMAIL" → match keyword "email" → áp mẫu       │
└────────────────────┬────────────────────────────────────┘
                     │ Gom nhiều Mẫu Cột
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Tầng 3: Mẫu Bảng (Table Profile)                       │
│  = 1 loại bảng (source/report/kpi) + partition + mode   │
│  + danh sách Mẫu Cột                                    │
│  VD: "Bảng nguồn — Daily Append" → gắn 5 mẫu cột        │
│  Khớp tự động: khi đăng ký bảng, hệ thống tìm Table     │
│  Profile phù hợp nhất theo moduleType + partition + mode│
└─────────────────────────────────────────────────────────┘
```

### Luồng áp dụng mẫu

```
1. User đăng ký bảng mới (Data Catalog)
2. Hệ thống tự match Table Profile phù hợp:
   moduleType=source, partition=daily, mode=append → "Bảng nguồn Daily Append"
3. Từ Table Profile → lấy danh sách Mẫu Cột
4. Với mỗi cột thực tế trong bảng :
   - Kiểm tra tên cột có match keyword nào trong Mẫu Cột
   - VD: cột "EMAIL" match keyword "email" → áp Mẫu Cột "Email"
5. Từ Mẫu Cột → lấy danh sách Mẫu Metric → tạo Rules
6. User review gợi ý → [Áp dụng] → Tạo N rules tự động
```

---

## 8. Luồng điều hướng giữa các màn hình

### Sơ đồ liên kết chính

```
                    ┌─────────────┐
                    │  Dashboard  │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐    ┌──────────┐
    │Data      │   │  Issues  │    │ Reports  │
    │Catalog   │   │          │    │          │
    └────┬─────┘   └────┬─────┘    └────┬─────┘
         │              │               │
    ┌────┴─────┐   ┌────┴─────┐   ┌────┴─────┐
    │Detail    │   │Issue     │   │Table     │
    │bảng      │   │Detail    │   │Detail    │
    └────┬─────┘   └──────────┘   │Report    │
         │                        └──────────┘
    ┌────┴────────────┐
    │                 │
    ▼                 ▼
┌──────┐       ┌──────────┐
│Rules │       │Schedules │
│(+new)│       │(?tableId)│
└──────┘       └──────────┘
```

### Bảng liên kết chi tiết

| Từ màn hình | Hành động | Đến màn hình | Dữ liệu truyền |
|-------------|-----------|--------------|-----------------|
| Dashboard → | Bấm "Đăng ký bảng" (onboarding) | Data Catalog | — |
| Dashboard → | Bấm "Tạo quy tắc" (onboarding) | Rules | — |
| Dashboard → | Bấm "Đặt lịch chạy" (onboarding) | Schedules | — |
| Dashboard → | Bấm "Cấu hình thông báo" (onboarding) | Notifications | — |
| Dashboard → | Bấm "Cấu hình ngưỡng" (onboarding) | Settings: Ngưỡng MĐ | — |
| Dashboard → | Bấm bảng kém nhất | Data Catalog Detail | tableId |
| Dashboard → | Bấm issue gần đây | Issue Detail | issueId |
| Data Catalog Detail → | [+ Tạo rule cho bảng này] | Rules | `?action=new&tableId=xxx` |
| Data Catalog Detail → | [📅 Đặt lịch chạy] | Schedules | `?tableId=xxx` |
| Schedules → | Bấm [🔗 Xem Issues] | Issues | `state: {tableId}` |
| Pipeline Monitor → | Bấm [👁 Xem] job | Pipeline Detail | jobId (URL param) |
| Pipeline Detail → | Bấm node bảng → drawer → [Xem chi tiết] | Data Catalog Detail | tableId |
| Pipeline Detail → | Bấm node bảng → drawer → [Tạo rule] | Rules | `?action=new&tableId=xxx` |
| Pipeline Detail → | Bấm node bảng → drawer → [Đặt lịch] | Schedules | `?tableId=xxx` |
| Issues → | Bấm vào 1 issue | Issue Detail | issueId |
| Reports → | Chọn bảng trong tab "Chi tiết" | Report Table Detail | tableId (in-page) |
| Reports → | Bấm vào issue trong drill-down | Issue Detail | issueId (in-page) |

### Deep Link patterns

| URL Pattern | Hành vi |
|-------------|---------|
| `/schedules?tableId=ds-001` | Nếu bảng đã có lịch → auto-filter. Nếu chưa → mở form thêm mới với bảng đã chọn |
| `/rules?action=new&tableId=ds-001` | Mở form tạo rule mới với bảng đã chọn sẵn |
| `/issues` + state `{tableId}` | Filter issues theo bảng |
| `/data-catalog/ds-001` | Trang chi tiết bảng |
| `/pipeline-monitor/job-001` | Trang chi tiết pipeline job |
| `/issues/iss-001` | Trang chi tiết issue |

---

## Phụ lục: Thuật ngữ

| Thuật ngữ | Giải thích |
|-----------|------------|
| **DQ** | Data Quality — Chất lượng dữ liệu |
| **Rule** | Quy tắc kiểm tra — 1 phép kiểm tra cụ thể trên 1 bảng/cột |
| **Metric** | Loại phép đo chất lượng (VD: not_null, fill_rate, freshness) |
| **Dimension** | Chiều chất lượng (6 chiều: Đầy đủ, Hợp lệ, Nhất quán, Duy nhất, Chính xác, Kịp thời) |
| **Threshold** | Ngưỡng — gồm Warning (cảnh báo) và Critical (nghiêm trọng) |
| **Score** | Điểm chất lượng 0-100, tính từ kết quả chạy rules |
| **Grade** | Xếp hạng: A (≥90), B (≥80), C (≥70), D (≥60), F (<60) |
| **Template** | Mẫu — config sẵn để áp nhanh cho nhiều bảng/cột |
| **Profiling** | Phân tích thống kê cột: null%, distinct, min/max, phân bổ |
| **Cascade** | Ảnh hưởng lan truyền — lỗi bảng nguồn ảnh hưởng đến báo cáo/KPI phụ thuộc |
| **Pipeline** | Chuỗi ETL job: input → transform → output |
| **SQLWF** | SQL Workflow — công cụ quản lý job nội bộ (~11k bảng) |
| **ETL** | Extract-Transform-Load — quy trình nạp dữ liệu |
| **HDFS** | Hadoop Distributed File System — hệ thống lưu trữ dữ liệu phân tán |
| **Digest** | Gộp nhiều thông báo thành 1 thông báo tổng hợp |
| **Deep link** | URL chứa tham số, giúp chuyển đến đúng context (VD: bảng đã chọn) |
| **dataRequiredByTime** | Giờ dữ liệu sẵn sàng — thời gian ETL load xong, dùng để tránh quét DQ quá sớm (false alarm) |
