import { useState } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { PageHeader } from '@/components/common/PageHeader'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import { mockPipelineJobs, mockDataSources } from '@/data/mockData'
import type { PipelineJob } from '@/types'

const PAGE_SIZE = 10

const runStatusIcon = (s: string) => {
  if (s === 'success') return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
  if (s === 'failed') return <XCircle className="h-3.5 w-3.5 text-red-500" />
  return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
}
const runStatusLabel: Record<string, string> = { success: 'Thành công', failed: 'Lỗi', partial: 'Một phần' }

const MAX_CHIPS = 1

function TableChips({ ids }: { ids: string[] }) {
  const [open, setOpen] = useState(false)
  if (!ids.length) return <span className="text-gray-400 text-xs">—</span>
  const names = ids.map(id => mockDataSources.find(d => d.id === id)?.name ?? id)
  const visible = names.slice(0, MAX_CHIPS)
  const overflow = names.length - MAX_CHIPS
  return (
    <div className="flex items-center gap-1">
      {visible.map(n => (
        <span key={n} title={n}
          className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200 max-w-[120px] truncate block">
          {n}
        </span>
      ))}
      {overflow > 0 && (
        <div className="relative"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}>
          <button className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition-colors whitespace-nowrap">
            +{overflow}
          </button>
          {open && (
            <div className="absolute left-0 top-6 z-50 bg-slate-800 text-white text-xs rounded-lg shadow-xl px-3 py-2 min-w-[150px] space-y-1.5 pointer-events-none">
              <div className="text-gray-400 text-[10px] font-semibold uppercase mb-1">Tất cả bảng ({names.length})</div>
              {names.map(n => (
                <div key={n} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                  <span>{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const emptyJob = (): Omit<PipelineJob, 'id'> => ({
  name: '', description: '', jobType: 'etl', technology: 'Spark',
  owner: '', ownerEmail: '', team: '',
  inputTableIds: [], outputTableIds: [],
  status: 'active', schedule: '', lastRunAt: new Date().toISOString(), lastRunStatus: 'success',
})

export function PipelinePage() {
  const [jobs, setJobs] = useState<PipelineJob[]>(mockPipelineJobs)
  const [page, setPage] = useState(1)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<PipelineJob, 'id'>>(emptyJob())
  const [deleteTarget, setDeleteTarget] = useState<PipelineJob | null>(null)
  const [inputSearch, setInputSearch] = useState('')
  const [outputSearch, setOutputSearch] = useState('')

  // Filter state
  const [searchJob, setSearchJob] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [activeStatus, setActiveStatus] = useState('')

  const filtered = jobs.filter(j => {
    if (activeSearch && !j.name.toLowerCase().includes(activeSearch.toLowerCase()) && !j.description.toLowerCase().includes(activeSearch.toLowerCase())) return false
    if (activeStatus && j.status !== activeStatus) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearch() { setActiveSearch(searchJob); setActiveStatus(filterStatus); setPage(1) }
  function handleReset() { setSearchJob(''); setFilterStatus(''); setActiveSearch(''); setActiveStatus(''); setPage(1) }

  const openAdd = () => { setForm(emptyJob()); setEditingId(null); setInputSearch(''); setOutputSearch(''); setShowDialog(true) }
  const openEdit = (job: PipelineJob) => {
    const { id, ...rest } = job
    setForm(rest); setEditingId(id); setInputSearch(''); setOutputSearch(''); setShowDialog(true)
  }
  const closeDialog = () => { setShowDialog(false); setEditingId(null) }

  const handleSave = () => {
    if (editingId) {
      setJobs(prev => prev.map(j => j.id === editingId ? { ...form, id: editingId } : j))
    } else {
      setJobs(prev => [...prev, { ...form, id: `pj-${Date.now()}` }])
    }
    closeDialog()
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setJobs(prev => prev.filter(j => j.id !== deleteTarget.id))
    setDeleteTarget(null)
    if (page > Math.ceil((jobs.length - 1) / PAGE_SIZE)) setPage(p => Math.max(1, p - 1))
  }

  const toggleId = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]

  const statsActive = filtered.filter(j => j.status === 'active').length
  const allTrackedIds = new Set([...filtered.flatMap(j => [...j.inputTableIds, ...j.outputTableIds])])

  const filteredInputTables = mockDataSources.filter(ds =>
    ds.name.toLowerCase().includes(inputSearch.toLowerCase())
  )
  const filteredOutputTables = mockDataSources.filter(ds =>
    ds.name.toLowerCase().includes(outputSearch.toLowerCase())
  )

  const jobListContent = (
    <div className="space-y-5">
      {/* Filter */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="col-span-2 md:col-span-2">
              <Label className="text-xs text-gray-500 mb-1 block">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input className="pl-8" placeholder="Tên job, mô tả..." value={searchJob}
                  onChange={e => setSearchJob(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Trạng thái</Label>
              <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Tắt</option>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSearch}>
              <Search className="h-3.5 w-3.5 mr-1.5" />Tìm kiếm
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              <X className="h-3.5 w-3.5 mr-1.5" />Bỏ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng job', value: filtered.length, color: '#6366f1' },
          { label: 'Đang hoạt động', value: statsActive, color: '#10b981' },
          { label: 'Bảng được track', value: allTrackedIds.size, color: '#f59e0b' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: s.color + '18' }}>
                <span className="text-lg font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
              <span className="text-sm text-gray-600 font-medium">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Danh sách job</CardTitle>
              <Badge variant="secondary">{filtered.length} job</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center sticky left-0 z-10 sticky-left">STT</TableHead>
                  <TableHead className="w-[260px]"><span className="inline-flex items-center gap-1 whitespace-nowrap">Tên Job <InfoTooltip text="Tên định danh của job xử lý dữ liệu (ETL/SQL/Spark)" /></span></TableHead>
                  <TableHead className="w-[160px]"><span className="inline-flex items-center gap-1 whitespace-nowrap">Bảng đầu vào <InfoTooltip text="Các bảng dữ liệu mà job đọc làm input" /></span></TableHead>
                  <TableHead className="w-[160px]"><span className="inline-flex items-center gap-1 whitespace-nowrap">Bảng đầu ra <InfoTooltip text="Các bảng dữ liệu mà job ghi kết quả ra" /></span></TableHead>
                  <TableHead className="w-[130px] whitespace-nowrap"><span className="inline-flex items-center gap-1">Lịch chạy <InfoTooltip text="Tần suất job được trigger bởi orchestrator (Rundeck/Airflow)" /></span></TableHead>
                  <TableHead className="w-[160px] whitespace-nowrap"><span className="inline-flex items-center gap-1">Kết quả gần nhất <InfoTooltip text="Trạng thái lần chạy gần nhất: Thành công (load OK), Lỗi (crash/timeout), Một phần (partial data)" /></span></TableHead>
                  <TableHead className="w-[130px] whitespace-nowrap"><span className="inline-flex items-center gap-1">Trạng thái <InfoTooltip text="Trạng thái quản lý của job: Hoạt động = đang được lập lịch, Bảo trì = tạm dừng" /></span></TableHead>
                  <TableHead className="w-20 text-center sticky right-0 z-10 sticky-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                      <Search className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>Không tìm thấy job nào</p>
                    </TableCell>
                  </TableRow>
                ) : paginated.map((job, idx) => (
                  <TableRow key={job.id} className="hover:bg-gray-50">
                    <TableCell className="text-center text-sm text-gray-500 font-medium sticky left-0 z-10 sticky-left">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-gray-800 truncate max-w-[240px]" title={job.name}>{job.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5 max-w-[240px] truncate" title={job.description}>{job.description}</div>
                    </TableCell>
                    <TableCell><TableChips ids={job.inputTableIds} /></TableCell>
                    <TableCell><TableChips ids={job.outputTableIds} /></TableCell>
                    <TableCell className="text-xs text-gray-600 whitespace-nowrap">{job.schedule}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={job.lastRunStatus === 'success' ? 'success' : job.lastRunStatus === 'failed' ? 'destructive' : 'warning'}>
                        <span className="inline-flex items-center gap-1">
                          {runStatusIcon(job.lastRunStatus)}
                          {runStatusLabel[job.lastRunStatus]}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={job.status === 'active' ? 'success' : 'secondary'}>
                        {job.status === 'active' ? 'Hoạt động' : 'Tắt'}
                      </Badge>
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 sticky-right">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600" title="Chỉnh sửa" onClick={() => openEdit(job)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-red-600" title="Xóa" onClick={() => setDeleteTarget(job)}>
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
              <span className="text-xs text-gray-500">Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-gray-600 px-2">{page} / {totalPages}</span>
                <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Quản lý Job"
        description="Quản lý job ETL và luồng dữ liệu trong hệ thống"
        breadcrumbs={[{ label: 'Quản lý Job' }]}
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1.5" />Thêm job
          </Button>
        }
      />

      {jobListContent}

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onClose={closeDialog} title={editingId ? 'Chỉnh sửa job' : 'Thêm job mới'} size="lg">
        <div className="space-y-4">
          <div>
            <Label>Tên job *</Label>
            <Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: ETL_GD_DAILY" />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Input className="mt-1" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn gọn về job" />
          </div>
          <div>
            <Label>Trạng thái</Label>
            <Select className="mt-1" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tắt</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Chủ sở hữu</Label>
              <Input className="mt-1" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="Họ tên" />
            </div>
            <div>
              <Label>Email liên hệ</Label>
              <Input className="mt-1" type="email" value={form.ownerEmail} onChange={e => setForm(f => ({ ...f, ownerEmail: e.target.value }))} placeholder="email@company.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nhóm</Label>
              <Input className="mt-1" value={form.team} onChange={e => setForm(f => ({ ...f, team: e.target.value }))} placeholder="Nhóm thực hiện" />
            </div>
            <div>
              <Label>Lịch chạy</Label>
              <Input className="mt-1" value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} placeholder="VD: Hàng ngày 06:00" />
            </div>
          </div>
          {/* Input tables with search */}
          <div>
            <Label className="mb-1.5 block">Bảng đầu vào (input tables)</Label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input value={inputSearch} onChange={e => setInputSearch(e.target.value)} placeholder="Tìm bảng..."
                  className="h-8 pl-8 text-xs border-0 border-b border-gray-200 rounded-none focus-visible:ring-0" />
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2">
                {filteredInputTables.map(ds => (
                  <label key={ds.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={form.inputTableIds.includes(ds.id)}
                      onChange={() => setForm(f => ({ ...f, inputTableIds: toggleId(f.inputTableIds, ds.id) }))}
                      className="h-3.5 w-3.5 accent-blue-600" />
                    <span className="text-xs text-gray-700">{ds.name}</span>
                  </label>
                ))}
                {filteredInputTables.length === 0 && (
                  <span className="text-xs text-gray-400 col-span-2 py-2 text-center">Không tìm thấy bảng</span>
                )}
              </div>
            </div>
          </div>
          {/* Output tables with search */}
          <div>
            <Label className="mb-1.5 block">Bảng đầu ra (output tables)</Label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input value={outputSearch} onChange={e => setOutputSearch(e.target.value)} placeholder="Tìm bảng..."
                  className="h-8 pl-8 text-xs border-0 border-b border-gray-200 rounded-none focus-visible:ring-0" />
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2">
                {filteredOutputTables.map(ds => (
                  <label key={ds.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={form.outputTableIds.includes(ds.id)}
                      onChange={() => setForm(f => ({ ...f, outputTableIds: toggleId(f.outputTableIds, ds.id) }))}
                      className="h-3.5 w-3.5 accent-blue-600" />
                    <span className="text-xs text-gray-700">{ds.name}</span>
                  </label>
                ))}
                {filteredOutputTables.length === 0 && (
                  <span className="text-xs text-gray-400 col-span-2 py-2 text-center">Không tìm thấy bảng</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeDialog}>Hủy</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              {editingId ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa" size="sm">
        {deleteTarget && (
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-700">Bạn có chắc muốn xóa job:</p>
              <p className="font-semibold text-gray-900 mt-0.5">{deleteTarget.name}</p>
              <p className="text-xs text-gray-500 mt-1">Hành động này không thể hoàn tác.</p>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete}>Xóa</Button>
        </div>
      </Dialog>
    </div>
  )
}
