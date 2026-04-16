import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BookOpen, LayoutGrid, Search, Plus, Edit, Trash2, X, Play,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2,
  History, Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DimensionBadge, getDimensionLabel, DIMENSION_CONFIG } from '@/components/common/DimensionBadge'
import { PageHeader } from '@/components/common/PageHeader'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import { cn, formatDateTime } from '@/lib/utils'
import { SearchableMultiSelect } from '@/components/common/SearchableMultiSelect'
import { mockRules, mockRuleTemplates, mockDataSources, mockColumnProfiles, mockTableProfiles } from '@/data/mockData'
import { getGlobalThreshold, getTableThreshold } from '@/pages/Thresholds'
import type { QualityDimension, RuleStatus, MetricType, MetricConfig, QualityRule, RuleTemplate, IssueSeverity, Issue, ModuleType, ColumnProfileTemplate, TableProfileTemplate } from '@/types'

const DIMENSIONS: QualityDimension[] = ['completeness', 'validity', 'consistency', 'uniqueness', 'accuracy', 'timeliness']
const PAGE_SIZE = 10

// Metric types nhận cột đơn (dùng cho chế độ tạo nhiều rules cùng loại cho nhiều cột)
const SINGLE_COL_METRICS: MetricType[] = [
  'not_null', 'fill_rate', 'format_regex', 'blacklist_pattern', 'value_range', 'allowed_values',
  'null_rate_by_period', 'conditional_not_null', 'fixed_datatype', 'mode_check',
  'duplicate_single', 'statistics_bound', 'sum_range', 'on_time', 'freshness',
]

// ─── Module-level issue store (auto-created from rule runs) ──────────────────
export const _ruleGeneratedIssues: Issue[] = []

function computeSeverity(score: number, warning: number, critical: number): IssueSeverity {
  if (score < critical) return 'critical'
  if (score < warning) return 'high'
  return 'medium'
}

function generateIssue(rule: QualityRule, score: number, trigger: 'manual' | 'scheduled'): Issue {
  const pct = (100 - score).toFixed(1)
  const target = rule.columnName ? `cột ${rule.columnName}` : 'toàn bảng'
  const triggerLabel = trigger === 'manual' ? 'Chạy thủ công' : 'Lịch tự động'
  return {
    id: `iss-auto-${Date.now()}`,
    title: `${rule.name} — ${score < rule.threshold.critical ? 'Không đạt' : 'Cảnh báo'}`,
    description: `Phát hiện ${pct}% vi phạm trong ${target} — Điểm: ${score.toFixed(1)}/100 (ngưỡng cảnh báo: ${rule.threshold.warning}%, không đạt: ${rule.threshold.critical}%) · ${triggerLabel}`,
    severity: computeSeverity(score, rule.threshold.warning, rule.threshold.critical),
    status: 'new',
    tableId: rule.tableId,
    tableName: rule.tableName,
    dimension: rule.dimension,
    ruleId: rule.id,
    ruleName: rule.name,
    detectedAt: new Date().toISOString(),
    timeline: [
      {
        id: `ev-${Date.now()}`,
        type: 'created',
        user: 'Hệ thống',
        content: `Tự động phát hiện: điểm ${score.toFixed(1)} — ${triggerLabel}`,
        timestamp: new Date().toISOString(),
      },
    ],
  }
}

// ─── Mock run history per rule ───────────────────────────────────────────────
interface RuleRunEntry {
  id: string
  runAt: string
  trigger: 'Lịch tự động' | 'Chạy thủ công'
  result: 'pass' | 'warning' | 'fail' | 'error'
  score: number
  issueId?: string
}

const _runHistory: Record<string, RuleRunEntry[]> = {}

function seedRunHistory(ruleId: string) {
  if (_runHistory[ruleId]) return
  const entries: RuleRunEntry[] = []
  const results: Array<'pass' | 'warning' | 'fail'> = ['pass', 'pass', 'warning', 'pass', 'pass', 'warning', 'pass']
  for (let i = 6; i >= 0; i--) {
    const res = results[6 - i]
    const score = res === 'pass' ? 90 + Math.floor(Math.random() * 9) : res === 'warning' ? 78 + Math.floor(Math.random() * 10) : 60 + Math.floor(Math.random() * 15)
    entries.push({
      id: `rh-${ruleId}-${i}`,
      runAt: new Date(Date.now() - i * 86400000 - Math.floor(Math.random() * 3600000)).toISOString(),
      trigger: i === 3 ? 'Chạy thủ công' : 'Lịch tự động',
      result: res,
      score,
      issueId: res !== 'pass' ? `iss-00${i}` : undefined,
    })
  }
  _runHistory[ruleId] = entries
}

// ─── Metric definitions per dimension ───────────────────────────────────────

interface MetricDef {
  value: MetricType
  label: string
  hint: string
}

const METRICS_BY_DIMENSION: Record<QualityDimension, MetricDef[]> = {
  completeness: [
    { value: 'not_null', label: 'Không được rỗng (NOT NULL) [Cột]', hint: 'Kiểm tra cột không được chứa giá trị NULL' },
    { value: 'fill_rate', label: 'Tỷ lệ điền đủ (Fill Rate) [Cột]', hint: 'Tỷ lệ % dòng có giá trị, phải đạt ngưỡng tối thiểu' },
    { value: 'null_rate_by_period', label: '% Null theo chu kỳ [Cột]', hint: 'Tỷ lệ NULL trong từng chu kỳ (ngày/tuần/tháng) không được vượt ngưỡng — phát hiện trend xấu dần' },
    { value: 'conditional_not_null', label: 'NOT NULL có điều kiện [Cột]', hint: 'Cột bắt buộc có giá trị khi thỏa mãn điều kiện SQL. VD: nếu TRANG_THAI=\'ACTIVE\' thì SO_DU phải có giá trị' },
    { value: 'row_count', label: 'Số dòng trong khoảng [Bảng]', hint: 'Số bản ghi trong bảng phải nằm trong [min, max] — phát hiện bảng bị truncate hoặc tăng đột biến' },
    { value: 'time_coverage', label: 'Phủ thời gian (Time Coverage) [Bảng]', hint: 'Kiểm tra chuỗi thời gian không bị thiếu khoảng — phát hiện ngày/tuần/tháng bị missing data' },
    { value: 'volume_change', label: 'Thay đổi khối lượng (Volume Change) [Bảng]', hint: 'Số dòng không được thay đổi quá X% so với lần chạy trước trong N ngày — phát hiện mất/thêm dữ liệu bất thường' },
    { value: 'report_row_count_match', label: 'Khớp số dòng BC vs Nguồn [Bảng]', hint: 'Số dòng báo cáo phải khớp với bảng nguồn liên kết — phát hiện mất dữ liệu khi tổng hợp' },
  ],
  validity: [
    { value: 'format_regex', label: 'Đúng định dạng — Whitelist Regex [Cột]', hint: 'Giá trị PHẢI khớp biểu thức chính quy. VD: số điện thoại ^0[0-9]{9}$' },
    { value: 'blacklist_pattern', label: 'Không chứa giá trị rác — Blacklist [Cột]', hint: 'Giá trị KHÔNG ĐƯỢC khớp pattern. VD: loại bỏ "TEST|N/A|NULL|0000-00-00". Dùng | để OR nhiều pattern' },
    { value: 'value_range', label: 'Trong khoảng giá trị [Cột]', hint: 'Giá trị số phải nằm trong khoảng [min, max]' },
    { value: 'allowed_values', label: 'Trong danh sách hợp lệ (Whitelist) [Cột]', hint: 'Giá trị phải thuộc tập hợp cho phép (enum)' },
    { value: 'custom_expression', label: 'Biểu thức SQL tùy chỉnh [Bảng]', hint: 'Điều kiện WHERE SQL áp dụng trên toàn bảng' },
  ],
  consistency: [
    { value: 'fixed_datatype', label: 'Kiểu dữ liệu cố định [Cột]', hint: 'Tất cả giá trị trong cột phải đúng kiểu dữ liệu chỉ định. VD: cột DATE không được có giá trị dạng STRING' },
    { value: 'mode_check', label: 'Giá trị phổ biến nhất (Mode) [Cột]', hint: 'Giá trị xuất hiện nhiều nhất phải chiếm ≥ X% — phát hiện dữ liệu bị "pha tạp" bởi nguồn lạ' },
    { value: 'referential_integrity', label: 'Toàn vẹn tham chiếu (FK) [Cột]', hint: 'Giá trị cột phải tồn tại trong bảng tham chiếu' },
    { value: 'parent_child_match', label: 'Khớp KPI cha-con [Bảng]', hint: 'Tổng KPI con phải bằng KPI cha — phát hiện sai lệch cây chỉ tiêu' },
  ],
  uniqueness: [
    { value: 'duplicate_single', label: 'Không trùng lặp (1 cột) [Cột]', hint: 'Kiểm tra giá trị trong cột là duy nhất' },
    { value: 'duplicate_composite', label: 'Không trùng lặp (nhiều cột) [Bảng]', hint: 'Kiểm tra tổ hợp nhiều cột là duy nhất (composite key)' },
  ],
  accuracy: [
    { value: 'reference_match', label: 'Khớp với dữ liệu chuẩn [Cột]', hint: 'So sánh với bảng/cột tham chiếu đã xác thực' },
    { value: 'statistics_bound', label: 'Thống kê trong khoảng (Statistics Bound) [Cột]', hint: 'Giá trị thống kê (Min/Max/Mean/Stddev/Percentile) phải nằm trong khoảng cho phép — phát hiện outlier/drift phân phối' },
    { value: 'sum_range', label: 'Tổng cột trong khoảng (Sum Range) [Cột]', hint: 'SUM của cột phải nằm trong [min, max] — phát hiện bảng bị zero-out hoặc tổng doanh thu bất thường' },
    { value: 'expression_pct', label: 'Biểu thức cross-column có % pass [Cột]', hint: 'Biểu thức SparkSQL phải đúng cho ≥ X% số dòng. VD: total = price * qty đúng cho ≥ 99% dòng' },
    { value: 'table_size', label: 'Kích thước bảng trong khoảng [Bảng]', hint: 'Dung lượng bảng/partition phải trong khoảng [min, max] MB hoặc GB — phát hiện partition size bất thường' },
    { value: 'aggregate_reconciliation', label: 'Đối soát tổng hợp BC [Bảng]', hint: 'So sánh giá trị cột tổng hợp trên báo cáo với SUM từ bảng nguồn — phát hiện sai lệch' },
    { value: 'kpi_variance', label: 'Biến động KPI so kỳ trước [Bảng]', hint: 'Giá trị KPI không được thay đổi quá X% so với kỳ trước — phát hiện bất thường KPI' },
  ],
  timeliness: [
    { value: 'on_time', label: 'Đúng hạn (SLA) [Cột]', hint: 'Dữ liệu phải có mặt trước thời hạn SLA' },
    { value: 'freshness', label: 'Tươi mới (Freshness) [Cột]', hint: 'Dữ liệu phải được cập nhật trong khoảng thời gian quy định' },
  ],
}

function getMetricLabel(dim: QualityDimension, mt: MetricType): string {
  return METRICS_BY_DIMENSION[dim]?.find(m => m.value === mt)?.label ?? mt
}

const TABLE_LEVEL_METRICS: MetricType[] = [
  'custom_expression', 'duplicate_composite',
  'row_count', 'time_coverage', 'volume_change', 'table_size',
  'aggregate_reconciliation', 'report_row_count_match',
  'kpi_variance', 'parent_child_match',
]

function getScopeLabel(rule: QualityRule): string {
  const mt = rule.metricConfig?.metricType
  if (!mt || TABLE_LEVEL_METRICS.includes(mt)) return 'Bảng'
  const col = rule.metricConfig?.column ?? rule.columnName
  return col ? `Cột: ${col}` : 'Bảng'
}

function metricSummary(cfg: MetricConfig, dim: QualityDimension): string {
  switch (cfg.metricType) {
    case 'not_null': return `NOT NULL: ${cfg.column ?? '—'}`
    case 'fill_rate': return `Fill Rate ≥ ${cfg.minFillPct ?? '?'}% : ${cfg.column ?? '—'}`
    case 'format_regex': return `Regex [${cfg.pattern ?? '?'}] : ${cfg.column ?? '—'}`
    case 'value_range': return `${cfg.column ?? '—'} ∈ [${cfg.minValue ?? '?'}, ${cfg.maxValue ?? '?'}]`
    case 'allowed_values': return `${cfg.column ?? '—'} ∈ {${(cfg.allowedValues ?? []).slice(0, 3).join(', ')}${(cfg.allowedValues?.length ?? 0) > 3 ? '…' : ''}}`
    case 'custom_expression': return `Biểu thức: ${(cfg.expression ?? '').slice(0, 40)}…`
    case 'referential_integrity': return `${cfg.column ?? '—'} → ${cfg.refTable ?? '?'}.${cfg.refColumn ?? '?'}`
    case 'duplicate_single': return `Duy nhất: ${cfg.column ?? '—'}`
    case 'duplicate_composite': return `Duy nhất: (${(cfg.columns ?? []).join(', ')})`
    case 'reference_match': return `${cfg.sourceColumn ?? '—'} ↔ ${cfg.refTable ?? '?'}.${cfg.refColumn ?? '?'}`
    case 'on_time': return `SLA ${cfg.slaTime ?? '?'} ±${cfg.alertWindowMinutes ?? 0}': ${cfg.column ?? '—'}`
    case 'freshness': return `Tươi ≤ ${cfg.maxAge ?? '?'} ${cfg.maxAgeUnit ?? 'hours'}: ${cfg.column ?? '—'}`
    // New metrics
    case 'null_rate_by_period': return `Null/chu kỳ ≤ ${cfg.maxNullPct ?? '?'}% : ${cfg.column ?? '—'} (${cfg.granularity ?? 'day'}, ${cfg.coverageDays ?? '?'} ngày)`
    case 'conditional_not_null': return `NOT NULL khi: ${(cfg.condition ?? '—').slice(0, 40)}`
    case 'blacklist_pattern': return `Blacklist [${(cfg.blacklistPattern ?? '?').slice(0, 30)}] : ${cfg.column ?? '—'}`
    case 'fixed_datatype': return `Kiểu ${cfg.dataType ?? '?'} : ${cfg.column ?? '—'}`
    case 'mode_check': return `Mode${cfg.modeValue ? ` = '${cfg.modeValue}'` : ''} ≥ ${cfg.minFreqPct ?? '?'}% : ${cfg.column ?? '—'}`
    case 'statistics_bound': return `${cfg.statisticType ?? '?'} ∈ [${cfg.minValue ?? '?'}, ${cfg.maxValue ?? '?'}] : ${cfg.column ?? '—'}`
    case 'sum_range': return `SUM(${cfg.column ?? '—'}) ∈ [${cfg.minValue ?? '?'}, ${cfg.maxValue ?? '?'}]`
    case 'expression_pct': return `Expr ≥ ${cfg.minPassPct ?? '?'}%: ${(cfg.expression ?? '—').slice(0, 35)}…`
    case 'row_count': return `Rows ∈ [${cfg.minRows ?? '?'}, ${cfg.maxRows ?? '?'}]`
    case 'time_coverage': return `Phủ ${cfg.minCoveragePct ?? '?'}%/${cfg.granularity ?? '?'} (${cfg.coverageDays ?? '?'} ngày) : ${cfg.timeColumn ?? '—'}`
    case 'volume_change': return `Thay đổi ≤ ${cfg.maxChangePct ?? '?'}% (lookback ${cfg.lookbackPeriod ?? '?'} ngày)`
    case 'table_size': return `Size ∈ [${cfg.tableSizeMin ?? '?'}, ${cfg.tableSizeMax ?? '?'}] ${cfg.tableSizeUnit ?? 'MB'}`
    // Report/KPI metrics
    case 'aggregate_reconciliation': return `Đối soát: ${cfg.reportColumn ?? '—'} vs SUM nguồn (±${cfg.tolerancePct ?? '?'}%)`
    case 'report_row_count_match': return `Khớp số dòng BC vs Nguồn`
    case 'kpi_variance': return `Biến động KPI ≤ ${cfg.maxVariancePct ?? '?'}%`
    case 'parent_child_match': return `KPI cha ${cfg.parentKpiColumn ?? '—'} = ∑ con (±${cfg.tolerancePct ?? '?'}%)`
    default: return getMetricLabel(dim, cfg.metricType)
  }
}

// ─── Metric config fields (conditional UI) ───────────────────────────────────

const COLUMNS_BY_TABLE: Record<string, string[]> = {
  'ds-001': ['MA_KH','HO_TEN','NGAY_SINH','GIOI_TINH','SO_CMND','DIEN_THOAI','EMAIL','DIA_CHI','LOAI_KH','TINH_TRANG'],
  'ds-002': ['MA_GD','MA_TK','SO_TIEN','LOAI_GD','NGAY_GD','MA_THE','MA_NGAN_HANG','MO_TA','KENH_GD','TRANG_THAI'],
  'ds-003': ['MA_TK','MA_KH','LOAI_TK','SO_DU','TRANG_THAI','NGAY_MO','NGAY_DONG','LAI_SUAT','KY_HAN','MA_SP'],
  'ds-004': ['MA_SP','TEN_SP','LOAI_SP','MO_TA','TRANG_THAI','LAI_SUAT','PHI','DIEU_KIEN','NGAY_RA_MAT'],
  'ds-005': ['MA_HD','MA_KH','LOAI_HD','GIA_TRI','NGAY_KY','NGAY_HET_HAN','TRANG_THAI','MA_SP','LAI_SUAT'],
  'ds-006': ['NGAY_BC','MUC_TIEU','THUC_TE','TY_LE','LOAI_BC','MA_CN','TRANG_THAI'],
  'ds-007': ['MA_TIENTE','TEN_TIENTE','TY_GIA','TRANG_THAI','NGAY_CAP_NHAT'],
  'ds-008': ['MA_CN','TEN_CN','DIA_CHI','MA_VUNG','TRANG_THAI','DIEN_THOAI'],
  'ds-009': ['MA_NHOM','TEN_NHOM','TIEU_CHI','MA_KH','NGAY_XEP_LOAI'],
  'ds-010': ['MA_BIEU_PHI','TEN_DICH_VU','MUC_PHI','DON_VI','HIEU_LUC_TU','HIEU_LUC_DEN'],
  'ds-011': ['MA_LOG','MA_GD','THOI_GIAN','KENH','MA_TB','MA_KH','TRANG_THAI','MA_LOI','NGUON'],
  'ds-012': ['MA_RR','MA_KH','LOAI_RR','DIEM_RR','NGAY_DANH_GIA','TRANG_THAI','NGAY_CAP_NHAT'],
  'ds-013': ['MA_NV','HO_TEN','VAI_TRO','MA_CN','TRANG_THAI','NGAY_CAP_NHAT','EMAIL'],
  'ds-014': ['THANG','MA_TK','MA_KH','TONG_SO_GD','TONG_TIEN','TRANG_THAI','NGAY_TAO'],
  'ds-015': ['NGAY','MA_KH','TONG_GD','TONG_TIEN','KENH_GD','MA_SP'],
}

interface RuleForm {
  name: string
  description: string
  dimension: QualityDimension | ''
  metricType: MetricType | ''
  tableId: string
  column: string
  columns: string[]
  pattern: string
  blacklistPattern: string
  minValue: string
  maxValue: string
  allowedValues: string
  refTable: string
  refColumn: string
  sourceColumn: string
  slaTime: string
  alertWindowMinutes: string
  maxAge: string
  maxAgeUnit: 'minutes' | 'hours' | 'days'
  minFillPct: string
  expression: string
  // New fields
  timeColumn: string
  granularity: 'day' | 'week' | 'month'
  coverageDays: string
  maxNullPct: string
  minCoveragePct: string
  condition: string
  dataType: 'STRING' | 'INTEGER' | 'DECIMAL' | 'DATE' | 'TIMESTAMP'
  modeValue: string
  minFreqPct: string
  statisticType: 'min' | 'max' | 'mean' | 'stddev' | 'p25' | 'p50' | 'p75'
  minPassPct: string
  minRows: string
  maxRows: string
  lookbackPeriod: string
  maxChangePct: string
  tableSizeMin: string
  tableSizeMax: string
  tableSizeUnit: 'MB' | 'GB'
  // Report/KPI fields
  sourceTableId: string
  reportColumn: string
  tolerancePct: string
  maxVariancePct: string
  parentKpiColumn: string
  childSumExpression: string
  warningThreshold: string
  criticalThreshold: string
  status: RuleStatus
}

const EMPTY_FORM: RuleForm = {
  name: '', description: '', dimension: '', metricType: '',
  tableId: '', column: '', columns: [], pattern: '',
  blacklistPattern: '',
  minValue: '', maxValue: '', allowedValues: '', refTable: '', refColumn: '',
  sourceColumn: '', slaTime: '08:00', alertWindowMinutes: '30',
  maxAge: '24', maxAgeUnit: 'hours', minFillPct: '95',
  expression: '',
  timeColumn: '', granularity: 'day', coverageDays: '30',
  maxNullPct: '5', minCoveragePct: '95',
  condition: '',
  dataType: 'STRING',
  modeValue: '', minFreqPct: '50',
  statisticType: 'mean',
  minPassPct: '99',
  minRows: '', maxRows: '',
  lookbackPeriod: '7', maxChangePct: '30',
  tableSizeMin: '', tableSizeMax: '', tableSizeUnit: 'MB',
  sourceTableId: '', reportColumn: '', tolerancePct: '5',
  maxVariancePct: '30', parentKpiColumn: '', childSumExpression: '',
  warningThreshold: '85', criticalThreshold: '70',
  status: 'active',
}

// ─── MetricConfigFields ───────────────────────────────────────────────────────

function MetricConfigFields({
  form, setForm, tableColumns, templateMode = false, multiColumnMode = false,
}: {
  form: RuleForm
  setForm: React.Dispatch<React.SetStateAction<RuleForm>>
  tableColumns: string[]
  templateMode?: boolean
  multiColumnMode?: boolean
}) {
  const set = (field: keyof RuleForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const toggleCol = (col: string) =>
    setForm(prev => ({
      ...prev,
      columns: prev.columns.includes(col)
        ? prev.columns.filter(c => c !== col)
        : [...prev.columns, col],
    }))

  const mt = form.metricType

  if (!mt) return null

  return (
    <div className="space-y-3 border border-blue-100 bg-blue-50/40 rounded-lg p-4">
      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Thông số kiểm tra</p>

      {/* Single column picker — hidden in templateMode; also hidden when multiColumnMode ON */}
      {!templateMode && !multiColumnMode && SINGLE_COL_METRICS.includes(mt as MetricType) && (
        <div className="space-y-1">
          <Label className="text-sm">Cột kiểm tra <span className="text-red-500">*</span></Label>
          {tableColumns.length > 0 ? (
            <Select value={form.column} onChange={set('column')}>
              <option value="">-- Chọn cột --</option>
              {tableColumns.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          ) : (
            <Input value={form.column} onChange={set('column')} placeholder="Nhập tên cột..." />
          )}
        </div>
      )}

      {/* Multi-column picker (B1) — khi multiColumnMode ON, cho phép chọn nhiều cột → tạo N rules */}
      {!templateMode && multiColumnMode && SINGLE_COL_METRICS.includes(mt as MetricType) && (
        <div className="space-y-1.5">
          <Label className="text-sm inline-flex items-center gap-1">
            Chọn nhiều cột áp cùng loại kiểm tra <span className="text-red-500">*</span>
            <InfoTooltip text="Khi bật chế độ tạo hàng loạt, mỗi cột được chọn sẽ sinh ra 1 rule độc lập với cùng cấu hình metric/threshold. VD: chọn 10 cột cho metric not_null → tạo 10 rule." />
          </Label>
          {tableColumns.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-1.5">
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, columns: [...tableColumns] }))}
                  className="text-xs px-2 py-0.5 rounded border border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, columns: [] }))}
                  className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Bỏ chọn
                </button>
                <span className="text-xs text-gray-500">
                  {form.columns.length}/{tableColumns.length} cột đã chọn
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-white rounded border border-blue-200">
                {tableColumns.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCol(c)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                      form.columns.includes(c)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <Input
              value={form.columns.join(', ')}
              onChange={e => setForm(p => ({ ...p, columns: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              placeholder="col1, col2, col3"
            />
          )}
        </div>
      )}

      {/* Multi-column picker — hidden in templateMode */}
      {!templateMode && mt === 'duplicate_composite' && (
        <div className="space-y-1">
          <Label className="text-sm">Chọn các cột tạo thành khóa duy nhất <span className="text-red-500">*</span></Label>
          {tableColumns.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {tableColumns.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCol(c)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    form.columns.includes(c)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <Input value={form.columns.join(', ')} onChange={e => setForm(p => ({ ...p, columns: e.target.value.split(',').map(s => s.trim()) }))} placeholder="col1, col2, col3" />
          )}
          {form.columns.length > 0 && (
            <p className="text-xs text-blue-600">Đã chọn: {form.columns.join(', ')}</p>
          )}
        </div>
      )}

      {/* Fill rate threshold */}
      {mt === 'fill_rate' && (
        <div className="space-y-1">
          <Label className="text-sm">Tỷ lệ điền tối thiểu (%) <span className="text-red-500">*</span></Label>
          <Input type="number" min={0} max={100} value={form.minFillPct} onChange={set('minFillPct')} placeholder="95" className="w-32" />
        </div>
      )}

      {/* Regex pattern */}
      {mt === 'format_regex' && (
        <div className="space-y-1">
          <Label className="text-sm">Biểu thức chính quy <span className="text-red-500">*</span></Label>
          <Input value={form.pattern} onChange={set('pattern')} placeholder="^[0-9]{10}$" className="font-mono text-sm" />
          <p className="text-xs text-gray-500">Ví dụ SĐT: <code className="bg-gray-100 px-1 rounded">^(03|07|08|09)\d{8}$</code></p>
        </div>
      )}

      {/* Value range */}
      {mt === 'value_range' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Giá trị tối thiểu</Label>
            <Input type="number" value={form.minValue} onChange={set('minValue')} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Giá trị tối đa</Label>
            <Input type="number" value={form.maxValue} onChange={set('maxValue')} placeholder="1000000000" />
          </div>
        </div>
      )}

      {/* Allowed values */}
      {mt === 'allowed_values' && (
        <div className="space-y-1">
          <Label className="text-sm">Danh sách giá trị hợp lệ <span className="text-red-500">*</span></Label>
          <Textarea
            rows={3}
            value={form.allowedValues}
            onChange={set('allowedValues')}
            placeholder="ACTIVE, INACTIVE, PENDING (mỗi giá trị cách nhau bằng dấu phẩy)"
          />
        </div>
      )}

      {/* Custom expression */}
      {mt === 'custom_expression' && (
        <div className="space-y-1">
          <Label className="text-sm">Điều kiện kiểm tra <span className="text-red-500">*</span></Label>
          <Textarea
            rows={3}
            value={form.expression}
            onChange={set('expression')}
            placeholder="Ví dụ: TRANG_THAI IN (1,2,3) AND MA_KH IS NOT NULL"
            className="font-mono text-xs"
          />
          <p className="text-xs text-gray-500">Nhập điều kiện WHERE (không bao gồm từ khóa WHERE). Hỗ trợ cả biểu thức chéo cột, VD: NGAY_KET_THUC &gt; NGAY_HIEU_LUC</p>
        </div>
      )}

      {/* Referential integrity */}
      {mt === 'referential_integrity' && (
        <>
          {!templateMode && (
          <div className="space-y-1">
            <Label className="text-sm">Cột nguồn <span className="text-red-500">*</span></Label>
            {tableColumns.length > 0 ? (
              <Select value={form.column} onChange={set('column')}>
                <option value="">-- Chọn cột --</option>
                {tableColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            ) : (
              <Input value={form.column} onChange={set('column')} placeholder="Cột nguồn..." />
            )}
          </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Bảng tham chiếu <span className="text-red-500">*</span></Label>
              <Select value={form.refTable} onChange={set('refTable')}>
                <option value="">-- Chọn bảng --</option>
                {mockDataSources.map(ds => <option key={ds.id} value={ds.tableName}>{ds.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Cột tham chiếu <span className="text-red-500">*</span></Label>
              <Input value={form.refColumn} onChange={set('refColumn')} placeholder="MA_KH, MA_SP..." />
            </div>
          </div>
        </>
      )}

      {/* Reference match */}
      {mt === 'reference_match' && (
        <>
          {!templateMode && (
          <div className="space-y-1">
            <Label className="text-sm">Cột so sánh (nguồn) <span className="text-red-500">*</span></Label>
            {tableColumns.length > 0 ? (
              <Select value={form.sourceColumn} onChange={set('sourceColumn')}>
                <option value="">-- Chọn cột --</option>
                {tableColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            ) : (
              <Input value={form.sourceColumn} onChange={set('sourceColumn')} placeholder="Cột nguồn..." />
            )}
          </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Bảng chuẩn <span className="text-red-500">*</span></Label>
              <Select value={form.refTable} onChange={set('refTable')}>
                <option value="">-- Chọn bảng chuẩn --</option>
                {mockDataSources.map(ds => <option key={ds.id} value={ds.tableName}>{ds.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Cột chuẩn <span className="text-red-500">*</span></Label>
              <Input value={form.refColumn} onChange={set('refColumn')} placeholder="Cột tham chiếu..." />
            </div>
          </div>
        </>
      )}

      {/* On-time SLA */}
      {mt === 'on_time' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Thời hạn SLA (HH:MM) <span className="text-red-500">*</span></Label>
            <Input type="time" value={form.slaTime} onChange={set('slaTime')} />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Cửa sổ cảnh báo (phút)</Label>
            <Input type="number" min={0} value={form.alertWindowMinutes} onChange={set('alertWindowMinutes')} placeholder="30" />
          </div>
        </div>
      )}

      {/* Freshness */}
      {mt === 'freshness' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Dữ liệu tươi trong <span className="text-red-500">*</span></Label>
            <Input type="number" min={1} value={form.maxAge} onChange={set('maxAge')} placeholder="24" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Đơn vị thời gian</Label>
            <Select value={form.maxAgeUnit} onChange={set('maxAgeUnit')}>
              <option value="minutes">Phút</option>
              <option value="hours">Giờ</option>
              <option value="days">Ngày</option>
            </Select>
          </div>
        </div>
      )}

      {/* Blacklist pattern */}
      {mt === 'blacklist_pattern' && (
        <div className="space-y-1">
          <Label className="text-sm">Pattern blacklist (regex, dùng | để OR) <span className="text-red-500">*</span></Label>
          <Input value={form.blacklistPattern} onChange={set('blacklistPattern')} placeholder="TEST|FAKE|N/A|0000-00-00" />
          <p className="text-xs text-gray-500">Giá trị khớp pattern sẽ bị coi là vi phạm. VD: TEST|NULL|^-$</p>
        </div>
      )}

      {/* Null rate by period */}
      {mt === 'null_rate_by_period' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Cột thời gian <span className="text-red-500">*</span></Label>
              {tableColumns.length > 0 ? (
                <Select value={form.timeColumn} onChange={set('timeColumn')}>
                  <option value="">-- Chọn cột --</option>
                  {tableColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              ) : (
                <Input value={form.timeColumn} onChange={set('timeColumn')} placeholder="NGAY_TAO" />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Độ chi tiết</Label>
              <Select value={form.granularity} onChange={set('granularity')}>
                <option value="day">Ngày</option>
                <option value="week">Tuần</option>
                <option value="month">Tháng</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Khoảng kiểm (số ngày)</Label>
              <Input type="number" min={1} value={form.coverageDays} onChange={set('coverageDays')} placeholder="30" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">% Null tối đa mỗi chu kỳ <span className="text-red-500">*</span></Label>
              <Input type="number" min={0} max={100} value={form.maxNullPct} onChange={set('maxNullPct')} placeholder="5" />
            </div>
          </div>
        </>
      )}

      {/* Conditional not-null */}
      {mt === 'conditional_not_null' && (
        <div className="space-y-1">
          <Label className="text-sm">Điều kiện SQL WHERE (khi nào cột bắt buộc có giá trị) <span className="text-red-500">*</span></Label>
          <Textarea rows={2} value={form.condition} onChange={set('condition')} placeholder="TRANG_THAI = 'ACTIVE'" />
          <p className="text-xs text-gray-500">VD: TRANG_THAI = 'ACTIVE' → cột phải NOT NULL khi TRANG_THAI là ACTIVE</p>
        </div>
      )}

      {/* Fixed datatype */}
      {mt === 'fixed_datatype' && (
        <div className="space-y-1">
          <Label className="text-sm">Kiểu dữ liệu bắt buộc <span className="text-red-500">*</span></Label>
          <Select value={form.dataType} onChange={set('dataType')}>
            <option value="STRING">STRING (chuỗi ký tự)</option>
            <option value="INTEGER">INTEGER (số nguyên)</option>
            <option value="DECIMAL">DECIMAL (số thập phân)</option>
            <option value="DATE">DATE (ngày tháng)</option>
            <option value="TIMESTAMP">TIMESTAMP (ngày giờ)</option>
          </Select>
        </div>
      )}

      {/* Mode check */}
      {mt === 'mode_check' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Giá trị mode kỳ vọng (tùy chọn)</Label>
            <Input value={form.modeValue} onChange={set('modeValue')} placeholder="TD" />
            <p className="text-xs text-gray-500">Để trống = chỉ kiểm tra tần suất</p>
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Tần suất tối thiểu (%) <span className="text-red-500">*</span></Label>
            <Input type="number" min={1} max={100} value={form.minFreqPct} onChange={set('minFreqPct')} placeholder="50" />
          </div>
        </div>
      )}

      {/* Statistics bound */}
      {mt === 'statistics_bound' && (
        <>
          <div className="space-y-1">
            <Label className="text-sm">Loại thống kê <span className="text-red-500">*</span></Label>
            <Select value={form.statisticType} onChange={set('statisticType')}>
              <option value="min">Min (giá trị nhỏ nhất)</option>
              <option value="max">Max (giá trị lớn nhất)</option>
              <option value="mean">Mean (trung bình)</option>
              <option value="stddev">Stddev (độ lệch chuẩn)</option>
              <option value="p25">P25 (percentile 25%)</option>
              <option value="p50">P50 (median)</option>
              <option value="p75">P75 (percentile 75%)</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Khoảng tối thiểu</Label>
              <Input type="number" value={form.minValue} onChange={set('minValue')} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Khoảng tối đa</Label>
              <Input type="number" value={form.maxValue} onChange={set('maxValue')} placeholder="1000000" />
            </div>
          </div>
        </>
      )}

      {/* Sum range */}
      {mt === 'sum_range' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Tổng tối thiểu</Label>
            <Input type="number" value={form.minValue} onChange={set('minValue')} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Tổng tối đa</Label>
            <Input type="number" value={form.maxValue} onChange={set('maxValue')} placeholder="1000000000" />
          </div>
        </div>
      )}

      {/* Expression pct */}
      {mt === 'expression_pct' && (
        <>
          <div className="space-y-1">
            <Label className="text-sm">Biểu thức SparkSQL (cross-column) <span className="text-red-500">*</span></Label>
            <Textarea rows={2} value={form.expression} onChange={set('expression')} placeholder="SO_TIEN > 0 AND MA_TK IS NOT NULL" />
            <p className="text-xs text-gray-500">Biểu thức trả về true/false cho từng dòng</p>
          </div>
          <div className="space-y-1">
            <Label className="text-sm">% dòng phải pass tối thiểu <span className="text-red-500">*</span></Label>
            <Input type="number" min={0} max={100} value={form.minPassPct} onChange={set('minPassPct')} placeholder="99" />
          </div>
        </>
      )}

      {/* Row count (table-level) */}
      {mt === 'row_count' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Số dòng tối thiểu</Label>
            <Input type="number" min={0} value={form.minRows} onChange={set('minRows')} placeholder="1" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Số dòng tối đa</Label>
            <Input type="number" min={0} value={form.maxRows} onChange={set('maxRows')} placeholder="10000000" />
          </div>
        </div>
      )}

      {/* Time coverage (table-level) */}
      {mt === 'time_coverage' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Cột thời gian <span className="text-red-500">*</span></Label>
              {tableColumns.length > 0 ? (
                <Select value={form.timeColumn} onChange={set('timeColumn')}>
                  <option value="">-- Chọn cột --</option>
                  {tableColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              ) : (
                <Input value={form.timeColumn} onChange={set('timeColumn')} placeholder="NGAY_GD" />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Độ chi tiết</Label>
              <Select value={form.granularity} onChange={set('granularity')}>
                <option value="day">Ngày</option>
                <option value="week">Tuần</option>
                <option value="month">Tháng</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Khoảng kiểm (số ngày)</Label>
              <Input type="number" min={1} value={form.coverageDays} onChange={set('coverageDays')} placeholder="30" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">% chu kỳ phải có dữ liệu <span className="text-red-500">*</span></Label>
              <Input type="number" min={1} max={100} value={form.minCoveragePct} onChange={set('minCoveragePct')} placeholder="95" />
            </div>
          </div>
        </>
      )}

      {/* Volume change (table-level) */}
      {mt === 'volume_change' && (
        <>
          <div className="space-y-1">
            <Label className="text-sm">Cột thời gian</Label>
            <Input value={form.timeColumn} onChange={set('timeColumn')} placeholder="VD: NGAY_GD" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Nhìn lại N ngày trước <span className="text-red-500">*</span></Label>
              <Input type="number" min={1} value={form.lookbackPeriod} onChange={set('lookbackPeriod')} placeholder="7" />
              <p className="text-xs text-gray-500">So sánh số dòng với trung bình N ngày gần nhất</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">% thay đổi tối đa cho phép <span className="text-red-500">*</span></Label>
              <Input type="number" min={1} max={100} value={form.maxChangePct} onChange={set('maxChangePct')} placeholder="30" />
            </div>
          </div>
        </>
      )}

      {/* Table size (table-level) */}
      {mt === 'table_size' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Kích thước tối thiểu</Label>
              <Input type="number" min={0} value={form.tableSizeMin} onChange={set('tableSizeMin')} placeholder="1" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Kích thước tối đa</Label>
              <Input type="number" min={0} value={form.tableSizeMax} onChange={set('tableSizeMax')} placeholder="500" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Đơn vị</Label>
              <Select value={form.tableSizeUnit} onChange={set('tableSizeUnit')}>
                <option value="MB">MB</option>
                <option value="GB">GB</option>
              </Select>
            </div>
          </div>
        </>
      )}

      {/* Aggregate reconciliation (report) */}
      {mt === 'aggregate_reconciliation' && (
        <>
          <div className="space-y-1">
            <Label className="text-sm">Bảng nguồn liên kết <span className="text-red-500">*</span></Label>
            <Select value={form.sourceTableId} onChange={set('sourceTableId')}>
              <option value="">-- Chọn bảng nguồn --</option>
              {mockDataSources.filter(d => d.moduleType === 'source').map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Cột nguồn (SUM)</Label>
            <Input value={form.sourceColumn} onChange={set('sourceColumn')} placeholder="VD: SO_TIEN" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Cột tổng hợp trên BC <span className="text-red-500">*</span></Label>
              {tableColumns.length > 0 ? (
                <Select value={form.reportColumn} onChange={set('reportColumn')}>
                  <option value="">-- Chọn cột --</option>
                  {tableColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              ) : (
                <Input value={form.reportColumn} onChange={set('reportColumn')} placeholder="THUC_TE" />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Sai lệch tối đa (%)</Label>
              <Input type="number" min={0} max={100} value={form.tolerancePct} onChange={set('tolerancePct')} placeholder="5" />
            </div>
          </div>
        </>
      )}

      {/* Report row count match */}
      {mt === 'report_row_count_match' && (
        <>
          <div className="space-y-1">
            <Label className="text-sm">Bảng nguồn liên kết <span className="text-red-500">*</span></Label>
            <Select value={form.sourceTableId} onChange={set('sourceTableId')}>
              <option value="">-- Chọn bảng nguồn --</option>
              {mockDataSources.filter(d => d.moduleType === 'source').map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
            </Select>
            <p className="text-xs text-gray-500">So sánh COUNT(*) giữa bảng báo cáo và bảng nguồn</p>
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Sai lệch tối đa (%)</Label>
            <Input type="number" min={0} max={100} value={form.tolerancePct} onChange={set('tolerancePct')} placeholder="VD: 5" />
          </div>
        </>
      )}

      {/* KPI variance */}
      {mt === 'kpi_variance' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Cột chỉ tiêu KPI</Label>
              <Input value={form.column} onChange={set('column')} placeholder="VD: TONG_TIEN" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Cột thời gian</Label>
              <Input value={form.timeColumn} onChange={set('timeColumn')} placeholder="VD: NGAY" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Chu kỳ so sánh</Label>
              <Select value={form.granularity} onChange={set('granularity')}>
                <option value="">-- Chọn --</option>
                <option value="day">Ngày</option>
                <option value="week">Tuần</option>
                <option value="month">Tháng</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Biến động tối đa so kỳ trước (%) <span className="text-red-500">*</span></Label>
            <Input type="number" min={0} max={100} value={form.maxVariancePct} onChange={set('maxVariancePct')} placeholder="30" />
            <p className="text-xs text-gray-500">KPI thay đổi vượt ngưỡng này sẽ bị cảnh báo</p>
          </div>
        </>
      )}

      {/* Parent-child match (KPI) */}
      {mt === 'parent_child_match' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Cột KPI cha <span className="text-red-500">*</span></Label>
              {tableColumns.length > 0 ? (
                <Select value={form.parentKpiColumn} onChange={set('parentKpiColumn')}>
                  <option value="">-- Chọn cột --</option>
                  {tableColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              ) : (
                <Input value={form.parentKpiColumn} onChange={set('parentKpiColumn')} placeholder="TONG_GD" />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Sai lệch tối đa (%)</Label>
              <Input type="number" min={0} max={100} value={form.tolerancePct} onChange={set('tolerancePct')} placeholder="5" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Biểu thức tổng KPI con</Label>
            <Input value={form.childSumExpression} onChange={set('childSumExpression')} placeholder="SUM(sub_kpi_value)" className="font-mono text-sm" />
          </div>
        </>
      )}
    </div>
  )
}

// ─── Rule Dialog (Add / Edit) ─────────────────────────────────────────────────

function formToMetricConfig(form: RuleForm): MetricConfig | undefined {
  if (!form.metricType) return undefined
  const mt = form.metricType as MetricType
  const base: MetricConfig = { metricType: mt }
  switch (mt) {
    case 'not_null': return { ...base, column: form.column }
    case 'fill_rate': return { ...base, column: form.column, minFillPct: Number(form.minFillPct) }
    case 'format_regex': return { ...base, column: form.column, pattern: form.pattern }
    case 'value_range': return { ...base, column: form.column, minValue: Number(form.minValue), maxValue: Number(form.maxValue) }
    case 'allowed_values': return { ...base, column: form.column, allowedValues: form.allowedValues.split(',').map(s => s.trim()).filter(Boolean) }
    case 'custom_expression': return { ...base, expression: form.expression }
    case 'referential_integrity': return { ...base, column: form.column, refTable: form.refTable, refColumn: form.refColumn }
    case 'duplicate_single': return { ...base, column: form.column }
    case 'duplicate_composite': return { ...base, columns: form.columns }
    case 'reference_match': return { ...base, sourceColumn: form.sourceColumn, refTable: form.refTable, refColumn: form.refColumn }
    case 'on_time': return { ...base, column: form.column, slaTime: form.slaTime, alertWindowMinutes: Number(form.alertWindowMinutes) }
    case 'freshness': return { ...base, column: form.column, maxAge: Number(form.maxAge), maxAgeUnit: form.maxAgeUnit }
    // New metrics
    case 'blacklist_pattern': return { ...base, column: form.column, blacklistPattern: form.blacklistPattern }
    case 'null_rate_by_period': return { ...base, column: form.column, timeColumn: form.timeColumn, granularity: form.granularity, coverageDays: Number(form.coverageDays), maxNullPct: Number(form.maxNullPct) }
    case 'conditional_not_null': return { ...base, column: form.column, condition: form.condition }
    case 'fixed_datatype': return { ...base, column: form.column, dataType: form.dataType }
    case 'mode_check': return { ...base, column: form.column, modeValue: form.modeValue || undefined, minFreqPct: Number(form.minFreqPct) }
    case 'statistics_bound': return { ...base, column: form.column, statisticType: form.statisticType, minValue: form.minValue ? Number(form.minValue) : undefined, maxValue: form.maxValue ? Number(form.maxValue) : undefined }
    case 'sum_range': return { ...base, column: form.column, minValue: form.minValue ? Number(form.minValue) : undefined, maxValue: form.maxValue ? Number(form.maxValue) : undefined }
    case 'expression_pct': return { ...base, expression: form.expression, minPassPct: Number(form.minPassPct) }
    case 'row_count': return { ...base, minRows: form.minRows ? Number(form.minRows) : undefined, maxRows: form.maxRows ? Number(form.maxRows) : undefined }
    case 'time_coverage': return { ...base, timeColumn: form.timeColumn, granularity: form.granularity, coverageDays: Number(form.coverageDays), minCoveragePct: Number(form.minCoveragePct) }
    case 'volume_change': return { ...base, timeColumn: form.timeColumn, lookbackPeriod: Number(form.lookbackPeriod), maxChangePct: Number(form.maxChangePct) }
    case 'table_size': return { ...base, tableSizeMin: form.tableSizeMin ? Number(form.tableSizeMin) : undefined, tableSizeMax: form.tableSizeMax ? Number(form.tableSizeMax) : undefined, tableSizeUnit: form.tableSizeUnit }
    // Report/KPI metrics
    case 'aggregate_reconciliation': return { ...base, sourceTableId: form.sourceTableId, sourceColumn: form.sourceColumn, reportColumn: form.reportColumn, tolerancePct: Number(form.tolerancePct) }
    case 'report_row_count_match': return { ...base, sourceTableId: form.sourceTableId, tolerancePct: form.tolerancePct ? Number(form.tolerancePct) : undefined }
    case 'kpi_variance': return { ...base, column: form.column, timeColumn: form.timeColumn, granularity: form.granularity, maxVariancePct: Number(form.maxVariancePct) }
    case 'parent_child_match': return { ...base, parentKpiColumn: form.parentKpiColumn, childSumExpression: form.childSumExpression || undefined, tolerancePct: Number(form.tolerancePct) }
    default: return base
  }
}

function ruleToForm(rule: QualityRule): RuleForm {
  const cfg = rule.metricConfig
  return {
    name: rule.name,
    description: rule.description,
    dimension: rule.dimension,
    metricType: cfg?.metricType ?? '',
    tableId: rule.tableId,
    column: cfg?.column ?? rule.columnName ?? '',
    columns: cfg?.columns ?? [],
    pattern: cfg?.pattern ?? '',
    blacklistPattern: cfg?.blacklistPattern ?? '',
    minValue: String(cfg?.minValue ?? ''),
    maxValue: String(cfg?.maxValue ?? ''),
    allowedValues: (cfg?.allowedValues ?? []).join(', '),
    refTable: cfg?.refTable ?? '',
    refColumn: cfg?.refColumn ?? '',
    sourceColumn: cfg?.sourceColumn ?? '',
    slaTime: cfg?.slaTime ?? '08:00',
    alertWindowMinutes: String(cfg?.alertWindowMinutes ?? '30'),
    maxAge: String(cfg?.maxAge ?? '24'),
    maxAgeUnit: cfg?.maxAgeUnit ?? 'hours',
    minFillPct: String(cfg?.minFillPct ?? '95'),
    expression: cfg?.expression ?? rule.expression ?? '',
    timeColumn: cfg?.timeColumn ?? '',
    granularity: cfg?.granularity ?? 'day',
    coverageDays: String(cfg?.coverageDays ?? '30'),
    maxNullPct: String(cfg?.maxNullPct ?? '5'),
    minCoveragePct: String(cfg?.minCoveragePct ?? '95'),
    condition: cfg?.condition ?? '',
    dataType: cfg?.dataType ?? 'STRING',
    modeValue: cfg?.modeValue ?? '',
    minFreqPct: String(cfg?.minFreqPct ?? '50'),
    statisticType: cfg?.statisticType ?? 'mean',
    minPassPct: String(cfg?.minPassPct ?? '99'),
    minRows: String(cfg?.minRows ?? ''),
    maxRows: String(cfg?.maxRows ?? ''),
    lookbackPeriod: String(cfg?.lookbackPeriod ?? '7'),
    maxChangePct: String(cfg?.maxChangePct ?? '30'),
    tableSizeMin: String(cfg?.tableSizeMin ?? ''),
    tableSizeMax: String(cfg?.tableSizeMax ?? ''),
    tableSizeUnit: cfg?.tableSizeUnit ?? 'MB',
    sourceTableId: cfg?.sourceTableId ?? '',
    reportColumn: cfg?.reportColumn ?? '',
    tolerancePct: String(cfg?.tolerancePct ?? '5'),
    maxVariancePct: String(cfg?.maxVariancePct ?? '30'),
    parentKpiColumn: cfg?.parentKpiColumn ?? '',
    childSumExpression: cfg?.childSumExpression ?? '',
    warningThreshold: String(rule.threshold.warning),
    criticalThreshold: String(rule.threshold.critical),
    status: rule.status,
  }
}

function templateToForm(tmpl: RuleTemplate): Partial<RuleForm> {
  const cfg = tmpl.metricConfig
  return {
    name: '',
    description: tmpl.description,
    dimension: tmpl.dimension,
    metricType: cfg?.metricType ?? '',
    column: cfg?.column ?? '',
    columns: cfg?.columns ?? [],
    pattern: cfg?.pattern ?? '',
    blacklistPattern: cfg?.blacklistPattern ?? '',
    minValue: String(cfg?.minValue ?? ''),
    maxValue: String(cfg?.maxValue ?? ''),
    allowedValues: (cfg?.allowedValues ?? []).join(', '),
    refTable: cfg?.refTable ?? '',
    refColumn: cfg?.refColumn ?? '',
    sourceColumn: cfg?.sourceColumn ?? '',
    slaTime: cfg?.slaTime ?? '08:00',
    alertWindowMinutes: String(cfg?.alertWindowMinutes ?? '30'),
    maxAge: String(cfg?.maxAge ?? '24'),
    maxAgeUnit: cfg?.maxAgeUnit ?? 'hours',
    minFillPct: String(cfg?.minFillPct ?? '95'),
    expression: cfg?.expression ?? tmpl.expression ?? '',
    timeColumn: cfg?.timeColumn ?? '',
    granularity: cfg?.granularity ?? 'day',
    coverageDays: String(cfg?.coverageDays ?? '30'),
    maxNullPct: String(cfg?.maxNullPct ?? ''),
    minCoveragePct: String(cfg?.minCoveragePct ?? '95'),
    condition: cfg?.condition ?? '',
    dataType: cfg?.dataType ?? 'STRING',
    modeValue: cfg?.modeValue ?? '',
    minFreqPct: String(cfg?.minFreqPct ?? ''),
    statisticType: cfg?.statisticType ?? 'mean',
    minPassPct: String(cfg?.minPassPct ?? '99'),
    minRows: String(cfg?.minRows ?? ''),
    maxRows: String(cfg?.maxRows ?? ''),
    lookbackPeriod: String(cfg?.lookbackPeriod ?? '7'),
    maxChangePct: String(cfg?.maxChangePct ?? '30'),
    tableSizeMin: String(cfg?.tableSizeMin ?? ''),
    tableSizeMax: String(cfg?.tableSizeMax ?? ''),
    tableSizeUnit: cfg?.tableSizeUnit ?? 'MB',
    sourceTableId: cfg?.sourceTableId ?? '',
    reportColumn: cfg?.reportColumn ?? '',
    tolerancePct: String(cfg?.tolerancePct ?? '5'),
    maxVariancePct: String(cfg?.maxVariancePct ?? '30'),
    parentKpiColumn: cfg?.parentKpiColumn ?? '',
    childSumExpression: cfg?.childSumExpression ?? '',
  }
}

interface RuleDialogProps {
  open: boolean
  editRule?: QualityRule | null
  initialForm?: Partial<RuleForm>
  onClose: () => void
  onSave: (rule: QualityRule) => void
}

function RuleDialog({ open, editRule, initialForm, onClose, onSave }: RuleDialogProps) {
  const [form, setForm] = useState<RuleForm>(EMPTY_FORM)
  const [multiColumnMode, setMultiColumnMode] = useState(false)

  useEffect(() => {
    if (open) {
      if (editRule) {
        setForm(ruleToForm(editRule))
        setMultiColumnMode(false)
      } else if (initialForm) {
        setForm({ ...EMPTY_FORM, ...initialForm })
        setMultiColumnMode(false)
      } else {
        setForm(EMPTY_FORM)
        setMultiColumnMode(false)
      }
    }
  }, [open, editRule, initialForm])

  const set = (field: keyof RuleForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const tableColumns = COLUMNS_BY_TABLE[form.tableId] ?? []

  const metricsForDim = form.dimension ? METRICS_BY_DIMENSION[form.dimension] : []

  const handleDimChange = (dim: QualityDimension) => {
    const thr = form.tableId ? getTableThreshold(form.tableId, dim) : getGlobalThreshold(dim)
    setForm(prev => ({
      ...prev,
      dimension: dim,
      metricType: '',
      warningThreshold: String(thr.warning),
      criticalThreshold: String(thr.critical),
    }))
  }

  const canBatch = !editRule && SINGLE_COL_METRICS.includes(form.metricType as MetricType)
  const effectiveMultiMode = canBatch && multiColumnMode

  const isValid =
    form.name.trim() &&
    form.dimension &&
    form.metricType &&
    form.tableId &&
    (!effectiveMultiMode || form.columns.length > 0)

  const handleSave = () => {
    if (!isValid) return
    const ds = mockDataSources.find(d => d.id === form.tableId)
    const now = new Date().toISOString()

    if (effectiveMultiMode) {
      // Tạo N rules — một rule / cột
      const baseTs = Date.now()
      form.columns.forEach((col, idx) => {
        const perColForm: RuleForm = { ...form, column: col, columns: [] }
        const rule: QualityRule = {
          id: `rule-${baseTs}-${idx}`,
          name: `${form.name.trim()} — ${col}`,
          description: form.description.trim(),
          dimension: form.dimension as QualityDimension,
          tableId: form.tableId,
          tableName: ds?.tableName ?? form.tableId,
          columnName: col,
          metricConfig: formToMetricConfig(perColForm),
          threshold: {
            warning: Number(form.warningThreshold) || 85,
            critical: Number(form.criticalThreshold) || 70,
          },
          status: form.status,
          createdBy: 'Người dùng hiện tại',
          createdAt: now,
        }
        onSave(rule)
      })
      onClose()
      return
    }

    const rule: QualityRule = {
      id: editRule?.id ?? `rule-${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim(),
      dimension: form.dimension as QualityDimension,
      tableId: form.tableId,
      tableName: ds?.tableName ?? form.tableId,
      columnName: form.column || undefined,
      metricConfig: formToMetricConfig(form),
      threshold: {
        warning: Number(form.warningThreshold) || 85,
        critical: Number(form.criticalThreshold) || 70,
      },
      status: form.status,
      createdBy: editRule?.createdBy ?? 'Người dùng hiện tại',
      createdAt: editRule?.createdAt ?? now,
      lastRunAt: editRule?.lastRunAt,
      lastResult: editRule?.lastResult,
      lastScore: editRule?.lastScore,
    }
    onSave(rule)
    onClose()
  }

  const selectedMetricDef = metricsForDim.find(m => m.value === form.metricType)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editRule ? 'Chỉnh sửa quy tắc' : 'Thêm quy tắc mới'}
      size="lg"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

        {/* Name + Description */}
        <div className="space-y-1.5">
          <Label>Tên quy tắc <span className="text-red-500">*</span></Label>
          <Input value={form.name} onChange={set('name')} placeholder="Ví dụ: Kiểm tra số điện thoại khách hàng" />
        </div>
        <div className="space-y-1.5">
          <Label>Mô tả</Label>
          <Textarea rows={2} value={form.description} onChange={set('description')} placeholder="Mô tả ngắn gọn quy tắc..." />
        </div>

        {/* Table + Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Bảng dữ liệu <span className="text-red-500">*</span></Label>
            <Select value={form.tableId} onChange={set('tableId')}>
              <option value="">-- Chọn bảng --</option>
              {mockDataSources.map(ds => (
                <option key={ds.id} value={ds.id}>{ds.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Kích hoạt ngay</Label>
            <div className="flex items-center gap-3 h-9">
              <Switch
                checked={form.status === 'active'}
                onCheckedChange={v => setForm(prev => ({ ...prev, status: v ? 'active' : 'inactive' }))}
              />
              <span className="text-sm text-gray-600">{form.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}</span>
            </div>
          </div>
        </div>

        {/* Dimension */}
        <div className="space-y-1.5">
          <Label className="inline-flex items-center gap-1">Chiều dữ liệu (Dimension) <span className="text-red-500">*</span> <InfoTooltip text="6 chiều đo lường chất lượng dữ liệu:
• Completeness (đầy đủ)
• Validity (hợp lệ)
• Consistency (nhất quán)
• Uniqueness (duy nhất)
• Accuracy (chính xác)
• Timeliness (kịp thời)
Mỗi rule thuộc 1 chiều." /></Label>
          <div className="grid grid-cols-3 gap-2">
            {DIMENSIONS.map(d => {
              const cfg = DIMENSION_CONFIG[d]
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDimChange(d)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all text-left',
                    form.dimension === d
                      ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm`
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  )}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Metric type — only shown after dimension is picked */}
        {form.dimension && (
          <div className="space-y-1.5">
            <Label className="inline-flex items-center gap-1">Chỉ số kiểm tra (Metric) <span className="text-red-500">*</span> <InfoTooltip text="Chỉ số cụ thể để kiểm tra rule. Mỗi chiều có các metric riêng. VD: Completeness có not_null, fill_rate; Validity có format_regex, value_range, allowed_values..." /></Label>
            <Select value={form.metricType} onChange={e => setForm(prev => ({ ...prev, metricType: e.target.value as MetricType }))}>
              <option value="">-- Chọn loại kiểm tra --</option>
              {metricsForDim.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
            {selectedMetricDef && (
              <p className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded border border-gray-100">
                {selectedMetricDef.hint}
              </p>
            )}
          </div>
        )}

        {/* Chế độ tạo nhiều rules cùng lúc (B1) — chỉ hiển thị khi tạo mới + metric nhận cột đơn */}
        {canBatch && (
          <div className={cn(
            'flex items-start gap-3 rounded-lg border p-3 transition-colors',
            multiColumnMode ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'
          )}>
            <Switch
              checked={multiColumnMode}
              onCheckedChange={v => {
                setMultiColumnMode(v)
                if (v) setForm(p => ({ ...p, column: '' }))
                else setForm(p => ({ ...p, columns: [] }))
              }}
            />
            <div className="flex-1">
              <Label className="text-sm inline-flex items-center gap-1 cursor-pointer" onClick={() => setMultiColumnMode(!multiColumnMode)}>
                Tạo nhiều rules cùng lúc (một rule / cột)
                <InfoTooltip text="Bật chế độ này để áp cùng một loại kiểm tra (metric) cho nhiều cột của bảng. Hệ thống sẽ tạo N rules độc lập, mỗi rule trên 1 cột, dùng chung cấu hình metric và ngưỡng. Phù hợp khi cần kiểm tra not_null / fill_rate / regex... cho nhiều cột trong cùng bảng." />
              </Label>
              {multiColumnMode && form.columns.length > 0 && (
                <p className="text-xs text-purple-700 mt-0.5">
                  Sẽ tạo <strong>{form.columns.length} rules</strong> — tên rule: "{form.name.trim() || '(chưa đặt tên)'} — [tên cột]"
                </p>
              )}
            </div>
          </div>
        )}

        {/* Conditional metric config fields */}
        {form.dimension && form.metricType && (
          <MetricConfigFields form={form} setForm={setForm} tableColumns={tableColumns} multiColumnMode={effectiveMultiMode} />
        )}

        {/* Thresholds — Dual Range Slider */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Ngưỡng đánh giá</Label>
          {/* Slider */}
          <div className="relative h-10 select-none">
            {/* Color zones bar */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full overflow-hidden flex">
              <div className="bg-red-400 transition-all duration-150" style={{ width: `${Number(form.criticalThreshold)}%` }} />
              <div className="bg-amber-400 transition-all duration-150" style={{ width: `${Number(form.warningThreshold) - Number(form.criticalThreshold)}%` }} />
              <div className="bg-green-400 transition-all duration-150" style={{ width: `${100 - Number(form.warningThreshold)}%` }} />
            </div>
            {/* Critical handle */}
            <input
              type="range" min={0} max={100}
              value={form.criticalThreshold}
              onChange={e => {
                const v = +e.target.value
                if (v < Number(form.warningThreshold)) setForm(f => ({ ...f, criticalThreshold: String(v) }))
              }}
              className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:border-0"
              style={{ zIndex: Number(form.criticalThreshold) > 50 ? 2 : 1 }}
            />
            {/* Warning handle */}
            <input
              type="range" min={0} max={100}
              value={form.warningThreshold}
              onChange={e => {
                const v = +e.target.value
                if (v > Number(form.criticalThreshold)) setForm(f => ({ ...f, warningThreshold: String(v) }))
              }}
              className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:border-0"
              style={{ zIndex: Number(form.warningThreshold) < 50 ? 2 : 1 }}
            />
          </div>
          {/* Legend */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-400" />
              <span className="text-red-700 font-semibold">C = {form.criticalThreshold}%</span>
              <span className="text-gray-400">Không đạt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-400" />
              <span className="text-amber-700 font-semibold">W = {form.warningThreshold}%</span>
              <span className="text-gray-400">Cảnh báo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-green-400" />
              <span className="text-gray-400">Đạt</span>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800 space-y-0.5">
          <p className="font-medium mb-1">Quy tắc đánh giá:</p>
          <p>✅ Điểm ≥ {form.warningThreshold}% → <strong>Đạt</strong></p>
          <p>⚠️ {form.criticalThreshold}% ≤ Điểm &lt; {form.warningThreshold}% → <strong>Cảnh báo</strong></p>
          <p>❌ Điểm &lt; {form.criticalThreshold}% → <strong>Không đạt</strong></p>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onClose}>Hủy</Button>
        <Button onClick={handleSave} disabled={!isValid}>
          {editRule
            ? 'Cập nhật'
            : effectiveMultiMode && form.columns.length > 0
              ? `Tạo ${form.columns.length} rules`
              : 'Lưu quy tắc'}
        </Button>
      </div>
    </Dialog>
  )
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteConfirm({ rule, onConfirm, onCancel }: { rule: QualityRule | null; onConfirm: () => void; onCancel: () => void }) {
  if (!rule) return null
  return (
    <Dialog open={!!rule} onClose={onCancel} title="Xác nhận xóa" size="sm">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <p className="text-sm text-gray-700">Bạn có chắc muốn xóa quy tắc:</p>
          <p className="font-semibold text-gray-900 mt-0.5">{rule.name}</p>
          <p className="text-xs text-gray-500 mt-1">Hành động này không thể hoàn tác.</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onCancel}>Hủy</Button>
        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onConfirm}>Xóa</Button>
      </div>
    </Dialog>
  )
}

// ─── Tab 1 – Danh sách quy tắc ───────────────────────────────────────────────

interface RuleListTabProps {
  pendingTemplate?: Partial<RuleForm> | null
  onTemplateUsed?: () => void
  pendingBulkApply?: { template: RuleTemplate; tableIds: string[] } | null
  onBulkApplyUsed?: () => void
}

function RuleListTab({ pendingTemplate, onTemplateUsed, pendingBulkApply, onBulkApplyUsed }: RuleListTabProps) {
  const [rules, setRules] = useState<QualityRule[]>([...mockRules])
  const [search, setSearch] = useState('')
  const [dimFilter, setDimFilter] = useState('all')
  const [tableFilter, setTableFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [moduleFilter, setModuleFilter] = useState<ModuleType | 'all'>('all')
  const [appliedFilter, setAppliedFilter] = useState<{ search: string; dim: string; table: string; status: string; module: string } | null>(null)
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [editRule, setEditRule] = useState<QualityRule | null>(null)
  const [deleteRule, setDeleteRule] = useState<QualityRule | null>(null)
  const [historyRule, setHistoryRule] = useState<QualityRule | null>(null)
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [runningIds, setRunningIds] = useState<Record<string, boolean>>({})
  const [switchStates, setSwitchStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(rules.map(r => [r.id, r.status === 'active']))
  )
  const [dialogInitialForm, setDialogInitialForm] = useState<Partial<RuleForm> | undefined>()

  const [bulkApplyToast, setBulkApplyToast] = useState<{ count: number; template: string } | null>(null)

  // Open add dialog with template pre-fill
  useEffect(() => {
    if (pendingTemplate) {
      setDialogInitialForm(pendingTemplate)
      setShowAdd(true)
      onTemplateUsed?.()
    }
  }, [pendingTemplate])

  // B2: Bulk apply template → tạo N rules (mỗi bảng 1 rule)
  useEffect(() => {
    if (!pendingBulkApply) return
    const { template, tableIds } = pendingBulkApply
    if (tableIds.length === 0) { onBulkApplyUsed?.(); return }
    const baseTs = Date.now()
    const now = new Date().toISOString()
    const newRules: QualityRule[] = tableIds.map((tableId, idx) => {
      const ds = mockDataSources.find(d => d.id === tableId)
      return {
        id: `rule-${baseTs}-${idx}`,
        name: `${template.name} — ${ds?.name ?? tableId}`,
        description: template.description,
        dimension: template.dimension,
        tableId,
        tableName: ds?.tableName ?? tableId,
        columnName: template.metricConfig?.column,
        metricConfig: template.metricConfig,
        threshold: { ...template.threshold },
        status: 'active',
        createdBy: 'Người dùng hiện tại',
        createdAt: now,
      }
    })
    setRules(prev => [...newRules, ...prev])
    setSwitchStates(prev => ({
      ...prev,
      ...Object.fromEntries(newRules.map(r => [r.id, true])),
    }))
    setBulkApplyToast({ count: newRules.length, template: template.name })
    setTimeout(() => setBulkApplyToast(null), 5000)
    onBulkApplyUsed?.()
  }, [pendingBulkApply])

  const handleSearch = () => { setAppliedFilter({ search, dim: dimFilter, table: tableFilter, status: statusFilter, module: moduleFilter }); setPage(1) }
  const handleClear = () => { setSearch(''); setDimFilter('all'); setTableFilter('all'); setStatusFilter('all'); setModuleFilter('all'); setAppliedFilter(null); setPage(1) }

  const filtered = rules.filter(r => {
    const f = appliedFilter ?? { search: '', dim: 'all', table: 'all', status: 'all', module: 'all' }
    if (f.search && !r.name.toLowerCase().includes(f.search.toLowerCase())) return false
    if (f.dim !== 'all' && r.dimension !== f.dim) return false
    if (f.table !== 'all' && r.tableId !== f.table) return false
    if (f.status !== 'all' && r.status !== f.status) return false
    if (f.module !== 'all') {
      const ds = mockDataSources.find(d => d.id === r.tableId)
      if (ds && ds.moduleType !== f.module) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSave = (rule: QualityRule) => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === rule.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = rule
        return next
      }
      return [rule, ...prev]
    })
    setSwitchStates(prev => ({ ...prev, [rule.id]: rule.status === 'active' }))
  }

  const handleDelete = () => {
    if (!deleteRule) return
    setRules(prev => prev.filter(r => r.id !== deleteRule.id))
    setDeleteRule(null)
  }

  const handleRunNow = (id: string) => {
    setRunningIds(prev => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setRunningIds(prev => ({ ...prev, [id]: false }))
      const rand = Math.random()
      const result: 'pass' | 'warning' | 'fail' = rand > 0.6 ? 'pass' : rand > 0.3 ? 'warning' : 'fail'
      const score = result === 'pass'
        ? Math.floor(Math.random() * 10) + 90
        : result === 'warning'
        ? Math.floor(Math.random() * 15) + 70
        : Math.floor(Math.random() * 20) + 45
      setRules(prev => {
        const updated = prev.map(r => r.id === id
          ? { ...r, lastRunAt: new Date().toISOString(), lastResult: result, lastScore: score }
          : r
        )
        // Auto-create issue if fail or warning
        if (result !== 'pass') {
          const rule = updated.find(r => r.id === id)
          if (rule) {
            const issue = generateIssue(rule, score, 'manual')
            _ruleGeneratedIssues.unshift(issue)
            // Also add to run history
            seedRunHistory(id)
            _runHistory[id].unshift({
              id: `rh-${id}-manual-${Date.now()}`,
              runAt: new Date().toISOString(),
              trigger: 'Chạy thủ công',
              result,
              score,
              issueId: issue.id,
            })
          }
        } else {
          seedRunHistory(id)
          _runHistory[id].unshift({
            id: `rh-${id}-manual-${Date.now()}`,
            runAt: new Date().toISOString(),
            trigger: 'Chạy thủ công',
            result,
            score,
          })
        }
        return updated
      })
    }, 1800)
  }

  return (
    <>
      {/* Filter card */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Tên quy tắc</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input className="pl-8" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Chiều dữ liệu</Label>
              <Select value={dimFilter} onChange={e => setDimFilter(e.target.value)}>
                <option value="all">Tất cả</option>
                {DIMENSIONS.map(d => <option key={d} value={d}>{getDimensionLabel(d)}</option>)}
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Bảng</Label>
              <Select value={tableFilter} onChange={e => setTableFilter(e.target.value)}>
                <option value="all">Tất cả</option>
                {mockDataSources.map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Loại</Label>
              <Select value={moduleFilter} onChange={e => setModuleFilter(e.target.value as ModuleType | 'all')}>
                <option value="all">Tất cả</option>
                <option value="source">Bảng nguồn</option>
                <option value="report">Báo cáo</option>
                <option value="kpi">Chỉ tiêu</option>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Trạng thái</Label>
              <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSearch}><Search className="h-3.5 w-3.5 mr-1.5" />Tìm kiếm</Button>
              <Button size="sm" variant="outline" onClick={handleClear}><X className="h-3.5 w-3.5 mr-1.5" />Bỏ lọc</Button>
            </div>
            <Button size="sm" onClick={() => { setDialogInitialForm(undefined); setShowAdd(true) }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Thêm quy tắc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Danh sách quy tắc <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center sticky left-0 z-10 sticky-left">STT</TableHead>
                <TableHead>Tên quy tắc</TableHead>
                <TableHead className="w-32">Chiều dữ liệu</TableHead>
                <TableHead>Bảng · Chỉ số</TableHead>
                <TableHead className="w-28">Phạm vi</TableHead>
                <TableHead className="w-32">Ngưỡng</TableHead>
                <TableHead className="w-36">Chạy lần cuối</TableHead>
                <TableHead className="w-32"><span className="inline-flex items-center gap-1">Kết quả <InfoTooltip text="Điểm của lần chạy rule gần nhất. Tính bằng % bản ghi vượt qua kiểm tra. 100 = tất cả bản ghi đạt, 0 = không bản ghi nào đạt." /></span></TableHead>
                <TableHead className="w-24 text-center">Kích hoạt</TableHead>
                <TableHead className="w-36 text-center sticky right-0 z-10 sticky-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-gray-400">Không tìm thấy quy tắc phù hợp</TableCell>
                </TableRow>
              ) : (
                paged.map((rule, idx) => {
                  const isRunning = runningIds[rule.id]
                  return (
                    <TableRow key={rule.id} className="hover:bg-gray-50">
                      <TableCell className="text-center text-sm text-gray-500 font-medium sticky left-0 z-10 sticky-left">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </TableCell>
                      <TableCell className="max-w-[320px]">
                        <div className="font-medium text-gray-900 text-sm" title={`${rule.name}${rule.description ? ' — ' + rule.description : ''}`}>{rule.name}</div>
                        {rule.description && (
                          <div className="text-xs text-gray-400 mt-0.5 truncate">{rule.description.slice(0, 55)}</div>
                        )}
                      </TableCell>
                      <TableCell><DimensionBadge dimension={rule.dimension} /></TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="text-xs font-mono text-gray-700">{rule.tableName}</div>
                        {rule.metricConfig && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate">
                            {metricSummary(rule.metricConfig, rule.dimension)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-mono">
                          {getScopeLabel(rule)}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1 flex-nowrap">
                          <span className="inline-flex items-center bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap">
                            C:{rule.threshold.critical}%
                          </span>
                          <span className="inline-flex items-center bg-yellow-50 text-yellow-700 border border-yellow-200 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap">
                            W:{rule.threshold.warning}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                        {isRunning
                          ? <span className="text-blue-600 animate-pulse font-medium">Đang chạy…</span>
                          : rule.lastRunAt ? formatDateTime(rule.lastRunAt) : <span className="text-gray-300">Chưa chạy</span>
                        }
                      </TableCell>
                      <TableCell>
                        <div className="whitespace-nowrap">
                          {isRunning
                            ? <Badge variant="secondary" className="text-blue-600 bg-blue-50 whitespace-nowrap">Đang chạy</Badge>
                            : rule.lastResult ? <StatusBadge status={rule.lastResult} /> : <span className="text-xs text-gray-300">—</span>
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Switch
                            checked={switchStates[rule.id] ?? false}
                            onCheckedChange={v => {
                              setSwitchStates(prev => ({ ...prev, [rule.id]: v }))
                              setRules(prev => prev.map(r => r.id === rule.id ? { ...r, status: v ? 'active' : 'inactive' } : r))
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center sticky right-0 z-10 sticky-right">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-green-600" title="Chạy ngay"
                            onClick={() => !isRunning && handleRunNow(rule.id)}
                            disabled={isRunning}
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-purple-600" title="Lịch sử chạy"
                            onClick={() => setHistoryRule(rule)}
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600" title="Chỉnh sửa"
                            onClick={() => { setEditRule(rule); setShowAdd(false) }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-red-600" title="Xóa"
                            onClick={() => setDeleteRule(rule)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} quy tắc
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${n === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    {n}
                  </button>
                ))}
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk apply success toast (B2) */}
      {bulkApplyToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 fade-in">
          <div className="bg-white border-2 border-purple-200 rounded-lg shadow-xl p-4 flex items-start gap-3 max-w-sm">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900">Đã tạo {bulkApplyToast.count} rules</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Áp mẫu <strong>{bulkApplyToast.template}</strong> cho {bulkApplyToast.count} bảng
              </p>
            </div>
            <button onClick={() => setBulkApplyToast(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add dialog */}
      <RuleDialog
        open={showAdd}
        initialForm={dialogInitialForm}
        onClose={() => { setShowAdd(false); setDialogInitialForm(undefined) }}
        onSave={handleSave}
      />

      {/* Edit dialog */}
      <RuleDialog
        open={!!editRule}
        editRule={editRule}
        onClose={() => setEditRule(null)}
        onSave={handleSave}
      />

      {/* Delete confirm */}
      <DeleteConfirm rule={deleteRule} onConfirm={handleDelete} onCancel={() => setDeleteRule(null)} />

      {/* Run History Dialog (with expandable detail rows) */}
      {historyRule && (
        <Dialog open={!!historyRule} onClose={() => { setHistoryRule(null); setExpandedRunId(null) }} title={`Lịch sử chạy — ${historyRule.name}`}>
          <div className="space-y-3">
            <p className="text-xs text-gray-500">7 lần chạy gần nhất · Nhấn vào dòng để xem chi tiết</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-3">#</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-3">Thời gian chạy</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-3">Trigger</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-3">Kết quả</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-3">Điểm</th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-2">Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => { seedRunHistory(historyRule.id); return null })()}
                  {(_runHistory[historyRule.id] ?? []).slice(0, 7).map((entry, i) => (
                    <>
                      <tr key={entry.id}
                        className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${expandedRunId === entry.id ? 'bg-blue-50/50' : ''}`}
                        onClick={() => setExpandedRunId(prev => prev === entry.id ? null : entry.id)}
                      >
                        <td className="py-2 pr-3 text-gray-400">{i + 1}</td>
                        <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">{formatDateTime(entry.runAt)}</td>
                        <td className="py-2 pr-3">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${entry.trigger === 'Chạy thủ công' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {entry.trigger}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <StatusBadge status={entry.result} />
                        </td>
                        <td className="py-2 pr-3">
                          <span className={`font-medium ${entry.score >= 90 ? 'text-green-600' : entry.score >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                            {entry.score.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2">
                          {entry.issueId
                            ? <span className="text-xs font-mono text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">{entry.issueId.toUpperCase()}</span>
                            : <span className="text-xs text-gray-300">—</span>}
                        </td>
                      </tr>
                      {expandedRunId === entry.id && (
                        <tr key={`${entry.id}-detail`}>
                          <td colSpan={6} className="px-3 py-3 bg-gray-50/80 border-b border-gray-100">
                            <div className="space-y-2.5">
                              <p className="text-xs text-gray-500 italic mb-1">Điểm = % bản ghi vượt qua kiểm tra. VD: 95 điểm = 95% bản ghi đạt yêu cầu rule này.</p>
                              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Ngưỡng đánh giá</p>
                              <div className="space-y-1 text-sm">
                                <div className={`flex items-center gap-2 ${entry.score >= historyRule.threshold.warning ? 'text-green-700' : 'text-amber-700'}`}>
                                  <span>{entry.score >= historyRule.threshold.warning ? '✅' : '⚠️'}</span>
                                  <span>Cảnh báo khi &lt; <strong>{historyRule.threshold.warning}%</strong> →
                                    {entry.score >= historyRule.threshold.warning ? ' Đạt' : ` Vi phạm (${entry.score.toFixed(1)} < ${historyRule.threshold.warning})`}
                                  </span>
                                </div>
                                <div className={`flex items-center gap-2 ${entry.score >= historyRule.threshold.critical ? 'text-green-700' : 'text-red-700'}`}>
                                  <span>{entry.score >= historyRule.threshold.critical ? '✅' : '❌'}</span>
                                  <span>Không đạt khi &lt; <strong>{historyRule.threshold.critical}%</strong> →
                                    {entry.score >= historyRule.threshold.critical ? ' Chưa tới mức không đạt' : ` Vi phạm (${entry.score.toFixed(1)} < ${historyRule.threshold.critical})`}
                                  </span>
                                </div>
                              </div>
                              {entry.score < historyRule.threshold.warning && (
                                <div className="bg-red-50 border border-red-100 rounded p-2.5 text-sm text-red-800">
                                  <p>{(100 - entry.score).toFixed(1)}% bản ghi vi phạm quy tắc này</p>
                                  {historyRule.metricConfig?.pattern && (
                                    <p className="text-xs mt-1 font-mono text-red-600">Pattern yêu cầu: {historyRule.metricConfig.pattern}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-1">
              <Button variant="outline" size="sm" onClick={() => { setHistoryRule(null); setExpandedRunId(null) }}>Đóng</Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  )
}

// ─── Tab 2 – Mẫu quy tắc (3 sub-tabs) ─────────────────────────────────────────

type TemplateSubTab = 'metrics' | 'column_profiles' | 'table_profiles'

interface TemplatesTabProps {
  onUseTemplate: (form: Partial<RuleForm>) => void
  onBulkApplyTemplate: (tmpl: RuleTemplate, tableIds: string[]) => void
}

// Dialog chung cho "Áp mẫu cho nhiều bảng" (B2)
function BulkApplyTemplateDialog({
  open, template, onClose, onConfirm,
}: {
  open: boolean
  template: RuleTemplate | null
  onClose: () => void
  onConfirm: (tableIds: string[]) => void
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [moduleFilter, setModuleFilter] = useState<ModuleType | 'all'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (open) {
      setSelectedIds([])
      setSearch('')
      setModuleFilter('all')
    }
  }, [open])

  if (!template) return null

  const filteredTables = mockDataSources.filter(ds => {
    if (moduleFilter !== 'all' && ds.moduleType !== moduleFilter) return false
    if (search && !ds.name.toLowerCase().includes(search.toLowerCase()) && !ds.tableName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggleId = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const allVisibleSelected = filteredTables.length > 0 && filteredTables.every(t => selectedIds.includes(t.id))
  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredTables.some(t => t.id === id)))
    } else {
      const toAdd = filteredTables.map(t => t.id).filter(id => !selectedIds.includes(id))
      setSelectedIds(prev => [...prev, ...toAdd])
    }
  }

  const summary = template.metricConfig ? metricSummary(template.metricConfig, template.dimension) : ''

  return (
    <Dialog open={open} onClose={onClose} title="Áp mẫu cho nhiều bảng" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Template summary card */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Copy className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-purple-900">{template.name}</span>
                <DimensionBadge dimension={template.dimension} />
              </div>
              <p className="text-xs text-purple-700 mt-0.5">{template.description}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs text-gray-600">
                  Metric: <strong>{template.metricConfig ? getMetricLabel(template.dimension, template.metricConfig.metricType) : '—'}</strong>
                </span>
                {summary && (
                  <code className="text-[11px] font-mono bg-white px-1.5 py-0.5 rounded border border-purple-100 text-gray-700">
                    {summary.length > 60 ? summary.slice(0, 60) + '...' : summary}
                  </code>
                )}
                <span className="inline-flex items-center bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5 text-[10px] font-medium">
                  C:{template.threshold.critical}
                </span>
                <span className="inline-flex items-center bg-yellow-50 text-yellow-700 border border-yellow-200 rounded px-1.5 py-0.5 text-[10px] font-medium">
                  W:{template.threshold.warning}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label className="inline-flex items-center gap-1 mb-1.5">
            Chọn bảng áp mẫu <span className="text-red-500">*</span>
            <InfoTooltip text="Mỗi bảng được chọn sẽ tạo 1 rule độc lập dùng chung cấu hình metric và ngưỡng từ mẫu. Có thể lọc theo phân hệ hoặc tìm kiếm theo tên bảng." />
          </Label>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm theo tên bảng..."
                className="pl-8"
              />
            </div>
            <Select value={moduleFilter} onChange={e => setModuleFilter(e.target.value as ModuleType | 'all')}>
              <option value="all">Tất cả phân hệ</option>
              <option value="core_banking">Core Banking</option>
              <option value="card">Thẻ</option>
              <option value="wallet">Ví điện tử</option>
              <option value="payment">Thanh toán</option>
              <option value="aml">AML</option>
              <option value="lending">Tín dụng</option>
              <option value="risk">Rủi ro</option>
              <option value="other">Khác</option>
            </Select>
          </div>

          {/* Select-all + summary */}
          <div className="flex items-center justify-between mb-1.5">
            <button
              type="button"
              onClick={toggleAllVisible}
              className="text-xs px-2 py-0.5 rounded border border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              {allVisibleSelected ? 'Bỏ chọn tất cả (đang hiển thị)' : 'Chọn tất cả (đang hiển thị)'}
            </button>
            <span className="text-xs text-gray-500">
              Đã chọn <strong className="text-purple-700">{selectedIds.length}</strong> / {filteredTables.length} bảng
            </span>
          </div>

          {/* Table list */}
          <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto divide-y divide-gray-100 bg-white">
            {filteredTables.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">Không có bảng phù hợp bộ lọc</div>
            ) : (
              filteredTables.map(ds => {
                const checked = selectedIds.includes(ds.id)
                return (
                  <label
                    key={ds.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors',
                      checked ? 'bg-purple-50/70' : 'hover:bg-gray-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleId(ds.id)}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{ds.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <code>{ds.tableName}</code>
                        {ds.owner && <span>· Owner: {ds.owner}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">
                      {ds.moduleType ?? '—'}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-sm text-blue-800">
            Sẽ tạo <strong>{selectedIds.length} rules</strong> — mỗi bảng 1 rule, tên theo cú pháp "<em>[Tên mẫu] — [Tên bảng]</em>"
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onClose}>Hủy</Button>
        <Button disabled={selectedIds.length === 0} onClick={() => { onConfirm(selectedIds); onClose() }}>
          Áp cho {selectedIds.length || ''} bảng
        </Button>
      </div>
    </Dialog>
  )
}

// ── Sub-tab 1: Mẫu Metric — table + CRUD ────────────────────────────────────────

function MetricTemplatesSubTab({ onUseTemplate, onBulkApplyTemplate, metricTemplates, setMetricTemplates }: {
  onUseTemplate: (form: Partial<RuleForm>) => void
  onBulkApplyTemplate: (tmpl: RuleTemplate, tableIds: string[]) => void
  metricTemplates: RuleTemplate[]
  setMetricTemplates: React.Dispatch<React.SetStateAction<RuleTemplate[]>>
}) {
  const [activeDim, setActiveDim] = useState<QualityDimension | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkTarget, setBulkTarget] = useState<RuleTemplate | null>(null)

  // Form state — reuse RuleForm for MetricConfigFields
  const [form, setForm] = useState<RuleForm>({ ...EMPTY_FORM })
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formWarning, setFormWarning] = useState('95')
  const [formCritical, setFormCritical] = useState('85')

  const filtered = metricTemplates.filter(t => {
    if (activeDim !== 'all' && t.dimension !== activeDim) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const dimCounts = Object.fromEntries(
    DIMENSIONS.map(d => [d, metricTemplates.filter(t => t.dimension === d).length])
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetForm = () => {
    setFormName(''); setFormDesc('')
    setForm({ ...EMPTY_FORM })
    setFormWarning('95'); setFormCritical('85')
    setEditingId(null)
  }

  const openCreate = () => { resetForm(); setShowForm(true) }

  const openEdit = (tmpl: RuleTemplate) => {
    setFormName(tmpl.name)
    setFormDesc(tmpl.description)
    setFormWarning(String(tmpl.threshold.warning))
    setFormCritical(String(tmpl.threshold.critical))
    // Build a RuleForm from the template for MetricConfigFields
    const cfg = tmpl.metricConfig
    setForm(prev => ({
      ...prev,
      dimension: tmpl.dimension,
      metricType: cfg?.metricType ?? '',
      column: cfg?.column ?? '',
      columns: cfg?.columns ?? [],
      pattern: cfg?.pattern ?? '',
      blacklistPattern: cfg?.blacklistPattern ?? '',
      minValue: String(cfg?.minValue ?? ''),
      maxValue: String(cfg?.maxValue ?? ''),
      allowedValues: (cfg?.allowedValues ?? []).join(', '),
      refTable: cfg?.refTable ?? '',
      refColumn: cfg?.refColumn ?? '',
      sourceColumn: cfg?.sourceColumn ?? '',
      expression: cfg?.expression ?? '',
      minFillPct: String(cfg?.minFillPct ?? '95'),
      slaTime: cfg?.slaTime ?? '08:00',
      alertWindowMinutes: String(cfg?.alertWindowMinutes ?? '30'),
      maxAge: String(cfg?.maxAge ?? '24'),
      maxAgeUnit: cfg?.maxAgeUnit ?? 'hours',
      timeColumn: cfg?.timeColumn ?? '',
      granularity: cfg?.granularity ?? 'day',
      coverageDays: String(cfg?.coverageDays ?? ''),
      maxNullPct: String(cfg?.maxNullPct ?? ''),
      minCoveragePct: String(cfg?.minCoveragePct ?? ''),
      condition: cfg?.condition ?? '',
      dataType: cfg?.dataType ?? 'STRING',
      modeValue: cfg?.modeValue ?? '',
      minFreqPct: String(cfg?.minFreqPct ?? ''),
      statisticType: cfg?.statisticType ?? 'mean',
      minPassPct: String(cfg?.minPassPct ?? ''),
      minRows: String(cfg?.minRows ?? ''),
      maxRows: String(cfg?.maxRows ?? ''),
      lookbackPeriod: String(cfg?.lookbackPeriod ?? ''),
      maxChangePct: String(cfg?.maxChangePct ?? ''),
      tableSizeMin: String(cfg?.tableSizeMin ?? ''),
      tableSizeMax: String(cfg?.tableSizeMax ?? ''),
      tableSizeUnit: cfg?.tableSizeUnit ?? 'MB',
      sourceTableId: cfg?.sourceTableId ?? '',
      reportColumn: cfg?.reportColumn ?? '',
      tolerancePct: String(cfg?.tolerancePct ?? '5'),
      maxVariancePct: String(cfg?.maxVariancePct ?? '30'),
      parentKpiColumn: cfg?.parentKpiColumn ?? '',
      childSumExpression: cfg?.childSumExpression ?? '',
    }))
    setEditingId(tmpl.id)
    setShowForm(true)
  }

  const buildMetricConfig = (): MetricConfig | undefined => {
    if (!form.metricType) return undefined
    const cfg: MetricConfig = { metricType: form.metricType as MetricType }
    if (form.column) cfg.column = form.column
    if (form.columns.length) cfg.columns = form.columns
    if (form.pattern) cfg.pattern = form.pattern
    if (form.blacklistPattern) cfg.blacklistPattern = form.blacklistPattern
    if (form.minValue) cfg.minValue = Number(form.minValue)
    if (form.maxValue) cfg.maxValue = Number(form.maxValue)
    if (form.allowedValues) cfg.allowedValues = form.allowedValues.split(',').map(v => v.trim()).filter(Boolean)
    if (form.refTable) cfg.refTable = form.refTable
    if (form.refColumn) cfg.refColumn = form.refColumn
    if (form.sourceColumn) cfg.sourceColumn = form.sourceColumn
    if (form.expression) cfg.expression = form.expression
    if (form.minFillPct) cfg.minFillPct = Number(form.minFillPct)
    if (form.slaTime) cfg.slaTime = form.slaTime
    if (form.alertWindowMinutes) cfg.alertWindowMinutes = Number(form.alertWindowMinutes)
    if (form.maxAge) cfg.maxAge = Number(form.maxAge)
    cfg.maxAgeUnit = form.maxAgeUnit
    if (form.timeColumn) cfg.timeColumn = form.timeColumn
    cfg.granularity = form.granularity
    if (form.coverageDays) cfg.coverageDays = Number(form.coverageDays)
    if (form.maxNullPct) cfg.maxNullPct = Number(form.maxNullPct)
    if (form.minCoveragePct) cfg.minCoveragePct = Number(form.minCoveragePct)
    if (form.condition) cfg.condition = form.condition
    cfg.dataType = form.dataType
    if (form.modeValue) cfg.modeValue = form.modeValue
    if (form.minFreqPct) cfg.minFreqPct = Number(form.minFreqPct)
    cfg.statisticType = form.statisticType
    if (form.minPassPct) cfg.minPassPct = Number(form.minPassPct)
    if (form.minRows) cfg.minRows = Number(form.minRows)
    if (form.maxRows) cfg.maxRows = Number(form.maxRows)
    if (form.lookbackPeriod) cfg.lookbackPeriod = Number(form.lookbackPeriod)
    if (form.maxChangePct) cfg.maxChangePct = Number(form.maxChangePct)
    if (form.tableSizeMin) cfg.tableSizeMin = Number(form.tableSizeMin)
    if (form.tableSizeMax) cfg.tableSizeMax = Number(form.tableSizeMax)
    cfg.tableSizeUnit = form.tableSizeUnit
    if (form.sourceTableId) cfg.sourceTableId = form.sourceTableId
    if (form.reportColumn) cfg.reportColumn = form.reportColumn
    if (form.tolerancePct) cfg.tolerancePct = Number(form.tolerancePct)
    if (form.maxVariancePct) cfg.maxVariancePct = Number(form.maxVariancePct)
    if (form.parentKpiColumn) cfg.parentKpiColumn = form.parentKpiColumn
    if (form.childSumExpression) cfg.childSumExpression = form.childSumExpression
    return cfg
  }

  const handleSave = () => {
    if (!formName.trim() || !form.dimension || !form.metricType) return
    const mc = buildMetricConfig()
    if (editingId) {
      setMetricTemplates(prev => prev.map(t => t.id === editingId ? {
        ...t, name: formName, description: formDesc,
        dimension: form.dimension as QualityDimension,
        metricConfig: mc,
        threshold: { warning: Number(formWarning) || 95, critical: Number(formCritical) || 85 },
        updatedAt: new Date().toISOString(),
      } : t))
    } else {
      const newT: RuleTemplate = {
        id: `rt-${Date.now()}`, name: formName, description: formDesc,
        dimension: form.dimension as QualityDimension,
        metricConfig: mc, category: form.dimension as string,
        usageCount: 0,
        threshold: { warning: Number(formWarning) || 95, critical: Number(formCritical) || 85 },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        createdBy: 'current_user',
      }
      setMetricTemplates(prev => [...prev, newT])
    }
    setShowForm(false); resetForm()
  }

  const handleDelete = () => {
    if (!deleteId) return
    setMetricTemplates(prev => prev.filter(t => t.id !== deleteId))
    setDeleteId(null)
  }

  // Check if template is used in column profiles
  const getUsageInColumnProfiles = (id: string): number => {
    return mockColumnProfiles.filter(p => p.metricTemplateIds.includes(id)).length
  }

  const deleteTarget = deleteId ? metricTemplates.find(t => t.id === deleteId) : null
  const deleteUsageCount = deleteId ? getUsageInColumnProfiles(deleteId) : 0

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input className="pl-8" placeholder="Tìm kiếm mẫu metric..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Thêm mẫu metric
        </Button>
      </div>

      {/* Dimension chip filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => { setActiveDim('all'); setPage(1) }}
          className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            activeDim === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
          )}
        >
          Tất cả ({metricTemplates.length})
        </button>
        {DIMENSIONS.map(d => {
          const cfg = DIMENSION_CONFIG[d]
          return (
            <button key={d} onClick={() => { setActiveDim(d); setPage(1) }}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                activeDim === d ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              )}
            >
              {cfg.label} ({dimCounts[d] ?? 0})
            </button>
          )
        })}
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">STT</TableHead>
              <TableHead className="min-w-[200px]">Tên mẫu</TableHead>
              <TableHead className="w-28">Chiều DL</TableHead>
              <TableHead className="min-w-[180px]">Loại metric</TableHead>
              <TableHead>Cấu hình tóm tắt</TableHead>
              <TableHead className="w-32 text-center">Ngưỡng</TableHead>
              <TableHead className="w-20 text-center">Lần dùng</TableHead>
              <TableHead className="w-36 text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">Không có mẫu metric phù hợp</TableCell></TableRow>
            )}
            {paged.map((tmpl, i) => {
              const summary = tmpl.metricConfig ? metricSummary(tmpl.metricConfig, tmpl.dimension) : ''
              return (
                <TableRow key={tmpl.id}>
                  <TableCell className="text-gray-500">{(page - 1) * PAGE_SIZE + i + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{tmpl.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tmpl.description}</div>
                  </TableCell>
                  <TableCell><DimensionBadge dimension={tmpl.dimension} /></TableCell>
                  <TableCell>
                    <span className="text-sm whitespace-nowrap" title={tmpl.metricConfig ? getMetricLabel(tmpl.dimension, tmpl.metricConfig.metricType) : ''}>
                      {tmpl.metricConfig ? getMetricLabel(tmpl.dimension, tmpl.metricConfig.metricType) : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs font-mono text-gray-600 line-clamp-1" title={summary}>
                      {summary.length > 50 ? summary.slice(0, 50) + '...' : summary || '—'}
                    </code>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="inline-flex items-center bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5 text-[10px] font-medium">
                        C:{tmpl.threshold.critical}
                      </span>
                      <span className="inline-flex items-center bg-yellow-50 text-yellow-700 border border-yellow-200 rounded px-1.5 py-0.5 text-[10px] font-medium">
                        W:{tmpl.threshold.warning}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{tmpl.usageCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600" title="Dùng mẫu này (1 bảng)"
                        onClick={() => onUseTemplate(templateToForm(tmpl))}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-purple-600" title="Áp mẫu cho nhiều bảng"
                        onClick={() => setBulkTarget(tmpl)}>
                        <LayoutGrid className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600" title="Sửa" onClick={() => openEdit(tmpl)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-red-600" title="Xóa" onClick={() => setDeleteId(tmpl.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${n === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{n}</button>
            ))}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onClose={() => { setShowForm(false); resetForm() }} title={editingId ? 'Sửa mẫu metric' : 'Thêm mẫu metric'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <Label>Tên mẫu <span className="text-red-500">*</span></Label>
            <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="VD: Kiểm tra NOT NULL cột mã KH" />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Mô tả ngắn gọn về mẫu metric..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Chiều dữ liệu <span className="text-red-500">*</span></Label>
              <Select value={form.dimension} onChange={e => {
                const dim = e.target.value as QualityDimension
                setForm(prev => ({ ...prev, dimension: dim, metricType: '' }))
              }}>
                <option value="">-- Chọn chiều --</option>
                {DIMENSIONS.map(d => (
                  <option key={d} value={d}>{DIMENSION_CONFIG[d].label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Loại metric <span className="text-red-500">*</span></Label>
              <Select value={form.metricType} onChange={e => setForm(prev => ({ ...prev, metricType: e.target.value as MetricType }))}>
                <option value="">-- Chọn loại --</option>
                {(form.dimension ? METRICS_BY_DIMENSION[form.dimension as QualityDimension] ?? [] : []).map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* MetricConfigFields */}
          {form.metricType && (
            <div>
              <Label className="mb-2 block">Cấu hình metric</Label>
              <MetricConfigFields form={form} setForm={setForm} tableColumns={[]} templateMode />
            </div>
          )}

          {/* Threshold — Dual Range Slider */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Ngưỡng đánh giá</Label>
            {/* Slider */}
            <div className="relative h-10 select-none">
              {/* Color zones bar */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full overflow-hidden flex">
                <div className="bg-red-400 transition-all duration-150" style={{ width: `${Number(formCritical)}%` }} />
                <div className="bg-amber-400 transition-all duration-150" style={{ width: `${Number(formWarning) - Number(formCritical)}%` }} />
                <div className="bg-green-400 transition-all duration-150" style={{ width: `${100 - Number(formWarning)}%` }} />
              </div>
              {/* Critical handle */}
              <input
                type="range" min={0} max={100}
                value={formCritical}
                onChange={e => {
                  const v = +e.target.value
                  if (v < Number(formWarning)) setFormCritical(String(v))
                }}
                className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:border-0"
                style={{ zIndex: Number(formCritical) > 50 ? 2 : 1 }}
              />
              {/* Warning handle */}
              <input
                type="range" min={0} max={100}
                value={formWarning}
                onChange={e => {
                  const v = +e.target.value
                  if (v > Number(formCritical)) setFormWarning(String(v))
                }}
                className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:border-0"
                style={{ zIndex: Number(formWarning) < 50 ? 2 : 1 }}
              />
            </div>
            {/* Legend */}
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-400" />
                <span className="text-red-700 font-semibold">C = {formCritical}%</span>
                <span className="text-gray-400">Không đạt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-400" />
                <span className="text-amber-700 font-semibold">W = {formWarning}%</span>
                <span className="text-gray-400">Cảnh báo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-400" />
                <span className="text-gray-400">Đạt</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Hủy</Button>
            <Button onClick={handleSave} disabled={!formName.trim() || !form.dimension || !form.metricType}>
              {editingId ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Xác nhận xóa">
        {deleteUsageCount > 0 ? (
          <div className="flex items-start gap-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-sm text-yellow-800">
              Mẫu này đang được dùng trong <strong>{deleteUsageCount}</strong> mẫu cột. Xóa sẽ gỡ mẫu khỏi các mẫu đó.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600 mb-4">
            Bạn có chắc muốn xóa mẫu metric <strong>{deleteTarget?.name}</strong>? Thao tác không thể hoàn tác.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
          <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
        </div>
      </Dialog>

      {/* Bulk apply dialog (B2) */}
      <BulkApplyTemplateDialog
        open={!!bulkTarget}
        template={bulkTarget}
        onClose={() => setBulkTarget(null)}
        onConfirm={(ids) => {
          if (bulkTarget) onBulkApplyTemplate(bulkTarget, ids)
        }}
      />
    </>
  )
}

// ── Sub-tab 2: Mẫu cột ─────────────────────────────────────────────────────────

function ColumnProfilesSubTab({ onUseTemplate, metricTemplates }: {
  onUseTemplate: (form: Partial<RuleForm>) => void
  metricTemplates: RuleTemplate[]
}) {
  const [profiles, setProfiles] = useState<ColumnProfileTemplate[]>([...mockColumnProfiles])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formKeywords, setFormKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [formMetricIds, setFormMetricIds] = useState<string[]>([])
  const [formMetricOverrides, setFormMetricOverrides] = useState<Record<string, { warning?: number; critical?: number }>>({})

  const filtered = profiles.filter(p => {
    if (!search) return true
    const s = search.toLowerCase()
    return p.name.toLowerCase().includes(s) || p.columnKeywords.some(k => k.toLowerCase().includes(s))
  })
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetForm = () => {
    setFormName(''); setFormDesc(''); setFormKeywords([]); setKeywordInput('')
    setFormMetricIds([]); setFormMetricOverrides({})
    setEditingId(null)
  }
  const openCreate = () => { resetForm(); setShowForm(true) }
  const openEdit = (p: ColumnProfileTemplate) => {
    setFormName(p.name); setFormDesc(p.description)
    setFormKeywords([...p.columnKeywords]); setFormMetricIds([...p.metricTemplateIds])
    setFormMetricOverrides({})
    setEditingId(p.id); setShowForm(true)
  }
  const handleSave = () => {
    if (!formName.trim()) return
    if (editingId) {
      setProfiles(prev => prev.map(p => p.id === editingId ? {
        ...p, name: formName, description: formDesc, columnKeywords: formKeywords,
        metricTemplateIds: formMetricIds, updatedAt: new Date().toISOString()
      } : p))
    } else {
      const newP: ColumnProfileTemplate = {
        id: `cpf-${Date.now()}`, name: formName, description: formDesc,
        columnKeywords: formKeywords, metricTemplateIds: formMetricIds,
        usageCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      setProfiles(prev => [...prev, newP])
    }
    setShowForm(false); resetForm()
  }
  const handleDelete = () => {
    if (deleteId) { setProfiles(prev => prev.filter(p => p.id !== deleteId)); setDeleteId(null) }
  }
  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault()
      const kw = keywordInput.trim().toUpperCase()
      if (!formKeywords.includes(kw)) setFormKeywords(prev => [...prev, kw])
      setKeywordInput('')
    }
  }
  const getDimensions = (ids: string[]): QualityDimension[] => {
    const dims = new Set<QualityDimension>()
    ids.forEach(id => { const t = metricTemplates.find(mt => mt.id === id); if (t) dims.add(t.dimension) })
    return Array.from(dims)
  }

  // Selected metric details for mini table
  const selectedMetrics = formMetricIds.map(id => metricTemplates.find(t => t.id === id)).filter(Boolean) as RuleTemplate[]

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input className="pl-8" placeholder="Tìm theo tên hoặc từ khóa cột..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Thêm mẫu cột
        </Button>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">STT</TableHead>
              <TableHead>Tên mẫu</TableHead>
              <TableHead>Từ khóa cột</TableHead>
              <TableHead className="w-24 text-center">Số metrics</TableHead>
              <TableHead>Chiều DL</TableHead>
              <TableHead className="w-24 text-center">Lần dùng</TableHead>
              <TableHead className="w-36 text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">Không có dữ liệu</TableCell></TableRow>
            )}
            {paged.map((p, i) => (
              <TableRow key={p.id}>
                <TableCell className="text-gray-500">{(page - 1) * PAGE_SIZE + i + 1}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description}</div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-nowrap items-center" title={p.columnKeywords.join(', ')}>
                    {p.columnKeywords.slice(0, 2).map(k => (
                      <span key={k} className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap">{k}</span>
                    ))}
                    {p.columnKeywords.length > 2 && <span className="text-xs text-gray-500 whitespace-nowrap">+{p.columnKeywords.length - 2}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium">{p.metricTemplateIds.length}</TableCell>
                <TableCell>
                  {(() => { const dims = getDimensions(p.metricTemplateIds); return (
                    <div className="flex gap-1 flex-nowrap items-center" title={dims.map(d => getDimensionLabel(d)).join(', ')}>
                      {dims.slice(0, 2).map(d => <DimensionBadge key={d} dimension={d} />)}
                      {dims.length > 2 && <span className="text-xs text-gray-500 whitespace-nowrap">+{dims.length - 2}</span>}
                    </div>
                  ); })()}
                </TableCell>
                <TableCell className="text-center">{p.usageCount}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600" title="Dùng mẫu" onClick={() => {
                      const firstTmpl = metricTemplates.find(t => p.metricTemplateIds.includes(t.id))
                      if (firstTmpl) onUseTemplate(templateToForm(firstTmpl))
                    }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600" title="Sửa" onClick={() => openEdit(p)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-red-600" title="Xóa" onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${n === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{n}</button>
            ))}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onClose={() => { setShowForm(false); resetForm() }} title={editingId ? 'Sửa mẫu cột' : 'Thêm mẫu cột'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <Label>Tên mẫu <span className="text-red-500">*</span></Label>
            <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="VD: Cột mã khách hàng" />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Mô tả ngắn gọn về mẫu cột..." rows={2} />
          </div>
          <div>
            <Label>Từ khóa tên cột</Label>
            <p className="text-xs text-gray-500 mb-1.5">Nhập từ khóa và nhấn Enter. Hệ thống sẽ tự gợi ý profile khi tên cột chứa từ khóa.</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {formKeywords.map(k => (
                <span key={k} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 rounded-full px-2.5 py-1 text-xs font-medium">
                  {k}
                  <button onClick={() => setFormKeywords(prev => prev.filter(x => x !== k))} className="hover:text-blue-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <Input value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={handleKeywordKeyDown} placeholder="Nhập từ khóa, nhấn Enter để thêm..." />
          </div>
          <div>
            <Label>Chọn mẫu metric</Label>
            <SearchableMultiSelect
              items={metricTemplates.map(t => ({
                id: t.id,
                label: t.name,
                group: getDimensionLabel(t.dimension),
                badge: <DimensionBadge dimension={t.dimension} />,
              }))}
              selectedIds={formMetricIds}
              onChange={ids => {
                setFormMetricIds(ids)
                // Clean up overrides for removed ids
                setFormMetricOverrides(prev => {
                  const next = { ...prev }
                  Object.keys(next).forEach(k => { if (!ids.includes(k)) delete next[k] })
                  return next
                })
              }}
              placeholder="Tìm mẫu metric..."
              groupBy={true}
            />
          </div>

          {/* Selected metrics mini table */}
          {selectedMetrics.length > 0 && (
            <div>
              <Label className="mb-2 block">Metric đã chọn ({selectedMetrics.length})</Label>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Mẫu Metric</TableHead>
                      <TableHead className="text-xs w-28">Chiều DL</TableHead>
                      <TableHead className="text-xs w-20 text-center">C (%)</TableHead>
                      <TableHead className="text-xs w-20 text-center">W (%)</TableHead>
                      <TableHead className="text-xs w-12 text-center">Xóa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedMetrics.map(mt => {
                      const override = formMetricOverrides[mt.id] || {}
                      const wVal = override.warning ?? mt.threshold.warning
                      const cVal = override.critical ?? mt.threshold.critical
                      const wIsOverride = override.warning !== undefined
                      const cIsOverride = override.critical !== undefined
                      return (
                        <TableRow key={mt.id}>
                          <TableCell className="text-sm">{mt.name}</TableCell>
                          <TableCell><DimensionBadge dimension={mt.dimension} /></TableCell>
                          <TableCell className="text-center p-1">
                            <input
                              type="number"
                              className={cn(
                                'w-16 text-center text-xs border rounded px-1 py-0.5',
                                cIsOverride ? 'text-gray-900 border-red-300 bg-red-50' : 'text-gray-400 italic border-gray-200 bg-transparent'
                              )}
                              value={cVal}
                              onChange={e => {
                                const v = e.target.value === '' ? undefined : Number(e.target.value)
                                setFormMetricOverrides(prev => ({
                                  ...prev,
                                  [mt.id]: { ...prev[mt.id], critical: v }
                                }))
                              }}
                              placeholder={String(mt.threshold.critical)}
                            />
                          </TableCell>
                          <TableCell className="text-center p-1">
                            <input
                              type="number"
                              className={cn(
                                'w-16 text-center text-xs border rounded px-1 py-0.5',
                                wIsOverride ? 'text-gray-900 border-yellow-300 bg-yellow-50' : 'text-gray-400 italic border-gray-200 bg-transparent'
                              )}
                              value={wVal}
                              onChange={e => {
                                const v = e.target.value === '' ? undefined : Number(e.target.value)
                                setFormMetricOverrides(prev => ({
                                  ...prev,
                                  [mt.id]: { ...prev[mt.id], warning: v }
                                }))
                              }}
                              placeholder={String(mt.threshold.warning)}
                            />
                          </TableCell>
                          <TableCell className="text-center p-1">
                            <button
                              className="text-red-400 hover:text-red-600"
                              onClick={() => {
                                setFormMetricIds(prev => prev.filter(x => x !== mt.id))
                                setFormMetricOverrides(prev => { const next = { ...prev }; delete next[mt.id]; return next })
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Hủy</Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>{editingId ? 'Cập nhật' : 'Tạo mới'}</Button>
          </div>
        </div>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Xóa mẫu cột">
        <p className="text-sm text-gray-600 mb-4">Bạn có chắc muốn xóa mẫu cột này? Thao tác không thể hoàn tác.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
          <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
        </div>
      </Dialog>
    </>
  )
}

// ── Sub-tab 3: Mẫu bảng ────────────────────────────────────────────────────────

const TABLE_TYPE_LABELS: Record<string, string> = { source: 'Bảng nguồn', report: 'Báo cáo', kpi: 'Chỉ tiêu KPI' }
const TABLE_TYPE_COLORS: Record<string, string> = { source: 'bg-blue-50 text-blue-700', report: 'bg-purple-50 text-purple-700', kpi: 'bg-orange-50 text-orange-700' }
const MODE_LABELS: Record<string, string> = { append: 'Append', overwrite: 'Overwrite' }
const PARTITION_LABELS: Record<string, string> = { daily: 'Daily', monthly: 'Monthly', none: 'None' }

function TableProfilesSubTab({ onUseTemplate, metricTemplates, columnProfiles }: {
  onUseTemplate: (form: Partial<RuleForm>) => void
  metricTemplates: RuleTemplate[]
  columnProfiles: ColumnProfileTemplate[]
}) {
  const [profiles, setProfiles] = useState<TableProfileTemplate[]>([...mockTableProfiles])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formType, setFormType] = useState<'source' | 'report' | 'kpi'>('source')
  const [formMode, setFormMode] = useState<'append' | 'overwrite'>('append')
  const [formPartition, setFormPartition] = useState<'daily' | 'monthly' | 'none'>('daily')
  const [formTableMetricIds, setFormTableMetricIds] = useState<string[]>([])
  const [formColumnProfileIds, setFormColumnProfileIds] = useState<string[]>([])

  const filtered = profiles.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetForm = () => {
    setFormName(''); setFormDesc(''); setFormType('source'); setFormMode('append')
    setFormPartition('daily'); setFormTableMetricIds([]); setFormColumnProfileIds([])
    setEditingId(null)
  }
  const openCreate = () => { resetForm(); setShowForm(true) }
  const openEdit = (p: TableProfileTemplate) => {
    setFormName(p.name); setFormDesc(p.description)
    setFormType(p.tableType as 'source' | 'report' | 'kpi')
    setFormMode(p.mode); setFormPartition(p.partition)
    setFormTableMetricIds([...p.tableMetricTemplateIds]); setFormColumnProfileIds([...p.columnProfileIds])
    setEditingId(p.id); setShowForm(true)
  }
  const handleSave = () => {
    if (!formName.trim()) return
    if (editingId) {
      setProfiles(prev => prev.map(p => p.id === editingId ? {
        ...p, name: formName, description: formDesc, tableType: formType,
        mode: formMode, partition: formPartition,
        tableMetricTemplateIds: formTableMetricIds, columnProfileIds: formColumnProfileIds,
        updatedAt: new Date().toISOString()
      } : p))
    } else {
      const newP: TableProfileTemplate = {
        id: `tpf-${Date.now()}`, name: formName, description: formDesc,
        tableType: formType, mode: formMode, partition: formPartition,
        tableMetricTemplateIds: formTableMetricIds, columnProfileIds: formColumnProfileIds,
        usageCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      setProfiles(prev => [...prev, newP])
    }
    setShowForm(false); resetForm()
  }
  const handleDelete = () => {
    if (deleteId) { setProfiles(prev => prev.filter(p => p.id !== deleteId)); setDeleteId(null) }
  }

  // Only table-level metric templates
  const tableLevelTemplates = metricTemplates.filter(t => {
    const mt = t.metricConfig?.metricType
    return mt && TABLE_LEVEL_METRICS.includes(mt)
  })

  const getProfileNames = (ids: string[]): string[] =>
    ids.map(id => columnProfiles.find(c => c.id === id)?.name).filter(Boolean) as string[]

  // Preview calculation
  const previewTableMetrics = formTableMetricIds.length
  const previewColumnProfiles = formColumnProfileIds.length
  const previewColumnMetrics = formColumnProfileIds.reduce((sum, cpId) => {
    const cp = columnProfiles.find(c => c.id === cpId)
    return sum + (cp?.metricTemplateIds.length ?? 0)
  }, 0)
  const previewTotal = previewTableMetrics + previewColumnMetrics

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input className="pl-8" placeholder="Tìm theo tên mẫu bảng..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Thêm mẫu bảng
        </Button>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">STT</TableHead>
              <TableHead>Tên mẫu</TableHead>
              <TableHead className="w-24">Loại</TableHead>
              <TableHead className="w-24">Mode</TableHead>
              <TableHead className="w-24">Partition</TableHead>
              <TableHead className="w-28 text-center">QT cấp bảng</TableHead>
              <TableHead>Mẫu cột</TableHead>
              <TableHead className="w-24 text-center">Lần dùng</TableHead>
              <TableHead className="w-36 text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-400">Không có dữ liệu</TableCell></TableRow>
            )}
            {paged.map((p, i) => {
              const cpNames = getProfileNames(p.columnProfileIds)
              return (
                <TableRow key={p.id}>
                  <TableCell className="text-gray-500">{(page - 1) * PAGE_SIZE + i + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {TABLE_TYPE_LABELS[p.tableType]}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{MODE_LABELS[p.mode]}</TableCell>
                  <TableCell className="text-sm">{PARTITION_LABELS[p.partition]}</TableCell>
                  <TableCell className="text-center font-medium">{p.tableMetricTemplateIds.length}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {cpNames.slice(0, 2).map(n => (
                        <span key={n} className="inline-flex items-center bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs">{n}</span>
                      ))}
                      {cpNames.length > 2 && <span className="text-xs text-gray-500">+{cpNames.length - 2}</span>}
                      {cpNames.length === 0 && <span className="text-xs text-gray-400">--</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{p.usageCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600" title="Dùng mẫu" onClick={() => {
                        const firstTmpl = metricTemplates.find(t => p.tableMetricTemplateIds.includes(t.id))
                        if (firstTmpl) onUseTemplate(templateToForm(firstTmpl))
                      }}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600" title="Sửa" onClick={() => openEdit(p)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-red-600" title="Xóa" onClick={() => setDeleteId(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${n === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{n}</button>
            ))}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onClose={() => { setShowForm(false); resetForm() }} title={editingId ? 'Sửa mẫu bảng' : 'Thêm mẫu bảng'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <Label>Tên mẫu <span className="text-red-500">*</span></Label>
            <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="VD: Bảng giao dịch daily" />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Mô tả ngắn gọn..." rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Loại bảng</Label>
              <Select value={formType} onChange={e => setFormType(e.target.value as 'source' | 'report' | 'kpi')}>
                <option value="source">Bảng nguồn</option>
                <option value="report">Báo cáo</option>
                <option value="kpi">Chỉ tiêu KPI</option>
              </Select>
            </div>
            <div>
              <Label>Mode</Label>
              <Select value={formMode} onChange={e => setFormMode(e.target.value as 'append' | 'overwrite')}>
                <option value="append">Append</option>
                <option value="overwrite">Overwrite</option>
              </Select>
            </div>
            <div>
              <Label>Partition</Label>
              <Select value={formPartition} onChange={e => setFormPartition(e.target.value as 'daily' | 'monthly' | 'none')}>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="none">None</option>
              </Select>
            </div>
          </div>
          <div>
            <Label>Chọn mẫu metric cấp bảng</Label>
            <SearchableMultiSelect
              items={tableLevelTemplates.map(t => ({
                id: t.id,
                label: t.name,
                group: getDimensionLabel(t.dimension),
                badge: <DimensionBadge dimension={t.dimension} />,
              }))}
              selectedIds={formTableMetricIds}
              onChange={setFormTableMetricIds}
              placeholder="Tìm metric cấp bảng..."
              groupBy={true}
            />
          </div>
          <div>
            <Label>Chọn mẫu cột</Label>
            <SearchableMultiSelect
              items={columnProfiles.map(cp => ({
                id: cp.id,
                label: cp.name,
                badge: (
                  <div className="flex gap-1">
                    {cp.columnKeywords.slice(0, 2).map(k => (
                      <span key={k} className="bg-blue-50 text-blue-600 rounded-full px-1.5 text-[10px]">{k}</span>
                    ))}
                  </div>
                ),
              }))}
              selectedIds={formColumnProfileIds}
              onChange={setFormColumnProfileIds}
              placeholder="Tìm mẫu cột..."
            />
          </div>

          {/* Preview */}
          {(previewTableMetrics > 0 || previewColumnProfiles > 0) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm space-y-1">
              <div className="text-gray-600">Metric cấp bảng: <span className="font-semibold text-gray-900">{previewTableMetrics}</span></div>
              <div className="text-gray-600">
                Mẫu cột: <span className="font-semibold text-gray-900">{previewColumnProfiles}</span>
                {previewColumnMetrics > 0 && <span className="text-gray-500"> (tổng {previewColumnMetrics} metric cột)</span>}
              </div>
              <div className="text-gray-600 border-t border-gray-200 pt-1 mt-1">
                Ước tính: <span className="font-semibold text-blue-700">~{previewTotal} quy tắc / bảng</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Hủy</Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>{editingId ? 'Cập nhật' : 'Tạo mới'}</Button>
          </div>
        </div>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Xóa mẫu bảng">
        <p className="text-sm text-gray-600 mb-4">Bạn có chắc muốn xóa mẫu bảng này? Thao tác không thể hoàn tác.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
          <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
        </div>
      </Dialog>
    </>
  )
}

// ── Wrapper: TemplatesTab với 3 sub-tab ─────────────────────────────────────────

function TemplatesTab({ onUseTemplate, onBulkApplyTemplate }: TemplatesTabProps) {
  const [subTab, setSubTab] = useState<TemplateSubTab>('metrics')
  const [metricTemplates, setMetricTemplates] = useState<RuleTemplate[]>([...mockRuleTemplates])
  const [columnProfiles] = useState<ColumnProfileTemplate[]>([...mockColumnProfiles])

  return (
    <>
      {/* Sub-tab navigation */}
      <div className="flex gap-2 mb-5">
        {([
          { id: 'metrics' as const, label: `Mẫu Metric (${metricTemplates.length})` },
          { id: 'column_profiles' as const, label: `Mẫu Cột (${columnProfiles.length})` },
          { id: 'table_profiles' as const, label: `Mẫu Bảng (${mockTableProfiles.length})` },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
              subTab === tab.id
                ? 'bg-gray-100 text-gray-900 border-gray-300 font-semibold'
                : 'bg-white text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'metrics' && <MetricTemplatesSubTab onUseTemplate={onUseTemplate} onBulkApplyTemplate={onBulkApplyTemplate} metricTemplates={metricTemplates} setMetricTemplates={setMetricTemplates} />}
      {subTab === 'column_profiles' && <ColumnProfilesSubTab onUseTemplate={onUseTemplate} metricTemplates={metricTemplates} />}
      {subTab === 'table_profiles' && <TableProfilesSubTab onUseTemplate={onUseTemplate} metricTemplates={metricTemplates} columnProfiles={columnProfiles} />}
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Rules() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('rules')
  const [pendingTemplate, setPendingTemplate] = useState<Partial<RuleForm> | null>(null)
  const [pendingBulkApply, setPendingBulkApply] = useState<{ template: RuleTemplate; tableIds: string[] } | null>(null)
  const deepLinkHandled = useRef(false)

  // B7: Deep link — /rules?action=new&tableId=xxx → auto-open Add dialog với tableId pre-filled
  useEffect(() => {
    if (deepLinkHandled.current) return
    const action = searchParams.get('action')
    const tableId = searchParams.get('tableId')
    if (action === 'new' && tableId) {
      deepLinkHandled.current = true
      setPendingTemplate({ tableId })
      setActiveTab('rules')
      // Xóa query params sau khi xử lý
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])

  const handleUseTemplate = (form: Partial<RuleForm>) => {
    setPendingTemplate(form)
    setActiveTab('rules')
  }

  const handleBulkApplyTemplate = (template: RuleTemplate, tableIds: string[]) => {
    setPendingBulkApply({ template, tableIds })
    setActiveTab('rules')
  }

  return (
    <div>
      <PageHeader
        title="Quản lý quy tắc kiểm tra"
        description="Xây dựng và quản lý các quy tắc kiểm tra chất lượng dữ liệu"
        breadcrumbs={[{ label: 'Quy tắc kiểm tra' }]}
      />

      <Tabs
        defaultTab="rules"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          {
            id: 'rules',
            label: <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" />Danh sách quy tắc</span>,
            content: (
              <RuleListTab
                pendingTemplate={pendingTemplate}
                onTemplateUsed={() => setPendingTemplate(null)}
                pendingBulkApply={pendingBulkApply}
                onBulkApplyUsed={() => setPendingBulkApply(null)}
              />
            ),
          },
          {
            id: 'templates',
            label: <span className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" />Mẫu quy tắc</span>,
            content: <TemplatesTab onUseTemplate={handleUseTemplate} onBulkApplyTemplate={handleBulkApplyTemplate} />,
          },
        ]}
      />
    </div>
  )
}
