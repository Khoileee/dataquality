import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/common/Overlay'

/**
 * Hành vi lưu dùng chung cho toàn demo:
 * hiện thông báo thành công rồi quay lại màn danh sách. Không lưu dữ liệu thật.
 */
export function useDemoSave(backTo: string) {
  const nav = useNavigate()
  const toast = useToast()
  return (msg = 'Đã lưu', detail = 'Bản demo không ghi dữ liệu — danh sách giữ nguyên.') => {
    toast.success(msg, detail)
    setTimeout(() => nav(backTo), 700)
  }
}

export const fmtDate = (s: string) => s
export const daysAgo = (n: number) => `${n} ngày trước`

/** Chuẩn hoá không dấu để lọc phía client */
export const norm = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')

export const match = (haystack: string, q: string) => !q.trim() || norm(haystack).includes(norm(q))
