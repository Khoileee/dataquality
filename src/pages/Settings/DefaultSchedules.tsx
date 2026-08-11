import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/common/PageHeader'
import { Save, Clock, Database, Archive, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

interface TierConfig {
  id: string
  name: string
  description: string
  examples: string
  icon: React.ElementType
  borderColor: string
  bgColor: string
  frequency: string
  runTime: string
  selectedDays: number[]
  notifyOnFail: boolean
  active: boolean
}

export function DefaultSchedules() {
  const [saved, setSaved] = useState(false)
  const [tiers, setTiers] = useState<TierConfig[]>([
    {
      id: 'L1', name: 'Nhóm L1 – Dữ liệu quan trọng', description: 'Các bảng dữ liệu cốt lõi ảnh hưởng trực tiếp đến vận hành kinh doanh', examples: 'GD_GIAODICH, KH_KHACHHANG, TK_TAIKHOAN', icon: Database, borderColor: 'border-red-300', bgColor: 'bg-red-50',
      frequency: 'hourly', runTime: '00:00', selectedDays: [], notifyOnFail: true, active: true,
    },
    {
      id: 'L2', name: 'Nhóm L2 – Dữ liệu quan trọng vừa', description: 'Báo cáo, hợp đồng, sản phẩm – cập nhật hàng ngày', examples: 'HOP_DONG, BAO_CAO_NGAY, SP_SANPHAM, KPI_KINHDOANH', icon: Clock, borderColor: 'border-amber-300', bgColor: 'bg-amber-50',
      frequency: 'daily', runTime: '06:00', selectedDays: [], notifyOnFail: true, active: true,
    },
    {
      id: 'L3', name: 'Nhóm L3 – Dữ liệu tham chiếu', description: 'Danh mục, phân quyền, cấu hình hệ thống – ít thay đổi', examples: 'DM_TIENTE, DM_CHINHANH, PHAN_QUYEN', icon: Archive, borderColor: 'border-green-300', bgColor: 'bg-green-50',
      frequency: 'weekly', runTime: '08:00', selectedDays: [0], notifyOnFail: false, active: true,
    },
  ])

  const updateTier = (id: string, field: string, value: any) =>
    setTiers(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))

  const toggleDay = (tierId: string, dayIdx: number) =>
    setTiers(prev => prev.map(t => {
      if (t.id !== tierId) return t
      const days = t.selectedDays.includes(dayIdx) ? t.selectedDays.filter(d => d !== dayIdx) : [...t.selectedDays, dayIdx]
      return { ...t, selectedDays: days }
    }))

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div>
      <PageHeader
        title="Lịch mặc định"
        description="Cấu hình lịch chạy kiểm tra mặc định khi thêm bảng dữ liệu mới vào hệ thống"
        breadcrumbs={[{ label: 'Cài đặt' }, { label: 'Lịch mặc định' }]}
      />

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-700">
          <strong>Hướng dẫn:</strong> Phân loại bảng dữ liệu theo mức độ quan trọng để áp dụng lịch kiểm tra phù hợp.
          Bảng dữ liệu L1 cần giám sát liên tục, L2 kiểm tra hàng ngày, L3 có thể kiểm tra hàng tuần.
        </div>
      </div>

      <div className="space-y-5">
        {tiers.map(tier => {
          const Icon = tier.icon
          return (
            <Card key={tier.id} className={cn('border-2', tier.borderColor, !tier.active && 'opacity-60')}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2.5 rounded-lg', tier.bgColor)}>
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{tier.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-0.5">{tier.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Ví dụ: {tier.examples}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{tier.active ? 'Đang bật' : 'Đã tắt'}</span>
                    <Switch checked={tier.active} onCheckedChange={v => updateTier(tier.id, 'active', v)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs">Tần suất</Label>
                    <Select className="mt-1" value={tier.frequency} onChange={e => updateTier(tier.id, 'frequency', e.target.value)}>
                      <option value="realtime">Thực thời</option>
                      <option value="hourly">Hàng giờ</option>
                      <option value="daily">Hàng ngày</option>
                      <option value="weekly">Hàng tuần</option>
                      <option value="monthly">Hàng tháng</option>
                    </Select>
                  </div>

                  {(tier.frequency === 'daily' || tier.frequency === 'weekly') && (
                    <div>
                      <Label className="text-xs">Giờ chạy</Label>
                      <Input type="time" className="mt-1" value={tier.runTime} onChange={e => updateTier(tier.id, 'runTime', e.target.value)} />
                    </div>
                  )}

                  {tier.frequency === 'hourly' && (
                    <div>
                      <Label className="text-xs">Giờ bắt đầu</Label>
                      <Input type="time" className="mt-1" value={tier.runTime} onChange={e => updateTier(tier.id, 'runTime', e.target.value)} />
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <div className="flex items-center gap-2 h-9">
                      <Switch checked={tier.notifyOnFail} onCheckedChange={v => updateTier(tier.id, 'notifyOnFail', v)} />
                      <Label className="text-xs cursor-pointer">Thông báo khi thất bại</Label>
                    </div>
                  </div>
                </div>

                {tier.frequency === 'weekly' && (
                  <div className="mt-4">
                    <Label className="text-xs mb-2 block">Ngày trong tuần</Label>
                    <div className="flex gap-2 flex-wrap">
                      {DAYS.map((day, idx) => (
                        <button
                          key={idx}
                          onClick={() => toggleDay(tier.id, idx)}
                          className={cn(
                            'h-8 w-10 rounded-md text-xs font-medium transition-colors border',
                            tier.selectedDays.includes(idx)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                          )}
                          title={DAY_LABELS[idx]}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview */}
                <div className={cn('mt-4 rounded-lg p-3 text-xs text-gray-600', tier.bgColor)}>
                  <strong>Lịch chạy: </strong>
                  {tier.frequency === 'realtime' && 'Liên tục, kiểm tra mọi thay đổi realtime'}
                  {tier.frequency === 'hourly' && `Mỗi giờ một lần, bắt đầu từ ${tier.runTime}`}
                  {tier.frequency === 'daily' && `Hàng ngày lúc ${tier.runTime}`}
                  {tier.frequency === 'weekly' && `Hàng tuần vào ${tier.selectedDays.map(d => DAYS[d]).join(', ') || 'các ngày chưa chọn'} lúc ${tier.runTime}`}
                  {tier.frequency === 'monthly' && `Hàng tháng vào ngày 1 lúc ${tier.runTime}`}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} size="lg" className={saved ? 'bg-green-600 hover:bg-green-700' : ''}>
          <Save className="h-4 w-4 mr-2" />
          {saved ? 'Đã lưu thành công!' : 'Lưu cài đặt'}
        </Button>
      </div>
    </div>
  )
}
