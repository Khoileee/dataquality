import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Download, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
  AlertTriangle, RefreshCw, Database, FileBarChart, Target,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import type { DataSource, ModuleType, PeriodType } from '@/types'

const PAGE_SIZE = 10

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
    setDialogOpen(true)
  }

  function openEditDialog(ds: DataSource) {
    setEditItem(ds)
    setFormName(ds.name); setFormDesc(ds.description); setFormType(ds.type)
    setFormSchema(ds.schema); setFormTable(ds.tableName); setFormCategory(ds.category)
    setFormOwner(ds.owner); setFormTeam(ds.team)
    setFormModuleType(ds.moduleType); setFormSourceTableIds(ds.sourceTableIds ?? [])
    setFormPeriodType(ds.periodType ?? 'monthly'); setFormKpiFormula(ds.kpiFormula ?? '')
    setDialogOpen(true)
  }

  function handleSave() {
    const now = new Date().toISOString()
    if (editItem) {
      setSources(prev => prev.map(ds => ds.id === editItem.id
        ? {
            ...ds, name: formName, description: formDesc, type: formType as DataSource['type'],
            schema: formSchema, tableName: formTable, category: formCategory, owner: formOwner, team: formTeam,
            moduleType: formModuleType,
            sourceTableIds: formModuleType !== 'source' ? formSourceTableIds : undefined,
            periodType: formModuleType === 'kpi' ? formPeriodType : undefined,
            kpiFormula: formModuleType === 'kpi' ? formKpiFormula : undefined,
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
      }
      setSources(prev => [newDs, ...prev])
    }
    setDialogOpen(false)
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
          <Button onClick={openAddDialog} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4" />Thêm {activeTab === 'source' ? 'bảng nguồn' : activeTab === 'report' ? 'báo cáo' : 'chỉ tiêu'}
          </Button>
        }
      />

      {/* Module Type Tabs */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
        {MODULE_TABS.map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); setSelected([]) }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <Badge variant={isActive ? 'default' : 'secondary'} className={`ml-1 text-xs ${isActive ? 'bg-blue-500 text-white' : ''}`}>
                {countByModule[tab.key]}
              </Badge>
            </button>
          )
        })}
        <div className="ml-auto px-3 text-xs text-gray-400">
          {MODULE_TABS.find(t => t.key === activeTab)?.description}
        </div>
      </div>

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
                <option value="inactive">Không HĐ</option>
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
'Không HĐ' = tạm dừng giám sát." /></span></TableHead>
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
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => navigate(`/data-catalog/${ds.id}`)}
                          className="p-1 rounded hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => !scanningIds[ds.id] && handleScanNow(ds.id)}
                          disabled={scanningIds[ds.id]}
                          className="p-1 rounded hover:bg-green-50 hover:text-green-600 text-gray-400 disabled:opacity-40 transition-colors"
                          title="Quét ngay"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditDialog(ds)}
                          className="p-1 rounded hover:bg-amber-50 hover:text-amber-600 text-gray-400 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteItem(ds)}
                          className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageNums.map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${n === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
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
              <Input placeholder="VD: KH_KHACHHANG" value={formTable} onChange={e => setFormTable(e.target.value)} />
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
