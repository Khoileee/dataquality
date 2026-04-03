import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AlertCircle, AlertTriangle, Clock, CheckCircle2,
  Database, Eye, Download, Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DimensionBadge } from '@/components/common/DimensionBadge'
import { PageHeader } from '@/components/common/PageHeader'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import { formatDateTime } from '@/lib/utils'
import { mockIssues, mockDataSources, getDownstreamJobs } from '@/data/mockData'
import { _ruleGeneratedIssues } from '@/pages/Rules'
import type { Issue } from '@/types'

const PAGE_SIZE = 10

function exportCSV(issues: Issue[]) {
  const header = ['STT', 'ID', 'Tiêu đề', 'Mức độ', 'Trạng thái', 'Bảng DL', 'Chiều DL', 'Phát hiện lúc', 'Gán cho']
  const rows = issues.map((iss, i) => [
    i + 1,
    iss.id.toUpperCase(),
    `"${iss.title.replace(/"/g, '""')}"`,
    iss.severity,
    iss.status,
    iss.tableName,
    iss.dimension,
    iss.detectedAt,
    iss.assignedTo ?? '',
  ])
  const csv = [header, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `issues_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function DownstreamImpactBadge({ tableId }: { tableId: string }) {
  const [open, setOpen] = useState(false)
  const jobs = getDownstreamJobs(tableId)
  if (jobs.length === 0) return <span className="text-gray-400 text-xs">—</span>
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
      >
        ⚡ {jobs.length} job{jobs.length > 1 ? 's' : ''}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-7 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 min-w-[220px] max-w-[280px]">
            <div className="text-xs font-semibold text-slate-600 mb-2">Job phụ thuộc:</div>
            <div className="space-y-1.5">
              {jobs.map(job => (
                <div key={job.id} className="flex items-start gap-2 text-xs">
                  <span className="text-amber-500 mt-0.5">⚡</span>
                  <div>
                    <div className="font-semibold text-slate-800">{job.name}</div>
                    <div className="text-slate-500">{job.owner}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function Issues() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefilledTableId = (location.state as { tableId?: string } | null)?.tableId ?? ''

  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState('')
  const [status, setStatus] = useState('')
  const [tableFilter, setTableFilter] = useState(prefilledTableId)
  const [dimension, setDimension] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)

  // Merge mock issues with auto-generated issues from rule runs (newest first)
  const allIssues: Issue[] = [..._ruleGeneratedIssues, ...mockIssues]

  const newCount = allIssues.filter(i => i.status === 'new').length
  const inProgressCount = allIssues.filter(i => i.status === 'in_progress' || i.status === 'assigned').length
  const pendingCount = allIssues.filter(i => i.status === 'pending_review').length
  const resolvedCount = allIssues.filter(i => i.status === 'resolved' || i.status === 'closed').length

  const filtered = allIssues.filter(issue => {
    if (search && !issue.title.toLowerCase().includes(search.toLowerCase())) return false
    if (severity && issue.severity !== severity) return false
    if (status && issue.status !== status) return false
    if (tableFilter && issue.tableId !== tableFilter) return false
    if (dimension && issue.dimension !== dimension) return false
    if (fromDate && issue.detectedAt < fromDate) return false
    if (toDate && issue.detectedAt.slice(0, 10) > toDate) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearch = () => setPage(1)


  return (
    <div className="space-y-6">
      <PageHeader
        title="Vấn đề & Sự cố"
        description="Vấn đề được TỰ ĐỘNG tạo khi rule kiểm tra thất bại qua Lịch chạy. Mỗi rule fail = 1 Issue mới (trạng thái 'Mới'). Gán cho người xử lý → Đang xử lý → Đã giải quyết → Đóng."
        breadcrumbs={[{ label: 'Vấn đề & Sự cố' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Mới</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{newCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đang xử lý</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{inProgressCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chờ xét duyệt</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{pendingCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã giải quyết</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{resolvedCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tìm kiếm</label>
              <Input
                placeholder="Tìm theo tiêu đề..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Mức độ</label>
              <Select value={severity} onChange={e => setSeverity(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="critical">Nghiêm trọng</option>
                <option value="high">Cao</option>
                <option value="medium">Trung bình</option>
                <option value="low">Thấp</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Trạng thái</label>
              <Select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="new">Mới</option>
                <option value="assigned">Đã gán</option>
                <option value="in_progress">Đang xử lý</option>
                <option value="pending_review">Chờ duyệt</option>
                <option value="resolved">Đã xử lý</option>
                <option value="closed">Đóng</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Bảng dữ liệu</label>
              <Select value={tableFilter} onChange={e => setTableFilter(e.target.value)}>
                <option value="">Tất cả</option>
                {mockDataSources.map(ds => (
                  <option key={ds.id} value={ds.id}>{ds.tableName}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="flex items-end gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Chiều DL</label>
                <Select value={dimension} onChange={e => setDimension(e.target.value)} className="w-40">
                  <option value="">Tất cả</option>
                  <option value="completeness">Đầy đủ</option>
                  <option value="validity">Hợp lệ</option>
                  <option value="consistency">Nhất quán</option>
                  <option value="uniqueness">Duy nhất</option>
                  <option value="accuracy">Chính xác</option>
                  <option value="timeliness">Kịp thời</option>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Từ ngày</label>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Đến ngày</label>
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSearch} className="gap-2">
                <Search className="h-4 w-4" />
                Tìm kiếm
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => exportCSV(filtered)}>
                <Download className="h-4 w-4" />
                Xuất CSV ({filtered.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Danh sách vấn đề</CardTitle>
            <Badge variant="secondary">{filtered.length} vấn đề</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">STT</TableHead>
                <TableHead className="w-24">ID</TableHead>
                <TableHead><span className="inline-flex items-center gap-1">Tiêu đề <InfoTooltip text="Mô tả ngắn gọn vấn đề, được tự động sinh từ tên rule vi phạm" /></span></TableHead>
                <TableHead className="w-32"><span className="inline-flex items-center gap-1">Mức độ <InfoTooltip text="Mức độ nghiêm trọng: Critical (khẩn cấp, SLA 24h), High (cao), Medium (trung bình), Low (thấp)" /></span></TableHead>
                <TableHead className="w-36">Bảng dữ liệu</TableHead>
                <TableHead className="w-28">Chiều DL</TableHead>
                <TableHead className="w-28"><span className="inline-flex items-center gap-1">⚡ Tác động <InfoTooltip text="Số job downstream đọc từ bảng bị lỗi — có thể bị ảnh hưởng bởi vấn đề này" /></span></TableHead>
                <TableHead className="w-36">Phát hiện lúc</TableHead>
                <TableHead className="w-36"><span className="inline-flex items-center gap-1">Gán cho <InfoTooltip text="Người được phân công xử lý. Cập nhật trong trang chi tiết vấn đề." /></span></TableHead>
                <TableHead className="w-28"><span className="inline-flex items-center gap-1">Trạng thái <InfoTooltip text="Vòng đời: Mới → Đã gán → Đang xử lý → Chờ xét duyệt → Đã giải quyết → Đóng" /></span></TableHead>
                <TableHead className="w-16 text-center">Xem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12 text-gray-400">
                    Không tìm thấy vấn đề nào
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((issue, idx) => (
                  <TableRow key={issue.id} className="hover:bg-gray-50">
                    <TableCell className="text-center text-sm text-gray-500 font-medium">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {issue.id.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => navigate(`/issues/${issue.id}`)}
                        className="text-left hover:text-blue-600 group"
                      >
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {issue.title}
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-xs mt-0.5">
                          {issue.description}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={issue.severity} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Database className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{issue.tableName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DimensionBadge dimension={issue.dimension} />
                    </TableCell>
                    <TableCell>
                      <DownstreamImpactBadge tableId={issue.tableId} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{formatDateTime(issue.detectedAt)}</span>
                    </TableCell>
                    <TableCell>
                      {issue.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0">
                            {issue.assignedTo.charAt(0)}
                          </div>
                          <span className="text-sm text-gray-700 truncate max-w-[100px]">{issue.assignedTo}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Chưa gán</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={issue.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => navigate(`/issues/${issue.id}`)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} vấn đề
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Trước
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                    className="w-8 h-8 p-0"
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
