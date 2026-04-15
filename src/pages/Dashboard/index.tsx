import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, BarChart, Bar, Cell,
} from 'recharts'
import {
  Database, BarChart2, AlertTriangle, CheckCircle, FileBarChart, Target, Link2,
  CheckCircle2, Circle, ChevronRight, Sparkles,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/common/PageHeader'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import { ScoreGauge } from '@/components/common/ScoreGauge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DimensionBadge, DIMENSION_CONFIG } from '@/components/common/DimensionBadge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { getScoreColor, getScoreBarColor, formatDateTime } from '@/lib/utils'
import { mockDataSources, mockIssues, mockTrendData, mockRules, cascadeChains, mockSchedules, mockNotifications } from '@/data/mockData'
import type { QualityDimension, ModuleType } from '@/types'

const MODULE_LABELS: Record<ModuleType, string> = {
  source: 'Bảng nguồn',
  report: 'Báo cáo',
  kpi: 'Chỉ tiêu',
}
const MODULE_COLORS: Record<ModuleType, string> = {
  source: 'bg-blue-50 text-blue-700 border-blue-200',
  report: 'bg-amber-50 text-amber-700 border-amber-200',
  kpi: 'bg-purple-50 text-purple-700 border-purple-200',
}

const dimensionRows: { key: QualityDimension; score: number }[] = [
  { key: 'completeness', score: 87 },
  { key: 'validity', score: 81 },
  { key: 'consistency', score: 73 },
  { key: 'uniqueness', score: 96 },
  { key: 'accuracy', score: 74 },
  { key: 'timeliness', score: 63 },
]

const TRENDS = ['↑', '↓']
function fakeTrend(id: string) {
  return TRENDS[id.charCodeAt(id.length - 1) % 2]
}

type TimeRange = 'today' | '7d' | '30d'

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
]

// A6: Top failed rules mock data
const topFailedRules = [
  { ruleName: 'NOT NULL — Mã KH', dimension: 'completeness' as QualityDimension, failCount: 47, tables: 12 },
  { ruleName: 'Format Regex — SĐT', dimension: 'validity' as QualityDimension, failCount: 38, tables: 8 },
  { ruleName: 'Referential Integrity — Mã CN', dimension: 'consistency' as QualityDimension, failCount: 31, tables: 6 },
  { ruleName: 'Freshness — Dữ liệu cũ', dimension: 'timeliness' as QualityDimension, failCount: 28, tables: 15 },
  { ruleName: 'Value Range — Số tiền', dimension: 'accuracy' as QualityDimension, failCount: 24, tables: 5 },
  { ruleName: 'Duplicate — CCCD', dimension: 'uniqueness' as QualityDimension, failCount: 19, tables: 4 },
  { ruleName: 'Fill Rate — Email', dimension: 'completeness' as QualityDimension, failCount: 16, tables: 7 },
  { ruleName: 'Row Count — Thiếu dòng', dimension: 'completeness' as QualityDimension, failCount: 12, tables: 3 },
]

const DIMENSION_BAR_COLORS: Record<QualityDimension, string> = {
  completeness: '#3b82f6',
  validity: '#10b981',
  consistency: '#f59e0b',
  uniqueness: '#8b5cf6',
  accuracy: '#ef4444',
  timeliness: '#06b6d4',
}

function getFilteredTrendData(timeRange: TimeRange) {
  if (timeRange === '30d') return mockTrendData
  if (timeRange === '7d') return mockTrendData.slice(-7)
  return mockTrendData.slice(-1)
}

export function Dashboard() {
  const [_tab] = useState('overview')
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const navigate = useNavigate()

  const moduleCounts = mockDataSources.reduce(
    (acc, ds) => { acc[ds.moduleType] = (acc[ds.moduleType] || 0) + 1; return acc },
    {} as Record<ModuleType, number>,
  )
  const activeRulesCount = mockRules.filter(r => r.status === 'active').length

  const worstSources = [...mockDataSources]
    .sort((a, b) => a.overallScore - b.overallScore)
    .slice(0, 8)

  const recentIssues = mockIssues.slice(0, 8)

  const filteredTrendData = getFilteredTrendData(timeRange)

  // B6: Onboarding checklist — tự tính tiến độ từ mock data
  const hasThresholdConfig = true // DefaultThresholds đã tồn tại
  const hasRegisteredTables = mockDataSources.length > 0
  const hasRules = mockRules.length > 0
  const hasSchedules = mockSchedules.length > 0
  const hasNotifications = mockNotifications.filter(n => n.isActive).length > 0
  const onboardingSteps = [
    { id: 1, label: 'Cấu hình ngưỡng mặc định', path: '/settings/default-thresholds', done: hasThresholdConfig, desc: 'Đặt ngưỡng Warning/Critical cho 6 chiều DQ' },
    { id: 2, label: 'Đăng ký bảng dữ liệu', path: '/data-catalog', done: hasRegisteredTables, desc: `Đã đăng ký ${mockDataSources.length} bảng` },
    { id: 3, label: 'Tạo quy tắc kiểm tra', path: '/rules', done: hasRules, desc: `Đã có ${mockRules.length} quy tắc` },
    { id: 4, label: 'Đặt lịch chạy DQ', path: '/schedules', done: hasSchedules, desc: `Đã có ${mockSchedules.length} lịch chạy` },
    { id: 5, label: 'Cấu hình thông báo', path: '/notifications', done: hasNotifications, desc: `${mockNotifications.filter(n => n.isActive).length} kênh đang hoạt động` },
  ]
  const completedSteps = onboardingSteps.filter(s => s.done).length
  const progressPct = Math.round((completedSteps / onboardingSteps.length) * 100)
  const [onboardingCollapsed, setOnboardingCollapsed] = useState(completedSteps === onboardingSteps.length)

  return (
    <div className="p-6 space-y-6">
      {/* Header with time range picker */}
      <div className="flex items-start justify-between">
        <PageHeader
          title="Tổng quan hệ thống"
          description="Giám sát chất lượng dữ liệu toàn hệ thống theo thời gian thực"
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          {TIME_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeRange(opt.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                timeRange === opt.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* B6: Onboarding checklist */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50/60 to-indigo-50/60">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  Lộ trình thiết lập DQ
                  <InfoTooltip text="5 bước cần hoàn tất để hệ thống DQ hoạt động đầy đủ: Cấu hình ngưỡng → Đăng ký bảng → Tạo quy tắc → Đặt lịch → Bật thông báo" wide />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Đã hoàn thành <span className="font-semibold text-blue-600">{completedSteps}/{onboardingSteps.length}</span> bước ({progressPct}%)
                </div>
              </div>
            </div>
            <button
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              onClick={() => setOnboardingCollapsed(c => !c)}
            >
              {onboardingCollapsed ? 'Xem chi tiết' : 'Thu gọn'}
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-white/70 overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {!onboardingCollapsed && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {onboardingSteps.map(step => (
                <button
                  key={step.id}
                  onClick={() => navigate(step.path)}
                  className={`text-left p-3 rounded-lg border transition-all hover:shadow-sm ${
                    step.done
                      ? 'border-green-200 bg-green-50/70 hover:bg-green-50'
                      : 'border-amber-200 bg-white hover:bg-amber-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {step.done ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-gray-700">Bước {step.id}</span>
                    <ChevronRight className="h-3 w-3 text-gray-400 ml-auto" />
                  </div>
                  <div className="text-xs font-medium text-gray-800 leading-tight">{step.label}</div>
                  <div className="text-[11px] text-gray-500 mt-1 leading-tight">{step.desc}</div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 1 - KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                  Tổng bảng dữ liệu
                  <InfoTooltip text="Số bảng đã đăng ký trên hệ thống DQ, phân loại theo Bảng nguồn / Báo cáo / KPI" />
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{mockDataSources.length}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs text-blue-700"><Database className="w-3 h-3" />{moduleCounts.source || 0} nguồn</span>
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700"><FileBarChart className="w-3 h-3" />{moduleCounts.report || 0} BC</span>
                  <span className="inline-flex items-center gap-1 text-xs text-purple-700"><Target className="w-3 h-3" />{moduleCounts.kpi || 0} KPI</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                  Điểm chất lượng TB
                  <InfoTooltip text="Trung bình điểm DQ của tất cả bảng đã quét. Công thức: TB(table scores). Mỗi table score = TB 6 chiều" />
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">78.4</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <span>↑</span>
                  <span>+1.2 so với hôm qua</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <BarChart2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                  Vấn đề đang mở
                  <InfoTooltip text="Số vấn đề DQ chưa được xử lý (trạng thái: Mới, Đang xử lý)" />
                </p>
                <p className="text-3xl font-bold text-red-600 mt-1">12</p>
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <span>↑</span>
                  <span>+3 vấn đề mới hôm nay</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                  Quy tắc đang hoạt động
                  <InfoTooltip text="Số quy tắc kiểm tra DQ đang được áp dụng" />
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{activeRulesCount}</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span>─</span>
                  <span>Không thay đổi</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 5 — Cascade chains */}
        {(() => {
          const activeCascades = cascadeChains.filter(c => c.status === 'active').length
          const hasActive = activeCascades > 0
          return (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                      Chuỗi cảnh báo
                      <InfoTooltip text="Số chuỗi ảnh hưởng liên bảng (cascade) đang hoạt động. Khi 1 bảng gặp lỗi, các bảng downstream bị ảnh hưởng sẽ được theo dõi." />
                    </p>
                    <p className={`text-3xl font-bold mt-1 ${hasActive ? 'text-red-600' : 'text-green-600'}`}>{activeCascades}</p>
                    <p className={`text-xs mt-2 flex items-center gap-1 ${hasActive ? 'text-red-500' : 'text-green-600'}`}>
                      <span>{hasActive ? '!' : '-'}</span>
                      <span>{hasActive ? 'đang xử lý' : 'Không có'}</span>
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${hasActive ? 'bg-red-100' : 'bg-green-100'}`}>
                    <Link2 className={`w-6 h-6 ${hasActive ? 'text-red-600' : 'text-green-600'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })()}
      </div>

      {/* Row 2 - 3 columns */}
      <div className="grid grid-cols-3 gap-4">
        {/* Column 1 - Overall score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Điểm tổng thể</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pb-6">
            <ScoreGauge score={78} />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Điểm chất lượng trung bình</p>
              <p className="text-xs text-gray-400 mt-0.5">Cập nhật: vừa xong</p>
              <p className="text-xs text-green-600 mt-1">↑ +1.2 so với hôm qua</p>
            </div>
          </CardContent>
        </Card>

        {/* Column 2 - Dimension scores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Điểm theo chiều dữ liệu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-6">
            {dimensionRows.map(({ key, score }) => {
              const cfg = DIMENSION_CONFIG[key]
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-28 flex-shrink-0">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${cfg.color} ${cfg.bg} ${cfg.border}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreBarColor(score)}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className={`text-sm font-semibold w-8 text-right ${getScoreColor(score)}`}>
                    {score}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Column 3 - Trend chart (filtered by timeRange) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Xu hướng {timeRange === 'today' ? 'hôm nay' : timeRange === '7d' ? '7 ngày' : '30 ngày'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={filteredTrendData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval={timeRange === '30d' ? 6 : 0}
                  tickLine={false}
                />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  formatter={(value: number) => [value, 'Điểm']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#scoreGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 - Worst tables (A5: clickable table names) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bảng dữ liệu cần chú ý</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên bảng</TableHead>
                <TableHead className="text-center">Loại</TableHead>
                <TableHead className="text-center">Điểm tổng</TableHead>
                <TableHead className="text-center">Đầy đủ</TableHead>
                <TableHead className="text-center">Hợp lệ</TableHead>
                <TableHead className="text-center">Nhất quán</TableHead>
                <TableHead className="text-center">Duy nhất</TableHead>
                <TableHead className="text-center">Chính xác</TableHead>
                <TableHead className="text-center">Kịp thời</TableHead>
                <TableHead className="text-center">Xu hướng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {worstSources.map((ds) => {
                const trend = fakeTrend(ds.id)
                return (
                  <TableRow key={ds.id}>
                    <TableCell
                      className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 hover:underline"
                      onClick={() => navigate(`/data-catalog/${ds.id}`)}
                    >
                      {ds.name}
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600">
                      {MODULE_LABELS[ds.moduleType]}
                    </TableCell>
                    <TableCell className={`text-center font-semibold ${getScoreColor(ds.overallScore)}`}>
                      {ds.overallScore}
                    </TableCell>
                    <TableCell className={`text-center ${getScoreColor(ds.dimensionScores.completeness)}`}>
                      {ds.dimensionScores.completeness}
                    </TableCell>
                    <TableCell className={`text-center ${getScoreColor(ds.dimensionScores.validity)}`}>
                      {ds.dimensionScores.validity}
                    </TableCell>
                    <TableCell className={`text-center ${getScoreColor(ds.dimensionScores.consistency)}`}>
                      {ds.dimensionScores.consistency}
                    </TableCell>
                    <TableCell className={`text-center ${getScoreColor(ds.dimensionScores.uniqueness)}`}>
                      {ds.dimensionScores.uniqueness}
                    </TableCell>
                    <TableCell className={`text-center ${getScoreColor(ds.dimensionScores.accuracy)}`}>
                      {ds.dimensionScores.accuracy}
                    </TableCell>
                    <TableCell className={`text-center ${getScoreColor(ds.dimensionScores.timeliness)}`}>
                      {ds.dimensionScores.timeliness}
                    </TableCell>
                    <TableCell className="text-center">
                      {trend === '↑' ? (
                        <span className="text-green-600 font-bold">↑</span>
                      ) : (
                        <span className="text-red-500 font-bold">↓</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Row 4 - A6: Top quy tắc vi phạm */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              Top quy tắc vi phạm
              <InfoTooltip text="Danh sách 8 quy tắc DQ bị vi phạm nhiều nhất trong khoảng thời gian đã chọn. Giúp phát hiện pattern lỗi phổ biến để ưu tiên xử lý" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead>Tên quy tắc</TableHead>
                  <TableHead>Chiều DL</TableHead>
                  <TableHead className="text-center">Số lần vi phạm</TableHead>
                  <TableHead className="text-center">Số bảng ảnh hưởng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topFailedRules.map((rule, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-center text-gray-500">{idx + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{rule.ruleName}</TableCell>
                    <TableCell>
                      <DimensionBadge dimension={rule.dimension} />
                    </TableCell>
                    <TableCell className="text-center font-semibold text-red-600">{rule.failCount}</TableCell>
                    <TableCell className="text-center text-gray-600">{rule.tables}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right: Horizontal bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Biểu đồ vi phạm theo quy tắc</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                layout="vertical"
                data={topFailedRules}
                margin={{ top: 5, right: 30, bottom: 5, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="ruleName"
                  tick={{ fontSize: 10 }}
                  width={180}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  formatter={(value: number) => [value, 'Lần vi phạm']}
                />
                <Bar dataKey="failCount" radius={[0, 4, 4, 0]} barSize={24}>
                  {topFailedRules.map((entry, idx) => (
                    <Cell key={idx} fill={DIMENSION_BAR_COLORS[entry.dimension]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 5 - Recent issues (A5: clickable issue titles) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Vấn đề gần đây</CardTitle>
          <button
            onClick={() => navigate('/issues')}
            className="text-sm text-blue-600 hover:underline"
          >
            Xem tất cả →
          </button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Mức độ</TableHead>
                <TableHead>Bảng dữ liệu</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Chiều dữ liệu</TableHead>
                <TableHead>Phát hiện</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentIssues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell
                    className="font-medium max-w-xs truncate cursor-pointer hover:text-blue-600 hover:underline"
                    title={issue.title}
                    onClick={() => navigate(`/issues/${issue.id}`)}
                  >
                    {issue.title}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={issue.severity} />
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">{issue.tableName}</TableCell>
                  <TableCell>
                    {(() => {
                      const ds = mockDataSources.find(d => d.name === issue.tableName)
                      if (!ds) return null
                      return (
                        <span className="text-sm text-gray-600">
                          {MODULE_LABELS[ds.moduleType]}
                        </span>
                      )
                    })()}
                  </TableCell>
                  <TableCell>
                    <DimensionBadge dimension={issue.dimension} />
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                    {formatDateTime(issue.detectedAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={issue.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
