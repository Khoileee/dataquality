import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AlertCircle, AlertTriangle, Clock, CheckCircle2,
  Database, Eye, Download, Search,
  CheckCircle, Layers, RefreshCw, Bell, Play, Shield, ChevronDown, ChevronUp,
} from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Tabs } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DimensionBadge } from '@/components/common/DimensionBadge'
import { PageHeader } from '@/components/common/PageHeader'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import { formatDateTime } from '@/lib/utils'
import { mockIssues, mockDataSources, getDownstreamJobs, cascadeChains, cascadeEvents } from '@/data/mockData'
import { _ruleGeneratedIssues } from '@/pages/Rules'
import type { Issue, ModuleType, CascadeChain, CascadeEvent } from '@/types'

const MODULE_LABELS: Record<ModuleType, string> = {
  source: 'Bảng nguồn', report: 'Báo cáo', kpi: 'Chỉ tiêu',
}
const MODULE_COLORS: Record<ModuleType, string> = {
  source: 'bg-blue-50 text-blue-700 border-blue-200',
  report: 'bg-amber-50 text-amber-700 border-amber-200',
  kpi: 'bg-purple-50 text-purple-700 border-purple-200',
}

const PAGE_SIZE = 10

function exportCSV(issues: Issue[]) {
  const header = ['STT', 'ID', 'Tiêu đề', 'Mức độ', 'Trạng thái', 'Bảng dữ liệu', 'Chiều dữ liệu', 'Phát hiện lúc', 'Gán cho']
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

const EVENT_ICON_CONFIG: Record<CascadeEvent['eventType'], { icon: React.ElementType; color: string; bg: string }> = {
  cascade_triggered: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  status_changed: { icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-100' },
  notification_sent: { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-100' },
  revalidation_started: { icon: Play, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  resolved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  chain_completed: { icon: Shield, color: 'text-green-600', bg: 'bg-green-100' },
}

const TYPE_BADGE_COLORS: Record<ModuleType, string> = {
  source: 'bg-blue-50 text-blue-700 border-blue-200',
  report: 'bg-amber-50 text-amber-700 border-amber-200',
  kpi: 'bg-purple-50 text-purple-700 border-purple-200',
}
const TYPE_BADGE_LABELS: Record<ModuleType, string> = {
  source: 'Nguồn', report: 'Báo cáo', kpi: 'Chỉ tiêu',
}

const CHAIN_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active: { label: 'Đang xử lý', cls: 'bg-red-100 text-red-700 border-red-200' },
  partially_resolved: { label: 'Xử lý 1 phần', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  resolved: { label: 'Đã giải quyết', cls: 'bg-green-100 text-green-700 border-green-200' },
}

function CascadeChainCard({ chain }: { chain: CascadeChain }) {
  const [expanded, setExpanded] = useState(false)
  const events = cascadeEvents
    .filter(e => e.chainId === chain.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const statusBadge = CHAIN_STATUS_BADGE[chain.status]

  return (
    <Card className="overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">{chain.rootTableName}</div>
              <div className="text-xs text-gray-500">
                {format(new Date(chain.startedAt), 'dd/MM HH:mm')}
                {chain.resolvedAt && ` — ${format(new Date(chain.resolvedAt), 'dd/MM HH:mm')}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>
            {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 mr-1">Ảnh hưởng:</span>
          {chain.affectedEntities.map(ent => (
            <div key={ent.tableId} className="flex items-center gap-1">
              <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${TYPE_BADGE_COLORS[ent.type]}`}>
                {TYPE_BADGE_LABELS[ent.type]}
              </span>
              <span className="text-xs text-gray-700 font-medium">{ent.tableName}</span>
              <StatusBadge status={ent.status} />
            </div>
          ))}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4">
          <div className="relative pl-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
            {events.map((evt, idx) => {
              const cfg = EVENT_ICON_CONFIG[evt.eventType]
              const Icon = cfg.icon
              return (
                <div key={evt.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className={`absolute left-[-17px] top-0.5 h-6 w-6 rounded-full ${cfg.bg} flex items-center justify-center z-10`}>
                    <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-gray-400 font-mono">
                        {format(new Date(evt.timestamp), 'dd/MM HH:mm')}
                      </span>
                      <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${TYPE_BADGE_COLORS[evt.affectedType]}`}>
                        {evt.affectedTableName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{evt.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}

function CascadeTimelineTab() {
  const activeChains = cascadeChains.filter(c => c.status === 'active')
  const resolvedChains = cascadeChains.filter(c => c.status === 'resolved')
  const totalAffected = activeChains.reduce((sum, c) => sum + c.affectedEntities.length, 0)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chuỗi đang xử lý</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{activeChains.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã giải quyết</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{resolvedChains.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Thực thể bị ảnh hưởng</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{totalAffected}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
                <Layers className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chain list */}
      <div className="space-y-4">
        {cascadeChains.map(chain => (
          <CascadeChainCard key={chain.id} chain={chain} />
        ))}
        {cascadeChains.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Không có chuỗi cảnh báo nào
          </div>
        )}
      </div>
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
  const [moduleFilter, setModuleFilter] = useState<ModuleType | ''>('')
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
    if (moduleFilter) {
      const ds = mockDataSources.find(d => d.id === issue.tableId)
      if (ds && ds.moduleType !== moduleFilter) return false
    }
    if (dimension && issue.dimension !== dimension) return false
    if (fromDate && issue.detectedAt < fromDate) return false
    if (toDate && issue.detectedAt.slice(0, 10) > toDate) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearch = () => setPage(1)


  const issueListContent = (
    <div className="space-y-6">
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
          <div className="grid grid-cols-5 gap-3">
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
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Loại nguồn</label>
              <Select value={moduleFilter} onChange={e => setModuleFilter(e.target.value as ModuleType | '')}>
                <option value="">Tất cả</option>
                <option value="source">Bảng nguồn</option>
                <option value="report">Báo cáo</option>
                <option value="kpi">Chỉ tiêu</option>
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
                <TableHead className="w-12 text-center sticky left-0 z-10 sticky-left">STT</TableHead>
                <TableHead className="w-24">ID</TableHead>
                <TableHead><span className="inline-flex items-center gap-1">Tiêu đề <InfoTooltip text="Mô tả ngắn gọn vấn đề, được tự động sinh từ tên rule vi phạm" /></span></TableHead>
                <TableHead className="w-32"><span className="inline-flex items-center gap-1">Mức độ <InfoTooltip text="Mức độ nghiêm trọng: Critical (khẩn cấp, SLA 24h), High (cao), Medium (trung bình), Low (thấp)" /></span></TableHead>
                <TableHead className="w-36">Bảng dữ liệu</TableHead>
                <TableHead className="w-24">Loại</TableHead>
                <TableHead className="w-28">Chiều DL</TableHead>
                <TableHead className="w-28"><span className="inline-flex items-center gap-1">⚡ Tác động <InfoTooltip text="Số job downstream đọc từ bảng bị lỗi — có thể bị ảnh hưởng bởi vấn đề này" /></span></TableHead>
                <TableHead className="w-36">Phát hiện lúc</TableHead>
                <TableHead className="w-36"><span className="inline-flex items-center gap-1">Gán cho <InfoTooltip text="Người được phân công xử lý. Cập nhật trong trang chi tiết vấn đề." /></span></TableHead>
                <TableHead className="w-28"><span className="inline-flex items-center gap-1">Trạng thái <InfoTooltip text="Vòng đời: Mới → Đã gán → Đang xử lý → Chờ xét duyệt → Đã giải quyết → Đóng" /></span></TableHead>
                <TableHead className="w-16 text-center sticky right-0 z-10 sticky-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12 text-gray-400">
                    Không tìm thấy vấn đề nào
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((issue, idx) => (
                  <TableRow key={issue.id} className="hover:bg-gray-50">
                    <TableCell className="text-center text-sm text-gray-500 font-medium sticky left-0 z-10 sticky-left">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                        {issue.id.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => navigate(`/issues/${issue.id}`)}
                        className="text-left hover:text-blue-600 group"
                      >
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors" title={issue.title}>
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
                      {(() => {
                        const ds = mockDataSources.find(d => d.id === issue.tableId)
                        if (!ds) return null
                        return (
                          <span className={`inline-flex items-center whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${MODULE_COLORS[ds.moduleType]}`}>
                            {MODULE_LABELS[ds.moduleType]}
                          </span>
                        )
                      })()}
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
                    <TableCell className="sticky right-0 z-10 sticky-right">
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vấn đề & Sự cố"
        description="Vấn đề được TỰ ĐỘNG tạo khi rule kiểm tra thất bại qua Lịch chạy. Mỗi rule fail = 1 Issue mới (trạng thái 'Mới'). Gán cho người xử lý -> Đang xử lý -> Đã giải quyết -> Đóng."
        breadcrumbs={[{ label: 'Vấn đề & Sự cố' }]}
      />

      <Tabs
        tabs={[
          { id: 'list', label: 'Danh sách', content: issueListContent },
          { id: 'cascade', label: 'Chuỗi cảnh báo', content: <CascadeTimelineTab /> },
        ]}
        defaultTab="list"
      />
    </div>
  )
}
