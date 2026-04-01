import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DimensionBadge } from '@/components/common/DimensionBadge'
import { PageHeader } from '@/components/common/PageHeader'
import { mockIssues, mockUsers } from '@/data/mockData'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  CheckCircle, Clock, MessageSquare, UserPlus, RotateCcw,
  XCircle, Send, AlertTriangle, Database, BookOpen
} from 'lucide-react'

const EVENT_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  created: { icon: AlertTriangle, color: 'text-blue-600', bg: 'bg-blue-100' },
  assigned: { icon: UserPlus, color: 'text-purple-600', bg: 'bg-purple-100' },
  status_changed: { icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-100' },
  comment: { icon: MessageSquare, color: 'text-gray-600', bg: 'bg-gray-100' },
  resolved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
}

const SAMPLE_DATA: Record<string, { columns: string[]; rows: string[][] }> = {
  completeness: {
    columns: ['MA_KH', 'HO_TEN', 'NGAY_SINH', 'LY_DO'],
    rows: [
      ['KH0012345', 'Nguyễn Văn A', 'NULL', 'Thiếu ngày sinh'],
      ['KH0023456', 'Trần Thị B', 'NULL', 'Thiếu ngày sinh'],
      ['KH0034567', 'Lê Văn C', 'NULL', 'Thiếu ngày sinh'],
    ]
  },
  validity: {
    columns: ['MA_KH', 'SO_DIEN_THOAI', 'GIA_TRI_SAI', 'LY_DO'],
    rows: [
      ['KH0001111', '84901234567', '+84901234567', 'Thừa mã quốc gia'],
      ['KH0002222', '0912 345 678', '0912 345 678', 'Có dấu cách'],
      ['KH0003333', '090123456', '090123456', 'Thiếu 1 chữ số'],
    ]
  },
  consistency: {
    columns: ['MA_HD', 'NGAY_HIEU_LUC', 'NGAY_KET_THUC', 'CHENH_LECH'],
    rows: [
      ['HD001234', '2026-06-01', '2026-01-01', '-150 ngày'],
      ['HD002345', '2026-12-15', '2026-06-30', '-168 ngày'],
      ['HD003456', '2026-08-20', '2026-03-10', '-163 ngày'],
    ]
  },
  uniqueness: {
    columns: ['MA_KH', 'CMND_CCCD', 'SO_LAN_TRUNG', 'HO_TEN'],
    rows: [
      ['KH0001234', '012345678901', '2', 'Nguyễn Văn A / Nguyễn Văn A (clone)'],
      ['KH0002345', '098765432101', '3', 'Trần Thị B (x3 bản ghi)'],
    ]
  },
  accuracy: {
    columns: ['MA_GD', 'MA_KH_TRONG_GD', 'TON_TAI_TRONG_KH', 'GHI_CHU'],
    rows: [
      ['GD20260328001', 'KH9999001', 'Không', 'KH không tồn tại'],
      ['GD20260328002', 'KH9999002', 'Không', 'KH đã bị xóa'],
      ['GD20260328003', 'KH9999003', 'Không', 'KH không tồn tại'],
    ]
  },
  timeliness: {
    columns: ['NGAY_BAO_CAO', 'GIO_CAP_NHAT', 'SLA_DEADLINE', 'TRE_HAN'],
    rows: [
      ['2026-03-28', '09:15:22', '08:00:00', '75 phút'],
      ['2026-03-27', '09:42:11', '08:00:00', '102 phút'],
      ['2026-03-26', '08:55:30', '08:00:00', '55 phút'],
    ]
  },
}

export function IssueDetail() {
  const { id } = useParams()
  const baseIssue = mockIssues.find(i => i.id === id) ?? mockIssues[0]
  const [comment, setComment] = useState('')
  const [assignee, setAssignee] = useState(baseIssue.assignedTo || '')
  const [status, setStatus] = useState(baseIssue.status)
  const [timeline, setTimeline] = useState(baseIssue.timeline)
  const [confirmClose, setConfirmClose] = useState(false)
  const issue = { ...baseIssue, assignedTo: assignee || undefined, status }

  const sampleData = SAMPLE_DATA[issue.dimension] ?? SAMPLE_DATA.validity

  const handleComment = () => {
    if (!comment.trim()) return
    setTimeline(prev => [...prev, {
      id: `e-${Date.now()}`, type: 'comment', user: 'Nguyễn Văn Admin',
      content: comment, timestamp: new Date().toISOString()
    }])
    setComment('')
  }

  const handleUpdate = () => {
    const now = new Date().toISOString()
    const events: typeof timeline = []
    if (assignee !== baseIssue.assignedTo) {
      events.push({ id: `e-${Date.now()}a`, type: 'assigned', user: 'Nguyễn Văn Admin', content: assignee ? `Gán cho ${assignee}` : 'Bỏ phân công', timestamp: now })
    }
    if (status !== baseIssue.status) {
      events.push({ id: `e-${Date.now()}s`, type: 'status_changed', user: 'Nguyễn Văn Admin', content: `Chuyển trạng thái sang "${status}"`, timestamp: now })
    }
    if (events.length > 0) setTimeline(prev => [...prev, ...events])
  }

  const handleCloseIssue = () => {
    setStatus('closed')
    setTimeline(prev => [...prev, {
      id: `e-${Date.now()}`, type: 'resolved', user: 'Nguyễn Văn Admin',
      content: 'Đóng vấn đề', timestamp: new Date().toISOString()
    }])
    setConfirmClose(false)
  }

  return (
    <div>
      <PageHeader
        title={issue.title}
        breadcrumbs={[{ label: 'Vấn đề & Sự cố', href: '/issues' }, { label: issue.id.toUpperCase() }]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={issue.severity} />
            <StatusBadge status={status} />
            <Button
              variant="destructive"
              size="sm"
              disabled={status === 'closed'}
              onClick={() => setConfirmClose(true)}
            >
              <XCircle className="h-4 w-4 mr-1" />Đóng vấn đề
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Left - 2/3 */}
        <div className="col-span-2 space-y-5">

          {/* Detail info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thông tin chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-4">
                <div className="flex gap-2"><span className="text-gray-500 w-36 shrink-0">Mã vấn đề:</span><span className="font-mono font-medium">{issue.id.toUpperCase()}</span></div>
                <div className="flex gap-2"><span className="text-gray-500 w-36 shrink-0">Phát hiện lúc:</span><span>{formatDateTime(issue.detectedAt)}</span></div>
                <div className="flex gap-2"><span className="text-gray-500 w-36 shrink-0">Bảng dữ liệu:</span>
                  <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-gray-400" />{issue.tableName}</span>
                </div>
                <div className="flex gap-2"><span className="text-gray-500 w-36 shrink-0">Chiều DL:</span><DimensionBadge dimension={issue.dimension} /></div>
                {issue.ruleName && (
                  <div className="flex gap-2"><span className="text-gray-500 w-36 shrink-0">Quy tắc vi phạm:</span>
                    <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-gray-400" />{issue.ruleName}</span>
                  </div>
                )}
                <div className="flex gap-2"><span className="text-gray-500 w-36 shrink-0">Mức độ:</span><StatusBadge status={issue.severity} /></div>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm text-gray-500 mb-1 font-medium">Mô tả vấn đề:</p>
                <p className="text-sm text-gray-700">{issue.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Sample data */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dữ liệu mẫu vi phạm</CardTitle>
              <p className="text-xs text-gray-500">Hiển thị một số bản ghi tiêu biểu có vấn đề</p>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{sampleData.columns.map(col => (
                    <th key={col} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide font-mono">{col}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {sampleData.rows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-red-50">
                      {row.map((cell, j) => (
                        <td key={j} className={cn('px-4 py-2.5 font-mono text-xs', cell === 'NULL' ? 'text-red-500 font-bold' : cell === 'Không' ? 'text-red-600' : 'text-gray-700')}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dòng thời gian xử lý</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((event, idx) => {
                  const { icon: Icon, color, bg } = EVENT_ICONS[event.type] ?? EVENT_ICONS.comment
                  return (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0', bg)}>
                          <Icon className={cn('h-4 w-4', color)} />
                        </div>
                        {idx < timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1 mb-0" style={{ minHeight: '16px' }} />}
                      </div>
                      <div className="pb-3 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-800">{event.user}</span>
                          <span className="text-xs text-gray-400">{formatDateTime(event.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{event.content}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Comment box */}
              <div className="border-t mt-2 pt-4">
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Thêm bình luận hoặc ghi chú xử lý..."
                  rows={3}
                  className="mb-2"
                />
                <div className="flex justify-end">
                  <Button onClick={handleComment} disabled={!comment.trim()} size="sm">
                    <Send className="h-3.5 w-3.5 mr-1.5" />Gửi bình luận
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right - 1/3 */}
        <div className="space-y-4">
          {/* Assignment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Phân công & Ưu tiên</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Gán cho</Label>
                <Select className="mt-1" value={assignee} onChange={e => setAssignee(e.target.value)}>
                  <option value="">Chưa gán</option>
                  {mockUsers.filter(u => u.role !== 'viewer').map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.team})</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label className="text-xs">Mức độ ưu tiên</Label>
                <Select className="mt-1" value={issue.severity}>
                  <option value="critical">Nghiêm trọng</option>
                  <option value="high">Cao</option>
                  <option value="medium">Trung bình</option>
                  <option value="low">Thấp</option>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Trạng thái</Label>
                <Select className="mt-1" value={status} onChange={e => setStatus(e.target.value as any)}>
                  <option value="new">Mới</option>
                  <option value="assigned">Đã gán</option>
                  <option value="in_progress">Đang xử lý</option>
                  <option value="pending_review">Chờ xét duyệt</option>
                  <option value="resolved">Đã giải quyết</option>
                  <option value="closed">Đóng</option>
                </Select>
              </div>
              <Button className="w-full" size="sm" onClick={handleUpdate}>Cập nhật</Button>
            </CardContent>
          </Card>

          {/* Timeline summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Thông tin thời gian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Phát hiện:</span>
                <span className="text-xs">{formatDateTime(issue.detectedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cập nhật cuối:</span>
                <span className="text-xs">{formatDateTime(timeline[timeline.length - 1]?.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Giải quyết:</span>
                {issue.resolvedAt
                  ? <span className="text-xs text-green-600">{formatDateTime(issue.resolvedAt)}</span>
                  : <span className="text-xs text-gray-400 italic">Chưa giải quyết</span>}
              </div>
              {issue.resolvedAt && (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-500">Thời gian XL:</span>
                  <span className="text-xs font-medium">
                    {Math.round((new Date(issue.resolvedAt).getTime() - new Date(issue.detectedAt).getTime()) / 3600000)} giờ
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related rule */}
          {issue.ruleName && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quy tắc liên quan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <Link to="/rules" className="text-sm text-blue-600 hover:underline font-medium">{issue.ruleName}</Link>
                    <div className="mt-1"><DimensionBadge dimension={issue.dimension} /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SLA info */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">SLA: 24 giờ (Nghiêm trọng)</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    {issue.resolvedAt ? 'Vấn đề đã được xử lý' : 'Cần xử lý trước ' + formatDateTime(new Date(new Date(issue.detectedAt).getTime() + 86400000).toISOString())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm close dialog */}
      <Dialog open={confirmClose} onClose={() => setConfirmClose(false)} title="Đóng vấn đề" size="sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-700">Bạn có chắc muốn đóng vấn đề này?</p>
            <p className="font-semibold text-gray-900 mt-0.5">{issue.title}</p>
            <p className="text-xs text-gray-500 mt-1">Trạng thái sẽ chuyển sang "Đóng". Hành động có thể xem lại nhưng không nên hoàn tác.</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={() => setConfirmClose(false)}>Hủy</Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleCloseIssue}>Xác nhận đóng</Button>
        </div>
      </Dialog>
    </div>
  )
}
