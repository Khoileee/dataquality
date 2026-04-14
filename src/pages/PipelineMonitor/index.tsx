import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, RefreshCw, AlertTriangle, XCircle, BarChart2,
  GitBranch, Eye, CheckCircle, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import { PageHeader } from '@/components/common/PageHeader'
import { mockPipelineJobs, mockDataSources, mockSchedules } from '@/data/mockData'
import type { PipelineJob } from '@/types'
import type { DqGrade } from './PipelineNodes'

const PAGE_SIZE = 10

// ─── Helpers ────────────────────────────────────────────────────────

function getGrade(tableId: string): DqGrade {
  const ds = mockDataSources.find(d => d.id === tableId)
  if (!ds || !ds.lastProfiled) return 'no_data'
  if (ds.overallScore >= 85) return 'pass'
  if (ds.overallScore >= 70) return 'warning'
  return 'fail'
}

function hasDqIssue(job: PipelineJob): boolean {
  return [...job.inputTableIds, ...job.outputTableIds].some(id => getGrade(id) === 'fail')
}

function getScanProgress(job: PipelineJob): { scanned: number; total: number } {
  const allIds = [...job.inputTableIds, ...job.outputTableIds]
  const scanned = allIds.filter(id => {
    const sch = mockSchedules.find(s => s.tableId === id)
    return sch && sch.lastRunStatus === 'success'
  }).length
  return { scanned, total: allIds.length }
}

const runStatusIcon = (s: string) => {
  if (s === 'success') return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
  if (s === 'failed') return <XCircle className="h-3.5 w-3.5 text-red-500" />
  return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
}
const runStatusLabel: Record<string, string> = { success: 'Thành công', failed: 'Lỗi', partial: 'Một phần' }

// ─── DQ Status Badge ────────────────────────────────────────────────

function DqStatusBadge({ tableIds }: { tableIds: string[] }) {
  if (tableIds.length === 0) return <span className="text-gray-400 text-xs">—</span>
  const grades = tableIds.map(id => getGrade(id))
  const failCount = grades.filter(g => g === 'fail').length
  const warnCount = grades.filter(g => g === 'warning').length
  const noDataCount = grades.filter(g => g === 'no_data').length
  const total = tableIds.length

  if (noDataCount === total) return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">Chưa quét</span>
  if (failCount > 0) return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">{failCount}/{total} lỗi</span>
  if (warnCount > 0) return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">{warnCount}/{total} cảnh báo</span>
  return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{total}/{total} OK</span>
}

// ─── Progress Bar ───────────────────────────────────────────────────

function ScanProgressBar({ job }: { job: PipelineJob }) {
  const { scanned, total } = getScanProgress(job)
  if (total === 0) return <span className="text-gray-400 text-xs">—</span>
  const pct = Math.round((scanned / total) * 100)
  const color = pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'

  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-gray-600 whitespace-nowrap tabular-nums">{scanned}/{total}</span>
    </div>
  )
}

// ─── Table Chips ────────────────────────────────────────────────────

function TableChips({ ids }: { ids: string[] }) {
  const [open, setOpen] = useState(false)
  if (!ids.length) return <span className="text-gray-400 text-xs">—</span>
  const names = ids.map(id => mockDataSources.find(d => d.id === id)?.name ?? id)
  const visible = names.slice(0, 2)
  const overflow = names.length - 2
  return (
    <div className="flex items-center gap-1 flex-nowrap">
      {visible.map(n => (
        <span key={n} title={n} className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200 max-w-[100px] truncate">{n}</span>
      ))}
      {overflow > 0 && (
        <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200 cursor-default whitespace-nowrap">+{overflow}</span>
          {open && (
            <div className="absolute left-0 top-6 z-50 bg-slate-800 text-white text-xs rounded-lg shadow-xl px-3 py-2 min-w-[150px] space-y-1.5 pointer-events-none">
              <div className="text-gray-400 text-[10px] font-semibold uppercase mb-1">Tất cả ({names.length})</div>
              {names.map(n => (
                <div key={n} className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" /><span>{n}</span></div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────

export function PipelineMonitorPage() {
  const navigate = useNavigate()
  const [syncing, setSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState('13/04/2026 08:00')
  const [page, setPage] = useState(1)

  // Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDqStatus, setFilterDqStatus] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [activeDqStatus, setActiveDqStatus] = useState('')

  const filteredJobs = useMemo(() => {
    return mockPipelineJobs.filter(job => {
      if (activeSearch) {
        const term = activeSearch.toLowerCase()
        const inputNames = job.inputTableIds.map(id => mockDataSources.find(d => d.id === id)?.name || '').join(' ').toLowerCase()
        const outputNames = job.outputTableIds.map(id => mockDataSources.find(d => d.id === id)?.name || '').join(' ').toLowerCase()
        if (!job.name.toLowerCase().includes(term) && !job.description.toLowerCase().includes(term) && !inputNames.includes(term) && !outputNames.includes(term)) return false
      }
      if (activeDqStatus === 'issues') { if (!hasDqIssue(job)) return false }
      else if (activeDqStatus === 'ok') {
        if (hasDqIssue(job)) return false
        if ([...job.inputTableIds, ...job.outputTableIds].some(id => getGrade(id) === 'no_data')) return false
      }
      else if (activeDqStatus === 'no_data') {
        if (![...job.inputTableIds, ...job.outputTableIds].every(id => getGrade(id) === 'no_data')) return false
      }
      return true
    })
  }, [activeSearch, activeDqStatus])

  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => (hasDqIssue(b) ? 1 : 0) - (hasDqIssue(a) ? 1 : 0))
  }, [filteredJobs])

  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / PAGE_SIZE))
  const paginated = sortedJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Stats
  const stats = useMemo(() => {
    const allTableIds = new Set<string>()
    let jobsWithIssues = 0
    mockPipelineJobs.forEach(job => {
      job.inputTableIds.forEach(id => allTableIds.add(id))
      job.outputTableIds.forEach(id => allTableIds.add(id))
      if (hasDqIssue(job)) jobsWithIssues++
    })
    const tablesWithIssues = Array.from(allTableIds).filter(id => getGrade(id) === 'fail').length
    const scores = Array.from(allTableIds).map(id => mockDataSources.find(d => d.id === id)?.overallScore).filter((s): s is number => s !== undefined)
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    return { totalPipelines: mockPipelineJobs.length, withIssues: jobsWithIssues, tablesWithIssues, avgScore }
  }, [])

  function handleSearch() { setActiveSearch(searchTerm); setActiveDqStatus(filterDqStatus); setPage(1) }
  function handleReset() { setSearchTerm(''); setFilterDqStatus(''); setActiveSearch(''); setActiveDqStatus(''); setPage(1) }

  function handleSync() {
    setSyncing(true)
    setTimeout(() => {
      const now = new Date()
      setLastSyncAt(`${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`)
      setSyncing(false)
    }, 1500)
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <PageHeader
        title="Giám sát Pipeline"
        description="Theo dõi tiến độ quét chất lượng dữ liệu trên từng pipeline — dữ liệu đồng bộ từ SQLWF"
        breadcrumbs={[{ label: 'Giám sát Pipeline' }]}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Lần sync: {lastSyncAt}</span>
            <Button onClick={handleSync} disabled={syncing} variant="outline" className="flex items-center gap-2 text-sm">
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Đang đồng bộ...' : 'Đồng bộ SQLWF'}
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng pipeline', value: stats.totalPipelines, icon: GitBranch, color: '#6366f1', bg: '#6366f118' },
          { label: 'Có vấn đề DQ', value: stats.withIssues, icon: AlertTriangle, color: '#ef4444', bg: '#ef444418' },
          { label: 'Bảng lỗi DQ', value: stats.tablesWithIssues, icon: XCircle, color: '#f59e0b', bg: '#f59e0b18' },
          { label: 'Score trung bình', value: stats.avgScore, icon: BarChart2, color: stats.avgScore >= 85 ? '#10b981' : stats.avgScore >= 70 ? '#f59e0b' : '#ef4444', bg: stats.avgScore >= 85 ? '#10b98118' : stats.avgScore >= 70 ? '#f59e0b18' : '#ef444418' },
        ].map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                  <Icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <div>
                  <div className="text-xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <Label className="text-xs text-gray-500 mb-1 block">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                <Input className="pl-8" placeholder="Tên job, bảng input/output..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
            </div>
            <div className="w-full md:w-44">
              <Label className="text-xs text-gray-500 mb-1 block">Trạng thái DQ</Label>
              <select className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500" value={filterDqStatus} onChange={e => setFilterDqStatus(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="issues">Có vấn đề</option>
                <option value="ok">Tất cả OK</option>
                <option value="no_data">Chưa quét</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                <Search className="h-4 w-4 mr-1" />Tìm kiếm
              </Button>
              <Button variant="outline" onClick={handleReset} className="text-sm">Bỏ lọc</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job List Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Danh sách Pipeline</CardTitle>
            <Badge variant="secondary">{sortedJobs.length} job</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sortedJobs.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Search className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Không tìm thấy pipeline nào phù hợp bộ lọc</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center sticky left-0 z-10 sticky-left">STT</TableHead>
                      <TableHead className="min-w-[180px]">
                        <span className="inline-flex items-center gap-1">Tên Job <InfoTooltip text="Tên và mô tả job ETL trên hệ thống pipeline" /></span>
                      </TableHead>
                      <TableHead className="min-w-[140px]"><span className="inline-flex items-center gap-1">Input <InfoTooltip text="Bảng dữ liệu nguồn" /></span></TableHead>
                      <TableHead className="min-w-[140px]"><span className="inline-flex items-center gap-1">Output <InfoTooltip text="Bảng dữ liệu đầu ra" /></span></TableHead>
                      <TableHead className="w-[110px]"><span className="inline-flex items-center gap-1">DQ <InfoTooltip text="Trạng thái chất lượng tổng hợp" /></span></TableHead>
                      <TableHead className="w-[140px]"><span className="inline-flex items-center gap-1">Tiến độ quét <InfoTooltip text="Số bảng đã được quét DQ / tổng số bảng" /></span></TableHead>
                      <TableHead className="w-[110px]">Job Status</TableHead>
                      <TableHead className="w-[130px]">Lịch chạy</TableHead>
                      <TableHead className="w-16 text-center sticky right-0 z-10 sticky-right">Xem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((job, idx) => (
                      <TableRow key={job.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/pipeline-monitor/${job.id}`)}>
                        <TableCell className="text-center text-sm text-gray-500 font-medium sticky left-0 z-10 sticky-left">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-gray-800 truncate max-w-[220px]" title={job.name}>{job.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5 max-w-[220px] truncate" title={job.description}>{job.description}</div>
                        </TableCell>
                        <TableCell className="max-w-[160px]"><TableChips ids={job.inputTableIds} /></TableCell>
                        <TableCell className="max-w-[160px]"><TableChips ids={job.outputTableIds} /></TableCell>
                        <TableCell><DqStatusBadge tableIds={[...job.inputTableIds, ...job.outputTableIds]} /></TableCell>
                        <TableCell><ScanProgressBar job={job} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {runStatusIcon(job.lastRunStatus)}
                            <span className="text-xs text-gray-600">{runStatusLabel[job.lastRunStatus]}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 whitespace-nowrap">{job.schedule}</TableCell>
                        <TableCell className="sticky right-0 z-10 sticky-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                              title="Xem chi tiết pipeline"
                              onClick={() => navigate(`/pipeline-monitor/${job.id}`)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sortedJobs.length)} / {sortedJobs.length}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-xs text-gray-600 px-2">{page} / {totalPages}</span>
                    <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
