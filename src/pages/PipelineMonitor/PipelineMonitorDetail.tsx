import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Cpu, Clock, CheckCircle, XCircle, AlertTriangle,
  User, Mail, Users
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { mockPipelineJobs, mockDataSources, mockSchedules } from '@/data/mockData'
import { PipelineGraphView } from './PipelineGraphView'

// ─── Helpers ────────────────────────────────────────────────────────

function getScanProgress(inputIds: string[], outputIds: string[]) {
  const allIds = [...inputIds, ...outputIds]
  const total = allIds.length
  const scanned = allIds.filter(id => {
    const sch = mockSchedules.find(s => s.tableId === id)
    return sch && sch.lastRunStatus === 'success'
  }).length
  const failed = allIds.filter(id => {
    const sch = mockSchedules.find(s => s.tableId === id)
    return sch && sch.lastRunStatus === 'failed'
  }).length
  return { scanned, failed, total }
}

const runStatusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  success: { label: 'Thành công', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle },
  failed:  { label: 'Lỗi',       color: 'text-red-700',     bg: 'bg-red-50',     icon: XCircle },
  partial: { label: 'Một phần',   color: 'text-amber-700',   bg: 'bg-amber-50',   icon: AlertTriangle },
}

// ─── Component ──────────────────────────────────────────────────────

export function PipelineMonitorDetail() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()

  const job = useMemo(() => mockPipelineJobs.find(j => j.id === jobId), [jobId])

  if (!job) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => navigate('/pipeline-monitor')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />Quay lại
        </Button>
        <div className="text-center py-20 text-gray-400">
          <Cpu className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Không tìm thấy pipeline job</p>
        </div>
      </div>
    )
  }

  const progress = getScanProgress(job.inputTableIds, job.outputTableIds)
  const pct = progress.total > 0 ? Math.round((progress.scanned / progress.total) * 100) : 0
  const runCfg = runStatusConfig[job.lastRunStatus] || runStatusConfig.success
  const RunIcon = runCfg.icon
  const lastRunTime = job.lastRunAt ? new Date(job.lastRunAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <PageHeader
        title={job.name}
        description={job.description}
        breadcrumbs={[
          { label: 'Giám sát Pipeline', href: '/pipeline-monitor' },
          { label: job.name },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/pipeline-monitor')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Quay lại danh sách
          </Button>
        }
      />

      {/* Job Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 mb-1">Tiến độ quét</div>
            <div className="flex items-center gap-2">
              <div className="text-xl font-bold tabular-nums text-blue-600">{progress.scanned}/{progress.total}</div>
              <span className="text-xs text-gray-400">{pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Run Status */}
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 mb-1">Lần chạy cuối</div>
            <div className={`flex items-center gap-1.5 font-semibold ${runCfg.color}`}>
              <RunIcon className="h-4 w-4" />
              <span className="text-sm">{runCfg.label}</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">{lastRunTime}</div>
          </CardContent>
        </Card>

        {/* Technology */}
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 mb-1">Công nghệ</div>
            <div className="flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">{job.technology}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
              <Clock className="h-3 w-3" />
              <span>{job.schedule}</span>
            </div>
          </CardContent>
        </Card>

        {/* Owner */}
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 mb-1">Người phụ trách</div>
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{job.owner}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
              <Mail className="h-3 w-3" />
              <span>{job.ownerEmail}</span>
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 mb-1">Team</div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{job.team}</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              {job.inputTableIds.length} input · {job.outputTableIds.length} output
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scan issues warning */}
      {progress.failed > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{progress.failed}</strong> bảng quét lỗi — có thể ảnh hưởng đến chất lượng đầu ra của pipeline này
          </span>
        </div>
      )}

      {/* Graph */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Sơ đồ Pipeline</h3>
            <p className="text-xs text-gray-400 mt-0.5">Input → Job → Output — Click node để xem chi tiết DQ</p>
          </div>
          <PipelineGraphView job={job} />
        </CardContent>
      </Card>
    </div>
  )
}
