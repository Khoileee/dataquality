import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Search, Eye, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import { mockDataSources, mockIssues } from '@/data/mockData'
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

  const details = tableIds.map(id => {
    const ds = mockDataSources.find(d => d.id === id)
    return `${ds?.name || id}: ${ds?.overallScore ?? '—'}`
  }).join('\n')

  if (noDataCount === total) {
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500 border border-gray-200" title={details}>Chưa quét</span>
  }
  if (failCount > 0) {
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200" title={details}>{failCount}/{total} lỗi</span>
  }
  if (warnCount > 0) {
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200" title={details}>{warnCount}/{total} cảnh báo</span>
  }
  return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title={details}>{total}/{total} OK</span>
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

interface PipelineListViewProps {
  jobs: PipelineJob[]
}

export function PipelineListView({ jobs }: PipelineListViewProps) {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE))
  const paginated = jobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center text-gray-400">
            <Search className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Không tìm thấy pipeline nào phù hợp bộ lọc</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">Danh sách Pipeline</CardTitle>
          <Badge variant="secondary">{jobs.length} job</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center sticky left-0 z-10 sticky-left">STT</TableHead>
                <TableHead className="min-w-[200px]">
                  <span className="inline-flex items-center gap-1">Tên Job <InfoTooltip text="Tên và mô tả job ETL trên hệ thống pipeline" /></span>
                </TableHead>
                <TableHead><span className="inline-flex items-center gap-1">Bảng đầu vào <InfoTooltip text="Các bảng dữ liệu nguồn mà job đọc làm input" /></span></TableHead>
                <TableHead><span className="inline-flex items-center gap-1">Bảng đầu ra <InfoTooltip text="Các bảng dữ liệu kết quả mà job tạo ra" /></span></TableHead>
                <TableHead className="w-[120px]"><span className="inline-flex items-center gap-1">DQ Input <InfoTooltip text="Trạng thái chất lượng tổng hợp của các bảng đầu vào" /></span></TableHead>
                <TableHead className="w-[120px]"><span className="inline-flex items-center gap-1">DQ Output <InfoTooltip text="Trạng thái chất lượng tổng hợp của các bảng đầu ra" /></span></TableHead>
                <TableHead className="w-[100px]"><span className="inline-flex items-center gap-1">Job Status <InfoTooltip text="Kết quả lần chạy gần nhất" /></span></TableHead>
                <TableHead className="w-[120px]">Lịch chạy</TableHead>
                <TableHead className="w-[100px]">Team</TableHead>
                <TableHead className="w-16 text-center sticky right-0 z-10 sticky-right">Xem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((job, idx) => (
                <TableRow key={job.id} className="hover:bg-gray-50">
                  <TableCell className="text-center text-sm text-gray-500 font-medium sticky left-0 z-10 sticky-left">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-gray-800 truncate max-w-[220px]" title={job.name}>{job.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5 max-w-[220px] truncate" title={job.description}>{job.description}</div>
                  </TableCell>
                  <TableCell className="max-w-[160px]"><TableChips ids={job.inputTableIds} /></TableCell>
                  <TableCell className="max-w-[160px]"><TableChips ids={job.outputTableIds} /></TableCell>
                  <TableCell><DqStatusBadge tableIds={job.inputTableIds} /></TableCell>
                  <TableCell><DqStatusBadge tableIds={job.outputTableIds} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {runStatusIcon(job.lastRunStatus)}
                      <span className="text-xs text-gray-600">{runStatusLabel[job.lastRunStatus]}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 whitespace-nowrap">{job.schedule}</TableCell>
                  <TableCell><span className="text-xs text-gray-600 truncate block max-w-[90px]" title={job.team}>{job.team}</span></TableCell>
                  <TableCell className="sticky right-0 z-10 sticky-right">
                    <div className="flex items-center justify-center">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                        title="Xem chi tiết bảng đầu ra"
                        onClick={() => { const first = job.outputTableIds[0]; if (first) navigate(`/data-catalog/${first}`) }}>
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
            <span className="text-xs text-gray-500">Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, jobs.length)} / {jobs.length}</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-xs text-gray-600 px-2">{page} / {totalPages}</span>
              <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
