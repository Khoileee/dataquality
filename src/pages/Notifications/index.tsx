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
import { mockNotifications, mockDataSources, getDownstreamJobs, cascadeConfig as defaultCascadeConfig } from '@/data/mockData'
import type { NotificationConfig, CascadeConfig } from '@/types'
import { Mail, MessageSquare, Webhook, Plus, Pencil, Trash2, Zap, Bell, CheckCircle, Link2, Send } from 'lucide-react'
import { InfoTooltip } from '@/components/common/InfoTooltip'

const TYPE_ICONS: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  email: { icon: Mail, bg: 'bg-blue-100', color: 'text-blue-600' },
  sms: { icon: MessageSquare, bg: 'bg-green-100', color: 'text-green-600' },
  webhook: { icon: Webhook, bg: 'bg-purple-100', color: 'text-purple-600' },
  telegram: { icon: Send, bg: 'bg-sky-100', color: 'text-sky-600' },
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
    name: '', type: 'email' as 'email' | 'sms' | 'webhook' | 'telegram',
    recipients: '', webhookUrl: '',
    triggerWarning: true, triggerCritical: true, triggerResolved: false,
    allTables: true, selectedTables: [] as string[],
    isActive: true, notifyDownstream: false,
    emailSubject: '', emailBody: '',
    digestEnabled: false, digestIntervalMinutes: 15,
  })
  const [testSent, setTestSent] = useState<string | null>(null)
  const [cascadeCfg, setCascadeCfg] = useState<CascadeConfig>({ ...defaultCascadeConfig })

  const openAdd = () => {
    setEditingId(null)
    setForm({ name: '', type: 'email', recipients: '', webhookUrl: '', triggerWarning: true, triggerCritical: true, triggerResolved: false, allTables: true, selectedTables: [], isActive: true, notifyDownstream: false, emailSubject: '', emailBody: '', digestEnabled: false, digestIntervalMinutes: 15 })
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
      notifyDownstream: item.notifyDownstream ?? false,
      emailSubject: item.emailSubject ?? '',
      emailBody: item.emailBody ?? '',
      digestEnabled: item.digestEnabled ?? false,
      digestIntervalMinutes: item.digestIntervalMinutes ?? 15,
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
    const emailFields = form.type === 'email'
      ? { emailSubject: form.emailSubject || undefined, emailBody: form.emailBody || undefined }
      : { emailSubject: undefined, emailBody: undefined }
    const digestFields = {
      digestEnabled: form.digestEnabled,
      digestIntervalMinutes: form.digestEnabled ? form.digestIntervalMinutes : undefined,
    }
    if (editingId) {
      setItems(prev => prev.map(i => i.id === editingId ? { ...i, name: form.name, type: form.type, recipients, triggerOn, tables, isActive: form.isActive, notifyDownstream: form.notifyDownstream, ...emailFields, ...digestFields } : i))
    } else {
      setItems(prev => [...prev, { id: `notif-${Date.now()}`, name: form.name, type: form.type, recipients, triggerOn, tables, isActive: form.isActive, notifyDownstream: form.notifyDownstream, ...emailFields, ...digestFields }])
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
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-semibold text-gray-900">{item.name}</span>
                      <StatusBadge status={item.type} />
                      {item.digestEnabled && (
                        <Badge variant="secondary" className="bg-sky-100 text-sky-700 border-sky-200">
                          Digest {item.digestIntervalMinutes ? `${item.digestIntervalMinutes}p` : ''}
                        </Badge>
                      )}
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
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600" title="Chỉnh sửa" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-red-600" title="Xóa" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Cascade Settings */}
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-red-100 rounded-lg">
                <Link2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Cài đặt lan truyền cảnh báo</h3>
                <p className="text-sm text-gray-500">Cấu hình hành vi tự động khi phát hiện lỗi lan truyền từ bảng nguồn đến báo cáo và chỉ tiêu.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {/* notifyDownstream */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                <Switch checked={cascadeCfg.notifyDownstream} onCheckedChange={v => setCascadeCfg(c => ({ ...c, notifyDownstream: v }))} />
                <div>
                  <div className="text-sm font-medium text-gray-800">Thông báo downstream</div>
                  <div className="text-xs text-gray-500 mt-0.5">Tự động gửi cảnh báo đến owner BC/KPI khi bảng nguồn lỗi</div>
                </div>
              </div>

              {/* autoWaitingData */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                <Switch checked={cascadeCfg.autoWaitingData} onCheckedChange={v => setCascadeCfg(c => ({ ...c, autoWaitingData: v }))} />
                <div>
                  <div className="text-sm font-medium text-gray-800">Tự động chuyển "Chờ dữ liệu"</div>
                  <div className="text-xs text-gray-500 mt-0.5">Tự động cập nhật trạng thái downstream khi upstream lỗi</div>
                </div>
              </div>

              {/* autoRerun */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                <Switch checked={cascadeCfg.autoRerun} onCheckedChange={v => setCascadeCfg(c => ({ ...c, autoRerun: v }))} />
                <div>
                  <div className="text-sm font-medium text-gray-800">Tự động chạy lại</div>
                  <div className="text-xs text-gray-500 mt-0.5">Tự động trigger chạy lại BC/KPI khi bảng nguồn phục hồi</div>
                </div>
              </div>

              {/* autoResolve */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                <Switch checked={cascadeCfg.autoResolve} onCheckedChange={v => setCascadeCfg(c => ({ ...c, autoResolve: v }))} />
                <div>
                  <div className="text-sm font-medium text-gray-800">Tự động đóng cảnh báo</div>
                  <div className="text-xs text-gray-500 mt-0.5">Tự động resolve cascade issues khi tất cả tầng đã OK</div>
                </div>
              </div>

              {/* cascadeSummary */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                <Switch checked={cascadeCfg.cascadeSummary} onCheckedChange={v => setCascadeCfg(c => ({ ...c, cascadeSummary: v }))} />
                <div>
                  <div className="text-sm font-medium text-gray-800">Thông báo tóm tắt</div>
                  <div className="text-xs text-gray-500 mt-0.5">Gửi notification tóm tắt khi toàn bộ chuỗi phục hồi</div>
                </div>
              </div>

              {/* cascadeDepth */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800 mb-1.5">Độ sâu cascade</div>
                  <Select
                    value={String(cascadeCfg.cascadeDepth)}
                    onChange={e => setCascadeCfg(c => ({ ...c, cascadeDepth: Number(e.target.value) }))}
                  >
                    <option value="1">1 tầng (chỉ báo cáo)</option>
                    <option value="2">2 tầng (báo cáo + chỉ tiêu)</option>
                    <option value="0">Không giới hạn</option>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
            <Label className="inline-flex items-center gap-1">
              Loại thông báo
              <InfoTooltip text="Email: gửi tới hộp thư; SMS: gửi tin nhắn; Webhook: gọi HTTP POST đến URL; Telegram: gửi tin qua bot Telegram (chat_id)" />
            </Label>
            <Select className="mt-1" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="webhook">Webhook</option>
              <option value="telegram">Telegram</option>
            </Select>
          </div>

          {form.type !== 'webhook' ? (
            <div>
              <Label className="inline-flex items-center gap-1">
                {form.type === 'telegram' ? 'Danh sách Chat ID Telegram' : 'Danh sách người nhận'} (mỗi dòng 1 giá trị)
                {form.type === 'telegram' && (
                  <InfoTooltip text="Chat ID của user/group Telegram. Bot phải được thêm vào group. Có thể lấy chat_id qua @userinfobot" />
                )}
              </Label>
              <Textarea className="mt-1 font-mono text-xs" rows={4}
                placeholder={
                  form.type === 'email' ? 'user@company.vn\nteam@company.vn' :
                  form.type === 'telegram' ? '-1001234567890\n123456789' :
                  '+84901234567\n+84901234568'
                }
                value={form.recipients} onChange={e => setForm(f => ({ ...f, recipients: e.target.value }))} />
            </div>
          ) : (
            <div>
              <Label>URL Webhook</Label>
              <Input className="mt-1 font-mono" placeholder="https://hooks.example.com/..." value={form.webhookUrl} onChange={e => setForm(f => ({ ...f, webhookUrl: e.target.value }))} />
            </div>
          )}

          {form.type === 'email' && (
            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-slate-700">Nội dung email</span>
              </div>
              <div>
                <Label>Tiêu đề email</Label>
                <Input className="mt-1" placeholder="[DQ ALERT] {{severity}} - Bảng {{table}} cần xử lý ngay"
                  value={form.emailSubject} onChange={e => setForm(f => ({ ...f, emailSubject: e.target.value }))} />
              </div>
              <div>
                <Label>Nội dung email</Label>
                <Textarea className="mt-1 text-xs font-mono" rows={5}
                  placeholder={'Kính gửi,\n\nPhát hiện vấn đề:\n• Bảng: {{table}}\n• Mức độ: {{severity}}\n• Điểm: {{score}}/100\n• Phát hiện: {{detected_at}}'}
                  value={form.emailBody} onChange={e => setForm(f => ({ ...f, emailBody: e.target.value }))} />
              </div>
              <p className="text-[11px] text-slate-400">
                Biến hỗ trợ: <code className="bg-white px-1 rounded border border-slate-200">{'{{table}}'}</code>{' '}
                <code className="bg-white px-1 rounded border border-slate-200">{'{{dimension}}'}</code>{' '}
                <code className="bg-white px-1 rounded border border-slate-200">{'{{severity}}'}</code>{' '}
                <code className="bg-white px-1 rounded border border-slate-200">{'{{score}}'}</code>{' '}
                <code className="bg-white px-1 rounded border border-slate-200">{'{{threshold}}'}</code>{' '}
                <code className="bg-white px-1 rounded border border-slate-200">{'{{detected_at}}'}</code>
              </p>
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

          {/* Downstream notification */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
            <div className="flex items-center gap-3">
              <Switch checked={form.notifyDownstream} onCheckedChange={v => setForm(f => ({ ...f, notifyDownstream: v }))} />
              <div>
                <div className="text-sm font-medium text-slate-800">Tự động thông báo đến chủ sở hữu job phụ thuộc</div>
                <div className="text-xs text-slate-500 mt-0.5">Khi bảng được chọn có issue, sẽ gửi thêm đến owner của các downstream jobs</div>
              </div>
            </div>
            {form.notifyDownstream && !form.allTables && form.selectedTables.length > 0 && (() => {
              const tableIds = form.selectedTables
              const allDownstream = tableIds.flatMap(tid => getDownstreamJobs(tid))
              const unique = Array.from(new Map(allDownstream.map(j => [j.id, j])).values())
              if (unique.length === 0) return (
                <p className="text-xs text-slate-500 italic pl-1">Không có job downstream nào cho bảng đã chọn.</p>
              )
              return (
                <div className="bg-white rounded-lg border border-amber-200 p-3 space-y-1.5">
                  <div className="text-xs font-semibold text-slate-600 mb-1">Sẽ gửi thêm đến:</div>
                  {unique.map(job => (
                    <div key={job.id} className="flex items-center gap-2 text-xs text-slate-700">
                      <span className="text-amber-500">⚡</span>
                      <span className="font-medium">{job.owner}</span>
                      <span className="text-slate-400">&lt;{job.ownerEmail}&gt;</span>
                      <span className="text-slate-400">({job.name})</span>
                    </div>
                  ))}
                </div>
              )
            })()}
            {form.notifyDownstream && form.allTables && (
              <p className="text-xs text-slate-500 italic pl-1">Chọn bảng cụ thể để xem preview danh sách người nhận downstream.</p>
            )}
          </div>

          {/* Digest (batch) mode */}
          <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Switch checked={form.digestEnabled} onCheckedChange={v => setForm(f => ({ ...f, digestEnabled: v }))} />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800 flex items-center gap-1">
                  Gửi tổng hợp (digest)
                  <InfoTooltip text="Thay vì gửi từng sự kiện, hệ thống sẽ gom các cảnh báo trong một khoảng thời gian rồi gửi 1 thông báo tổng hợp. Giảm spam khi có nhiều lỗi cùng lúc" wide />
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Gom các cảnh báo trong khoảng thời gian → gửi 1 thông báo tổng hợp (giảm spam)</div>
              </div>
            </div>
            {form.digestEnabled && (
              <div className="flex items-center gap-2 pl-12">
                <Label className="text-sm text-slate-700 whitespace-nowrap">Chu kỳ gom:</Label>
                <Select
                  className="w-32"
                  value={String(form.digestIntervalMinutes)}
                  onChange={e => setForm(f => ({ ...f, digestIntervalMinutes: Number(e.target.value) }))}
                >
                  <option value="5">5 phút</option>
                  <option value="15">15 phút</option>
                  <option value="30">30 phút</option>
                  <option value="60">1 giờ</option>
                  <option value="240">4 giờ</option>
                  <option value="1440">1 ngày</option>
                </Select>
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
