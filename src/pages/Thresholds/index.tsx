import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { DimensionBadge, DIMENSION_CONFIG, getDimensionLabel } from '@/components/common/DimensionBadge'
import { PageHeader } from '@/components/common/PageHeader'
import { mockThresholds, mockDataSources } from '@/data/mockData'
import type { ThresholdConfig, QualityDimension } from '@/types'
import { Layers, CheckSquare, Link2, Fingerprint, Target, Clock, Plus, Pencil, Trash2, Save } from 'lucide-react'

const DIMENSION_ICONS: Record<QualityDimension, React.ElementType> = {
  completeness: Layers,
  validity: CheckSquare,
  consistency: Link2,
  uniqueness: Fingerprint,
  accuracy: Target,
  timeliness: Clock,
}

const DIMENSIONS: QualityDimension[] = ['completeness', 'validity', 'consistency', 'uniqueness', 'accuracy', 'timeliness']

// Module-level store so Rules page can read current global thresholds
const _globalThresholds: Record<QualityDimension, { warning: number; critical: number }> = {
  completeness: { warning: 90, critical: 80 },
  validity: { warning: 85, critical: 70 },
  consistency: { warning: 85, critical: 70 },
  uniqueness: { warning: 95, critical: 90 },
  accuracy: { warning: 85, critical: 70 },
  timeliness: { warning: 80, critical: 60 },
}

export function getGlobalThreshold(dim: QualityDimension): { warning: number; critical: number } {
  return { ..._globalThresholds[dim] }
}

// Module-level store for per-table thresholds (tableId+dim → W/C)
const _tableThresholds: Record<string, { warning: number; critical: number }> = {}

function _tableKey(tableId: string, dim: QualityDimension) {
  return `${tableId}::${dim}`
}

export function getTableThreshold(tableId: string, dim: QualityDimension): { warning: number; critical: number } {
  const key = _tableKey(tableId, dim)
  return _tableThresholds[key] ? { ..._tableThresholds[key] } : getGlobalThreshold(dim)
}

export function Thresholds() {
  const [globalThresholds, setGlobalThresholds] = useState<Record<QualityDimension, { warning: number; critical: number }>>({
    ..._globalThresholds,
  })

  const [tableThresholds, setTableThresholds] = useState<ThresholdConfig[]>(
    mockThresholds.filter(t => !t.isGlobal)
  )
  const [saved, setSaved] = useState(false)
  const [searchTable, setSearchTable] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ tableId: '', tableName: '', dimension: 'completeness' as QualityDimension, warning: 90, critical: 80 })

  const handleSaveGlobal = () => {
    // Persist to module-level so Rules page can read
    Object.assign(_globalThresholds, globalThresholds)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const filtered = tableThresholds.filter(t =>
    !searchTable || t.tableName?.toLowerCase().includes(searchTable.toLowerCase())
  )

  const openAdd = () => {
    setEditingId(null)
    setForm({ tableId: '', tableName: '', dimension: 'completeness', warning: 90, critical: 80 })
    setShowDialog(true)
  }

  const openEdit = (t: ThresholdConfig) => {
    setEditingId(t.id)
    setForm({ tableId: t.tableId || '', tableName: t.tableName || '', dimension: t.dimension, warning: t.warningThreshold, critical: t.criticalThreshold })
    setShowDialog(true)
  }

  const handleSave = () => {
    const ds = mockDataSources.find(d => d.id === form.tableId)
    // Persist to module-level store so Rules page can read
    _tableThresholds[_tableKey(form.tableId, form.dimension)] = { warning: form.warning, critical: form.critical }
    if (editingId) {
      setTableThresholds(prev => prev.map(t => t.id === editingId
        ? { ...t, tableId: form.tableId, tableName: ds?.name || form.tableName, dimension: form.dimension, warningThreshold: form.warning, criticalThreshold: form.critical }
        : t
      ))
    } else {
      setTableThresholds(prev => [...prev, {
        id: `thr-new-${Date.now()}`, tableId: form.tableId, tableName: ds?.name || '',
        dimension: form.dimension, warningThreshold: form.warning, criticalThreshold: form.critical, isGlobal: false,
      }])
    }
    setShowDialog(false)
  }

  const handleDelete = (id: string) => setTableThresholds(prev => prev.filter(t => t.id !== id))

  return (
    <div>
      <PageHeader
        title="Ngưỡng cảnh báo"
        description="Cấu hình ngưỡng đánh giá chất lượng dữ liệu theo 3 mức: Đạt / Cảnh báo / Không đạt"
        breadcrumbs={[{ label: 'Ngưỡng cảnh báo' }]}
      />

      {/* Global thresholds */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Cấu hình ngưỡng toàn cục</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Dùng làm giá trị mặc định khi tạo quy tắc mới · Áp dụng cho bảng chưa có cấu hình riêng
            </p>
          </div>
          <Button onClick={handleSaveGlobal} className={saved ? 'bg-green-600 hover:bg-green-700' : ''}>
            <Save className="h-4 w-4 mr-2" />
            {saved ? 'Đã lưu!' : 'Lưu cấu hình'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 border-b">
              <div className="col-span-3">Chiều dữ liệu</div>
              <div className="col-span-5">Phân vùng điểm</div>
              <div className="col-span-2 text-center">Ngưỡng cảnh báo (W)</div>
              <div className="col-span-2 text-center">Ngưỡng không đạt (C)</div>
            </div>

            {DIMENSIONS.map(dim => {
              const config = DIMENSION_CONFIG[dim]
              const Icon = DIMENSION_ICONS[dim]
              const vals = globalThresholds[dim]
              const critPct = vals.critical
              const warnPct = vals.warning - vals.critical
              const okPct = 100 - vals.warning

              return (
                <div key={dim} className="grid grid-cols-12 gap-4 items-center py-2">
                  {/* Dimension name */}
                  <div className="col-span-3 flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                  </div>

                  {/* Threshold bar */}
                  <div className="col-span-5">
                    <div className="flex h-5 rounded overflow-hidden text-[10px] font-medium">
                      <div className="bg-red-400 flex items-center justify-center text-white" style={{ width: `${critPct}%` }}>
                        {critPct > 8 && 'Không đạt'}
                      </div>
                      <div className="bg-amber-400 flex items-center justify-center text-white" style={{ width: `${warnPct}%` }}>
                        {warnPct > 8 && 'Cảnh báo'}
                      </div>
                      <div className="bg-green-400 flex items-center justify-center text-white" style={{ width: `${okPct}%` }}>
                        {okPct > 5 && 'Đạt'}
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5 px-0.5">
                      <span>0%</span>
                      <span style={{ marginLeft: `${critPct - 5}%` }}>{critPct}%</span>
                      <span>{vals.warning}%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Warning input */}
                  <div className="col-span-2">
                    <Input
                      type="number" min={0} max={100}
                      value={vals.warning}
                      onChange={e => setGlobalThresholds(prev => ({ ...prev, [dim]: { ...prev[dim], warning: +e.target.value } }))}
                      className="h-8 text-center border-amber-300 focus-visible:ring-amber-400"
                    />
                  </div>

                  {/* Critical input */}
                  <div className="col-span-2">
                    <Input
                      type="number" min={0} max={100}
                      value={vals.critical}
                      onChange={e => setGlobalThresholds(prev => ({ ...prev, [dim]: { ...prev[dim], critical: +e.target.value } }))}
                      className="h-8 text-center border-red-300 focus-visible:ring-red-400"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Table-specific overrides */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Cấu hình riêng theo bảng</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Ghi đè ngưỡng toàn cục cho một bảng + chiều DL cụ thể · Không áp dụng ở cấp cột (dùng ngưỡng riêng trong từng Quy tắc)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Tìm bảng..." value={searchTable} onChange={e => setSearchTable(e.target.value)} className="w-48 h-8" />
            <Button onClick={openAdd} size="sm">
              <Plus className="h-4 w-4 mr-1" />Thêm cấu hình
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bảng dữ liệu</TableHead>
                <TableHead>Chiều DL</TableHead>
                <TableHead className="text-center">Ngưỡng cảnh báo (W)</TableHead>
                <TableHead className="text-center">Ngưỡng không đạt (C)</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.tableName}</TableCell>
                  <TableCell><DimensionBadge dimension={t.dimension} /></TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium">
                      {t.warningThreshold}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-sm font-medium">
                      {t.criticalThreshold}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                    Chưa có cấu hình riêng nào. Nhấn "Thêm cấu hình" để tạo mới.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} title={editingId ? 'Chỉnh sửa ngưỡng' : 'Thêm cấu hình ngưỡng riêng'} size="md">
        <div className="space-y-4">
          <div>
            <Label>Bảng dữ liệu</Label>
            <Select className="mt-1" value={form.tableId} onChange={e => setForm(f => ({ ...f, tableId: e.target.value }))}>
              <option value="">Chọn bảng dữ liệu...</option>
              {mockDataSources.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Chiều dữ liệu</Label>
            <Select className="mt-1" value={form.dimension} onChange={e => setForm(f => ({ ...f, dimension: e.target.value as QualityDimension }))}>
              {DIMENSIONS.map(d => <option key={d} value={d}>{getDimensionLabel(d)}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-amber-700">Ngưỡng cảnh báo — W (%)</Label>
              <Input type="number" className="mt-1 border-amber-300" value={form.warning} onChange={e => setForm(f => ({ ...f, warning: +e.target.value }))} />
            </div>
            <div>
              <Label className="text-red-700">Ngưỡng không đạt — C (%)</Label>
              <Input type="number" className="mt-1 border-red-300" value={form.critical} onChange={e => setForm(f => ({ ...f, critical: +e.target.value }))} />
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800 space-y-0.5">
            <p className="font-medium mb-1">Quy tắc đánh giá:</p>
            <p>✅ Điểm ≥ {form.warning}% → <strong>Đạt</strong></p>
            <p>⚠️ {form.critical}% ≤ Điểm &lt; {form.warning}% → <strong>Cảnh báo</strong></p>
            <p>❌ Điểm &lt; {form.critical}% → <strong>Không đạt</strong></p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={!form.tableId}>Lưu cấu hình</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
