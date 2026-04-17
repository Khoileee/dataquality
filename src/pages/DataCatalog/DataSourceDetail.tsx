import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Play, Edit, Layers, CheckSquare, Link2, Fingerprint, Target, Clock, RefreshCw,
  AlertTriangle as AlertTriangleIcon, CheckCircle, Database, FileBarChart,
  Plus, Calendar,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import { DimensionBadge, DIMENSION_CONFIG } from '@/components/common/DimensionBadge'
import { getScoreColor, formatDate, formatDateTime } from '@/lib/utils'
import { mockDataSources, mockRules, mockProfilingResults, mockUsers, mockIssues, getDownstreamJobs, getUpstreamJobs } from '@/data/mockData'
import type { QualityDimension, DataSource, ProfilingResult } from '@/types'

const DIMENSION_ICONS: Record<QualityDimension, React.ReactNode> = {
  completeness: <Layers className="h-4 w-4" />,
  validity: <CheckSquare className="h-4 w-4" />,
  consistency: <Link2 className="h-4 w-4" />,
  uniqueness: <Fingerprint className="h-4 w-4" />,
  accuracy: <Target className="h-4 w-4" />,
  timeliness: <Clock className="h-4 w-4" />,
}

const DIMENSIONS: QualityDimension[] = [
  'completeness', 'validity', 'consistency', 'uniqueness', 'accuracy', 'timeliness',
]

const trendData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
  score: Math.round(65 + Math.sin(i * 0.4) * 15 + i * 0.5),
}))

export function DataSourceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const baseDs = mockDataSources.find(ds => ds.id === id)

  // Local mutable state
  const [ds, setDs] = useState<DataSource | null>(baseDs ?? null)
  const [localProfilings, setLocalProfilings] = useState<ProfilingResult[]>([...mockProfilingResults])
  const [scanning, setScanning] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formType, setFormType] = useState('database')
  const [formSchema, setFormSchema] = useState('')
  const [formTable, setFormTable] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formOwner, setFormOwner] = useState('')
  const [formTeam, setFormTeam] = useState('')

  if (!ds) {
    return (
      <div className="p-6">
        <div className="text-center py-24 text-gray-400">
          <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Không tìm thấy nguồn dữ liệu</p>
          <p className="text-sm mt-1">ID: {id}</p>
          <Link to="/data-catalog" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
            Quay lại danh mục
          </Link>
        </div>
      </div>
    )
  }

  const profilingResult = localProfilings.filter(r => r.tableId === ds.id).slice(-1)[0]
  const rules = mockRules.filter(r => r.tableId === ds.id)
  const activeRules = rules.filter(r => r.status === 'active')

  // Use overallScore and dimensionScores directly from datasource (consistent with list view)
  const overallScore = ds.overallScore
  const dimScores: Record<QualityDimension, number> = ds.dimensionScores

  // Check which dimensions have active rules (for labeling)
  const dimsWithRules = new Set(activeRules.map(r => r.dimension))

  function handleScanNow() {
    setScanning(true)
    setTimeout(() => {
      const now = new Date().toISOString()
      // Generate a new profiling result from the existing one (or create fresh)
      const base = localProfilings.find(r => r.tableId === ds!.id)
      const newResult: ProfilingResult = {
        id: `prof-${Date.now()}`,
        tableId: ds!.id,
        tableName: ds!.tableName,
        runAt: now,
        status: 'completed',
        totalRows: ds!.rowCount || 10000,
        totalColumns: base?.columnProfiles.length ?? 5,
        overallScore: overallScore ?? 85,
        dimensionScores: { ...ds!.dimensionScores },
        durationSeconds: 8 + Math.floor(Math.random() * 20),
        columnProfiles: base?.columnProfiles ?? [],
      }
      setLocalProfilings(prev => [...prev, newResult])
      setDs(prev => prev ? { ...prev, lastProfiled: now } : prev)
      setScanning(false)
      setScanSuccess(true)
      setTimeout(() => setScanSuccess(false), 3000)
    }, 2000)
  }

  function openEditDialog() {
    setFormName(ds.name)
    setFormDesc(ds.description)
    setFormType(ds.type)
    setFormSchema(ds.schema)
    setFormTable(ds.tableName)
    setFormCategory(ds.category)
    setFormOwner(ds.owner)
    setFormTeam(ds.team)
    setEditOpen(true)
  }

  function handleSave() {
    setDs(prev => prev ? {
      ...prev,
      name: formName,
      description: formDesc,
      type: formType as DataSource['type'],
      schema: formSchema,
      tableName: formTable,
      category: formCategory,
      owner: formOwner,
      team: formTeam,
      updatedAt: new Date().toISOString(),
    } : prev)
    setEditOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={ds.name}
        description={ds.description}
        breadcrumbs={[
          { label: 'Danh mục dữ liệu', href: '/data-catalog' },
          { label: ds.moduleType === 'source' ? 'Bảng nguồn' : ds.moduleType === 'report' ? 'Báo cáo' : 'Chỉ tiêu' },
          { label: ds.name },
        ]}
        actions={
          <>
            <Button
              onClick={handleScanNow}
              disabled={scanning}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              {scanning
                ? <RefreshCw className="h-4 w-4 animate-spin" />
                : <Play className="h-4 w-4" />}
              {scanning ? 'Đang phân tích...' : 'Chạy phân tích ngay'}
            </Button>
            {scanSuccess && (
              <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium animate-pulse">
                <CheckCircle className="h-4 w-4" /> Phân tích hoàn tất!
              </span>
            )}
            <Button
              variant="outline"
              className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => navigate(`/rules?action=new&tableId=${ds.id}`)}
              title="Tạo quy tắc kiểm tra DQ mới gắn với bảng này"
            >
              <Plus className="h-4 w-4" />
              Tạo rule cho bảng này
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
              onClick={() => navigate(`/schedules?tableId=${ds.id}`)}
              title="Xem lịch chạy DQ của bảng"
            >
              <Calendar className="h-4 w-4" />
              Đặt lịch chạy
            </Button>
            <Button variant="outline" className="flex items-center gap-2" onClick={openEditDialog}>
              <Edit className="h-4 w-4" />
              Chỉnh sửa
            </Button>
          </>
        }
      />

      {/* Overall Score banner */}
      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5 shadow-sm">
        <span className="text-sm text-gray-500">Điểm chất lượng tổng:</span>
        <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</span>
        <span className="text-sm text-gray-400">/ 100</span>
        <span className="text-xs text-gray-400 ml-1">(trung bình 6 chiều dữ liệu)</span>
      </div>

      {/* Row 1 - 6 dimension cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {DIMENSIONS.map(dim => {
          const cfg = DIMENSION_CONFIG[dim]
          const score = dimScores[dim]
          const hasRule = dimsWithRules.has(dim)
          return (
            <Card key={dim} className="border-l-4 overflow-hidden" style={{ borderLeftColor: cfg.hex }}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <span style={{ color: cfg.hex }}>{DIMENSION_ICONS[dim]}</span>
                  <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-bold" style={{ color: cfg.hex }}>{score}</span>
                  <span className="text-xs text-gray-400">/ 100</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${score}%`, backgroundColor: cfg.hex }}
                  />
                </div>
                {!hasRule && (
                  <div className="text-[10px] text-gray-400 italic mt-1.5">(chưa có rule)</div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Row 2 - Info + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Thông tin bảng dữ liệu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                { label: 'Loại đối tượng', value: (
                  <span className="text-sm text-gray-700">
                    {ds.moduleType === 'source' ? 'Bảng nguồn' : ds.moduleType === 'report' ? 'Báo cáo' : 'Chỉ tiêu KPI'}
                  </span>
                )},
                { label: 'Schema', value: ds.schema },
                { label: 'Loại kết nối', value: <StatusBadge status={ds.type} /> },
                { label: 'Danh mục', value: <Badge variant="secondary">{ds.category}</Badge> },
                { label: 'Chủ sở hữu', value: ds.owner },
                { label: 'Nhóm', value: ds.team },
                { label: 'Số lượng dòng', value: ds.rowCount.toLocaleString('vi-VN') },
                {
                  label: 'Lần phân tích cuối',
                  value: ds.lastProfiled ? formatDateTime(ds.lastProfiled) : '—',
                },
                { label: 'Trạng thái', value: <StatusBadge status={ds.status} /> },
                { label: 'Ngày tạo', value: formatDate(ds.createdAt) },
                ...(ds.moduleType === 'kpi' && ds.periodType ? [{ label: 'Chu kỳ tính', value: ds.periodType === 'daily' ? 'Ngày' : ds.periodType === 'weekly' ? 'Tuần' : ds.periodType === 'monthly' ? 'Tháng' : ds.periodType === 'quarterly' ? 'Quý' : 'Năm' }] : []),
                ...(ds.moduleType === 'kpi' && ds.kpiFormula ? [{ label: 'Công thức tính', value: <span className="font-mono text-xs bg-gray-50 px-2 py-0.5 rounded">{ds.kpiFormula}</span> }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400 font-medium">{label}</span>
                  <span className="text-sm text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Xu hướng điểm chất lượng (30 ngày)</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">Ước tính từ lịch sử chạy · Dữ liệu demo</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={6} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  formatter={(v: number) => [`${v}`, 'Điểm']}
                />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 - Source Tables (for report & kpi) */}
      {ds.moduleType !== 'source' && ds.sourceTableIds && ds.sourceTableIds.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {ds.moduleType === 'report' ? <FileBarChart className="h-4 w-4 text-purple-500" /> : <Target className="h-4 w-4 text-orange-500" />}
              {ds.moduleType === 'report' ? 'Bảng nguồn liên kết' : 'Nguồn dữ liệu'}
            </CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">
              {ds.moduleType === 'report'
                ? 'Các bảng nguồn được sử dụng để tổng hợp báo cáo này. Chất lượng bảng nguồn ảnh hưởng trực tiếp đến chất lượng báo cáo.'
                : 'Các nguồn dữ liệu (báo cáo/bảng) được sử dụng để tính toán chỉ tiêu KPI này.'}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Schema</TableHead>
                    <TableHead>Điểm tổng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ds.sourceTableIds.map((stId, idx) => {
                    const st = mockDataSources.find(s => s.id === stId)
                    if (!st) return null
                    return (
                      <TableRow key={stId} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/data-catalog/${st.id}`)}>
                        <TableCell className="text-center text-sm text-gray-400">{idx + 1}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-blue-600 hover:underline">{st.name}</span>
                          <span className="text-xs text-gray-400 block">{st.description}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {st.moduleType === 'source' ? 'Bảng nguồn' : st.moduleType === 'report' ? 'Báo cáo' : 'Chỉ tiêu'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{st.schema}</TableCell>
                        <TableCell>
                          <span className={`text-lg font-bold ${getScoreColor(st.overallScore)}`}>{st.overallScore}</span>
                        </TableCell>
                        <TableCell><StatusBadge status={st.status} /></TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 4 - Column profiling */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Phân tích cột dữ liệu</CardTitle>
          <p className="text-xs text-gray-400 mt-0.5">
            Từ lần quét gần nhất
            {profilingResult ? ` · ${new Date(profilingResult.runAt).toLocaleDateString('vi-VN')}` : ''}
            {' '}· Snapshot thống kê cột (null rate, distinct…)
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {profilingResult && profilingResult.columnProfiles.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center sticky top-0 bg-white">#</TableHead>
                      <TableHead className="sticky top-0 bg-white"><span className="inline-flex items-center gap-1">Tên cột <InfoTooltip text="Tên cột vật lý trong bảng dữ liệu" /></span></TableHead>
                      <TableHead className="sticky top-0 bg-white"><span className="inline-flex items-center gap-1">Kiểu dữ liệu <InfoTooltip text="Kiểu dữ liệu phát hiện tự động bởi profiling engine (string, integer, date, float, boolean)" /></span></TableHead>
                      <TableHead className="sticky top-0 bg-white"><span className="inline-flex items-center gap-1">Null% <InfoTooltip text="Tỷ lệ phần trăm giá trị NULL trong cột. Càng cao = càng nhiều dữ liệu bị thiếu." /></span></TableHead>
                      <TableHead className="sticky top-0 bg-white"><span className="inline-flex items-center gap-1">Phân biệt% <InfoTooltip text="Tỷ lệ giá trị duy nhất (distinct) so với tổng số bản ghi. 100% = mỗi giá trị là duy nhất." /></span></TableHead>
                      <TableHead className="sticky top-0 bg-white"><span className="inline-flex items-center gap-1">Min <InfoTooltip text="Giá trị nhỏ nhất trong cột (số hoặc ngày)" /></span></TableHead>
                      <TableHead className="sticky top-0 bg-white"><span className="inline-flex items-center gap-1">Max <InfoTooltip text="Giá trị lớn nhất trong cột (số hoặc ngày)" /></span></TableHead>
                      <TableHead className="sticky top-0 bg-white"><span className="inline-flex items-center gap-1">Vấn đề <InfoTooltip text="Các nhận xét kỹ thuật tự động từ profiling engine: null rate cao, sai định dạng, outlier... Đây KHÔNG phải Issue từ Rules." /></span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profilingResult.columnProfiles.map((col, idx) => (
                      <TableRow key={col.columnName}>
                        <TableCell className="text-center text-sm text-gray-400 font-medium">{idx + 1}</TableCell>
                        <TableCell>
                          <span className="font-mono text-sm font-medium text-gray-800">{col.columnName}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{col.dataType}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${col.nullRate < 1 ? 'text-green-600' : col.nullRate <= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                            {col.nullRate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{col.distinctRate.toFixed(1)}%</TableCell>
                        <TableCell className="text-sm text-gray-500 max-w-[100px] truncate">{col.minValue ?? '—'}</TableCell>
                        <TableCell className="text-sm text-gray-500 max-w-[100px] truncate">{col.maxValue ?? '—'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {col.issues.length === 0 ? (
                              <span className="text-xs text-green-600">Không có</span>
                            ) : col.issues.map((issue, i) => (
                              <span key={i} className="inline-flex items-center rounded bg-red-50 border border-red-200 px-1.5 py-0.5 text-xs text-red-700">
                                {issue}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Layers className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có dữ liệu phân tích cột cho bảng này</p>
              <p className="text-xs mt-1">Nhấn "Chạy phân tích ngay" để xem kết quả</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 4 - Rules */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Quy tắc chất lượng áp dụng</CardTitle>
            <Badge variant="secondary">{rules.length} quy tắc</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rules.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có quy tắc nào được áp dụng cho bảng này</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center sticky top-0 bg-white">#</TableHead>
                      <TableHead className="sticky top-0 bg-white">Tên quy tắc</TableHead>
                      <TableHead className="sticky top-0 bg-white">Chiều DL</TableHead>
                      <TableHead className="sticky top-0 bg-white">Cột</TableHead>
                      <TableHead className="sticky top-0 bg-white"><span className="inline-flex items-center gap-1">Ngưỡng W / C <InfoTooltip text="W = Warning (Cảnh báo): điểm dưới ngưỡng này sẽ cảnh báo.
C = Critical (Không đạt): điểm dưới ngưỡng này sẽ báo lỗi nghiêm trọng.
VD: W:90/C:80 nghĩa là dưới 90 cảnh báo, dưới 80 không đạt." /></span></TableHead>
                      <TableHead className="sticky top-0 bg-white">Kết quả cuối</TableHead>
                      <TableHead className="sticky top-0 bg-white">Chạy lần cuối</TableHead>
                      <TableHead className="sticky top-0 bg-white">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule, idx) => (
                      <TableRow key={rule.id}>
                        <TableCell className="text-center text-sm text-gray-400 font-medium">{idx + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{rule.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{rule.description}</p>
                          </div>
                        </TableCell>
                        <TableCell><DimensionBadge dimension={rule.dimension} /></TableCell>
                        <TableCell>
                          {rule.columnName
                            ? <span className="font-mono text-xs text-gray-600">{rule.columnName}</span>
                            : <span className="text-xs text-gray-400">—</span>}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          <span className="text-amber-600">{rule.threshold.warning}</span>
                          {' / '}
                          <span className="text-red-600">{rule.threshold.critical}</span>
                        </TableCell>
                        <TableCell>
                          {rule.lastResult
                            ? <StatusBadge status={rule.lastResult} />
                            : <span className="text-gray-400 text-xs">—</span>}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                          {rule.lastRunAt ? formatDateTime(rule.lastRunAt) : '—'}
                        </TableCell>
                        <TableCell><StatusBadge status={rule.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Luồng dữ liệu */}
      {(() => {
        const upstream = getUpstreamJobs(ds.id)
        const downstream = getDownstreamJobs(ds.id)
        const hasActiveIssue = mockIssues.some(i => i.tableId === ds.id && i.status !== 'resolved' && i.status !== 'closed')
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Luồng dữ liệu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Upstream */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Upstream — Job tạo ra bảng này ({upstream.length})
                </div>
                {upstream.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Không có job nào ghi dữ liệu vào bảng này</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['#', 'Tên Job', 'Chủ sở hữu', 'Lịch chạy', 'Trạng thái'].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {upstream.map((job, i) => (
                          <tr key={job.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                            <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                            <td className="px-3 py-2 font-semibold text-slate-800">{job.name}</td>
                            <td className="px-3 py-2 text-slate-600">{job.owner}</td>
                            <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">{job.schedule}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${job.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {job.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Downstream */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Downstream — Job/Báo cáo sử dụng bảng này ({downstream.length})
                  </div>
                  {downstream.length > 0 && hasActiveIssue && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      <AlertTriangleIcon className="h-3 w-3" />
                      {downstream.length} job có thể bị ảnh hưởng
                    </span>
                  )}
                </div>
                {downstream.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Không có job nào sử dụng bảng này làm đầu vào</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['#', 'Tên Job', 'Chủ sở hữu', 'Email', 'Lịch chạy'].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {downstream.map((job, i) => (
                          <tr key={job.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/60 ${hasActiveIssue ? 'bg-amber-50/30' : ''}`}>
                            <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                            <td className="px-3 py-2 font-semibold text-slate-800">{job.name}</td>
                            <td className="px-3 py-2 text-slate-600">{job.owner}</td>
                            <td className="px-3 py-2 text-slate-500 text-xs">{job.ownerEmail}</td>
                            <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">{job.schedule}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Edit Dialog */}
      {editOpen && (
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Chỉnh sửa nguồn dữ liệu">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Tên hiển thị *</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="VD: Bảng khách hàng" />
              </div>
              <div className="col-span-2">
                <Label>Mô tả</Label>
                <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} placeholder="Mô tả ngắn về bảng dữ liệu" />
              </div>
              <div>
                <Label>Loại kết nối *</Label>
                <Select value={formType} onChange={e => setFormType(e.target.value)}>
                  <option value="database">Database</option>
                  <option value="sql">SQL</option>
                  <option value="file">File</option>
                  <option value="api">API</option>
                </Select>
              </div>
              <div>
                <Label>Schema</Label>
                <Input value={formSchema} onChange={e => setFormSchema(e.target.value)} placeholder="dbo" />
              </div>
              <div>
                <Label>Tên bảng vật lý *</Label>
                <Input value={formTable} onChange={e => setFormTable(e.target.value)} placeholder="KH_KHACHHANG" />
              </div>
              <div>
                <Label>Danh mục</Label>
                <Input value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="Khách hàng" />
              </div>
              <div>
                <Label>Chủ sở hữu</Label>
                <Select value={formOwner} onChange={e => setFormOwner(e.target.value)}>
                  {mockUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Nhóm</Label>
                <Input value={formTeam} onChange={e => setFormTeam(e.target.value)} placeholder="Data Engineering" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Hủy</Button>
              <Button onClick={handleSave} disabled={!formName || !formTable}>Lưu thay đổi</Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
