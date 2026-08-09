/** Kiểu dữ liệu dùng chung cho toàn bộ demo DMP */

export type Tier = 'Tier 1' | 'Tier 2' | 'Tier 3'

/** Vòng đời phê duyệt metadata — GĐ2 mục 8.1 */
export type ApprovalState =
  | 'Dự thảo'
  | 'Chờ phê duyệt'
  | 'Yêu cầu chỉnh sửa'
  | 'Đã phê duyệt'
  | 'Ngừng sử dụng'

/** Vòng đời sử dụng của đối tượng */
export type Lifecycle = 'Nháp' | 'Đang dùng' | 'Sắp ngừng' | 'Đã ngừng'

/** Mức phân loại bảo mật — GĐ4 mục 3 (trục 1) */
export type Confidentiality = 'Công khai' | 'Nội bộ' | 'Mật' | 'Hạn chế truy cập'

export type DimensionId =
  | 'completeness' | 'validity' | 'consistency'
  | 'uniqueness' | 'accuracy' | 'timeliness'

export type Severity = 'Nghiêm trọng' | 'Cao' | 'Trung bình' | 'Thấp'

/* ───────── ① Data Catalog ───────── */

export type SystemRow = {
  id: string
  name: string
  purpose: string
  kind: 'Cơ sở dữ liệu' | 'Kho dữ liệu' | 'Vùng dữ liệu thô' | 'Ứng dụng nghiệp vụ' | 'Công cụ BI' | 'Hàng đợi'
  tech: string
  unit: string
  techOwner: string
  dataOwner: string
  env: 'Production' | 'Test' | 'UAT'
  status: 'Đang sử dụng' | 'Đã ngừng sử dụng'
  tableCount: number
  domainIds: string[]
  approval: ApprovalState
  metadataScore: number
  updatedAt: string
}

export type TableRow = {
  id: string
  name: string
  description: string
  systemId: string
  domain: string | null
  tier: Tier | null
  dataOwner: string | null
  bda: string | null
  de: string | null
  rows: number
  sizeGb: number
  format: 'Iceberg' | 'Hudi' | 'Parquet' | 'ORC'
  zone: 'raw' | 'dwh' | 'bi' | 'mart' | 'ops' | 'crm' | 'fin' | 'ref'
  syncFrequency: string
  freshness: string
  freshnessOk: boolean
  lifecycle: Lifecycle
  approval: ApprovalState
  confidentiality: Confidentiality
  qualityScore: number | null
  ruleCount: number
  columnCount: number
  sensitiveColumnCount: number
  producedByJob: string | null
  producedByIngest: string | null
  consumerReports: string[]
  downstreamTables: string[]
  usageWeek: number
  metadataScore: number
  updatedAt: string
  updatedBy: string
}

export type ColumnRow = {
  tableId: string
  ord: number
  name: string
  type: string
  description: string
  glossaryId: string | null
  tags: string[]
  confidentiality: Confidentiality
  businessRule: string | null
  valueSet: string[] | null
  isKey: boolean
  nullable: boolean
  nullPct: number
  distinctCount: number
  min: string | null
  max: string | null
  maskPolicy: string | null
}

export type DomainRow = {
  id: string
  name: string
  parentId: string | null
  description: string
  owner: string
  tableCount: number
  coveredPct: number
  qualityScore: number | null
}

export type GroupRow = {
  id: string
  name: string
  description: string
  tableIds: string[]
  createdBy: string
  createdAt: string
  status: 'Đang dùng' | 'Đã ngừng'
  usedByPolicies: number
}

export type RefDataRow = {
  id: string
  name: string
  description: string
  recordCount: number
  version: string
  owner: string
  approval: ApprovalState
  pendingCount: number
  usedByRules: number
  updatedAt: string
  fields: { name: string; type: string; required: boolean; key: boolean; format?: string; min?: string; max?: string }[]
  records: Record<string, string>[]
  versions: { version: string; date: string; by: string; note: string; added: number; removed: number; changed: number }[]
  pending: { code: string; name: string; action: 'Thêm mới' | 'Cập nhật' | 'Ngừng dùng'; by: string; at: string; note: string }[]
}

export type ChannelRow = {
  id: string
  name: string
  purpose: string
  kind: 'API' | 'Kafka' | 'SFTP' | 'FTP' | 'File Share' | 'Webhook'
  direction: 'Gửi đi' | 'Nhận về' | 'Hai chiều'
  fromSystem: string
  toSystem: string
  payload: string
  format: 'JSON' | 'Avro' | 'CSV' | 'XML' | 'Parquet'
  frequency: string
  auth: string
  owner: string
  confidentiality: Confidentiality
  status: 'Đang hoạt động' | 'Tạm dừng' | 'Đã ngừng'
  approval: ApprovalState
  linkedTables: string[]
  volumeDay: string
  updatedAt: string
}

export type MetricRow = {
  id: string
  name: string
  unit: string
  definition: string
  formula: string
  glossaryId: string | null
  reportIds: string[]
  sourceTables: string[]
  aggregation: string
  filterRule: string
  owner: string
  approval: ApprovalState
  qualityScore: number | null
  ruleCount: number
  traceable: boolean
}

export type ReportRow = {
  id: string
  name: string
  description: string
  purpose: string
  ownerUnit: string
  owner: string
  bda: string
  tool: 'Power BI' | 'Excel' | 'SQLWF Dashboard' | 'Superset'
  output: 'Màn hình' | 'Bảng dữ liệu' | 'File'
  frequency: string
  readyBy: string
  audience: string[]
  metricIds: string[]
  /** Bảng nguồn dùng để TÍNH ra số liệu */
  sourceTables: string[]
  /** Bảng kết quả đầu ra mà báo cáo đọc trực tiếp để hiển thị — có thể rỗng nếu công cụ BI tự truy vấn */
  backingTables: string[]
  confidentiality: Confidentiality
  approval: ApprovalState
  lifecycle: Lifecycle
  traceable: boolean
  qualityScore: number | null
  viewsMonth: number
  updatedAt: string
}

/* ───────── ② Governance ───────── */

export type GlossaryRow = {
  id: string
  name: string
  aliases: string[]
  book: string
  definition: string
  formula: string | null
  unit: string | null
  scope: string
  cde: boolean
  owner: string
  steward: string
  approver: string
  parentId: string | null
  relatedIds: string[]
  boundColumns: { tableId: string; column: string }[]
  boundMetrics: string[]
  approval: ApprovalState
  version: string
  updatedAt: string
  history: { version: string; date: string; by: string; note: string }[]
}

export type TagRow = {
  id: string
  name: string
  parentId: string | null
  description: string
  sensitivity: 'Cao' | 'Trung bình' | 'Thấp'
  legalBasis: string
  columnCount: number
  defaultMask: string | null
  defaultConfidentiality: Confidentiality
  syncedToOpa: boolean
}

export type LineageEdge = {
  id: string
  fromType: 'Hệ thống' | 'Bảng' | 'Cột' | 'File' | 'Kênh' | 'Báo cáo' | 'Chỉ tiêu'
  from: string
  toType: 'Hệ thống' | 'Bảng' | 'Cột' | 'File' | 'Kênh' | 'Báo cáo' | 'Chỉ tiêu'
  to: string
  viaJob: string | null
  transform: string
  level: 'Hệ thống' | 'Bảng' | 'Cột' | 'Nghiệp vụ'
  schedule: string
  source: 'Tự động — phân tích SQL' | 'Tự động — cấu hình cửa nạp' | 'Khai báo thủ công'
  approval: ApprovalState
  declaredBy: string
  declaredAt: string
  note: string
}

export type ApprovalItem = {
  id: string
  objectType: string
  objectId: string
  objectName: string
  change: string
  submittedBy: string
  submittedAt: string
  approver: string
  state: ApprovalState
  waitingDays: number
  priority: Severity
  diff: { field: string; before: string; after: string }[]
}

/* ───────── ③ Data Quality ───────── */

export type RuleType = {
  id: string
  code: string
  name: string
  dimension: DimensionId
  level: 'Bảng' | 'Cột'
  appliesTo: string
  params: string
  builtin: boolean
  usage: number
  defaultWarn: number
  defaultCrit: number
  sqlTemplate: string
  description: string
}

export type RuleInstance = {
  id: string
  ruleTypeId: string
  ruleName: string
  dimension: DimensionId
  objectType: 'Bảng' | 'Cột' | 'Báo cáo' | 'Chỉ tiêu' | 'Dữ liệu chủ'
  objectId: string
  objectLabel: string
  column: string | null
  params: string
  warn: number
  crit: number
  thresholdSource: 'Toàn cục' | 'Theo bảng' | 'Theo lần gán'
  trigger: 'Theo lịch' | 'Theo sự kiện' | 'Thủ công'
  schedule: string
  blockDownstream: boolean
  severity: Severity
  owner: string
  status: 'Đang chạy' | 'Tạm dừng' | 'Nháp'
  lastRun: string
  lastResult: 'Đạt' | 'Không đạt' | 'Cảnh báo'
  lastScore: number
  trend: number[]
  failedRows: number
  totalRows: number
}

export type ProfileRow = {
  tableId: string
  column: string
  type: string
  nullPct: number
  distinct: number
  min: string
  max: string
  mean: string | null
  topValue: string
  topPct: number
  duplicates: number
  scannedAt: string
  suggestions: { rule: string; reason: string; dimension: DimensionId }[]
}

export type IncidentRow = {
  id: string
  title: string
  objectType: string
  objectId: string
  column: string | null
  ruleId: string
  ruleName: string
  dimension: DimensionId
  severity: Severity
  status: 'Mới' | 'Đã gán' | 'Đang xử lý' | 'Chờ kiểm tra lại' | 'Đã giải quyết' | 'Chờ duyệt đóng' | 'Đã đóng'
  assignee: string | null
  reporter: string
  dueAt: string
  openedAt: string
  openedDays: number
  recurrence: number
  rootCause: string | null
  closeReason: string | null
  failedRows: number
  sampleRows: Record<string, string>[]
  timeline: { time: string; who: string; title: string; text?: string; tone?: 'b' | 'g' | 'r' | 'o' | 'n' }[]
  recheck: { at: string; result: 'Đạt' | 'Không đạt'; score: number } | null
}

export type AlertRule = {
  id: string
  name: string
  condition: string
  scope: string
  mode: 'Gửi ngay' | 'Gom lô 15 phút' | 'Tổng hợp ngày' | 'Tổng hợp tuần'
  channels: string[]
  recipients: string[]
  dedupe: string
  status: 'Bật' | 'Tắt'
  sentMonth: number
  owner: string
}

export type AlertChannel = {
  id: string
  name: string
  kind: 'Email' | 'SMS' | 'Telegram' | 'Webhook' | 'Jira'
  config: string
  status: 'Hoạt động' | 'Lỗi' | 'Tạm dừng'
  sentMonth: number
  failed: number
  failRate: number
}

/* ───────── ④ Ingestion & Orchestration ───────── */

export type JobRow = {
  id: string
  name: string
  group: string
  purpose: string
  targetTable: string
  targetInCatalog: boolean
  sourceTables: string[]
  steps: number
  schedule: string
  scheduleText: string
  slaTime: string
  lastRun: string
  lastResult: 'Thành công' | 'Thất bại' | 'Đang chạy' | 'Bị chặn'
  durationMin: number
  lineageScan: boolean
  approval: ApprovalState
  owner: string
  de: string
  version: string
  alertTo: string[]
}

export type JobStep = {
  jobId: string
  ord: number
  name: string
  type: 'SparkSQL' | 'Kiểm tra' | 'Ghi bảng' | 'Đọc nguồn'
  dependsOn: number[]
  sql: string
  durationSec: number
  status: 'Thành công' | 'Thất bại' | 'Bỏ qua'
}

export type JobRun = {
  jobId: string
  runId: string
  startedAt: string
  durationMin: number
  result: 'Thành công' | 'Thất bại' | 'Đang chạy'
  rowsWritten: number
  failedStep: number | null
  note: string
  steps: { name: string; startPct: number; widthPct: number; ok: boolean }[]
}

export type JobVersion = {
  jobId: string
  version: string
  date: string
  by: string
  note: string
  approvedBy: string | null
  current: boolean
}

export type IngestTemplate = {
  id: string
  name: string
  kind: 'SFTP đối tác' | 'Tải file thủ công' | 'Đồng bộ CSDL' | 'Kafka' | 'API' | 'Di trú dữ liệu'
  source: string
  targetTable: string
  format: string
  schedule: string
  qualityGate: boolean
  gateRules: number
  gateMode: 'Chặn cả lô' | 'Tách dòng lỗi' | 'Chỉ cảnh báo' | '—'
  legacyScreen: string
  owner: string
  status: 'Đang dùng' | 'Tạm dừng'
  lastLoad: string
  lastResult: 'Thành công' | 'Thất bại' | 'Giữ ở vùng chờ'
}

export type QuarantineBatch = {
  id: string
  templateId: string
  arrivedAt: string
  blockLevel: 'Chặn cả lô' | 'Tách dòng lỗi' | 'Chỉ cảnh báo'
  reason: string
  heldRows: number
  totalRows: number
  incidentId: string | null
  status: 'Đang giữ' | 'Đã cho qua' | 'Đã loại bỏ' | 'Đã nạp lại'
  sampleRows: Record<string, string>[]
}

/* ───────── ⑤ Data Security ───────── */

export type UserRow = {
  id: string
  account: string
  name: string
  unit: string
  role: string
  groups: string[]
  userTags: string[]
  tableGrants: number
  status: 'Hoạt động' | 'Đã nghỉ việc — chưa khoá' | 'Đã khoá'
  lastLogin: string
  employed: boolean
}

export type GroupAcl = {
  id: string
  name: string
  memberCount: number
  description: string
  menuRights: Record<string, string>
}

export type PolicyRow = {
  id: string
  kind: 'Quyền dữ liệu' | 'Che dữ liệu' | 'Lọc theo dòng' | 'Theo nhãn' | 'Hạn chế tải xuống'
  subject: string
  subjectType: 'Nhóm' | 'Người dùng' | 'Vai trò'
  scopeLevel: 'Toàn hệ thống' | 'Miền' | 'Nhóm bảng' | 'Bảng' | 'Cột' | 'Nhãn'
  scope: string
  right: string
  excludedColumns: string[]
  maskType: string | null
  rowFilter: string | null
  expiry: string
  source: 'Thủ công' | 'Yêu cầu cấp quyền' | 'Kế thừa nhãn' | 'Đồng bộ AD'
  sourceRef: string | null
  status: 'Đang hiệu lực' | 'Hết hạn' | 'Đã thu hồi'
  createdAt: string
  createdBy: string
}

export type AccessRequest = {
  id: string
  requester: string
  requesterUnit: string
  objectType: 'Bảng' | 'Cột' | 'Báo cáo' | 'Nhóm bảng'
  objectId: string
  right: string
  reason: string
  purpose: string
  wantFrom: string
  wantTo: string
  approver: string
  status: 'Chờ phê duyệt' | 'Đã phê duyệt – đang hiệu lực' | 'Từ chối' | 'Đã thu hồi' | 'Hết hạn'
  createdAt: string
  waitingDays: number
  decisionNote: string | null
  grantedLevel: string | null
}

export type AuditRow = {
  id: string
  at: string
  user: string
  action: 'Xem' | 'Truy vấn' | 'Tải xuống' | 'Sửa metadata' | 'Cấp quyền' | 'Thu hồi quyền' | 'Chia sẻ' | 'Đăng nhập'
  objectType: string
  objectId: string
  detail: string
  rows: number | null
  decidedBy: string
  ip: string
  result: 'Cho phép' | 'Từ chối' | 'Cảnh báo'
}

export type AccessAnomaly = {
  id: string
  at: string
  user: string
  kind: 'Tải xuống bất thường' | 'Truy cập ngoài giờ' | 'Truy vấn quét toàn bảng' | 'IP lạ' | 'Truy cập dữ liệu Mật lần đầu'
  object: string
  metric: string
  threshold: string
  severity: Severity
  status: 'Mới' | 'Đang xác minh' | 'Đã xử lý' | 'Bỏ qua'
  handler: string | null
}

/* ───────── ⑥ Policy & Compliance ───────── */

export type DataPolicy = {
  id: string
  name: string
  category: 'Quản trị' | 'Chất lượng' | 'Bảo mật' | 'Cấp quyền' | 'Chia sẻ' | 'Lưu trữ'
  summary: string
  scope: string
  issuer: string
  effectiveFrom: string
  reviewAt: string
  version: string
  status: 'Đang hiệu lực' | 'Dự thảo' | 'Hết hiệu lực'
  linkedObjects: number
  compliancePct: number
  controls: string[]
}

export type LifecycleRule = {
  id: string
  name: string
  dataKind: string
  scope: string
  activeMonths: number
  retentionMonths: number
  archiveMonths: number
  deleteCondition: string
  legalBasis: string
  policyId: string
  affectedTables: string[]
  autoEnforced: boolean
  nextAction: string
  nextActionAt: string
  status: 'Đang áp dụng' | 'Chờ phê duyệt' | 'Tạm dừng'
}

export type SharingAgreement = {
  id: string
  partner: string
  dataScope: string
  purpose: string
  method: string
  from: string
  to: string
  approvedBy: string
  status: 'Đang hiệu lực' | 'Sắp hết hạn' | 'Hết hạn'
  maskApplied: string
  volumeMonth: string
}

export type Assessment = {
  id: string
  name: string
  period: string
  policyIds: string[]
  assessor: string
  startedAt: string
  finishedAt: string | null
  status: 'Đang đánh giá' | 'Đã hoàn thành' | 'Chờ khắc phục'
  passed: number
  failed: number
  na: number
  items: {
    code: string
    text: string
    policyId: string
    result: 'Đạt' | 'Không đạt' | 'Không áp dụng'
    evidence: string
    finding: string | null
  }[]
}

export type Remediation = {
  id: string
  assessmentId: string
  finding: string
  severity: Severity
  owner: string
  dueAt: string
  status: 'Mới' | 'Đang khắc phục' | 'Chờ kiểm chứng' | 'Đã đóng'
  plan: string
  progressPct: number
}

/* ───────── ⑦ Master Data ───────── */

export type MdmModel = {
  id: string
  name: string
  entity: 'Khách hàng' | 'Sản phẩm/Dịch vụ' | 'Đơn vị/Tổ chức' | 'Danh mục dùng chung'
  codeRule: string
  matchKeys: string[]
  survivorship: string
  owner: string
  steward: string
  sourceSystems: string[]
  goldenCount: number
  sourceCount: number
  duplicatePending: number
  approval: ApprovalState
  attributes: {
    name: string
    label: string
    type: string
    required: boolean
    identity: boolean
    standardRule: string
    confidentiality: Confidentiality
  }[]
}

export type MdmSourceRecord = {
  id: string
  modelId: string
  sourceSystem: string
  sourceKey: string
  values: Record<string, string>
  normalized: boolean
  issues: string[]
  goldenId: string | null
  matchScore: number | null
  status: 'Chưa xử lý' | 'Đã chuẩn hoá' | 'Đã liên kết' | 'Loại trừ'
  loadedAt: string
}

export type MdmDuplicate = {
  id: string
  modelId: string
  score: number
  reason: string
  records: string[]
  status: 'Chưa xem xét' | 'Đang xem xét' | 'Đã hợp nhất' | 'Từ chối hợp nhất'
  reviewer: string | null
  decidedAt: string | null
  note: string | null
}

export type GoldenRecord = {
  id: string
  modelId: string
  code: string
  values: Record<string, string>
  sourceRecordIds: string[]
  confidence: number
  createdAt: string
  updatedAt: string
  version: number
  distributedTo: { system: string; at: string; status: 'Đồng bộ' | 'Lệch phiên bản' | 'Chưa nhận' }[]
  history: { at: string; by: string; field: string; before: string; after: string }[]
}

export type DistributionChannel = {
  id: string
  modelId: string
  target: string
  method: 'API' | 'Theo lô' | 'Theo sự kiện'
  frequency: string
  lastSync: string
  recordsSynced: number
  drift: number
  status: 'Đồng bộ' | 'Lệch' | 'Lỗi'
}
