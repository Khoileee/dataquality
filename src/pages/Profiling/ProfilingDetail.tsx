import { useParams, Link } from 'react-router-dom'
import {
  Download, Database, Star, Clock, BarChart2, Info,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { PageHeader } from '@/components/common/PageHeader'
import { getDimensionColor, getDimensionLabel, DIMENSION_CONFIG } from '@/components/common/DimensionBadge'
import { getScoreColor, getScoreBarColor, formatDateTime } from '@/lib/utils'
import { mockProfilingResults } from '@/data/mockData'
import type { QualityDimension } from '@/types'

const DIMENSIONS: QualityDimension[] = [
  'completeness', 'validity', 'consistency', 'uniqueness', 'accuracy', 'timeliness',
]

// Lucide doesn't have a "Columns" icon so we use a custom inline SVG substitute
function ColumnsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="18" rx="1" />
      <rect x="14" y="3" width="7" height="18" rx="1" />
    </svg>
  )
}

export function ProfilingDetail() {
  const { id } = useParams<{ id: string }>()
  const result = mockProfilingResults.find(r => r.id === id)

  if (!result) {
    return (
      <div className="p-6">
        <div className="text-center py-24 text-gray-400">
          <BarChart2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Không tìm thấy kết quả phân tích</p>
          <p className="text-sm mt-1">ID: {id}</p>
          <Link to="/profiling" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    )
  }

  const dimensionChartData = DIMENSIONS.map(dim => ({
    name: getDimensionLabel(dim),
    score: result.dimensionScores[dim],
    color: getDimensionColor(dim),
    dim,
  }))

  const handleExportCSV = () => {
    const header = ['Cột', 'Kiểu dữ liệu', 'Null%', 'Phân biệt%', 'Min', 'Max', 'Vấn đề']
    const rows = result.columnProfiles.map(col => [
      col.columnName, col.dataType,
      col.nullRate.toFixed(1), col.distinctRate.toFixed(1),
      col.minValue ?? '', col.maxValue ?? '',
      col.issues.join('; '),
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `profiling_${result.tableName}_${result.runAt.slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Phân tích: ${result.tableName}`}
        description={`Kết quả phân tích lúc ${formatDateTime(result.runAt)}`}
        breadcrumbs={[
          { label: 'Phân tích dữ liệu', href: '/profiling' },
          { label: result.tableName },
        ]}
        actions={
          <Button variant="outline" className="flex items-center gap-2" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            Tải báo cáo
          </Button>
        }
      />

      {/* Snapshot banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
        <span>
          <strong>Snapshot lần quét {formatDateTime(result.runAt)}</strong> — Điểm ở đây tính từ thống kê cột (null rate, format…),
          khác với điểm tổng hợp từ Rules ở Danh mục dữ liệu.
        </span>
      </div>

      {/* 4 summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Tổng số dòng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {result.totalRows > 0 ? result.totalRows.toLocaleString('vi-VN') : '—'}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Tổng số cột</p>
                <p className="text-2xl font-bold text-gray-900">
                  {result.totalColumns > 0 ? result.totalColumns : '—'}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
                <ColumnsIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Điểm chất lượng</p>
                <p className={`text-2xl font-bold ${result.overallScore > 0 ? getScoreColor(result.overallScore) : 'text-gray-400'}`}>
                  {result.overallScore > 0 ? result.overallScore : '—'}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Thời lượng</p>
                <p className="text-2xl font-bold text-gray-900">{result.durationSeconds}s</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dimension scores bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Điểm phân tích cột theo chiều dữ liệu</CardTitle>
        </CardHeader>
        <CardContent>
          {result.overallScore === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Không có dữ liệu điểm cho lần chạy này
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={dimensionChartData}
                layout="vertical"
                margin={{ top: 4, right: 40, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fontSize: 12, fill: '#374151' }}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  formatter={(v: number) => [`${v} / 100`, 'Điểm']}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {dimensionChartData.map((entry) => (
                    <Cell key={entry.dim} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Column profiles table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Chi tiết phân tích cột</CardTitle>
            {result.columnProfiles.length > 0 && (
              <Badge variant="secondary">{result.columnProfiles.length} cột</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {result.columnProfiles.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BarChart2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Không có dữ liệu phân tích cột</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên cột</TableHead>
                    <TableHead>Kiểu dữ liệu</TableHead>
                    <TableHead>Null%</TableHead>
                    <TableHead>Phân biệt%</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead>Max</TableHead>
                    <TableHead>Mẫu dữ liệu</TableHead>
                    <TableHead>Vấn đề</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.columnProfiles.map(col => (
                    <TableRow key={col.columnName} className="hover:bg-gray-50">
                      <TableCell>
                        <span className="font-mono text-sm font-semibold text-gray-800">
                          {col.columnName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-mono">
                          {col.dataType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-20">
                          <div className="flex items-center justify-between mb-0.5">
                            <span
                              className={`text-xs font-medium ${
                                col.nullRate < 1
                                  ? 'text-green-600'
                                  : col.nullRate <= 5
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {col.nullRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                col.nullRate < 1
                                  ? 'bg-green-400'
                                  : col.nullRate <= 5
                                  ? 'bg-amber-400'
                                  : 'bg-red-400'
                              }`}
                              style={{ width: `${Math.min(col.nullRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {col.distinctRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[90px] truncate">
                        {col.minValue ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[90px] truncate">
                        {col.maxValue ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {col.sampleValues.slice(0, 3).map((v, i) => (
                            <span
                              key={i}
                              className="inline-block rounded bg-gray-100 border border-gray-200 px-1.5 py-0.5 text-xs text-gray-600 max-w-[80px] truncate"
                              title={v}
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 max-w-[200px]">
                          {col.issues.length === 0 ? (
                            <span className="text-xs text-green-600">Không có vấn đề</span>
                          ) : col.issues.map((issue, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded bg-red-50 border border-red-200 px-1.5 py-0.5 text-xs text-red-700 leading-snug"
                            >
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
