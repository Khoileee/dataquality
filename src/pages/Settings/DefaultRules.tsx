import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { DimensionBadge, DIMENSION_CONFIG } from '@/components/common/DimensionBadge'
import { PageHeader } from '@/components/common/PageHeader'
import { mockRuleTemplates } from '@/data/mockData'
import type { QualityDimension } from '@/types'
import { Layers, CheckSquare, Link2, Fingerprint, Target, Clock, Plus, Save, CheckCircle } from 'lucide-react'

const DIMENSIONS: QualityDimension[] = ['completeness', 'validity', 'consistency', 'uniqueness', 'accuracy', 'timeliness']

const DIMENSION_ICONS: Record<QualityDimension, React.ElementType> = {
  completeness: Layers,
  validity: CheckSquare,
  consistency: Link2,
  uniqueness: Fingerprint,
  accuracy: Target,
  timeliness: Clock,
}

interface DefaultRule {
  id: string
  name: string
  dimension: QualityDimension
  enabled: boolean
  warningThreshold: number
  criticalThreshold: number
}

const DEFAULT_ON: QualityDimension[] = ['completeness', 'uniqueness']

export function DefaultRules() {
  const [saved, setSaved] = useState(false)
  const [rules, setRules] = useState<DefaultRule[]>(() =>
    mockRuleTemplates.slice(0, 18).map((t, i) => ({
      id: t.id,
      name: t.name,
      dimension: t.dimension,
      enabled: DEFAULT_ON.includes(t.dimension) || i % 3 === 0,
      warningThreshold: 90,
      criticalThreshold: 80,
    }))
  )

  const toggleRule = (id: string) => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  const updateThreshold = (id: string, field: 'warningThreshold' | 'criticalThreshold', value: number) =>
    setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div>
      <PageHeader
        title="Quy tắc mặc định"
        description="Quy tắc mặc định sẽ tự động được áp dụng khi thêm bảng dữ liệu mới vào hệ thống"
        breadcrumbs={[{ label: 'Cài đặt' }, { label: 'Quy tắc mặc định' }]}
      />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-700">
          <strong>Lưu ý:</strong> Các quy tắc được bật ở đây sẽ tự động tạo khi bạn thêm bảng dữ liệu mới.
          Bạn vẫn có thể chỉnh sửa hoặc xóa quy tắc cho từng bảng cụ thể tại trang <em>Quản lý quy tắc</em>.
        </div>
      </div>

      <div className="space-y-4">
        {DIMENSIONS.map(dim => {
          const config = DIMENSION_CONFIG[dim]
          const Icon = DIMENSION_ICONS[dim]
          const dimRules = rules.filter(r => r.dimension === dim)
          const enabledCount = dimRules.filter(r => r.enabled).length

          return (
            <Card key={dim}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{config.label}</CardTitle>
                    <p className="text-xs text-gray-500 mt-0.5">{enabledCount}/{dimRules.length} quy tắc được bật</p>
                  </div>
                  <DimensionBadge dimension={dim} />
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1" />Thêm quy tắc
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {/* Column headers */}
                  <div className="grid grid-cols-12 gap-3 text-xs text-gray-400 font-medium uppercase tracking-wide pb-1 border-b">
                    <div className="col-span-1">Bật</div>
                    <div className="col-span-7">Tên quy tắc</div>
                    <div className="col-span-2 text-center">Ngưỡng C.báo</div>
                    <div className="col-span-2 text-center">Ngưỡng N.trọng</div>
                  </div>
                  {dimRules.map(rule => (
                    <div key={rule.id} className={`grid grid-cols-12 gap-3 items-center py-1.5 rounded-md px-1 ${rule.enabled ? 'bg-gray-50' : 'opacity-50'}`}>
                      <div className="col-span-1">
                        <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                      </div>
                      <div className="col-span-7">
                        <span className="text-sm text-gray-800">{rule.name}</span>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number" min={0} max={100}
                          value={rule.warningThreshold}
                          onChange={e => updateThreshold(rule.id, 'warningThreshold', +e.target.value)}
                          disabled={!rule.enabled}
                          className="h-7 text-xs text-center border-amber-300 disabled:opacity-30"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number" min={0} max={100}
                          value={rule.criticalThreshold}
                          onChange={e => updateThreshold(rule.id, 'criticalThreshold', +e.target.value)}
                          disabled={!rule.enabled}
                          className="h-7 text-xs text-center border-red-300 disabled:opacity-30"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} size="lg" className={saved ? 'bg-green-600 hover:bg-green-700' : ''}>
          <Save className="h-4 w-4 mr-2" />
          {saved ? 'Đã lưu thành công!' : 'Lưu tất cả thay đổi'}
        </Button>
      </div>
    </div>
  )
}
