import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis,
  BarChart, Bar, Cell,
} from 'recharts'
import {
  Download, TrendingUp, TrendingDown, ArrowLeft, ChevronRight,
  ClipboardCheck, CheckCircle, AlertTriangle, FileWarning,
  BarChart3, ShieldCheck, Bug, Activity, Layers, Clock,
  CheckCircle2, AlertCircle, XCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DimensionBadge, DIMENSION_CONFIG } from '@/components/common/DimensionBadge'
import { Tabs } from '@/components/ui/tabs'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { getScoreColor, getGrade, getScoreBarColor, formatDateTime } from '@/lib/utils'
import { mockDataSources, mockRules, mockIssues, mockTrendData, reconciliationResults } from '@/data/mockData'
import { cn } from '@/lib/utils'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import type { QualityDimension } from '@/types'

/* ─── Helpers ─── */

const DIMENSION_LABELS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tất cả chiều dữ liệu' },
  { value: 'completeness', label: 'Đầy đủ' },
  { value: 'validity', label: 'Hợp lệ' },
  { value: 'consistency', label: 'Nhất quán' },
  { value: 'uniqueness', label: 'Duy nhất' },
  { value: 'accuracy', label: 'Chính xác' },
  { value: 'timeliness', label: 'Kịp thời' },
]

const DIMENSION_KEYS: QualityDimension[] = ['completeness', 'validity', 'consistency', 'uniqueness', 'accuracy', 'timeliness']

const MODULE_BADGE: Record<string, { label: string; color: string }> = {
  source: { label: 'Nguồn', color: 'bg-blue-100 text-blue-700' },
  report: { label: 'Báo cáo', color: 'bg-purple-100 text-purple-700' },
  kpi: { label: 'KPI', color: 'bg-amber-100 text-amber-700' },
}

function getTrend(score: number): 'up' | 'stable' | 'down' {
  if (score >= 85) return 'up'
  if (score < 70) return 'down'
  return 'stable'
}

function TrendIcon({ trend }: { trend: 'up' | 'stable' | 'down' }) {
  if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-green-600" />
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-red-500" />
  return <span className="text-amber-500 text-sm font-semibold">&rarr;</span>
}

/** Generate mock rule run history for a rule */
function generateRuleHistory(ruleId: string) {
  const seed = ruleId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return Array.from({ length: 5 }, (_, i) => ({
    id: `${ruleId}-run-${i}`,
    runAt: new Date(Date.now() - (4 - i) * 86400000).toISOString(),
    score: Math.round(60 + ((seed * (i + 1) * 7) % 40)),
    result: ((): string => {
      const s = 60 + ((seed * (i + 1) * 7) % 40)
      return s >= 85 ? 'pass' : s >= 70 ? 'warning' : 'fail'
    })(),
  }))
}

/** Generate per-table trend data from base trend + offset by tableId charCode */
function generateTableTrend(tableId: string) {
  const offset = tableId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 20 - 10
  return mockTrendData.map(d => ({
    ...d,
    score: Math.min(100, Math.max(30, d.score + offset + Math.round(Math.sin(d.score * 0.1) * 3))),
  }))
}

/* ─── Drill-down type ─── */
type DrillType = 'score' | 'tables' | 'rules' | 'issues' | 'dimension' | 'trend_day' | 'rule_detail' | 'issue_detail'
type DrillDown = { type: DrillType; id?: string; label?: string } | null

/* ─── Variance color helper (Reconciliation) ─── */
function getVarianceColor(variance: number): string {
  if (variance < 0.1) return 'text-green-600'
  if (variance <= 0.5) return 'text-amber-600'
  return 'text-red-600'
}
function getVarianceBg(variance: number): string {
  if (variance < 0.1) return 'bg-green-50'
  if (variance <= 0.5) return 'bg-amber-50'
  return 'bg-red-50'
}

/* ─── CSV export for reconciliation ─── */
function exportReconciliationCSV(data: typeof reconciliationResults) {
  const header = [
    'STT', 'Báo cáo', 'Bảng nguồn', 'Cột đối soát',
    'Giá trị báo cáo', 'Giá trị nguồn', 'Chênh lệch (%)',
    'Ngưỡng (%)', 'Điểm', 'Kết quả',
  ]
  const rows = data.map((r, i) => [
    i + 1, r.reportTableName, r.sourceTableName,
    `"${r.reportColumn} vs ${r.sourceColumn}"`,
    r.reportValue, r.sourceValue, r.variance, r.tolerancePct, r.qualityScore, r.result,
  ])
  const csv = [header, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `doi_soat_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ═══════════════════════════════════════════════════════════════
   Back button component
   ═══════════════════════════════════════════════════════════════ */
function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="flex items-center gap-1.5 mb-4">
      <ArrowLeft className="w-4 h-4" />
      Quay lại {label && <>— {label}</>}
    </Button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   KPI Card (clickable)
   ═══════════════════════════════════════════════════════════════ */
function KpiCard({
  icon, iconBg, label, value, sub, valueColor, onClick, info, infoWide,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string | number | React.ReactNode
  sub: string
  valueColor?: string
  onClick?: () => void
  info?: React.ReactNode
  infoWide?: boolean
}) {
  return (
    <Card className={cn(onClick && 'cursor-pointer hover:shadow-md transition-shadow')} onClick={onClick}>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg', iconBg)}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-500 font-medium truncate flex items-center gap-1">
              {label}
              {info && <InfoTooltip text={info} wide={infoWide} />}
            </p>
            <p className={cn('text-2xl font-bold mt-0.5', valueColor ?? 'text-gray-900')}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Overview Dashboard (selectedTable = "all")
   ═══════════════════════════════════════════════════════════════ */
function OverviewDashboard({ onSelectTable }: { onSelectTable: (id: string) => void }) {
  const navigate = useNavigate()
  const [drillDown, setDrillDown] = useState<DrillDown>(null)

  // Computed KPIs
  const avgScore = useMemo(() => {
    const s = mockDataSources.reduce((a, d) => a + d.overallScore, 0) / mockDataSources.length
    return Math.round(s * 10) / 10
  }, [])

  const yesterdayScore = useMemo(() => {
    return Math.round((avgScore - 1.2) * 10) / 10 // mock yesterday
  }, [avgScore])

  const totalTables = mockDataSources.length
  const passTables = mockDataSources.filter(d => d.overallScore >= 80).length
  const failTables = totalTables - passTables

  const rulesByStatus = useMemo(() => {
    const pass = mockRules.filter(r => r.lastResult === 'pass').length
    const warning = mockRules.filter(r => r.lastResult === 'warning').length
    const fail = mockRules.filter(r => r.lastResult === 'fail' || r.lastResult === 'error').length
    return { pass, warning, fail }
  }, [])

  const openIssues = useMemo(() => mockIssues.filter(i => !['resolved', 'closed'].includes(i.status)), [])
  const recentIssues = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 86400000
    return mockIssues.filter(i => new Date(i.detectedAt).getTime() >= sevenDaysAgo)
  }, [])
  const prevPeriodIssues = useMemo(() => {
    const fourteenDaysAgo = Date.now() - 14 * 86400000
    const sevenDaysAgo = Date.now() - 7 * 86400000
    return mockIssues.filter(i => {
      const t = new Date(i.detectedAt).getTime()
      return t >= fourteenDaysAgo && t < sevenDaysAgo
    })
  }, [])

  // Radar data from all tables average
  const radarData = useMemo(() =>
    DIMENSION_KEYS.map(dim => ({
      dimension: DIMENSION_CONFIG[dim].label,
      dimKey: dim,
      score: Math.round(mockDataSources.reduce((a, d) => a + d.dimensionScores[dim], 0) / mockDataSources.length),
    }))
  , [])

  // Top 10 lowest score tables (horizontal bar)
  const bottom10 = useMemo(() =>
    [...mockDataSources].sort((a, b) => a.overallScore - b.overallScore).slice(0, 10)
  , [])

  // Top 10 rules with lowest score (most violations)
  const worstRules = useMemo(() =>
    [...mockRules]
      .filter(r => r.lastScore !== undefined)
      .sort((a, b) => (a.lastScore ?? 100) - (b.lastScore ?? 100))
      .slice(0, 10)
  , [])

  // ─── Drill content renderer ───
  if (drillDown) {
    return (
      <div className="space-y-4">
        <BackButton label={drillDown.label ?? ''} onClick={() => setDrillDown(null)} />

        {/* Drill: All tables + score + grade */}
        {drillDown.type === 'score' && (
          <Card>
            <CardHeader><CardTitle className="text-base">Điểm chất lượng tất cả bảng</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">STT</TableHead>
                    <TableHead>Tên bảng</TableHead>
                    <TableHead className="text-center">Điểm</TableHead>
                    <TableHead className="text-center">Xếp hạng</TableHead>
                    <TableHead className="text-center">Owner</TableHead>
                    <TableHead className="text-center">Loại</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...mockDataSources].sort((a, b) => b.overallScore - a.overallScore).map((ds, i) => {
                    const { grade, color } = getGrade(ds.overallScore)
                    return (
                      <TableRow key={ds.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelectTable(ds.id)}>
                        <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                        <TableCell className="font-medium text-gray-900">{ds.name}</TableCell>
                        <TableCell className={cn('text-center font-semibold', getScoreColor(ds.overallScore))}>{ds.overallScore}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn('inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold', color)}>{grade}</span>
                        </TableCell>
                        <TableCell className="text-center text-sm text-gray-600">{ds.owner}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', MODULE_BADGE[ds.moduleType].color)}>
                            {MODULE_BADGE[ds.moduleType].label}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Drill: Tables filtered pass/fail */}
        {drillDown.type === 'tables' && (
          <Card>
            <CardHeader><CardTitle className="text-base">Bảng dữ liệu — {drillDown.id === 'pass' ? 'Đạt chuẩn (>=80)' : 'Không đạt (<80)'}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">STT</TableHead>
                    <TableHead>Tên bảng</TableHead>
                    <TableHead className="text-center">Điểm</TableHead>
                    <TableHead className="text-center">Xếp hạng</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDataSources
                    .filter(d => drillDown.id === 'pass' ? d.overallScore >= 80 : d.overallScore < 80)
                    .map((ds, i) => {
                      const { grade, color } = getGrade(ds.overallScore)
                      return (
                        <TableRow key={ds.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelectTable(ds.id)}>
                          <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                          <TableCell className="font-medium text-gray-900">{ds.name}</TableCell>
                          <TableCell className={cn('text-center font-semibold', getScoreColor(ds.overallScore))}>{ds.overallScore}</TableCell>
                          <TableCell className="text-center">
                            <span className={cn('inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold', color)}>{grade}</span>
                          </TableCell>
                          <TableCell className="text-center"><StatusBadge status={ds.status} /></TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Drill: All rules grouped by status */}
        {drillDown.type === 'rules' && (
          <Card>
            <CardHeader><CardTitle className="text-base">Tất cả quy tắc — nhóm theo trạng thái</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">STT</TableHead>
                    <TableHead>Quy tắc</TableHead>
                    <TableHead>Chiều dữ liệu</TableHead>
                    <TableHead>Bảng</TableHead>
                    <TableHead className="text-center">Điểm</TableHead>
                    <TableHead className="text-center">Kết quả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...mockRules]
                    .sort((a, b) => {
                      const order: Record<string, number> = { fail: 0, error: 0, warning: 1, pass: 2, pending: 3 }
                      return (order[a.lastResult ?? 'pending'] ?? 3) - (order[b.lastResult ?? 'pending'] ?? 3)
                    })
                    .map((r, i) => (
                      <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setDrillDown({ type: 'rule_detail', id: r.id, label: r.name })}>
                        <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                        <TableCell className="font-medium text-gray-900 max-w-[260px] truncate">{r.name}</TableCell>
                        <TableCell><DimensionBadge dimension={r.dimension} /></TableCell>
                        <TableCell className="text-sm text-gray-600">{r.tableName}</TableCell>
                        <TableCell className={cn('text-center font-semibold', getScoreColor(r.lastScore ?? 0))}>{r.lastScore ?? '—'}</TableCell>
                        <TableCell className="text-center">{r.lastResult ? <StatusBadge status={r.lastResult} /> : '—'}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Drill: Issues sorted by severity */}
        {drillDown.type === 'issues' && (
          <Card>
            <CardHeader><CardTitle className="text-base">Vấn đề — sắp xếp theo mức độ</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">STT</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Bảng</TableHead>
                    <TableHead className="text-center">Mức độ</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-center">Phát hiện</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...mockIssues]
                    .sort((a, b) => {
                      const sev: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
                      return (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3)
                    })
                    .map((issue, i) => (
                      <TableRow key={issue.id} className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setDrillDown({ type: 'issue_detail', id: issue.id, label: issue.title })}>
                        <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                        <TableCell className="font-medium text-gray-900 max-w-[300px] truncate">{issue.title}</TableCell>
                        <TableCell className="text-sm text-gray-600">{issue.tableName}</TableCell>
                        <TableCell className="text-center"><StatusBadge status={issue.severity} /></TableCell>
                        <TableCell className="text-center"><StatusBadge status={issue.status} /></TableCell>
                        <TableCell className="text-center text-sm text-gray-500">{formatDateTime(issue.detectedAt)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Drill: Dimension — tables sorted by that dimension */}
        {drillDown.type === 'dimension' && drillDown.id && (
          <Card>
            <CardHeader><CardTitle className="text-base">Điểm theo chiều: {DIMENSION_CONFIG[drillDown.id as QualityDimension]?.label}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">STT</TableHead>
                    <TableHead>Tên bảng</TableHead>
                    <TableHead className="text-center">Điểm {DIMENSION_CONFIG[drillDown.id as QualityDimension]?.label}</TableHead>
                    <TableHead className="text-center">Điểm tổng</TableHead>
                    <TableHead className="text-center">Xếp hạng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...mockDataSources]
                    .sort((a, b) => a.dimensionScores[drillDown.id as QualityDimension] - b.dimensionScores[drillDown.id as QualityDimension])
                    .map((ds, i) => {
                      const dimScore = ds.dimensionScores[drillDown.id as QualityDimension]
                      const { grade, color } = getGrade(ds.overallScore)
                      return (
                        <TableRow key={ds.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelectTable(ds.id)}>
                          <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                          <TableCell className="font-medium text-gray-900">{ds.name}</TableCell>
                          <TableCell className={cn('text-center font-semibold', getScoreColor(dimScore))}>{dimScore}</TableCell>
                          <TableCell className={cn('text-center', getScoreColor(ds.overallScore))}>{ds.overallScore}</TableCell>
                          <TableCell className="text-center">
                            <span className={cn('inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold', color)}>{grade}</span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Drill: Trend day — tables + score on that day */}
        {drillDown.type === 'trend_day' && (
          <Card>
            <CardHeader><CardTitle className="text-base">Điểm chất lượng ngày {drillDown.label}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Hiển thị điểm của tất cả bảng dữ liệu tại ngày {drillDown.label}. Dữ liệu mẫu sinh từ trend + offset theo bảng.</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">STT</TableHead>
                    <TableHead>Tên bảng</TableHead>
                    <TableHead className="text-center">Điểm (ước tính)</TableHead>
                    <TableHead className="text-center">Xếp hạng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDataSources.map((ds, i) => {
                    const offset = ds.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 15 - 7
                    const baseScore = parseInt(drillDown.id ?? '78')
                    const score = Math.min(100, Math.max(30, baseScore + offset))
                    const { grade, color } = getGrade(score)
                    return (
                      <TableRow key={ds.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelectTable(ds.id)}>
                        <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                        <TableCell className="font-medium text-gray-900">{ds.name}</TableCell>
                        <TableCell className={cn('text-center font-semibold', getScoreColor(score))}>{score}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn('inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold', color)}>{grade}</span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Drill: Rule detail + mock history */}
        {drillDown.type === 'rule_detail' && drillDown.id && (() => {
          const rule = mockRules.find(r => r.id === drillDown.id)
          if (!rule) return <p className="text-gray-400">Rule không tồn tại</p>
          const history = generateRuleHistory(rule.id)
          return (
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{rule.name}</CardTitle>
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700"
                    onClick={() => navigate('/rules')}>
                    Xem chi tiết quy tắc <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-gray-500">Bảng:</span> <span className="font-medium">{rule.tableName}</span></div>
                    <div><span className="text-gray-500">Chiều:</span> <DimensionBadge dimension={rule.dimension} /></div>
                    <div><span className="text-gray-500">Cột:</span> <span className="font-medium">{rule.columnName ?? 'Cấp bảng'}</span></div>
                    <div><span className="text-gray-500">Điểm:</span> <span className={cn('font-bold', getScoreColor(rule.lastScore ?? 0))}>{rule.lastScore ?? '—'}</span></div>
                    <div className="col-span-2 md:col-span-4"><span className="text-gray-500">Mô tả:</span> {rule.description}</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Lịch sử chạy (5 lần gần nhất)</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">STT</TableHead>
                        <TableHead>Thời gian</TableHead>
                        <TableHead className="text-center">Điểm</TableHead>
                        <TableHead className="text-center">Kết quả</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((h, i) => (
                        <TableRow key={h.id}>
                          <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                          <TableCell className="text-sm">{formatDateTime(h.runAt)}</TableCell>
                          <TableCell className={cn('text-center font-semibold', getScoreColor(h.score))}>{h.score}</TableCell>
                          <TableCell className="text-center"><StatusBadge status={h.result} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )
        })()}

        {/* Drill: Issue detail */}
        {drillDown.type === 'issue_detail' && drillDown.id && (() => {
          const issue = mockIssues.find(i => i.id === drillDown.id)
          if (!issue) return <p className="text-gray-400">Vấn đề không tồn tại</p>
          return (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{issue.title}</CardTitle>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700"
                  onClick={() => navigate(`/issues/${issue.id}`)}>
                  Xem chi tiết vấn đề <ChevronRight className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div><span className="text-gray-500">Bảng:</span> <span className="font-medium">{issue.tableName}</span></div>
                  <div><span className="text-gray-500">Chiều:</span> <DimensionBadge dimension={issue.dimension} /></div>
                  <div><span className="text-gray-500">Mức độ:</span> <StatusBadge status={issue.severity} /></div>
                  <div><span className="text-gray-500">Trạng thái:</span> <StatusBadge status={issue.status} /></div>
                  <div className="col-span-2 md:col-span-4"><span className="text-gray-500">Mô tả:</span> {issue.description}</div>
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Timeline</h4>
                <div className="space-y-2">
                  {issue.timeline.map(ev => (
                    <div key={ev.id} className="flex gap-3 text-sm border-l-2 border-gray-200 pl-3 py-1">
                      <span className="text-gray-400 whitespace-nowrap text-xs mt-0.5">{formatDateTime(ev.timestamp)}</span>
                      <div>
                        <span className="font-medium text-gray-700">{ev.user}:</span>{' '}
                        <span className="text-gray-600">{ev.content}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })()}
      </div>
    )
  }

  // ─── Tier 1: Dashboard ───
  return (
    <div className="space-y-6">
      {/* Row 1 — 4 KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          icon={<BarChart3 className="w-5 h-5 text-green-600" />}
          iconBg="bg-green-50"
          label="Điểm chất lượng trung bình"
          value={avgScore}
          sub={`${avgScore > yesterdayScore ? '+' : ''}${(avgScore - yesterdayScore).toFixed(1)} vs hôm qua`}
          valueColor={getScoreColor(avgScore)}
          onClick={() => setDrillDown({ type: 'score', label: 'Điểm tất cả bảng' })}
          infoWide
          info={
            <div className="space-y-1.5">
              <p className="font-semibold text-white/90">Cách tính điểm chất lượng trung bình</p>
              <p>Điểm trung bình của tất cả bảng dữ liệu đang giám sát, tính qua 3 cấp:</p>
              <p className="font-medium text-blue-300">① Điểm quy tắc (Rule Score)</p>
              <p>Mỗi quy tắc khi chạy trả về % bản ghi đạt yêu cầu. VD: 98.5% dòng pass → điểm = 98.5</p>
              <p className="font-medium text-blue-300">② Điểm chiều dữ liệu (Dimension Score)</p>
              <p>= Trung bình cộng điểm các quy tắc active cùng chiều, cùng bảng</p>
              <p className="font-medium text-blue-300">③ Điểm tổng bảng (Overall Score)</p>
              <p>= Trung bình cộng 6 chiều (chỉ tính chiều đã có quy tắc)</p>
              <p className="font-medium text-blue-300">④ Điểm trung bình hệ thống</p>
              <p>= Trung bình Overall Score của tất cả bảng</p>
              <p className="text-gray-400 mt-1">Xếp hạng: A (≥90) | B (≥80) | C (≥60) | D (&lt;60)</p>
            </div>
          }
        />
        <KpiCard
          icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
          label="Bảng đạt chuẩn"
          value={`${passTables}/${totalTables}`}
          sub={`${failTables} bảng không đạt (<80)`}
          valueColor="text-blue-600"
          onClick={() => setDrillDown({ type: 'tables', id: 'pass', label: 'Bảng đạt / không đạt' })}
          info={
            <div className="space-y-1">
              <p className="font-semibold text-white/90">Bảng đạt chuẩn</p>
              <p>Số bảng có điểm tổng (Overall Score) ≥ 80 trên tổng số bảng đang giám sát.</p>
              <p>• Đạt chuẩn: điểm ≥ 80 (xếp hạng A hoặc B)</p>
              <p>• Không đạt: điểm &lt; 80 (xếp hạng C hoặc D)</p>
              <p className="text-gray-400">Click để xem danh sách chi tiết bảng đạt/không đạt.</p>
            </div>
          }
        />
        <KpiCard
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="Quy tắc"
          value={
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-4 h-4" />{rulesByStatus.pass}</span>
              <span className="flex items-center gap-1 text-amber-500"><AlertCircle className="w-4 h-4" />{rulesByStatus.warning}</span>
              <span className="flex items-center gap-1 text-red-500"><XCircle className="w-4 h-4" />{rulesByStatus.fail}</span>
            </span>
          }
          sub={`Tổng: ${mockRules.length} quy tắc`}
          valueColor="text-gray-800"
          onClick={() => setDrillDown({ type: 'rules', label: 'Tất cả quy tắc' })}
          info={
            <div className="space-y-1">
              <p className="font-semibold text-white/90">Tổng quan quy tắc</p>
              <p>Hiển thị trạng thái quy tắc kiểm tra chất lượng:</p>
              <p>• <span className="text-green-400">Đạt (Pass)</span>: điểm quy tắc ≥ 80</p>
              <p>• <span className="text-amber-400">Cảnh báo (Warning)</span>: điểm 60–79</p>
              <p>• <span className="text-red-400">Lỗi (Fail)</span>: điểm &lt; 60</p>
              <p className="text-gray-400">Mỗi quy tắc kiểm tra 1 khía cạnh chất lượng (null, format, range...).</p>
            </div>
          }
        />
        <KpiCard
          icon={<Bug className="w-5 h-5 text-red-600" />}
          iconBg="bg-red-50"
          label="Vấn đề mới (7 ngày)"
          value={recentIssues.length}
          sub={`Kỳ trước: ${prevPeriodIssues.length} | Đang mở: ${openIssues.length}`}
          valueColor="text-red-600"
          onClick={() => setDrillDown({ type: 'issues', label: 'Tất cả vấn đề' })}
          info={
            <div className="space-y-1">
              <p className="font-semibold text-white/90">Vấn đề mới phát sinh</p>
              <p>Số vấn đề chất lượng được phát hiện trong 7 ngày gần nhất.</p>
              <p>• Kỳ trước: số vấn đề 7 ngày trước đó (để so sánh)</p>
              <p>• Đang mở: vấn đề chưa được giải quyết (trạng thái ≠ resolved/closed)</p>
              <p className="text-gray-400">Vấn đề được tạo tự động khi quy tắc vi phạm hoặc điểm vượt ngưỡng.</p>
            </div>
          }
        />
      </div>

      {/* Row 2 — 3 charts */}
      <div className="grid grid-cols-12 gap-4">
        {/* Area chart trend 30d — 5/12 */}
        <Card className="col-span-5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              Xu hướng chất lượng 30 ngày
              <InfoTooltip text={
                <div className="space-y-1">
                  <p className="font-semibold text-white/90">Xu hướng chất lượng</p>
                  <p>Biểu đồ hiển thị điểm chất lượng trung bình của toàn hệ thống qua 30 ngày gần nhất.</p>
                  <p>• Click vào điểm trên biểu đồ để xem chi tiết điểm từng bảng tại ngày đó</p>
                  <p>• Xu hướng tăng (↑): hệ thống cải thiện chất lượng</p>
                  <p>• Xu hướng giảm (↓): cần kiểm tra các bảng có vấn đề</p>
                </div>
              } />
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={mockTrendData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}
                onClick={(e) => {
                  if (e?.activePayload?.[0]) {
                    const pt = e.activePayload[0].payload
                    setDrillDown({ type: 'trend_day', id: String(pt.score), label: pt.date })
                  }
                }}
                className="cursor-pointer"
              >
                <defs>
                  <linearGradient id="reportScoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={5} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(value: number) => [value, 'Điểm']} />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} fill="url(#reportScoreGrad)" dot={false} activeDot={{ r: 5, cursor: 'pointer' }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar 6 dimensions — 3/12 */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              Điểm theo chiều dữ liệu
              <InfoTooltip text={
                <div className="space-y-1">
                  <p className="font-semibold text-white/90">Điểm theo chiều dữ liệu</p>
                  <p>Biểu đồ radar hiển thị điểm trung bình 6 chiều chất lượng:</p>
                  <p>• Đầy đủ (Completeness): dữ liệu có bị thiếu/NULL?</p>
                  <p>• Hợp lệ (Validity): đúng định dạng, khoảng giá trị?</p>
                  <p>• Nhất quán (Consistency): logic giữa các cột?</p>
                  <p>• Duy nhất (Uniqueness): có trùng lặp?</p>
                  <p>• Chính xác (Accuracy): khớp nguồn chuẩn?</p>
                  <p>• Kịp thời (Timeliness): dữ liệu đến đúng hạn?</p>
                  <p className="text-gray-400">Click vào chiều để xem bảng nào điểm thấp nhất.</p>
                </div>
              } wide />
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
                onClick={(e) => {
                  if (e?.activePayload?.[0]) {
                    const pt = e.activePayload[0].payload
                    setDrillDown({ type: 'dimension', id: pt.dimKey, label: pt.dimension })
                  }
                }}
                className="cursor-pointer"
              >
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Radar name="Điểm" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(value: number) => [value, 'Điểm']} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* NEW: BarChart top 10 lowest — 4/12 */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              Top 10 bảng điểm thấp nhất
              <InfoTooltip text={
                <div className="space-y-1">
                  <p className="font-semibold text-white/90">Top 10 bảng điểm thấp nhất</p>
                  <p>10 bảng có điểm tổng (Overall Score) thấp nhất trong hệ thống.</p>
                  <p>• Xanh: điểm ≥ 80 (đạt chuẩn)</p>
                  <p>• Vàng: điểm 60–79 (cảnh báo)</p>
                  <p>• Đỏ: điểm &lt; 60 (cần xử lý gấp)</p>
                  <p className="text-gray-400">Click vào bảng để xem chi tiết.</p>
                </div>
              } />
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bottom10} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}
                onClick={(e) => {
                  if (e?.activePayload?.[0]) {
                    const ds = e.activePayload[0].payload
                    onSelectTable(ds.id)
                  }
                }}
                className="cursor-pointer"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(value: number) => [value, 'Điểm']} />
                <Bar dataKey="overallScore" radius={[0, 4, 4, 0]} barSize={16}>
                  {bottom10.map((d) => (
                    <Cell key={d.id} fill={d.overallScore >= 80 ? '#10b981' : d.overallScore >= 60 ? '#f59e0b' : '#ef4444'} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — 2 tables */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top 10 quy tắc vi phạm nhiều nhất */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              Top 10 quy tắc vi phạm nhiều nhất
              <InfoTooltip text={
                <div className="space-y-1">
                  <p className="font-semibold text-white/90">Top 10 quy tắc vi phạm</p>
                  <p>10 quy tắc có điểm thấp nhất (nhiều bản ghi không đạt yêu cầu nhất).</p>
                  <p>Điểm quy tắc = % bản ghi đạt yêu cầu khi kiểm tra.</p>
                  <p className="text-gray-400">Click vào quy tắc để xem lịch sử chạy.</p>
                </div>
              } />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">STT</TableHead>
                  <TableHead>Quy tắc</TableHead>
                  <TableHead>Chiều</TableHead>
                  <TableHead>Bảng</TableHead>
                  <TableHead className="text-center">Điểm</TableHead>
                  <TableHead className="text-center">Kết quả</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {worstRules.map((r, i) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setDrillDown({ type: 'rule_detail', id: r.id, label: r.name })}>
                    <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900 max-w-[180px] truncate">{r.name}</TableCell>
                    <TableCell><DimensionBadge dimension={r.dimension} /></TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[100px] truncate">{r.tableName}</TableCell>
                    <TableCell className={cn('text-center font-semibold', getScoreColor(r.lastScore ?? 0))}>{r.lastScore ?? '—'}</TableCell>
                    <TableCell className="text-center">{r.lastResult ? <StatusBadge status={r.lastResult} /> : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Lỗi mới phát sinh (7 ngày) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              Lỗi mới phát sinh (7 ngày)
              <InfoTooltip text={
                <div className="space-y-1">
                  <p className="font-semibold text-white/90">Lỗi mới phát sinh</p>
                  <p>Danh sách vấn đề chất lượng mới phát sinh trong 7 ngày gần nhất.</p>
                  <p>• Mức độ: Critical / High / Medium / Low</p>
                  <p>• Trạng thái: vòng đời từ Mới → Đã gán → Đang xử lý → Đã xử lý → Đóng</p>
                  <p className="text-gray-400">Click vào vấn đề để xem chi tiết và timeline.</p>
                </div>
              } />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">STT</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Bảng</TableHead>
                  <TableHead className="text-center">Mức độ</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-6">Không có lỗi mới trong 7 ngày qua</TableCell>
                  </TableRow>
                ) : (
                  recentIssues.map((issue, i) => (
                    <TableRow key={issue.id} className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setDrillDown({ type: 'issue_detail', id: issue.id, label: issue.title })}>
                      <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900 max-w-[200px] truncate">{issue.title}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[100px] truncate">{issue.tableName}</TableCell>
                      <TableCell className="text-center"><StatusBadge status={issue.severity} /></TableCell>
                      <TableCell className="text-center"><StatusBadge status={issue.status} /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Table Detail Dashboard (selectedTable = specific table)
   ═══════════════════════════════════════════════════════════════ */
function TableDetailDashboard({ tableId }: { tableId: string }) {
  const navigate = useNavigate()
  const [detailDrillDown, setDetailDrillDown] = useState<DrillDown>(null)
  const ds = mockDataSources.find(d => d.id === tableId)

  if (!ds) return <p className="text-gray-400">Bảng dữ liệu không tồn tại (id={tableId})</p>

  const tableRules = mockRules.filter(r => r.tableId === tableId)
  const tableIssues = mockIssues.filter(i => i.tableId === tableId)
  const openIssuesCount = tableIssues.filter(i => !['resolved', 'closed'].includes(i.status)).length
  const tableTrend = generateTableTrend(tableId)
  const { grade, color: gradeColor } = getGrade(ds.overallScore)
  const trend = getTrend(ds.overallScore)

  const rulePass = tableRules.filter(r => r.lastResult === 'pass').length
  const ruleWarn = tableRules.filter(r => r.lastResult === 'warning').length
  const ruleFail = tableRules.filter(r => r.lastResult === 'fail' || r.lastResult === 'error').length

  const radarData = DIMENSION_KEYS.map(dim => ({
    dimension: DIMENSION_CONFIG[dim].label,
    dimKey: dim,
    score: ds.dimensionScores[dim],
  }))

  // Drill content
  if (detailDrillDown) {
    return (
      <div className="space-y-4">
        <BackButton label={detailDrillDown.label ?? ''} onClick={() => setDetailDrillDown(null)} />

        {/* Drill: Score breakdown 6 dimensions */}
        {detailDrillDown.type === 'score' && (
          <Card>
            <CardHeader><CardTitle className="text-base">Phân tích điểm theo 6 chiều — {ds.name}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chiều dữ liệu</TableHead>
                    <TableHead className="text-center">Điểm</TableHead>
                    <TableHead className="w-[200px]">Mức độ</TableHead>
                    <TableHead className="text-center">Xếp hạng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DIMENSION_KEYS.map(dim => {
                    const s = ds.dimensionScores[dim]
                    const { grade: g, color: c } = getGrade(s)
                    return (
                      <TableRow key={dim}>
                        <TableCell><DimensionBadge dimension={dim} /></TableCell>
                        <TableCell className={cn('text-center font-semibold', getScoreColor(s))}>{s}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={cn('h-full rounded-full', getScoreBarColor(s))} style={{ width: `${s}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-right">{s}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn('inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold', c)}>{g}</span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="bg-gray-50 font-semibold">
                    <TableCell>Tổng</TableCell>
                    <TableCell className={cn('text-center font-bold', getScoreColor(ds.overallScore))}>{ds.overallScore}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', getScoreBarColor(ds.overallScore))} style={{ width: `${ds.overallScore}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{ds.overallScore}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn('inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold', gradeColor)}>{grade}</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Drill: All rules of this table */}
        {detailDrillDown.type === 'rules' && (
          <Card>
            <CardHeader><CardTitle className="text-base">Quy tắc của {ds.name}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center">STT</TableHead>
                    <TableHead>Quy tắc</TableHead>
                    <TableHead>Chiều</TableHead>
                    <TableHead className="text-center">Điểm</TableHead>
                    <TableHead className="text-center">Kết quả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRules.map((r, i) => (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setDetailDrillDown({ type: 'rule_detail', id: r.id, label: r.name })}>
                      <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900">{r.name}</TableCell>
                      <TableCell><DimensionBadge dimension={r.dimension} /></TableCell>
                      <TableCell className={cn('text-center font-semibold', getScoreColor(r.lastScore ?? 0))}>{r.lastScore ?? '—'}</TableCell>
                      <TableCell className="text-center">{r.lastResult ? <StatusBadge status={r.lastResult} /> : '—'}</TableCell>
                    </TableRow>
                  ))}
                  {tableRules.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-6">Chưa có quy tắc nào</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Drill: Issues of this table */}
        {detailDrillDown.type === 'issues' && (
          <Card>
            <CardHeader><CardTitle className="text-base">Vấn đề của {ds.name}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center">STT</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead className="text-center">Mức độ</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-center">Phát hiện</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableIssues.map((issue, i) => (
                    <TableRow key={issue.id} className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setDetailDrillDown({ type: 'issue_detail', id: issue.id, label: issue.title })}>
                      <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900">{issue.title}</TableCell>
                      <TableCell className="text-center"><StatusBadge status={issue.severity} /></TableCell>
                      <TableCell className="text-center"><StatusBadge status={issue.status} /></TableCell>
                      <TableCell className="text-center text-sm text-gray-500">{formatDateTime(issue.detectedAt)}</TableCell>
                    </TableRow>
                  ))}
                  {tableIssues.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-6">Không có vấn đề</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Drill: Scan results per rule (last scan) */}
        {detailDrillDown.type === 'trend_day' && (
          <Card>
            <CardHeader><CardTitle className="text-base">Kết quả quét gần nhất — {ds.name}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center">STT</TableHead>
                    <TableHead>Quy tắc</TableHead>
                    <TableHead>Chiều</TableHead>
                    <TableHead className="text-center">Điểm</TableHead>
                    <TableHead className="text-center">Kết quả</TableHead>
                    <TableHead className="text-center">Lần chạy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRules.map((r, i) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900">{r.name}</TableCell>
                      <TableCell><DimensionBadge dimension={r.dimension} /></TableCell>
                      <TableCell className={cn('text-center font-semibold', getScoreColor(r.lastScore ?? 0))}>{r.lastScore ?? '—'}</TableCell>
                      <TableCell className="text-center">{r.lastResult ? <StatusBadge status={r.lastResult} /> : '—'}</TableCell>
                      <TableCell className="text-center text-sm text-gray-500">{r.lastRunAt ? formatDateTime(r.lastRunAt) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Drill: Dimension — rules of that dimension */}
        {detailDrillDown.type === 'dimension' && detailDrillDown.id && (
          <Card>
            <CardHeader><CardTitle className="text-base">Quy tắc chiều {DIMENSION_CONFIG[detailDrillDown.id as QualityDimension]?.label} — {ds.name}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center">STT</TableHead>
                    <TableHead>Quy tắc</TableHead>
                    <TableHead className="text-center">Điểm</TableHead>
                    <TableHead className="text-center">Kết quả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRules.filter(r => r.dimension === detailDrillDown.id).map((r, i) => (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setDetailDrillDown({ type: 'rule_detail', id: r.id, label: r.name })}>
                      <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900">{r.name}</TableCell>
                      <TableCell className={cn('text-center font-semibold', getScoreColor(r.lastScore ?? 0))}>{r.lastScore ?? '—'}</TableCell>
                      <TableCell className="text-center">{r.lastResult ? <StatusBadge status={r.lastResult} /> : '—'}</TableCell>
                    </TableRow>
                  ))}
                  {tableRules.filter(r => r.dimension === detailDrillDown.id).length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-6">Không có quy tắc cho chiều này</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Drill: Rule detail + history */}
        {detailDrillDown.type === 'rule_detail' && detailDrillDown.id && (() => {
          const rule = mockRules.find(r => r.id === detailDrillDown.id)
          if (!rule) return <p className="text-gray-400">Rule không tồn tại</p>
          const history = generateRuleHistory(rule.id)
          return (
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{rule.name}</CardTitle>
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700"
                    onClick={() => navigate('/rules')}>
                    Xem chi tiết quy tắc <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-gray-500">Bảng:</span> <span className="font-medium">{rule.tableName}</span></div>
                    <div><span className="text-gray-500">Chiều:</span> <DimensionBadge dimension={rule.dimension} /></div>
                    <div><span className="text-gray-500">Cột:</span> <span className="font-medium">{rule.columnName ?? 'Cấp bảng'}</span></div>
                    <div><span className="text-gray-500">Điểm:</span> <span className={cn('font-bold', getScoreColor(rule.lastScore ?? 0))}>{rule.lastScore ?? '—'}</span></div>
                    <div className="col-span-2 md:col-span-4"><span className="text-gray-500">Mô tả:</span> {rule.description}</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Lịch sử chạy (5 lần gần nhất)</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">STT</TableHead>
                        <TableHead>Thời gian</TableHead>
                        <TableHead className="text-center">Điểm</TableHead>
                        <TableHead className="text-center">Kết quả</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((h, i) => (
                        <TableRow key={h.id}>
                          <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                          <TableCell className="text-sm">{formatDateTime(h.runAt)}</TableCell>
                          <TableCell className={cn('text-center font-semibold', getScoreColor(h.score))}>{h.score}</TableCell>
                          <TableCell className="text-center"><StatusBadge status={h.result} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )
        })()}

        {/* Drill: Issue detail */}
        {detailDrillDown.type === 'issue_detail' && detailDrillDown.id && (() => {
          const issue = mockIssues.find(i => i.id === detailDrillDown.id)
          if (!issue) return <p className="text-gray-400">Vấn đề không tồn tại</p>
          return (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{issue.title}</CardTitle>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700"
                  onClick={() => navigate(`/issues/${issue.id}`)}>
                  Xem chi tiết vấn đề <ChevronRight className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div><span className="text-gray-500">Bảng:</span> <span className="font-medium">{issue.tableName}</span></div>
                  <div><span className="text-gray-500">Chiều:</span> <DimensionBadge dimension={issue.dimension} /></div>
                  <div><span className="text-gray-500">Mức độ:</span> <StatusBadge status={issue.severity} /></div>
                  <div><span className="text-gray-500">Trạng thái:</span> <StatusBadge status={issue.status} /></div>
                  <div className="col-span-2 md:col-span-4"><span className="text-gray-500">Mô tả:</span> {issue.description}</div>
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Timeline</h4>
                <div className="space-y-2">
                  {issue.timeline.map(ev => (
                    <div key={ev.id} className="flex gap-3 text-sm border-l-2 border-gray-200 pl-3 py-1">
                      <span className="text-gray-400 whitespace-nowrap text-xs mt-0.5">{formatDateTime(ev.timestamp)}</span>
                      <div>
                        <span className="font-medium text-gray-700">{ev.user}:</span>{' '}
                        <span className="text-gray-600">{ev.content}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })()}
      </div>
    )
  }

  // ─── Tier 1: Table detail dashboard ───
  return (
    <div className="space-y-6">
      {/* Row 1 — Header */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-gray-900 truncate">{ds.name}</h2>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', MODULE_BADGE[ds.moduleType].color)}>
                  {MODULE_BADGE[ds.moduleType].label}
                </span>
                <StatusBadge status={ds.status} />
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>Owner: <strong className="text-gray-700">{ds.owner}</strong></span>
                <span>Team: {ds.team}</span>
                {ds.area && <span>Area: {ds.area}</span>}
                {ds.mode && <span>Mode: {ds.mode}</span>}
                {ds.partitionBy && <span>Partition: {ds.partitionBy}</span>}
                <span>Schema: {ds.schema}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <p className={cn('text-3xl font-bold', getScoreColor(ds.overallScore))}>{ds.overallScore}</p>
                <span className={cn('inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold', gradeColor)}>{grade}</span>
              </div>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700"
                onClick={() => navigate(`/data-catalog/${ds.id}`)}>
                Xem chi tiết bảng <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 2 — 4 mini cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          icon={<Activity className="w-5 h-5 text-green-600" />}
          iconBg="bg-green-50"
          label="Điểm tổng"
          value={ds.overallScore}
          sub={`Xu hướng: ${trend === 'up' ? 'Tăng' : trend === 'down' ? 'Giảm' : 'Ổn định'}`}
          valueColor={getScoreColor(ds.overallScore)}
          onClick={() => setDetailDrillDown({ type: 'score', label: 'Phân tích 6 chiều' })}
          infoWide
          info={
            <div className="space-y-1">
              <p className="font-semibold text-white/90">Điểm tổng bảng (Overall Score)</p>
              <p>= Trung bình cộng điểm 6 chiều chất lượng (chỉ tính chiều đã có quy tắc).</p>
              <p>• Xu hướng ↑ Tăng: điểm ≥ 85</p>
              <p>• Xu hướng → Ổn định: điểm 70–84</p>
              <p>• Xu hướng ↓ Giảm: điểm &lt; 70</p>
              <p className="text-gray-400">Click để xem phân tích chi tiết theo từng chiều.</p>
            </div>
          }
        />
        <KpiCard
          icon={<Layers className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
          label="Quy tắc"
          value={
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-4 h-4" />{rulePass}</span>
              <span className="flex items-center gap-1 text-amber-500"><AlertCircle className="w-4 h-4" />{ruleWarn}</span>
              <span className="flex items-center gap-1 text-red-500"><XCircle className="w-4 h-4" />{ruleFail}</span>
            </span>
          }
          sub={`Tổng: ${tableRules.length} quy tắc`}
          valueColor="text-gray-800"
          onClick={() => setDetailDrillDown({ type: 'rules', label: 'Quy tắc' })}
          info={
            <div className="space-y-1">
              <p className="font-semibold text-white/90">Quy tắc của bảng</p>
              <p>Trạng thái các quy tắc kiểm tra chất lượng của bảng này:</p>
              <p>• <span className="text-green-400">Đạt</span>: điểm ≥ 80</p>
              <p>• <span className="text-amber-400">Cảnh báo</span>: điểm 60–79</p>
              <p>• <span className="text-red-400">Lỗi</span>: điểm &lt; 60</p>
            </div>
          }
        />
        <KpiCard
          icon={<Bug className="w-5 h-5 text-red-600" />}
          iconBg="bg-red-50"
          label="Vấn đề đang mở"
          value={openIssuesCount}
          sub={`Tổng: ${tableIssues.length} vấn đề`}
          valueColor={openIssuesCount > 0 ? 'text-red-600' : 'text-green-600'}
          onClick={() => setDetailDrillDown({ type: 'issues', label: 'Vấn đề' })}
          info={
            <div className="space-y-1">
              <p className="font-semibold text-white/90">Vấn đề đang mở</p>
              <p>Số vấn đề chất lượng của bảng chưa được giải quyết (trạng thái ≠ resolved/closed).</p>
              <p className="text-gray-400">Click để xem danh sách chi tiết.</p>
            </div>
          }
        />
        <KpiCard
          icon={<Clock className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-50"
          label="Lần quét cuối"
          value={ds.lastProfiled ? new Date(ds.lastProfiled).toLocaleDateString('vi-VN') : '—'}
          sub={ds.lastProfiled ? new Date(ds.lastProfiled).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
          valueColor="text-gray-800"
          onClick={() => setDetailDrillDown({ type: 'trend_day', label: 'Kết quả quét' })}
          info={
            <div className="space-y-1">
              <p className="font-semibold text-white/90">Lần quét cuối</p>
              <p>Thời điểm chạy quy tắc kiểm tra gần nhất cho bảng này.</p>
              <p>Điểm hiển thị trên giao diện luôn lấy từ lần quét gần nhất — không cộng dồn.</p>
              <p className="text-gray-400">Click để xem kết quả quét chi tiết từng quy tắc.</p>
            </div>
          }
        />
      </div>

      {/* Row 3 — 2 charts */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              Xu hướng 30 ngày — {ds.name}
              <InfoTooltip text="Biểu đồ điểm chất lượng của bảng qua 30 ngày gần nhất. Click vào điểm để xem phân tích chi tiết." />
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={tableTrend} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}
                onClick={(e) => {
                  if (e?.activePayload?.[0]) {
                    const pt = e.activePayload[0].payload
                    setDetailDrillDown({ type: 'score', label: `Score ngay ${pt.date}` })
                  }
                }}
                className="cursor-pointer"
              >
                <defs>
                  <linearGradient id="tableScoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={5} tickLine={false} />
                <YAxis domain={[30, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(value: number) => [value, 'Điểm']} />
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} fill="url(#tableScoreGrad)" dot={false} activeDot={{ r: 5, cursor: 'pointer' }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              Biểu đồ radar 6 chiều
              <InfoTooltip text="Hiển thị điểm 6 chiều chất lượng: Đầy đủ, Hợp lệ, Nhất quán, Duy nhất, Chính xác, Kịp thời. Click vào chiều để xem quy tắc của chiều đó." />
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
                onClick={(e) => {
                  if (e?.activePayload?.[0]) {
                    const pt = e.activePayload[0].payload
                    setDetailDrillDown({ type: 'dimension', id: pt.dimKey, label: pt.dimension })
                  }
                }}
                className="cursor-pointer"
              >
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Radar name="Điểm" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(value: number) => [value, 'Điểm']} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 4 — Rules table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quy tắc của bảng {ds.name} ({tableRules.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">STT</TableHead>
                <TableHead>Quy tắc</TableHead>
                <TableHead>Chiều dữ liệu</TableHead>
                <TableHead>Cột</TableHead>
                <TableHead className="text-center">Điểm</TableHead>
                <TableHead className="text-center">Kết quả</TableHead>
                <TableHead className="text-center">Lần chạy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRules.map((r, i) => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setDetailDrillDown({ type: 'rule_detail', id: r.id, label: r.name })}>
                  <TableCell className="text-center text-gray-500">{i + 1}</TableCell>
                  <TableCell className="font-medium text-gray-900">{r.name}</TableCell>
                  <TableCell><DimensionBadge dimension={r.dimension} /></TableCell>
                  <TableCell className="text-sm text-gray-600">{r.columnName ?? 'Cấp bảng'}</TableCell>
                  <TableCell className={cn('text-center font-semibold', getScoreColor(r.lastScore ?? 0))}>{r.lastScore ?? '—'}</TableCell>
                  <TableCell className="text-center">{r.lastResult ? <StatusBadge status={r.lastResult} /> : '—'}</TableCell>
                  <TableCell className="text-center text-sm text-gray-500">{r.lastRunAt ? formatDateTime(r.lastRunAt) : '—'}</TableCell>
                </TableRow>
              ))}
              {tableRules.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-6">Chưa có quy tắc nào được thiết lập cho bảng này</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Overview Tab — Filter bar + conditional render
   ═══════════════════════════════════════════════════════════════ */
function OverviewTab() {
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const [fromDate, setFromDate] = useState(thirtyDaysAgo)
  const [toDate, setToDate] = useState(today)
  const [selectedTable, setSelectedTable] = useState('all')
  const [selectedDimension, setSelectedDimension] = useState('all')

  const handleTableChange = useCallback((value: string) => {
    setSelectedTable(value)
  }, [])

  function handleApply() {
    // Filter logic can be wired here
  }

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Từ ngày</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Đến ngày</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Bảng dữ liệu</label>
              <Select value={selectedTable} onChange={e => handleTableChange(e.target.value)} className="w-52 text-sm">
                <option value="all">Tất cả bảng dữ liệu</option>
                {mockDataSources.map((ds) => (
                  <option key={ds.id} value={ds.id}>{ds.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Chiều dữ liệu</label>
              <Select value={selectedDimension} onChange={e => setSelectedDimension(e.target.value)} className="w-48 text-sm">
                {DIMENSION_LABELS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </Select>
            </div>
            <Button onClick={handleApply} className="self-end">
              Áp dụng
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conditional render */}
      {selectedTable === 'all' ? (
        <OverviewDashboard onSelectTable={handleTableChange} />
      ) : (
        <TableDetailDashboard key={selectedTable} tableId={selectedTable} />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Reconciliation tab — KEPT AS-IS
   ═══════════════════════════════════════════════════════════════ */
function ReconciliationTab() {
  const [filterReport, setFilterReport] = useState('all')

  const reportTableOptions = useMemo(() => {
    const unique = new Map<string, string>()
    reconciliationResults.forEach(r => unique.set(r.reportTableId, r.reportTableName))
    return Array.from(unique, ([id, name]) => ({ id, name }))
  }, [])

  const filtered = useMemo(() => {
    if (filterReport === 'all') return reconciliationResults
    return reconciliationResults.filter(r => r.reportTableId === filterReport)
  }, [filterReport])

  const allResults = reconciliationResults
  const totalChecks = allResults.length
  const passRate = totalChecks > 0
    ? ((allResults.filter(r => r.result === 'pass').length / totalChecks) * 100).toFixed(1)
    : '0.0'
  const maxVariance = totalChecks > 0
    ? Math.max(...allResults.map(r => r.variance)).toFixed(2)
    : '0.00'
  const reportsNeedCheck = new Set(
    allResults.filter(r => r.result !== 'pass').map(r => r.reportTableId)
  ).size

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Tổng lượt đối soát</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalChecks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Tỷ lệ khớp</p>
                <p className="text-2xl font-bold text-green-600 mt-0.5">{passRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Chênh lệch lớn nhất</p>
                <p className="text-2xl font-bold text-amber-600 mt-0.5">{maxVariance}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50">
                <FileWarning className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Báo cáo cần kiểm tra</p>
                <p className="text-2xl font-bold text-red-600 mt-0.5">{reportsNeedCheck}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter + Export */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Báo cáo</label>
                <Select value={filterReport} onChange={e => setFilterReport(e.target.value)} className="w-56 text-sm">
                  <option value="all">Tất cả báo cáo</option>
                  {reportTableOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </Select>
              </div>
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-2"
              onClick={() => exportReconciliationCSV(filtered)}>
              <Download className="w-4 h-4" />
              Xuất CSV ({filtered.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kết quả đối soát báo cáo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center sticky left-0 bg-white z-10">STT</TableHead>
                <TableHead>Báo cáo</TableHead>
                <TableHead>Bảng nguồn</TableHead>
                <TableHead className="max-w-[200px]">Cột đối soát</TableHead>
                <TableHead className="text-right">Giá trị báo cáo</TableHead>
                <TableHead className="text-right">Giá trị nguồn</TableHead>
                <TableHead className="text-center">Chênh lệch</TableHead>
                <TableHead className="text-center">Ngưỡng</TableHead>
                <TableHead className="text-center">Điểm</TableHead>
                <TableHead className="text-center">Kết quả</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-gray-400 py-8">
                    Không có dữ liệu đối soát
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r, idx) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-center text-gray-500 sticky left-0 bg-white z-10">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{r.reportTableName}</TableCell>
                    <TableCell className="text-gray-700">{r.sourceTableName}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-gray-600 text-sm">
                      {r.reportColumn} vs {r.sourceColumn}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {r.reportValue.toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {r.sourceValue.toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
                        getVarianceBg(r.variance),
                        getVarianceColor(r.variance),
                      )}>
                        {r.variance}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600">
                      {r.tolerancePct}%
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn('text-sm font-semibold', getScoreColor(r.qualityScore))}>
                        {r.qualityScore}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={r.result} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Main Reports page
   ═══════════════════════════════════════════════════════════════ */
export function Reports() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Báo cáo chất lượng dữ liệu"
        description="Phân tích và xuất báo cáo chất lượng dữ liệu theo kỳ"
      />

      <Tabs
        tabs={[
          { id: 'overview', label: 'Tổng quan', content: <OverviewTab /> },
          { id: 'reconciliation', label: 'Đối soát', content: <ReconciliationTab /> },
        ]}
        defaultTab="overview"
      />
    </div>
  )
}
