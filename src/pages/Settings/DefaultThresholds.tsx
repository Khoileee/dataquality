import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DimensionBadge, DIMENSION_CONFIG } from '@/components/common/DimensionBadge'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import { PageHeader } from '@/components/common/PageHeader'
import type { QualityDimension } from '@/types'
import { Layers, CheckSquare, Link2, Fingerprint, Target, Clock, Save, CheckCircle, RotateCcw } from 'lucide-react'

const DIMENSIONS: QualityDimension[] = ['completeness', 'validity', 'consistency', 'uniqueness', 'accuracy', 'timeliness']

const DIMENSION_ICONS: Record<QualityDimension, React.ElementType> = {
  completeness: Layers,
  validity: CheckSquare,
  consistency: Link2,
  uniqueness: Fingerprint,
  accuracy: Target,
  timeliness: Clock,
}

const DIMENSION_TOOLTIPS: Record<QualityDimension, string> = {
  completeness: 'Dữ liệu có đầy đủ không? VD: cột bắt buộc không được null, số dòng đủ',
  validity: 'Dữ liệu có đúng format/range? VD: email đúng định dạng, tuổi trong khoảng hợp lý',
  consistency: 'Dữ liệu có nhất quán giữa các bảng? VD: mã KH phải tồn tại trong bảng tham chiếu',
  uniqueness: 'Có bản ghi trùng lặp không? VD: CCCD, mã giao dịch phải duy nhất',
  accuracy: 'Dữ liệu có chính xác so với thực tế? VD: tổng số liệu khớp, outlier hợp lý',
  timeliness: 'Dữ liệu có đến đúng giờ? VD: dữ liệu phải load trước 8h, freshness ≤ 24h',
}

interface ThresholdRow {
  dimension: QualityDimension
  warning: number
  critical: number
}

const DEFAULTS: ThresholdRow[] = [
  { dimension: 'completeness', warning: 90, critical: 80 },
  { dimension: 'validity', warning: 85, critical: 70 },
  { dimension: 'consistency', warning: 85, critical: 70 },
  { dimension: 'uniqueness', warning: 95, critical: 90 },
  { dimension: 'accuracy', warning: 85, critical: 70 },
  { dimension: 'timeliness', warning: 80, critical: 60 },
]

export function DefaultThresholds() {
  const [rows, setRows] = useState<ThresholdRow[]>(DEFAULTS.map(r => ({ ...r })))
  const [saved, setSaved] = useState(false)

  const updateRow = (dim: QualityDimension, field: 'warning' | 'critical', val: string) => {
    setRows(prev => prev.map(r => r.dimension === dim ? { ...r, [field]: Number(val) || 0 } : r))
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setRows(DEFAULTS.map(r => ({ ...r })))
    setSaved(false)
  }

  return (
    <div>
      <PageHeader
        title="Ngưỡng mặc định"
        description="Ngưỡng Warning / Critical mặc định cho 6 chiều chất lượng dữ liệu. Các bảng mới đăng ký sẽ kế thừa ngưỡng này."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Ngưỡng mặc định theo chiều dữ liệu</CardTitle>
              <InfoTooltip text="Ngưỡng mặc định áp dụng khi bảng/rule không có override riêng. Ưu tiên: Rule > Bảng > Global (ngưỡng này). Score ≥ Warning = Pass, Critical ≤ Score < Warning = Cảnh báo, Score < Critical = Vi phạm" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Đặt lại mặc định
              </Button>
              <Button size="sm" onClick={handleSave}>
                {saved ? <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                {saved ? 'Đã lưu' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rows.map(row => {
              const cfg = DIMENSION_CONFIG[row.dimension]
              const Icon = DIMENSION_ICONS[row.dimension]
              const isInvalid = row.critical >= row.warning

              return (
                <div key={row.dimension}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${isInvalid ? 'border-red-200 bg-red-50/50' : 'border-gray-100 bg-gray-50/30 hover:bg-gray-50'}`}
                >
                  {/* Dimension info */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cfg.bg}`}>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-900">{cfg.label}</span>
                        <InfoTooltip text={DIMENSION_TOOLTIPS[row.dimension]} />
                      </div>
                      <DimensionBadge dimension={row.dimension} />
                    </div>
                  </div>

                  {/* Thresholds */}
                  <div className="flex items-center gap-6 flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-yellow-700 w-16">Warning</label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={row.warning}
                          onChange={e => updateRow(row.dimension, 'warning', e.target.value)}
                          className="w-20 text-center text-sm pr-6"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-red-700 w-16">Critical</label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={row.critical}
                          onChange={e => updateRow(row.dimension, 'critical', e.target.value)}
                          className="w-20 text-center text-sm pr-6"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual bar */}
                  <div className="flex-1 max-w-[200px]">
                    <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                      <div className="bg-red-400" style={{ width: `${row.critical}%` }} />
                      <div className="bg-yellow-400" style={{ width: `${row.warning - row.critical}%` }} />
                      <div className="bg-green-400" style={{ width: `${100 - row.warning}%` }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-red-500">0</span>
                      <span className="text-[10px] text-red-500">{row.critical}</span>
                      <span className="text-[10px] text-yellow-600">{row.warning}</span>
                      <span className="text-[10px] text-green-600">100</span>
                    </div>
                  </div>

                  {/* Error */}
                  {isInvalid && (
                    <span className="text-xs text-red-600 font-medium whitespace-nowrap">Critical phải &lt; Warning</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Explanation */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">Cách hoạt động ngưỡng</p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li><strong>Score ≥ Warning</strong>: Pass — dữ liệu đạt chất lượng</li>
              <li><strong>Critical ≤ Score &lt; Warning</strong>: Cảnh báo — cần theo dõi</li>
              <li><strong>Score &lt; Critical</strong>: Vi phạm — sinh sự cố tự động</li>
              <li>Ưu tiên kế thừa: <strong>Rule → Bảng → Ngưỡng mặc định (trang này)</strong></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
