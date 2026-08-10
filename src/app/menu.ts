import {
  Table2, Server, FileBarChart, Network, Library,
  BookOpen, Tags, GitBranch, CheckCircle2,
  Ruler, Target, Siren, BellRing,
  Workflow, Download, MonitorDot,
  Users, Lock, HandHelping, ScrollText,
  FileCheck2, Archive, ShieldCheck,
  Fingerprint, Gem,
  HeartPulse, Settings2,
} from 'lucide-react'
import type { ComponentType } from 'react'

/**
 * Nhóm vai trò — quyết định người dùng phải làm gì với menu này.
 * Xem tài liệu DMP-Tong-quan-1-trang.md.
 */
export type MenuRole =
  | 'nen-mong'   // 🟦 khai một lần lúc thiết lập
  | 'trung-tam'  // 🟩 mở hằng ngày
  | 'khai'       // 🟨 khai khi phát sinh
  | 'hang-cho'   // 🟪 hệ thống đẩy việc tới, người xử lý
  | 'xem'        // ⬜ chỉ đọc, không khai gì

export const ROLE_META: Record<MenuRole, { label: string; dot: string; bar: string }> = {
  'nen-mong':  { label: 'Nền móng — khai một lần',       dot: 'bg-sky-400',     bar: 'bg-sky-400' },
  'trung-tam': { label: 'Trung tâm — dùng hằng ngày',    dot: 'bg-emerald-400', bar: 'bg-emerald-400' },
  'khai':      { label: 'Khai khi phát sinh',            dot: 'bg-amber-400',   bar: 'bg-amber-400' },
  'hang-cho':  { label: 'Hàng chờ việc — có việc cần làm', dot: 'bg-violet-400', bar: 'bg-violet-400' },
  'xem':       { label: 'Chỉ để xem',                    dot: 'bg-slate-300',   bar: 'bg-slate-300' },
}

export type MenuItem = {
  code: string
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  /** menu bổ sung sau khi review đối chiếu yêu cầu BDA */
  isNew?: boolean
  /** giai đoạn BDA mà menu này phục vụ */
  phase: 'GĐ2' | 'GĐ3' | 'GĐ4' | 'GĐ5' | 'Nền tảng'
  /** nhóm vai trò — dùng để tô màu lề trái và giải thích trên thanh điều hướng */
  role: MenuRole
  /** khoá đếm việc đang chờ, hiển thị số bên phải nhãn menu */
  countKey?: 'approvals' | 'incidents' | 'requests' | 'assessments' | 'duplicates' | 'lifecycle'
}

export type MenuSection = {
  id: string
  no: string
  title: string
  items: MenuItem[]
}

/**
 * KIẾN TRÚC CHỐT — 8 module · 27 menu.
 * Xem tài liệu DMP-Kien-truc-CHOT.md (bảng ánh xạ 35 menu cũ → vị trí mới).
 *
 * Tám menu cũ đã chuyển thành tab hoặc chức năng, KHÔNG mất màn nào:
 *   1.1 Tìm kiếm            → thanh tìm kiếm trên đầu trang (Topbar)
 *   1.4 Kênh trao đổi       → 1.2 › tab Kênh trao đổi
 *   1.6 Nhóm bảng           → 1.1 › nút Tạo nhóm
 *   2.5 Tiêu chuẩn mô tả    → 8.2 › tab Tiêu chuẩn thông tin mô tả
 *   3.3 Phân tích dữ liệu   → 1.1 › tab Cột
 *   5.5 Báo cáo quyền       → 5.2 › tab Báo cáo quyền
 *   7.2 Bản ghi nguồn       → 7.2 Dữ liệu chủ › tab Bản ghi nguồn
 *   7.4 Bản ghi chuẩn       → 7.2 Dữ liệu chủ › tab Bản ghi chuẩn
 */
export const MENU: MenuSection[] = [
  {
    id: 'catalog',
    no: '①',
    title: 'DATA CATALOG',
    items: [
      { code: '1.1', label: 'Bảng dữ liệu', href: '/catalog/tables', icon: Table2, phase: 'GĐ2', role: 'trung-tam' },
      { code: '1.2', label: 'Hệ thống & Nguồn dữ liệu', href: '/catalog/systems', icon: Server, isNew: true, phase: 'GĐ2', role: 'nen-mong' },
      { code: '1.3', label: 'Báo cáo & Chỉ tiêu', href: '/catalog/reports', icon: FileBarChart, isNew: true, phase: 'GĐ2', role: 'khai' },
      { code: '1.4', label: 'Miền dữ liệu', href: '/catalog/domains', icon: Network, phase: 'GĐ2', role: 'nen-mong' },
      { code: '1.5', label: 'Danh mục tham chiếu', href: '/catalog/refdata', icon: Library, phase: 'GĐ2', role: 'nen-mong' },
    ],
  },
  {
    id: 'governance',
    no: '②',
    title: 'GOVERNANCE',
    items: [
      { code: '2.1', label: 'Từ điển nghiệp vụ', href: '/governance/glossary', icon: BookOpen, phase: 'GĐ2', role: 'khai' },
      { code: '2.2', label: 'Phân loại & Nhãn', href: '/governance/classification', icon: Tags, phase: 'GĐ4', role: 'khai' },
      { code: '2.3', label: 'Truy vết luồng dữ liệu', href: '/governance/lineage', icon: GitBranch, isNew: true, phase: 'GĐ2', role: 'xem' },
      { code: '2.4', label: 'Phê duyệt & Phiên bản', href: '/governance/approvals', icon: CheckCircle2, isNew: true, phase: 'Nền tảng', role: 'hang-cho', countKey: 'approvals' },
    ],
  },
  {
    id: 'quality',
    no: '③',
    title: 'DATA QUALITY',
    items: [
      { code: '3.1', label: 'Thư viện luật', href: '/quality/rules', icon: Ruler, phase: 'GĐ3', role: 'nen-mong' },
      { code: '3.2', label: 'Luật & Kết quả', href: '/quality/board', icon: Target, phase: 'GĐ3', role: 'khai' },
      { code: '3.3', label: 'Sự cố chất lượng', href: '/quality/incidents', icon: Siren, phase: 'GĐ3', role: 'hang-cho', countKey: 'incidents' },
      { code: '3.4', label: 'Cảnh báo', href: '/quality/alerts', icon: BellRing, phase: 'GĐ3', role: 'khai' },
    ],
  },
  {
    id: 'orchestration',
    no: '④',
    title: 'NẠP & ĐIỀU PHỐI',
    items: [
      { code: '4.1', label: 'Luồng xử lý (Job)', href: '/orchestration/jobs', icon: Workflow, phase: 'GĐ2', role: 'khai' },
      { code: '4.2', label: 'Cửa nạp dữ liệu', href: '/ingestion/templates', icon: Download, phase: 'GĐ2', role: 'khai' },
      { code: '4.3', label: 'Theo dõi & Pipeline', href: '/orchestration/monitor', icon: MonitorDot, phase: 'GĐ3', role: 'xem' },
    ],
  },
  {
    id: 'security',
    no: '⑤',
    title: 'DATA SECURITY',
    items: [
      { code: '5.1', label: 'Người dùng & Nhóm', href: '/security/users', icon: Users, phase: 'Nền tảng', role: 'nen-mong' },
      { code: '5.2', label: 'Chính sách truy cập', href: '/security/policies', icon: Lock, phase: 'GĐ4', role: 'khai' },
      { code: '5.3', label: 'Yêu cầu cấp quyền', href: '/security/requests', icon: HandHelping, phase: 'GĐ4', role: 'hang-cho', countKey: 'requests' },
      { code: '5.4', label: 'Nhật ký kiểm toán', href: '/security/audit', icon: ScrollText, phase: 'GĐ4', role: 'xem' },
    ],
  },
  {
    id: 'compliance',
    no: '⑥',
    title: 'CHÍNH SÁCH & TUÂN THỦ',
    items: [
      { code: '6.1', label: 'Chính sách dữ liệu', href: '/compliance/policies', icon: FileCheck2, isNew: true, phase: 'GĐ4', role: 'khai' },
      { code: '6.2', label: 'Vòng đời & Lưu trữ', href: '/compliance/lifecycle', icon: Archive, isNew: true, phase: 'GĐ4', role: 'hang-cho', countKey: 'lifecycle' },
      { code: '6.3', label: 'Đánh giá tuân thủ', href: '/compliance/assessments', icon: ShieldCheck, isNew: true, phase: 'GĐ4', role: 'hang-cho', countKey: 'assessments' },
    ],
  },
  {
    id: 'mdm',
    no: '⑦',
    title: 'DỮ LIỆU CHỦ (MDM)',
    items: [
      { code: '7.1', label: 'Mô hình dữ liệu chủ', href: '/mdm/models', icon: Fingerprint, isNew: true, phase: 'GĐ5', role: 'khai' },
      { code: '7.2', label: 'Dữ liệu chủ', href: '/mdm/records', icon: Gem, isNew: true, phase: 'GĐ5', role: 'hang-cho', countKey: 'duplicates' },
    ],
  },
  {
    id: 'operations',
    no: '⑧',
    title: 'OPERATIONS',
    items: [
      { code: '8.1', label: 'Sức khoẻ dữ liệu', href: '/operations/health', icon: HeartPulse, phase: 'Nền tảng', role: 'xem' },
      { code: '8.2', label: 'Cấu hình hệ thống', href: '/operations/settings', icon: Settings2, phase: 'Nền tảng', role: 'nen-mong' },
    ],
  },
]

export const ALL_MENU_ITEMS: MenuItem[] = MENU.flatMap(s => s.items)

export const MENU_COUNT = ALL_MENU_ITEMS.length
