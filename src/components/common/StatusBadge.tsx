import { Badge } from '@/components/ui/badge'

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'outline' | 'secondary' | 'destructive' | 'success' | 'warning' }> = {
  pass: { label: 'Đạt', variant: 'success' },
  warning: { label: 'Cảnh báo', variant: 'warning' },
  fail: { label: 'Không đạt', variant: 'destructive' },
  error: { label: 'Lỗi', variant: 'secondary' },
  pending: { label: 'Chờ xử lý', variant: 'default' },
  active: { label: 'Hoạt động', variant: 'success' },
  inactive: { label: 'Không HĐ', variant: 'secondary' },
  draft: { label: 'Nháp', variant: 'outline' },
  new: { label: 'Mới', variant: 'default' },
  assigned: { label: 'Đã gán', variant: 'default' },
  in_progress: { label: 'Đang xử lý', variant: 'warning' },
  pending_review: { label: 'Chờ duyệt', variant: 'warning' },
  resolved: { label: 'Đã xử lý', variant: 'success' },
  closed: { label: 'Đã đóng', variant: 'secondary' },
  critical: { label: 'Nghiêm trọng', variant: 'destructive' },
  high: { label: 'Cao', variant: 'warning' },
  medium: { label: 'Trung bình', variant: 'default' },
  low: { label: 'Thấp', variant: 'secondary' },
  waiting_data: { label: 'Chờ dữ liệu', variant: 'warning' },
  revalidating: { label: 'Đang kiểm tra', variant: 'default' },
  paused: { label: 'Tạm dừng', variant: 'warning' },
  running: { label: 'Đang chạy', variant: 'default' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  failed: { label: 'Thất bại', variant: 'destructive' },
  success: { label: 'Thành công', variant: 'success' },
  partial: { label: 'Một phần', variant: 'warning' },
  realtime: { label: 'Realtime', variant: 'default' },
  hourly: { label: 'Hàng giờ', variant: 'default' },
  daily: { label: 'Hàng ngày', variant: 'secondary' },
  weekly: { label: 'Hàng tuần', variant: 'secondary' },
  monthly: { label: 'Hàng tháng', variant: 'outline' },
  custom: { label: 'Tùy chỉnh', variant: 'outline' },
  database: { label: 'Database', variant: 'default' },
  sql: { label: 'SQL View', variant: 'secondary' },
  file: { label: 'File', variant: 'outline' },
  api: { label: 'API', variant: 'warning' },
  email: { label: 'Email', variant: 'default' },
  sms: { label: 'SMS', variant: 'warning' },
  webhook: { label: 'Webhook', variant: 'secondary' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'secondary' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
