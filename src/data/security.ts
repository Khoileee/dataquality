import type { UserRow, GroupAcl, PolicyRow, AccessRequest, AuditRow, AccessAnomaly } from './types'

/* ═══════════════ 5.1 Người dùng & Nhóm ═══════════════ */

export const users: UserRow[] = [
  { id: 'U-001', account: 'phuong.nt', name: 'Nguyễn Thị Phương', unit: 'Ban Kinh doanh', role: 'Đầu mối nghiệp vụ', groups: ['G-DOISOAT', 'G-BDA'], userTags: ['Nội bộ', 'Được xem dữ liệu Mật'], tableGrants: 184, status: 'Hoạt động', lastLogin: '2026-08-09 08:12', employed: true },
  { id: 'U-002', account: 'hung.tv', name: 'Trần Văn Hùng', unit: 'Đội Dữ liệu', role: 'Đầu mối kỹ thuật', groups: ['G-DE', 'G-DOISOAT'], userTags: ['Nội bộ', 'Quản trị kỹ thuật'], tableGrants: 2_418, status: 'Hoạt động', lastLogin: '2026-08-09 09:40', employed: true },
  { id: 'U-003', account: 'ha.pt', name: 'Phạm Thu Hà', unit: 'Ban Tài chính', role: 'Người sở hữu dữ liệu', groups: ['G-OWNER', 'G-TAICHINH'], userTags: ['Nội bộ', 'Được xem dữ liệu Hạn chế'], tableGrants: 642, status: 'Hoạt động', lastLogin: '2026-08-09 07:55', employed: true },
  { id: 'U-004', account: 'tuan.lm', name: 'Lê Minh Tuấn', unit: 'Ban Sản phẩm', role: 'Người sử dụng dữ liệu', groups: ['G-SANPHAM'], userTags: ['Nội bộ'], tableGrants: 48, status: 'Hoạt động', lastLogin: '2026-08-08 16:22', employed: true },
  { id: 'U-005', account: 'vinh.dq', name: 'Đỗ Quang Vinh', unit: 'Ban Quản lý Rủi ro', role: 'Đầu mối kỹ thuật', groups: ['G-DE', 'G-RUIRO'], userTags: ['Nội bộ', 'Được xem dữ liệu Mật'], tableGrants: 312, status: 'Hoạt động', lastLogin: '2026-08-09 06:30', employed: true },
  { id: 'U-006', account: 'admin.sys', name: 'Quản trị hệ thống', unit: 'Trung tâm Hạ tầng', role: 'Đơn vị vận hành hệ thống', groups: ['G-ADMIN'], userTags: ['Quản trị hệ thống'], tableGrants: 11_482, status: 'Hoạt động', lastLogin: '2026-08-09 09:58', employed: true },
  { id: 'U-007', account: 'nam.pv', name: 'Phan Văn Nam', unit: 'Ban Kinh doanh', role: 'Người sử dụng dữ liệu', groups: ['G-BDA'], userTags: ['Nội bộ'], tableGrants: 26, status: 'Đã nghỉ việc — chưa khoá', lastLogin: '2026-03-14 17:02', employed: false },
  { id: 'U-008', account: 'lan.nt', name: 'Nguyễn Thị Lan', unit: 'Trung tâm Vận hành', role: 'Người sử dụng dữ liệu', groups: ['G-VANHANH'], userTags: ['Nội bộ'], tableGrants: 18, status: 'Đã nghỉ việc — chưa khoá', lastLogin: '2026-01-28 11:40', employed: false },
  { id: 'U-009', account: 'binh.lt', name: 'Lý Thanh Bình', unit: 'Đội Dữ liệu', role: 'Đầu mối kỹ thuật', groups: ['G-DE'], userTags: ['Nội bộ'], tableGrants: 88, status: 'Đã nghỉ việc — chưa khoá', lastLogin: '2025-11-06 09:14', employed: false },
  { id: 'U-010', account: 'mai.hh', name: 'Hoàng Hồng Mai', unit: 'Ban Tài chính', role: 'Người sử dụng dữ liệu', groups: ['G-TAICHINH'], userTags: ['Nội bộ'], tableGrants: 34, status: 'Hoạt động', lastLogin: '2026-08-07 14:18', employed: true },
  { id: 'U-011', account: 'son.nh', name: 'Ngô Hoài Sơn', unit: 'Ban Quản lý Rủi ro', role: 'Người sử dụng dữ liệu', groups: ['G-RUIRO'], userTags: ['Nội bộ', 'Được xem dữ liệu Mật'], tableGrants: 62, status: 'Hoạt động', lastLogin: '2026-08-06 10:02', employed: true },
  { id: 'U-012', account: 'thao.dt', name: 'Đinh Thị Thảo', unit: 'Phòng Phân tích Dữ liệu', role: 'Đầu mối nghiệp vụ', groups: ['G-BDA'], userTags: ['Nội bộ'], tableGrants: 128, status: 'Đã khoá', lastLogin: '2026-05-30 15:44', employed: false },
]

export const MENU_RIGHT_MATRIX_MENUS = [
  'Bảng dữ liệu', 'Báo cáo & Chỉ tiêu', 'Từ điển nghiệp vụ', 'Phân loại & Nhãn',
  'Luật & Kết quả', 'Sự cố chất lượng', 'Luồng xử lý (Job)', 'Chính sách truy cập',
  'Chính sách dữ liệu', 'Dữ liệu chủ', 'Sức khoẻ dữ liệu',
]

export const groupAcls: GroupAcl[] = [
  {
    id: 'G-OWNER', name: 'Người sở hữu dữ liệu', memberCount: 12, description: 'Phê duyệt định nghĩa, phân loại và cấp quyền',
    menuRights: {
      'Bảng dữ liệu': 'Xem·Sửa·Duyệt', 'Báo cáo & Chỉ tiêu': 'Xem·Sửa·Duyệt', 'Từ điển nghiệp vụ': 'Xem·Duyệt',
      'Phân loại & Nhãn': 'Xem·Duyệt', 'Luật & Kết quả': 'Xem·Duyệt', 'Sự cố chất lượng': 'Xem·Duyệt',
      'Luồng xử lý (Job)': 'Xem', 'Chính sách truy cập': 'Xem·Duyệt', 'Chính sách dữ liệu': 'Xem·Duyệt',
      'Dữ liệu chủ': 'Xem·Duyệt', 'Sức khoẻ dữ liệu': 'Xem',
    },
  },
  {
    id: 'G-BDA', name: 'Đầu mối nghiệp vụ', memberCount: 48, description: 'Cập nhật mô tả, thuật ngữ, công thức, quy tắc nghiệp vụ',
    menuRights: {
      'Bảng dữ liệu': 'Xem·Sửa', 'Báo cáo & Chỉ tiêu': 'Xem·Sửa', 'Từ điển nghiệp vụ': 'Xem·Sửa',
      'Phân loại & Nhãn': 'Xem', 'Luật & Kết quả': 'Xem·Sửa', 'Sự cố chất lượng': 'Xem·Sửa',
      'Luồng xử lý (Job)': 'Xem', 'Chính sách truy cập': 'Xem', 'Chính sách dữ liệu': 'Xem',
      'Dữ liệu chủ': 'Xem·Sửa', 'Sức khoẻ dữ liệu': 'Xem',
    },
  },
  {
    id: 'G-DE', name: 'Đầu mối kỹ thuật', memberCount: 26, description: 'Cập nhật cấu trúc, nguồn dữ liệu, job và thông tin kỹ thuật',
    menuRights: {
      'Bảng dữ liệu': 'Xem·Sửa', 'Báo cáo & Chỉ tiêu': 'Xem', 'Từ điển nghiệp vụ': 'Xem',
      'Phân loại & Nhãn': 'Xem·Sửa', 'Luật & Kết quả': 'Xem·Sửa', 'Sự cố chất lượng': 'Xem·Sửa',
      'Luồng xử lý (Job)': 'Xem·Sửa', 'Chính sách truy cập': 'Xem', 'Chính sách dữ liệu': 'Xem',
      'Dữ liệu chủ': 'Xem', 'Sức khoẻ dữ liệu': 'Xem',
    },
  },
  {
    id: 'G-ADMIN', name: 'Đơn vị vận hành hệ thống', memberCount: 6, description: 'Quản lý người dùng, phân quyền, kết nối, vận hành',
    menuRights: {
      'Bảng dữ liệu': 'Xem', 'Báo cáo & Chỉ tiêu': 'Xem', 'Từ điển nghiệp vụ': 'Xem',
      'Phân loại & Nhãn': 'Xem', 'Luật & Kết quả': 'Xem', 'Sự cố chất lượng': 'Xem',
      'Luồng xử lý (Job)': 'Xem·Sửa', 'Chính sách truy cập': 'Xem·Sửa·Duyệt', 'Chính sách dữ liệu': 'Xem·Sửa',
      'Dữ liệu chủ': 'Xem', 'Sức khoẻ dữ liệu': 'Xem',
    },
  },
  {
    id: 'G-USER', name: 'Người sử dụng dữ liệu', memberCount: 412, description: 'Tra cứu và sử dụng dữ liệu trong phạm vi được cấp',
    menuRights: {
      'Bảng dữ liệu': 'Xem', 'Báo cáo & Chỉ tiêu': 'Xem', 'Từ điển nghiệp vụ': 'Xem',
      'Phân loại & Nhãn': '—', 'Luật & Kết quả': 'Xem', 'Sự cố chất lượng': 'Xem',
      'Luồng xử lý (Job)': '—', 'Chính sách truy cập': '—', 'Chính sách dữ liệu': 'Xem',
      'Dữ liệu chủ': 'Xem', 'Sức khoẻ dữ liệu': 'Xem',
    },
  },
]

/* ═══════════════ 5.2 Chính sách truy cập ═══════════════ */

export const policies: PolicyRow[] = [
  { id: 'CS-1001', kind: 'Quyền dữ liệu', subject: 'G-DOISOAT — Nhóm Đối soát', subjectType: 'Nhóm', scopeLevel: 'Nhóm bảng', scope: 'NB-01 — Đối soát giao dịch', right: 'Đọc', excludedColumns: ['so_cccd'], maskType: null, rowFilter: null, expiry: 'Vô thời hạn', source: 'Thủ công', sourceRef: null, status: 'Đang hiệu lực', createdAt: '2025-11-04', createdBy: 'Quản trị hệ thống' },
  { id: 'CS-1002', kind: 'Quyền dữ liệu', subject: 'Lê Minh Tuấn', subjectType: 'Người dùng', scopeLevel: 'Bảng', scope: 'bi.doi_soat_giao_dich_A', right: 'Đọc', excludedColumns: ['so_dien_thoai', 'so_cccd'], maskType: null, rowFilter: null, expiry: '2026-11-09', source: 'Yêu cầu cấp quyền', sourceRef: 'YC-0231', status: 'Đang hiệu lực', createdAt: '2026-08-09', createdBy: 'Phạm Thu Hà' },
  { id: 'CS-1003', kind: 'Quyền dữ liệu', subject: 'G-TAICHINH — Ban Tài chính', subjectType: 'Nhóm', scopeLevel: 'Miền', scope: 'Tài chính', right: 'Đọc', excludedColumns: [], maskType: null, rowFilter: null, expiry: 'Vô thời hạn', source: 'Đồng bộ AD', sourceRef: null, status: 'Đang hiệu lực', createdAt: '2025-06-12', createdBy: 'Quản trị hệ thống' },
  { id: 'CS-1004', kind: 'Quyền dữ liệu', subject: 'Phan Văn Nam', subjectType: 'Người dùng', scopeLevel: 'Nhóm bảng', scope: 'NB-02 — Dữ liệu khách hàng', right: 'Đọc', excludedColumns: [], maskType: null, rowFilter: null, expiry: 'Vô thời hạn', source: 'Thủ công', sourceRef: null, status: 'Đang hiệu lực', createdAt: '2024-08-20', createdBy: 'Quản trị hệ thống' },
  { id: 'CS-1005', kind: 'Quyền dữ liệu', subject: 'G-ADMIN', subjectType: 'Nhóm', scopeLevel: 'Toàn hệ thống', scope: 'Toàn bộ 11.482 bảng', right: 'Đọc · Ghi', excludedColumns: [], maskType: null, rowFilter: null, expiry: 'Vô thời hạn', source: 'Thủ công', sourceRef: null, status: 'Đang hiệu lực', createdAt: '2024-01-01', createdBy: 'Quản trị hệ thống' },

  { id: 'CS-2001', kind: 'Che dữ liệu', subject: 'Mọi người trừ G-OWNER', subjectType: 'Vai trò', scopeLevel: 'Nhãn', scope: 'PII_PHONE — 58 cột', right: '—', excludedColumns: [], maskType: 'Giữ 4 ký tự cuối', rowFilter: null, expiry: 'Vô thời hạn', source: 'Kế thừa nhãn', sourceRef: 'PII_PHONE', status: 'Đang hiệu lực', createdAt: '2026-08-09', createdBy: 'Nguyễn Thị Phương' },
  { id: 'CS-2002', kind: 'Che dữ liệu', subject: 'Mọi người trừ G-OWNER', subjectType: 'Vai trò', scopeLevel: 'Nhãn', scope: 'PII_ID — 46 cột', right: '—', excludedColumns: [], maskType: 'Che toàn bộ', rowFilter: null, expiry: 'Vô thời hạn', source: 'Kế thừa nhãn', sourceRef: 'PII_ID', status: 'Đang hiệu lực', createdAt: '2026-08-09', createdBy: 'Nguyễn Thị Phương' },
  { id: 'CS-2003', kind: 'Che dữ liệu', subject: 'G-USER', subjectType: 'Nhóm', scopeLevel: 'Nhãn', scope: 'PII_EMAIL — 62 cột', right: '—', excludedColumns: [], maskType: 'Che phần trước @', rowFilter: null, expiry: 'Vô thời hạn', source: 'Kế thừa nhãn', sourceRef: 'PII_EMAIL', status: 'Đang hiệu lực', createdAt: '2026-08-09', createdBy: 'Nguyễn Thị Phương' },
  { id: 'CS-2004', kind: 'Che dữ liệu', subject: 'G-SANPHAM', subjectType: 'Nhóm', scopeLevel: 'Cột', scope: 'crm.khach_hang.ho_ten', right: '—', excludedColumns: [], maskType: 'Giữ ký tự đầu', rowFilter: null, expiry: '2026-12-31', source: 'Thủ công', sourceRef: null, status: 'Đang hiệu lực', createdAt: '2026-08-08', createdBy: 'Phạm Thu Hà' },

  { id: 'CS-3001', kind: 'Lọc theo dòng', subject: 'G-VANHANH — theo chi nhánh', subjectType: 'Nhóm', scopeLevel: 'Bảng', scope: 'bi.doi_soat_giao_dich_A', right: '—', excludedColumns: [], maskType: null, rowFilter: "ma_tinh_thanh IN (${user.tinh_thanh_phu_trach})", expiry: 'Vô thời hạn', source: 'Thủ công', sourceRef: null, status: 'Đang hiệu lực', createdAt: '2026-08-07', createdBy: 'Quản trị hệ thống' },
  { id: 'CS-3002', kind: 'Lọc theo dòng', subject: 'G-BDA', subjectType: 'Nhóm', scopeLevel: 'Bảng', scope: 'crm.khach_hang', right: '—', excludedColumns: [], maskType: null, rowFilter: "trang_thai = 'ACTIVE'", expiry: 'Vô thời hạn', source: 'Thủ công', sourceRef: null, status: 'Đang hiệu lực', createdAt: '2026-07-20', createdBy: 'Phạm Thu Hà' },
  { id: 'CS-3003', kind: 'Lọc theo dòng', subject: 'G-RUIRO', subjectType: 'Nhóm', scopeLevel: 'Bảng', scope: 'rr.diem_rui_ro_kh', right: '—', excludedColumns: [], maskType: null, rowFilter: '${user.don_vi} = don_vi_quan_ly', expiry: '2027-01-01', source: 'Thủ công', sourceRef: null, status: 'Đang hiệu lực', createdAt: '2026-05-02', createdBy: 'Đỗ Quang Vinh' },

  { id: 'CS-4001', kind: 'Hạn chế tải xuống', subject: 'Mọi người trừ G-OWNER', subjectType: 'Vai trò', scopeLevel: 'Toàn hệ thống', scope: 'Mọi đối tượng mức Hạn chế truy cập', right: 'Cấm tải xuống', excludedColumns: [], maskType: null, rowFilter: null, expiry: 'Vô thời hạn', source: 'Kế thừa nhãn', sourceRef: 'Hạn chế truy cập', status: 'Đang hiệu lực', createdAt: '2026-08-09', createdBy: 'Nguyễn Thị Phương' },
  { id: 'CS-4002', kind: 'Hạn chế tải xuống', subject: 'G-USER', subjectType: 'Nhóm', scopeLevel: 'Toàn hệ thống', scope: 'Mọi đối tượng mức Mật', right: 'Tải xuống cần phê duyệt riêng', excludedColumns: [], maskType: null, rowFilter: null, expiry: 'Vô thời hạn', source: 'Kế thừa nhãn', sourceRef: 'Mật', status: 'Đang hiệu lực', createdAt: '2026-08-09', createdBy: 'Nguyễn Thị Phương' },

  { id: 'CS-1006', kind: 'Quyền dữ liệu', subject: 'Nguyễn Thị Lan', subjectType: 'Người dùng', scopeLevel: 'Bảng', scope: 'crm.khach_hang', right: 'Đọc', excludedColumns: [], maskType: null, rowFilter: null, expiry: '2026-06-30', source: 'Yêu cầu cấp quyền', sourceRef: 'YC-0184', status: 'Hết hạn', createdAt: '2025-12-30', createdBy: 'Phạm Thu Hà' },
  { id: 'CS-1007', kind: 'Quyền dữ liệu', subject: 'Đinh Thị Thảo', subjectType: 'Người dùng', scopeLevel: 'Miền', scope: 'Khách hàng', right: 'Đọc', excludedColumns: [], maskType: null, rowFilter: null, expiry: '—', source: 'Thủ công', sourceRef: null, status: 'Đã thu hồi', createdAt: '2025-04-18', createdBy: 'Quản trị hệ thống' },
]

export const POLICY_PRECEDENCE = [
  { level: 1, name: 'Chính sách theo cột cụ thể', note: 'Ưu tiên cao nhất — ghi đè mọi chính sách khác' },
  { level: 2, name: 'Chính sách theo nhãn dữ liệu nhạy cảm', note: 'Áp cho mọi cột mang nhãn' },
  { level: 3, name: 'Chính sách theo mức phân loại', note: 'Áp cho mọi đối tượng ở mức đó' },
  { level: 4, name: 'Chính sách theo nhóm bảng / miền', note: 'Mức rộng nhất — dùng làm nền' },
]

/* ═══════════════ 5.3 Yêu cầu cấp quyền ═══════════════ */

export const accessRequests: AccessRequest[] = [
  { id: 'YC-0231', requester: 'Lê Minh Tuấn', requesterUnit: 'Ban Sản phẩm', objectType: 'Bảng', objectId: 'bi.doi_soat_giao_dich_A', right: 'Đọc', reason: 'Cần phân tích tỷ lệ lệch đối soát theo sản phẩm để đề xuất cải tiến quy trình thanh toán trong quý 3.', purpose: 'Phân tích nghiệp vụ', wantFrom: '2026-08-09', wantTo: '2026-11-09', approver: 'Phạm Thu Hà', status: 'Chờ phê duyệt', createdAt: '2026-08-08 14:20', waitingDays: 1, decisionNote: null, grantedLevel: null },
  { id: 'YC-0230', requester: 'Hoàng Hồng Mai', requesterUnit: 'Ban Tài chính', objectType: 'Bảng', objectId: 'fin.chi_phi_van_hanh', right: 'Đọc', reason: 'Lập báo cáo chi phí quý theo yêu cầu của Ban lãnh đạo, cần truy cập chi tiết theo trung tâm chi phí.', purpose: 'Lập báo cáo định kỳ', wantFrom: '2026-08-07', wantTo: '2027-08-07', approver: 'Phạm Thu Hà', status: 'Chờ phê duyệt', createdAt: '2026-08-07 09:02', waitingDays: 2, decisionNote: null, grantedLevel: null },
  { id: 'YC-0229', requester: 'Ngô Hoài Sơn', requesterUnit: 'Ban Quản lý Rủi ro', objectType: 'Cột', objectId: 'crm.khach_hang.so_cccd', right: 'Đọc không che', reason: 'Đối chiếu danh sách cảnh báo AML với cơ quan quản lý, bắt buộc có số căn cước đầy đủ.', purpose: 'Tuân thủ pháp lý', wantFrom: '2026-08-06', wantTo: '2026-09-06', approver: 'Phạm Thu Hà', status: 'Đã phê duyệt – đang hiệu lực', createdAt: '2026-08-05 15:40', waitingDays: 0, decisionNote: 'Đồng ý — chỉ áp dụng cho 3 bảng thuộc miền Rủi ro, có ghi nhật ký đầy đủ.', grantedLevel: 'Đọc không che — có giới hạn' },
  { id: 'YC-0228', requester: 'Lê Minh Tuấn', requesterUnit: 'Ban Sản phẩm', objectType: 'Nhóm bảng', objectId: 'NB-02', right: 'Đọc', reason: 'Xem dữ liệu khách hàng', purpose: 'Phân tích', wantFrom: '2026-08-01', wantTo: '2027-08-01', approver: 'Phạm Thu Hà', status: 'Từ chối', createdAt: '2026-07-31 10:12', waitingDays: 0, decisionNote: 'Lý do quá chung chung, phạm vi quá rộng. Đề nghị xin theo từng bảng cụ thể kèm mục đích rõ ràng.', grantedLevel: null },
  { id: 'YC-0227', requester: 'Đinh Thị Thảo', requesterUnit: 'Phòng Phân tích Dữ liệu', objectType: 'Báo cáo', objectId: 'BC-004', right: 'Đọc', reason: 'Xây dựng mô hình dự báo chênh lệch đối soát phục vụ đề tài nghiên cứu nội bộ.', purpose: 'Nghiên cứu', wantFrom: '2026-05-01', wantTo: '2026-08-01', approver: 'Nguyễn Thị Phương', status: 'Hết hạn', createdAt: '2026-04-28 11:30', waitingDays: 0, decisionNote: 'Đồng ý trong 3 tháng.', grantedLevel: 'Đọc' },
  { id: 'YC-0226', requester: 'Phan Văn Nam', requesterUnit: 'Ban Kinh doanh', objectType: 'Bảng', objectId: 'mart.phan_khuc_kh', right: 'Đọc', reason: 'Phân tích hiệu quả chiến dịch marketing theo phân khúc khách hàng.', purpose: 'Phân tích nghiệp vụ', wantFrom: '2026-02-01', wantTo: '2026-05-01', approver: 'Phạm Thu Hà', status: 'Đã thu hồi', createdAt: '2026-01-28 08:44', waitingDays: 0, decisionNote: 'Thu hồi ngày 14/03 do người dùng nghỉ việc.', grantedLevel: 'Đọc' },
  { id: 'YC-0225', requester: 'Ngô Hoài Sơn', requesterUnit: 'Ban Quản lý Rủi ro', objectType: 'Bảng', objectId: 'dwh.giao_dich_thanh_toan', right: 'Đọc', reason: 'Rà soát giao dịch nghi ngờ theo yêu cầu của cơ quan quản lý trong đợt thanh tra tháng 8.', purpose: 'Tuân thủ pháp lý', wantFrom: '2026-08-04', wantTo: '2026-10-04', approver: 'Phạm Thu Hà', status: 'Đã phê duyệt – đang hiệu lực', createdAt: '2026-08-03 13:20', waitingDays: 0, decisionNote: 'Đồng ý, che cột số căn cước.', grantedLevel: 'Đọc — có che' },
]

export const requestById = (id: string) => accessRequests.find(r => r.id === id)

/* ═══════════════ 5.4 Nhật ký kiểm toán ═══════════════ */

export const auditLog: AuditRow[] = [
  { id: 'NK-98421', at: '2026-08-09 09:58:12', user: 'Lê Minh Tuấn', action: 'Truy vấn', objectType: 'Bảng', objectId: 'bi.doi_soat_giao_dich_A', detail: 'SELECT ma_giao_dich, so_tien FROM … LIMIT 1000', rows: 1000, decidedBy: 'CS-1002 — Quyền theo yêu cầu YC-0231', ip: '10.24.18.102', result: 'Cho phép' },
  { id: 'NK-98420', at: '2026-08-09 09:56:40', user: 'Lê Minh Tuấn', action: 'Truy vấn', objectType: 'Cột', objectId: 'bi.doi_soat_giao_dich_A.so_cccd', detail: 'Cột bị loại trừ trong chính sách', rows: null, decidedBy: 'CS-1002 — cột loại trừ', ip: '10.24.18.102', result: 'Từ chối' },
  { id: 'NK-98419', at: '2026-08-09 09:42:18', user: 'Trần Văn Hùng', action: 'Sửa metadata', objectType: 'Bảng', objectId: 'raw.file_ke_toan_thang', detail: 'Gán miền Tài chính, Tier 3 — gửi phê duyệt PD-0087', rows: null, decidedBy: 'G-DE — quyền sửa', ip: '10.24.11.8', result: 'Cho phép' },
  { id: 'NK-98418', at: '2026-08-09 09:12:04', user: 'Ngô Hoài Sơn', action: 'Tải xuống', objectType: 'Bảng', objectId: 'crm.khach_hang', detail: 'Xuất 482.000 dòng ra CSV', rows: 482_000, decidedBy: 'CS-4002 — cần phê duyệt riêng', ip: '10.24.32.55', result: 'Cảnh báo' },
  { id: 'NK-98417', at: '2026-08-09 08:40:22', user: 'Nguyễn Thị Phương', action: 'Xem', objectType: 'Báo cáo', objectId: 'BC-004', detail: 'Mở báo cáo đối soát đối tác', rows: null, decidedBy: 'CS-1001 — quyền nhóm Đối soát', ip: '10.24.18.44', result: 'Cho phép' },
  { id: 'NK-98416', at: '2026-08-09 08:12:01', user: 'Nguyễn Thị Phương', action: 'Đăng nhập', objectType: 'Hệ thống', objectId: 'DMP', detail: 'Đăng nhập một lần qua SSO', rows: null, decidedBy: 'Xác thực tập trung', ip: '10.24.18.44', result: 'Cho phép' },
  { id: 'NK-98415', at: '2026-08-09 07:55:33', user: 'Phạm Thu Hà', action: 'Cấp quyền', objectType: 'Yêu cầu', objectId: 'YC-0229', detail: 'Phê duyệt quyền đọc không che cột so_cccd, hạn 06/09/2026', rows: null, decidedBy: 'G-OWNER — quyền duyệt', ip: '10.24.20.12', result: 'Cho phép' },
  { id: 'NK-98414', at: '2026-08-09 06:34:50', user: 'Hệ thống', action: 'Xem', objectType: 'Bảng', objectId: 'bi.doi_soat_giao_dich_A', detail: 'Job JOB-0412 ghi bảng đích', rows: 12_480_331, decidedBy: 'Tài khoản dịch vụ svc_etl', ip: '10.24.5.2', result: 'Cho phép' },
  { id: 'NK-98413', at: '2026-08-08 22:14:08', user: 'Phan Văn Nam', action: 'Truy vấn', objectType: 'Bảng', objectId: 'crm.khach_hang', detail: 'SELECT * FROM crm.khach_hang', rows: 8_412_907, decidedBy: 'CS-1004 — quyền thủ công vô thời hạn', ip: '113.185.42.19', result: 'Cảnh báo' },
  { id: 'NK-98412', at: '2026-08-08 17:02:44', user: 'Hoàng Hồng Mai', action: 'Tải xuống', objectType: 'Báo cáo', objectId: 'BC-008', detail: 'Xuất file Excel chi phí vận hành tháng 7', rows: 12_408, decidedBy: 'CS-1003 — quyền miền Tài chính', ip: '10.24.20.88', result: 'Cho phép' },
  { id: 'NK-98411', at: '2026-08-08 16:22:10', user: 'Lê Minh Tuấn', action: 'Xem', objectType: 'Thuật ngữ', objectId: 'TN-0042', detail: 'Xem định nghĩa Doanh thu ghi nhận', rows: null, decidedBy: 'Công khai trong nội bộ', ip: '10.24.28.9', result: 'Cho phép' },
  { id: 'NK-98410', at: '2026-08-08 14:20:02', user: 'Lê Minh Tuấn', action: 'Chia sẻ', objectType: 'Bảng', objectId: 'bi.doi_soat_giao_dich_A', detail: 'Gửi yêu cầu cấp quyền YC-0231', rows: null, decidedBy: 'Quy trình xin quyền', ip: '10.24.28.9', result: 'Cho phép' },
  { id: 'NK-98409', at: '2026-08-08 11:20:36', user: 'Trần Văn Hùng', action: 'Sửa metadata', objectType: 'Job', objectId: 'JOB-0412', detail: 'Tạo phiên bản v12 — bổ sung chuẩn hoá số điện thoại', rows: null, decidedBy: 'G-DE — quyền sửa', ip: '10.24.11.8', result: 'Cho phép' },
  { id: 'NK-98408', at: '2026-08-07 15:44:19', user: 'Lý Thanh Bình', action: 'Đăng nhập', objectType: 'Hệ thống', objectId: 'DMP', detail: 'Tài khoản đã nghỉ việc nhưng chưa khoá', rows: null, decidedBy: 'Xác thực tập trung', ip: '203.113.88.4', result: 'Cảnh báo' },
  { id: 'NK-98407', at: '2026-08-07 10:02:55', user: 'Quản trị hệ thống', action: 'Thu hồi quyền', objectType: 'Chính sách', objectId: 'CS-1007', detail: 'Thu hồi quyền miền Khách hàng của Đinh Thị Thảo', rows: null, decidedBy: 'G-ADMIN', ip: '10.24.1.4', result: 'Cho phép' },
]

/* ═══════════════ 5.5 Giám sát truy cập bất thường ═══════════════ */

export const anomalies: AccessAnomaly[] = [
  { id: 'BT-0042', at: '2026-08-09 09:12', user: 'Ngô Hoài Sơn', kind: 'Tải xuống bất thường', object: 'crm.khach_hang', metric: '482.000 dòng trong 1 lần', threshold: 'Tối đa 50.000 dòng/lần với mức Hạn chế', severity: 'Cao', status: 'Mới', handler: null },
  { id: 'BT-0041', at: '2026-08-08 22:14', user: 'Phan Văn Nam', kind: 'Truy vấn quét toàn bảng', object: 'crm.khach_hang', metric: 'SELECT * không có điều kiện · 8,4 triệu dòng', threshold: 'Cấm quét toàn bảng với dữ liệu Hạn chế', severity: 'Nghiêm trọng', status: 'Đang xác minh', handler: 'Quản trị hệ thống' },
  { id: 'BT-0040', at: '2026-08-07 15:44', user: 'Lý Thanh Bình', kind: 'IP lạ', object: 'Đăng nhập hệ thống', metric: 'IP 203.113.88.4 — ngoài dải nội bộ', threshold: 'Chỉ cho phép dải 10.24.0.0/16', severity: 'Nghiêm trọng', status: 'Đang xác minh', handler: 'Quản trị hệ thống' },
  { id: 'BT-0039', at: '2026-08-06 02:18', user: 'Hoàng Hồng Mai', kind: 'Truy cập ngoài giờ', object: 'fin.so_cai_doi_soat', metric: 'Truy vấn lúc 02:18', threshold: 'Ngoài khung 06:00–22:00', severity: 'Trung bình', status: 'Đã xử lý', handler: 'Phạm Thu Hà' },
  { id: 'BT-0038', at: '2026-08-04 11:02', user: 'Lê Minh Tuấn', kind: 'Truy cập dữ liệu Mật lần đầu', object: 'bi.doi_soat_giao_dich_A', metric: 'Lần đầu truy cập bảng mức Mật', threshold: 'Cảnh báo lần truy cập đầu tiên', severity: 'Thấp', status: 'Bỏ qua', handler: 'Nguyễn Thị Phương' },
  { id: 'BT-0037', at: '2026-08-02 19:40', user: 'Nguyễn Thị Lan', kind: 'Tải xuống bất thường', object: 'mart.phan_khuc_kh', metric: '3 lần xuất file trong 20 phút', threshold: 'Tối đa 2 lần/giờ', severity: 'Trung bình', status: 'Đã xử lý', handler: 'Quản trị hệ thống' },
]

/* Báo cáo quyền theo người dùng */
export const userPermissionReport = [
  { object: 'bi.doi_soat_giao_dich_A', type: 'Bảng', right: 'Đọc', source: 'CS-1002 · YC-0231', expiry: '2026-11-09', used90d: true, lastUse: '2026-08-09', masked: ['so_dien_thoai', 'so_cccd'], suggestion: 'Giữ' },
  { object: 'mart.doanh_thu_ngay', type: 'Bảng', right: 'Đọc', source: 'CS-1001 · nhóm', expiry: 'Vô thời hạn', used90d: true, lastUse: '2026-08-08', masked: [], suggestion: 'Rà soát' },
  { object: 'dwh.san_pham', type: 'Bảng', right: 'Đọc', source: 'CS-1001 · nhóm', expiry: 'Vô thời hạn', used90d: true, lastUse: '2026-08-06', masked: [], suggestion: 'Giữ' },
  { object: 'mart.phan_khuc_kh', type: 'Bảng', right: 'Đọc', source: 'Thủ công', expiry: 'Vô thời hạn', used90d: false, lastUse: '2026-02-14', masked: [], suggestion: 'Thu hồi' },
  { object: 'crm.hop_dong', type: 'Bảng', right: 'Đọc', source: 'Thủ công', expiry: 'Vô thời hạn', used90d: false, lastUse: '—', masked: ['nguoi_dai_dien'], suggestion: 'Thu hồi' },
  { object: 'BC-002', type: 'Báo cáo', right: 'Đọc', source: 'CS-1001 · nhóm', expiry: 'Vô thời hạn', used90d: true, lastUse: '2026-08-07', masked: [], suggestion: 'Giữ' },
  { object: 'NB-04 — Danh mục dùng chung', type: 'Nhóm bảng', right: 'Đọc', source: 'Đồng bộ AD', expiry: 'Vô thời hạn', used90d: true, lastUse: '2026-08-05', masked: [], suggestion: 'Giữ' },
  { object: 'dwh.kenh_ban_hang', type: 'Bảng', right: 'Đọc', source: 'Đồng bộ AD', expiry: 'Vô thời hạn', used90d: false, lastUse: '2025-12-02', masked: [], suggestion: 'Thu hồi' },
]
