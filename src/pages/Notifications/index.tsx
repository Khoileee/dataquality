import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageHeader } from '@/components/common/PageHeader'
import { mockNotifications, mockDataSources } from '@/data/mockData'
import type { NotificationConfig } from '@/types'
import { Mail, MessageSquare, Webhook, Plus, Pencil, Trash2, Zap, Bell, CheckCircle } from 'lucide-react'

const TYPE_ICONS: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  email: { icon: Mail, bg: 'bg-blue-100', color: 'text-blue-600' },
  sms: { icon: MessageSquare, bg: 'bg-green-100', color: 'text-green-600' },
  webhook: { icon: Webhook, bg: 'bg-purple-100', color: 'text-purple-600' },
}

const TRIGGER_LABELS: Record<string, string> = {
  warning: 'Cảnh báo',
  critical: 'Nghiêm trọng',
  resolved: 'Đã giải quyết',
}

export function Notifications() {
  const [items, setItems] = useState<NotificationConfig[]>(mockNotifications)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', type: 'email' as 'email' | 'sms' | 'webhook',
    recipients: '', webhookUrl: '',
    triggerWarning: true, triggerCritical: true, triggerResolved: false,
    allTables: true, selectedTables: [] as string[],
    isActive: true,
  })
  const [testSent, setTestSent] = useState<string | null>(null)

  const openAdd = () => {
    setEditingId(null)
    setForm({ name: '', type: 'email', recipients: '', webhookUrl: '', triggerWarning: true, triggerCritical: true, triggerResolved: false, allTables: true, selectedTables: [], isActive: true })
    setShowDialog(true)
  }

  const openEdit = (item: NotificationConfig) => {
    setEditingId(item.id)
    setForm({
      name: item.name, type: item.type,
      recipients: item.type !== 'webhook' ? item.recipients.join('\n') : '',
      webhookUrl: item.type === 'webhook' ? item.recipients[0] : '',
      triggerWarning: item.triggerOn.includes('warning'),
      triggerCritical: item.triggerOn.includes('critical'),
      triggerResolved: item.triggerOn.includes('resolved'),
      allTables: item.tables.length === 0,
      selectedTables: item.tables,
      isActive: item.isActive,
    })
    setShowDialog(true)
  }

  const handleSave = () => {
    const triggerOn: ('warning' | 'critical' | 'resolved')[] = []
    if (form.triggerWarning) triggerOn.push('warning')
    if (form.triggerCritical) triggerOn.push('critical')
    if (form.triggerResolved) triggerOn.push('resolved')
    const recipients = form.type === 'webhook' ? [form.webhookUrl] : form.recipients.split('\n').map(s => s.trim()).filter(Boolean)
    const tables = form.allTables ? [] : form.selectedTables
    if (editingId) {
      setItems(prev => prev.map(i => i.id === editingId ? { ...i, name: form.name, type: form.type, recipients, triggerOn, tables, isActive: form.isActive } : i))
    } else {
      setItems(prev => [...prev, { id: `notif-${Date.now()}`, name: form.name, type: form.type, recipients, triggerOn, tables, isActive: form.isActive }])
    }
    setShowDialog(false)
  }

  const handleDelete = (id: string) => setItems(prev => prev.filter(i => i.id !== id))
  const toggleActive = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, isActive: !i.isActive } : i))

  const handleTest = (id: string) => {
    setTestSent(id)
    setTimeout(() => setTestSent(null), 3000)
  }

  return (
    <div>
      <PageHeader
        title="Quản lý thông báo"
        description="Cấu hình kênh thông báo tự động khi phát hiện vấn đề chất lượng dữ liệu"
        breadcrumbs={[{ label: 'Quản lý thông báo' }]}
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />Thêm cấu hình
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><Bell className="h-5 w-5 text-blue-600" /></div>
          <div><div className="text-2xl font-bold">{items.length}</div><div className="text-sm text-gray-500">Tổng cấu hình</div></div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
          <div><div className="text-2xl font-bold text-green-600">{items.filter(i => i.isActive).length}</div><div className="text-sm text-gray-500">Đang hoạt động</div></div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg"><Zap className="h-5 w-5 text-purple-600" /></div>
          <div><div className="text-2xl font-bold text-purple-600">{[...new Set(items.flatMap(i => i.recipients))].length}</div><div className="text-sm text-gray-500">Người nhận</div></div>
        </div>
      </div>

      {/* Notification cards */}
      <div className="space-y-3">
        {items.map(item => {
          const typeInfo = TYPE_ICONS[item.type]
          const TypeIcon = typeInfo.icon
          return (
            <Card key={item.id} className={`transition-all ${!item.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Type icon */}
                  <div className={`p-3 rounded-xl shrink-0 ${typeInfo.bg}`}>
                    <TypeIcon className={`h-5 w-5 ${typeInfo.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-semibold text-gray-900">{item.name}</span>
                      <StatusBadge status={item.type} />
                      {!item.isActive && <Badge variant="secondary">Đã tắt</Badge>}
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 mb-2">
                      <span>
                        <span className="text-gray-400">Người nhận: </span>
                        {item.recipients.slice(0, 2).join(', ')}
                        {item.recipients.length > 2 && <span className="text-gray-400"> +{item.recipients.length - 2} khác</span>}
                      </span>
                      <span>
                        <span className="text-gray-400">Bảng: </span>
                        {item.tables.length === 0 ? 'Tất cả bảng' : `${item.tables.length} bảng`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-gray-400">Kích hoạt khi:</span>
                      {item.triggerOn.map(t => (
                        <Badge key={t} variant={t === 'critical' ? 'destructive' : t === 'warning' ? 'warning' : 'success'}>
                          {TRIGGER_LABELS[t]}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => handleTest(item.id)}
                      className={testSent === item.id ? 'text-green-600 border-green-300' : ''}
                    >
                      {testSent === item.id ? '✓ Đã gửi' : 'Kiểm tra'}
                    </Button>
                    <Switch checked={item.isActive} onCheckedChange={() => toggleActive(item.id)} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)}
        title={editingId ? 'Chỉnh sửa cấu hình thông báo' : 'Thêm cấu hình thông báo mới'}
        size="lg">
        <div className="space-y-4">
          <div>
            <Label>Tên cấu hình</Label>
            <Input className="mt-1" placeholder="VD: Cảnh báo nghiêm trọng - Nhóm DBA" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Loại thông báo</Label>
            <Select className="mt-1" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="webhook">Webhook</option>
            </Select>
          </div>

          {form.type !== 'webhook' ? (
            <div>
              <Label>Danh sách người nhận (mỗi địa chỉ 1 dòng)</Label>
              <Textarea className="mt-1 font-mono text-xs" rows={4}
                placeholder={form.type === 'email' ? 'user@company.vn\nteam@company.vn' : '+84901234567\n+84901234568'}
                value={form.recipients} onChange={e => setForm(f => ({ ...f, recipients: e.target.value }))} />
            </div>
          ) : (
            <div>
              <Label>URL Webhook</Label>
              <Input className="mt-1 font-mono" placeholder="https://hooks.example.com/..." value={form.webhookUrl} onChange={e => setForm(f => ({ ...f, webhookUrl: e.target.value }))} />
            </div>
          )}

          <div>
            <Label>Kích hoạt khi</Label>
            <div className="flex gap-4 mt-2">
              {(['warning', 'critical', 'resolved'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300"
                    checked={t === 'warning' ? form.triggerWarning : t === 'critical' ? form.triggerCritical : form.triggerResolved}
                    onChange={e => setForm(f => ({ ...f, [`trigger${t.charAt(0).toUpperCase() + t.slice(1)}`]: e.target.checked }))}
                  />
                  <span className="text-sm">{TRIGGER_LABELS[t]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Áp dụng cho bảng dữ liệu</Label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.allTables} onChange={e => setForm(f => ({ ...f, allTables: e.target.checked }))} />
                Tất cả bảng
              </label>
            </div>
            {!form.allTables && (
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-1">
                {mockDataSources.map(ds => (
                  <label key={ds.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-1">
                    <input type="checkbox"
                      checked={form.selectedTables.includes(ds.id)}
                      onChange={e => setForm(f => ({ ...f, selectedTables: e.target.checked ? [...f.selectedTables, ds.id] : f.selectedTables.filter(id => id !== ds.id) }))}
                    />
                    {ds.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 py-2 border-t">
            <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
            <span className="text-sm text-gray-700">Kích hoạt cấu hình này ngay</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={!form.name}>Lưu cấu hình</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
