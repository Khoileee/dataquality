import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts'
import {
  Database, BarChart2, AlertTriangle, CheckCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/common/PageHeader'
import { ScoreGauge } from '@/components/common/ScoreGauge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DimensionBadge, DIMENSION_CONFIG } from '@/components/common/DimensionBadge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { getScoreColor, getScoreBarColor, formatDateTime } from '@/lib/utils'
import { mockDataSources, mockIssues, mockTrendData } from '@/data/mockData'
import type { QualityDimension } from '@/types'

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

export function Dashboard() {
  const [_tab] = useState('overview')

  const worstSources = [...mockDataSources]
    .sort((a, b) => a.overallScore - b.overallScore)
    .slice(0, 8)

  const recentIssues = mockIssues.slice(0, 8)

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Tổng quan hệ thống"
        description="Giám sát chất lượng dữ liệu toàn hệ thống theo thời gian thực"
      />

      {/* Row 1 - KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Card 1 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Tổng bảng dữ liệu</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">15</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <span>↑</span>
                  <span>+2 so với tháng trước</span>
                </p>
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
                <p className="text-sm text-gray-500 font-medium">Điểm chất lượng TB</p>
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
                <p className="text-sm text-gray-500 font-medium">Vấn đề đang mở</p>
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
                <p className="text-sm text-gray-500 font-medium">Quy tắc đang hoạt động</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">20</p>
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

        {/* Column 3 - 30-day trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Xu hướng 30 ngày</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={mockTrendData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
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
                  interval={6}
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

      {/* Row 3 - Worst tables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bảng dữ liệu cần chú ý</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên bảng</TableHead>
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
                    <TableCell className="font-medium text-gray-900">{ds.name}</TableCell>
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

      {/* Row 4 - Recent issues */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Vấn đề gần đây</CardTitle>
          <a href="/issues" className="text-sm text-blue-600 hover:underline">
            Xem tất cả →
          </a>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Mức độ</TableHead>
                <TableHead>Bảng dữ liệu</TableHead>
                <TableHead>Chiều DL</TableHead>
                <TableHead>Phát hiện</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentIssues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="font-medium max-w-xs truncate" title={issue.title}>
                    {issue.title}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={issue.severity} />
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">{issue.tableName}</TableCell>
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
