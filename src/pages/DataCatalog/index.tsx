import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Download, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
  AlertTriangle, RefreshCw, Database, FileBarChart, Target,
  ListPlus, CheckCircle2, Upload, FileDown, AlertCircle, Check, Sparkles, ShieldCheck, X,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Dialog } from '@/components/ui/dialog'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageHeader } from '@/components/common/PageHeader'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import { getScoreColor, getScoreBarColor, formatDateTime } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { mockDataSources, mockUsers, mockTableProfiles, mockColumnProfiles, mockRuleTemplates } from '@/data/mockData'
import { DimensionBadge, DIMENSION_CONFIG } from '@/components/common/DimensionBadge'
import { getGlobalThreshold } from '../Thresholds'
import type { DataSource, ModuleType, PeriodType, QualityDimension, TableProfileTemplate, ColumnProfileTemplate, RuleTemplate } from '@/types'

const PAGE_SIZE = 10

const DIMENSIONS: QualityDimension[] = ['completeness', 'validity', 'consistency', 'uniqueness', 'accuracy', 'timeliness']

const HDFS_TABLE_REGISTRY: Array<{
  name: string
  layer: 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6'
  layerLabel: string
  schema: string
  owner: string
  category?: string
  // Legacy compat fields
  area?: string
  mode?: 'append' | 'overwrite'
  partitionBy?: 'daily' | 'monthly' | 'none'
}> = [
  // L1 — Dữ liệu thô (Raw)
  { name: 'KH_KHACHHANG_RAW', layer: 'L1', layerLabel: 'Dữ liệu thô (Raw)', schema: 'RAW', owner: 'datateam', category: 'Khách hàng', area: 'bi_customer_zone', mode: 'append', partitionBy: 'daily' },
  { name: 'GD_GIAODICH_RAW', layer: 'L1', layerLabel: 'Dữ liệu thô (Raw)', schema: 'RAW', owner: 'datateam', category: 'Giao dịch', area: 'bi_transaction_zone', mode: 'append', partitionBy: 'daily' },
  { name: 'TK_TAIKHOAN_RAW', layer: 'L1', layerLabel: 'Dữ liệu thô (Raw)', schema: 'RAW', owner: 'datateam', category: 'Tài khoản', area: 'bi_customer_zone', mode: 'append', partitionBy: 'daily' },
  // L2 — Dữ liệu chuẩn hóa (Standardized)
  { name: 'KH_KHACHHANG', layer: 'L2', layerLabel: 'Chuẩn hóa (Standardized)', schema: 'DWH', owner: 'phongdh', category: 'Khách hàng', area: 'bi_customer_zone', mode: 'append', partitionBy: 'daily' },
  { name: 'GD_GIAODICH', layer: 'L2', layerLabel: 'Chuẩn hóa (Standardized)', schema: 'DWH', owner: 'phongdh', category: 'Giao dịch', area: 'bi_transaction_zone', mode: 'append', partitionBy: 'daily' },
  { name: 'TK_TAIKHOAN', layer: 'L2', layerLabel: 'Chuẩn hóa (Standardized)', schema: 'DWH', owner: 'phongdh', category: 'Tài khoản', area: 'bi_customer_zone', mode: 'append', partitionBy: 'daily' },
  { name: 'GD_THANHTOAN', layer: 'L2', layerLabel: 'Chuẩn hóa (Standardized)', schema: 'DWH', owner: 'phongdh', category: 'Giao dịch', area: 'bi_transaction_zone', mode: 'append', partitionBy: 'daily' },
  { name: 'GD_HOANTIEN', layer: 'L2', layerLabel: 'Chuẩn hóa (Standardized)', schema: 'DWH', owner: 'phongdh', category: 'Giao dịch', area: 'bi_transaction_zone', mode: 'append', partitionBy: 'daily' },
  { name: 'SP_SANPHAM', layer: 'L2', layerLabel: 'Chuẩn hóa (Standardized)', schema: 'DWH', owner: 'duyetnt', category: 'Sản phẩm', area: 'bi_product_zone', mode: 'overwrite', partitionBy: 'none' },
  // L3 — Dữ liệu tổng hợp (Aggregated)
  { name: 'RPT_GIAODICH_NGAY', layer: 'L3', layerLabel: 'Tổng hợp (Aggregated)', schema: 'AGG', owner: 'phongdh', category: 'Báo cáo', area: 'bi_report_zone', mode: 'overwrite', partitionBy: 'daily' },
  { name: 'RPT_DOANHTHU', layer: 'L3', layerLabel: 'Tổng hợp (Aggregated)', schema: 'AGG', owner: 'phongdh', category: 'Báo cáo', area: 'bi_report_zone', mode: 'overwrite', partitionBy: 'daily' },
  { name: 'RPT_KHACHHANG_THONGKE', layer: 'L3', layerLabel: 'Tổng hợp (Aggregated)', schema: 'AGG', owner: 'duyetnt', category: 'Báo cáo', area: 'bi_report_zone', mode: 'overwrite', partitionBy: 'monthly' },
  // L4 — Data Mart
  { name: 'DM_GIAODICH_FACT', layer: 'L4', layerLabel: 'Data Mart', schema: 'MART', owner: 'phongdh', category: 'Giao dịch', area: 'bi_master_zone', mode: 'append', partitionBy: 'daily' },
  { name: 'DM_KHACHHANG_DIM', layer: 'L4', layerLabel: 'Data Mart', schema: 'MART', owner: 'duyetnt', category: 'Khách hàng', area: 'bi_master_zone', mode: 'overwrite', partitionBy: 'none' },
  // L5 — Báo cáo (Reporting)
  { name: 'BC_TONG_HOP_NGAY', layer: 'L5', layerLabel: 'Báo cáo (Reporting)', schema: 'RPT', owner: 'khoiln', category: 'Báo cáo', area: 'bi_report_zone', mode: 'overwrite', partitionBy: 'daily' },
  { name: 'BC_DOANH_THU_THANG', layer: 'L5', layerLabel: 'Báo cáo (Reporting)', schema: 'RPT', owner: 'khoiln', category: 'Báo cáo', area: 'bi_report_zone', mode: 'overwrite', partitionBy: 'monthly' },
  // L6 — Sandbox / Ad-hoc
  { name: 'SANDBOX_ANALYST_01', layer: 'L6', layerLabel: 'Sandbox / Ad-hoc', schema: 'SANDBOX', owner: 'analyst', category: 'Ad-hoc', area: 'bi_sandbox_zone', mode: 'overwrite', partitionBy: 'none' },
]

// Backward-compat alias so references to SQLWF_TABLES still work in bulk dialog & handleSave
const SQLWF_TABLES = HDFS_TABLE_REGISTRY

// Layer color map for badges
const LAYER_COLORS: Record<string, string> = {
  L1: 'bg-gray-100 text-gray-700 border-gray-200',
  L2: 'bg-blue-100 text-blue-700 border-blue-200',
  L3: 'bg-purple-100 text-purple-700 border-purple-200',
  L4: 'bg-green-100 text-green-700 border-green-200',
  L5: 'bg-orange-100 text-orange-700 border-orange-200',
  L6: 'bg-rose-100 text-rose-700 border-rose-200',
}

const emptyThresholds = (): Record<string, { warning: string; critical: string }> => ({
  completeness: { warning: '', critical: '' },
  validity: { warning: '', critical: '' },
  consistency: { warning: '', critical: '' },
  uniqueness: { warning: '', critical: '' },
  accuracy: { warning: '', critical: '' },
  timeliness: { warning: '', critical: '' },
})

// ── Import/Export helpers ──

const TABLE_TEMPLATE_HEADER = 'Tên bảng,Tag,Loại kết nối,Schema,Danh mục,Chủ sở hữu,Nhóm,W_Completeness,C_Completeness,W_Validity,C_Validity,W_Consistency,C_Consistency,W_Uniqueness,C_Uniqueness,W_Accuracy,C_Accuracy,W_Timeliness,C_Timeliness'
const TABLE_TEMPLATE_EXAMPLE = 'KH_KHACHHANG,bảng,database,bi_customer_zone,KH,Nguyễn Văn A,Nhóm Khách hàng,90,80,85,70,85,70,95,90,85,70,80,60'

const RULE_TEMPLATE_HEADER = 'Tên bảng,metric_type,dimension,Cột,min,max,pattern,ref_table,ref_column,expression,allowed_values,min_fill_pct,min_pass_pct,granularity,time_column,max_age_hours,sla_time,source_table,source_column,W,C'
const RULE_TEMPLATE_EXAMPLE = [
  'KH_KHACHHANG,not_null,completeness,CCCD,,,,,,,,,,,,,,,95,85',
  'KH_KHACHHANG,format_regex,validity,EMAIL,,,^[\\w.-]+@[\\w.-]+$,,,,,,,,,,,,90,80',
  'KH_KHACHHANG,value_range,validity,TUOI,18,120,,,,,,,,,,,,,95,90',
].join('\n')

const QUICK_IMPORT_HEADER = 'Tên bảng,Tag,Layer,Schema,Mẫu bảng'
const QUICK_IMPORT_EXAMPLE = 'GD_GIAODICH,bảng,L2,DWH,Bảng giao dịch tài chính'

function downloadCSV(filename: string, header: string, examples: string) {
  const content = header + '\n' + examples
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = filename; a.click(); URL.revokeObjectURL(url)
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = lines.slice(1).map(line => {
    const cols: string[] = []
    let cur = '', inQuote = false
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    cols.push(cur.trim())
    return cols
  })
  return { headers, rows }
}

type ImportValidation = { row: number; field: string; message: string; level: 'error' | 'warning' }

function validateTableImport(headers: string[], rows: string[][]): { valid: boolean; issues: ImportValidation[] } {
  const issues: ImportValidation[] = []
  const nameIdx = headers.indexOf('Tên bảng')
  const tagIdx = headers.indexOf('Tag')
  if (nameIdx === -1) issues.push({ row: 0, field: 'Header', message: 'Thiếu cột "Tên bảng"', level: 'error' })
  rows.forEach((row, i) => {
    if (nameIdx >= 0 && !row[nameIdx]) issues.push({ row: i + 2, field: 'Tên bảng', message: 'Tên bảng không được trống', level: 'error' })
    if (tagIdx >= 0 && row[tagIdx] && !['bảng', 'báo cáo', 'chỉ tiêu'].includes(row[tagIdx])) {
      issues.push({ row: i + 2, field: 'Tag', message: `Tag "${row[tagIdx]}" không hợp lệ (bảng/báo cáo/chỉ tiêu)`, level: 'error' })
    }
    // Check W > C for each dimension pair
    const dimPairs = ['Completeness', 'Validity', 'Consistency', 'Uniqueness', 'Accuracy', 'Timeliness']
    dimPairs.forEach(dim => {
      const wIdx = headers.indexOf(`W_${dim}`)
      const cIdx = headers.indexOf(`C_${dim}`)
      if (wIdx >= 0 && cIdx >= 0 && row[wIdx] && row[cIdx]) {
        if (Number(row[wIdx]) <= Number(row[cIdx])) {
          issues.push({ row: i + 2, field: `W/C ${dim}`, message: `W (${row[wIdx]}) phải lớn hơn C (${row[cIdx]})`, level: 'warning' })
        }
      }
    })
  })
  return { valid: issues.filter(i => i.level === 'error').length === 0, issues }
}

function validateRuleImport(headers: string[], rows: string[][]): { valid: boolean; issues: ImportValidation[] } {
  const issues: ImportValidation[] = []
  const nameIdx = headers.indexOf('Tên bảng')
  const metricIdx = headers.indexOf('metric_type')
  const dimIdx = headers.indexOf('dimension')
  if (nameIdx === -1) issues.push({ row: 0, field: 'Header', message: 'Thiếu cột "Tên bảng"', level: 'error' })
  if (metricIdx === -1) issues.push({ row: 0, field: 'Header', message: 'Thiếu cột "metric_type"', level: 'error' })
  const validDims = ['completeness', 'validity', 'consistency', 'uniqueness', 'accuracy', 'timeliness']
  rows.forEach((row, i) => {
    if (nameIdx >= 0 && !row[nameIdx]) issues.push({ row: i + 2, field: 'Tên bảng', message: 'Tên bảng không được trống', level: 'error' })
    if (metricIdx >= 0 && !row[metricIdx]) issues.push({ row: i + 2, field: 'metric_type', message: 'metric_type không được trống', level: 'error' })
    if (dimIdx >= 0 && row[dimIdx] && !validDims.includes(row[dimIdx])) {
      issues.push({ row: i + 2, field: 'dimension', message: `dimension "${row[dimIdx]}" không hợp lệ`, level: 'error' })
    }
  })
  return { valid: issues.filter(i => i.level === 'error').length === 0, issues }
}

const MODULE_TABS: { key: ModuleType; label: string; icon: React.ReactNode; description: string }[] = [
  { key: 'source', label: 'Bảng nguồn', icon: <Database className="h-4 w-4" />, description: 'Bảng dữ liệu gốc trong hệ thống core' },
  { key: 'report', label: 'Báo cáo', icon: <FileBarChart className="h-4 w-4" />, description: 'Báo cáo tổng hợp từ các bảng nguồn' },
  { key: 'kpi', label: 'Chỉ tiêu', icon: <Target className="h-4 w-4" />, description: 'Chỉ tiêu KPI kinh doanh' },
]

function exportCSV(sources: DataSource[]) {
  const header = ['STT', 'Tên bảng', 'Schema', 'Bảng vật lý', 'Loại', 'Danh mục', 'Chủ sở hữu', 'Điểm tổng', 'Trạng thái', 'Lần phân tích cuối']
  const rows = sources.map((ds, i) => [
    i + 1, ds.name, ds.schema, ds.tableName, ds.type, ds.category,
    ds.owner, ds.overallScore, ds.status, ds.lastProfiled ?? '',
  ])
  const csv = [header, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `data_catalog_${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

// ── Mock: cột phổ biến theo prefix tên bảng (demo) ──
const MOCK_COLUMNS_BY_PREFIX: Record<string, string[]> = {
  'KH_': ['MA_KH', 'HO_TEN', 'NGAY_SINH', 'GIOI_TINH', 'SO_CMND', 'DIEN_THOAI', 'EMAIL', 'DIA_CHI', 'LOAI_KH', 'TRANG_THAI', 'NGAY_TAO'],
  'GD_': ['MA_GD', 'MA_TK', 'MA_KH', 'SO_TIEN', 'LOAI_GD', 'NGAY_GD', 'KENH_GD', 'TRANG_THAI', 'MO_TA'],
  'TK_': ['MA_TK', 'MA_KH', 'LOAI_TK', 'SO_DU', 'TRANG_THAI', 'LAI_SUAT', 'NGAY_MO'],
  'SP_': ['MA_SP', 'TEN_SP', 'LOAI_SP', 'TRANG_THAI', 'MUC_PHI', 'NGAY_RA_MAT'],
  'BC_': ['NGAY_BC', 'MA_CN', 'SO_TIEN', 'TRANG_THAI', 'LOAI_BC', 'GIA_TRI'],
  'DM_': ['MA_DM', 'TEN_DM', 'TRANG_THAI', 'NGAY_CAP_NHAT'],
  'AML_': ['MA_GD', 'MA_KH', 'SO_TIEN', 'NGAY_GD', 'TRANG_THAI', 'MUC_DO_NGHI_NGO'],
  'WALLET_': ['MA_VI', 'MA_KH', 'SO_DU', 'TRANG_THAI', 'NGAY_TAO', 'DIEN_THOAI'],
}

function guessColumnsForTable(tableName: string): string[] {
  for (const [prefix, cols] of Object.entries(MOCK_COLUMNS_BY_PREFIX)) {
    if (tableName.toUpperCase().startsWith(prefix)) return cols
  }
  return ['ID', 'TEN', 'MA_KH', 'SO_TIEN', 'NGAY_TAO', 'TRANG_THAI']
}

// ── Match TableProfile cho 1 DataSource ──
function matchTableProfile(ds: DataSource): TableProfileTemplate | null {
  const mt = ds.moduleType ?? 'source'
  const mode = ds.mode
  const partition = ds.partitionBy
  // Exact match
  let best = mockTableProfiles.find(tp =>
    tp.tableType === mt && (!mode || tp.mode === mode) && (!partition || tp.partition === partition))
  if (!best) {
    best = mockTableProfiles.find(tp => tp.tableType === mt)
  }
  return best ?? null
}

// ── Match ColumnProfile cho 1 cột dựa trên keywords ──
function matchColumnProfile(colName: string): ColumnProfileTemplate | null {
  const upper = colName.toUpperCase()
  for (const cp of mockColumnProfiles) {
    if (cp.columnKeywords.some(kw => {
      const kup = kw.toUpperCase()
      // exact hoặc prefix/suffix match
      return upper === kup || upper.startsWith(kup) || upper.endsWith(kup) || upper.includes(kup)
    })) {
      return cp
    }
  }
  return null
}

// ── Tính toán suggestion cho 1 bảng ──
interface TableRuleSuggestion {
  table: DataSource
  profile: TableProfileTemplate | null
  columns: string[]
  columnMatches: { col: string; profile: ColumnProfileTemplate | null; rules: RuleTemplate[] }[]
  tableRules: RuleTemplate[]
  totalRules: number
  enabled: boolean
}

function buildSuggestionsForTables(tables: DataSource[]): TableRuleSuggestion[] {
  return tables.map(table => {
    const profile = matchTableProfile(table)
    const columns = guessColumnsForTable(table.tableName)

    // Column-level rules
    const columnProfileIds = profile?.columnProfileIds ?? []
    const activeColProfiles = mockColumnProfiles.filter(cp => columnProfileIds.includes(cp.id))

    const columnMatches = columns.map(col => {
      const cp = activeColProfiles.find(acp =>
        acp.columnKeywords.some(kw => {
          const kup = kw.toUpperCase()
          const cup = col.toUpperCase()
          return cup === kup || cup.startsWith(kup) || cup.endsWith(kup) || cup.includes(kup)
        })
      ) ?? matchColumnProfile(col)

      const rules = cp
        ? cp.metricTemplateIds.map(id => mockRuleTemplates.find(t => t.id === id)).filter(Boolean) as RuleTemplate[]
        : []

      return { col, profile: cp, rules }
    })

    // Table-level rules
    const tableRules = (profile?.tableMetricTemplateIds ?? [])
      .map(id => mockRuleTemplates.find(t => t.id === id))
      .filter(Boolean) as RuleTemplate[]

    const totalRules = tableRules.length + columnMatches.reduce((s, cm) => s + cm.rules.length, 0)

    return { table, profile, columns, columnMatches, tableRules, totalRules, enabled: true }
  })
}

// ── PostImportTemplateDialog ──
function PostImportTemplateDialog({
  open, importedTables, onClose, onConfirm,
}: {
  open: boolean
  importedTables: DataSource[]
  onClose: () => void
  onConfirm: (count: number) => void
}) {
  const [suggestions, setSuggestions] = useState<TableRuleSuggestion[]>([])
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  // Compute suggestions when dialog opens
  useEffect(() => {
    if (open && importedTables.length > 0) {
      setSuggestions(buildSuggestionsForTables(importedTables))
      setExpandedIdx(null)
    }
  }, [open, importedTables])

  const toggleTable = (idx: number) =>
    setSuggestions(prev => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s))

  const totalEnabled = suggestions.filter(s => s.enabled).reduce((sum, s) => sum + s.totalRules, 0)
  const tablesEnabled = suggestions.filter(s => s.enabled).length

  return (
    <Dialog open={open} onClose={onClose} title="Áp mẫu quy tắc cho bảng vừa import" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

        {/* Giải thích */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3">
          <p className="text-sm text-purple-900 font-medium">Gợi ý tự động từ hệ thống mẫu 3 tầng</p>
          <p className="text-xs text-purple-700 mt-1">
            Hệ thống đã phân tích {importedTables.length} bảng vừa import, tự động ghép mẫu dựa trên
            loại bảng (moduleType), chế độ (mode), phân vùng (partition) và tên cột.
            Bạn có thể bật/tắt từng bảng và xem chi tiết rules sẽ được tạo.
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{importedTables.length}</p>
            <p className="text-xs text-blue-600">Bảng vừa import</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-700">{tablesEnabled}</p>
            <p className="text-xs text-purple-600">Bảng sẽ áp mẫu</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{totalEnabled}</p>
            <p className="text-xs text-green-600">Rules sẽ tạo</p>
          </div>
        </div>

        {/* Per-table list */}
        <div className="space-y-2">
          {suggestions.map((sg, idx) => (
            <div key={sg.table.id} className={`border rounded-lg transition-colors ${sg.enabled ? 'border-purple-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
              {/* Header row */}
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Switch
                  checked={sg.enabled}
                  onCheckedChange={() => toggleTable(idx)}
                />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedIdx(prev => prev === idx ? null : idx)}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 truncate">{sg.table.name}</span>
                    <code className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{sg.table.tableName}</code>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    {sg.profile ? (
                      <>
                        <span className="text-purple-700 font-medium">Mẫu: {sg.profile.name}</span>
                        <span>·</span>
                      </>
                    ) : (
                      <span className="text-amber-600">Không match mẫu bảng — dùng match cột chung</span>
                    )}
                    <span>{sg.columns.length} cột</span>
                    <span>·</span>
                    <span className="text-green-700 font-medium">{sg.totalRules} rules</span>
                    <span className="text-gray-400 ml-1">({sg.tableRules.length} bảng + {sg.totalRules - sg.tableRules.length} cột)</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedIdx(prev => prev === idx ? null : idx)}
                  className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                  {expandedIdx === idx ? 'Thu gọn' : 'Chi tiết'}
                </button>
              </div>

              {/* Expanded detail */}
              {expandedIdx === idx && (
                <div className="border-t border-gray-100 px-3 py-3 bg-gray-50/50 space-y-3">
                  {/* Table-level rules */}
                  {sg.tableRules.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Kiểm tra cấp bảng</p>
                      <div className="flex flex-wrap gap-1.5">
                        {sg.tableRules.map(r => (
                          <span key={r.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-800">
                            <DimensionBadge dimension={r.dimension} />
                            {r.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Column-level rules */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Kiểm tra cấp cột ({sg.columns.length} cột)</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-1.5 px-2 text-gray-500 font-medium w-32">Tên cột</th>
                            <th className="text-left py-1.5 px-2 text-gray-500 font-medium">Mẫu cột match</th>
                            <th className="text-left py-1.5 px-2 text-gray-500 font-medium">Rules sẽ tạo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sg.columnMatches.map(cm => (
                            <tr key={cm.col} className="border-b border-gray-50">
                              <td className="py-1.5 px-2 font-mono text-gray-800 font-medium">{cm.col}</td>
                              <td className="py-1.5 px-2">
                                {cm.profile ? (
                                  <span className="text-purple-700">{cm.profile.name}</span>
                                ) : (
                                  <span className="text-gray-400 italic">Không match</span>
                                )}
                              </td>
                              <td className="py-1.5 px-2">
                                {cm.rules.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {cm.rules.map(r => (
                                      <span key={r.id} className="px-1.5 py-0.5 rounded bg-green-50 border border-green-200 text-green-800 text-[10px]">
                                        {r.metricConfig?.metricType ?? 'custom'}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
        <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
          Bỏ qua — tôi sẽ tạo rules thủ công
        </button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button
            disabled={totalEnabled === 0}
            onClick={() => { onConfirm(totalEnabled); onClose() }}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Tạo {totalEnabled} rules
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export function DataCatalog() {
  const navigate = useNavigate()

  const [sources, setSources] = useState<DataSource[]>([...mockDataSources])
  const [scanningIds, setScanningIds] = useState<Record<string, boolean>>({})

  const [activeTab, setActiveTab] = useState<ModuleType>('source')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterOwner, setFilterOwner] = useState('')
  const [filterScoreRange, setFilterScoreRange] = useState('')  // '' | 'low' (<70) | 'mid' (70-85) | 'high' (>=85)
  const [activeSearch, setActiveSearch] = useState('')
  const [activeType, setActiveType] = useState('')
  const [activeStatus, setActiveStatus] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [activeOwner, setActiveOwner] = useState('')
  const [activeScoreRange, setActiveScoreRange] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<DataSource | null>(null)
  const [deleteItem, setDeleteItem] = useState<DataSource | null>(null)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formType, setFormType] = useState('database')
  const [formSchema, setFormSchema] = useState('')
  const [formTable, setFormTable] = useState('')
  const [formCategory, setFormCategory] = useState('KH')
  const [formOwner, setFormOwner] = useState('')
  const [formTeam, setFormTeam] = useState('Nhóm Khách hàng')
  const [formModuleType, setFormModuleType] = useState<ModuleType>('source')
  const [formSourceTableIds, setFormSourceTableIds] = useState<string[]>([])
  const [formPeriodType, setFormPeriodType] = useState<PeriodType>('monthly')
  const [formKpiFormula, setFormKpiFormula] = useState('')
  const [formThresholds, setFormThresholds] = useState<Record<string, { warning: string; critical: string }>>(emptyThresholds())
  const [sqlwfSynced, setSqlwfSynced] = useState(false)
  const [formDataRequiredByTime, setFormDataRequiredByTime] = useState('')
  const [autoFillToast, setAutoFillToast] = useState(false)
  // Combobox state for Tên bảng field
  const [tableComboOpen, setTableComboOpen] = useState(false)
  const [tableComboSearch, setTableComboSearch] = useState('')
  const [formManualTable, setFormManualTable] = useState(false)
  const [formHdfsLayer, setFormHdfsLayer] = useState<string>('')

  // Bulk add state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkSelectedTables, setBulkSelectedTables] = useState<string[]>([])
  const [bulkSearchTable, setBulkSearchTable] = useState('')
  const [bulkThresholds, setBulkThresholds] = useState<Record<string, { warning: string; critical: string }>>(emptyThresholds())

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importType, setImportType] = useState<'table' | 'rule'>('table')
  const [importData, setImportData] = useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [importValidation, setImportValidation] = useState<{ valid: boolean; issues: ImportValidation[] } | null>(null)
  const [importFileName, setImportFileName] = useState('')

  // Post-import template dialog state
  const [postImportOpen, setPostImportOpen] = useState(false)
  const [lastImportedTables, setLastImportedTables] = useState<DataSource[]>([])
  const [postImportToast, setPostImportToast] = useState<{ count: number } | null>(null)

  // Count per module type for tab badges
  const countByModule: Record<ModuleType, number> = {
    source: sources.filter(s => s.moduleType === 'source').length,
    report: sources.filter(s => s.moduleType === 'report').length,
    kpi: sources.filter(s => s.moduleType === 'kpi').length,
  }

  const filtered = sources.filter(ds => {
    if (ds.moduleType !== activeTab) return false
    if (activeSearch && !ds.name.toLowerCase().includes(activeSearch.toLowerCase()) && !ds.description.toLowerCase().includes(activeSearch.toLowerCase())) return false
    if (activeType && ds.type !== activeType) return false
    if (activeStatus && ds.status !== activeStatus) return false
    if (activeCategory && ds.category !== activeCategory) return false
    if (activeOwner && ds.owner !== activeOwner) return false
    if (activeScoreRange) {
      if (activeScoreRange === 'low' && ds.overallScore >= 70) return false
      if (activeScoreRange === 'mid' && (ds.overallScore < 70 || ds.overallScore >= 85)) return false
      if (activeScoreRange === 'high' && ds.overallScore < 85) return false
    }
    return true
  })

  // Distinct values cho Owner dropdown
  const distinctOwners = Array.from(new Set(sources.map(s => s.owner).filter(Boolean))).sort()

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearch() {
    setActiveSearch(search); setActiveType(filterType); setActiveStatus(filterStatus); setActiveCategory(filterCategory)
    setActiveOwner(filterOwner); setActiveScoreRange(filterScoreRange); setPage(1)
  }
  function handleReset() {
    setSearch(''); setFilterType(''); setFilterStatus(''); setFilterCategory(''); setFilterOwner(''); setFilterScoreRange('')
    setActiveSearch(''); setActiveType(''); setActiveStatus(''); setActiveCategory(''); setActiveOwner(''); setActiveScoreRange(''); setPage(1)
  }
  const activeFilterCount = [activeSearch, activeType, activeStatus, activeCategory, activeOwner, activeScoreRange].filter(Boolean).length

  function openAddDialog() {
    setEditItem(null)
    setFormName(''); setFormDesc(''); setFormType('database'); setFormSchema('')
    setFormTable(''); setFormCategory('KH'); setFormOwner(mockUsers[0]?.name ?? ''); setFormTeam('Nhóm Khách hàng')
    setFormModuleType(activeTab); setFormSourceTableIds([]); setFormPeriodType('monthly'); setFormKpiFormula('')
    setFormThresholds(emptyThresholds()); setSqlwfSynced(false); setFormDataRequiredByTime('')
    setTableComboOpen(false); setTableComboSearch(''); setFormManualTable(false); setFormHdfsLayer('')
    setDialogOpen(true)
  }

  function openEditDialog(ds: DataSource) {
    setEditItem(ds)
    setFormName(ds.name); setFormDesc(ds.description); setFormType(ds.type)
    setFormSchema(ds.schema); setFormTable(ds.tableName); setFormCategory(ds.category)
    setFormOwner(ds.owner); setFormTeam(ds.team)
    setFormModuleType(ds.moduleType); setFormSourceTableIds(ds.sourceTableIds ?? [])
    setFormPeriodType(ds.periodType ?? 'monthly'); setFormKpiFormula(ds.kpiFormula ?? '')
    // Load threshold overrides
    const thr = emptyThresholds()
    if (ds.thresholdOverrides) {
      for (const dim of DIMENSIONS) {
        const ov = ds.thresholdOverrides[dim]
        if (ov) {
          thr[dim] = { warning: String(ov.warning), critical: String(ov.critical) }
        }
      }
    }
    setFormThresholds(thr)
    setSqlwfSynced(ds.syncSource === 'sqlwf')
    setFormDataRequiredByTime(ds.dataRequiredByTime ?? '')
    setTableComboOpen(false); setTableComboSearch(''); setFormManualTable(false)
    setFormHdfsLayer(ds.hdfsLayer ?? '')
    setDialogOpen(true)
  }

  function parseThresholdOverrides(thr: Record<string, { warning: string; critical: string }>): DataSource['thresholdOverrides'] {
    const overrides: DataSource['thresholdOverrides'] = {}
    for (const dim of DIMENSIONS) {
      const w = thr[dim]?.warning
      const c = thr[dim]?.critical
      if (w || c) {
        overrides![dim] = {
          warning: w ? Number(w) : getGlobalThreshold(dim).warning,
          critical: c ? Number(c) : getGlobalThreshold(dim).critical,
        }
      }
    }
    return Object.keys(overrides!).length > 0 ? overrides : undefined
  }

  function handleSave() {
    const now = new Date().toISOString()
    const thrOverrides = parseThresholdOverrides(formThresholds)
    const sqlwfMatch = SQLWF_TABLES.find(t => t.name.toLowerCase() === formTable.toLowerCase())
    if (editItem) {
      setSources(prev => prev.map(ds => ds.id === editItem.id
        ? {
            ...ds, name: formName, description: formDesc, type: formType as DataSource['type'],
            schema: formSchema, tableName: formTable, category: formCategory, owner: formOwner, team: formTeam,
            moduleType: formModuleType,
            sourceTableIds: formModuleType !== 'source' ? formSourceTableIds : undefined,
            periodType: formModuleType === 'kpi' ? formPeriodType : undefined,
            kpiFormula: formModuleType === 'kpi' ? formKpiFormula : undefined,
            thresholdOverrides: thrOverrides,
            dataRequiredByTime: formDataRequiredByTime || undefined,
            syncSource: sqlwfMatch ? 'sqlwf' : 'manual',
            partitionBy: sqlwfMatch?.partitionBy,
            mode: sqlwfMatch?.mode,
            area: sqlwfMatch?.area,
            hdfsLayer: (formHdfsLayer as DataSource['hdfsLayer']) || sqlwfMatch?.layer || undefined,
            updatedAt: now,
          }
        : ds
      ))
    } else {
      const newDs: DataSource = {
        id: `ds-${Date.now()}`, name: formName, description: formDesc,
        type: formType as DataSource['type'], schema: formSchema, tableName: formTable,
        category: formCategory, owner: formOwner, team: formTeam,
        status: 'active', rowCount: 0, overallScore: 0,
        dimensionScores: { completeness: 0, validity: 0, consistency: 0, uniqueness: 0, accuracy: 0, timeliness: 0 },
        createdAt: now, updatedAt: now,
        moduleType: formModuleType,
        sourceTableIds: formModuleType !== 'source' ? formSourceTableIds : undefined,
        periodType: formModuleType === 'kpi' ? formPeriodType : undefined,
        kpiFormula: formModuleType === 'kpi' ? formKpiFormula : undefined,
        thresholdOverrides: thrOverrides,
        dataRequiredByTime: formDataRequiredByTime || undefined,
        syncSource: sqlwfMatch ? 'sqlwf' : 'manual',
        partitionBy: sqlwfMatch?.partitionBy,
        mode: sqlwfMatch?.mode,
        area: sqlwfMatch?.area,
        hdfsLayer: (formHdfsLayer as DataSource['hdfsLayer']) || sqlwfMatch?.layer || undefined,
      }
      setSources(prev => [newDs, ...prev])
    }
    setDialogOpen(false)
  }

  function handleBulkSave() {
    const now = new Date().toISOString()
    const overrides = parseThresholdOverrides(bulkThresholds)
    const newSources: DataSource[] = bulkSelectedTables.map(tableName => {
      const sqlwf = SQLWF_TABLES.find(t => t.name === tableName)
      return {
        id: `ds-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: tableName, description: '',
        type: 'database' as const, schema: sqlwf?.area ?? '', tableName,
        category: tableName.startsWith('KH') ? 'KH' : tableName.startsWith('GD') ? 'GD' : tableName.startsWith('TK') ? 'TK' : tableName.startsWith('SP') ? 'SP' : tableName.startsWith('BC') ? 'BC' : tableName.startsWith('DM') ? 'DM' : 'QTRI',
        owner: sqlwf?.owner ?? '', team: 'Nhóm Quản trị DL',
        status: 'active' as const, rowCount: 0, overallScore: 0,
        dimensionScores: { completeness: 0, validity: 0, consistency: 0, uniqueness: 0, accuracy: 0, timeliness: 0 },
        createdAt: now, updatedAt: now, moduleType: 'source' as const,
        thresholdOverrides: overrides, syncSource: 'sqlwf' as const,
        partitionBy: sqlwf?.partitionBy, mode: sqlwf?.mode, area: sqlwf?.area,
      }
    })
    setSources(prev => [...newSources, ...prev])
    setLastImportedTables(newSources)
    setBulkDialogOpen(false); setBulkSelectedTables([]); setBulkSearchTable('')
    setBulkThresholds(emptyThresholds())
    setTimeout(() => setPostImportOpen(true), 300)
  }

  function openImportDialog(type: 'table' | 'rule') {
    setImportType(type)
    setImportData(null)
    setImportValidation(null)
    setImportFileName('')
    setImportDialogOpen(true)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      setImportData(parsed)
      const validation = importType === 'table'
        ? validateTableImport(parsed.headers, parsed.rows)
        : validateRuleImport(parsed.headers, parsed.rows)
      setImportValidation(validation)
    }
    reader.readAsText(file, 'utf-8')
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  function handleImportConfirm() {
    if (!importData || !importValidation?.valid) return
    const now = new Date().toISOString()
    if (importType === 'table') {
      const h = importData.headers
      const hasQuickTemplate = h.includes('Mẫu bảng')
      const newSources: DataSource[] = importData.rows.map(row => {
        const get = (col: string) => row[h.indexOf(col)] ?? ''
        const tag = get('Tag')
        const modType: ModuleType = tag === 'báo cáo' ? 'report' : tag === 'chỉ tiêu' ? 'kpi' : 'source'
        const thresholds: DataSource['thresholdOverrides'] = {}
        for (const dim of DIMENSIONS) {
          const dimLabel = dim.charAt(0).toUpperCase() + dim.slice(1)
          const w = get(`W_${dimLabel}`)
          const c = get(`C_${dimLabel}`)
          if (w || c) {
            thresholds[dim] = {
              warning: w ? Number(w) : getGlobalThreshold(dim).warning,
              critical: c ? Number(c) : getGlobalThreshold(dim).critical,
            }
          }
        }
        const tableName = get('Tên bảng')
        const registry = HDFS_TABLE_REGISTRY.find(t => t.name.toLowerCase() === tableName.toLowerCase())
        const layerFromCsv = get('Layer') as DataSource['hdfsLayer'] | ''
        return {
          id: `ds-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: tableName,
          description: '',
          type: (get('Loại kết nối') || 'database') as DataSource['type'],
          schema: get('Schema') || registry?.schema || registry?.area || '',
          tableName,
          category: get('Danh mục') || registry?.category || 'KH',
          owner: get('Chủ sở hữu') || registry?.owner || '',
          team: get('Nhóm') || 'Nhóm Quản trị DL',
          status: 'active' as const,
          rowCount: 0, overallScore: 0,
          dimensionScores: { completeness: 0, validity: 0, consistency: 0, uniqueness: 0, accuracy: 0, timeliness: 0 },
          createdAt: now, updatedAt: now,
          moduleType: modType,
          thresholdOverrides: Object.keys(thresholds).length > 0 ? thresholds : undefined,
          syncSource: registry ? 'sqlwf' : 'manual',
          partitionBy: registry?.partitionBy, mode: registry?.mode, area: registry?.area,
          hdfsLayer: layerFromCsv || registry?.layer || undefined,
        }
      })
      setSources(prev => [...newSources, ...prev])
      // For quick-import (has "Mẫu bảng" column), template is already declared — skip PostImportTemplateDialog
      if (hasQuickTemplate) {
        setLastImportedTables([])
      } else {
        setLastImportedTables(newSources)
      }
    }
    // Rule import is display-only for demo (rules are managed in Rules page)
    setImportDialogOpen(false)
    setImportData(null); setImportValidation(null)
    // Open post-import dialog only for table import WITHOUT quick template
    if (importType === 'table' && !importData.headers.includes('Mẫu bảng')) {
      setTimeout(() => setPostImportOpen(true), 300)
    }
  }

  function handleDelete() {
    if (!deleteItem) return
    setSources(prev => prev.filter(ds => ds.id !== deleteItem.id))
    setDeleteItem(null)
  }

  function handleScanNow(id: string) {
    setScanningIds(prev => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setScanningIds(prev => ({ ...prev, [id]: false }))
      setSources(prev => prev.map(ds => {
        if (ds.id !== id) return ds
        const score = ds.overallScore > 0 ? ds.overallScore : 72 + Math.floor(Math.random() * 24)
        const dimScore = () => Math.min(100, score + Math.floor(Math.random() * 10) - 5)
        return {
          ...ds,
          lastProfiled: new Date().toISOString(),
          status: 'active' as const,
          overallScore: score,
          dimensionScores: {
            completeness: dimScore(), validity: dimScore(), consistency: dimScore(),
            uniqueness: dimScore(), accuracy: dimScore(), timeliness: dimScore(),
          },
        }
      }))
    }, 2000)
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleAll() {
    if (selected.length === paginated.length) setSelected([])
    else setSelected(paginated.map(d => d.id))
  }

  const pageNums: number[] = []
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pageNums.push(i)

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Danh mục dữ liệu"
        description="Quản lý và tìm kiếm toàn bộ nguồn dữ liệu trong hệ thống"
        breadcrumbs={[{ label: 'Danh mục dữ liệu' }]}
        actions={
          <div className="flex gap-2">
            <Button onClick={openAddDialog} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4" />Thêm {activeTab === 'source' ? 'bảng nguồn' : activeTab === 'report' ? 'báo cáo' : 'chỉ tiêu'}
            </Button>
            {activeTab === 'source' && (
              <Button variant="outline" onClick={() => { setBulkDialogOpen(true); setBulkSelectedTables([]); setBulkSearchTable(''); setBulkThresholds(emptyThresholds()) }} className="flex items-center gap-2">
                <ListPlus className="h-4 w-4" />Thêm nhiều bảng
              </Button>
            )}
            <Button variant="outline" onClick={() => openImportDialog('table')} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />Import
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Demo: chọn 3 bảng đầu tiên của tab hiện tại để demo luồng áp mẫu
                const demoTables = sources.filter(s => s.moduleType === activeTab).slice(0, 3)
                if (demoTables.length > 0) {
                  setLastImportedTables(demoTables)
                  setPostImportOpen(true)
                }
              }}
              className="flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
              title="Demo luồng áp mẫu quy tắc tự động cho các bảng đã khai báo"
            >
              <Sparkles className="h-4 w-4" />Gợi ý áp mẫu
            </Button>
          </div>
        }
      />

      {/* Module Type Tabs */}
      <Tabs
        tabs={MODULE_TABS.map(tab => ({
          id: tab.key,
          label: tab.label,
          icon: tab.icon,
          badge: countByModule[tab.key],
          content: <></>,
        }))}
        activeTab={activeTab}
        onTabChange={(id) => { setActiveTab(id as ModuleType); setPage(1); setSelected([]) }}
        description={MODULE_TABS.find(t => t.key === activeTab)?.description}
      />

      {/* Filter */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input className="pl-8" placeholder="Tên bảng, mô tả..." value={search}
                  onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Loại kết nối</Label>
              <Select value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="database">Database</option>
                <option value="sql">SQL View</option>
                <option value="file">File</option>
                <option value="api">API</option>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Trạng thái</Label>
              <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
                <option value="error">Lỗi</option>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Danh mục</Label>
              <Select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="KH">KH</option>
                <option value="GD">GD</option>
                <option value="TK">TK</option>
                <option value="SP">SP</option>
                <option value="BC">BC</option>
                <option value="DM">DM</option>
                <option value="QTRI">QTRI</option>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <span>Chủ sở hữu</span>
                <InfoTooltip text="Người chịu trách nhiệm chất lượng dữ liệu của bảng" />
              </Label>
              <Select value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
                <option value="">Tất cả</option>
                {distinctOwners.map(o => <option key={o} value={o}>{o}</option>)}
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <span>Điểm chất lượng</span>
                <InfoTooltip text="Lọc theo khoảng điểm DQ: Thấp (<70), Trung bình (70–85), Cao (≥85)" />
              </Label>
              <Select value={filterScoreRange} onChange={e => setFilterScoreRange(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="low">Thấp (&lt; 70)</option>
                <option value="mid">Trung bình (70–85)</option>
                <option value="high">Cao (≥ 85)</option>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <Button size="sm" onClick={handleSearch}>
                <Search className="h-3.5 w-3.5 mr-1.5" />Tìm kiếm
              </Button>
              <Button size="sm" variant="outline" onClick={handleReset}>
                <X className="h-3.5 w-3.5 mr-1.5" />Bỏ lọc
              </Button>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-[10px]">{activeFilterCount} bộ lọc đang áp dụng</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Kết quả tìm kiếm</CardTitle>
              <Badge variant="secondary">{filtered.length} {activeTab === 'source' ? 'bảng' : activeTab === 'report' ? 'báo cáo' : 'chỉ tiêu'}</Badge>
            </div>
            <Button variant="outline" className="text-sm flex items-center gap-1" onClick={() => exportCSV(filtered)}>
              <Download className="h-4 w-4" />Xuất CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" checked={selected.length === paginated.length && paginated.length > 0}
                      onChange={toggleAll} className="rounded border-gray-300" />
                  </TableHead>
                  <TableHead className="w-12 text-center sticky left-0 z-10 sticky-left">STT</TableHead>
                  <TableHead>Tên {activeTab === 'source' ? 'bảng' : activeTab === 'report' ? 'báo cáo' : 'chỉ tiêu'}</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Chủ sở hữu</TableHead>
                  {activeTab === 'report' && <TableHead>Bảng nguồn</TableHead>}
                  {activeTab === 'kpi' && <TableHead>Chu kỳ</TableHead>}
                  <TableHead><span className="inline-flex items-center gap-1">Điểm tổng <InfoTooltip text="Điểm tổng hợp chất lượng dữ liệu của bảng, tính trung bình từ 6 chiều: Completeness, Validity, Consistency, Uniqueness, Accuracy, Timeliness. Thang điểm 0-100." /></span></TableHead>
                  <TableHead>Lần phân tích cuối</TableHead>
                  <TableHead><span className="inline-flex items-center gap-1">Trạng thái <InfoTooltip text="Trạng thái quản lý của bảng trong hệ thống DQ. Cấu hình trong form Thêm/Sửa bảng dữ liệu.
'Hoạt động' = đang được giám sát chất lượng.
'Không hoạt động' = tạm dừng giám sát." /></span></TableHead>
                  <TableHead><span className="inline-flex items-center gap-1 text-xs">Giờ DL</span></TableHead>
                  <TableHead className="w-28 sticky right-0 z-10 sticky-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeTab !== 'source' ? 12 : 11} className="text-center py-12 text-gray-400">
                      <Search className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>Không tìm thấy kết quả nào</p>
                    </TableCell>
                  </TableRow>
                ) : paginated.map((ds, idx) => (
                  <TableRow key={ds.id} className="hover:bg-gray-50">
                    <TableCell>
                      <input type="checkbox" checked={selected.includes(ds.id)}
                        onChange={() => toggleSelect(ds.id)} className="rounded border-gray-300" />
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-500 font-medium sticky left-0 z-10 sticky-left">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => navigate(`/data-catalog/${ds.id}`)} className="text-left">
                        <span className="font-semibold text-blue-600 hover:underline block" title={ds.name}>{ds.name}</span>
                        <span className="text-xs text-gray-400">{ds.schema}.{ds.tableName}</span>
                      </button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={ds.type} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary">{ds.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {ds.owner.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700 whitespace-nowrap">{ds.owner}</span>
                      </div>
                    </TableCell>
                    {activeTab === 'report' && (
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(ds.sourceTableIds ?? []).map(stId => {
                            const st = sources.find(s => s.id === stId)
                            return (
                              <Badge key={stId} variant="secondary" className="text-xs cursor-pointer hover:bg-blue-100" onClick={() => st && navigate(`/data-catalog/${st.id}`)}>
                                {st?.name ?? stId}
                              </Badge>
                            )
                          })}
                          {(!ds.sourceTableIds || ds.sourceTableIds.length === 0) && <span className="text-xs text-gray-400">—</span>}
                        </div>
                      </TableCell>
                    )}
                    {activeTab === 'kpi' && (
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {ds.periodType === 'daily' ? 'Ngày' : ds.periodType === 'weekly' ? 'Tuần' : ds.periodType === 'monthly' ? 'Tháng' : ds.periodType === 'quarterly' ? 'Quý' : ds.periodType === 'yearly' ? 'Năm' : '—'}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      {ds.overallScore === 0 && !ds.lastProfiled ? (
                        <span className="text-xs text-gray-400 italic bg-gray-50 px-2 py-0.5 rounded">Chưa phân tích</span>
                      ) : (
                        <div>
                          <span className={`text-lg font-bold ${getScoreColor(ds.overallScore)}`}>{ds.overallScore}</span>
                          <div className="h-1.5 w-20 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div className={`h-full rounded-full ${getScoreBarColor(ds.overallScore)}`} style={{ width: `${ds.overallScore}%` }} />
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                      {scanningIds[ds.id]
                        ? <span className="text-blue-600 animate-pulse text-xs">Đang quét…</span>
                        : ds.lastProfiled ? formatDateTime(ds.lastProfiled) : '—'
                      }
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {scanningIds[ds.id]
                        ? <Badge variant="secondary" className="text-blue-600 bg-blue-50 text-xs">Đang quét</Badge>
                        : <StatusBadge status={ds.status} />
                      }
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {ds.dataRequiredByTime ?? '—'}
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 sticky-right">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600" title="Xem chi tiết"
                          onClick={() => navigate(`/data-catalog/${ds.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-purple-600" title="Tạo rule cho bảng này"
                          onClick={() => navigate(`/rules?action=new&tableId=${ds.id}`)}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-green-600" title="Quét ngay"
                          onClick={() => !scanningIds[ds.id] && handleScanNow(ds.id)}
                          disabled={scanningIds[ds.id]}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600" title="Chỉnh sửa"
                          onClick={() => openEditDialog(ds)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-red-600" title="Xóa"
                          onClick={() => setDeleteItem(ds)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} {activeTab === 'source' ? 'bảng' : activeTab === 'report' ? 'báo cáo' : 'chỉ tiêu'}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {pageNums.map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${n === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                    {n}
                  </button>
                ))}
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editItem ? 'Chỉnh sửa nguồn dữ liệu' : `Thêm ${activeTab === 'source' ? 'bảng nguồn' : activeTab === 'report' ? 'báo cáo' : 'chỉ tiêu'}`}
        description={editItem ? `Cập nhật thông tin ${editItem.name}` : 'Điền thông tin để thêm nguồn dữ liệu mới'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Module Type Selector */}
          <div>
            <Label className="text-sm font-medium mb-1 block"><span className="inline-flex items-center gap-1">Loại <InfoTooltip text="Phân loại: Bảng nguồn = dữ liệu gốc từ ETL; Báo cáo = bảng tổng hợp từ nhiều nguồn; KPI = chỉ tiêu kinh doanh" /></span> <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              {MODULE_TABS.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFormModuleType(tab.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-all ${
                    formModuleType === tab.key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-sm font-medium mb-1 block">Tên hiển thị <span className="text-red-500">*</span></Label>
              <Input placeholder={formModuleType === 'source' ? 'VD: KH_KHACHHANG' : formModuleType === 'report' ? 'VD: BAO_CAO_NGAY' : 'VD: KPI_KINHDOANH'} value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium mb-1 block">Mô tả</Label>
              <Textarea placeholder="Mô tả nội dung và mục đích..." value={formDesc}
                onChange={e => setFormDesc(e.target.value)} rows={3} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Loại kết nối</Label>
              <Select value={formType} onChange={e => setFormType(e.target.value)}>
                <option value="database">Database</option>
                <option value="sql">SQL View</option>
                <option value="file">File</option>
                <option value="api">API</option>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block"><span className="inline-flex items-center gap-1">Schema <InfoTooltip text="Database schema chứa bảng (VD: CORE, REPORT, DM)" /></span></Label>
              <Input placeholder="CORE, REPORT, DM..." value={formSchema} onChange={e => setFormSchema(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block"><span className="inline-flex items-center gap-1">Tên bảng <InfoTooltip text="Tên bảng trên hệ thống lưu trữ (HDFS/DB). Chọn từ registry HDFS để tự điền metadata chính xác" /></span></Label>
              {formManualTable ? (
                // Manual free-text fallback
                <Input placeholder="VD: KH_KHACHHANG" value={formTable} onChange={e => {
                  const val = e.target.value
                  setFormTable(val)
                  const catalogMatch = mockDataSources.find(ds => ds.tableName.toLowerCase() === val.toLowerCase() || ds.name.toLowerCase() === val.toLowerCase())
                  if (catalogMatch) {
                    if (catalogMatch.schema) setFormSchema(catalogMatch.schema)
                    if (catalogMatch.owner) setFormOwner(catalogMatch.owner)
                    if (catalogMatch.description) setFormDesc(catalogMatch.description)
                    setAutoFillToast(true)
                    setTimeout(() => setAutoFillToast(false), 3000)
                  }
                  setSqlwfSynced(false)
                }} />
              ) : (
                // Searchable combobox
                <div className="relative">
                  <div
                    className="flex items-center border border-gray-300 rounded-md bg-white cursor-pointer"
                    onClick={() => setTableComboOpen(o => !o)}
                  >
                    <Search className="h-4 w-4 text-gray-400 ml-3 shrink-0 pointer-events-none" />
                    <input
                      type="text"
                      className="flex-1 px-2 py-2 text-sm outline-none bg-transparent"
                      placeholder="Tìm bảng trong HDFS Registry..."
                      value={tableComboOpen ? tableComboSearch : (formTable || '')}
                      onChange={e => { setTableComboSearch(e.target.value); setTableComboOpen(true) }}
                      onClick={e => { e.stopPropagation(); setTableComboOpen(true) }}
                    />
                    {formTable && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border mr-2 ${formHdfsLayer ? LAYER_COLORS[formHdfsLayer] : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {formHdfsLayer || '—'}
                      </span>
                    )}
                  </div>
                  {tableComboOpen && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                      {(() => {
                        const q = tableComboSearch.toLowerCase()
                        const filtered = HDFS_TABLE_REGISTRY.filter(t =>
                          !q || t.name.toLowerCase().includes(q) || t.schema.toLowerCase().includes(q) || (t.category ?? '').toLowerCase().includes(q)
                        )
                        // Group by layer
                        const layers: Array<'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6'> = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']
                        const groups = layers.map(l => ({ layer: l, items: filtered.filter(t => t.layer === l) })).filter(g => g.items.length > 0)
                        if (groups.length === 0) return (
                          <div className="px-4 py-3 text-sm text-gray-400 text-center">Không tìm thấy bảng nào</div>
                        )
                        return groups.map(group => (
                          <div key={group.layer}>
                            <div className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider sticky top-0 flex items-center gap-2 ${LAYER_COLORS[group.layer]} bg-opacity-60`}>
                              <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${LAYER_COLORS[group.layer]}`}>{group.layer}</span>
                              {group.items[0]?.layerLabel}
                            </div>
                            {group.items.map(t => (
                              <button
                                key={t.name}
                                type="button"
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-blue-50 transition-colors ${formTable === t.name ? 'bg-blue-50' : ''}`}
                                onClick={() => {
                                  setFormTable(t.name)
                                  setFormHdfsLayer(t.layer)
                                  setFormSchema(t.schema)
                                  // Try to find owner in mockUsers list, otherwise keep as-is
                                  const ownerUser = mockUsers.find(u => u.name.toLowerCase().includes(t.owner.toLowerCase()) || t.owner.toLowerCase().includes(u.name.toLowerCase().split(' ').pop() ?? ''))
                                  if (ownerUser) setFormOwner(ownerUser.name)
                                  // Auto-fill category
                                  if (t.category) {
                                    const catMap: Record<string, string> = {
                                      'Khách hàng': 'KH', 'Giao dịch': 'GD', 'Tài khoản': 'TK',
                                      'Sản phẩm': 'SP', 'Báo cáo': 'BC', 'Ad-hoc': 'QTRI',
                                    }
                                    const mapped = catMap[t.category]
                                    if (mapped) setFormCategory(mapped)
                                  }
                                  setSqlwfSynced(true)
                                  setTableComboOpen(false)
                                  setTableComboSearch('')
                                }}
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="font-semibold text-sm text-gray-900">{t.name}</span>
                                  <span className="text-xs text-gray-400 ml-2">{t.schema}</span>
                                </div>
                                {t.category && <span className="text-[10px] text-gray-400 shrink-0">{t.category}</span>}
                              </button>
                            ))}
                          </div>
                        ))
                      })()}
                      <div className="border-t border-gray-100 px-3 py-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500">
                          <input
                            type="checkbox"
                            checked={formManualTable}
                            onChange={e => { setFormManualTable(e.target.checked); setTableComboOpen(false) }}
                            className="rounded border-gray-300"
                          />
                          Nhập tên bảng thủ công
                        </label>
                      </div>
                    </div>
                  )}
                  {tableComboOpen && (
                    <div className="fixed inset-0 z-40" onClick={() => setTableComboOpen(false)} />
                  )}
                </div>
              )}
              {formManualTable && (
                <label className="flex items-center gap-2 mt-1.5 cursor-pointer text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={formManualTable}
                    onChange={e => { setFormManualTable(e.target.checked); if (!e.target.checked) { setFormTable(''); setFormHdfsLayer('') } }}
                    className="rounded border-gray-300"
                  />
                  Nhập tên bảng thủ công
                </label>
              )}
              {sqlwfSynced && !formManualTable && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Đã đồng bộ metadata từ HDFS Registry (schema, owner, layer)
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Danh mục</Label>
              <Select value={formCategory} onChange={e => setFormCategory(e.target.value)}>
                <option value="KH">KH - Khách hàng</option>
                <option value="GD">GD - Giao dịch</option>
                <option value="TK">TK - Tài khoản</option>
                <option value="SP">SP - Sản phẩm</option>
                <option value="BC">BC - Báo cáo</option>
                <option value="DM">DM - Danh mục</option>
                <option value="QTRI">QTRI - Quản trị</option>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block"><span className="inline-flex items-center gap-1">Owner <InfoTooltip text="Người chịu trách nhiệm chất lượng dữ liệu của bảng. Nhận cảnh báo khi có sự cố" /></span></Label>
              <Select value={formOwner} onChange={e => setFormOwner(e.target.value)}>
                {mockUsers.filter(u => u.isActive).map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Nhóm</Label>
              <Select value={formTeam} onChange={e => setFormTeam(e.target.value)}>
                <option value="Nhóm Khách hàng">Nhóm Khách hàng</option>
                <option value="Nhóm Giao dịch">Nhóm Giao dịch</option>
                <option value="Nhóm Sản phẩm">Nhóm Sản phẩm</option>
                <option value="Nhóm Báo cáo">Nhóm Báo cáo</option>
                <option value="Nhóm Rủi ro">Nhóm Rủi ro</option>
                <option value="Nhóm Quản trị DL">Nhóm Quản trị DL</option>
              </Select>
            </div>
          </div>

          {/* Metadata: Mode, Partition, Giờ cần dữ liệu */}
          <div className="border-t border-gray-100 pt-4">
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">Metadata vận hành</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1 block"><span className="inline-flex items-center gap-1">Mode <InfoTooltip text="Append = thêm dữ liệu mới theo partition (ngày/tháng). Overwrite = ghi đè toàn bộ mỗi lần chạy ETL" /></span></Label>
                <div className="text-sm text-gray-600 bg-gray-50 border rounded-md px-3 py-2">
                  {sqlwfSynced
                    ? (HDFS_TABLE_REGISTRY.find(t => t.name.toLowerCase() === formTable.toLowerCase())?.mode ?? '—')
                    : '—'}
                  {sqlwfSynced && <span className="text-xs text-gray-400 ml-1">(từ Registry)</span>}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block"><span className="inline-flex items-center gap-1">Partition <InfoTooltip text="Cách phân vùng dữ liệu: Daily (hàng ngày), Monthly (hàng tháng), None (không phân vùng). Ảnh hưởng lịch quét DQ tự động" /></span></Label>
                <div className="text-sm text-gray-600 bg-gray-50 border rounded-md px-3 py-2">
                  {sqlwfSynced
                    ? (HDFS_TABLE_REGISTRY.find(t => t.name.toLowerCase() === formTable.toLowerCase())?.partitionBy ?? '—')
                    : '—'}
                  {sqlwfSynced && <span className="text-xs text-gray-400 ml-1">(từ Registry)</span>}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block"><span className="inline-flex items-center gap-1">Giờ cần dữ liệu <InfoTooltip text="Giờ mong muốn dữ liệu đã được load xong từ ETL. Dùng để: (1) Hệ thống tự lên lịch quét DQ sau giờ này, (2) Bỏ qua kết quả quét trước giờ này (tránh false alarm)" wide /></span></Label>
                <Input type="time" value={formDataRequiredByTime} onChange={e => setFormDataRequiredByTime(e.target.value)} className="h-9" />
              </div>
            </div>
          </div>

          {/* B5: Gợi ý mẫu bảng — match theo moduleType + mode + partition */}
          {(() => {
            const sqlwfMatch = HDFS_TABLE_REGISTRY.find(t => t.name.toLowerCase() === formTable.toLowerCase())
            const currentMode = sqlwfMatch?.mode
            const currentPartition = sqlwfMatch?.partitionBy
            const matched = mockTableProfiles.filter(tpl => {
              if (tpl.tableType !== formModuleType) return false
              if (currentMode && tpl.mode !== currentMode) return false
              if (currentPartition && tpl.partition !== currentPartition) return false
              return true
            }).slice(0, 3)
            const fallback = mockTableProfiles.filter(tpl => tpl.tableType === formModuleType).slice(0, 3)
            const showList = matched.length > 0 ? matched : fallback
            if (showList.length === 0) return null
            const isExact = matched.length > 0 && sqlwfMatch
            return (
              <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-purple-900">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Gợi ý mẫu bảng
                    <InfoTooltip
                      text="Các mẫu bảng phù hợp dựa trên: loại đối tượng (Nguồn/Báo cáo/KPI), mode (Append/Overwrite) và partition (Daily/Monthly/None). Áp mẫu sẽ tự sinh rules và ngưỡng mặc định cho bảng này"
                      wide
                    />
                  </div>
                  {isExact && (
                    <Badge variant="secondary" className="text-[10px]">Khớp chính xác</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {showList.map(tpl => (
                    <div key={tpl.id} className="flex items-start gap-2 p-2 bg-white rounded border border-purple-100 hover:border-purple-300">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{tpl.name}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {tpl.mode} · {tpl.partition}
                          </Badge>
                          <span className="text-[11px] text-gray-500">Đã dùng {tpl.usageCount} lần</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">{tpl.description}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs shrink-0 border-purple-300 text-purple-700 hover:bg-purple-100"
                        onClick={() => {
                          // Áp ngưỡng mặc định từ template
                          if (tpl.defaultThresholds) {
                            const next = emptyThresholds()
                            Object.entries(tpl.defaultThresholds).forEach(([dim, thr]) => {
                              if (thr) next[dim] = { warning: String(thr.warning), critical: String(thr.critical) }
                            })
                            setFormThresholds(next)
                          }
                          alert(`Đã áp mẫu "${tpl.name}". Sau khi lưu bảng, rules từ mẫu sẽ được tự sinh.`)
                        }}
                      >
                        Dùng mẫu
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Threshold overrides per dimension */}
          <div className="border-t border-gray-100 pt-4">
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">
              <span className="inline-flex items-center gap-1">Ngưỡng cảnh báo <InfoTooltip text="Ngưỡng Warning (cảnh báo nhẹ) và Critical (nghiêm trọng) cho từng chiều dữ liệu. Để trống = kế thừa ngưỡng mặc định hệ thống" /></span>
            </Label>
            <p className="text-xs text-gray-400 mb-3">Để trống = kế thừa ngưỡng mặc định toàn cục</p>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 pb-1">
                <div className="col-span-6">Chiều dữ liệu</div>
                <div className="col-span-3 text-center">Cảnh báo W (%)</div>
                <div className="col-span-3 text-center">Không đạt C (%)</div>
              </div>
              {DIMENSIONS.map(dim => {
                const globalThr = getGlobalThreshold(dim)
                return (
                  <div key={dim} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <DimensionBadge dimension={dim} />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number" min={0} max={100}
                        placeholder={String(globalThr.warning)}
                        value={formThresholds[dim]?.warning ?? ''}
                        onChange={e => setFormThresholds(prev => ({
                          ...prev,
                          [dim]: { ...prev[dim], warning: e.target.value }
                        }))}
                        className="h-8 text-center text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number" min={0} max={100}
                        placeholder={String(globalThr.critical)}
                        value={formThresholds[dim]?.critical ?? ''}
                        onChange={e => setFormThresholds(prev => ({
                          ...prev,
                          [dim]: { ...prev[dim], critical: e.target.value }
                        }))}
                        className="h-8 text-center text-sm"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Conditional fields for Report */}
          {formModuleType === 'report' && (
            <div className="border-t border-gray-100 pt-4">
              <Label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                <FileBarChart className="h-4 w-4 text-purple-500" />
                Thông tin báo cáo
              </Label>
              <div>
                <Label className="text-sm font-medium mb-1 block">Bảng nguồn liên kết</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formSourceTableIds.map(stId => {
                    const st = sources.find(s => s.id === stId)
                    return (
                      <Badge key={stId} variant="secondary" className="flex items-center gap-1">
                        {st?.name ?? stId}
                        <button type="button" onClick={() => setFormSourceTableIds(prev => prev.filter(x => x !== stId))} className="ml-1 text-gray-400 hover:text-red-500">&times;</button>
                      </Badge>
                    )
                  })}
                </div>
                <Select value="" onChange={e => {
                  if (e.target.value && !formSourceTableIds.includes(e.target.value)) {
                    setFormSourceTableIds(prev => [...prev, e.target.value])
                  }
                }}>
                  <option value="">Chọn bảng nguồn...</option>
                  {sources.filter(s => s.moduleType === 'source' && !formSourceTableIds.includes(s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {/* Conditional fields for KPI */}
          {formModuleType === 'kpi' && (
            <div className="border-t border-gray-100 pt-4">
              <Label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-500" />
                Thông tin chỉ tiêu KPI
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-1 block">Chu kỳ tính</Label>
                  <Select value={formPeriodType} onChange={e => setFormPeriodType(e.target.value as PeriodType)}>
                    <option value="daily">Ngày</option>
                    <option value="weekly">Tuần</option>
                    <option value="monthly">Tháng</option>
                    <option value="quarterly">Quý</option>
                    <option value="yearly">Năm</option>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1 block">Nguồn dữ liệu (báo cáo/bảng)</Label>
                  <Select value="" onChange={e => {
                    if (e.target.value && !formSourceTableIds.includes(e.target.value)) {
                      setFormSourceTableIds(prev => [...prev, e.target.value])
                    }
                  }}>
                    <option value="">Chọn nguồn...</option>
                    {sources.filter(s => (s.moduleType === 'source' || s.moduleType === 'report') && !formSourceTableIds.includes(s.id)).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.moduleType === 'report' ? 'BC' : 'Nguồn'})</option>
                    ))}
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formSourceTableIds.map(stId => {
                      const st = sources.find(s => s.id === stId)
                      return (
                        <Badge key={stId} variant="secondary" className="flex items-center gap-1">
                          {st?.name ?? stId}
                          <button type="button" onClick={() => setFormSourceTableIds(prev => prev.filter(x => x !== stId))} className="ml-1 text-gray-400 hover:text-red-500">&times;</button>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium mb-1 block">Công thức tính</Label>
                  <Input placeholder="VD: SUM(doanh_thu) / COUNT(chi_nhanh)" value={formKpiFormula} onChange={e => setFormKpiFormula(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={!formName.trim()}>
              {editItem ? 'Cập nhật' : 'Lưu thông tin'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        title={importType === 'table' ? 'Import danh mục bảng + ngưỡng' : 'Import quy tắc (rules)'}
        description="Tải template, điền dữ liệu, upload file CSV để import hàng loạt"
        size="lg"
      >
        <div className="space-y-4">
          {/* Step 1: Download template */}
          <div className="bg-blue-50 rounded-lg p-4">
            <Label className="text-sm font-semibold text-blue-800 mb-2 block">
              Bước 1: Tải template
            </Label>
            <p className="text-xs text-blue-600 mb-3">Tải file mẫu, điền dữ liệu theo format rồi upload lại. Các cột ngưỡng (W/C) để trống = kế thừa mặc định.</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCSV('template_bang_nguong.csv', TABLE_TEMPLATE_HEADER, TABLE_TEMPLATE_EXAMPLE)}
                className="text-xs"
              >
                <FileDown className="h-3 w-3 mr-1" />Template bảng + ngưỡng
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCSV('template_rules.csv', RULE_TEMPLATE_HEADER, RULE_TEMPLATE_EXAMPLE)}
                className="text-xs"
              >
                <FileDown className="h-3 w-3 mr-1" />Template quy tắc (rules)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCSV('template_import_nhanh.csv', QUICK_IMPORT_HEADER, QUICK_IMPORT_EXAMPLE)}
                className="text-xs border-green-300 text-green-700 hover:bg-green-50"
              >
                <FileDown className="h-3 w-3 mr-1" />Template import nhanh (có Mẫu bảng)
              </Button>
            </div>
            <p className="text-[11px] text-blue-500 mt-1.5">
              Template import nhanh: điền sẵn "Mẫu bảng" để hệ thống bỏ qua bước áp mẫu thủ công.
            </p>
          </div>

          {/* Step 2: Upload */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              Bước 2: Upload file CSV
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => { setImportType('table'); setImportData(null); setImportValidation(null); setImportFileName('') }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${importType === 'table' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  Bảng + Ngưỡng
                </button>
                <button
                  type="button"
                  onClick={() => { setImportType('rule'); setImportData(null); setImportValidation(null); setImportFileName('') }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${importType === 'rule' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  Quy tắc (Rules)
                </button>
              </div>
            </div>
            <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors mt-2">
              <Upload className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                {importFileName
                  ? <span className="text-sm font-medium text-gray-900">{importFileName}</span>
                  : <span className="text-sm text-gray-500">Chọn file CSV để upload...</span>
                }
              </div>
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          {/* Step 3: Validation & Preview */}
          {importValidation && (
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                Bước 3: Kiểm tra dữ liệu
              </Label>

              {/* Validation summary */}
              <div className={`rounded-lg p-3 mb-3 ${importValidation.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {importValidation.valid
                    ? <><Check className="h-4 w-4 text-green-600" /><span className="text-sm font-medium text-green-800">Dữ liệu hợp lệ — {importData?.rows.length} dòng sẵn sàng import</span></>
                    : <><AlertCircle className="h-4 w-4 text-red-600" /><span className="text-sm font-medium text-red-800">{importValidation.issues.filter(i => i.level === 'error').length} lỗi cần sửa</span></>
                  }
                </div>
                {importValidation.issues.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                    {importValidation.issues.map((issue, idx) => (
                      <div key={idx} className={`text-xs px-2 py-1 rounded ${issue.level === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        Dòng {issue.row} — {issue.field}: {issue.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview table */}
              {importData && importData.rows.length > 0 && (
                <div className="border rounded-md overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="text-xs w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left text-gray-500 font-medium">#</th>
                        {importData.headers.map((h, i) => (
                          <th key={i} className="px-2 py-1.5 text-left text-gray-500 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importData.rows.slice(0, 10).map((row, ri) => (
                        <tr key={ri} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-2 py-1 text-gray-400">{ri + 1}</td>
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-2 py-1 text-gray-700 whitespace-nowrap max-w-[120px] truncate" title={cell}>{cell || <span className="text-gray-300">—</span>}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importData.rows.length > 10 && (
                    <div className="text-center text-xs text-gray-400 py-1 bg-gray-50 border-t">... và {importData.rows.length - 10} dòng khác</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Hủy</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleImportConfirm}
              disabled={!importData || !importValidation?.valid}
            >
              <Upload className="h-4 w-4 mr-1" />
              Import {importData?.rows.length ?? 0} {importType === 'table' ? 'bảng' : 'quy tắc'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        title="Khai báo nhiều bảng cùng ngưỡng"
        description="Chọn bảng từ SQLWF và thiết lập ngưỡng chung cho tất cả"
        size="lg"
      >
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Table selection */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Chọn bảng từ SQLWF</Label>
            <Input
              placeholder="Tìm bảng..."
              value={bulkSearchTable}
              onChange={e => setBulkSearchTable(e.target.value)}
              className="mb-3"
            />
            <div className="border rounded-md max-h-64 overflow-y-auto">
              {SQLWF_TABLES
                .filter(t => !bulkSearchTable || t.name.toLowerCase().includes(bulkSearchTable.toLowerCase()))
                .filter(t => !sources.some(s => s.tableName === t.name))
                .map(table => (
                  <label key={table.name} className="flex items-start gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                    <input
                      type="checkbox"
                      checked={bulkSelectedTables.includes(table.name)}
                      onChange={() => setBulkSelectedTables(prev =>
                        prev.includes(table.name) ? prev.filter(n => n !== table.name) : [...prev, table.name]
                      )}
                      className="mt-1 rounded border-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 block">{table.name}</span>
                      <span className="text-xs text-gray-400">{table.mode} / {table.partitionBy} / {table.area}</span>
                    </div>
                  </label>
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Đã chọn:<span className="font-semibold text-blue-600">{bulkSelectedTables.length}</span> bảng</p>
          </div>

          {/* Right: Threshold config */}
          <div>
            <Label className="text-sm font-semibold mb-1 block">
              Ngưỡng cảnh báo chung
            </Label>
            <p className="text-xs text-gray-400 mb-3">Để trống = kế thừa ngưỡng mặc định toàn cục</p>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 pb-1">
                <div className="col-span-6">Chiều</div>
                <div className="col-span-3 text-center">W (%)</div>
                <div className="col-span-3 text-center">C (%)</div>
              </div>
              {DIMENSIONS.map(dim => {
                const globalThr = getGlobalThreshold(dim)
                return (
                  <div key={dim} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <DimensionBadge dimension={dim} />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number" min={0} max={100}
                        placeholder={String(globalThr.warning)}
                        value={bulkThresholds[dim]?.warning ?? ''}
                        onChange={e => setBulkThresholds(prev => ({
                          ...prev,
                          [dim]: { ...prev[dim], warning: e.target.value }
                        }))}
                        className="h-8 text-center text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number" min={0} max={100}
                        placeholder={String(globalThr.critical)}
                        value={bulkThresholds[dim]?.critical ?? ''}
                        onChange={e => setBulkThresholds(prev => ({
                          ...prev,
                          [dim]: { ...prev[dim], critical: e.target.value }
                        }))}
                        className="h-8 text-center text-sm"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
          <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Hủy</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleBulkSave} disabled={bulkSelectedTables.length === 0}>
            Khai báo {bulkSelectedTables.length} bảng
          </Button>
        </div>
      </Dialog>

      {/* Auto-fill toast */}
      {autoFillToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4" />
          Đã tự động điền thông tin từ catalog
        </div>
      )}

      {/* Delete Confirm */}
      <Dialog open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Xác nhận xóa" size="sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-700">Bạn có chắc muốn xóa nguồn dữ liệu:</p>
            <p className="font-semibold text-gray-900 mt-0.5">{deleteItem?.name}</p>
            <p className="text-xs text-gray-500 mt-1">Hành động này không thể hoàn tác.</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={() => setDeleteItem(null)}>Hủy</Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Xóa</Button>
        </div>
      </Dialog>

      {/* Post-import: Áp mẫu quy tắc */}
      <PostImportTemplateDialog
        open={postImportOpen}
        importedTables={lastImportedTables}
        onClose={() => setPostImportOpen(false)}
        onConfirm={(count) => {
          setPostImportToast({ count })
          setTimeout(() => setPostImportToast(null), 6000)
        }}
      />

      {/* Post-import success toast */}
      {postImportToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 fade-in">
          <div className="bg-white border-2 border-purple-200 rounded-lg shadow-xl p-4 flex items-start gap-3 max-w-sm">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900">Đã tạo {postImportToast.count} rules từ mẫu</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Các quy tắc đã được tạo tự động. Xem tại trang <button onClick={() => navigate('/rules')} className="text-purple-700 font-medium underline">Quản lý quy tắc</button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
