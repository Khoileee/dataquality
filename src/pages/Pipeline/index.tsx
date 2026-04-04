import { useState } from 'react'
import { GitBranch, Plus, Pencil, Trash2, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight, ArrowUpDown, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
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
  if (!ids.length) return <span className="text-slate-400 text-xs">—</span>
  const names = ids.map(id => mockDataSources.find(d => d.id === id)?.name ?? id)
  const visible = names.slice(0, MAX_CHIPS)
  const overflow = names.length - MAX_CHIPS
  return (
    <div className="flex items-center gap-1">
      {visible.map(n => (
        <span key={n} title={n}
          className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 max-w-[120px] truncate block">
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
              <div className="text-slate-400 text-[10px] font-semibold uppercase mb-1">Tất cả bảng ({names.length})</div>
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

  const totalPages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE))
  const paginated = jobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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

  const statsActive = jobs.filter(j => j.status === 'active').length
  const allTrackedIds = new Set([...jobs.flatMap(j => [...j.inputTableIds, ...j.outputTableIds])])

  const filteredInputTables = mockDataSources.filter(ds =>
    ds.name.toLowerCase().includes(inputSearch.toLowerCase())
  )
  const filteredOutputTables = mockDataSources.filter(ds =>
    ds.name.toLowerCase().includes(outputSearch.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
            <GitBranch className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Quản lý Job</h1>
            <p className="text-sm text-slate-500">Quản lý job ETL và luồng dữ liệu</p>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
          <Plus className="h-4 w-4" />
          Thêm job
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng job', value: jobs.length, color: '#6366f1' },
          { label: 'Đang hoạt động', value: statsActive, color: '#10b981' },
          { label: 'Bảng được track', value: allTrackedIds.size, color: '#f59e0b' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: s.color + '18' }}>
                <span className="text-lg font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
              <span className="text-sm text-slate-600 font-medium">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
            Danh sách jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center sticky left-0 z-10 sticky-left">STT</TableHead>
                  <TableHead><span className="inline-flex items-center gap-1">Tên Job <InfoTooltip text="Tên định danh của job xử lý dữ liệu (ETL/SQL/Spark)" /></span></TableHead>
                  <TableHead><span className="inline-flex items-center gap-1">Bảng đầu vào <InfoTooltip text="Các bảng dữ liệu mà job đọc làm input" /></span></TableHead>
                  <TableHead><span className="inline-flex items-center gap-1">Bảng đầu ra <InfoTooltip text="Các bảng dữ liệu mà job ghi kết quả ra" /></span></TableHead>
                  <TableHead><span className="inline-flex items-center gap-1">Lịch chạy <InfoTooltip text="Tần suất job được trigger bởi orchestrator (Rundeck/Airflow)" /></span></TableHead>
                  <TableHead><span className="inline-flex items-center gap-1">Kết quả gần nhất <InfoTooltip text="Trạng thái lần chạy gần nhất: Thành công (load OK), Lỗi (crash/timeout), Một phần (partial data)" /></span></TableHead>
                  <TableHead><span className="inline-flex items-center gap-1">Trạng thái <InfoTooltip text="Trạng thái quản lý của job: Hoạt động = đang được lập lịch, Bảo trì = tạm dừng" /></span></TableHead>
                  <TableHead className="text-center sticky right-0 z-10 sticky-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((job, idx) => (
                  <TableRow key={job.id} className="hover:bg-slate-50/60">
                    <TableCell className="text-center text-sm text-gray-500 font-medium sticky left-0 z-10 sticky-left">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-800" title={`${job.name} — ${job.description}`}>{job.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 max-w-[320px] truncate">{job.description}</div>
                    </TableCell>
                    <TableCell className="max-w-[160px]"><TableChips ids={job.inputTableIds} /></TableCell>
                    <TableCell className="max-w-[160px]"><TableChips ids={job.outputTableIds} /></TableCell>
                    <TableCell className="text-xs text-slate-600 whitespace-nowrap">{job.schedule}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {runStatusIcon(job.lastRunStatus)}
                        <span className="text-xs text-slate-600">{runStatusLabel[job.lastRunStatus]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${job.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {job.status === 'active' ? 'Hoạt động' : 'Tắt'}
                      </span>
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 sticky-right">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(job)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(job)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, jobs.length)} / {jobs.length}</span>
              <div className="flex items-center gap-1">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </button>
                <span className="text-xs text-slate-600 px-2">{page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeDialog} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-800">{editingId ? 'Chỉnh sửa job' : 'Thêm job mới'}</h2>
              <button onClick={closeDialog} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tên job *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="VD: ETL_GD_DAILY"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
              </div>
              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Mô tả</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả ngắn gọn về job"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
              </div>
              {/* Status (full width, no Technology) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Trạng thái</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white">
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tắt</option>
                </select>
              </div>
              {/* Owner + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Chủ sở hữu</label>
                  <input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                    placeholder="Họ tên"
                    className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email liên hệ</label>
                  <input value={form.ownerEmail} onChange={e => setForm(f => ({ ...f, ownerEmail: e.target.value }))}
                    placeholder="email@company.com" type="email"
                    className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
              </div>
              {/* Team + Schedule */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nhóm</label>
                  <input value={form.team} onChange={e => setForm(f => ({ ...f, team: e.target.value }))}
                    placeholder="Nhóm thực hiện"
                    className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Lịch chạy</label>
                  <input value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
                    placeholder="VD: Hàng ngày 06:00"
                    className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
              </div>
              {/* Input tables with search */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Bảng đầu vào (input tables)</label>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input value={inputSearch} onChange={e => setInputSearch(e.target.value)}
                      placeholder="Tìm bảng..."
                      className="w-full h-8 pl-8 pr-3 text-xs border-b border-slate-200 focus:outline-none focus:bg-blue-50/30" />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2">
                    {filteredInputTables.map(ds => (
                      <label key={ds.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={form.inputTableIds.includes(ds.id)}
                          onChange={() => setForm(f => ({ ...f, inputTableIds: toggleId(f.inputTableIds, ds.id) }))}
                          className="h-3.5 w-3.5 accent-blue-600" />
                        <span className="text-xs text-slate-700">{ds.name}</span>
                      </label>
                    ))}
                    {filteredInputTables.length === 0 && (
                      <span className="text-xs text-slate-400 col-span-2 py-2 text-center">Không tìm thấy bảng</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Output tables with search */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Bảng đầu ra (output tables)</label>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input value={outputSearch} onChange={e => setOutputSearch(e.target.value)}
                      placeholder="Tìm bảng..."
                      className="w-full h-8 pl-8 pr-3 text-xs border-b border-slate-200 focus:outline-none focus:bg-blue-50/30" />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2">
                    {filteredOutputTables.map(ds => (
                      <label key={ds.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={form.outputTableIds.includes(ds.id)}
                          onChange={() => setForm(f => ({ ...f, outputTableIds: toggleId(f.outputTableIds, ds.id) }))}
                          className="h-3.5 w-3.5 accent-blue-600" />
                        <span className="text-xs text-slate-700">{ds.name}</span>
                      </label>
                    ))}
                    {filteredOutputTables.length === 0 && (
                      <span className="text-xs text-slate-400 col-span-2 py-2 text-center">Không tìm thấy bảng</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <button onClick={closeDialog} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Hủy</button>
              <button onClick={handleSave} disabled={!form.name.trim()}
                className="px-4 py-2 text-sm rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                {editingId ? 'Lưu thay đổi' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">Xóa job</h3>
            </div>
            <p className="text-sm text-slate-600 mb-5">Bạn có chắc muốn xóa job <span className="font-semibold text-slate-800">{deleteTarget.name}</span>? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Hủy</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
