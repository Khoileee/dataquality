/**
 * Cấu hình toàn cục của demo DMP.
 * Đổi tên tool / người dùng trình bày ở đúng một chỗ này.
 */

export const APP = {
  name: 'DMP',
  tagline: 'Nền tảng Quản trị Dữ liệu',
  version: 'Demo 1.0',
  domain: 'dmp.vds.vn',
}

/** 5 vai trò theo tài liệu BDA — GĐ1 mục 2.3 */
export type RoleCode = 'owner' | 'bda' | 'de' | 'ops' | 'user'

export const ROLES: Record<RoleCode, { label: string; short: string; desc: string }> = {
  owner: {
    label: 'Người sở hữu dữ liệu',
    short: 'Data Owner',
    desc: 'Phê duyệt định nghĩa, phạm vi sử dụng và trách nhiệm quản lý dữ liệu.',
  },
  bda: {
    label: 'Đầu mối nghiệp vụ',
    short: 'BDA',
    desc: 'Cập nhật mô tả, thuật ngữ, công thức và quy tắc nghiệp vụ.',
  },
  de: {
    label: 'Đầu mối kỹ thuật',
    short: 'DE',
    desc: 'Cập nhật nguồn dữ liệu, cấu trúc bảng/cột, job và thông tin kỹ thuật.',
  },
  ops: {
    label: 'Đơn vị vận hành hệ thống',
    short: 'QTHT',
    desc: 'Quản lý người dùng, phân quyền, kết nối và vận hành hệ thống.',
  },
  user: {
    label: 'Người sử dụng dữ liệu',
    short: 'User',
    desc: 'Tra cứu, sử dụng và phản hồi khi thông tin chưa chính xác.',
  },
}

export type DemoUser = {
  id: string
  name: string
  initials: string
  unit: string
  role: RoleCode
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'nguyen.thi.phuong', name: 'Nguyễn Thị Phương', initials: 'NP', unit: 'Ban Kinh doanh', role: 'bda' },
  { id: 'tran.van.hung', name: 'Trần Văn Hùng', initials: 'TH', unit: 'Đội Dữ liệu', role: 'de' },
  { id: 'pham.thu.ha', name: 'Phạm Thu Hà', initials: 'PH', unit: 'Ban Tài chính', role: 'owner' },
  { id: 'le.minh.tuan', name: 'Lê Minh Tuấn', initials: 'LT', unit: 'Ban Sản phẩm', role: 'user' },
  { id: 'admin.he.thong', name: 'Quản trị hệ thống', initials: 'QT', unit: 'Trung tâm Hạ tầng', role: 'ops' },
]

export const DEFAULT_USER_ID = 'nguyen.thi.phuong'
