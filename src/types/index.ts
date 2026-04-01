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
  | 'cross_column'
  | 'duplicate_composite'

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
}
export type DataSourceType = 'database' | 'sql' | 'file' | 'api'
export type DataSourceStatus = 'active' | 'inactive' | 'error'
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
  type: 'email' | 'sms' | 'webhook'
  recipients: string[]
  triggerOn: ('warning' | 'critical' | 'resolved')[]
  tables: string[]
  isActive: boolean
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
