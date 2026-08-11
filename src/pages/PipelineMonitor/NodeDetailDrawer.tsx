import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Database, FileBarChart, Target, ExternalLink,
  CheckCircle, XCircle, AlertTriangle, Clock, Loader2,
  Shield, ArrowRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mockRules, mockIssues, mockSchedules } from '@/data/mockData'
import type { DataSourceNodeData, DqGrade, ScanStatus } from './PipelineNodes'

// ─── Config ─────────────────────────────────────────────────────────

const gradeConfig: Record<DqGrade, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  pass:    { label: 'Đạt',       variant: 'success' },
  warning: { label: 'Cảnh báo',  variant: 'warning' },
  fail:    { label: 'Không đạt', variant: 'destructive' },
  no_data: { label: 'Chưa quét', variant: 'secondary' },
}

const gradeColor: Record<DqGrade, string> = {
  pass:    'text-emerald-600',
  warning: 'text-amber-600',
  fail:    'text-red-600',
  no_data: 'text-gray-400',
}

const scanStatusConfig: Record<ScanStatus, { label: string; icon: typeof CheckCircle; color: string }> = {
  scanned:     { label: 'Đã quét',      icon: CheckCircle,  color: 'text-emerald-600' },
  waiting:     { label: 'Chờ quét',      icon: Clock,        color: 'text-blue-500' },
  scanning:    { label: 'Đang quét',     icon: Loader2,      color: 'text-blue-600' },
  scan_failed: { label: 'Quét lỗi',      icon: XCircle,      color: 'text-red-500' },
  no_schedule: { label: 'Chưa có lịch',  icon: Clock,        color: 'text-gray-400' },
}

const moduleIcon: Record<string, typeof Database> = {
  source: Database,
  report: FileBarChart,
  kpi: Target,
}

const moduleLabel: Record<string, string> = {
  source: 'Bảng nguồn',
  report: 'Báo cáo',
  kpi: 'KPI',
}

const ruleResultIcon: Record<string, { icon: typeof CheckCircle; color: string }> = {
  pass:    { icon: CheckCircle,    color: 'text-emerald-500' },
  warning: { icon: AlertTriangle,  color: 'text-amber-500' },
  fail:    { icon: XCircle,        color: 'text-red-500' },
}

const dimensionLabel: Record<string, string> = {
  completeness: 'Đầy đủ',
  validity: 'Hợp lệ',
  consistency: 'Nhất quán',
  accuracy: 'Chính xác',
  uniqueness: 'Duy nhất',
  timeliness: 'Kịp thời',
}

const severityConfig: Record<string, { label: string; variant: 'destructive' | 'warning' | 'default' | 'secondary' }> = {
  critical: { label: 'Nghiêm trọng', variant: 'destructive' },
  high:     { label: 'Cao',          variant: 'destructive' },
  medium:   { label: 'Trung bình',   variant: 'warning' },
  low:      { label: 'Thấp',         variant: 'secondary' },
}

const issueStatusLabel: Record<string, string> = {
  new: 'Mới',
  assigned: 'Đã gán',
  in_progress: 'Đang xử lý',
  pending_review: 'Chờ duyệt',
  resolved: 'Đã xử lý',
  closed: 'Đã đóng',
}

// ─── Component ──────────────────────────────────────────────────────

interface NodeDetailDrawerProps {
  data: DataSourceNodeData
  onClose: () => void
}

export function NodeDetailDrawer({ data, onClose }: NodeDetailDrawerProps) {
  const navigate = useNavigate()

  const grade = gradeConfig[data.grade]
  const scan = scanStatusConfig[data.scanStatus]
  const ScanIcon = scan.icon
  const ModuleIcon = moduleIcon[data.moduleType] || Database

  // Get rules for this table
  const tableRules = useMemo(
    () => mockRules.filter(r => r.tableId === data.tableId && r.status === 'active'),
    [data.tableId]
  )

  // Get active issues for this table
  const tableIssues = useMemo(
    () => mockIssues.filter(i => i.tableId === data.tableId && i.status !== 'resolved' && i.status !== 'closed'),
    [data.tableId]
  )

  // Get schedule for this table
  const schedule = useMemo(
    () => mockSchedules.find(s => s.tableId === data.tableId),
    [data.tableId]
  )

  // Rule result summary
  const ruleSummary = useMemo(() => {
    const pass = tableRules.filter(r => r.lastResult === 'pass').length
    const warn = tableRules.filter(r => r.lastResult === 'warning').length
    const fail = tableRules.filter(r => r.lastResult === 'fail').length
    return { pass, warn, fail, total: tableRules.length }
  }, [tableRules])

  return (
    <div className="absolute top-0 right-0 h-full w-[380px] z-50 flex">
      {/* Backdrop click area */}
      <div className="flex-shrink-0 w-0" />

      {/* Drawer panel */}
      <div className="w-full h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <ModuleIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-[11px] text-gray-500">
                {moduleLabel[data.moduleType]}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-800 truncate" title={data.label}>
              {data.label}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Score + Status Section */}
          <div className="px-4 py-3 space-y-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-bold tabular-nums ${gradeColor[data.grade]}`}>
                  {data.grade === 'no_data' ? '—' : data.score}
                </span>
                {data.grade !== 'no_data' && (
                  <span className="text-xs text-gray-400">/100</span>
                )}
              </div>
              <Badge variant={grade.variant}>{grade.label}</Badge>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className={`flex items-center gap-1.5 font-medium ${scan.color}`}>
                <ScanIcon className={`h-3.5 w-3.5 ${data.scanStatus === 'scanning' ? 'animate-spin' : ''}`} />
                <span>{scan.label}</span>
                {data.lastScanned && data.scanStatus === 'scanned' && (
                  <span className="text-gray-400 font-normal">lúc {data.lastScanned}</span>
                )}
              </div>
              {data.scheduleFrequency && (
                <span className="text-gray-400">{data.scheduleFrequency}</span>
              )}
            </div>

            {schedule && (
              <div className="flex items-center gap-4 text-[11px] text-gray-400">
                {schedule.lastRun && (
                  <span>Lần chạy: {new Date(schedule.lastRun).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                )}
                {schedule.nextRun && (
                  <span>Tiếp theo: {new Date(schedule.nextRun).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
            )}
          </div>

          {/* Rule Results Summary */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">Kết quả kiểm tra</span>
              </div>
              <span className="text-[11px] text-gray-400">{ruleSummary.total} quy tắc</span>
            </div>

            {/* Summary badges */}
            {ruleSummary.total > 0 && (
              <div className="flex items-center gap-2 mb-3">
                {ruleSummary.pass > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                    <CheckCircle className="h-3 w-3" />
                    <span>{ruleSummary.pass} đạt</span>
                  </div>
                )}
                {ruleSummary.warn > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[11px] font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{ruleSummary.warn} cảnh báo</span>
                  </div>
                )}
                {ruleSummary.fail > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-700 text-[11px] font-medium">
                    <XCircle className="h-3 w-3" />
                    <span>{ruleSummary.fail} lỗi</span>
                  </div>
                )}
              </div>
            )}

            {/* Rule list */}
            {tableRules.length > 0 ? (
              <div className="space-y-1">
                {tableRules.map(rule => {
                  const result = rule.lastResult ? ruleResultIcon[rule.lastResult] : null
                  const ResultIcon = result?.icon || Clock
                  return (
                    <div
                      key={rule.id}
                      className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <ResultIcon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${result?.color || 'text-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-gray-700 leading-tight truncate" title={rule.name}>
                          {rule.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400">
                            {dimensionLabel[rule.dimension] || rule.dimension}
                          </span>
                          {rule.lastScore !== undefined && (
                            <span className={`text-[10px] font-medium tabular-nums ${
                              rule.lastResult === 'pass' ? 'text-emerald-600' :
                              rule.lastResult === 'warning' ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {rule.lastScore}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-xs text-gray-400 text-center py-3">
                Chưa có quy tắc nào được cấu hình
              </div>
            )}
          </div>

          {/* Active Issues */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">Vấn đề đang mở</span>
              </div>
              {tableIssues.length > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  {tableIssues.length}
                </Badge>
              )}
            </div>

            {tableIssues.length > 0 ? (
              <div className="space-y-2">
                {tableIssues.map(issue => {
                  const sev = severityConfig[issue.severity] || severityConfig.medium
                  return (
                    <div
                      key={issue.id}
                      className="px-2.5 py-2 rounded-md border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/issues/${issue.id}`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] text-gray-700 font-medium leading-tight line-clamp-2">
                          {issue.title}
                        </span>
                        <Badge variant={sev.variant} className="text-[9px] px-1 py-0 shrink-0">
                          {sev.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
                        <span>{dimensionLabel[issue.dimension] || issue.dimension}</span>
                        <span>·</span>
                        <span>{issueStatusLabel[issue.status] || issue.status}</span>
                        {issue.assignedTo && (
                          <>
                            <span>·</span>
                            <span>{issue.assignedTo}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-xs text-gray-400 text-center py-3">
                Không có vấn đề nào
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => navigate(`/data-catalog/${data.tableId}`)}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Xem tổng quan bảng
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>
        </div>
      </div>
    </div>
  )
}
