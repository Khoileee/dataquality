import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X, Database, Play, Edit, Trash2, ChevronLeft, ChevronRight, AlertTriangle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageHeader } from '@/components/common/PageHeader'
import { formatDateTime } from '@/lib/utils'
import { mockSchedules, mockDataSources } from '@/data/mockData'
import type { Schedule, ScheduleFrequency } from '@/types'

const PAGE_SIZE = 10
const DAYS_OF_WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

const FREQ_LABELS: Record<string, string> = {
  realtime: 'Thực thời', hourly: 'Hàng giờ', daily: 'Hàng ngày',
  weekly: 'Hàng tuần', monthly: 'Hàng tháng', custom: 'Tùy chỉnh',
}

// ─── Schedule Dialog (Add / Edit) ────────────────────────────────────────────

interface ScheduleForm {
  name: string
  tableId: string
  frequency: ScheduleFrequency | ''
  cronExpression: string
  runTime: string
  daysOfWeek: boolean[]
  isActive: boolean
}

const EMPTY_FORM: ScheduleForm = {
  name: '', tableId: '', frequency: '', cronExpression: '',
  runTime: '06:00', daysOfWeek: new Array(7).fill(false), isActive: true,
}

function scheduleToForm(s: Schedule): ScheduleForm {
  // daysOfWeek in type: 0=Sun..6=Sat; UI buttons: 0=Mon(1)..5=Sat(6)..6=Sun(0)
  const dow = new Array(7).fill(false)
  ;(s.daysOfWeek ?? []).forEach(d => {
    // map day number (0=Sun) to UI index (0=Mon..6=Sun)
    const uiIdx = d === 0 ? 6 : d - 1
    dow[uiIdx] = true
  })
  return {
    name: s.name, tableId: s.tableId, frequency: s.frequency,
    cronExpression: s.cronExpression ?? '',
    runTime: s.runTime ?? '06:00',
    daysOfWeek: dow,
    isActive: s.status === 'active',
  }
}

function calcNextRun(frequency: ScheduleFrequency | '', runTime: string, daysOfWeek: boolean[]): string {
  const now = new Date()
  if (!frequency || frequency === 'realtime') return now.toISOString()
  if (frequency === 'hourly') {
    const next = new Date(now)
    next.setMinutes(0, 0, 0)
    next.setHours(next.getHours() + 1)
    return next.toISOString()
  }
  const [hh, mm] = runTime.split(':').map(Number)
  if (frequency === 'daily') {
    const next = new Date(now)
    next.setHours(hh, mm, 0, 0)
    if (next <= now) next.setDate(next.getDate() + 1)
    return next.toISOString()
  }
  if (frequency === 'weekly') {
    // find selected days (UI: 0=Mon, 6=Sun → actual: Mon=1..Sun=0)
    const selectedActual = daysOfWeek
      .map((on, i) => on ? (i === 6 ? 0 : i + 1) : -1)
      .filter(d => d >= 0)
    if (selectedActual.length === 0) {
      // default: same day next week
      const next = new Date(now)
      next.setDate(next.getDate() + 7)
      next.setHours(hh, mm, 0, 0)
      return next.toISOString()
    }
    const todayDow = now.getDay()
    let minDiff = 8
    for (const d of selectedActual) {
      let diff = d - todayDow
      if (diff < 0 || (diff === 0 && (now.getHours() > hh || (now.getHours() === hh && now.getMinutes() >= mm)))) diff += 7
      if (diff < minDiff) minDiff = diff
    }
    const next = new Date(now)
    next.setDate(next.getDate() + minDiff)
    next.setHours(hh, mm, 0, 0)
    return next.toISOString()
  }
  // monthly / custom: +1 day as fallback
  const next = new Date(now)
  next.setDate(next.getDate() + 1)
  return next.toISOString()
}

interface ScheduleDialogProps {
  open: boolean
  editSchedule?: Schedule | null
  onClose: () => void
  onSave: (s: Schedule) => void
}

function ScheduleDialog({ open, editSchedule, onClose, onSave }: ScheduleDialogProps) {
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM)

  useEffect(() => {
    if (open) setForm(editSchedule ? scheduleToForm(editSchedule) : EMPTY_FORM)
  }, [open, editSchedule])

  const set = (field: keyof ScheduleForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const toggleDay = (idx: number) =>
    setForm(prev => { const d = [...prev.daysOfWeek]; d[idx] = !d[idx]; return { ...prev, daysOfWeek: d } })

  const showCron = form.frequency === 'custom'
  const showTime = form.frequency === 'daily' || form.frequency === 'weekly'
  const showDays = form.frequency === 'weekly'

  const handleSave = () => {
    const ds = mockDataSources.find(d => d.id === form.tableId)
    const nextRun = form.isActive ? calcNextRun(form.frequency, form.runTime, form.daysOfWeek) : ''
    // convert UI daysOfWeek (0=Mon..6=Sun) back to actual numbers (Mon=1..Sun=0)
    const daysOfWeekActual = form.daysOfWeek
      .map((on, i) => on ? (i === 6 ? 0 : i + 1) : -1)
      .filter(d => d >= 0)
    const saved: Schedule = {
      id: editSchedule?.id ?? `sch-${Date.now()}`,
      name: form.name.trim(),
      tableId: form.tableId,
      tableName: ds?.tableName ?? form.tableId,
      frequency: form.frequency as ScheduleFrequency,
      cronExpression: form.cronExpression || undefined,
      runTime: (form.frequency === 'daily' || form.frequency === 'weekly') ? form.runTime : undefined,
      daysOfWeek: form.frequency === 'weekly' ? daysOfWeekActual : [],
      status: form.isActive ? 'active' : 'inactive',
      nextRun,
      lastRun: editSchedule?.lastRun,
      lastRunStatus: editSchedule?.lastRunStatus,
      rulesCount: editSchedule?.rulesCount ?? 0,
      owner: editSchedule?.owner ?? 'Người dùng hiện tại',
    }
    onSave(saved)
    onClose()
  }

  const isValid = !!form.name.trim() && !!form.tableId && !!form.frequency

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editSchedule ? 'Chỉnh sửa lịch chạy' : 'Thêm lịch chạy mới'}
      size="lg"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Tên lịch chạy <span className="text-red-500">*</span></Label>
          <Input value={form.name} onChange={set('name')} placeholder="VD: KH_KHACHHANG - Hàng ngày" />
        </div>

        <div className="space-y-1.5">
          <Label>Bảng dữ liệu <span className="text-red-500">*</span></Label>
          <Select value={form.tableId} onChange={set('tableId')}>
            <option value="">-- Chọn bảng dữ liệu --</option>
            {mockDataSources.map(ds => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Tần suất <span className="text-red-500">*</span></Label>
          <Select value={form.frequency} onChange={set('frequency')}>
            <option value="">-- Chọn tần suất --</option>
            <option value="realtime">Thực thời (realtime)</option>
            <option value="hourly">Hàng giờ</option>
            <option value="daily">Hàng ngày</option>
            <option value="weekly">Hàng tuần</option>
            <option value="monthly">Hàng tháng</option>
            <option value="custom">Tùy chỉnh (Cron)</option>
          </Select>
        </div>

        {showCron && (
          <div className="space-y-1.5">
            <Label>Cron expression</Label>
            <Input value={form.cronExpression} onChange={set('cronExpression')} placeholder="0 6 * * *" className="font-mono text-sm" />
            <p className="text-xs text-gray-500">Định dạng: phút giờ ngày tháng thứ — VD: <code className="bg-gray-100 px-1 rounded">0 6 * * *</code></p>
          </div>
        )}

        {showTime && (
          <div className="space-y-1.5">
            <Label>Giờ chạy</Label>
            <Input type="time" value={form.runTime} onChange={set('runTime')} className="w-36" />
          </div>
        )}

        {showDays && (
          <div className="space-y-1.5">
            <Label>Ngày trong tuần</Label>
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map((day, idx) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`w-10 h-10 rounded-full text-xs font-medium border-2 transition-colors ${
                    form.daysOfWeek[idx]
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Label className="cursor-pointer">Kích hoạt ngay</Label>
          <Switch checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onClose}>Hủy</Button>
        <Button onClick={handleSave} disabled={!isValid}>
          {editSchedule ? 'Cập nhật' : 'Lưu lịch chạy'}
        </Button>
      </div>
    </Dialog>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ schedule, onConfirm, onCancel }: { schedule: Schedule | null; onConfirm: () => void; onCancel: () => void }) {
  if (!schedule) return null
  return (
    <Dialog open={!!schedule} onClose={onCancel} title="Xác nhận xóa" size="sm">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <p className="text-sm text-gray-700">Bạn có chắc muốn xóa lịch chạy:</p>
          <p className="font-semibold text-gray-900 mt-0.5">{schedule.name}</p>
          <p className="text-xs text-gray-500 mt-1">Hành động này không thể hoàn tác.</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onCancel}>Hủy</Button>
        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onConfirm}>Xóa</Button>
      </div>
    </Dialog>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Schedules() {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState<Schedule[]>([...mockSchedules])
  const [tableFilter, setTableFilter] = useState('all')
  const [freqFilter, setFreqFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [appliedFilter, setAppliedFilter] = useState<{ table: string; freq: string; status: string } | null>(null)
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null)
  const [deleteSchedule, setDeleteSchedule] = useState<Schedule | null>(null)
  const [runningIds, setRunningIds] = useState<Record<string, boolean>>({})

  const handleSearch = () => { setAppliedFilter({ table: tableFilter, freq: freqFilter, status: statusFilter }); setPage(1) }
  const handleClear = () => { setTableFilter('all'); setFreqFilter('all'); setStatusFilter('all'); setAppliedFilter(null); setPage(1) }

  const filtered = schedules.filter(s => {
    const f = appliedFilter ?? { table: 'all', freq: 'all', status: 'all' }
    if (f.table !== 'all' && s.tableId !== f.table) return false
    if (f.freq !== 'all' && s.frequency !== f.freq) return false
    if (f.status !== 'all') {
      if (f.status === 'active' && s.status !== 'active') return false
      if (f.status === 'inactive' && s.status === 'active') return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSave = (s: Schedule) => {
    setSchedules(prev => {
      const idx = prev.findIndex(x => x.id === s.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = s; return next }
      return [s, ...prev]
    })
  }

  const handleDelete = () => {
    if (!deleteSchedule) return
    setSchedules(prev => prev.filter(s => s.id !== deleteSchedule.id))
    setDeleteSchedule(null)
  }

  const handleRunNow = (id: string) => {
    setRunningIds(prev => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setRunningIds(prev => ({ ...prev, [id]: false }))
      setSchedules(prev => prev.map(s => s.id === id
        ? { ...s, lastRun: new Date().toISOString(), lastRunStatus: 'success' as const }
        : s
      ))
    }, 2000)
  }

  return (
    <div>
      <PageHeader
        title="Quản lý lịch chạy kiểm tra"
        description="Cấu hình và giám sát lịch chạy kiểm tra chất lượng dữ liệu tự động"
        breadcrumbs={[{ label: 'Lịch chạy' }]}
      />

      {/* Filter card */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={tableFilter} onChange={e => setTableFilter(e.target.value)}>
              <option value="all">Bảng dữ liệu: Tất cả</option>
              {mockDataSources.map(ds => (
                <option key={ds.id} value={ds.id}>{ds.name}</option>
              ))}
            </Select>
            <Select value={freqFilter} onChange={e => setFreqFilter(e.target.value)}>
              <option value="all">Tần suất: Tất cả</option>
              {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">Trạng thái: Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </Select>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSearch}><Search className="h-3.5 w-3.5 mr-1.5" />Tìm kiếm</Button>
              <Button size="sm" variant="outline" onClick={handleClear}><X className="h-3.5 w-3.5 mr-1.5" />Bỏ lọc</Button>
            </div>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Thêm lịch chạy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Danh sách lịch chạy <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center sticky left-0 z-10 sticky-left">STT</TableHead>
                <TableHead>Tên lịch</TableHead>
                <TableHead>Bảng dữ liệu</TableHead>
                <TableHead className="w-28">Tần suất</TableHead>
                <TableHead className="w-36">Chạy tiếp theo</TableHead>
                <TableHead className="w-36">Chạy lần cuối</TableHead>
                <TableHead className="w-28">Kết quả</TableHead>
                <TableHead className="w-24">Số QT</TableHead>
                <TableHead className="w-20">Kích hoạt</TableHead>
                <TableHead className="w-24 text-center">Xem Issues</TableHead>
                <TableHead className="w-28 text-center sticky right-0 z-10 sticky-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-10 text-gray-400">
                    Không tìm thấy lịch chạy phù hợp
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((schedule, idx) => {
                  const isRunning = runningIds[schedule.id]
                  const isActive = schedule.status === 'active'
                  return (
                    <TableRow key={schedule.id} className="hover:bg-gray-50">
                      <TableCell className="text-center text-sm text-gray-500 font-medium sticky left-0 z-10 sticky-left">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm text-gray-900" title={schedule.name}>{schedule.name}</div>
                        <div className="text-xs text-gray-400">{schedule.owner}</div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Database className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          {schedule.tableName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="secondary" className="text-xs">
                            {FREQ_LABELS[schedule.frequency] ?? schedule.frequency}
                          </Badge>
                          {schedule.runTime && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {schedule.runTime}
                              {schedule.daysOfWeek && schedule.daysOfWeek.length > 0 && (
                                <span> · {schedule.daysOfWeek.map(d => ['CN','T2','T3','T4','T5','T6','T7'][d]).join(', ')}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {isRunning
                          ? <span className="text-blue-600 animate-pulse">Đang chạy…</span>
                          : isActive && schedule.nextRun
                            ? <span className="text-gray-700">{formatDateTime(schedule.nextRun)}</span>
                            : <span className="text-gray-400">Đã tạm dừng</span>
                        }
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {schedule.lastRun ? formatDateTime(schedule.lastRun) : <span className="text-gray-400">Chưa chạy</span>}
                      </TableCell>
                      <TableCell>
                        {isRunning
                          ? <Badge variant="secondary" className="text-blue-600 bg-blue-50 text-xs">Đang chạy</Badge>
                          : schedule.lastRunStatus
                            ? <StatusBadge status={schedule.lastRunStatus} />
                            : <span className="text-xs text-gray-400">—</span>
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          {schedule.rulesCount} QT
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={isActive}
                          onCheckedChange={v => setSchedules(prev => prev.map(s =>
                            s.id === schedule.id ? { ...s, status: v ? 'active' : 'inactive' } : s
                          ))}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => navigate('/issues', { state: { tableId: schedule.tableId } })}
                          className="p-1.5 rounded hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"
                          title="Xem vấn đề của bảng này"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                      <TableCell className="text-center sticky right-0 z-10 sticky-right">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => !isRunning && handleRunNow(schedule.id)}
                            disabled={isRunning}
                            className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 disabled:opacity-40 transition-colors"
                            title="Chạy ngay"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditSchedule(schedule)}
                            className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteSchedule(schedule)}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} lịch chạy
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${n === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ScheduleDialog open={showAdd} onClose={() => setShowAdd(false)} onSave={handleSave} />
      <ScheduleDialog open={!!editSchedule} editSchedule={editSchedule} onClose={() => setEditSchedule(null)} onSave={handleSave} />
      <DeleteConfirm schedule={deleteSchedule} onConfirm={handleDelete} onCancel={() => setDeleteSchedule(null)} />
    </div>
  )
}
