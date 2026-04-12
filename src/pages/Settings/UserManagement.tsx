import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { PageHeader } from '@/components/common/PageHeader'
import { mockUsers, mockDataSources } from '@/data/mockData'
import type { User } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { Plus, Pencil, Trash2, Shield, Users } from 'lucide-react'

const ROLE_CONFIG: Record<string, { label: string; variant: 'destructive' | 'default' | 'warning' | 'secondary'; desc: string }> = {
  admin: { label: 'Quản trị viên', variant: 'destructive', desc: 'Toàn quyền hệ thống' },
  data_steward: { label: 'Data Steward', variant: 'default', desc: 'Quản lý dữ liệu được giao' },
  analyst: { label: 'Phân tích viên', variant: 'warning', desc: 'Xem và phân tích' },
  viewer: { label: 'Người xem', variant: 'secondary', desc: 'Chỉ xem' },
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', email: '', role: 'analyst' as User['role'],
    team: 'Nhóm Khách hàng', dataOwnership: [] as string[], isActive: true,
  })

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditingId(null)
    setForm({ name: '', email: '', role: 'analyst', team: 'Nhóm Khách hàng', dataOwnership: [], isActive: true })
    setShowDialog(true)
  }

  const openEdit = (u: User) => {
    setEditingId(u.id)
    setForm({ name: u.name, email: u.email, role: u.role, team: u.team, dataOwnership: u.dataOwnership, isActive: u.isActive })
    setShowDialog(true)
  }

  const handleSave = () => {
    if (editingId) {
      setUsers(prev => prev.map(u => u.id === editingId ? { ...u, ...form } : u))
    } else {
      setUsers(prev => [...prev, {
        id: `u-${Date.now()}`, ...form,
        lastLoginAt: new Date().toISOString(),
      }])
    }
    setShowDialog(false)
  }

  const handleDelete = (id: string) => setUsers(prev => prev.filter(u => u.id !== id))
  const toggleActive = (id: string) => setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u))

  const initials = (name: string) => name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase()

  const roleCounts = Object.fromEntries(
    Object.keys(ROLE_CONFIG).map(r => [r, users.filter(u => u.role === r).length])
  )

  return (
    <div>
      <PageHeader
        title="Quản lý người dùng"
        description="Phân quyền và quản lý quyền truy cập vào hệ thống Data Quality"
        breadcrumbs={[{ label: 'Cài đặt' }, { label: 'Quản lý người dùng' }]}
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />Thêm người dùng
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(ROLE_CONFIG).map(([role, config]) => (
          <div key={role} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{roleCounts[role] || 0}</div>
                <div className="text-sm text-gray-500">{config.label}</div>
              </div>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Search + table */}
      <Card>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="font-semibold">Danh sách người dùng</span>
            <Badge variant="secondary">{filtered.length} người dùng</Badge>
          </div>
          <Input placeholder="Tìm kiếm theo tên, email..." value={search} onChange={e => setSearch(e.target.value)} className="w-64 h-8" />
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center sticky left-0 z-10 sticky-left">STT</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Nhóm</TableHead>
                <TableHead className="text-center">Dữ liệu quản lý</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead>Đăng nhập cuối</TableHead>
                <TableHead className="text-center sticky right-0 z-10 sticky-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user, idx) => {
                const roleConfig = ROLE_CONFIG[user.role]
                return (
                  <TableRow key={user.id}>
                    <TableCell className="text-center text-sm text-gray-500 font-medium sticky left-0 z-10 sticky-left">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${user.role === 'admin' ? 'bg-red-500' : user.role === 'data_steward' ? 'bg-blue-500' : user.role === 'analyst' ? 'bg-purple-500' : 'bg-gray-400'}`}>
                          {initials(user.name)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant={roleConfig.variant}>{roleConfig.label}</Badge>
                        <div className="text-xs text-gray-400 mt-0.5">{roleConfig.desc}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.team}</TableCell>
                    <TableCell className="text-center">
                      {user.dataOwnership.length > 0 ? (
                        <Badge variant="default">{user.dataOwnership.length} bảng</Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={user.isActive} onCheckedChange={() => toggleActive(user.id)} disabled={user.role === 'admin'} />
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">{formatDateTime(user.lastLoginAt)}</TableCell>
                    <TableCell className="text-center sticky right-0 z-10 sticky-right">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Button>
                        {user.role !== 'admin' && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)}
        title={editingId ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Họ và tên <span className="text-red-500">*</span></Label>
              <Input className="mt-1" placeholder="Nguyễn Văn A" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input type="email" className="mt-1" placeholder="user@company.vn" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label>Vai trò</Label>
              <Select className="mt-1" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as User['role'] }))}>
                <option value="admin">Quản trị viên</option>
                <option value="data_steward">Data Steward</option>
                <option value="analyst">Phân tích viên</option>
                <option value="viewer">Người xem</option>
              </Select>
              {form.role && <p className="text-xs text-gray-400 mt-1">{ROLE_CONFIG[form.role]?.desc}</p>}
            </div>
            <div>
              <Label>Nhóm</Label>
              <Select className="mt-1" value={form.team} onChange={e => setForm(f => ({ ...f, team: e.target.value }))}>
                {['Nhóm Khách hàng', 'Nhóm Giao dịch', 'Nhóm Sản phẩm', 'Nhóm Báo cáo', 'Nhóm Rủi ro', 'Nhóm Quản trị dữ liệu', 'Nhóm Bảo mật', 'Kiểm toán nội bộ', 'IT Operations'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
          </div>

          {(form.role === 'data_steward' || form.role === 'admin') && (
            <div>
              <Label>Bảng dữ liệu quản lý</Label>
              <div className="mt-1 border rounded-md p-3 max-h-48 overflow-y-auto grid grid-cols-2 gap-1">
                {mockDataSources.map(ds => (
                  <label key={ds.id} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer hover:bg-gray-50 rounded px-1">
                    <input type="checkbox"
                      checked={form.dataOwnership.includes(ds.id)}
                      onChange={e => setForm(f => ({ ...f, dataOwnership: e.target.checked ? [...f.dataOwnership, ds.id] : f.dataOwnership.filter(id => id !== ds.id) }))}
                    />
                    <div>
                      <div className="font-medium text-xs">{ds.name}</div>
                      <div className="text-xs text-gray-400">{ds.schema}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 py-2 border-t">
            <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
            <div>
              <Label className="cursor-pointer">Kích hoạt tài khoản</Label>
              <p className="text-xs text-gray-400">Người dùng có thể đăng nhập khi tài khoản được kích hoạt</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.email}>
              <Shield className="h-4 w-4 mr-1.5" />
              {editingId ? 'Cập nhật' : 'Tạo tài khoản'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
