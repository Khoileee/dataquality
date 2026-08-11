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
import { useNavigate } from 'react-router-dom'
import { Database, FileBarChart, Target, Cpu, Info } from 'lucide-react'
import { mockDataSources, mockIssues } from '@/data/mockData'
import type { PipelineJob } from '@/types'
import type { DqGrade, DataSourceNodeData, JobNodeData } from './PipelineNodes'
import { nodeTypes, NODE_DIMENSIONS } from './PipelineNodes'

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

// ─── Build Graph ────────────────────────────────────────────────────

function buildGraph(jobs: PipelineJob[]) {
  const nodeMap = new Map<string, Node>()
  const edges: Edge[] = []

  // Collect all unique data source IDs referenced by filtered jobs
  const dsIds = new Set<string>()
  jobs.forEach(job => {
    job.inputTableIds.forEach(id => dsIds.add(id))
    job.outputTableIds.forEach(id => dsIds.add(id))
  })

  // Create data source nodes
  dsIds.forEach(dsId => {
    const ds = mockDataSources.find(d => d.id === dsId)
    if (!ds) return
    const grade = getGrade(dsId)
    nodeMap.set(dsId, {
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
      } satisfies DataSourceNodeData,
    })
  })

  // Create job nodes and edges
  jobs.forEach(job => {
    nodeMap.set(job.id, {
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

    // Input → Job edges
    job.inputTableIds.forEach(inputId => {
      if (!nodeMap.has(inputId)) return
      edges.push({
        id: `e-${inputId}-${job.id}`,
        source: inputId,
        target: job.id,
        type: 'smoothstep',
        animated: job.status === 'active',
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: '#94a3b8' },
      })
    })

    // Job → Output edges (colored by output DQ grade)
    job.outputTableIds.forEach(outputId => {
      if (!nodeMap.has(outputId)) return
      const grade = getGrade(outputId)
      const color = job.lastRunStatus === 'failed'
        ? runStatusEdgeColor.failed
        : gradeEdgeColor[grade]
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

    // Jobs with NO inputs: show as root job (source nodes)
    if (job.inputTableIds.length === 0) {
      // No edges needed from left, job is a root
    }
  })

  return { nodes: Array.from(nodeMap.values()), edges }
}

// ─── Dagre Layout ───────────────────────────────────────────────────

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'LR',
    nodesep: 50,
    ranksep: 100,
    marginx: 30,
    marginy: 30,
  })

  nodes.forEach(node => {
    const dim = node.type === 'job' ? NODE_DIMENSIONS.job : NODE_DIMENSIONS.dataSource
    g.setNode(node.id, { width: dim.width, height: dim.height })
  })

  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  return nodes.map(node => {
    const pos = g.node(node.id)
    const dim = node.type === 'job' ? NODE_DIMENSIONS.job : NODE_DIMENSIONS.dataSource
    return {
      ...node,
      position: {
        x: pos.x - dim.width / 2,
        y: pos.y - dim.height / 2,
      },
    }
  })
}

// ─── MiniMap Node Color ─────────────────────────────────────────────

function minimapNodeColor(node: Node): string {
  if (node.type === 'job') {
    const data = node.data as JobNodeData
    return data.lastRunStatus === 'failed' ? '#fca5a5' :
           data.lastRunStatus === 'partial' ? '#fcd34d' : '#a7f3d0'
  }
  const data = node.data as DataSourceNodeData
  return data.grade === 'pass' ? '#a7f3d0' :
         data.grade === 'warning' ? '#fcd34d' :
         data.grade === 'fail' ? '#fca5a5' : '#e5e7eb'
}

// ─── Legend ─────────────────────────────────────────────────────────

function GraphLegend() {
  const [open, setOpen] = useState(true)
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-2 py-1.5 bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-sm text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Info className="h-3 w-3" />
        Chú thích
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
        <div className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Chất lượng DQ</div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="text-gray-600">Đạt (≥85)</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="text-gray-600">Cảnh báo (70–84)</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="text-gray-600">Không đạt (&lt;70)</span></div>
        <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gray-300" /><span className="text-gray-600">Chưa quét</span></div>
      </div>
      <div className="border-t border-gray-100 pt-1.5 space-y-1.5">
        <div className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Đường nối</div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,2" /></svg>
          <span className="text-gray-600">Input → Job</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#10b981" strokeWidth="2" /></svg>
          <span className="text-gray-600">Job → Output (OK)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#ef4444" strokeWidth="2" /></svg>
          <span className="text-gray-600">Job → Output (Lỗi)</span>
        </div>
      </div>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────

interface PipelineGraphViewProps {
  jobs: PipelineJob[]
}

export function PipelineGraphView({ jobs }: PipelineGraphViewProps) {
  const navigate = useNavigate()

  // Build and layout graph
  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes: rawNodes, edges } = buildGraph(jobs)
    const layoutedNodes = applyDagreLayout(rawNodes, edges)
    return { initialNodes: layoutedNodes, initialEdges: edges }
  }, [jobs])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'dataSource') {
      const data = node.data as DataSourceNodeData
      navigate(`/data-catalog/${data.tableId}`)
    }
  }, [navigate])

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] text-gray-400">
        <div className="text-center">
          <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Không có pipeline nào phù hợp bộ lọc</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-340px)] min-h-[500px] rounded-lg border border-gray-200 bg-gray-50/50 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
        <Controls
          showInteractive={false}
          className="!bg-white/95 !backdrop-blur !border-gray-200 !shadow-sm !rounded-lg"
        />
        <MiniMap
          nodeColor={minimapNodeColor}
          maskColor="rgba(0,0,0,0.08)"
          className="!bg-white/95 !border-gray-200 !rounded-lg !shadow-sm"
          style={{ width: 160, height: 100 }}
        />
        <Panel position="top-left">
          <GraphLegend />
        </Panel>
        <Panel position="top-right">
          <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-sm px-3 py-1.5 text-[11px] text-gray-500">
            <span className="font-medium text-gray-600">{nodes.length}</span> nodes · <span className="font-medium text-gray-600">{edges.length}</span> edges — Click bảng để xem DQ chi tiết
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
