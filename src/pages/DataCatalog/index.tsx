import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Download, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
  AlertTriangle, RefreshCw, Database, FileBarChart, Target,
  ListPlus, CheckCircle2, Upload, FileDown, AlertCircle, Check,
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
import { mockDataSources, mockUsers } from '@/data/mockData'
import { DimensionBadge } from '@/components/common/DimensionBadge'
import { getGlobalThreshold } from '../Thresholds'
import type { DataSource, ModuleType, PeriodType, QualityDimension } from '@/types'

const PAGE_SIZE = 10

const DIMENSIONS: QualityDimension[] = ['completeness', 'validity', 'consistency', 'uniqueness', 'accuracy', 'timeliness']

const SQLWF_TABLES = [
  { name: 'KH_KHACHHANG', area: 'bi_customer_zone', mode: 'append' as const, partitionBy: 'daily' as const, owner: 'Nguyễn Văn A' },
  { name: 'KH_TAIKHOAN', area: 'bi_customer_zone', mode: 'append' as const, partitionBy: 'daily' as const, owner: 'Nguyễn Văn A' },
  { name: 'GD_GIAODICH', area: 'bi_transaction_zone', mode: 'append' as const, partitionBy: 'daily' as const, owner: 'Trần Thị B' },
  { name: 'GD_GIAODICH_CTT', area: 'bi_transaction_zone', mode: 'append' as const, partitionBy: 'daily' as const, owner: 'Trần Thị B' },
  { name: 'TK_SOTIETKIEM', area: 'bi_saving_zone', mode: 'overwrite' as const, partitionBy: 'monthly' as const, owner: 'Lê Văn C' },
  { name: 'SP_SANPHAM', area: 'bi_product_zone', mode: 'overwrite' as const, partitionBy: 'none' as const, owner: 'Phạm Thị D' },
  { name: 'BC_DOANHTHU_NGAY', area: 'bi_report_zone', mode: 'overwrite' as const, partitionBy: 'daily' as const, owner: 'Trần Thị B' },
  { name: 'BC_TONGHOP_THANG', area: 'bi_report_zone', mode: 'overwrite' as const, partitionBy: 'monthly' as const, owner: 'Nguyễn Văn A' },
  { name: 'DM_CHINHANH', area: 'bi_master_zone', mode: 'overwrite' as const, partitionBy: 'none' as const, owner: 'Phạm Thị D' },
  { name: 'DM_NHANVIEN', area: 'bi_master_zone', mode: 'overwrite' as const, partitionBy: 'none' as const, owner: 'Lê Văn C' },
  { name: 'AML_GIAODICH_NGHINGO', area: 'bi_aml_zone', mode: 'append' as const, partitionBy: 'daily' as const, owner: 'Nguyễn Văn A' },
  { name: 'WALLET_VIEN', area: 'bi_wallet_zone', mode: 'append' as const, partitionBy: 'daily' as const, owner: 'Trần Thị B' },
]

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

export function DataCatalog() {
  const navigate = useNavigate()

  const [sources, setSources] = useState<DataSource[]>([...mockDataSources])
  const [scanningIds, setScanningIds] = useState<Record<string, boolean>>({})

  const [activeTab, setActiveTab] = useState<ModuleType>('source')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [activeType, setActiveType] = useState('')
  const [activeStatus, setActiveStatus] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
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
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearch() {
    setActiveSearch(search); setActiveType(filterType); setActiveStatus(filterStatus); setActiveCategory(filterCategory); setPage(1)
  }
  function handleReset() {
    setSearch(''); setFilterType(''); setFilterStatus(''); setFilterCategory('')
    setActiveSearch(''); setActiveType(''); setActiveStatus(''); setActiveCategory(''); setPage(1)
  }

  function openAddDialog() {
    setEditItem(null)
    setFormName(''); setFormDesc(''); setFormType('database'); setFormSchema('')
    setFormTable(''); setFormCategory('KH'); setFormOwner(mockUsers[0]?.name ?? ''); setFormTeam('Nhóm Khách hàng')
    setFormModuleType(activeTab); setFormSourceTableIds([]); setFormPeriodType('monthly'); setFormKpiFormula('')
    setFormThresholds(emptyThresholds()); setSqlwfSynced(false)
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
            syncSource: sqlwfMatch ? 'sqlwf' : 'manual',
            partitionBy: sqlwfMatch?.partitionBy,
            mode: sqlwfMatch?.mode,
            area: sqlwfMatch?.area,
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
        syncSource: sqlwfMatch ? 'sqlwf' : 'manual',
        partitionBy: sqlwfMatch?.partitionBy,
        mode: sqlwfMatch?.mode,
        area: sqlwfMatch?.area,
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
    setBulkDialogOpen(false); setBulkSelectedTables([]); setBulkSearchTable('')
    setBulkThresholds(emptyThresholds())
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
        const sqlwf = SQLWF_TABLES.find(t => t.name.toLowerCase() === get('Tên bảng').toLowerCase())
        return {
          id: `ds-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: get('Tên bảng'),
          description: '',
          type: (get('Loại kết nối') || 'database') as DataSource['type'],
          schema: get('Schema') || sqlwf?.area || '',
          tableName: get('Tên bảng'),
          category: get('Danh mục') || 'KH',
          owner: get('Chủ sở hữu') || sqlwf?.owner || '',
          team: get('Nhóm') || 'Nhóm Quản trị DL',
          status: 'active' as const,
          rowCount: 0, overallScore: 0,
          dimensionScores: { completeness: 0, validity: 0, consistency: 0, uniqueness: 0, accuracy: 0, timeliness: 0 },
          createdAt: now, updatedAt: now,
          moduleType: modType,
          thresholdOverrides: Object.keys(thresholds).length > 0 ? thresholds : undefined,
          syncSource: sqlwf ? 'sqlwf' : 'manual',
          partitionBy: sqlwf?.partitionBy, mode: sqlwf?.mode, area: sqlwf?.area,
        }
      })
      setSources(prev => [...newSources, ...prev])
    }
    // Rule import is display-only for demo (rules are managed in Rules page)
    setImportDialogOpen(false)
    setImportData(null); setImportValidation(null)
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="col-span-2 md:col-span-1">
              <Label className="text-xs text-gray-500 mb-1 block">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                <Input className="pl-8" placeholder="Tên bảng, mô tả..." value={search}
                  onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Loại kết nối</Label>
              <Select value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">Tất cả loại</option>
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
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                <Search className="h-4 w-4 mr-1" />Tìm kiếm
              </Button>
              <Button variant="outline" onClick={handleReset} className="text-sm">Bỏ lọc</Button>
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
                  <TableHead className="w-28 sticky right-0 z-10 sticky-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeTab !== 'source' ? 11 : 10} className="text-center py-12 text-gray-400">
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
                    <TableCell>
                      <StatusBadge status={ds.type} />
                    </TableCell>
                    <TableCell>
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
                    <TableCell>
                      {scanningIds[ds.id]
                        ? <Badge variant="secondary" className="text-blue-600 bg-blue-50 text-xs">Đang quét</Badge>
                        : <StatusBadge status={ds.status} />
                      }
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 sticky-right">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600" title="Xem chi tiết"
                          onClick={() => navigate(`/data-catalog/${ds.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
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
            <Label className="text-sm font-medium mb-1 block">Loại đối tượng <span className="text-red-500">*</span></Label>
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
              <Label className="text-sm font-medium mb-1 block">Schema</Label>
              <Input placeholder="CORE, REPORT, DM..." value={formSchema} onChange={e => setFormSchema(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Tên bảng vật lý</Label>
              <Input placeholder="VD: KH_KHACHHANG" value={formTable} onChange={e => {
                const val = e.target.value
                setFormTable(val)
                const match = SQLWF_TABLES.find(t => t.name.toLowerCase() === val.toLowerCase())
                if (match) {
                  setFormSchema(match.area)
                  const ownerMatch = mockUsers.find(u => u.name === match.owner)
                  if (ownerMatch) setFormOwner(ownerMatch.name)
                  setSqlwfSynced(true)
                } else {
                  setSqlwfSynced(false)
                }
              }} />
              {sqlwfSynced && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Đã đồng bộ metadata từ SQLWF (area, owner)
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
              <Label className="text-sm font-medium mb-1 block">Chủ sở hữu</Label>
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

          {/* Threshold overrides per dimension */}
          <div className="border-t border-gray-100 pt-4">
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">
              Ngưỡng cảnh báo theo chiều dữ liệu
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
            <div className="flex gap-2">
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
            </div>
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
    </div>
  )
}
