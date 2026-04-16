export type QualityDimension = 'completeness' | 'validity' | 'consistency' | 'uniqueness' | 'accuracy' | 'timeliness'

export type MetricType =
  // Completeness — Column
  | 'not_null'
  | 'fill_rate'
  | 'null_rate_by_period'
  | 'conditional_not_null'
  // Validity — Column
  | 'format_regex'
  | 'blacklist_pattern'
  | 'value_range'
  | 'allowed_values'
  // Consistency — Column
  | 'fixed_datatype'
  | 'mode_check'
  | 'referential_integrity'
  // Uniqueness — Column
  | 'duplicate_single'
  // Accuracy — Column
  | 'reference_match'
  | 'statistics_bound'
  | 'sum_range'
  | 'expression_pct'
  // Timeliness — Column
  | 'on_time'
  | 'freshness'
  // Table-level
  | 'row_count'
  | 'time_coverage'
  | 'volume_change'
  | 'table_size'
  | 'custom_expression'
  | 'duplicate_composite'
  // Report-specific
  | 'aggregate_reconciliation'
  | 'report_row_count_match'
  // KPI-specific
  | 'kpi_variance'
  | 'parent_child_match'

export interface MetricConfig {
  metricType: MetricType
  // Column selector
  column?: string
  columns?: string[]
  sourceColumn?: string
  // Pattern / regex
  pattern?: string
  blacklistPattern?: string
  // Value range
  minValue?: number
  maxValue?: number
  // Enum / whitelist
  allowedValues?: string[]
  // Reference check
  refTable?: string
  refColumn?: string
  // Timeliness
  slaTime?: string
  alertWindowMinutes?: number
  maxAge?: number
  maxAgeUnit?: 'minutes' | 'hours' | 'days'
  // Fill rate
  minFillPct?: number
  // Expression (SQL)
  expression?: string
  // Null rate by period
  timeColumn?: string
  granularity?: 'day' | 'week' | 'month'
  coverageDays?: number
  maxNullPct?: number
  // Conditional not-null
  condition?: string
  // Fixed datatype
  dataType?: 'STRING' | 'INTEGER' | 'DECIMAL' | 'DATE' | 'TIMESTAMP'
  // Mode check
  modeValue?: string
  minFreqPct?: number
  // Statistics bound
  statisticType?: 'min' | 'max' | 'mean' | 'stddev' | 'p25' | 'p50' | 'p75'
  // Expression pct
  minPassPct?: number
  // Row count / volume change (table-level)
  minRows?: number
  maxRows?: number
  lookbackPeriod?: number
  maxChangePct?: number
  // Time coverage (table-level)
  minCoveragePct?: number
  // Table size (table-level)
  tableSizeMin?: number
  tableSizeMax?: number
  tableSizeUnit?: 'MB' | 'GB'
  // Sum range
  // (reuses minValue/maxValue)
  // Report-specific
  sourceTableId?: string
  reportColumn?: string
  tolerancePct?: number
  // KPI-specific
  maxVariancePct?: number
  parentKpiColumn?: string
  childSumExpression?: string
}
export type DataSourceType = 'database' | 'sql' | 'file' | 'api'
export type DataSourceStatus = 'active' | 'inactive' | 'error' | 'waiting_data' | 'revalidating'
export type ModuleType = 'source' | 'report' | 'kpi'
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type RuleStatus = 'active' | 'inactive'
export type RuleResultStatus = 'pass' | 'warning' | 'fail' | 'error' | 'pending'
export type ScheduleFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'
export type ScheduleStatus = 'active' | 'inactive' | 'paused'
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low'
export type IssueStatus = 'new' | 'assigned' | 'in_progress' | 'pending_review' | 'resolved' | 'closed'

export interface DataSource {
  id: string
  name: string
  type: DataSourceType
  description: string
  schema: string
  tableName: string
  status: DataSourceStatus
  owner: string
  team: string
  category: string
  rowCount: number
  lastProfiled?: string
  overallScore: number
  dimensionScores: Record<QualityDimension, number>
  createdAt: string
  updatedAt: string
  // Module classification
  moduleType: ModuleType
  // Report-specific: IDs of source tables this report depends on
  sourceTableIds?: string[]
  // KPI-specific
  parentKpiId?: string
  childKpiIds?: string[]
  periodType?: PeriodType
  kpiFormula?: string
  // Threshold overrides per dimension (empty = inherit global defaults)
  thresholdOverrides?: Partial<Record<QualityDimension, { warning: number; critical: number }>>
  // Scheduling & Timeliness
  dataRequiredByTime?: string  // HH:mm — giờ mong muốn có dữ liệu sẵn sàng (VD: '08:00')
  // SQLWF metadata
  syncSource?: 'sqlwf' | 'manual'
  partitionBy?: 'daily' | 'monthly' | 'none'
  mode?: 'append' | 'overwrite'
  area?: string
  // HDFS layer classification
  hdfsLayer?: 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6'
}

export interface QualityRule {
  id: string
  name: string
  description: string
  dimension: QualityDimension
  tableId: string
  tableName: string
  columnName?: string
  expression?: string
  metricConfig?: MetricConfig
  threshold: { warning: number; critical: number }
  status: RuleStatus
  lastRunAt?: string
  lastResult?: RuleResultStatus
  lastScore?: number
  createdBy: string
  createdAt: string
}

export interface RuleTemplate {
  id: string
  name: string
  dimension: QualityDimension
  description: string
  expression?: string
  metricConfig?: MetricConfig
  category: string
  usageCount: number
  threshold: { warning: number; critical: number }
  createdAt: string
  updatedAt: string
  createdBy: string
}

// Column Profile — gom nhiều metric templates cho 1 loại cột
export interface ColumnProfileTemplate {
  id: string
  name: string
  description: string
  columnKeywords: string[]
  metricTemplateIds: string[]
  thresholdOverrides?: Partial<Record<QualityDimension, { warning: number; critical: number }>>
  usageCount: number
  createdAt: string
  updatedAt: string
}

// Table Profile — gom Column Profiles + table-level metrics cho 1 loại bảng
export interface TableProfileTemplate {
  id: string
  name: string
  description: string
  tableType: ModuleType
  mode: 'append' | 'overwrite'
  partition: 'daily' | 'monthly' | 'none'
  tableMetricTemplateIds: string[]
  columnProfileIds: string[]
  defaultThresholds?: Partial<Record<QualityDimension, { warning: number; critical: number }>>
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface Schedule {
  id: string
  name: string
  tableId: string
  tableName: string
  frequency: ScheduleFrequency
  cronExpression?: string
  runTime?: string
  daysOfWeek?: number[]
  status: ScheduleStatus
  nextRun: string
  lastRun?: string
  lastRunStatus?: 'success' | 'failed' | 'partial'
  rulesCount: number
  owner: string
}

export interface IssueEvent {
  id: string
  type: 'created' | 'assigned' | 'status_changed' | 'comment' | 'resolved'
  user: string
  content: string
  timestamp: string
}

export interface Issue {
  id: string
  title: string
  description: string
  severity: IssueSeverity
  status: IssueStatus
  tableId: string
  tableName: string
  dimension: QualityDimension
  ruleId?: string
  ruleName?: string
  detectedAt: string
  assignedTo?: string
  resolvedAt?: string
  timeline: IssueEvent[]
}

export interface NotificationConfig {
  id: string
  name: string
  type: 'email' | 'sms' | 'webhook' | 'telegram'
  recipients: string[]
  triggerOn: ('warning' | 'critical' | 'resolved')[]
  tables: string[]
  isActive: boolean
  notifyDownstream?: boolean
  emailSubject?: string
  emailBody?: string
  // Digest mode: gom nhóm các sự kiện trong 1 khoảng thời gian → gửi 1 email/message tổng hợp (giảm spam)
  digestEnabled?: boolean
  digestIntervalMinutes?: number  // VD: 15, 30, 60 — khoảng gom nhóm
}

export interface CascadeEvent {
  id: string;
  chainId: string;                    // Groups related events into one cascade chain
  triggerIssueId: string;             // The original issue that started the cascade
  sourceTableId: string;              // DataSource that failed
  sourceTableName: string;
  affectedTableId: string;            // Downstream DataSource affected
  affectedTableName: string;
  affectedType: ModuleType;           // 'source' | 'report' | 'kpi'
  eventType: 'cascade_triggered' | 'status_changed' | 'notification_sent' | 'revalidation_started' | 'resolved' | 'chain_completed';
  previousStatus?: DataSourceStatus;
  newStatus?: DataSourceStatus;
  notificationRecipient?: string;     // Name of the person notified
  notificationChannel?: 'email' | 'sms' | 'webhook';
  message: string;                    // Human-readable description
  timestamp: string;                  // ISO date string
}

export interface CascadeChain {
  id: string;
  rootIssueId: string;
  rootTableId: string;
  rootTableName: string;
  affectedEntities: Array<{
    tableId: string;
    tableName: string;
    type: ModuleType;
    status: DataSourceStatus;
  }>;
  status: 'active' | 'partially_resolved' | 'resolved';
  startedAt: string;
  resolvedAt?: string;
  totalEvents: number;
}

export interface CascadeConfig {
  notifyDownstream: boolean;
  autoWaitingData: boolean;     // Auto-set downstream to waiting_data
  autoRerun: boolean;           // Auto-trigger re-run when upstream recovers
  autoResolve: boolean;         // Auto-resolve cascade issues when all OK
  cascadeDepth: number;         // Max cascade levels (1=report only, 2=report+kpi, 0=unlimited)
  cascadeSummary: boolean;      // Send summary notification when chain resolves
}

export type JobType = 'etl'
export type JobTechnology = 'Spark' | 'Airflow' | 'Python' | 'SSIS' | 'Kafka' | 'Custom'
export type JobRunStatus = 'success' | 'failed' | 'partial'

export interface PipelineJob {
  id: string
  name: string
  description: string
  jobType: JobType
  technology: JobTechnology
  owner: string
  ownerEmail: string
  team: string
  inputTableIds: string[]
  outputTableIds: string[]
  status: 'active' | 'inactive'
  schedule: string
  lastRunAt: string
  lastRunStatus: JobRunStatus
}

export interface ThresholdConfig {
  id: string
  tableId?: string
  tableName?: string
  dimension: QualityDimension
  warningThreshold: number
  criticalThreshold: number
  isGlobal: boolean
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'data_steward' | 'analyst' | 'viewer'
  team: string
  dataOwnership: string[]
  isActive: boolean
  lastLoginAt: string
}

export interface ColumnProfile {
  columnName: string
  dataType: string
  nullCount: number
  nullRate: number
  distinctCount: number
  distinctRate: number
  minValue?: string
  maxValue?: string
  sampleValues: string[]
  issues: string[]
}

export interface ProfilingResult {
  id: string
  tableId: string
  tableName: string
  runAt: string
  status: 'running' | 'completed' | 'failed'
  totalRows: number
  totalColumns: number
  overallScore: number
  dimensionScores: Record<QualityDimension, number>
  durationSeconds: number
  columnProfiles: ColumnProfile[]
}

export interface DashboardStats {
  totalTables: number
  tablesMonitored: number
  avgHealthScore: number
  openIssues: number
  criticalIssues: number
  rulesActive: number
  lastUpdated: string
}

export interface ReconciliationResult {
  id: string
  ruleId: string
  ruleName: string
  metricType: string
  reportTableId: string
  reportTableName: string
  reportColumn: string
  sourceTableId: string
  sourceTableName: string
  sourceColumn: string
  reportValue: number
  sourceValue: number
  variance: number
  tolerancePct: number
  result: 'pass' | 'warning' | 'fail'
  qualityScore: number
  checkedAt: string
}

export interface KpiPeriodResult {
  kpiId: string
  period: string          // e.g., '2026-01', '2026-02', 'Q1-2026'
  qualityScore: number    // 0-100, điểm chất lượng DQ
  previousScore?: number  // Điểm kỳ trước
  ruleResults: {
    ruleId: string
    ruleName: string
    score: number
    result: 'pass' | 'warning' | 'fail'
  }[]
}
