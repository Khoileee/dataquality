import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import {
  Database, FileBarChart, Target, CheckCircle2, AlertTriangle, XCircle,
  MinusCircle, Cpu, CheckCircle, Clock
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────
export type DqGrade = 'pass' | 'warning' | 'fail' | 'no_data'

export type DataSourceNodeData = {
  label: string
  score: number
  grade: DqGrade
  moduleType: 'source' | 'report' | 'kpi'
  issuesCount: number
  tableId: string
}

export type JobNodeData = {
  label: string
  technology: string
  schedule: string
  lastRunStatus: 'success' | 'failed' | 'partial'
  jobStatus: 'active' | 'inactive'
}

export type DataSourceNodeType = Node<DataSourceNodeData, 'dataSource'>
export type JobNodeType = Node<JobNodeData, 'job'>

// ─── Config ─────────────────────────────────────────────────────────
const gradeConfig: Record<DqGrade, { label: string; color: string; bg: string; border: string; ring: string }> = {
  pass:    { label: 'Đạt',       color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-300', ring: 'ring-emerald-200' },
  warning: { label: 'Cảnh báo',  color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-300',   ring: 'ring-amber-200' },
  fail:    { label: 'Không đạt', color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-300',     ring: 'ring-red-200' },
  no_data: { label: 'Chưa quét', color: 'text-gray-500',    bg: 'bg-gray-50',     border: 'border-gray-200',    ring: 'ring-gray-100' },
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

const runStatusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  success: { label: 'OK',     color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-300' },
  failed:  { label: 'Lỗi',    color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-300' },
  partial: { label: 'Một phần', color: 'text-amber-700',  bg: 'bg-amber-50',    border: 'border-amber-300' },
}

// ─── DataSource Node ────────────────────────────────────────────────
export const DataSourceNode = memo(function DataSourceNode({ data, selected }: NodeProps<DataSourceNodeType>) {
  const grade = gradeConfig[data.grade]
  const Icon = moduleIcon[data.moduleType] || Database

  return (
    <div
      className={`
        relative rounded-xl border-2 bg-white shadow-sm transition-all duration-200
        ${grade.border} ${selected ? `ring-2 ${grade.ring} shadow-md` : ''}
        hover:shadow-md cursor-pointer min-w-[200px] max-w-[240px]
      `}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-gray-300 !border-white !border-2 !-left-1" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-gray-300 !border-white !border-2 !-right-1" />

      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-[10px] ${grade.bg}`}>
        <Icon className={`h-3.5 w-3.5 ${grade.color} shrink-0`} />
        <span className="text-[11px] text-gray-500">{moduleLabel[data.moduleType]}</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 space-y-2">
        <div className="font-semibold text-sm text-gray-800 leading-tight truncate" title={data.label}>
          {data.label}
        </div>

        <div className="flex items-center justify-between">
          {/* Score */}
          <div className="flex items-center gap-1.5">
            <div className={`text-lg font-bold tabular-nums ${grade.color}`}>
              {data.grade === 'no_data' ? '—' : data.score}
            </div>
            {data.grade !== 'no_data' && (
              <span className="text-[10px] text-gray-400 font-medium">/100</span>
            )}
          </div>

          {/* Grade badge */}
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${grade.bg} ${grade.color} border ${grade.border}`}>
            {grade.label}
          </span>
        </div>

        {/* Issues */}
        {data.issuesCount > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-red-600 font-medium">
            <AlertTriangle className="h-3 w-3" />
            <span>{data.issuesCount} vấn đề</span>
          </div>
        )}
      </div>
    </div>
  )
})

// ─── Job Node ───────────────────────────────────────────────────────
export const JobNode = memo(function JobNode({ data, selected }: NodeProps<JobNodeType>) {
  const runCfg = runStatusConfig[data.lastRunStatus] || runStatusConfig.success
  const isInactive = data.jobStatus === 'inactive'

  return (
    <div
      className={`
        relative rounded-lg border-2 bg-white shadow-sm transition-all duration-200
        ${isInactive ? 'border-gray-200 opacity-60' : runCfg.border}
        ${selected ? 'ring-2 ring-blue-200 shadow-md' : ''}
        hover:shadow-md cursor-pointer min-w-[170px] max-w-[200px]
      `}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-gray-300 !border-white !border-2 !-left-1" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-gray-300 !border-white !border-2 !-right-1" />

      {/* Header */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-t-md ${isInactive ? 'bg-gray-50' : runCfg.bg}`}>
        <Cpu className={`h-3 w-3 ${isInactive ? 'text-gray-400' : runCfg.color}`} />
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Job ETL</span>
      </div>

      {/* Body */}
      <div className="px-2.5 py-2 space-y-1.5">
        <div className="font-semibold text-xs text-gray-800 leading-tight truncate" title={data.label}>
          {data.label}
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{data.technology}</span>
          <div className={`flex items-center gap-0.5 font-semibold ${isInactive ? 'text-gray-400' : runCfg.color}`}>
            {data.lastRunStatus === 'success' && <CheckCircle className="h-3 w-3" />}
            {data.lastRunStatus === 'failed' && <XCircle className="h-3 w-3" />}
            {data.lastRunStatus === 'partial' && <AlertTriangle className="h-3 w-3" />}
            <span>{isInactive ? 'Tắt' : runCfg.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <Clock className="h-2.5 w-2.5" />
          <span className="truncate">{data.schedule}</span>
        </div>
      </div>
    </div>
  )
})

// ─── Node types registry ────────────────────────────────────────────
export const nodeTypes = {
  dataSource: DataSourceNode,
  job: JobNode,
}

// ─── Node dimensions for dagre layout ───────────────────────────────
export const NODE_DIMENSIONS = {
  dataSource: { width: 220, height: 120 },
  job: { width: 185, height: 95 },
}
