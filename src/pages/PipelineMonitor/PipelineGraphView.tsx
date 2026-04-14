import { useMemo, useCallback, useState } from 'react'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Edge,
  type Node,
  MarkerType,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { Database, FileBarChart, Target, Cpu, Info, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react'
import { mockDataSources, mockIssues, mockSchedules } from '@/data/mockData'
import type { PipelineJob } from '@/types'
import type { DqGrade, ScanStatus, DataSourceNodeData, JobNodeData } from './PipelineNodes'
import { nodeTypes, NODE_DIMENSIONS } from './PipelineNodes'
import { NodeDetailDrawer } from './NodeDetailDrawer'

// ─── Helpers ────────────────────────────────────────────────────────

function getGrade(tableId: string): DqGrade {
  const ds = mockDataSources.find(d => d.id === tableId)
  if (!ds || !ds.lastProfiled) return 'no_data'
  if (ds.overallScore >= 85) return 'pass'
  if (ds.overallScore >= 70) return 'warning'
  return 'fail'
}

function getIssuesCount(tableId: string): number {
  return mockIssues.filter(i => i.tableId === tableId && i.status !== 'resolved' && i.status !== 'closed').length
}

function getScheduleInfo(tableId: string): { scanStatus: ScanStatus; lastScanned?: string; nextScan?: string; scheduleFrequency?: string } {
  const sch = mockSchedules.find(s => s.tableId === tableId)
  if (!sch) return { scanStatus: 'no_schedule' }

  const freqLabel: Record<string, string> = { daily: 'Hàng ngày', hourly: 'Hàng giờ', weekly: 'Hàng tuần', monthly: 'Hàng tháng', realtime: 'Thực thời' }
  const freq = freqLabel[sch.frequency] || sch.frequency

  if (sch.status === 'inactive') return { scanStatus: 'no_schedule', scheduleFrequency: freq }

  const lastTime = sch.lastRun ? new Date(sch.lastRun).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : undefined
  const nextTime = sch.nextRun ? new Date(sch.nextRun).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : undefined

  if (sch.lastRunStatus === 'failed') return { scanStatus: 'scan_failed', lastScanned: lastTime, nextScan: nextTime, scheduleFrequency: freq }
  if (sch.lastRunStatus === 'partial') return { scanStatus: 'scanned', lastScanned: lastTime, nextScan: nextTime, scheduleFrequency: freq }
  if (sch.lastRunStatus === 'success') return { scanStatus: 'scanned', lastScanned: lastTime, nextScan: nextTime, scheduleFrequency: freq }

  return { scanStatus: 'waiting', nextScan: nextTime, scheduleFrequency: freq }
}

const gradeEdgeColor: Record<DqGrade, string> = {
  pass: '#10b981',
  warning: '#f59e0b',
  fail: '#ef4444',
  no_data: '#d1d5db',
}

const runStatusEdgeColor: Record<string, string> = {
  success: '#10b981',
  failed: '#ef4444',
  partial: '#f59e0b',
}

// ─── Build Graph (Single Job) ───────────────────────────────────────

function buildJobGraph(job: PipelineJob) {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const addedDs = new Set<string>()

  // Input DataSource nodes
  job.inputTableIds.forEach(dsId => {
    const ds = mockDataSources.find(d => d.id === dsId)
    if (!ds || addedDs.has(dsId)) return
    addedDs.add(dsId)
    const grade = getGrade(dsId)
    const schInfo = getScheduleInfo(dsId)
    nodes.push({
      id: dsId,
      type: 'dataSource',
      position: { x: 0, y: 0 },
      data: {
        label: ds.name,
        score: ds.overallScore,
        grade,
        moduleType: ds.moduleType,
        issuesCount: getIssuesCount(dsId),
        tableId: dsId,
        ...schInfo,
      } satisfies DataSourceNodeData,
    })
  })

  // Job node
  nodes.push({
    id: job.id,
    type: 'job',
    position: { x: 0, y: 0 },
    data: {
      label: job.name,
      technology: job.technology,
      schedule: job.schedule,
      lastRunStatus: job.lastRunStatus,
      jobStatus: job.status,
    } satisfies JobNodeData,
  })

  // Output DataSource nodes
  job.outputTableIds.forEach(dsId => {
    const ds = mockDataSources.find(d => d.id === dsId)
    if (!ds || addedDs.has(dsId)) return
    addedDs.add(dsId)
    const grade = getGrade(dsId)
    const schInfo = getScheduleInfo(dsId)
    nodes.push({
      id: dsId,
      type: 'dataSource',
      position: { x: 0, y: 0 },
      data: {
        label: ds.name,
        score: ds.overallScore,
        grade,
        moduleType: ds.moduleType,
        issuesCount: getIssuesCount(dsId),
        tableId: dsId,
        ...schInfo,
      } satisfies DataSourceNodeData,
    })
  })

  // Input → Job edges
  job.inputTableIds.forEach(inputId => {
    if (!addedDs.has(inputId)) return
    const grade = getGrade(inputId)
    edges.push({
      id: `e-${inputId}-${job.id}`,
      source: inputId,
      target: job.id,
      type: 'smoothstep',
      animated: job.status === 'active',
      style: { stroke: gradeEdgeColor[grade], strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: gradeEdgeColor[grade] },
    })
  })

  // Job → Output edges
  job.outputTableIds.forEach(outputId => {
    if (!addedDs.has(outputId)) return
    const grade = getGrade(outputId)
    const color = job.lastRunStatus === 'failed' ? runStatusEdgeColor.failed : gradeEdgeColor[grade]
    edges.push({
      id: `e-${job.id}-${outputId}`,
      source: job.id,
      target: outputId,
      type: 'smoothstep',
      animated: job.status === 'active',
      style: { stroke: color, strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color },
    })
  })

  return { nodes, edges }
}

// ─── Dagre Layout ───────────────────────────────────────────────────

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 120, marginx: 30, marginy: 30 })

  nodes.forEach(node => {
    const dim = node.type === 'job' ? NODE_DIMENSIONS.job : NODE_DIMENSIONS.dataSource
    g.setNode(node.id, { width: dim.width, height: dim.height })
  })

  edges.forEach(edge => { g.setEdge(edge.source, edge.target) })
  dagre.layout(g)

  return nodes.map(node => {
    const pos = g.node(node.id)
    const dim = node.type === 'job' ? NODE_DIMENSIONS.job : NODE_DIMENSIONS.dataSource
    return { ...node, position: { x: pos.x - dim.width / 2, y: pos.y - dim.height / 2 } }
  })
}

// ─── MiniMap Color ──────────────────────────────────────────────────

function minimapNodeColor(node: Node): string {
  if (node.type === 'job') {
    const data = node.data as JobNodeData
    return data.lastRunStatus === 'failed' ? '#fca5a5' : data.lastRunStatus === 'partial' ? '#fcd34d' : '#a7f3d0'
  }
  const data = node.data as DataSourceNodeData
  return data.grade === 'pass' ? '#a7f3d0' : data.grade === 'warning' ? '#fcd34d' : data.grade === 'fail' ? '#fca5a5' : '#e5e7eb'
}

// ─── Legend ─────────────────────────────────────────────────────────

function GraphLegend() {
  const [open, setOpen] = useState(true)
  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-2 py-1.5 bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-sm text-xs text-gray-500 hover:text-gray-700 transition-colors">
        <Info className="h-3 w-3" />Chú thích
      </button>
    )
  }
  return (
    <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-sm p-3 text-[11px] space-y-2 min-w-[160px]">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-700 text-xs">Chú thích</span>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
      </div>
      <div className="space-y-1.5">
        <div className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Loại node</div>
        <div className="flex items-center gap-1.5"><Database className="h-3 w-3 text-blue-500" /><span className="text-gray-600">Bảng nguồn</span></div>
        <div className="flex items-center gap-1.5"><FileBarChart className="h-3 w-3 text-purple-500" /><span className="text-gray-600">Báo cáo</span></div>
        <div className="flex items-center gap-1.5"><Target className="h-3 w-3 text-orange-500" /><span className="text-gray-600">KPI</span></div>
        <div className="flex items-center gap-1.5"><Cpu className="h-3 w-3 text-gray-500" /><span className="text-gray-600">Job ETL</span></div>
      </div>
      <div className="border-t border-gray-100 pt-1.5 space-y-1.5">
        <div className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Trạng thái quét</div>
        <div className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-emerald-600" /><span className="text-gray-600">Đã quét</span></div>
        <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-blue-500" /><span className="text-gray-600">Chờ quét</span></div>
        <div className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 text-blue-600" /><span className="text-gray-600">Đang quét</span></div>
        <div className="flex items-center gap-1.5"><XCircle className="h-3 w-3 text-red-500" /><span className="text-gray-600">Quét lỗi</span></div>
      </div>
      <div className="border-t border-gray-100 pt-1.5 space-y-1.5">
        <div className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Chất lượng DQ</div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="text-gray-600">Đạt (≥85)</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="text-gray-600">Cảnh báo (70–84)</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="text-gray-600">Không đạt (&lt;70)</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gray-300" /><span className="text-gray-600">Chưa quét</span></div>
      </div>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────

interface PipelineGraphViewProps {
  job: PipelineJob
}

export function PipelineGraphView({ job }: PipelineGraphViewProps) {
  const [selectedNode, setSelectedNode] = useState<DataSourceNodeData | null>(null)

  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes: rawNodes, edges } = buildJobGraph(job)
    const layoutedNodes = applyDagreLayout(rawNodes, edges)
    return { initialNodes: layoutedNodes, initialEdges: edges }
  }, [job])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'dataSource') {
      setSelectedNode(node.data as DataSourceNodeData)
    }
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const totalTables = job.inputTableIds.length + job.outputTableIds.length
  const scannedCount = [...job.inputTableIds, ...job.outputTableIds].filter(id => {
    const info = getScheduleInfo(id)
    return info.scanStatus === 'scanned'
  }).length

  return (
    <div className="relative h-[calc(100vh-300px)] min-h-[400px] rounded-lg border border-gray-200 bg-gray-50/50 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background variant={BackgroundVariant.Cross} gap={24} size={3} color="#e5e7eb" className="opacity-50" />
        <Controls showInteractive={false} className="!bg-white/95 !backdrop-blur !border-gray-200 !shadow-sm !rounded-lg" />
        <MiniMap
          nodeColor={minimapNodeColor}
          maskColor="rgba(0,0,0,0.08)"
          className="!bg-white/95 !border-gray-200 !rounded-lg !shadow-sm"
          style={{ width: 160, height: 100 }}
        />
        <Panel position="top-left"><GraphLegend /></Panel>
        <Panel position="top-right">
          <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-sm px-3 py-1.5 text-[11px] text-gray-500">
            <span className="font-medium text-gray-600">{scannedCount}/{totalTables}</span> bảng đã quét — Click bảng để xem chi tiết
          </div>
        </Panel>
      </ReactFlow>

      {/* Node Detail Drawer */}
      {selectedNode && (
        <NodeDetailDrawer
          data={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  )
}
