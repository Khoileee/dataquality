import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Download, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
  AlertTriangle, RefreshCw,
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
import { getScoreColor, getScoreBarColor, formatDateTime } from '@/lib/utils'
import { mockDataSources, mockUsers } from '@/data/mockData'
import type { DataSource } from '@/types'

const PAGE_SIZE = 10

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

  const filtered = sources.filter(ds => {
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
    setDialogOpen(true)
  }

  function openEditDialog(ds: DataSource) {
    setEditItem(ds)
    setFormName(ds.name); setFormDesc(ds.description); setFormType(ds.type)
    setFormSchema(ds.schema); setFormTable(ds.tableName); setFormCategory(ds.category)
    setFormOwner(ds.owner); setFormTeam(ds.team)
    setDialogOpen(true)
  }

  function handleSave() {
    const now = new Date().toISOString()
    if (editItem) {
      setSources(prev => prev.map(ds => ds.id === editItem.id
        ? { ...ds, name: formName, description: formDesc, type: formType as DataSource['type'], schema: formSchema, tableName: formTable, category: formCategory, owner: formOwner, team: formTeam, updatedAt: now }
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
            <Plus className="h-4 w-4" />Thêm nguồn dữ liệu
          </Button>
        }
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
              <Badge variant="secondary">{filtered.length} bảng</Badge>
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
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead>Tên bảng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Chủ sở hữu</TableHead>
                  <TableHead>Điểm tổng</TableHead>
                  <TableHead>Lần phân tích cuối</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-28">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-gray-400">
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
                    <TableCell className="text-center text-sm text-gray-500 font-medium">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => navigate(`/data-catalog/${ds.id}`)} className="text-left">
                        <span className="font-semibold text-blue-600 hover:underline block">{ds.name}</span>
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
                    <TableCell>
                      <div className="flex items-center gap-0.5">
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
                Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} bảng
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
        title={editItem ? 'Chỉnh sửa nguồn dữ liệu' : 'Thêm nguồn dữ liệu'}
        description={editItem ? `Cập nhật thông tin bảng ${editItem.name}` : 'Điền thông tin để thêm nguồn dữ liệu mới'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-sm font-medium mb-1 block">Tên bảng hiển thị <span className="text-red-500">*</span></Label>
              <Input placeholder="VD: KH_KHACHHANG" value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium mb-1 block">Mô tả</Label>
              <Textarea placeholder="Mô tả nội dung và mục đích của bảng dữ liệu..." value={formDesc}
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
