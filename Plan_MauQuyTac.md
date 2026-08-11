# Plan: Nâng cấp Mẫu quy tắc — Mẫu Metric / Mẫu Cột / Mẫu Bảng

> **Ngày:** 13/04/2026
> **Scope:** Tab "Mẫu quy tắc" trong trang `/rules` — 3 sub-tab
> **Trạng thái hiện tại:** Đã có UI cơ bản cho cả 3 sub-tab, nhưng còn nhiều thiếu sót
> **Mode:** @uiux plan

---

## Mục lục

1. [Tổng quan vấn đề](#1-tổng-quan-vấn-đề)
2. [Đổi tên thống nhất](#2-đổi-tên-thống-nhất)
3. [Mẫu Metric — CRUD + cấu hình chi tiết](#3-mẫu-metric)
4. [Mẫu Cột — Gom nhiều Mẫu Metric cho 1 loại cột](#4-mẫu-cột)
5. [Mẫu Bảng — Gom Mẫu Cột + metric cấp bảng](#5-mẫu-bảng)
6. [Scalable UI patterns](#6-scalable-ui-patterns)
7. [Data model changes](#7-data-model-changes)
8. [Files cần sửa](#8-files-cần-sửa)
9. [Verification](#9-verification)

---

## 1. Tổng quan vấn đề

### Hiện trạng (AS-IS)

| Sub-tab | Có gì | Thiếu gì |
|---------|-------|----------|
| **Mẫu Metric** | 22 template dạng card read-only, nút "Dùng mẫu" | Không tạo/sửa/xóa được. Không có cấu hình chi tiết (chỉ thấy tên + mô tả). Không có ngưỡng W/C. Không search scale được (card grid, không phân trang) |
| **Hồ sơ Cột** | CRUD basic, bảng + phân trang, tag input từ khóa | Chọn metric bằng checkbox trong `max-h-64 overflow-y-auto` — khi có 50-100 metric sẽ scroll rất dài. Không search metric. Không hiện chi tiết metric đã chọn |
| **Hồ sơ Bảng** | CRUD basic, bảng + phân trang | Chọn metric cấp bảng + hồ sơ cột bằng checkbox trong `max-h-48 overflow-y-auto` — không scale. Không search |

### Vấn đề chung

1. **Mẫu Metric không CRUD** → user không thể tạo mẫu metric riêng theo nghiệp vụ (VD: "Not null — Cột CCCD" với pattern cụ thể)
2. **Mẫu Metric không có cấu hình chi tiết** → khi "dùng mẫu" chỉ fill tên, không fill config (pattern, min/max, refTable...)
3. **Checkbox list không scale** → khi có 50+ metric hoặc 30+ Mẫu Cột, list scroll dài, không tìm được
4. **Tên không thống nhất**: "Mẫu Metric" vs "Hồ sơ cột" vs "Hồ sơ bảng" → nên cùng pattern

### Mục tiêu (TO-BE)

- **Mẫu Metric:** CRUD đầy đủ, dynamic form theo loại metric (giống form tạo Rule), lưu thành mẫu dùng lại, hiển thị dạng bản ghi như 2 tab còn lại, nhất quán
- **Mẫu Cột:** Chọn Mẫu Metric bằng **searchable multi-select** (không phải checkbox scroll)
- **Mẫu Bảng:** Chọn Mẫu Metric cấp bảng + Mẫu Cột bằng **searchable multi-select**
- **Tên thống nhất:** Mẫu Metric / Mẫu Cột / Mẫu Bảng

---

## 2. Đổi tên thống nhất

| Tên cũ | Tên mới | Code ID |
|--------|---------|---------|
| Mẫu Metric | **Mẫu Metric** | `metrics` |
| Hồ sơ cột | **Mẫu Cột** | `column_profiles` |
| Hồ sơ bảng | **Mẫu Bảng** | `table_profiles` |

Thay đổi text ở:
- Sub-tab labels: `Mẫu Metric (22)` / `Mẫu Cột (7)` / `Mẫu Bảng (5)`
- Dialog titles: "Thêm mẫu metric", "Sửa mẫu cột", "Thêm mẫu bảng"
- Button labels: "+Thêm mẫu metric", "+Thêm mẫu cột", "+Thêm mẫu bảng"
- Placeholder, confirmation text
- Column header "Hồ sơ cột" trong bảng Mẫu Bảng → "Mẫu cột"

---

## 3. Mẫu Metric — CRUD + cấu hình chi tiết

### 3.1 Hiện trạng

**`MetricTemplatesSubTab`:**
- **Chỉ đọc** — card grid, không tạo/sửa/xóa
- Card hiện: DimensionBadge, tên, mô tả, metricSummary (1 dòng code), nút "Dùng mẫu"
- Filter: search text + filter theo dimension (chip buttons)
- Không phân trang (grid tất cả)

### 3.2 Yêu cầu thay đổi

| # | Yêu cầu | Chi tiết |
|---|---------|---------|
| 1 | **Chuyển từ card grid → bảng (Table)** | Card grid không scale khi có 50-100 mẫu. Dùng Table + phân trang PAGE_SIZE=10 (giống Mẫu Cột/Bảng đã có) |
| 2 | **CRUD đầy đủ** | Thêm nút "+Thêm mẫu metric". Mỗi row có nút Sửa, Xóa, Dùng mẫu |
| 3 | **Form tạo/sửa: dynamic fields theo loại metric** | Khi chọn `metricType` → form hiện các field tương ứng. Logic này **đã có sẵn** trong form tạo Rule hiện tại (xem `renderMetricFields` hoặc tương đương trong Rules page) → **tái sử dụng** |
| 4 | **Form phải có ngưỡng W/C** | Mỗi mẫu metric lưu ngưỡng mặc định (warning, critical). Khi áp dụng → rule kế thừa ngưỡng này |
| 5 | **Xóa: cảnh báo nếu đang dùng** | Nếu mẫu đang được reference trong Mẫu Cột/Bảng → hiện warning "Mẫu này đang được dùng trong X mẫu cột, Y mẫu bảng. Xóa sẽ ảnh hưởng." |

### 3.3 UI bảng — Mẫu Metric

**Toolbar:**
```
[🔍 Tìm theo tên mẫu hoặc loại metric...  ]   [Chip: Tất cả | Đầy đủ | Hợp lệ | ... ]   [+ Thêm mẫu metric]
```

**Table columns:**

| STT | Tên mẫu | Chiều DL | Loại metric | Cấu hình tóm tắt | Ngưỡng | Lần dùng | Thao tác |
|-----|---------|----------|-------------|-------------------|--------|----------|----------|
| 1 | Không được null — Bắt buộc | Đầy đủ | `not_null` | — | W:95 C:85 | 45 | ✏️ 🗑️ 📋 |
| 2 | Đúng format — Email | Hợp lệ | `format_regex` | Pattern: `^[\w.-]+@...` | W:90 C:80 | 23 | ✏️ 🗑️ 📋 |
| 3 | Giá trị dương — Số tiền | Hợp lệ | `value_range` | Min: 0 | W:95 C:90 | 38 | ✏️ 🗑️ 📋 |
| 4 | Tham chiếu — DM Chi nhánh | Nhất quán | `referential_integrity` | → DM_CHINHANH.MA_CN | W:100 C:95 | 12 | ✏️ 🗑️ 📋 |
| 5 | Đếm số dòng — Daily | Đầy đủ | `row_count` | [1000, 10000000] | W:90 C:80 | 67 | ✏️ 🗑️ 📋 |

- Cột "Cấu hình tóm tắt" dùng hàm `metricSummary()` đã có
- Cột "Ngưỡng" hiện `W:95 C:85` compact
- Phân trang: PAGE_SIZE=10
- Nút 📋 = "Dùng mẫu" (fill vào form tạo Rule)

### 3.4 Form tạo/sửa Mẫu Metric

**Dialog size:** `lg` (large)

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ Thêm mẫu metric                              [X]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Tên mẫu *                                          │
│ [VD: Không được null — Cột bắt buộc           ]    │
│                                                     │
│ Mô tả                                              │
│ [Kiểm tra cột không được chứa giá trị NULL    ]    │
│                                                     │
│ ┌──────────────────┐  ┌──────────────────────┐      │
│ │ Chiều DL *       │  │ Loại metric *        │      │
│ │ [▾ Đầy đủ     ]  │  │ [▾ Không được null]  │      │
│ └──────────────────┘  └──────────────────────┘      │
│                                                     │
│ ── Cấu hình metric ────────────────────────────     │
│ (Dynamic fields — thay đổi theo loại metric)        │
│                                                     │
│ [Nếu not_null: không cần thêm field]               │
│ [Nếu format_regex: hiện field Pattern]              │
│ [Nếu value_range: hiện field Min, Max]              │
│ [Nếu referential_integrity: hiện Bảng ref, Cột ref]│
│ [Nếu row_count: hiện Min rows, Max rows]   
Metric cần khớp giống với khi thêm mới 1 quy tắc, đừng tự bịa         │
│ [...]                                               │
│                                                     │
│ ── Ngưỡng mặc định ───────────────────────────     │
│ ┌──────────────────┐  ┌──────────────────────┐      │
│ │ Critical (%) *    │  │ Warning (%) *       │      │
│ │ [85            ]  │  │ [95               ]  │      │
│ └──────────────────┘  └──────────────────────┘      │
│                                                     │
│                           [Hủy]  [Lưu]   │
└─────────────────────────────────────────────────────┘
```

**Dynamic fields theo loại metric:**

Đây là phần quan trọng nhất. Logic đã có sẵn trong form tạo Rule hiện tại. Cần **extract** ra component riêng `MetricConfigFields` để dùng chung:

| Loại metric | Fields hiển thị |
|-------------|-----------------|
| `not_null` | (không cần thêm) |
| `fill_rate` | `minFillPct` (number, %) |
| `format_regex` | `pattern` (text, regex) |
| `blacklist_pattern` | `blacklistPattern` (text, regex) |
| `value_range` | `minValue` (number), `maxValue` (number) |
| `allowed_values` | `allowedValues` (tag input, nhiều giá trị) |
| `referential_integrity` | `refTable` (text/select), `refColumn` (text) |
| `fixed_datatype` | `dataType` (select: STRING/INTEGER/DECIMAL/DATE/TIMESTAMP) |
| `mode_check` | `modeValue` (text), `minFreqPct` (number, %) |
| `statistics_bound` | `statisticType` (select: min/max/mean/stddev/p25/p50/p75), `minValue`, `maxValue` |
| `sum_range` | `minValue`, `maxValue` |
| `expression_pct` | `expression` (textarea, SQL), `minPassPct` (number, %) |
| `null_rate_by_period` | `timeColumn` (text), `granularity` (select), `coverageDays` (number), `maxNullPct` (number, %) |
| `conditional_not_null` | `condition` (textarea, SQL WHERE) |
| `on_time` | `slaTime` (time input, HH:mm), `alertWindowMinutes` (number) |
| `freshness` | `maxAge` (number), `maxAgeUnit` (select: minutes/hours/days) |
| `row_count` | `minRows` (number), `maxRows` (number) |
| `volume_change` | `maxChangePct` (number, %), `lookbackPeriod` (number, ngày) |
| `time_coverage` | `timeColumn` (text), `granularity` (select), `coverageDays` (number), `minCoveragePct` (number, %) |
| `table_size` | `tableSizeMin` (number), `tableSizeMax` (number), `tableSizeUnit` (select: MB/GB) |
| `custom_expression` | `expression` (textarea, SQL) |
| `duplicate_single` | (không cần thêm — cột sẽ chọn khi tạo rule) |
| `duplicate_composite` | `columns` (tag input, nhiều cột) |
| `reference_match` | `sourceColumn` (text), `refTable` (text), `refColumn` (text) |
| `aggregate_reconciliation` | `sourceTableId` (select), `reportColumn` (text), `tolerancePct` (number, %) |
| `report_row_count_match` | `sourceTableId` (select) |
| `kpi_variance` | `maxVariancePct` (number, %) |
| `parent_child_match` | `parentKpiColumn` (text), `childSumExpression` (textarea), `tolerancePct` (number, %) |

**Lưu ý:** Form tạo Mẫu Metric **KHÔNG có field "Cột"** (column). Cột sẽ được chỉ định khi áp dụng mẫu vào bảng cụ thể (tại bước tạo Rule hoặc qua Mẫu Cột). Mẫu Metric chỉ lưu **cấu hình kỹ thuật** (pattern, min/max, refTable...) + **ngưỡng W/C**. Các thông tin cấu hình cần khớp với config khi thêm mới 1 rule/ metric, ở trên chỉ là ví dụ 

### 3.5 Data model — RuleTemplate (mở rộng)

```typescript
export interface RuleTemplate {
  id: string
  name: string
  dimension: QualityDimension
  description: string
  metricConfig?: MetricConfig        // ← đã có, giữ nguyên — chứa toàn bộ config
  category: string                   // VD: "column" | "table" | "report" | "kpi"
  usageCount: number
  // MỚI:
  threshold: { warning: number; critical: number }   // ← thêm ngưỡng mặc định
  createdAt: string
  updatedAt: string
  createdBy: string
  isBuiltIn: boolean                 // true = hệ thống tạo sẵn (22 cái hiện tại), false = user tạo
}
```

---

## 4. Mẫu Cột — Gom nhiều Mẫu Metric cho 1 loại cột

### 4.1 Hiện trạng

- CRUD có, bảng + phân trang có, tag input từ khóa có
- **Vấn đề:** Chọn metric bằng checkbox trong div `max-h-64 overflow-y-auto`, nhóm theo dimension → khi có 50+ metric sẽ scroll rất dài, không search được

### 4.2 Yêu cầu thay đổi

| # | Yêu cầu | Chi tiết |
|---|---------|---------|
| 1 | **Đổi tên** | "Hồ sơ cột" → "Mẫu Cột" (tất cả UI text) |
| 2 | **Chọn Mẫu Metric: Searchable Multi-Select** | Thay checkbox list bằng component có search + chip display |
| 3 | **Hiện chi tiết metric đã chọn** | Dưới multi-select, hiện bảng tóm tắt các metric đã chọn (tên, chiều, ngưỡng) |
| 4 | **Override ngưỡng per metric** | Mỗi metric đã chọn cho phép override W/C (nếu không override → kế thừa từ Mẫu Metric) |

### 4.3 UI Form tạo/sửa Mẫu Cột

```
┌─────────────────────────────────────────────────────┐
│ Thêm mẫu cột                                 [X]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Tên mẫu *                                          │
│ [VD: Cột mã khách hàng                        ]    │
│                                                     │
│ Mô tả                                              │
│ [Áp dụng cho cột mã KH: bắt buộc, format, ref]    │
│                                                     │
│ ── Từ khóa nhận diện cột ──────────────────────     │
│ Nhập từ khóa, nhấn Enter. Hệ thống gợi ý khi      │
│ tên cột chứa từ khóa.                              │
│                                                     │
│ [MA_KH ×] [CUSTOMER_ID ×] [ID_KH ×]                │
│ [Nhập từ khóa, nhấn Enter...                  ]    │
│                                                     │
│ ── Chọn Mẫu Metric ───────────────────────────     │
│ ┌─────────────────────────────────────────────┐     │
│ │ 🔍 Tìm mẫu metric...          Đã chọn: 3  │     │
│ ├─────────────────────────────────────────────┤     │
│ │ ☑ Không được null — Bắt buộc    [Đầy đủ]   │     │
│ │ ☑ Đúng format — Mã KH           [Hợp lệ]   │     │
│ │ ☑ Tham chiếu — DM KH          [Nhất quán]   │     │
│ │ ☐ Đúng format — Email            [Hợp lệ]   │     │
│ │ ☐ Giá trị dương — Số tiền        [Hợp lệ]   │     │
│ │ ☐ Không trùng lặp               [Duy nhất]   │     │
│ │ ... (scroll nếu cần, nhưng có search ở trên) │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ ── Metric đã chọn (3) ────────────────────────     │
│ ┌───────────────────────────┬───────┬────────┬──┐  │
│ │ Mẫu Metric               │ Chiều │ W   C  │🗑│  │
│ ├───────────────────────────┼───────┼────────┼──┤  │
│ │ Không được null — Bắt buộc│Đầy đủ│ 95  85 │🗑│  │
│ │ Đúng format — Mã KH      │Hợp lệ│ 90  80 │🗑│  │
│ │ Tham chiếu — DM KH       │N.quán│100  95 │🗑│  │
│ └───────────────────────────┴───────┴────────┴──┘  │
│ (W/C kế thừa từ Mẫu Metric, click để override)    │
│                                                     │
│                           [Hủy]  [Lưu]   │
└─────────────────────────────────────────────────────┘
```

### 4.4 Component "Searchable Multi-Select" — Chi tiết

Đây là component tái sử dụng cho cả Mẫu Cột (chọn metric) và Mẫu Bảng (chọn metric cấp bảng + chọn mẫu cột).

**Cấu trúc:**

```
┌─────────────────────────────────────────────┐
│ 🔍 [Search input...             ] Đã chọn: N│
├─────────────────────────────────────────────┤
│   ── Đầy đủ (Completeness) ──              │  ← Nhóm theo dimension
│   ☑ Không được null — Bắt buộc             │    (hoặc không nhóm nếu flat)
│   ☐ Tỷ lệ điền dữ liệu                    │
│   ☐ % Null theo chu kỳ                     │
│                                             │
│   ── Hợp lệ (Validity) ──                  │
│   ☑ Đúng format — Mã KH                    │
│   ☐ Giá trị dương — Số tiền                │
│   ...                                       │
├─────────────────────────────────────────────┤
│ Dropdown height cố định: max-h-60 (240px)  │
│ Scroll nếu list dài, nhưng search filter   │
│ giúp thu hẹp kết quả                       │
└─────────────────────────────────────────────┘
```

**Behavior:**
1. Search input filter tên mẫu metric → chỉ hiện matching items
2. Checkbox toggle chọn/bỏ chọn
3. Badge "Đã chọn: N" cập nhật real-time
4. Nhóm theo dimension (collapse/expand) HOẶC flat list nếu ít item
5. Items đã chọn luôn hiển thị ở trên (pinned) hoặc hiện trong bảng riêng bên dưới

**Props interface:**
```typescript
interface SearchableMultiSelectProps {
  items: Array<{ id: string; label: string; group?: string; badge?: string }>
  selectedIds: string[]
  onChange: (ids: string[]) => void
  placeholder?: string        // "Tìm mẫu metric..."
  groupBy?: boolean            // true = nhóm theo group
  maxHeight?: number           // default 240px
}
```

### 4.5 Bảng danh sách Mẫu Cột (đã có — giữ nguyên + đổi tên)

| STT | Tên mẫu | Từ khóa cột | Số metrics | Chiều DL | Lần dùng | Thao tác |
|-----|---------|-------------|-----------|----------|----------|----------|

→ Chỉ đổi header "Tên hồ sơ" → "Tên mẫu", nút "+Thêm hồ sơ cột" → "+Thêm mẫu cột", dialog title tương ứng.

---

## 5. Mẫu Bảng — Gom Mẫu Cột + metric cấp bảng

### 5.1 Hiện trạng

- CRUD có, bảng + phân trang có
- **Vấn đề:** Chọn metric cấp bảng và Mẫu Cột bằng checkbox `max-h-48` — không scale

### 5.2 Yêu cầu thay đổi

| # | Yêu cầu | Chi tiết |
|---|---------|---------|
| 1 | **Đổi tên** | "Hồ sơ bảng" → "Mẫu Bảng" (tất cả UI text) |
| 2 | **Chọn Metric cấp bảng: Searchable Multi-Select** | Dùng cùng component với Mẫu Cột, nhưng filter chỉ hiện metric cấp bảng |
| 3 | **Chọn Mẫu Cột: Searchable Multi-Select** | Dùng cùng component, items = danh sách Mẫu Cột đã tạo |
| 4 | **Preview tổng hợp** | Dưới form, hiện tóm tắt: "Tổng: X metric cấp bảng + Y mẫu cột (Z metric cột)" |

### 5.3 UI Form tạo/sửa Mẫu Bảng

```
┌─────────────────────────────────────────────────────┐
│ Thêm mẫu bảng                                [X]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Tên mẫu *                                          │
│ [VD: Bảng giao dịch daily                     ]    │
│                                                     │
│ Mô tả                                              │
│ [Bảng append daily, check freshness + volume...]   │
│                                                     │
│ ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│ │ Loại bảng *  │  │ Mode *       │  │ Partition* │  │
│ │ [▾ Bảng nguồn] │ [▾ Append   ] │  [▾ Theo ngày]│ │
│ └──────────────┘  └──────────────┘  └───────────┘  │
│                                                     │
│ ── Chọn Mẫu Metric cấp bảng ──────────────────     │
│ ┌─────────────────────────────────────────────┐     │
│ │ 🔍 Tìm metric cấp bảng...     Đã chọn: 3  │     │
│ ├─────────────────────────────────────────────┤     │
│ │ ☑ Đếm số dòng — Daily          [Đầy đủ]    │     │
│ │ ☑ Biến động số lượng            [Đầy đủ]    │     │
│ │ ☑ Độ tươi dữ liệu             [Kịp thời]   │     │
│ │ ☐ Phủ thời gian                [Đầy đủ]    │     │
│ │ ☐ Kích thước bảng            [Chính xác]    │     │
│ │ ...                                         │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ ── Chọn Mẫu Cột ─────────────────────────────     │
│ ┌─────────────────────────────────────────────┐     │
│ │ 🔍 Tìm mẫu cột...            Đã chọn: 3  │     │
│ ├─────────────────────────────────────────────┤     │
│ │ ☑ Cột mã khách hàng  [MA_KH|CUSTOMER_ID]   │     │
│ │ ☑ Cột ngày giao dịch [NGAY_GD|TRANS_DATE]  │     │
│ │ ☑ Cột số tiền        [SO_TIEN|AMOUNT]      │     │
│ │ ☐ Cột trạng thái     [TRANG_THAI|STATUS]   │     │
│ │ ☐ Cột email          [EMAIL]                │     │
│ │ ...                                         │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ ── Tổng hợp ──────────────────────────────────     │
│ ┌─────────────────────────────────────────────┐     │
│ │ Metric cấp bảng: 3                         │     │
│ │ Mẫu cột: 3 (tổng 9 metric cột)             │     │
│ │ Ước tính: ~12 quy tắc sẽ sinh / bảng       │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│                           [Hủy]  [Tạo mới / Lưu]   │
└─────────────────────────────────────────────────────┘
```

### 5.4 Bảng danh sách Mẫu Bảng (đã có — đổi tên)

| STT | Tên mẫu | Loại | Mode | Partition | QT cấp bảng | Mẫu cột | Lần dùng | Thao tác |
|-----|---------|------|------|-----------|-------------|---------|----------|----------|

→ Đổi header "Tên hồ sơ" → "Tên mẫu", "Hồ sơ cột" → "Mẫu cột", button/dialog text tương ứng.

---

## 6. Scalable UI Patterns

### 6.1 SearchableMultiSelect — Component mới

**Dùng ở:**
- Mẫu Cột form → chọn Mẫu Metric
- Mẫu Bảng form → chọn Mẫu Metric cấp bảng
- Mẫu Bảng form → chọn Mẫu Cột
- (Tương lai) DataCatalog form → chọn Mẫu Bảng

**Đặc điểm scale:**

| Vấn đề | Giải pháp |
|--------|-----------|
| 100+ items | Search filter real-time → thu hẹp list |
| Scroll dài | `max-h-60` (240px) cố định, overflow-y-auto |
| Không thấy đã chọn gì | Badge "Đã chọn: N" + bảng riêng hiển thị items đã chọn bên dưới |
| Nhóm theo category | Group header (dimension) collapsible |
| Mobile responsive | Single column, full width |

### 6.2 Phân trang cho tất cả bảng danh sách

- PAGE_SIZE = 10 (đã có cho Mẫu Cột, Mẫu Bảng)
- **Mẫu Metric:** thêm phân trang (hiện tại là card grid không phân trang)

### 6.3 Confirm xóa khi có dependency

```
Dialog xác nhận xóa:
┌────────────────────────────────────────┐
│ Xóa mẫu metric                        │
├────────────────────────────────────────┤
│ ⚠️ Mẫu "Không được null — Bắt buộc"  │
│ đang được sử dụng trong:              │
│                                        │
│ • Mẫu cột: Cột mã KH, Cột email (2)  │
│ • Mẫu bảng: (gián tiếp qua mẫu cột)  │
│                                        │
│ Xóa sẽ gỡ mẫu này khỏi các mẫu trên. │
│                                        │
│              [Hủy]  [Xóa]             │
└────────────────────────────────────────┘
```

---

## 7. Data Model Changes

### 7.1 RuleTemplate — Thêm fields

```typescript
// Thêm vào interface RuleTemplate hiện tại:
export interface RuleTemplate {
  // ... giữ nguyên id, name, dimension, description, metricConfig, category, usageCount
  // MỚI:
  threshold: { warning: number; critical: number }
  createdAt: string
  updatedAt: string
  createdBy: string
  isBuiltIn: boolean    // 22 cái hiện tại = true, user tạo = false
}
```

### 7.2 ColumnProfileTemplate — Đổi tên field (optional)

Giữ nguyên interface, chỉ đổi tên hiển thị trên UI. Code name `ColumnProfileTemplate` giữ nguyên để không break existing code.

### 7.3 TableProfileTemplate — Giữ nguyên

Không cần thay đổi data model.

### 7.4 mockData — Cập nhật

- `mockRuleTemplates`: thêm field `threshold`, `createdAt`, `updatedAt`, `createdBy`, `isBuiltIn: true` cho 22 template hiện tại
- `mockColumnProfiles`: giữ nguyên
- `mockTableProfiles`: giữ nguyên

---

## 8. Files cần sửa

| # | File | Thay đổi | Effort |
|---|------|----------|--------|
| 1 | `src/types/index.ts` | Thêm `threshold`, `createdAt`, `updatedAt`, `createdBy`, `isBuiltIn` vào `RuleTemplate` | Nhỏ |
| 2 | `src/data/mockData.ts` | Update 22 `mockRuleTemplates` thêm fields mới | Nhỏ |
| 3 | `src/components/common/SearchableMultiSelect.tsx` | **Tạo mới** — component tái sử dụng | Trung bình |
| 4 | `src/pages/Rules/index.tsx` — `MetricTemplatesSubTab` | **Viết lại**: card grid → table + CRUD + form dynamic | Lớn |
| 5 | `src/pages/Rules/index.tsx` — `ColumnProfilesSubTab` | Đổi tên + thay checkbox list → `SearchableMultiSelect` + bảng metric đã chọn | Trung bình |
| 6 | `src/pages/Rules/index.tsx` — `TableProfilesSubTab` | Đổi tên + thay 2 checkbox list → 2 `SearchableMultiSelect` + preview tổng hợp | Trung bình |
| 7 | `src/pages/Rules/index.tsx` — `TemplatesTab` wrapper | Đổi label sub-tab: "Mẫu Metric" / "Mẫu Cột" / "Mẫu Bảng" | Nhỏ |
| 8 | `src/pages/Rules/index.tsx` — Extract `MetricConfigFields` | Extract dynamic form fields ra component riêng (dùng chung giữa form tạo Rule và form tạo Mẫu Metric) | Trung bình |

### 8.1 Thứ tự implement

```
1. types/index.ts + mockData.ts          ← foundation
2. SearchableMultiSelect component       ← được dùng ở bước 4, 5
3. Extract MetricConfigFields            ← được dùng ở bước 4
4. MetricTemplatesSubTab (viết lại)      ← lớn nhất
5. ColumnProfilesSubTab (nâng cấp)       ← dùng SearchableMultiSelect
6. TableProfilesSubTab (nâng cấp)        ← dùng SearchableMultiSelect
7. TemplatesTab wrapper (đổi tên)        ← nhỏ, cuối cùng
```

---

## 9. Verification

### Mẫu Metric
- [ ] Hiển thị dạng bảng (Table) + phân trang, không phải card grid
- [ ] Filter: search text + dimension chip buttons
- [ ] Nút "+Thêm mẫu metric" → mở dialog form
- [ ] Form: chọn chiều DL → chọn loại metric → dynamic fields hiện ra đúng
- [ ] Form: có ngưỡng W/C
- [ ] Sửa: mở form với data đã fill
- [ ] Xóa: xác nhận + cảnh báo nếu đang được dùng trong Mẫu Cột/Bảng
- [ ] "Dùng mẫu": fill vào form tạo Rule (giống hiện tại)
- [ ] 22 mẫu built-in hiện tại vẫn hiển thị đúng

### Mẫu Cột
- [ ] Tên "Hồ sơ cột" → "Mẫu Cột" ở tất cả UI
- [ ] Chọn metric qua SearchableMultiSelect (search + checkbox + badge đếm)
- [ ] Hiện bảng metric đã chọn bên dưới (tên, chiều, W/C)
- [ ] W/C editable inline (override)
- [ ] CRUD vẫn hoạt động đúng

### Mẫu Bảng
- [ ] Tên "Hồ sơ bảng" → "Mẫu Bảng" ở tất cả UI
- [ ] Chọn Metric cấp bảng qua SearchableMultiSelect
- [ ] Chọn Mẫu Cột qua SearchableMultiSelect
- [ ] Header bảng: "Hồ sơ cột" → "Mẫu cột"
- [ ] Preview tổng hợp: "X metric bảng + Y mẫu cột (Z metric) → ~N rules/bảng"
- [ ] CRUD vẫn hoạt động đúng

### Chung
- [ ] Build thành công (`tsc && vite build`)
- [ ] Tiếng Việt có dấu, không lỗi encoding
- [ ] Sub-tab labels: "Mẫu Metric (N)" / "Mẫu Cột (N)" / "Mẫu Bảng (N)"
- [ ] SearchableMultiSelect responsive trên các kích thước dialog

---

## ⚠️ NEED INFO

| # | Câu hỏi | Ghi chú |
|---|---------|---------|
| 1 | 22 mẫu metric built-in có cho phép sửa/xóa không? | Đề xuất: cho sửa (tên, mô tả, ngưỡng), không cho xóa built-in. Hoặc cho phép clone → sửa bản copy |
| 2 | Mẫu Metric có cần field "Cột" không? | Đề xuất: KHÔNG — cột chỉ định khi áp dụng. Mẫu Metric chỉ lưu config kỹ thuật + ngưỡng |
| 3 | Override ngưỡng W/C trong Mẫu Cột: cho phép edit inline hay mở dialog? | Đề xuất: edit inline trong bảng metric đã chọn (click vào số → input) |
