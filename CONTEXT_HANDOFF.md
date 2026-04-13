# DATA QUALITY SYSTEM — Context Handoff (Đóng gói dự án)

> **Ngày đóng gói:** 13/04/2026
> **Mục đích:** Chuyển toàn bộ context sang hội thoại mới (Team plan)
> **Dự án:** Data Quality Tool — Hệ thống giám sát chất lượng dữ liệu
> **Workspace:** `c:\khoiln1_workspace\`

---

## PHẦN 1: TỔNG QUAN DỰ ÁN

### 1.1 Bối cảnh

- **Công ty:** Fintech (thanh toán số, ví điện tử, giao dịch, AML, dịch vụ tài chính số)
- **Data Pipeline:** `[Product System] → [Pentaho ETL] → [HDFS L1/L2/L3/L4/L5/L6] → [SparkSQL] → [DB/Data Mart] → [BI/Dashboard]`
- **Scheduling:** Rundeck | **Cluster:** Ambari
- **Số bảng HDFS:** ~11,000 (trong đó ~3,000 bảng thực cần DQ, tối đa 8,000)
- **Stakeholder chính:** Chị Tuyền (staff tổng hợp, nhận cảnh báo), team BA/Dev, Khôi (demo dev)

### 1.2 Mục đích tool

1. Hỗ trợ quản trị và tiêu thụ dữ liệu
2. Đảm bảo chất lượng dữ liệu — phát hiện xa lệch, thiếu, bất thường
3. Nâng cao độ tin cậy báo cáo
4. Cảnh báo kịp thời — tự động giám sát

### 1.3 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **UI Components:** Shadcn/ui (radix-ui based)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Router:** React Router DOM v6 (HashRouter)
- **Data:** Mock data (chưa có backend API)
- **Build:** `tsc && vite build`

---

## PHẦN 2: CẤU TRÚC DỰ ÁN

### 2.1 Source code: `c:\khoiln1_workspace\data-quality-system\`

```
data-quality-system/
├── src/
│   ├── App.tsx                          # Routes: /, /data-catalog, /rules, /schedules, /thresholds, /issues, /reports, /notifications, /pipeline, /settings/*
│   ├── main.tsx
│   ├── types/index.ts                   # Data model: QualityDimension, MetricType (28 loại), DataSource, QualityRule, RuleTemplate, ColumnProfileTemplate, TableProfileTemplate, Schedule, Issue, CascadeEvent, CascadeChain...
│   ├── data/mockData.ts                 # Mock: 15+ DataSources, Rules, Templates, Schedules, Issues, Pipeline jobs, Cascade events, ColumnProfileTemplates, TableProfileTemplates
│   ├── pages/
│   │   ├── Dashboard/                   # Trang chủ — dashboard tổng quan (đang build)
│   │   ├── DataCatalog/                 # Danh mục dữ liệu + DataSourceDetail
│   │   ├── Rules/index.tsx              # Quản lý quy tắc (có tab Mẫu quy tắc)
│   │   ├── Schedules/index.tsx          # Lịch chạy
│   │   ├── Thresholds/index.tsx         # Ngưỡng cảnh báo
│   │   ├── Issues/                      # Vấn đề & Sự cố + IssueDetail
│   │   ├── Reports/index.tsx            # Báo cáo
│   │   ├── Pipeline/index.tsx           # Quản lý Job (lineage)
│   │   ├── Profiling/                   # Phân tích dữ liệu + ProfilingDetail
│   │   ├── Notifications/index.tsx      # Thông báo
│   │   └── Settings/                    # DefaultRules, DefaultSchedules, UserManagement
│   ├── components/
│   │   ├── layout/MainLayout            # Sidebar + main content
│   │   └── ui/                          # Shadcn components: button, card, dialog, table, tabs, select, badge, progress, switch, textarea, label, input, checkbox
│   └── lib/utils.ts                     # cn() helper
├── Plan dataquality.md                  # Plan tổng hợp 20 yêu cầu chỉnh sửa (A1-G2, dependency graph, phụ lục import template)
├── HDSD.md                              # Hướng dẫn sử dụng v1.3 (rất chi tiết, 28 metric, ví dụ end-to-end)
├── package.json                         # React 18, Vite 5, Tailwind 3
└── vercel.json
```

### 2.2 Tài liệu liên quan: `c:\khoiln1_workspace\speech_to_text\`

| File | Nội dung |
|------|----------|
| `MN_20260408_DataQuality_Review.md` | Tổng hợp yêu cầu từ 2 cuộc họp (11 sections, đầy đủ nhất) |
| `DQ_Meeting2_Requirements_20260408.md` | Yêu cầu riêng từ Họp 2 (demo chi tiết với Khôi) |

### 2.3 Plan file (đang active):

| File | Nội dung |
|------|----------|
| `data-quality-system/Plan dataquality.md` | 20 yêu cầu chỉnh sửa, phân nhóm A-G, dependency graph, phân phase, phụ lục import template |
| `.claude/plans/resilient-herding-aho.md` | Phân tích giải pháp chi tiết: Template 3 cấp, Khung giờ quét, Tối ưu hạ tầng, Pipeline cảnh báo, Phân quyền, Roadmap |

---

## PHẦN 3: DATA MODEL (types/index.ts)

### 3.1 Core Types

```typescript
type QualityDimension = 'completeness' | 'validity' | 'consistency' | 'uniqueness' | 'accuracy' | 'timeliness'

type MetricType = 
  // 28 metric types, chia nhóm:
  // Completeness (Column): not_null, fill_rate, null_rate_by_period, conditional_not_null
  // Validity (Column): format_regex, blacklist_pattern, value_range, allowed_values
  // Consistency (Column): fixed_datatype, mode_check, referential_integrity
  // Uniqueness (Column): duplicate_single
  // Accuracy (Column): reference_match, statistics_bound, sum_range, expression_pct
  // Timeliness (Column): on_time, freshness
  // Table-level: row_count, time_coverage, volume_change, table_size, custom_expression, duplicate_composite
  // Report-specific: aggregate_reconciliation, report_row_count_match
  // KPI-specific: kpi_variance, parent_child_match

type DataSourceStatus = 'active' | 'inactive' | 'error' | 'waiting_data' | 'revalidating'
type ModuleType = 'source' | 'report' | 'kpi'
type IssueStatus = 'new' | 'assigned' | 'in_progress' | 'pending_review' | 'resolved' | 'closed'
```

### 3.2 Key Interfaces

- **DataSource:** id, name, type, schema, tableName, status, owner, team, category, rowCount, overallScore, dimensionScores (6 chiều), moduleType, sourceTableIds (cho report), thresholdOverrides, syncSource, partitionBy, mode, area
- **QualityRule:** id, name, dimension, tableId, tableName, columnName, metricConfig (MetricConfig), threshold (W/C), status, lastResult, lastScore
- **RuleTemplate:** id, name, dimension, description, metricConfig, category, usageCount
- **ColumnProfileTemplate:** id, name, description, columnKeywords[], metricTemplateIds[], thresholdOverrides, usageCount
- **TableProfileTemplate:** id, name, description, tableType, mode, partition, tableMetricTemplateIds[], columnProfileIds[], defaultThresholds, usageCount
- **MetricConfig:** Union tất cả field cho 28 metric types (column, pattern, minValue, maxValue, allowedValues, refTable, refColumn, slaTime, expression, ...)
- **Schedule:** id, name, tableId, frequency, cronExpression, runTime, status, nextRun, rulesCount, owner
- **Issue:** id, title, severity, status, tableId, dimension, ruleId, assignedTo, timeline (IssueEvent[])
- **CascadeEvent / CascadeChain:** Cascade alerting khi bảng nguồn fail → ảnh hưởng downstream

---

## PHẦN 4: 6 CHIỀU CHẤT LƯỢNG DỮ LIỆU

| # | Chiều | Mô tả | Ví dụ |
|---|-------|-------|-------|
| 1 | **Completeness** (Đầy đủ) | Dữ liệu có bị thiếu? Trường bắt buộc phải có giá trị | 1.000 dòng KH nhưng 500 dòng thiếu email |
| 2 | **Validity** (Hợp lệ) | Đúng định dạng, miền giá trị? | Email phải có @ và domain |
| 3 | **Consistency** (Nhất quán) | Dữ liệu giữa các bảng có mâu thuẫn? | Cùng một trường ở nhiều bảng phải thống nhất |
| 4 | **Uniqueness** (Duy nhất) | Có bản ghi nào trùng lặp? | Khóa chính chỉ xuất hiện 1 lần |
| 5 | **Accuracy** (Chính xác) | Phản ánh đúng thực tế? | Dữ liệu đúng với nguồn chuẩn |
| 6 | **Timeliness** (Kịp thời) | Dữ liệu có đúng thời gian? | BC cần trước 8h nhưng input trễ 10h |

- 28 loại metric, chia cấp cột (18) + cấp bảng (10)
- Chi tiết 28 metric: xem `HDSD.md` mục 6

### Cách tính DQ Score (đã chốt)

- **Metric score** = % pass (0-100)
- **Dimension score** = Trung bình metric scores trong chiều đó
- **Table score** = Trung bình dimension scores (chỉ tính chiều có cài rule)
- **System score** = Trung bình table scores

---

## PHẦN 5: TRẠNG THÁI HIỆN TẠI — ĐÃ IMPLEMENT

### 5.1 Modules đã có UI + mock data

| Module | Route | Trạng thái |
|--------|-------|------------|
| Dashboard | `/` | Có UI cơ bản, đang build |
| Danh mục dữ liệu | `/data-catalog` | Có demo, có DataSourceDetail |
| Phân tích dữ liệu (Profiling) | `/profiling` | Có demo |
| Quản lý Job (Pipeline) | `/pipeline` | Có UI + lineage |
| Ngưỡng cảnh báo | `/thresholds` | Có demo |
| Quản lý quy tắc | `/rules` | Có demo, có tab Mẫu quy tắc (22 templates) |
| Lịch chạy | `/schedules` | Có demo |
| Vấn đề & Sự cố | `/issues` | Có demo (chưa chi tiết) |
| Báo cáo | `/reports` | Có UI |
| Thông báo | `/notifications` | Có UI |
| Cài đặt | `/settings/*` | DefaultRules, DefaultSchedules, UserManagement |

### 5.2 Tính năng đã có trong types nhưng chưa đầy đủ UI

- ColumnProfileTemplate, TableProfileTemplate: types đã define, cần nâng cấp UI tab "Mẫu quy tắc"
- CascadeEvent, CascadeChain: types đã define, Pipeline page có phần cascade
- Import CSV: đã có logic cơ bản

---

## PHẦN 6: YÊU CẦU CHỈNH SỬA — 20 MỤC (từ Plan dataquality.md)

### Nhóm A: Tái cấu trúc Module

| # | Yêu cầu | Trạng thái |
|---|---------|-----------|
| A1 | **Gộp Danh mục + Ngưỡng** thành 1 module. Ngưỡng mặc định → Settings | Chưa implement |
| A2 | **Quy tắc giữ riêng**, thêm liên kết từ Danh mục | Chưa implement |
| ~~A3~~ | ~~Sửa tên loại kiểm tra~~ | **LOẠI BỎ** (stakeholder xác nhận giữ nguyên) |

### Nhóm B: Import & Bulk Operations

| # | Yêu cầu | Trạng thái |
|---|---------|-----------|
| B1 | **Multi-select dropdown L1-L6** (11k bảng → lazy load, 2-step filter) | Chưa implement |
| B2 | **Import file Excel** (bảng + ngưỡng + rules). Flat format, 1 sheet | Chưa implement |
| B3 | **Đồng bộ metadata từ SQLWF** (tên, area, mode, partition, owner, job lineage) | Chưa implement. **BLOCKER cho adoption** |

### Nhóm C: Logic & Tính toán

| # | Yêu cầu | Trạng thái |
|---|---------|-----------|
| C1 | **Override vs Append** — WHERE partition mới, fix score > 100% | Chưa implement |
| C2 | **Cách tính DQ Score** — đã chốt: trung bình đều | Cần implement |
| C3 | **Auto-schedule** theo partition_by | Chưa implement |

### Nhóm D: Phân loại Bảng / Báo cáo / Chỉ tiêu

| # | Yêu cầu | Trạng thái |
|---|---------|-----------|
| D1 | **Báo cáo: bảng nguồn liên kết** thay vì bảng output | Chưa implement |
| D2 | **Chỉ tiêu KPI: quick-add rule** khi tạo | Chưa implement |
| D3 | **Input/Output + cascade alerting** (import từ SQLWF, giới hạn 3 cấp) | Types đã có, UI chưa đầy đủ |

### Nhóm E: Dashboard & Báo cáo

| # | Yêu cầu | Trạng thái |
|---|---------|-----------|
| E1 | **Dashboard tổng quan** — score cards, radar, trend, tooltip (i), drill-down | Đang build |
| E2 | **Top lỗi thường xuyên** — 3 góc nhìn: top rules, top tables, top dimensions | Chưa implement |
| E3 | **Drill-down chi tiết bảng** — 2-3 tầng | Chưa implement |

### Nhóm F: Vòng đời sự cố

| # | Yêu cầu | Trạng thái |
|---|---------|-----------|
| F1 | **4 trạng thái**: Mới → Đang xử lý → Đã xử lý → Đóng. Assign, comment, lịch sử | Chưa implement |

### Nhóm G: Tích hợp & Metadata

| # | Yêu cầu | Trạng thái |
|---|---------|-----------|
| G1 | **Owner = từ Workflow**, fallback nhập tay | Chưa implement |
| G2 | **Partition metadata** (partition_by, partition_column) import từ SQLWF | Chưa implement |

### Dependency Graph

```
B3 (Sync SQLWF) ──→ G2 (Partition) ──→ C1 (Override/Append)
                │                  └──→ C3 (Auto-schedule)
                └──→ D3 (Input/Output + Job alerting) ──→ D1 (BC liên kết)

A1 (Gộp module) ──→ B2 (Import file bảng + ngưỡng + rules)
                └──→ D2 (KPI quick-add)

C2 (Score calc) ──→ E1 (Dashboard + tooltip) ──→ E2 (Top lỗi)
                                              └──→ E3 (Drill-down)
```

### Phân Phase

| Phase | Sprint | Yêu cầu |
|-------|--------|---------|
| **Phase 1: Foundation** | 1-2 | A1, B3, G2, C1, C2, F1 |
| **Phase 2: Core Features** | 3-4 | B1, B2, C3, D3, D1, E1, E3 |
| **Phase 3: Enhancement** | 5+ | A2, D2, E2, G1, configurable dashboard, Tạm hoãn/Mở lại sự cố |

---

## PHẦN 7: GIẢI PHÁP ĐÃ PHÂN TÍCH CHI TIẾT (từ resilient-herding-aho.md)

### 7.1 Template & Preset — Khai báo metrics nhanh

**3 cấp Template:**

| Cấp | Tên | Mô tả |
|-----|-----|-------|
| Cấp 1: Metric Template | Template cho 1 metric (đã có, 22 templates) | "Not null — W:95 C:85" |
| Cấp 2: Column Profile | Bộ metrics cho 1 loại cột (MỚI, types đã define) | "Cột mã KH" = not_null + format_regex + referential_integrity |
| Cấp 3: Table Profile | Bộ metrics cho 1 loại bảng (MỚI, types đã define) | "Bảng GD daily" = row_count + freshness + [Column Profiles] |

**UI thiết kế:**
- Giữ "Mẫu quy tắc" là tab trong `/rules`
- Sub-tab: Metric Templates | Column Profiles | Table Profiles
- Column Profile: name, description, columnKeywords (tag input, contains match), metrics (multi-select), threshold overrides
- Table Profile: name, description, tableType, mode, partition, table metrics, column profiles, default thresholds

**Luồng sử dụng:**
1. Khai báo bảng đơn: chọn Table Profile → preview rules → auto-generate
2. Bulk apply: filter/search bảng → chọn nhiều → "Áp dụng mẫu" → chọn profile → sinh rules hàng loạt
3. "Dùng mẫu" từ template list

**Tên hiển thị tiếng Việt cho 19 metric types:** (xem file gốc, mục 1.5)

### 7.2 Quét bảng vs Đồng bộ — Giải quyết xung đột

- Mỗi bảng khai thêm: `expectedDataTime`, `syncSchedule`, `scanGroup`
- **4 khung giờ quét cố định/ngày:** 07:00, 10:00, 14:00, 18:00
- **Logic:** bảng khai expectedDataTime=08:00 → tự xếp vào khung 10:00 (buffer 2h)
- **SKIP logic:** Chưa đến expectedDataTime → waiting_data (không phải lỗi)
- **Tương lai:** Rundeck webhook → trigger quét ngay sau đồng bộ

### 7.3 Tối ưu hạ tầng — Quét 8,000 bảng

- **Batch SQL:** Gom rules cùng bảng = 1 query → giảm 5-10x thời gian
- **3 Tier quét:** Critical (3-4 lần/ngày), Important (1 lần/ngày), Standard (1 lần/tuần)
- **Incremental scan:** Append mode → WHERE partition_date = CURRENT_DATE
- **Parallel:** Spark cluster submit N jobs song song

### 7.4 Pipeline cảnh báo

- **Gom cảnh báo:** Mỗi khung giờ → gửi 1 lần tổng hợp (không spam)
- **Format Telegram:** Summary (pass/warn/fail/waiting) → chi tiết fail → chi tiết warning
- **Phân phối:** Owner bảng (chi tiết), Job owner (job bị ảnh hưởng), Staff tổng hợp (chị Tuyền, list tổng)
- **Cascade:** Bảng nguồn fail → tra lineage → raise warning downstream (giới hạn 3 cấp, tag "[CASCADE]")
- **Ignore vô nghĩa:** Chưa đến expectedDataTime → SKIP, bảng static không đổi → cache

### 7.5 Phân quyền

| Role | Quyền |
|------|-------|
| Admin DQ | Full CRUD templates + rules |
| Data Owner | Tạo rule cho bảng mình + dùng template |
| Viewer | Xem dashboard + issues |
| Staff tổng hợp | Xem tất cả + assign issue |

Phase 1: chưa cần approval flow. Admin tạo template → Data Owner chọn + áp dụng.

---

## PHẦN 8: YÊU CẦU TỪ CUỘC HỌP (chưa implement)

### 8.1 Yêu cầu sửa đổi post-meeting (từ MN_20260408)

| # | Module | Yêu cầu sửa |
|---|--------|-------------|
| 1 | Danh mục + Quy tắc + Ngưỡng | Xem lại gộp |
| 2 | Thêm Bảng nguồn (L1-L6) | Dropdown multi-select, import file |
| 3 | Báo cáo | Bảng nguồn liên kết thay bảng output |
| 4 | Chỉ tiêu | KPI khai báo rule luôn? (cần làm rõ) |
| 5 | Quy tắc | Sửa loại kiểm tra → generic hơn |
| 6 | Cách tính điểm rule | Xem lại logic |

### 8.2 Import Template đề xuất (từ Plan dataquality.md, phụ lục)

- **Sheet 1:** Danh mục bảng + Ngưỡng (tên, tag, mode, partition, 12 cột W/C cho 6 chiều)
- **Sheet 2:** Rules — Flat format (tên bảng, metric_type, dimension, cột, ~20 cột union tất cả field)
- **Validate:** Backend check field bắt buộc theo metric_type
- **Đề xuất BA:** Dùng Flat format (1 sheet) vì đơn giản nhất

---

## PHẦN 9: NEED INFO (còn thiếu)

| # | Câu hỏi | Cần từ ai |
|---|---------|-----------|
| 1 | Danh sách cụ thể bảng cần giám sát (số lượng?) | Chị Tuyền |
| 2 | Danh sách khung giờ đồng bộ hiện tại trên Rundeck | Team DE/Infra |
| 3 | Rundeck có hỗ trợ webhook callback? | Team Infra |
| 4 | Số Spark executors khả dụng cho DQ? | Team Infra |
| 5 | Danh sách bảng tier 1 (critical) | Chị Tuyền + BA |
| 6 | Format Telegram notification mong muốn? Group riêng? | Chị Tuyền |
| 7 | Danh sách owner bảng hiện tại | Team DE |
| 8 | Override vs Append: logic tính cụ thể khi > 100%? | Dev |
| 9 | Thông tin chỉ tiêu KPI → khai báo rule luôn hay cách khác? | Chị Tuyền |
| 10 | Luồng báo cáo và chỉ tiêu khác gì so với bảng? | BA |

---

## PHẦN 10: TOOL LIÊN QUAN — SQLWF

- **Vị trí:** `c:\khoiln1_workspace\sqlwf\` (React app)
- **Vai trò:** SQL Workflow tool — quản lý bảng HDFS, job management (nodes, input/output), metadata (area, mode, partition, owner)
- **Liên kết với DQ:** DQ tool sẽ đồng bộ metadata bảng + job lineage từ SQLWF (yêu cầu B3)
- **DQ trên SQLWF (cũ):** `sqlwf/src/pages/DataQuality*.tsx` — phiên bản DQ v1 và v2 tích hợp trong SQLWF (routes: `/data-quality/*`, `/data-quality-v2/*`). Hệ thống DQ mới (`data-quality-system/`) là **standalone** tách riêng.

---

## PHẦN 11: QUY TẮC LÀM VIỆC

### BA Agent mode

- **Mode @plan (mặc định):** Phân tích, nghiên cứu, vẽ diagram
- **Mode @uiux:** Plan UI → xác nhận → spawn fe-builder implement
- **Mode @doc:** Spawn doc-writer sinh tài liệu

### Ràng buộc

- Không tự bịa nghiệp vụ — thiếu thông tin ghi `⚠️ NEED INFO`
- Không suy đoán DB schema hoặc API nội bộ
- Gắn nhãn "Đề xuất / Tham khảo" cho thông tin chưa xác thực
- Văn phong formal, rõ ràng
- Tiếng Việt cho tài liệu nghiệp vụ, tiếng Anh cho code/technical terms
- Diagram: PlantUML cho activity/sequence/state, Mermaid cho ERD

### Files quan trọng cần đọc khi tiếp tục

| Ưu tiên | File | Lý do |
|---------|------|-------|
| 1 | `data-quality-system/src/types/index.ts` | Data model đầy đủ |
| 2 | `data-quality-system/src/App.tsx` | Routes, modules |
| 3 | `data-quality-system/Plan dataquality.md` | Plan chính thức 20 yêu cầu |
| 4 | `data-quality-system/HDSD.md` | HDSD chi tiết, 28 metric |
| 5 | `data-quality-system/src/data/mockData.ts` | Mock data hiện tại |
| 6 | `.claude/plans/resilient-herding-aho.md` | Giải pháp chi tiết (Template, Hạ tầng, Cảnh báo) |
| 7 | `speech_to_text/MN_20260408_DataQuality_Review.md` | Tổng hợp yêu cầu 2 cuộc họp |
| 8 | `speech_to_text/DQ_Meeting2_Requirements_20260408.md` | Yêu cầu chi tiết Họp 2 |

---

## PHẦN 12: PROMPT KHỞI ĐỘNG CHO HỘI THOẠI MỚI

Dán đoạn sau vào hội thoại Team mới:

```
Tôi đang tiếp tục dự án Data Quality System. Toàn bộ context đã được đóng gói trong file:
`data-quality-system/CONTEXT_HANDOFF.md`

Hãy đọc file đó trước, sau đó đọc thêm:
1. `data-quality-system/src/types/index.ts` — data model
2. `data-quality-system/Plan dataquality.md` — plan 20 yêu cầu
3. `data-quality-system/src/App.tsx` — routes

Dự án: Data Quality Tool (React 18 + TS + Vite + Tailwind), giám sát chất lượng dữ liệu cho ~8,000 bảng HDFS trong công ty Fintech.

Mode: ba-analyst (@plan). Tiếp tục từ [mô tả việc cần làm tiếp].
```
