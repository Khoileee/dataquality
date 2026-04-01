import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Play, Eye, RefreshCw, BarChart2, CheckCircle, XCircle, Loader,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageHeader } from '@/components/common/PageHeader'
import { getScoreColor, formatDateTime } from '@/lib/utils'
import { mockDataSources, mockProfilingResults } from '@/data/mockData'
import type { ProfilingResult } from '@/types'

export function Profiling() {
  const navigate = useNavigate()

  const [results, setResults] = useState<ProfilingResult[]>([...mockProfilingResults])
  const [runningIds, setRunningIds] = useState<Record<string, boolean>>({})
  const [filterTable, setFilterTable] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const [activeTable, setActiveTable] = useState('')
  const [activeStatus, setActiveStatus] = useState('')
  const [activeFrom, setActiveFrom] = useState('')
  const [activeTo, setActiveTo] = useState('')

  function handleSearch() {
    setActiveTable(filterTable)
    setActiveStatus(filterStatus)
    setActiveFrom(filterFrom)
    setActiveTo(filterTo)
  }

  function handleReset() {
    setFilterTable('')
    setFilterStatus('')
    setFilterFrom('')
    setFilterTo('')
    setActiveTable('')
    setActiveStatus('')
    setActiveFrom('')
    setActiveTo('')
  }

  const handleRerun = (result: ProfilingResult) => {
    const newId = `prof-rerun-${Date.now()}`
    const runningEntry: ProfilingResult = {
      ...result,
      id: newId,
      runAt: new Date().toISOString(),
      status: 'running',
      totalRows: 0,
      overallScore: 0,
      durationSeconds: 0,
      columnProfiles: [],
    }
    setResults(prev => [runningEntry, ...prev])
    setRunningIds(prev => ({ ...prev, [newId]: true }))
    setTimeout(() => {
      const score = 70 + Math.floor(Math.random() * 28)
      setResults(prev => prev.map(r => r.id === newId ? {
        ...r,
        status: 'completed',
        totalRows: result.totalRows,
        overallScore: score,
        durationSeconds: Math.floor(Math.random() * 60) + 10,
        columnProfiles: result.columnProfiles,
      } : r))
      setRunningIds(prev => ({ ...prev, [newId]: false }))
    }, 2000)
  }

  const filtered = results.filter(r => {
    if (activeTable && r.tableId !== activeTable) return false
    if (activeStatus && r.status !== activeStatus) return false
    if (activeFrom) {
      const runDate = new Date(r.runAt)
      const fromDate = new Date(activeFrom)
      if (runDate < fromDate) return false
    }
    if (activeTo) {
      const runDate = new Date(r.runAt)
      const toDate = new Date(activeTo)
      toDate.setHours(23, 59, 59)
      if (runDate > toDate) return false
    }
    return true
  })

  function StatusIcon({ status }: { status: string }) {
    if (status === 'running') {
      return <Loader className="h-4 w-4 text-blue-500 animate-spin" />
    }
    if (status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Phân tích dữ liệu (Profiling)"
        description="Lịch sử các lần quét thống kê cột dữ liệu · Mỗi hàng = 1 snapshot tại thời điểm quét, độc lập với điểm tổng hợp từ Rules"
        breadcrumbs={[{ label: 'Phân tích dữ liệu' }]}
        actions={
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Play className="h-4 w-4" />
            Chạy phân tích mới
          </Button>
        }
      />

      {/* Filter */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Tên bảng</Label>
              <Select value={filterTable} onChange={e => setFilterTable(e.target.value)}>
                <option value="">Tất cả</option>
                {mockDataSources.map(ds => (
                  <option key={ds.id} value={ds.id}>{ds.name}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Trạng thái</Label>
              <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="running">Đang chạy</option>
                <option value="completed">Hoàn thành</option>
                <option value="failed">Thất bại</option>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Từ ngày</Label>
              <Input
                type="date"
                value={filterFrom}
                onChange={e => setFilterFrom(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Đến ngày</Label>
              <Input
                type="date"
                value={filterTo}
                onChange={e => setFilterTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-1">
              <Search className="h-4 w-4" />
              Tìm kiếm
            </Button>
            <Button variant="outline" onClick={handleReset} className="text-sm">
              Bỏ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lịch sử phân tích</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <BarChart2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Không có kết quả phân tích</p>
              <p className="text-sm mt-1">Điều chỉnh bộ lọc hoặc chạy phân tích mới</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên bảng</TableHead>
                    <TableHead>Thời gian chạy</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Tổng dòng</TableHead>
                    <TableHead>Tổng cột</TableHead>
                    <TableHead title="Tính từ tỷ lệ cột có vấn đề trong lần quét này (null rate, format…)">Điểm chất lượng ℹ</TableHead>
                    <TableHead title="Thời gian thực hiện quét (giây)">Thời lượng ℹ</TableHead>
                    <TableHead className="w-20">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(result => (
                    <TableRow key={result.id} className="hover:bg-gray-50">
                      <TableCell>
                        <span className="font-semibold text-gray-800">{result.tableName}</span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                        {formatDateTime(result.runAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <StatusIcon status={result.status} />
                          <StatusBadge status={result.status} />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {result.totalRows > 0 ? result.totalRows.toLocaleString('vi-VN') : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {result.totalColumns > 0 ? result.totalColumns : '—'}
                      </TableCell>
                      <TableCell>
                        {result.overallScore > 0 ? (
                          <span className={`text-base font-bold ${getScoreColor(result.overallScore)}`}>
                            {result.overallScore}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {result.durationSeconds}s
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/profiling/${result.id}`)}
                            className="p-1 rounded hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => !runningIds[result.id] && result.status !== 'running' && handleRerun(result)}
                            disabled={runningIds[result.id] || result.status === 'running'}
                            className="p-1 rounded hover:bg-green-50 hover:text-green-600 text-gray-400 transition-colors disabled:opacity-40"
                            title="Chạy lại"
                          >
                            <RefreshCw className={`h-4 w-4 ${runningIds[result.id] ? 'animate-spin' : ''}`} />
                          </button>
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
