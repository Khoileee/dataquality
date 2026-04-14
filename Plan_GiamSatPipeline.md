# Plan: Chuyển đổi "Quản lý Job" → "Giám sát Pipeline"

> **Ngày:** 13/04/2026
> **Scope:** Trang `/pipeline` — chuyển từ CRUD job thủ công sang giám sát pipeline + DQ overlay
> **Nguồn yêu cầu:** Cuộc họp 1 + 2 review DQ (08/04/2026) — Mục D3, B3 trong Plan dataquality.md
> **Mode:** @plan

---

## Mục lục

1. [Bài toán nghiệp vụ](#1-bài-toán-nghiệp-vụ)
2. [AS-IS — Hiện trạng](#2-as-is--hiện-trạng)
3. [TO-BE — Thiết kế mới](#3-to-be--thiết-kế-mới)
4. [Chi tiết chức năng](#4-chi-tiết-chức-năng)
5. [User cần khai báo gì?](#5-user-cần-khai-báo-gì)
6. [Chế độ xem Pipeline Graph](#6-chế-độ-xem-pipeline-graph)
7. [Chế độ xem Danh sách](#7-chế-độ-xem-danh-sách)
8. [DQ Overlay trên Node](#8-dq-overlay-trên-node)
9. [Interaction Flow](#9-interaction-flow)
10. [Data Model changes](#10-data-model-changes)
11. [Đồng bộ SQLWF](#11-đồng-bộ-sqlwf)
12. [Phân phase](#12-phân-phase)
13. [Files cần sửa](#13-files-cần-sửa)
14. [NEED INFO](#14-need-info)

---

## 1. Bài toán nghiệp vụ

### Mục đích

Stakeholder muốn:
- Nhìn được **toàn bộ chuỗi pipeline**: bảng nguồn L1 → job ETL → bảng xử lý L3 → job RPT → báo cáo L5
- Khi 1 bảng nguồn lỗi DQ → **thấy ngay** ảnh hưởng đến báo cáo/KPI nào downstream
- Click vào bất kỳ node (bảng) → xem **kết quả DQ chi tiết** (score, rules, issues)
- **Không xây lại SQLWF** — SQLWF đã có quản lý job đầy đủ (kéo thả, xem SQL, cấu hình pipeline)

### Actor

| Actor | Hành động |
|---|---|
| **Staff vận hành DQ** | Xem pipeline, phát hiện bảng lỗi, đánh giá impact, ấn vào xem chi tiết DQ |
| **Chị Tuyền (quản lý)** | Xem tổng quan: bao nhiêu pipeline OK / có vấn đề, bảng nào ảnh hưởng báo cáo nào |
| **Admin** | Cấu hình đồng bộ SQLWF, mapping job |

### Nguyên tắc phân ranh

| DQ Tool (trang này) | SQLWF |
|---|---|
| Xem pipeline **read-only** | Tạo/sửa/xóa job, kéo thả node |
| Overlay DQ score, status, issues lên node | Viết SQL, cấu hình transform |
| Phát hiện bảng lỗi + impact analysis | Chạy job, monitor ETL execution |
| Navigate → chi tiết DQ bảng | Quản lý metadata, cấu hình bảng |

---

## 2. AS-IS — Hiện trạng

### Trang `/pipeline` hiện tại

| Thành phần | Mô tả | Vấn đề |
|---|---|---|
| PageHeader | "Quản lý Job" + nút "Thêm job" | Chức năng CRUD job trùng với SQLWF |
| Filter | Tìm job, filter trạng thái | OK |
| Stats | 3 card: Tổng job / Đang hoạt động / Bảng được track | Thiếu thông tin DQ |
| Table | Danh sách job phẳng: Tên, Input, Output, Lịch, Trạng thái | **Chỉ bảng phẳng** — không thấy chuỗi pipeline, không thấy multi-layer |
| Actions | Sửa, Xóa job | Trùng SQLWF |
| Dialog | Form tạo/sửa job: tên, mô tả, owner, input/output | Trùng SQLWF |
| Pagination | Có | OK |

### Vấn đề cốt lõi

1. **Trùng lặp với SQLWF** — CRUD job trên DQ vô nghĩa khi SQLWF đã có
2. **Không thấy lineage multi-layer** — chỉ input/output 1 cấp, không thấy A → B → C
3. **Không có DQ information** — không biết bảng nào lỗi, ảnh hưởng downstream nào
4. **Không có pipeline visualization** — chỉ bảng text phẳng

### Data model hiện tại

```typescript
interface PipelineJob {
  id: string
  name: string
  description: string
  jobType: 'etl'
  technology: 'Spark' | 'Airflow' | 'Python' | 'SSIS' | 'Kafka' | 'Custom'
  owner: string; ownerEmail: string; team: string
  inputTableIds: string[]     // → DataSource IDs
  outputTableIds: string[]    // → DataSource IDs
  status: 'active' | 'inactive'
  schedule: string
  lastRunAt: string
  lastRunStatus: 'success' | 'failed' | 'partial'
}
```

Mock data: 8 jobs, mỗi job có input/output mapping rõ ràng → **đủ data để resolve multi-layer lineage**.

### Lineage data đã có (từ mockData)

```
ETL_KH_DAILY:     [] → [KH_KH]
ETL_GD_DAILY:     [LOG_GD] → [GD_GD]
ETL_TK_SYNC:      [] → [TK_TK]
ETL_HOPDONG:      [TK_TK, KH_KH] → [HOP_DONG]
RPT_BAO_CAO_NGAY: [GD_GD, KH_KH] → [BAO_CAO_NGAY]
ETL_KPI:          [GD_GD, HOP_DONG, BAO_CAO_NGAY] → [KPI_KD]
ETL_RISKDATA:     [GD_GD, KH_KH] → [QLRR]
ETL_LOG_ARCHIVE:  [LOG_GD] → [LOG_ARCHIVE]
```

Resolve lineage: `GD_GD lỗi` → ảnh hưởng `BAO_CAO_NGAY` (qua RPT) + `KPI_KD` (qua ETL_KPI) + `QLRR` (qua ETL_RISKDATA)

---

## 3. TO-BE — Thiết kế mới

### Đổi tên menu

| Cũ | Mới |
|---|---|
| "Quản lý Job" | **"Giám sát Pipeline"** |
| Icon: `GitBranch` | Icon: giữ `GitBranch` hoặc đổi `Workflow` |
| Mô tả: "Quản lý job ETL và luồng dữ liệu" | **"Theo dõi chất lượng dữ liệu trên luồng pipeline"** |

### Layout tổng quan

```
┌──────────────────────────────────────────────────────────────┐
│ PageHeader                                                    │
│ "Giám sát Pipeline"                                          │
│ "Theo dõi chất lượng dữ liệu trên luồng pipeline"           │
│                                     [🔄 Đồng bộ SQLWF]      │
├──────────────────────────────────────────────────────────────┤
│ Stats: 4 cards                                                │
│ [Tổng pipeline] [Có vấn đề] [Bảng lỗi DQ] [Score TB]       │
├──────────────────────────────────────────────────────────────┤
│ Filter + View Toggle                                          │
│ [Tìm kiếm...] [Trạng thái DQ ▾] [Team ▾] [📊 Graph | ☰ List]│
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Tab A: Pipeline Graph (mặc định)                              │
│   → Mỗi job = 1 pipeline card expandable                     │
│   → Hiển thị nodes input → job → output                      │
│   → Overlay DQ status trên mỗi node                          │
│                                                               │
│ Tab B: Danh sách                                              │
│   → Bảng phẳng giống hiện tại nhưng read-only + DQ columns   │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│ Pagination                                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Chi tiết chức năng

### 4.1. Stats Cards (4 thẻ)

| Card | Giá trị | Màu | Mô tả |
|---|---|---|---|
| Tổng pipeline | Số lượng job | Indigo | Tổng job đã đồng bộ từ SQLWF |
| Có vấn đề | Số pipeline có ≥1 bảng lỗi DQ | Red | Pipeline mà input hoặc output có score < C |
| Bảng lỗi DQ | Số bảng unique có score < C | Amber | Đếm distinct bảng trong tất cả pipeline |
| Score trung bình | Trung bình score tất cả bảng | Green/Red | Theo overallScore các DataSource |

### 4.2. Filter Bar

| Filter | Type | Options |
|---|---|---|
| Tìm kiếm | Text input | Search theo tên job, tên bảng input/output |
| Trạng thái DQ | Select | Tất cả / Có vấn đề (≥1 bảng lỗi) / Tất cả OK / Chưa quét |
| Team | Select | Dynamic từ job.team |

### 4.3. View Toggle

2 chế độ:
- **Pipeline Graph** — mặc định, hiển thị trực quan
- **Danh sách** — bảng phẳng, tiện filter/search

### 4.4. Chức năng bị XÓA (so với hiện tại)

| Chức năng | Lý do xóa |
|---|---|
| Nút "Thêm job" | Tạo job trên SQLWF, không trên DQ |
| Nút "Sửa" (Edit) trên mỗi job | Sửa job trên SQLWF |
| Nút "Xóa" trên mỗi job | Xóa job trên SQLWF |
| Dialog tạo/sửa job | Không cần — DQ chỉ read |

### 4.5. Chức năng MỚI

| Chức năng | Mô tả |
|---|---|
| Pipeline Graph view | Card cho mỗi job, input nodes → job → output nodes, có DQ overlay |
| DQ Status per node | Score, grade, số issues, trạng thái (OK/Warning/Fail/Chưa quét) |
| Impact highlight | Khi input lỗi → output bị highlight vàng/đỏ + message impact |
| Click node → DQ detail | Navigate `/data-catalog/:tableId` xem chi tiết DQ |
| Link sang SQLWF | Nút "Xem trên SQLWF ↗" cho mỗi job |
| Đồng bộ SQLWF | Nút manual sync + hiển thị thời gian sync gần nhất |

---

## 5. User cần khai báo gì?

### Trả lời: Hầu như KHÔNG cần khai báo thủ công

| Dữ liệu | Nguồn | User khai? |
|---|---|---|
| Danh sách job | Đồng bộ từ SQLWF | Không |
| Job name, description | SQLWF | Không |
| Input/output tables | SQLWF (node in/out) | Không |
| Owner, team, schedule | SQLWF | Không |
| DQ Score per bảng | Module Rules — kết quả chạy rule | Không |
| Issues per bảng | Module Vấn đề & Sự cố | Không |
| Ngưỡng W/C per bảng | Module Ngưỡng / Danh mục | Không (đã khai nơi khác) |

### Trường hợp user CẦN thao tác

| Thao tác | Khi nào | Chi tiết |
|---|---|---|
| Nhấn "Đồng bộ SQLWF" | Khi muốn cập nhật ngay (không chờ cron) | Nút trên PageHeader, kèm timestamp "Lần sync gần nhất: 13/04 08:00" |
| Click node bảng | Muốn xem DQ chi tiết | Navigate sang `/data-catalog/:id` |
| Click "Xem trên SQLWF ↗" | Muốn xem/sửa job gốc | Mở tab mới sang SQLWF |

### Fallback: Bảng chưa có trên SQLWF

Trường hợp đặc biệt: DQ có bảng nhưng SQLWF chưa có job (bảng nhập tay trên DQ trước khi sync).
- Hiển thị bảng đó trong Danh mục bình thường
- Trong Pipeline view: bảng này **không xuất hiện** (vì không thuộc job nào)
- Không ảnh hưởng — Pipeline view chỉ hiển thị bảng thuộc job đã sync

---

## 6. Chế độ xem Pipeline Graph

### Layout mỗi Pipeline Card

```
┌─ Pipeline: RPT_BAO_CAO_NGAY ─────────────────────────────────────┐
│                                                                    │
│  INPUT                    JOB                  OUTPUT              │
│  ┌───────────────┐                           ┌────────────────┐   │
│  │ 📦 KH_KH      │       ┌───────────┐      │ 📊 BAO_CAO_NGAY│   │
│  │ Score: 92 ✅   │──────→│ RPT_BAO_  │─────→│ Score: 63 ⚠️   │   │
│  │ 0 issues      │       │ CAO_NGAY  │      │ 2 issues       │   │
│  └───────────────┘       │           │      └────────────────┘   │
│  ┌───────────────┐       │ Spark     │                            │
│  │ 📦 GD_GD      │──────→│ 07:00     │                            │
│  │ Score: 45 ❌   │       │ Last: FAIL│                            │
│  │ 3 issues      │       └───────────┘                            │
│  └───────────────┘                                                │
│                                                                    │
│  ⚠️ Impact: GD_GD (score 45) ảnh hưởng BAO_CAO_NGAY              │
│  📅 Last run: 01/04 07:00 — FAILED          [Xem trên SQLWF ↗]  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Node (bảng) — Thiết kế

```
┌──────────────────┐
│ 📦 TÊN_BẢNG      │  ← Icon theo moduleType: 📦 source, 📊 report, 🎯 kpi
│ ─────────────     │
│ Score: 92/100     │  ← overallScore, màu theo grade
│ ✅ OK             │  ← Grade badge: ✅ Đạt / ⚠️ Cảnh báo / ❌ Không đạt / ⚪ Chưa quét
│ 0 issues          │  ← Số issue active
└──────────────────┘
```

Viền node:
- Xanh (`border-green-300`): Score ≥ W
- Vàng (`border-amber-300`): C ≤ Score < W
- Đỏ (`border-red-300`): Score < C
- Xám (`border-gray-200`): Chưa quét / chưa có rule

### Job node (giữa)

```
┌───────────────┐
│ TÊN_JOB       │
│ ──────        │
│ Spark         │  ← technology
│ 07:00 daily   │  ← schedule
│ Last: ✅ OK   │  ← lastRunStatus
└───────────────┘
```

### Impact message

Khi ≥1 input node có DQ score < Critical threshold:

```
⚠️ Impact: GD_GD (score 45) ảnh hưởng BAO_CAO_NGAY
```

Khi job lastRunStatus = 'failed':

```
❌ Job RPT_BAO_CAO_NGAY chạy lỗi lúc 01/04 07:00
```

### Expand/Collapse

- Mặc định: **collapsed** — chỉ hiện 1 dòng tóm tắt per pipeline
- Click → **expand** hiện full graph

**Collapsed state:**

```
┌─ RPT_BAO_CAO_NGAY ──────────────────────────────────────────────┐
│ 2 input → 1 output │ ⚠️ 1 bảng lỗi │ Score TB: 68 │ Last: FAIL │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Chế độ xem Danh sách

Bảng phẳng read-only, bỏ cột Hành động (Sửa/Xóa), thay bằng DQ info:

| Cột | Header | Width | Nội dung |
|---|---|---|---|
| STT | STT | w-12, freeze left | Số thứ tự |
| Tên Job | Tên Job | min-w-[200px] | job.name + description truncate |
| Input | Bảng đầu vào | auto | Chips tên bảng (max 2 + "+N" tooltip) |
| Output | Bảng đầu ra | auto | Chips tên bảng |
| DQ Input | Trạng thái input | w-[120px] | "2/3 OK" hoặc "1 lỗi" — badge xanh/đỏ |
| DQ Output | Trạng thái output | w-[120px] | Score output + grade badge |
| Job Status | Kết quả chạy | w-[100px] | lastRunStatus icon + label |
| Schedule | Lịch chạy | w-[120px] | schedule text |
| Hành động | Hành động | w-20, freeze right | Nút xem chi tiết (Eye icon) — expand inline hoặc navigate |

### Cột DQ Input — chi tiết

Hiển thị tóm tắt trạng thái DQ của các bảng input:

```
Trường hợp 1: Tất cả OK
  [✅ 3/3 OK]  (badge xanh)

Trường hợp 2: Có bảng lỗi
  [❌ 1/3 lỗi]  (badge đỏ)

Trường hợp 3: Có cảnh báo
  [⚠️ 1/3 cảnh báo]  (badge vàng)

Trường hợp 4: Chưa quét
  [⚪ Chưa quét]  (badge xám)
```

Hover tooltip: liệt kê tên từng bảng + score.

---

## 8. DQ Overlay trên Node

### Data DQ cần cho mỗi bảng (node)

| Field | Nguồn | Đã có? |
|---|---|---|
| `overallScore` | `DataSource.overallScore` | ✅ |
| `dimensionScores` | `DataSource.dimensionScores` | ✅ |
| `status` | `DataSource.status` | ✅ |
| Active issues count | `mockIssues.filter(i => i.tableId === id && i.status !== 'resolved')` | ✅ |
| Threshold W/C | `DataSource.thresholdOverrides` hoặc global threshold | ✅ |
| Last profiled | `DataSource.lastProfiled` | ✅ |
| Rules count | `mockRules.filter(r => r.tableId === id).length` | ✅ |

### Grade logic

```typescript
function getNodeGrade(tableId: string): 'pass' | 'warning' | 'fail' | 'no_data' {
  const ds = dataSources.find(d => d.id === tableId)
  if (!ds || !ds.lastProfiled) return 'no_data'
  
  const score = ds.overallScore
  // Dùng ngưỡng trung bình 6 chiều hoặc ngưỡng từ Thresholds module
  const w = getAverageThreshold(tableId, 'warning')  // ~87
  const c = getAverageThreshold(tableId, 'critical')  // ~75
  
  if (score >= w) return 'pass'
  if (score >= c) return 'warning'
  return 'fail'
}
```

### Click node behavior

| Click target | Hành động |
|---|---|
| Node bảng (input/output) | Navigate → `/data-catalog/:tableId` (Chi tiết DQ bảng) |
| Node job | Mở panel tóm tắt job (inline) hoặc link sang SQLWF |
| "Xem trên SQLWF ↗" | `window.open(SQLWF_URL + '/job/' + job.id, '_blank')` |

---

## 9. Interaction Flow

### Flow 1: User mở trang Giám sát Pipeline

```
User click menu "Giám sát Pipeline"
→ Load danh sách job + DQ data các bảng liên quan
→ Hiển thị 4 stat cards: tổng, có vấn đề, bảng lỗi, score TB
→ Mặc định: Pipeline Graph view, tất cả pipeline collapsed
→ Pipeline có vấn đề tự động hiện ở đầu (sort by issues DESC)
```

### Flow 2: User mở pipeline card

```
User click vào 1 pipeline card (collapsed)
→ Expand: hiện graph input → job → output
→ Mỗi node hiện DQ overlay (score, grade, issues)
→ Nếu có bảng lỗi → impact message hiện ở dưới
```

### Flow 3: User click vào node bảng

```
User click node "GD_GIAODICH"
→ Navigate → /data-catalog/ds-002
→ Xem chi tiết: DQ score, 6 chiều, rules, issues, profiling history
```

### Flow 4: User đồng bộ SQLWF

```
User click "🔄 Đồng bộ SQLWF"
→ Button hiện spinner, disable
→ Gọi API sync (hoặc mock: reload data)
→ Toast: "Đồng bộ thành công — 8 jobs, 2 jobs mới"
→ Cập nhật danh sách + timestamp "Lần sync: 13/04 14:30"
```

### Flow 5: User filter pipeline có vấn đề

```
User chọn filter "Trạng thái DQ" = "Có vấn đề"
→ Chỉ hiện pipeline mà ≥1 input/output có score < C
→ Cards hiện sorted by lỗi nặng nhất trước
```

---

## 10. Data Model changes

### 10.1. PipelineJob — bổ sung field sync

```typescript
interface PipelineJob {
  // ... existing fields giữ nguyên
  
  // MỚI — metadata đồng bộ
  syncSource: 'sqlwf' | 'manual'      // Nguồn: từ SQLWF hay nhập tay
  sqlwfJobId?: string                   // ID gốc trên SQLWF (để link sang)
  lastSyncAt?: string                   // Lần đồng bộ gần nhất
}
```

### 10.2. PipelineSync — config đồng bộ (mới)

```typescript
interface PipelineSyncConfig {
  sqlwfBaseUrl: string                  // URL SQLWF để tạo deep link
  syncMode: 'manual' | 'cron'          // Cách sync
  cronInterval?: number                 // Phút (nếu cron)
  lastSyncAt?: string                   // Lần sync gần nhất
  lastSyncResult?: 'success' | 'failed'
  totalJobsSynced?: number
  newJobsFound?: number
}
```

### 10.3. Không thay đổi DataSource

`DataSource` đã có đủ: `overallScore`, `dimensionScores`, `status`, `moduleType`. Không cần thêm field.

---

## 11. Đồng bộ SQLWF

### Mapping SQLWF → DQ

| SQLWF field | DQ PipelineJob field | Ghi chú |
|---|---|---|
| job.id | sqlwfJobId | ID gốc |
| job.name | name | |
| job.description | description | |
| job.nodes[type='input'] | inputTableIds | Map sang DataSource.id bằng tên bảng |
| job.nodes[type='output'] | outputTableIds | Map sang DataSource.id bằng tên bảng |
| job.owner | owner | |
| job.owner_email | ownerEmail | |
| job.team | team | |
| job.schedule | schedule | |
| job.technology | technology | |
| job.status | status | |

### Quy tắc sync

| Trường hợp | Hành vi |
|---|---|
| Job mới trên SQLWF | Tạo bản ghi mới trên DQ, `syncSource = 'sqlwf'` |
| Job thay đổi trên SQLWF | Cập nhật bản ghi DQ (name, input/output, owner...) |
| Job bị xóa trên SQLWF | Đánh dấu inactive trên DQ (soft delete), không xóa cứng |
| Bảng trong SQLWF chưa có trên DQ | Tự tạo DataSource stub? → **⚠️ NEED INFO** |
| Job nhập tay trên DQ (legacy) | Giữ nguyên, `syncSource = 'manual'`, hiển thị label "Nhập tay" |

### Tần suất sync

| Mode | Khi nào | Chi tiết |
|---|---|---|
| **Manual** (Phase 1) | User nhấn nút "Đồng bộ SQLWF" | Đơn giản, kiểm soát được |
| **Cron** (Phase 2) | Tự động mỗi X phút | Cần API SQLWF ổn định |
| **Webhook** (Phase 3) | SQLWF push event khi job thay đổi | Real-time, cần SQLWF hỗ trợ |

---

## 12. Phân phase

### Phase 1 — Read-only Pipeline + DQ Overlay (Sprint hiện tại)

**Scope:** Chuyển đổi UI, dùng mock data hiện tại

| Việc | Chi tiết |
|---|---|
| Đổi tên menu "Quản lý Job" → "Giám sát Pipeline" | Sidebar label + icon |
| Đổi PageHeader | Title, description, bỏ nút "Thêm job" |
| Bỏ chức năng CRUD | Xóa Sửa/Xóa buttons, xóa Add/Edit dialog, xóa Delete confirm |
| Thêm stats cards mới | 4 cards: Tổng / Có vấn đề / Bảng lỗi / Score TB |
| Pipeline Graph view | Mỗi job = 1 card expandable, input → job → output nodes |
| DQ overlay per node | Score, grade badge, issues count |
| Impact message | Khi input lỗi → hiển thị ảnh hưởng output |
| Click node → navigate DQ detail | → `/data-catalog/:id` |
| Danh sách view | Giữ bảng hiện tại, bỏ cột Hành động (Sửa/Xóa), thêm cột DQ status |
| View toggle | Nút chuyển Graph ↔ List |

**Không làm Phase 1:**
- Sync API SQLWF thật
- Kéo thả
- Multi-layer lineage resolution (dùng single-layer từ job input/output)

### Phase 2 — Sync SQLWF + Multi-layer (sau B3)

| Việc | Chi tiết |
|---|---|
| API sync từ SQLWF | Gọi REST API lấy danh sách job + metadata |
| Nút "Đồng bộ SQLWF" | Manual trigger sync + timestamp |
| Multi-layer lineage | Resolve chain: nếu output job A = input job B → nối thành chuỗi |
| Impact analysis tự động | Khi bảng A lỗi → traverse graph tìm tất cả downstream |
| Deep link sang SQLWF | "Xem trên SQLWF ↗" mở đúng job trên SQLWF |

### Phase 3 — Enhancement

| Việc | Chi tiết |
|---|---|
| Cron/Webhook sync | Tự động sync định kỳ |
| Full lineage graph (DAG) | Hiển thị toàn bộ graph system-wide, không theo từng job |
| Pipeline health over time | Trend chart: pipeline nào hay lỗi |
| Alert từ Pipeline view | Gửi cảnh báo khi phát hiện impact chain mới |

---

## 13. Files cần sửa

### Phase 1

| File | Thay đổi |
|---|---|
| `src/components/layout/Sidebar.tsx` | Đổi label "Quản lý Job" → "Giám sát Pipeline" |
| `src/pages/Pipeline/index.tsx` | Rewrite: bỏ CRUD, thêm Pipeline Graph view + DQ overlay + stats |
| `src/types/index.ts` | Thêm `syncSource`, `sqlwfJobId` vào `PipelineJob` |
| `src/data/mockData.ts` | Bổ sung field mới cho mock jobs |

### Phase 2

| File | Thay đổi |
|---|---|
| `src/pages/Pipeline/index.tsx` | Thêm sync button, multi-layer resolution |
| `src/types/index.ts` | Thêm `PipelineSyncConfig` |
| `src/data/mockData.ts` | Hoặc `src/api/pipeline.ts` — API call SQLWF |

---

## 14. NEED INFO

| # | Câu hỏi | Ảnh hưởng |
|---|---|---|
| 1 | SQLWF có REST API để lấy danh sách job + input/output tables không? | Quyết định cách sync Phase 2 |
| 2 | SQLWF job ID format là gì? (để tạo deep link) | Link "Xem trên SQLWF ↗" |
| 3 | SQLWF base URL production/staging? | Config deep link |
| 4 | Khi SQLWF có bảng nhưng DQ chưa khai báo DataSource → tự tạo stub hay skip? | Logic sync |
| 5 | Số lượng job thực tế trên SQLWF? (10? 100? 1000?) | Pagination + performance |
| 6 | Có cần hiển thị multi-layer lineage ở Phase 1 hay single-layer (per job) là đủ? | Scope Phase 1 |
| 7 | Pipeline Graph dùng library nào? (ReactFlow? D3? Pure CSS?) hay simple card layout là đủ Phase 1? | Tech choice |

---

## Verification

- [ ] Mục đích trang rõ ràng: giám sát DQ trên pipeline, không phải quản lý job
- [ ] Không trùng lặp chức năng với SQLWF
- [ ] User không cần khai báo thêm — data từ SQLWF sync + DQ modules
- [ ] 2 chế độ xem: Pipeline Graph (trực quan) + Danh sách (filter/search)
- [ ] Click node → xem DQ chi tiết
- [ ] Impact analysis khi bảng lỗi
- [ ] Phân phase hợp lý: Phase 1 read-only mock → Phase 2 sync SQLWF → Phase 3 full DAG
- [ ] Data model thay đổi tối thiểu (chỉ thêm syncSource, sqlwfJobId)
