import {
  Search, Table2, Server, Cable, FileBarChart, Boxes, Network, Library,
  BookOpen, Tags, GitBranch, CheckCircle2, ListChecks,
  Ruler, Target, Microscope, Siren, BellRing,
  Workflow, Download, MonitorDot,
  Users, Lock, HandHelping, ScrollText, ClipboardList,
  FileCheck2, Archive, ShieldCheck,
  Fingerprint, Database, CopyCheck, Gem,
  HeartPulse, Settings2,
} from 'lucide-react'
import type { ComponentType } from 'react'

export type MenuItem = {
  code: string
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  /** menu bổ sung sau khi review đối chiếu yêu cầu BDA */
  isNew?: boolean
  /** giai đoạn BDA mà menu này phục vụ */
  phase: 'GĐ2' | 'GĐ3' | 'GĐ4' | 'GĐ5' | 'Nền tảng'
}

export type MenuSection = {
  id: string
  no: string
  title: string
  items: MenuItem[]
}

export const MENU: MenuSection[] = [
  {
    id: 'catalog',
    no: '①',
    title: 'DATA CATALOG',
    items: [
      { code: '1.1', label: 'Tìm kiếm toàn hệ thống', href: '/catalog/search', icon: Search, isNew: true, phase: 'GĐ2' },
      { code: '1.2', label: 'Bảng dữ liệu', href: '/catalog/tables', icon: Table2, phase: 'GĐ2' },
      { code: '1.3', label: 'Hệ thống & Nguồn dữ liệu', href: '/catalog/systems', icon: Server, isNew: true, phase: 'GĐ2' },
      { code: '1.4', label: 'Kênh trao đổi dữ liệu', href: '/catalog/channels', icon: Cable, isNew: true, phase: 'GĐ2' },
      { code: '1.5', label: 'Báo cáo & Chỉ tiêu', href: '/catalog/reports', icon: FileBarChart, isNew: true, phase: 'GĐ2' },
      { code: '1.6', label: 'Nhóm bảng', href: '/catalog/groups', icon: Boxes, phase: 'GĐ2' },
      { code: '1.7', label: 'Miền dữ liệu', href: '/catalog/domains', icon: Network, phase: 'GĐ2' },
      { code: '1.8', label: 'Danh mục tham chiếu', href: '/catalog/refdata', icon: Library, phase: 'GĐ2' },
    ],
  },
  {
    id: 'governance',
    no: '②',
    title: 'GOVERNANCE',
    items: [
      { code: '2.1', label: 'Từ điển nghiệp vụ', href: '/governance/glossary', icon: BookOpen, phase: 'GĐ2' },
      { code: '2.2', label: 'Phân loại & Nhãn', href: '/governance/classification', icon: Tags, phase: 'GĐ4' },
      { code: '2.3', label: 'Truy vết luồng dữ liệu', href: '/governance/lineage', icon: GitBranch, isNew: true, phase: 'GĐ2' },
      { code: '2.4', label: 'Phê duyệt & Phiên bản', href: '/governance/approvals', icon: CheckCircle2, isNew: true, phase: 'Nền tảng' },
      { code: '2.5', label: 'Tiêu chuẩn thông tin mô tả', href: '/governance/standard', icon: ListChecks, isNew: true, phase: 'GĐ2' },
    ],
  },
  {
    id: 'quality',
    no: '③',
    title: 'DATA QUALITY',
    items: [
      { code: '3.1', label: 'Thư viện luật', href: '/quality/rules', icon: Ruler, phase: 'GĐ3' },
      { code: '3.2', label: 'Luật & Kết quả', href: '/quality/board', icon: Target, phase: 'GĐ3' },
      { code: '3.3', label: 'Phân tích dữ liệu', href: '/quality/profiling', icon: Microscope, phase: 'GĐ3' },
      { code: '3.4', label: 'Sự cố chất lượng', href: '/quality/incidents', icon: Siren, phase: 'GĐ3' },
      { code: '3.5', label: 'Cảnh báo', href: '/quality/alerts', icon: BellRing, phase: 'GĐ3' },
    ],
  },
  {
    id: 'orchestration',
    no: '④',
    title: 'NẠP & ĐIỀU PHỐI',
    items: [
      { code: '4.1', label: 'Luồng xử lý (Job)', href: '/orchestration/jobs', icon: Workflow, phase: 'GĐ2' },
      { code: '4.2', label: 'Cửa nạp dữ liệu', href: '/ingestion/templates', icon: Download, phase: 'GĐ2' },
      { code: '4.3', label: 'Theo dõi & Pipeline', href: '/orchestration/monitor', icon: MonitorDot, phase: 'GĐ3' },
    ],
  },
  {
    id: 'security',
    no: '⑤',
    title: 'DATA SECURITY',
    items: [
      { code: '5.1', label: 'Người dùng & Nhóm', href: '/security/users', icon: Users, phase: 'Nền tảng' },
      { code: '5.2', label: 'Chính sách truy cập', href: '/security/policies', icon: Lock, phase: 'GĐ4' },
      { code: '5.3', label: 'Yêu cầu cấp quyền', href: '/security/requests', icon: HandHelping, phase: 'GĐ4' },
      { code: '5.4', label: 'Nhật ký kiểm toán', href: '/security/audit', icon: ScrollText, phase: 'GĐ4' },
      { code: '5.5', label: 'Báo cáo quyền & Giám sát', href: '/security/report', icon: ClipboardList, phase: 'GĐ4' },
    ],
  },
  {
    id: 'compliance',
    no: '⑥',
    title: 'CHÍNH SÁCH & TUÂN THỦ',
    items: [
      { code: '6.1', label: 'Chính sách dữ liệu', href: '/compliance/policies', icon: FileCheck2, isNew: true, phase: 'GĐ4' },
      { code: '6.2', label: 'Vòng đời & Lưu trữ', href: '/compliance/lifecycle', icon: Archive, isNew: true, phase: 'GĐ4' },
      { code: '6.3', label: 'Đánh giá tuân thủ', href: '/compliance/assessments', icon: ShieldCheck, isNew: true, phase: 'GĐ4' },
    ],
  },
  {
    id: 'mdm',
    no: '⑦',
    title: 'DỮ LIỆU CHỦ (MDM)',
    items: [
      { code: '7.1', label: 'Mô hình dữ liệu chủ', href: '/mdm/models', icon: Fingerprint, isNew: true, phase: 'GĐ5' },
      { code: '7.2', label: 'Bản ghi nguồn', href: '/mdm/sources', icon: Database, isNew: true, phase: 'GĐ5' },
      { code: '7.3', label: 'Nghi ngờ trùng & Hợp nhất', href: '/mdm/duplicates', icon: CopyCheck, isNew: true, phase: 'GĐ5' },
      { code: '7.4', label: 'Bản ghi chuẩn & Phân phối', href: '/mdm/golden', icon: Gem, isNew: true, phase: 'GĐ5' },
    ],
  },
  {
    id: 'operations',
    no: '⑧',
    title: 'OPERATIONS',
    items: [
      { code: '8.1', label: 'Sức khoẻ dữ liệu', href: '/operations/health', icon: HeartPulse, phase: 'Nền tảng' },
      { code: '8.2', label: 'Cấu hình hệ thống', href: '/operations/settings', icon: Settings2, phase: 'Nền tảng' },
    ],
  },
]

export const ALL_MENU_ITEMS: MenuItem[] = MENU.flatMap(s => s.items)

export const MENU_COUNT = ALL_MENU_ITEMS.length
