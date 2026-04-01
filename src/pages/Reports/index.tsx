import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis,
} from 'recharts'
import { Download, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/common/PageHeader'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { getScoreColor, getGrade } from '@/lib/utils'
import { mockDataSources, mockTrendData } from '@/data/mockData'
import { cn } from '@/lib/utils'

const radarData = [
  { dimension: 'Đầy đủ', score: 87 },
  { dimension: 'Hợp lệ', score: 81 },
  { dimension: 'Nhất quán', score: 73 },
  { dimension: 'Duy nhất', score: 96 },
  { dimension: 'Chính xác', score: 74 },
  { dimension: 'Kịp thời', score: 63 },
]

const DIMENSION_LABELS = [
  { value: 'all', label: 'Tất cả chiều dữ liệu' },
  { value: 'completeness', label: 'Đầy đủ' },
  { value: 'validity', label: 'Hợp lệ' },
  { value: 'consistency', label: 'Nhất quán' },
  { value: 'uniqueness', label: 'Duy nhất' },
  { value: 'accuracy', label: 'Chính xác' },
  { value: 'timeliness', label: 'Kịp thời' },
]

function fakeTrendUp(id: string) {
  return id.charCodeAt(id.length - 1) % 2 === 0
}

export function Reports() {
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const [fromDate, setFromDate] = useState(thirtyDaysAgo)
  const [toDate, setToDate] = useState(today)
  const [selectedTable, setSelectedTable] = useState('all')
  const [selectedDimension, setSelectedDimension] = useState('all')

  function handleApply() {
    // Filter logic can be wired here
  }

  function handleExport() {
    alert('Tính năng tải báo cáo Excel sẽ được triển khai.')
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Báo cáo chất lượng dữ liệu"
        description="Phân tích và xuất báo cáo chất lượng dữ liệu theo kỳ"
      />

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Từ ngày</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-40 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Đến ngày</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-40 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Bảng dữ liệu</label>
              <Select
                value={selectedTable}
                onChange={e => setSelectedTable(e.target.value)}
                className="w-48 text-sm"
              >
                <option value="all">Tất cả bảng dữ liệu</option>
                {mockDataSources.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Chiều dữ liệu</label>
              <Select
                value={selectedDimension}
                onChange={e => setSelectedDimension(e.target.value)}
                className="w-48 text-sm"
              >
                {DIMENSION_LABELS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={handleApply} className="self-end">
              Áp dụng
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 pb-5">
            <p className="text-sm text-gray-500 font-medium">Điểm chất lượng TB</p>
            <p className="text-3xl font-bold text-green-600 mt-1">78.4</p>
            <p className="text-xs text-gray-400 mt-1">/ 100 điểm</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <p className="text-sm text-gray-500 font-medium">Bảng đạt chuẩn (≥80)</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">8</p>
            <p className="text-xs text-gray-400 mt-1">/ 15 bảng dữ liệu</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <p className="text-sm text-gray-500 font-medium">Vấn đề phát sinh (30 ngày)</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">23</p>
            <p className="text-xs text-gray-400 mt-1">vấn đề được ghi nhận</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <p className="text-sm text-gray-500 font-medium">Vấn đề đã giải quyết</p>
            <p className="text-3xl font-bold text-green-600 mt-1">11</p>
            <p className="text-xs text-gray-400 mt-1">trong 30 ngày qua</p>
          </CardContent>
        </Card>
      </div>

      {/* 2 charts */}
      <div className="grid grid-cols-3 gap-4">
        {/* Area chart - 2/3 width */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Xu hướng chất lượng 30 ngày</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={mockTrendData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="reportScoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval={5}
                  tickLine={false}
                />
                <YAxis
                  domain={[60, 100]}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  formatter={(value: number) => [value, 'Điểm']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#reportScoreGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar chart - 1/3 width */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Điểm theo chiều dữ liệu</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <Radar
                  name="Điểm"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  formatter={(value: number) => [value, 'Điểm']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Results table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Chi tiết theo bảng dữ liệu</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Tải báo cáo Excel
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên bảng</TableHead>
                <TableHead className="text-center">Xu hướng 7d</TableHead>
                <TableHead className="text-center">Đầy đủ%</TableHead>
                <TableHead className="text-center">Hợp lệ%</TableHead>
                <TableHead className="text-center">Nhất quán%</TableHead>
                <TableHead className="text-center">Duy nhất%</TableHead>
                <TableHead className="text-center">Chính xác%</TableHead>
                <TableHead className="text-center">Kịp thời%</TableHead>
                <TableHead className="text-center">Vấn đề</TableHead>
                <TableHead className="text-center">Xếp hạng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDataSources.map((ds) => {
                const isUp = fakeTrendUp(ds.id)
                const { grade, color } = getGrade(ds.overallScore)
                const issueCount = ds.overallScore < 70 ? 3 : ds.overallScore < 80 ? 2 : ds.overallScore < 90 ? 1 : 0

                return (
                  <TableRow key={ds.id}>
                    <TableCell className="font-medium text-gray-900">{ds.name}</TableCell>
                    <TableCell className="text-center">
                      {isUp ? (
                        <span className="inline-flex items-center justify-center gap-1 text-green-600 text-sm font-semibold">
                          <TrendingUp className="w-3.5 h-3.5" />↑
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-red-500 text-sm font-semibold">
                          <TrendingDown className="w-3.5 h-3.5" />↓
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={`text-center text-sm font-medium ${getScoreColor(ds.dimensionScores.completeness)}`}>
                      {ds.dimensionScores.completeness}%
                    </TableCell>
                    <TableCell className={`text-center text-sm font-medium ${getScoreColor(ds.dimensionScores.validity)}`}>
                      {ds.dimensionScores.validity}%
                    </TableCell>
                    <TableCell className={`text-center text-sm font-medium ${getScoreColor(ds.dimensionScores.consistency)}`}>
                      {ds.dimensionScores.consistency}%
                    </TableCell>
                    <TableCell className={`text-center text-sm font-medium ${getScoreColor(ds.dimensionScores.uniqueness)}`}>
                      {ds.dimensionScores.uniqueness}%
                    </TableCell>
                    <TableCell className={`text-center text-sm font-medium ${getScoreColor(ds.dimensionScores.accuracy)}`}>
                      {ds.dimensionScores.accuracy}%
                    </TableCell>
                    <TableCell className={`text-center text-sm font-medium ${getScoreColor(ds.dimensionScores.timeliness)}`}>
                      {ds.dimensionScores.timeliness}%
                    </TableCell>
                    <TableCell className="text-center">
                      {issueCount > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                          {issueCount}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn('inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold', color)}>
                        {grade}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
