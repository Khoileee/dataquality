import type {
  DataSource, QualityRule, RuleTemplate, Schedule, Issue,
  NotificationConfig, ThresholdConfig, User, ProfilingResult, DashboardStats, PipelineJob,
  CascadeEvent, CascadeChain, CascadeConfig, ReconciliationResult, KpiPeriodResult,
  ColumnProfileTemplate, TableProfileTemplate
} from '../types'

export const mockDataSources: DataSource[] = [
  {
    id: 'ds-001', name: 'KH_KHACHHANG', type: 'database', schema: 'CORE',
    tableName: 'KH_KHACHHANG', description: 'Bảng thông tin khách hàng cá nhân và doanh nghiệp',
    status: 'active', owner: 'Nguyễn Thị Lan', team: 'Nhóm Khách hàng', category: 'KH',
    rowCount: 1250000, lastProfiled: '2026-03-28T08:30:00', overallScore: 82,
    dimensionScores: { completeness: 91, validity: 85, consistency: 78, uniqueness: 95, accuracy: 76, timeliness: 88 },
    createdAt: '2024-01-15T00:00:00', updatedAt: '2026-03-28T08:30:00',
    moduleType: 'source'
  },
  {
    id: 'ds-002', name: 'GD_GIAODICH', type: 'database', schema: 'CORE',
    tableName: 'GD_GIAODICH', description: 'Lịch sử giao dịch tài chính của khách hàng',
    status: 'active', owner: 'Trần Văn Minh', team: 'Nhóm Giao dịch', category: 'GD',
    rowCount: 45000000, lastProfiled: '2026-03-28T06:00:00', overallScore: 74,
    dimensionScores: { completeness: 88, validity: 72, consistency: 65, uniqueness: 99, accuracy: 68, timeliness: 55 },
    createdAt: '2024-01-15T00:00:00', updatedAt: '2026-03-28T06:00:00',
    moduleType: 'source'
  },
  {
    id: 'ds-003', name: 'TK_TAIKHOAN', type: 'database', schema: 'CORE',
    tableName: 'TK_TAIKHOAN', description: 'Thông tin tài khoản thanh toán và tiết kiệm',
    status: 'active', owner: 'Lê Thị Hoa', team: 'Nhóm Sản phẩm', category: 'TK',
    rowCount: 2100000, lastProfiled: '2026-03-28T07:15:00', overallScore: 88,
    dimensionScores: { completeness: 95, validity: 90, consistency: 85, uniqueness: 98, accuracy: 82, timeliness: 79 },
    createdAt: '2024-01-15T00:00:00', updatedAt: '2026-03-28T07:15:00',
    moduleType: 'source'
  },
  {
    id: 'ds-004', name: 'SP_SANPHAM', type: 'database', schema: 'CORE',
    tableName: 'SP_SANPHAM', description: 'Danh mục sản phẩm và dịch vụ ngân hàng',
    status: 'active', owner: 'Phạm Quốc Hùng', team: 'Nhóm Sản phẩm', category: 'SP',
    rowCount: 850, lastProfiled: '2026-03-27T14:00:00', overallScore: 95,
    dimensionScores: { completeness: 98, validity: 96, consistency: 94, uniqueness: 100, accuracy: 93, timeliness: 91 },
    createdAt: '2024-01-15T00:00:00', updatedAt: '2026-03-27T14:00:00',
    moduleType: 'source'
  },
  {
    id: 'ds-005', name: 'HOP_DONG', type: 'database', schema: 'CORE',
    tableName: 'HOP_DONG', description: 'Thông tin hợp đồng vay và tiền gửi',
    status: 'active', owner: 'Nguyễn Thị Lan', team: 'Nhóm Tín dụng', category: 'KH',
    rowCount: 380000, lastProfiled: '2026-03-28T05:00:00', overallScore: 71,
    dimensionScores: { completeness: 78, validity: 70, consistency: 62, uniqueness: 97, accuracy: 65, timeliness: 58 },
    createdAt: '2024-01-15T00:00:00', updatedAt: '2026-03-28T05:00:00',
    moduleType: 'source'
  },
  {
    id: 'ds-006', name: 'BAO_CAO_NGAY', type: 'sql', schema: 'REPORT',
    tableName: 'BAO_CAO_NGAY', description: 'Báo cáo tổng hợp số liệu hàng ngày từ bảng giao dịch và tài khoản',
    status: 'waiting_data', owner: 'Trần Văn Minh', team: 'Nhóm Báo cáo', category: 'BC',
    rowCount: 12500, lastProfiled: '2026-03-28T09:00:00', overallScore: 63,
    dimensionScores: { completeness: 70, validity: 65, consistency: 58, uniqueness: 85, accuracy: 55, timeliness: 47 },
    createdAt: '2024-02-01T00:00:00', updatedAt: '2026-03-28T09:00:00',
    moduleType: 'report', sourceTableIds: ['ds-002', 'ds-003']
  },
  {
    id: 'ds-007', name: 'DM_TIENTE', type: 'database', schema: 'DM',
    tableName: 'DM_TIENTE', description: 'Danh mục tiền tệ và tỷ giá',
    status: 'active', owner: 'Lê Thị Hoa', team: 'Nhóm Quản trị dữ liệu', category: 'DM',
    rowCount: 180, lastProfiled: '2026-03-25T10:00:00', overallScore: 97,
    dimensionScores: { completeness: 100, validity: 98, consistency: 97, uniqueness: 100, accuracy: 96, timeliness: 93 },
    createdAt: '2024-01-15T00:00:00', updatedAt: '2026-03-25T10:00:00',
    moduleType: 'source'
  },
  {
    id: 'ds-008', name: 'DM_CHINHANH', type: 'database', schema: 'DM',
    tableName: 'DM_CHINHANH', description: 'Danh mục chi nhánh và phòng giao dịch',
    status: 'active', owner: 'Phạm Quốc Hùng', team: 'Nhóm Quản trị dữ liệu', category: 'DM',
    rowCount: 320, lastProfiled: '2026-03-26T10:00:00', overallScore: 94,
    dimensionScores: { completeness: 97, validity: 95, consistency: 92, uniqueness: 100, accuracy: 91, timeliness: 90 },
    createdAt: '2024-01-15T00:00:00', updatedAt: '2026-03-26T10:00:00',
    moduleType: 'source'
  },
  {
    id: 'ds-009', name: 'KH_NHOM_KH', type: 'database', schema: 'CORE',
    tableName: 'KH_NHOM_KH', description: 'Phân nhóm khách hàng theo tiêu chí kinh doanh',
    status: 'active', owner: 'Nguyễn Thị Lan', team: 'Nhóm Khách hàng', category: 'KH',
    rowCount: 45000, lastProfiled: '2026-03-27T08:00:00', overallScore: 79,
    dimensionScores: { completeness: 85, validity: 80, consistency: 75, uniqueness: 92, accuracy: 72, timeliness: 70 },
    createdAt: '2024-01-15T00:00:00', updatedAt: '2026-03-27T08:00:00',
    moduleType: 'source'
  },
  {
    id: 'ds-010', name: 'BIEU_PHI', type: 'database', schema: 'CORE',
    tableName: 'BIEU_PHI', description: 'Biểu phí dịch vụ và lãi suất sản phẩm',
    status: 'active', owner: 'Lê Thị Hoa', team: 'Nhóm Sản phẩm', category: 'SP',
    rowCount: 2200, lastProfiled: '2026-03-27T11:00:00', overallScore: 86,
    dimensionScores: { completeness: 92, validity: 88, consistency: 83, uniqueness: 95, accuracy: 80, timeliness: 77 },
    createdAt: '2024-01-15T00:00:00', updatedAt: '2026-03-27T11:00:00',
    moduleType: 'source'
  },
  {
    id: 'ds-011', name: 'LOG_GIAODICH', type: 'database', schema: 'LOG',
    tableName: 'LOG_GIAODICH', description: 'Log chi tiết các giao dịch trực tuyến',
    status: 'error', owner: 'Trần Văn Minh', team: 'Nhóm Giao dịch', category: 'GD',
    rowCount: 125000000, lastProfiled: '2026-03-27T22:00:00', overallScore: 55,
    dimensionScores: { completeness: 65, validity: 58, consistency: 48, uniqueness: 78, accuracy: 50, timeliness: 32 },
    createdAt: '2024-03-01T00:00:00', updatedAt: '2026-03-27T22:00:00',
    moduleType: 'source'
  },
  {
    id: 'ds-012', name: 'QUAN_LY_RR', type: 'sql', schema: 'RISK',
    tableName: 'QUAN_LY_RR', description: 'Báo cáo quản lý rủi ro tín dụng và thị trường, tổng hợp từ bảng khách hàng và hợp đồng',
    status: 'active', owner: 'Phạm Quốc Hùng', team: 'Nhóm Rủi ro', category: 'QTRI',
    rowCount: 95000, lastProfiled: '2026-03-28T04:00:00', overallScore: 68,
    dimensionScores: { completeness: 75, validity: 68, consistency: 62, uniqueness: 88, accuracy: 58, timeliness: 60 },
    moduleType: 'report', sourceTableIds: ['ds-001', 'ds-005'],
    createdAt: '2024-02-15T00:00:00', updatedAt: '2026-03-28T04:00:00'
  },
  {
    id: 'ds-013', name: 'PHAN_QUYEN', type: 'database', schema: 'SECURITY',
    tableName: 'PHAN_QUYEN', description: 'Phân quyền truy cập hệ thống theo vai trò',
    status: 'active', owner: 'Nguyễn Thị Lan', team: 'Nhóm Bảo mật', category: 'QTRI',
    rowCount: 15000, lastProfiled: '2026-03-26T16:00:00', overallScore: 90,
    dimensionScores: { completeness: 96, validity: 92, consistency: 88, uniqueness: 99, accuracy: 85, timeliness: 84 },
    createdAt: '2024-01-15T00:00:00', updatedAt: '2026-03-26T16:00:00',
    moduleType: 'source'
  },
  {
    id: 'ds-014', name: 'LICH_SU_GD_TONG', type: 'file', schema: 'ARCHIVE',
    tableName: 'LICH_SU_GD_TONG', description: 'Lưu trữ lịch sử giao dịch tổng hợp theo tháng',
    status: 'inactive', owner: 'Trần Văn Minh', team: 'Nhóm Lưu trữ', category: 'GD',
    rowCount: 500000000, lastProfiled: '2026-02-28T00:00:00', overallScore: 72,
    dimensionScores: { completeness: 80, validity: 75, consistency: 68, uniqueness: 90, accuracy: 65, timeliness: 53 },
    createdAt: '2023-06-01T00:00:00', updatedAt: '2026-02-28T00:00:00',
    moduleType: 'source'
  },
  {
    id: 'ds-015', name: 'KPI_KINHDOANH', type: 'sql', schema: 'REPORT',
    tableName: 'KPI_KINHDOANH', description: 'Chỉ tiêu KPI kinh doanh theo chi nhánh và sản phẩm',
    status: 'waiting_data', owner: 'Lê Thị Hoa', team: 'Nhóm Báo cáo', category: 'BC',
    rowCount: 8500, lastProfiled: '2026-03-28T07:00:00', overallScore: 77,
    dimensionScores: { completeness: 83, validity: 78, consistency: 72, uniqueness: 95, accuracy: 70, timeliness: 63 },
    createdAt: '2024-04-01T00:00:00', updatedAt: '2026-03-28T07:00:00',
    moduleType: 'kpi', sourceTableIds: ['ds-006'], periodType: 'monthly', kpiFormula: 'SUM(doanh_thu) / COUNT(chi_nhanh)',
    childKpiIds: ['ds-016', 'ds-017', 'ds-018', 'ds-019'],
  },
  // --- 4 KPI con ---
  {
    id: 'ds-016', name: 'KPI_DOANHTHU_CN', type: 'sql', schema: 'REPORT',
    tableName: 'KPI_DOANHTHU_CN', description: 'KPI doanh thu chi nhánh — tổng hợp từ BAO_CAO_NGAY theo từng chi nhánh',
    status: 'active', owner: 'Lê Thị Hoa', team: 'Nhóm Báo cáo', category: 'BC',
    rowCount: 3200, lastProfiled: '2026-03-28T07:10:00', overallScore: 85,
    dimensionScores: { completeness: 90, validity: 82, consistency: 80, uniqueness: 96, accuracy: 78, timeliness: 84 },
    createdAt: '2024-04-01T00:00:00', updatedAt: '2026-03-28T07:10:00',
    moduleType: 'kpi', sourceTableIds: ['ds-006'], periodType: 'monthly', kpiFormula: 'SUM(doanh_thu) GROUP BY chi_nhanh',
    parentKpiId: 'ds-015',
  },
  {
    id: 'ds-017', name: 'KPI_DOANHTHU_ONLINE', type: 'sql', schema: 'REPORT',
    tableName: 'KPI_DOANHTHU_ONLINE', description: 'KPI doanh thu kênh online — tổng hợp giao dịch qua app/web',
    status: 'active', owner: 'Lê Thị Hoa', team: 'Nhóm Báo cáo', category: 'BC',
    rowCount: 5100, lastProfiled: '2026-03-28T07:12:00', overallScore: 91,
    dimensionScores: { completeness: 95, validity: 88, consistency: 90, uniqueness: 98, accuracy: 85, timeliness: 90 },
    createdAt: '2024-04-01T00:00:00', updatedAt: '2026-03-28T07:12:00',
    moduleType: 'kpi', sourceTableIds: ['ds-006'], periodType: 'monthly', kpiFormula: 'SUM(doanh_thu) WHERE kenh = "online"',
    parentKpiId: 'ds-015',
  },
  {
    id: 'ds-018', name: 'KPI_CHIPHI', type: 'sql', schema: 'REPORT',
    tableName: 'KPI_CHIPHI', description: 'KPI chi phí hoạt động — tổng hợp từ bảng chi phí và hợp đồng',
    status: 'active', owner: 'Phạm Quốc Hùng', team: 'Nhóm Tài chính', category: 'TC',
    rowCount: 4200, lastProfiled: '2026-03-28T07:15:00', overallScore: 73,
    dimensionScores: { completeness: 78, validity: 70, consistency: 68, uniqueness: 92, accuracy: 65, timeliness: 65 },
    createdAt: '2024-04-01T00:00:00', updatedAt: '2026-03-28T07:15:00',
    moduleType: 'kpi', sourceTableIds: ['ds-012'], periodType: 'monthly', kpiFormula: 'SUM(chi_phi) GROUP BY loai_cp',
    parentKpiId: 'ds-015',
  },
  {
    id: 'ds-019', name: 'KPI_LOINHUAN', type: 'sql', schema: 'REPORT',
    tableName: 'KPI_LOINHUAN', description: 'KPI lợi nhuận ròng — doanh thu trừ chi phí, tổng hợp từ KPI con',
    status: 'active', owner: 'Lê Thị Hoa', team: 'Nhóm Báo cáo', category: 'BC',
    rowCount: 1500, lastProfiled: '2026-03-28T07:20:00', overallScore: 68,
    dimensionScores: { completeness: 75, validity: 65, consistency: 60, uniqueness: 90, accuracy: 62, timeliness: 58 },
    createdAt: '2024-04-01T00:00:00', updatedAt: '2026-03-28T07:20:00',
    moduleType: 'kpi', sourceTableIds: ['ds-006', 'ds-012'], periodType: 'monthly', kpiFormula: 'SUM(doanh_thu) - SUM(chi_phi)',
    parentKpiId: 'ds-015',
  },
]

export const mockRules: QualityRule[] = [
  // Completeness rules
  { id: 'r-001', name: 'KH - CMND/CCCD không được null', description: 'Số CMND/CCCD phải có giá trị cho tất cả khách hàng cá nhân', dimension: 'completeness', tableId: 'ds-001', tableName: 'KH_KHACHHANG', columnName: 'CMND_CCCD', metricConfig: { metricType: 'not_null', column: 'CMND_CCCD' }, threshold: { warning: 1, critical: 5 }, status: 'active', lastRunAt: '2026-03-28T08:30:00', lastResult: 'pass', lastScore: 98.5, createdBy: 'Nguyễn Thị Lan', createdAt: '2024-02-01T00:00:00' },
  { id: 'r-002', name: 'KH - Ngày sinh không được null', description: 'Ngày sinh phải được điền đầy đủ', dimension: 'completeness', tableId: 'ds-001', tableName: 'KH_KHACHHANG', columnName: 'NGAY_SINH', metricConfig: { metricType: 'not_null', column: 'NGAY_SINH' }, threshold: { warning: 2, critical: 10 }, status: 'active', lastRunAt: '2026-03-28T08:30:00', lastResult: 'warning', lastScore: 94.2, createdBy: 'Nguyễn Thị Lan', createdAt: '2024-02-01T00:00:00' },
  { id: 'r-003', name: 'GD - Số tiền giao dịch không được null', description: 'Mọi giao dịch phải có giá trị số tiền', dimension: 'completeness', tableId: 'ds-002', tableName: 'GD_GIAODICH', columnName: 'SO_TIEN', metricConfig: { metricType: 'not_null', column: 'SO_TIEN' }, threshold: { warning: 0.1, critical: 1 }, status: 'active', lastRunAt: '2026-03-28T06:00:00', lastResult: 'pass', lastScore: 99.9, createdBy: 'Trần Văn Minh', createdAt: '2024-02-01T00:00:00' },
  { id: 'r-004', name: 'HĐ - Ngày hiệu lực không được null', description: 'Hợp đồng phải có ngày bắt đầu hiệu lực', dimension: 'completeness', tableId: 'ds-005', tableName: 'HOP_DONG', columnName: 'NGAY_HIEU_LUC', metricConfig: { metricType: 'not_null', column: 'NGAY_HIEU_LUC' }, threshold: { warning: 1, critical: 5 }, status: 'active', lastRunAt: '2026-03-28T05:00:00', lastResult: 'warning', lastScore: 96.8, createdBy: 'Nguyễn Thị Lan', createdAt: '2024-02-15T00:00:00' },
  { id: 'r-005', name: 'TK - Số tài khoản không được null', description: 'Mọi tài khoản phải có số tài khoản', dimension: 'completeness', tableId: 'ds-003', tableName: 'TK_TAIKHOAN', columnName: 'SO_TAIKHOAN', metricConfig: { metricType: 'not_null', column: 'SO_TAIKHOAN' }, threshold: { warning: 0, critical: 1 }, status: 'active', lastRunAt: '2026-03-28T07:15:00', lastResult: 'pass', lastScore: 100, createdBy: 'Lê Thị Hoa', createdAt: '2024-02-01T00:00:00' },
  // Validity rules
  { id: 'r-006', name: 'KH - Email đúng định dạng', description: 'Email phải đúng định dạng user@domain.com', dimension: 'validity', tableId: 'ds-001', tableName: 'KH_KHACHHANG', columnName: 'EMAIL', metricConfig: { metricType: 'format_regex', column: 'EMAIL', pattern: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' }, threshold: { warning: 5, critical: 15 }, status: 'active', lastRunAt: '2026-03-28T08:30:00', lastResult: 'warning', lastScore: 87.3, createdBy: 'Nguyễn Thị Lan', createdAt: '2024-02-01T00:00:00' },
  { id: 'r-007', name: 'KH - Số điện thoại đúng định dạng', description: 'SĐT phải là 10 chữ số bắt đầu bằng 0', dimension: 'validity', tableId: 'ds-001', tableName: 'KH_KHACHHANG', columnName: 'SO_DIEN_THOAI', metricConfig: { metricType: 'format_regex', column: 'SO_DIEN_THOAI', pattern: '^0[0-9]{9}$' }, threshold: { warning: 3, critical: 10 }, status: 'active', lastRunAt: '2026-03-28T08:30:00', lastResult: 'fail', lastScore: 78.5, createdBy: 'Nguyễn Thị Lan', createdAt: '2024-02-01T00:00:00' },
  { id: 'r-008', name: 'GD - Số tiền phải dương', description: 'Giá trị giao dịch phải lớn hơn 0', dimension: 'validity', tableId: 'ds-002', tableName: 'GD_GIAODICH', columnName: 'SO_TIEN', metricConfig: { metricType: 'value_range', column: 'SO_TIEN', minValue: 1 }, threshold: { warning: 0.1, critical: 0.5 }, status: 'active', lastRunAt: '2026-03-28T06:00:00', lastResult: 'pass', lastScore: 99.8, createdBy: 'Trần Văn Minh', createdAt: '2024-02-01T00:00:00' },
  { id: 'r-009', name: 'HĐ - Ngày kết thúc sau ngày bắt đầu', description: 'NGAY_KET_THUC phải lớn hơn NGAY_HIEU_LUC', dimension: 'consistency', tableId: 'ds-005', tableName: 'HOP_DONG', metricConfig: { metricType: 'custom_expression', expression: 'NGAY_KET_THUC > NGAY_HIEU_LUC' }, threshold: { warning: 0, critical: 1 }, status: 'active', lastRunAt: '2026-03-28T05:00:00', lastResult: 'warning', lastScore: 97.2, createdBy: 'Nguyễn Thị Lan', createdAt: '2024-02-15T00:00:00' },
  { id: 'r-010', name: 'TK - Loại tài khoản hợp lệ', description: 'LOAI_TK phải nằm trong danh mục hợp lệ', dimension: 'validity', tableId: 'ds-003', tableName: 'TK_TAIKHOAN', columnName: 'LOAI_TK', metricConfig: { metricType: 'allowed_values', column: 'LOAI_TK', allowedValues: ['THANH_TOAN', 'TIET_KIEM', 'TICH_LUY', 'DAU_TU'] }, threshold: { warning: 1, critical: 5 }, status: 'active', lastRunAt: '2026-03-28T07:15:00', lastResult: 'pass', lastScore: 99.5, createdBy: 'Lê Thị Hoa', createdAt: '2024-02-01T00:00:00' },
  // Consistency rules
  { id: 'r-011', name: 'GD - Tổng giao dịch khớp số dư', description: 'Tổng tiền vào - ra phải khớp với biến động số dư', dimension: 'consistency', tableId: 'ds-002', tableName: 'GD_GIAODICH', metricConfig: { metricType: 'custom_expression', expression: 'ABS(SUM(SO_TIEN_VAO) - SUM(SO_TIEN_RA) - SUM(BIEN_DONG_SO_DU)) / NULLIF(SUM(ABS(BIEN_DONG_SO_DU)), 0) * 100 <= 0.1' }, threshold: { warning: 0.01, critical: 0.1 }, status: 'active', lastRunAt: '2026-03-28T06:00:00', lastResult: 'fail', lastScore: 65.0, createdBy: 'Trần Văn Minh', createdAt: '2024-03-01T00:00:00' },
  { id: 'r-012', name: 'KH - Ngày sinh hợp lệ (tuổi 18-100)', description: 'Tuổi khách hàng phải trong khoảng 18-100', dimension: 'validity', tableId: 'ds-001', tableName: 'KH_KHACHHANG', columnName: 'NGAY_SINH', metricConfig: { metricType: 'value_range', column: 'NGAY_SINH', minValue: 18, maxValue: 100 }, threshold: { warning: 1, critical: 5 }, status: 'active', lastRunAt: '2026-03-28T08:30:00', lastResult: 'pass', lastScore: 99.2, createdBy: 'Nguyễn Thị Lan', createdAt: '2024-02-15T00:00:00' },
  // Uniqueness rules
  { id: 'r-013', name: 'KH - CMND không trùng lặp', description: 'Không được có 2 khách hàng cùng số CMND/CCCD', dimension: 'uniqueness', tableId: 'ds-001', tableName: 'KH_KHACHHANG', columnName: 'CMND_CCCD', metricConfig: { metricType: 'duplicate_single', column: 'CMND_CCCD' }, threshold: { warning: 0, critical: 10 }, status: 'active', lastRunAt: '2026-03-28T08:30:00', lastResult: 'pass', lastScore: 100, createdBy: 'Nguyễn Thị Lan', createdAt: '2024-02-01T00:00:00' },
  { id: 'r-014', name: 'GD - Mã giao dịch không trùng', description: 'MA_GD phải là khóa chính duy nhất', dimension: 'uniqueness', tableId: 'ds-002', tableName: 'GD_GIAODICH', columnName: 'MA_GD', metricConfig: { metricType: 'duplicate_single', column: 'MA_GD' }, threshold: { warning: 0, critical: 1 }, status: 'active', lastRunAt: '2026-03-28T06:00:00', lastResult: 'pass', lastScore: 100, createdBy: 'Trần Văn Minh', createdAt: '2024-02-01T00:00:00' },
  { id: 'r-015', name: 'TK - Số tài khoản không trùng', description: 'Mỗi số tài khoản chỉ xuất hiện 1 lần', dimension: 'uniqueness', tableId: 'ds-003', tableName: 'TK_TAIKHOAN', columnName: 'SO_TAIKHOAN', metricConfig: { metricType: 'duplicate_single', column: 'SO_TAIKHOAN' }, threshold: { warning: 0, critical: 1 }, status: 'active', lastRunAt: '2026-03-28T07:15:00', lastResult: 'pass', lastScore: 100, createdBy: 'Lê Thị Hoa', createdAt: '2024-02-01T00:00:00' },
  // Accuracy rules
  { id: 'r-016', name: 'KH - Mã khách hàng khớp danh mục', description: 'MA_KH phải tồn tại trong bảng danh mục khách hàng', dimension: 'accuracy', tableId: 'ds-002', tableName: 'GD_GIAODICH', columnName: 'MA_KH', metricConfig: { metricType: 'reference_match', sourceColumn: 'MA_KH', refTable: 'KH_KHACHHANG', refColumn: 'MA_KH' }, threshold: { warning: 0.1, critical: 1 }, status: 'active', lastRunAt: '2026-03-28T06:00:00', lastResult: 'warning', lastScore: 91.0, createdBy: 'Trần Văn Minh', createdAt: '2024-03-01T00:00:00' },
  { id: 'r-017', name: 'GD - Mã chi nhánh khớp danh mục', description: 'MA_CHINHANH phải tồn tại trong DM_CHINHANH', dimension: 'accuracy', tableId: 'ds-002', tableName: 'GD_GIAODICH', columnName: 'MA_CHINHANH', metricConfig: { metricType: 'reference_match', sourceColumn: 'MA_CHINHANH', refTable: 'DM_CHINHANH', refColumn: 'MA_CHINHANH' }, threshold: { warning: 0, critical: 0.5 }, status: 'active', lastRunAt: '2026-03-28T06:00:00', lastResult: 'pass', lastScore: 99.7, createdBy: 'Trần Văn Minh', createdAt: '2024-02-15T00:00:00' },
  // Timeliness rules
  { id: 'r-018', name: 'BC - Báo cáo cập nhật đúng hạn', description: 'Dữ liệu báo cáo phải được cập nhật trước 8:00 hàng ngày', dimension: 'timeliness', tableId: 'ds-006', tableName: 'BAO_CAO_NGAY', columnName: 'THOI_GIAN_CAP_NHAT', metricConfig: { metricType: 'on_time', column: 'THOI_GIAN_CAP_NHAT', slaTime: '08:00', alertWindowMinutes: 30 }, threshold: { warning: 30, critical: 120 }, status: 'active', lastRunAt: '2026-03-28T09:00:00', lastResult: 'fail', lastScore: 47.0, createdBy: 'Trần Văn Minh', createdAt: '2024-03-01T00:00:00' },
  { id: 'r-019', name: 'GD - Dữ liệu giao dịch realtime', description: 'Độ trễ dữ liệu giao dịch không quá 5 phút', dimension: 'timeliness', tableId: 'ds-002', tableName: 'GD_GIAODICH', columnName: 'THOI_GIAN_GD', metricConfig: { metricType: 'freshness', column: 'THOI_GIAN_GD', maxAge: 5, maxAgeUnit: 'minutes' }, threshold: { warning: 5, critical: 15 }, status: 'active', lastRunAt: '2026-03-28T06:00:00', lastResult: 'fail', lastScore: 55.0, createdBy: 'Trần Văn Minh', createdAt: '2024-03-01T00:00:00' },
  { id: 'r-020', name: 'RR - Dữ liệu rủi ro cập nhật hàng ngày', description: 'Dữ liệu quản lý rủi ro phải được cập nhật mỗi ngày', dimension: 'timeliness', tableId: 'ds-012', tableName: 'QUAN_LY_RR', columnName: 'NGAY_CAP_NHAT', metricConfig: { metricType: 'freshness', column: 'NGAY_CAP_NHAT', maxAge: 1, maxAgeUnit: 'days' }, threshold: { warning: 1, critical: 2 }, status: 'active', lastRunAt: '2026-03-28T04:00:00', lastResult: 'warning', lastScore: 60.0, createdBy: 'Phạm Quốc Hùng', createdAt: '2024-04-01T00:00:00' },
  // New metrics (12 added types)
  { id: 'r-021', name: 'GD - Số dòng giao dịch trong ngưỡng', description: 'Tổng số giao dịch mỗi ngày phải nằm trong khoảng 1.000 – 5.000.000', dimension: 'completeness', tableId: 'ds-002', tableName: 'GD_GIAODICH', metricConfig: { metricType: 'row_count', minRows: 1000, maxRows: 5000000 }, threshold: { warning: 5, critical: 20 }, status: 'active', lastRunAt: '2026-03-28T06:00:00', lastResult: 'pass', lastScore: 98.0, createdBy: 'Trần Văn Minh', createdAt: '2025-01-10T00:00:00' },
  { id: 'r-022', name: 'GD - Phủ ngày giao dịch liên tục 30 ngày', description: 'Bảng GD_GIAODICH phải có dữ liệu đủ cho 30 ngày gần nhất, không bị gián đoạn', dimension: 'completeness', tableId: 'ds-002', tableName: 'GD_GIAODICH', metricConfig: { metricType: 'time_coverage', timeColumn: 'NGAY_GD', granularity: 'day', coverageDays: 30, minCoveragePct: 95 }, threshold: { warning: 5, critical: 15 }, status: 'active', lastRunAt: '2026-03-28T06:00:00', lastResult: 'pass', lastScore: 96.7, createdBy: 'Trần Văn Minh', createdAt: '2025-01-10T00:00:00' },
  { id: 'r-023', name: 'GD - Biến động số dòng theo tuần', description: 'Số dòng giao dịch không được thay đổi quá 30% so với tuần trước', dimension: 'completeness', tableId: 'ds-002', tableName: 'GD_GIAODICH', metricConfig: { metricType: 'volume_change', timeColumn: 'NGAY_GD', lookbackPeriod: 7, maxChangePct: 30 }, threshold: { warning: 20, critical: 50 }, status: 'active', lastRunAt: '2026-03-28T06:00:00', lastResult: 'warning', lastScore: 72.0, createdBy: 'Trần Văn Minh', createdAt: '2025-01-15T00:00:00' },
  { id: 'r-024', name: 'KH - Tỷ lệ null email theo tháng', description: 'Tỷ lệ null cột EMAIL của khách hàng tạo mới không được vượt 20% mỗi tháng', dimension: 'completeness', tableId: 'ds-001', tableName: 'KH_KHACHHANG', columnName: 'EMAIL', metricConfig: { metricType: 'null_rate_by_period', column: 'EMAIL', timeColumn: 'NGAY_TAO', granularity: 'month', coverageDays: 90, maxNullPct: 20 }, threshold: { warning: 15, critical: 30 }, status: 'active', lastRunAt: '2026-03-28T08:30:00', lastResult: 'pass', lastScore: 91.5, createdBy: 'Nguyễn Thị Lan', createdAt: '2025-02-01T00:00:00' },
  { id: 'r-025', name: 'KH - Email không chứa giá trị rác', description: 'Cột EMAIL không được chứa giá trị rác như TEST, FAKE, N/A', dimension: 'validity', tableId: 'ds-001', tableName: 'KH_KHACHHANG', columnName: 'EMAIL', metricConfig: { metricType: 'blacklist_pattern', column: 'EMAIL', blacklistPattern: 'TEST|FAKE|N/A|test@test|example\\.com' }, threshold: { warning: 0.5, critical: 2 }, status: 'active', lastRunAt: '2026-03-28T08:30:00', lastResult: 'warning', lastScore: 88.0, createdBy: 'Nguyễn Thị Lan', createdAt: '2025-02-01T00:00:00' },
  { id: 'r-026', name: 'GD - Thống kê SO_TIEN trong khoảng hợp lý', description: 'Giá trị trung bình cột SO_TIEN phải nằm trong [100.000 – 50.000.000] đồng', dimension: 'accuracy', tableId: 'ds-002', tableName: 'GD_GIAODICH', columnName: 'SO_TIEN', metricConfig: { metricType: 'statistics_bound', column: 'SO_TIEN', statisticType: 'mean', minValue: 100000, maxValue: 50000000 }, threshold: { warning: 5, critical: 20 }, status: 'active', lastRunAt: '2026-03-28T06:00:00', lastResult: 'pass', lastScore: 95.0, createdBy: 'Trần Văn Minh', createdAt: '2025-02-15T00:00:00' },
  { id: 'r-027', name: 'GD - Expression SO_TIEN hợp lệ', description: 'Ít nhất 99% dòng giao dịch phải có SO_TIEN > 0 và MA_TK không null', dimension: 'accuracy', tableId: 'ds-002', tableName: 'GD_GIAODICH', metricConfig: { metricType: 'expression_pct', expression: 'SO_TIEN > 0 AND MA_TK IS NOT NULL', minPassPct: 99 }, threshold: { warning: 1, critical: 5 }, status: 'active', lastRunAt: '2026-03-28T06:00:00', lastResult: 'pass', lastScore: 99.4, createdBy: 'Trần Văn Minh', createdAt: '2025-03-01T00:00:00' },
  { id: 'r-028', name: 'TK - SO_DU bắt buộc khi tài khoản ACTIVE', description: 'Tài khoản có TRANG_THAI=ACTIVE bắt buộc phải có giá trị SO_DU', dimension: 'completeness', tableId: 'ds-003', tableName: 'TK_TAIKHOAN', columnName: 'SO_DU', metricConfig: { metricType: 'conditional_not_null', column: 'SO_DU', condition: "TRANG_THAI = 'ACTIVE'" }, threshold: { warning: 0.5, critical: 2 }, status: 'active', lastRunAt: '2026-03-28T07:15:00', lastResult: 'pass', lastScore: 99.8, createdBy: 'Lê Thị Hoa', createdAt: '2025-03-01T00:00:00' },
  // Report-specific rules
  { id: 'r-029', name: 'BC - Đối soát tổng giao dịch ngày', description: 'SUM(THUC_TE) của báo cáo ngày phải khớp SUM(SO_TIEN) bảng GD_GIAODICH (sai lệch ≤ 0.1%)', dimension: 'accuracy', tableId: 'ds-006', tableName: 'BAO_CAO_NGAY', metricConfig: { metricType: 'aggregate_reconciliation', sourceTableId: 'ds-002', sourceColumn: 'SO_TIEN', reportColumn: 'THUC_TE', tolerancePct: 0.1 }, threshold: { warning: 0.05, critical: 0.5 }, status: 'active', lastRunAt: '2026-03-28T09:00:00', lastResult: 'warning', lastScore: 92.5, createdBy: 'Trần Văn Minh', createdAt: '2025-04-01T00:00:00' },
  { id: 'r-030', name: 'BC - Số dòng báo cáo khớp nguồn', description: 'Số dòng báo cáo ngày phải bằng COUNT(DISTINCT NGAY_GD) từ bảng giao dịch', dimension: 'consistency', tableId: 'ds-006', tableName: 'BAO_CAO_NGAY', metricConfig: { metricType: 'report_row_count_match', sourceTableId: 'ds-002', tolerancePct: 1 }, threshold: { warning: 1, critical: 5 }, status: 'active', lastRunAt: '2026-03-28T09:00:00', lastResult: 'pass', lastScore: 98.0, createdBy: 'Trần Văn Minh', createdAt: '2025-04-01T00:00:00' },
  { id: 'r-031', name: 'BC - Cập nhật báo cáo đúng hạn', description: 'Báo cáo ngày phải được cập nhật trước 08:00 sáng', dimension: 'timeliness', tableId: 'ds-006', tableName: 'BAO_CAO_NGAY', metricConfig: { metricType: 'on_time', column: 'NGAY_BC', slaTime: '08:00', alertWindowMinutes: 30 }, threshold: { warning: 1, critical: 3 }, status: 'active', lastRunAt: '2026-03-28T09:00:00', lastResult: 'fail', lastScore: 55.0, createdBy: 'Trần Văn Minh', createdAt: '2025-04-01T00:00:00' },
  { id: 'r-032', name: 'RR - Đối soát SUM rủi ro với nguồn', description: 'SUM(DIEM_RR) báo cáo rủi ro phải khớp với dữ liệu nguồn khách hàng và hợp đồng', dimension: 'accuracy', tableId: 'ds-012', tableName: 'QUAN_LY_RR', metricConfig: { metricType: 'aggregate_reconciliation', sourceTableId: 'ds-001', sourceColumn: 'DIEM_RR', reportColumn: 'DIEM_RR', tolerancePct: 0.5 }, threshold: { warning: 0.5, critical: 2 }, status: 'active', lastRunAt: '2026-03-28T04:00:00', lastResult: 'pass', lastScore: 96.0, createdBy: 'Phạm Quốc Hùng', createdAt: '2025-04-15T00:00:00' },
  // KPI-specific rules
  { id: 'r-033', name: 'KPI - Biến động chỉ tiêu ≤ 30%', description: 'Giá trị KPI kinh doanh không được biến động quá 30% so với kỳ trước', dimension: 'accuracy', tableId: 'ds-015', tableName: 'KPI_KINHDOANH', metricConfig: { metricType: 'kpi_variance', maxVariancePct: 30, column: 'TONG_TIEN' }, threshold: { warning: 20, critical: 50 }, status: 'active', lastRunAt: '2026-03-28T07:00:00', lastResult: 'warning', lastScore: 72.0, createdBy: 'Lê Thị Hoa', createdAt: '2025-05-01T00:00:00' },
  { id: 'r-034', name: 'KPI - Đầy đủ kỳ tháng', description: 'Chỉ tiêu KPI phải có dữ liệu đủ cho tất cả chi nhánh trong kỳ tháng', dimension: 'completeness', tableId: 'ds-015', tableName: 'KPI_KINHDOANH', metricConfig: { metricType: 'time_coverage', timeColumn: 'NGAY', granularity: 'month', minCoveragePct: 95 }, threshold: { warning: 5, critical: 15 }, status: 'active', lastRunAt: '2026-03-28T07:00:00', lastResult: 'pass', lastScore: 97.0, createdBy: 'Lê Thị Hoa', createdAt: '2025-05-01T00:00:00' },
  { id: 'r-035', name: 'KPI - Tổng chi nhánh = tổng công ty', description: 'SUM KPI tất cả chi nhánh phải bằng KPI tổng công ty (sai lệch ≤ 1%)', dimension: 'consistency', tableId: 'ds-015', tableName: 'KPI_KINHDOANH', metricConfig: { metricType: 'parent_child_match', parentKpiColumn: 'TONG_TIEN', childSumExpression: 'SUM(TONG_TIEN) GROUP BY MA_SP', tolerancePct: 1 }, threshold: { warning: 0.5, critical: 2 }, status: 'active', lastRunAt: '2026-03-28T07:00:00', lastResult: 'pass', lastScore: 99.2, createdBy: 'Lê Thị Hoa', createdAt: '2025-05-01T00:00:00' },
  // KPI con - Doanh thu chi nhánh
  { id: 'r-036', name: 'KPI CN - Biến động doanh thu ≤ 25%', description: 'Doanh thu chi nhánh không biến động quá 25% so với kỳ trước', dimension: 'accuracy', tableId: 'ds-016', tableName: 'KPI_DOANHTHU_CN', metricConfig: { metricType: 'kpi_variance', maxVariancePct: 25, column: 'DOANH_THU' }, threshold: { warning: 15, critical: 40 }, status: 'active', lastRunAt: '2026-03-28T07:10:00', lastResult: 'pass', lastScore: 88.5, createdBy: 'Lê Thị Hoa', createdAt: '2025-05-01T00:00:00' },
  { id: 'r-037', name: 'KPI CN - Đầy đủ kỳ tháng', description: 'Dữ liệu KPI chi nhánh phải đủ cho tất cả chi nhánh', dimension: 'completeness', tableId: 'ds-016', tableName: 'KPI_DOANHTHU_CN', metricConfig: { metricType: 'time_coverage', timeColumn: 'NGAY', granularity: 'month', minCoveragePct: 95 }, threshold: { warning: 5, critical: 15 }, status: 'active', lastRunAt: '2026-03-28T07:10:00', lastResult: 'pass', lastScore: 96.0, createdBy: 'Lê Thị Hoa', createdAt: '2025-05-01T00:00:00' },
  // KPI con - Doanh thu online
  { id: 'r-038', name: 'KPI Online - Biến động ≤ 35%', description: 'Doanh thu online biến động cho phép cao hơn do tính mùa vụ', dimension: 'accuracy', tableId: 'ds-017', tableName: 'KPI_DOANHTHU_ONLINE', metricConfig: { metricType: 'kpi_variance', maxVariancePct: 35, column: 'DOANH_THU' }, threshold: { warning: 20, critical: 50 }, status: 'active', lastRunAt: '2026-03-28T07:12:00', lastResult: 'pass', lastScore: 93.0, createdBy: 'Lê Thị Hoa', createdAt: '2025-05-01T00:00:00' },
  { id: 'r-039', name: 'KPI Online - Đầy đủ kỳ tháng', description: 'Dữ liệu doanh thu online phải đủ mỗi tháng', dimension: 'completeness', tableId: 'ds-017', tableName: 'KPI_DOANHTHU_ONLINE', metricConfig: { metricType: 'time_coverage', timeColumn: 'NGAY', granularity: 'month', minCoveragePct: 90 }, threshold: { warning: 5, critical: 15 }, status: 'active', lastRunAt: '2026-03-28T07:12:00', lastResult: 'pass', lastScore: 95.5, createdBy: 'Lê Thị Hoa', createdAt: '2025-05-01T00:00:00' },
  // KPI con - Chi phí
  { id: 'r-040', name: 'KPI CP - Biến động chi phí ≤ 20%', description: 'Chi phí hoạt động không được biến động quá 20%', dimension: 'accuracy', tableId: 'ds-018', tableName: 'KPI_CHIPHI', metricConfig: { metricType: 'kpi_variance', maxVariancePct: 20, column: 'CHI_PHI' }, threshold: { warning: 10, critical: 30 }, status: 'active', lastRunAt: '2026-03-28T07:15:00', lastResult: 'warning', lastScore: 76.0, createdBy: 'Phạm Quốc Hùng', createdAt: '2025-05-01T00:00:00' },
  { id: 'r-041', name: 'KPI CP - Đầy đủ phân loại chi phí', description: 'Tất cả loại chi phí phải có dữ liệu mỗi kỳ', dimension: 'completeness', tableId: 'ds-018', tableName: 'KPI_CHIPHI', metricConfig: { metricType: 'time_coverage', timeColumn: 'NGAY', granularity: 'month', minCoveragePct: 95 }, threshold: { warning: 5, critical: 15 }, status: 'active', lastRunAt: '2026-03-28T07:15:00', lastResult: 'pass', lastScore: 90.0, createdBy: 'Phạm Quốc Hùng', createdAt: '2025-05-01T00:00:00' },
  // KPI con - Lợi nhuận
  { id: 'r-042', name: 'KPI LN - Biến động lợi nhuận ≤ 30%', description: 'Lợi nhuận ròng không được biến động quá 30%', dimension: 'accuracy', tableId: 'ds-019', tableName: 'KPI_LOINHUAN', metricConfig: { metricType: 'kpi_variance', maxVariancePct: 30, column: 'LOI_NHUAN' }, threshold: { warning: 20, critical: 50 }, status: 'active', lastRunAt: '2026-03-28T07:20:00', lastResult: 'warning', lastScore: 65.0, createdBy: 'Lê Thị Hoa', createdAt: '2025-05-01T00:00:00' },
  { id: 'r-043', name: 'KPI LN - Tổng con = tổng cha', description: 'Lợi nhuận = Doanh thu CN + Online - Chi phí (sai lệch ≤ 2%)', dimension: 'consistency', tableId: 'ds-019', tableName: 'KPI_LOINHUAN', metricConfig: { metricType: 'parent_child_match', parentKpiColumn: 'LOI_NHUAN', childSumExpression: 'SUM(DOANH_THU_CN) + SUM(DOANH_THU_ONLINE) - SUM(CHI_PHI)', tolerancePct: 2 }, threshold: { warning: 1, critical: 5 }, status: 'active', lastRunAt: '2026-03-28T07:20:00', lastResult: 'fail', lastScore: 58.0, createdBy: 'Lê Thị Hoa', createdAt: '2025-05-01T00:00:00' },
]

export const mockRuleTemplates: RuleTemplate[] = [
  // Completeness
  { id: 'tmpl-001', name: 'Kiểm tra cột bắt buộc không null', dimension: 'completeness', description: 'Kiểm tra tỷ lệ null của cột bắt buộc phải dưới ngưỡng cho phép', category: 'Null check', usageCount: 145, metricConfig: { metricType: 'not_null', column: '' }, threshold: { warning: 95, critical: 85 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-002', name: 'Tổng số cột bắt buộc đầy đủ', dimension: 'completeness', description: 'Bản ghi phải điền đủ tất cả các trường bắt buộc', category: 'Required fields', usageCount: 89, metricConfig: { metricType: 'not_null', column: '' }, threshold: { warning: 95, critical: 85 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-003', name: 'Kiểm tra cột có giá trị rỗng', dimension: 'completeness', description: 'Cột chuỗi không được chứa chuỗi rỗng', category: 'Empty string', usageCount: 67, metricConfig: { metricType: 'not_null', column: '' }, threshold: { warning: 95, critical: 85 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-004', name: 'Độ phủ dữ liệu tối thiểu', dimension: 'completeness', description: 'Ít nhất X% bản ghi phải có giá trị cho cột này', category: 'Coverage', usageCount: 52, metricConfig: { metricType: 'fill_rate', column: '', minFillPct: 95 }, threshold: { warning: 90, critical: 80 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-005', name: 'Kiểm tra dữ liệu theo kỳ', dimension: 'completeness', description: 'Mỗi kỳ báo cáo phải có dữ liệu đầy đủ', category: 'Periodic completeness', usageCount: 34, metricConfig: { metricType: 'fill_rate', column: '', minFillPct: 100 }, threshold: { warning: 95, critical: 90 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  // Validity
  { id: 'tmpl-006', name: 'Kiểm tra định dạng email', dimension: 'validity', description: 'Email phải đúng định dạng user@domain.com', category: 'Format', usageCount: 98, metricConfig: { metricType: 'format_regex', column: '', pattern: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' }, threshold: { warning: 90, critical: 80 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-007', name: 'Kiểm tra định dạng số điện thoại VN', dimension: 'validity', description: 'SĐT Việt Nam phải là 10 chữ số bắt đầu bằng 0', category: 'Format', usageCount: 76, metricConfig: { metricType: 'format_regex', column: '', pattern: '^0[0-9]{9}$' }, threshold: { warning: 90, critical: 80 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-008', name: 'Giá trị nằm trong danh sách cho phép', dimension: 'validity', description: 'Giá trị cột phải thuộc tập hợp giá trị hợp lệ', category: 'Domain', usageCount: 134, metricConfig: { metricType: 'allowed_values', column: '', allowedValues: ['ACTIVE', 'INACTIVE', 'PENDING'] }, threshold: { warning: 95, critical: 85 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-009', name: 'Giá trị số trong khoảng hợp lệ', dimension: 'validity', description: 'Giá trị số phải nằm trong khoảng [min, max]', category: 'Range', usageCount: 88, metricConfig: { metricType: 'value_range', column: '', minValue: 0, maxValue: 1000000000 }, threshold: { warning: 95, critical: 90 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-010', name: 'Kiểm tra định dạng ngày tháng', dimension: 'validity', description: 'Ngày tháng phải đúng định dạng và hợp lệ', category: 'Format', usageCount: 112, metricConfig: { metricType: 'format_regex', column: '', pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' }, threshold: { warning: 95, critical: 85 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  // Consistency
  { id: 'tmpl-011', name: 'Ngày kết thúc sau ngày bắt đầu', dimension: 'consistency', description: 'Cột ngày kết thúc phải lớn hơn ngày bắt đầu', category: 'Date order', usageCount: 93, metricConfig: { metricType: 'custom_expression', expression: 'NGAY_KET_THUC > NGAY_BAT_DAU' }, threshold: { warning: 95, critical: 90 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-012', name: 'Tổng chi tiết khớp tổng hợp', dimension: 'consistency', description: 'Tổng các dòng chi tiết phải bằng giá trị tổng hợp', category: 'Aggregation', usageCount: 45, metricConfig: { metricType: 'custom_expression', expression: 'ABS(SUM(col_chitiet) - MAX(col_tonghop)) / NULLIF(MAX(col_tonghop), 0) * 100 <= 0.01' }, threshold: { warning: 99, critical: 95 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-013', name: 'Trường tham chiếu tồn tại', dimension: 'consistency', description: 'Giá trị khóa ngoại phải tồn tại trong bảng tham chiếu', category: 'Referential', usageCount: 167, metricConfig: { metricType: 'referential_integrity', column: '', refTable: '', refColumn: '' }, threshold: { warning: 100, critical: 95 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-014', name: 'Trạng thái hợp lệ theo luồng', dimension: 'consistency', description: 'Trạng thái phải tuân theo luồng trạng thái đã định nghĩa', category: 'State machine', usageCount: 38, metricConfig: { metricType: 'allowed_values', column: 'TRANG_THAI', allowedValues: ['NEW', 'PROCESSING', 'DONE', 'CANCELLED'] }, threshold: { warning: 95, critical: 85 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-015', name: 'Kiểm tra tổng kiểm soát', dimension: 'consistency', description: 'Tổng giá trị giữa 2 hệ thống phải khớp nhau', category: 'Cross-system', usageCount: 29, metricConfig: { metricType: 'custom_expression', expression: 'ABS(sum_system_a - sum_system_b) / NULLIF(sum_system_b, 0) * 100 <= 0.1' }, threshold: { warning: 99, critical: 95 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  // Uniqueness
  { id: 'tmpl-016', name: 'Khóa chính không trùng lặp', dimension: 'uniqueness', description: 'Cột khóa chính không được có giá trị trùng lặp', category: 'Primary key', usageCount: 201, metricConfig: { metricType: 'duplicate_single', column: '' }, threshold: { warning: 100, critical: 99 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-017', name: 'Tỷ lệ trùng lặp dưới ngưỡng', dimension: 'uniqueness', description: 'Tỷ lệ giá trị trùng lặp không được vượt quá ngưỡng', category: 'Duplicate rate', usageCount: 78, metricConfig: { metricType: 'duplicate_single', column: '' }, threshold: { warning: 95, critical: 90 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-018', name: 'Unique trên tổ hợp cột', dimension: 'uniqueness', description: 'Tổ hợp các cột phải duy nhất', category: 'Composite key', usageCount: 55, metricConfig: { metricType: 'duplicate_composite', columns: [] }, threshold: { warning: 100, critical: 99 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  // Accuracy
  { id: 'tmpl-019', name: 'Giá trị khớp nguồn tham chiếu', dimension: 'accuracy', description: 'Giá trị cột phải khớp với nguồn dữ liệu tham chiếu', category: 'Reference match', usageCount: 143, metricConfig: { metricType: 'reference_match', sourceColumn: '', refTable: '', refColumn: '' }, threshold: { warning: 95, critical: 90 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-020', name: 'Phát hiện giá trị ngoại lệ thống kê', dimension: 'accuracy', description: 'Giá trị không được lệch quá N độ lệch chuẩn', category: 'Statistical outlier', usageCount: 67, metricConfig: { metricType: 'custom_expression', expression: 'COUNT(*) FILTER (WHERE ABS(col - avg_val) > 3 * std_val) / COUNT(*) * 100 <= 1' }, threshold: { warning: 95, critical: 90 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  // Timeliness
  { id: 'tmpl-021', name: 'Dữ liệu cập nhật trong SLA', dimension: 'timeliness', description: 'Dữ liệu phải được cập nhật trong khoảng thời gian SLA', category: 'SLA', usageCount: 89, metricConfig: { metricType: 'on_time', column: '', slaTime: '08:00', alertWindowMinutes: 30 }, threshold: { warning: 95, critical: 85 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
  { id: 'tmpl-022', name: 'Dữ liệu tươi mới (Freshness)', dimension: 'timeliness', description: 'Timestamp không được cũ quá N giờ so với hiện tại', category: 'Freshness', usageCount: 112, metricConfig: { metricType: 'freshness', column: '', maxAge: 24, maxAgeUnit: 'hours' }, threshold: { warning: 90, critical: 80 }, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-28T08:00:00', createdBy: 'Hệ thống' },
]

export const mockColumnProfiles: ColumnProfileTemplate[] = [
  {
    id: 'cpf-001',
    name: 'Cột mã khách hàng',
    description: 'Áp dụng cho cột mã KH: bắt buộc có giá trị, không trùng lặp, tồn tại trong danh mục',
    columnKeywords: ['MA_KH', 'CUSTOMER_ID', 'ID_KH'],
    metricTemplateIds: ['tmpl-001', 'tmpl-016', 'tmpl-013'],
    usageCount: 45,
    createdAt: '2026-01-15T00:00:00',
    updatedAt: '2026-03-28T08:00:00',
  },
  {
    id: 'cpf-002',
    name: 'Cột ngày giao dịch',
    description: 'Áp dụng cho cột ngày: bắt buộc, đúng định dạng ngày, giá trị trong khoảng hợp lệ',
    columnKeywords: ['NGAY_GD', 'TRANS_DATE', 'NGAY_TAO', 'NGAY_CAP_NHAT'],
    metricTemplateIds: ['tmpl-001', 'tmpl-010', 'tmpl-009'],
    usageCount: 67,
    createdAt: '2026-01-15T00:00:00',
    updatedAt: '2026-03-28T08:00:00',
  },
  {
    id: 'cpf-003',
    name: 'Cột số tiền',
    description: 'Áp dụng cho cột tiền: bắt buộc, giá trị dương, phát hiện outlier',
    columnKeywords: ['SO_TIEN', 'AMOUNT', 'GIA_TRI', 'SO_DU', 'MUC_PHI'],
    metricTemplateIds: ['tmpl-001', 'tmpl-009', 'tmpl-020'],
    usageCount: 38,
    createdAt: '2026-01-20T00:00:00',
    updatedAt: '2026-03-25T10:00:00',
  },
  {
    id: 'cpf-004',
    name: 'Cột trạng thái',
    description: 'Áp dụng cho cột trạng thái: bắt buộc, giá trị phải nằm trong danh sách cho phép',
    columnKeywords: ['TRANG_THAI', 'STATUS', 'TINH_TRANG'],
    metricTemplateIds: ['tmpl-001', 'tmpl-008'],
    usageCount: 52,
    createdAt: '2026-01-20T00:00:00',
    updatedAt: '2026-03-25T10:00:00',
  },
  {
    id: 'cpf-005',
    name: 'Cột email',
    description: 'Áp dụng cho cột email: kiểm tra đúng định dạng email',
    columnKeywords: ['EMAIL', 'MAIL'],
    metricTemplateIds: ['tmpl-006'],
    usageCount: 23,
    createdAt: '2026-02-01T00:00:00',
    updatedAt: '2026-03-20T14:00:00',
  },
  {
    id: 'cpf-006',
    name: 'Cột số điện thoại',
    description: 'Áp dụng cho cột SĐT: kiểm tra đúng 10 chữ số bắt đầu bằng 0',
    columnKeywords: ['DIEN_THOAI', 'SDT', 'PHONE'],
    metricTemplateIds: ['tmpl-007'],
    usageCount: 19,
    createdAt: '2026-02-01T00:00:00',
    updatedAt: '2026-03-20T14:00:00',
  },
  {
    id: 'cpf-007',
    name: 'Cột mã (khóa chính)',
    description: 'Áp dụng cho cột mã/khóa: bắt buộc, không trùng lặp',
    columnKeywords: ['MA_', 'ID_', '_CODE', '_ID'],
    metricTemplateIds: ['tmpl-001', 'tmpl-016'],
    usageCount: 89,
    createdAt: '2026-01-10T00:00:00',
    updatedAt: '2026-04-01T08:00:00',
  },
]

export const mockTableProfiles: TableProfileTemplate[] = [
  {
    id: 'tpf-001',
    name: 'Bảng giao dịch daily',
    description: 'Bảng append daily: kiểm tra số dòng, độ tươi dữ liệu, biến động số lượng + các cột mã KH, ngày GD, số tiền',
    tableType: 'source',
    mode: 'append',
    partition: 'daily',
    tableMetricTemplateIds: ['tmpl-001', 'tmpl-009'],
    columnProfileIds: ['cpf-001', 'cpf-002', 'cpf-003'],
    usageCount: 12,
    createdAt: '2026-02-01T00:00:00',
    updatedAt: '2026-03-28T08:00:00',
  },
  {
    id: 'tpf-002',
    name: 'Bảng danh mục tĩnh',
    description: 'Bảng overwrite, ít thay đổi: kiểm tra số dòng, cột mã và trạng thái',
    tableType: 'source',
    mode: 'overwrite',
    partition: 'none',
    tableMetricTemplateIds: ['tmpl-001'],
    columnProfileIds: ['cpf-007', 'cpf-004'],
    usageCount: 28,
    createdAt: '2026-02-01T00:00:00',
    updatedAt: '2026-03-25T10:00:00',
  },
  {
    id: 'tpf-003',
    name: 'Bảng báo cáo tổng hợp',
    description: 'Bảng báo cáo overwrite: kiểm tra đối soát tổng hợp, số dòng khớp nguồn',
    tableType: 'report',
    mode: 'overwrite',
    partition: 'daily',
    tableMetricTemplateIds: ['tmpl-001'],
    columnProfileIds: [],
    usageCount: 8,
    createdAt: '2026-02-15T00:00:00',
    updatedAt: '2026-03-28T08:00:00',
  },
  {
    id: 'tpf-004',
    name: 'Bảng tổng hợp monthly',
    description: 'Bảng tổng hợp theo tháng: kiểm tra phủ thời gian, số dòng, cột mã KH và số tiền',
    tableType: 'source',
    mode: 'append',
    partition: 'monthly',
    tableMetricTemplateIds: ['tmpl-001', 'tmpl-005'],
    columnProfileIds: ['cpf-001', 'cpf-003'],
    usageCount: 6,
    createdAt: '2026-02-20T00:00:00',
    updatedAt: '2026-03-20T14:00:00',
  },
  {
    id: 'tpf-005',
    name: 'Bảng KPI chỉ tiêu',
    description: 'Bảng chỉ tiêu KPI: kiểm tra biến động so kỳ trước, khớp cha-con',
    tableType: 'kpi',
    mode: 'overwrite',
    partition: 'monthly',
    tableMetricTemplateIds: ['tmpl-001'],
    columnProfileIds: ['cpf-003'],
    usageCount: 4,
    createdAt: '2026-03-01T00:00:00',
    updatedAt: '2026-04-01T08:00:00',
  },
]

export const mockSchedules: Schedule[] = [
  { id: 'sch-001', name: 'KH_KHACHHANG - Hàng ngày', tableId: 'ds-001', tableName: 'KH_KHACHHANG', frequency: 'daily', runTime: '06:00', daysOfWeek: [], status: 'active', nextRun: '2026-03-29T06:00:00', lastRun: '2026-03-28T06:00:00', lastRunStatus: 'success', rulesCount: 8, owner: 'Nguyễn Thị Lan' },
  { id: 'sch-002', name: 'GD_GIAODICH - Hàng giờ', tableId: 'ds-002', tableName: 'GD_GIAODICH', frequency: 'hourly', daysOfWeek: [], status: 'active', nextRun: '2026-03-28T10:00:00', lastRun: '2026-03-28T09:00:00', lastRunStatus: 'partial', rulesCount: 6, owner: 'Trần Văn Minh' },
  { id: 'sch-003', name: 'TK_TAIKHOAN - Hàng ngày', tableId: 'ds-003', tableName: 'TK_TAIKHOAN', frequency: 'daily', runTime: '07:00', daysOfWeek: [], status: 'active', nextRun: '2026-03-29T07:00:00', lastRun: '2026-03-28T07:00:00', lastRunStatus: 'success', rulesCount: 5, owner: 'Lê Thị Hoa' },
  { id: 'sch-004', name: 'SP_SANPHAM - Hàng tuần', tableId: 'ds-004', tableName: 'SP_SANPHAM', frequency: 'weekly', runTime: '08:00', daysOfWeek: [1], status: 'active', nextRun: '2026-03-30T08:00:00', lastRun: '2026-03-23T08:00:00', lastRunStatus: 'success', rulesCount: 4, owner: 'Phạm Quốc Hùng' },
  { id: 'sch-005', name: 'HOP_DONG - Hàng ngày', tableId: 'ds-005', tableName: 'HOP_DONG', frequency: 'daily', runTime: '05:00', daysOfWeek: [], status: 'active', nextRun: '2026-03-29T05:00:00', lastRun: '2026-03-28T05:00:00', lastRunStatus: 'failed', rulesCount: 7, owner: 'Nguyễn Thị Lan' },
  { id: 'sch-006', name: 'BAO_CAO_NGAY - Hàng ngày', tableId: 'ds-006', tableName: 'BAO_CAO_NGAY', frequency: 'daily', runTime: '09:00', daysOfWeek: [], status: 'active', nextRun: '2026-03-29T09:00:00', lastRun: '2026-03-28T09:00:00', lastRunStatus: 'failed', rulesCount: 5, owner: 'Trần Văn Minh' },
  { id: 'sch-007', name: 'QUAN_LY_RR - Hàng ngày', tableId: 'ds-012', tableName: 'QUAN_LY_RR', frequency: 'daily', runTime: '04:00', daysOfWeek: [], status: 'active', nextRun: '2026-03-29T04:00:00', lastRun: '2026-03-28T04:00:00', lastRunStatus: 'partial', rulesCount: 6, owner: 'Phạm Quốc Hùng' },
  { id: 'sch-008', name: 'KPI_KINHDOANH - Hàng ngày', tableId: 'ds-015', tableName: 'KPI_KINHDOANH', frequency: 'daily', runTime: '07:00', daysOfWeek: [], status: 'inactive', nextRun: '', lastRun: '2026-03-25T07:00:00', lastRunStatus: 'success', rulesCount: 4, owner: 'Lê Thị Hoa' },
  { id: 'sch-009', name: 'DM_TIENTE - Hàng tuần', tableId: 'ds-007', tableName: 'DM_TIENTE', frequency: 'weekly', runTime: '10:00', daysOfWeek: [1], status: 'active', nextRun: '2026-03-30T10:00:00', lastRun: '2026-03-23T10:00:00', lastRunStatus: 'success', rulesCount: 3, owner: 'Lê Thị Hoa' },
  { id: 'sch-010', name: 'LOG_GIAODICH - Thực thời', tableId: 'ds-011', tableName: 'LOG_GIAODICH', frequency: 'realtime', daysOfWeek: [], status: 'inactive', nextRun: '', lastRun: '2026-03-27T22:00:00', lastRunStatus: 'failed', rulesCount: 3, owner: 'Trần Văn Minh' },
]

export const mockIssues: Issue[] = [
  {
    id: 'iss-001', title: 'Tỷ lệ null cao trong cột NGAY_SINH', description: 'Phát hiện 5.8% bản ghi KH_KHACHHANG không có ngày sinh - vượt ngưỡng cảnh báo 2%', severity: 'high', status: 'in_progress',
    tableId: 'ds-001', tableName: 'KH_KHACHHANG', dimension: 'completeness', ruleId: 'r-002', ruleName: 'KH - Ngày sinh không được null',
    detectedAt: '2026-03-27T08:30:00', assignedTo: 'Nguyễn Thị Lan',
    timeline: [
      { id: 'e1', type: 'created', user: 'Hệ thống', content: 'Phát hiện vấn đề: tỷ lệ null NGAY_SINH = 5.8% (ngưỡng: 2%)', timestamp: '2026-03-27T08:30:00' },
      { id: 'e2', type: 'assigned', user: 'Admin', content: 'Gán cho Nguyễn Thị Lan xử lý', timestamp: '2026-03-27T09:00:00' },
      { id: 'e3', type: 'comment', user: 'Nguyễn Thị Lan', content: 'Đã xác nhận vấn đề. Nguyên nhân: dữ liệu từ hệ thống cũ chưa được migrate đầy đủ. Đang liên hệ team DBA để bổ sung.', timestamp: '2026-03-27T10:30:00' },
      { id: 'e4', type: 'status_changed', user: 'Nguyễn Thị Lan', content: 'Chuyển trạng thái sang Đang xử lý', timestamp: '2026-03-27T10:31:00' },
    ]
  },
  {
    id: 'iss-002', title: 'Số điện thoại sai định dạng - KH_KHACHHANG', description: '21.5% số điện thoại không đúng định dạng 10 chữ số bắt đầu bằng 0. Phát sinh từ dữ liệu nhập thủ công tại chi nhánh.', severity: 'critical', status: 'assigned',
    tableId: 'ds-001', tableName: 'KH_KHACHHANG', dimension: 'validity', ruleId: 'r-007', ruleName: 'KH - Số điện thoại đúng định dạng',
    detectedAt: '2026-03-28T08:30:00', assignedTo: 'Phạm Quốc Hùng',
    timeline: [
      { id: 'e1', type: 'created', user: 'Hệ thống', content: 'Phát hiện vấn đề: 21.5% SĐT sai định dạng (ngưỡng nghiêm trọng: 10%)', timestamp: '2026-03-28T08:30:00' },
      { id: 'e2', type: 'assigned', user: 'Admin', content: 'Gán cho Phạm Quốc Hùng - Lead DBA', timestamp: '2026-03-28T08:45:00' },
    ]
  },
  {
    id: 'iss-003', title: 'Dữ liệu báo cáo ngày trễ SLA', description: 'BAO_CAO_NGAY chưa được cập nhật đến 9:15 sáng, vượt SLA 8:00. Ảnh hưởng đến báo cáo quản lý buổi sáng.', severity: 'critical', status: 'new',
    tableId: 'ds-006', tableName: 'BAO_CAO_NGAY', dimension: 'timeliness', ruleId: 'r-018', ruleName: 'BC - Báo cáo cập nhật đúng hạn',
    detectedAt: '2026-03-28T09:15:00',
    timeline: [
      { id: 'e1', type: 'created', user: 'Hệ thống', content: 'Phát hiện: BAO_CAO_NGAY chưa được cập nhật lúc 09:15, trễ 75 phút so với SLA 08:00', timestamp: '2026-03-28T09:15:00' },
    ]
  },
  {
    id: 'iss-004', title: 'Tổng giao dịch không khớp số dư tài khoản', description: 'Phát hiện 35% tài khoản có sự chênh lệch giữa tổng giao dịch và biến động số dư. Cần điều tra ngay.', severity: 'critical', status: 'in_progress',
    tableId: 'ds-002', tableName: 'GD_GIAODICH', dimension: 'consistency', ruleId: 'r-011', ruleName: 'GD - Tổng giao dịch khớp số dư',
    detectedAt: '2026-03-26T06:30:00', assignedTo: 'Trần Văn Minh',
    timeline: [
      { id: 'e1', type: 'created', user: 'Hệ thống', content: 'Phát hiện: 35% tài khoản có chênh lệch tổng giao dịch vs biến động số dư', timestamp: '2026-03-26T06:30:00' },
      { id: 'e2', type: 'assigned', user: 'Admin', content: 'Escalate - gán cho Trần Văn Minh (Senior DBA)', timestamp: '2026-03-26T07:00:00' },
      { id: 'e3', type: 'comment', user: 'Trần Văn Minh', content: 'Đã tìm ra nguyên nhân: một số bút toán điều chỉnh cuối ngày chưa được ánh xạ đúng loại. Đang viết script fix.', timestamp: '2026-03-26T14:00:00' },
      { id: 'e4', type: 'comment', user: 'Trần Văn Minh', content: 'Script đã chạy thử trên môi trường DEV, kết quả tốt. Cần phê duyệt để chạy PROD.', timestamp: '2026-03-27T11:00:00' },
      { id: 'e5', type: 'status_changed', user: 'Trần Văn Minh', content: 'Chuyển sang Chờ xét duyệt', timestamp: '2026-03-27T11:01:00' },
    ]
  },
  {
    id: 'iss-005', title: 'Email khách hàng sai định dạng', description: '12.7% email không đúng định dạng, ảnh hưởng đến chiến dịch gửi email marketing và xác thực OTP.', severity: 'medium', status: 'pending_review',
    tableId: 'ds-001', tableName: 'KH_KHACHHANG', dimension: 'validity', ruleId: 'r-006', ruleName: 'KH - Email đúng định dạng',
    detectedAt: '2026-03-25T08:30:00', assignedTo: 'Nguyễn Thị Lan', resolvedAt: undefined,
    timeline: [
      { id: 'e1', type: 'created', user: 'Hệ thống', content: 'Phát hiện 12.7% email sai định dạng', timestamp: '2026-03-25T08:30:00' },
      { id: 'e2', type: 'assigned', user: 'Admin', content: 'Gán cho Nguyễn Thị Lan', timestamp: '2026-03-25T09:00:00' },
      { id: 'e3', type: 'status_changed', user: 'Nguyễn Thị Lan', content: 'Đã chuẩn hóa 89% email lỗi. Còn lại 1.4% cần xác nhận thủ công từ chi nhánh', timestamp: '2026-03-27T16:00:00' },
    ]
  },
  {
    id: 'iss-006', title: 'Ngày kết thúc HĐ sớm hơn ngày hiệu lực', description: '2.8% hợp đồng có NGAY_KET_THUC < NGAY_HIEU_LUC - dữ liệu không nhất quán.', severity: 'medium', status: 'resolved',
    tableId: 'ds-005', tableName: 'HOP_DONG', dimension: 'consistency', ruleId: 'r-009', ruleName: 'HĐ - Ngày kết thúc sau ngày bắt đầu',
    detectedAt: '2026-03-20T05:00:00', assignedTo: 'Nguyễn Thị Lan', resolvedAt: '2026-03-25T10:00:00',
    timeline: [
      { id: 'e1', type: 'created', user: 'Hệ thống', content: 'Phát hiện 2.8% hợp đồng có ngày kết thúc < ngày hiệu lực', timestamp: '2026-03-20T05:00:00' },
      { id: 'e2', type: 'assigned', user: 'Admin', content: 'Gán cho Nguyễn Thị Lan', timestamp: '2026-03-20T08:00:00' },
      { id: 'e3', type: 'comment', user: 'Nguyễn Thị Lan', content: 'Nguyên nhân: lỗi nhập liệu tại form tạo hợp đồng - đã fix tại nguồn', timestamp: '2026-03-22T11:00:00' },
      { id: 'e4', type: 'resolved', user: 'Nguyễn Thị Lan', content: 'Đã cập nhật lại dữ liệu lỗi. Chỉ số trở về 0%', timestamp: '2026-03-25T10:00:00' },
    ]
  },
  {
    id: 'iss-007', title: 'Mã khách hàng không tồn tại trong GD_GIAODICH', description: '9% giao dịch có MA_KH không tìm thấy trong KH_KHACHHANG - có thể là dữ liệu khách hàng bị xóa.', severity: 'high', status: 'assigned',
    tableId: 'ds-002', tableName: 'GD_GIAODICH', dimension: 'accuracy', ruleId: 'r-016', ruleName: 'KH - Mã khách hàng khớp danh mục',
    detectedAt: '2026-03-27T06:00:00', assignedTo: 'Trần Văn Minh',
    timeline: [
      { id: 'e1', type: 'created', user: 'Hệ thống', content: 'Phát hiện 9% MA_KH trong GD không tồn tại trong KH_KHACHHANG', timestamp: '2026-03-27T06:00:00' },
      { id: 'e2', type: 'assigned', user: 'Admin', content: 'Gán cho Trần Văn Minh', timestamp: '2026-03-27T07:00:00' },
    ]
  },
  {
    id: 'iss-008', title: 'LOG_GIAODICH - Dữ liệu log cũ trên 6h', description: 'Độ trễ dữ liệu log giao dịch đang là 6.5h thay vì realtime (< 5 phút).', severity: 'critical', status: 'new',
    tableId: 'ds-011', tableName: 'LOG_GIAODICH', dimension: 'timeliness',
    detectedAt: '2026-03-28T05:30:00',
    timeline: [
      { id: 'e1', type: 'created', user: 'Hệ thống', content: 'Phát hiện LOG_GIAODICH trễ 390 phút (SLA: 5 phút)', timestamp: '2026-03-28T05:30:00' },
    ]
  },
  {
    id: 'iss-009', title: 'Dữ liệu rủi ro cập nhật chậm', description: 'QUAN_LY_RR chưa được cập nhật từ 2 ngày trước - vượt ngưỡng 1 ngày.', severity: 'medium', status: 'in_progress',
    tableId: 'ds-012', tableName: 'QUAN_LY_RR', dimension: 'timeliness',
    detectedAt: '2026-03-27T04:00:00', assignedTo: 'Phạm Quốc Hùng',
    timeline: [
      { id: 'e1', type: 'created', user: 'Hệ thống', content: 'QUAN_LY_RR chưa được cập nhật trong 2 ngày', timestamp: '2026-03-27T04:00:00' },
      { id: 'e2', type: 'assigned', user: 'Admin', content: 'Gán cho Phạm Quốc Hùng', timestamp: '2026-03-27T08:00:00' },
    ]
  },
  {
    id: 'iss-010', title: 'BAO_CAO_NGAY - Số liệu doanh thu âm', description: 'Phát hiện 3 bản ghi có DOANH_THU < 0 trong báo cáo ngày - nghi ngờ lỗi bút toán.', severity: 'low', status: 'closed',
    tableId: 'ds-006', tableName: 'BAO_CAO_NGAY', dimension: 'validity',
    detectedAt: '2026-03-15T09:00:00', assignedTo: 'Lê Thị Hoa', resolvedAt: '2026-03-16T11:00:00',
    timeline: [
      { id: 'e1', type: 'created', user: 'Hệ thống', content: 'Phát hiện 3 bản ghi DOANH_THU < 0', timestamp: '2026-03-15T09:00:00' },
      { id: 'e2', type: 'resolved', user: 'Lê Thị Hoa', content: 'Đã xác nhận và điều chỉnh 3 bút toán lỗi', timestamp: '2026-03-16T11:00:00' },
    ]
  },
  {
    id: 'iss-011', title: 'Tỷ lệ null cột SO_DU tăng đột biến', description: 'Phát hiện 8.3% bản ghi TK_TAIKHOAN có SO_DU = NULL, tăng mạnh so với mức bình thường 0.5%. Nghi ngờ lỗi batch cập nhật số dư đêm qua.', severity: 'high', status: 'assigned',
    tableId: 'ds-003', tableName: 'TK_TAIKHOAN', dimension: 'completeness', ruleId: 'r-005', ruleName: 'TK - Số dư bắt buộc khi ACTIVE',
    detectedAt: '2026-04-09T06:30:00', assignedTo: 'Trần Văn Minh',
    timeline: [
      { id: 'e1', type: 'created', user: 'Hệ thống', content: 'Phát hiện 8.3% SO_DU = NULL trong TK_TAIKHOAN (ngưỡng: 1%)', timestamp: '2026-04-09T06:30:00' },
      { id: 'e2', type: 'assigned', user: 'Admin', content: 'Gán cho Trần Văn Minh — Senior DBA', timestamp: '2026-04-09T07:15:00' },
    ]
  },
  {
    id: 'iss-012', title: 'BAO_CAO_NGAY trễ SLA 2 ngày liên tiếp', description: 'BAO_CAO_NGAY chưa được cập nhật đúng hạn 8:00 sáng trong 2 ngày liên tiếp (08/04 và 09/04). Ảnh hưởng đến báo cáo giao ban ban lãnh đạo.', severity: 'critical', status: 'new',
    tableId: 'ds-006', tableName: 'BAO_CAO_NGAY', dimension: 'timeliness', ruleId: 'r-018', ruleName: 'BC - Báo cáo cập nhật đúng hạn',
    detectedAt: '2026-04-09T09:05:00',
    timeline: [
      { id: 'e1', type: 'created', user: 'Hệ thống', content: 'BAO_CAO_NGAY trễ SLA 65 phút (09:05 vs SLA 08:00). Đây là lần thứ 2 liên tiếp.', timestamp: '2026-04-09T09:05:00' },
    ]
  },
  {
    id: 'iss-013', title: 'Mã sản phẩm trùng lặp trong SP_SANPHAM', description: 'Phát hiện 15 mã sản phẩm (MA_SP) bị trùng lặp sau đợt đồng bộ dữ liệu từ hệ thống Core Banking mới.', severity: 'medium', status: 'in_progress',
    tableId: 'ds-004', tableName: 'SP_SANPHAM', dimension: 'uniqueness',
    detectedAt: '2026-04-07T07:00:00', assignedTo: 'Lê Thị Hoa',
    timeline: [
      { id: 'e1', type: 'created', user: 'Hệ thống', content: 'Phát hiện 15 MA_SP trùng lặp trong SP_SANPHAM', timestamp: '2026-04-07T07:00:00' },
      { id: 'e2', type: 'assigned', user: 'Admin', content: 'Gán cho Lê Thị Hoa', timestamp: '2026-04-07T08:30:00' },
      { id: 'e3', type: 'comment', user: 'Lê Thị Hoa', content: 'Đang phối hợp team Core Banking xác định bản ghi gốc. Dự kiến xong trong ngày.', timestamp: '2026-04-08T10:00:00' },
    ]
  },
  {
    id: 'iss-014', title: 'Số dòng GD_GIAODICH giảm 45% so với tuần trước', description: 'Số dòng bảng GD_GIAODICH ngày 06/04 chỉ có 682.000/1.250.000 dòng (giảm 45%). Có thể do lỗi ETL nạp dữ liệu không đầy đủ.', severity: 'high', status: 'new',
    tableId: 'ds-002', tableName: 'GD_GIAODICH', dimension: 'completeness',
    detectedAt: '2026-04-06T05:30:00',
    timeline: [
      { id: 'e1', type: 'created', user: 'Hệ thống', content: 'Số dòng GD_GIAODICH = 682.000, giảm 45% so với trung bình 7 ngày (1.250.000)', timestamp: '2026-04-06T05:30:00' },
    ]
  },
]

export const mockNotifications: NotificationConfig[] = [
  { id: 'notif-001', name: 'Cảnh báo nghiêm trọng - Nhóm DBA', type: 'email', recipients: ['dba@vietbank.vn', 'team-dba@vietbank.vn'], triggerOn: ['critical'], tables: ['ds-001', 'ds-002', 'ds-003'], isActive: true, notifyDownstream: true, emailSubject: '[DQ ALERT] {{severity}} - Bảng {{table}} cần xử lý ngay', emailBody: 'Kính gửi DBA Team,\n\nHệ thống DQ phát hiện vấn đề chất lượng dữ liệu:\n\n• Bảng: {{table}}\n• Chiều dữ liệu: {{dimension}}\n• Mức độ: {{severity}}\n• Điểm chất lượng: {{score}}/100 (ngưỡng: {{threshold}})\n• Phát hiện lúc: {{detected_at}}\n\nVui lòng truy cập hệ thống DQ để xem chi tiết và xử lý kịp thời.\n\nTrân trọng,\nHệ thống Data Quality' },
  { id: 'notif-002', name: 'Cảnh báo chất lượng - Quản lý', type: 'email', recipients: ['manager@vietbank.vn', 'director-data@vietbank.vn'], triggerOn: ['critical', 'warning'], tables: ['ds-006', 'ds-015'], isActive: true, emailSubject: '[DQ] Cảnh báo chất lượng dữ liệu - {{table}}', emailBody: 'Kính gửi Ban Quản lý,\n\nBáo cáo vấn đề chất lượng dữ liệu:\n\n• Bảng: {{table}}\n• Mức độ: {{severity}}\n• Điểm hiện tại: {{score}}/100\n• Phát hiện: {{detected_at}}\n\nĐội ngũ kỹ thuật đang xử lý.\n\nTrân trọng,\nHệ thống Data Quality' },
  { id: 'notif-003', name: 'SMS cảnh báo - On-call team', type: 'sms', recipients: ['+84901234567', '+84901234568'], triggerOn: ['critical'], tables: ['ds-002', 'ds-011'], isActive: true },
  { id: 'notif-004', name: 'Webhook tích hợp Jira', type: 'webhook', recipients: ['https://jira.vietbank.vn/webhook/dq'], triggerOn: ['critical', 'warning', 'resolved'], tables: [], isActive: false },
  { id: 'notif-005', name: 'Báo cáo hàng ngày - Data Steward', type: 'email', recipients: ['data-steward@vietbank.vn'], triggerOn: ['warning', 'resolved'], tables: [], isActive: true, emailSubject: '[DQ Daily] Tổng hợp vấn đề chất lượng - {{detected_at}}', emailBody: 'Kính gửi Data Steward,\n\nTóm tắt vấn đề chất lượng dữ liệu:\n\n• Bảng: {{table}}\n• Chiều: {{dimension}}\n• Mức độ: {{severity}}\n• Trạng thái: {{status}}\n\nVui lòng xem chi tiết tại hệ thống DQ.\n\nTrân trọng' },
  { id: 'notif-006', name: 'Cảnh báo rủi ro - Nhóm Risk', type: 'email', recipients: ['risk@vietbank.vn'], triggerOn: ['critical', 'warning'], tables: ['ds-012'], isActive: true, emailSubject: '[RISK ALERT] Dữ liệu rủi ro có vấn đề - {{table}}', emailBody: 'Kính gửi Risk Team,\n\nPhát hiện vấn đề trên dữ liệu quản lý rủi ro:\n\n• Bảng: {{table}}\n• Chiều: {{dimension}}\n• Mức độ: {{severity}}\n• Điểm: {{score}}/100\n• Phát hiện: {{detected_at}}\n\nCần xem xét tác động đến mô hình đánh giá rủi ro.\n\nTrân trọng,\nHệ thống Data Quality' },
]

export const mockThresholds: ThresholdConfig[] = [
  { id: 'thr-g-1', dimension: 'completeness', warningThreshold: 90, criticalThreshold: 80, isGlobal: true },
  { id: 'thr-g-2', dimension: 'validity', warningThreshold: 85, criticalThreshold: 70, isGlobal: true },
  { id: 'thr-g-3', dimension: 'consistency', warningThreshold: 85, criticalThreshold: 70, isGlobal: true },
  { id: 'thr-g-4', dimension: 'uniqueness', warningThreshold: 95, criticalThreshold: 90, isGlobal: true },
  { id: 'thr-g-5', dimension: 'accuracy', warningThreshold: 85, criticalThreshold: 70, isGlobal: true },
  { id: 'thr-g-6', dimension: 'timeliness', warningThreshold: 80, criticalThreshold: 60, isGlobal: true },
  { id: 'thr-t-1', tableId: 'ds-002', tableName: 'GD_GIAODICH', dimension: 'completeness', warningThreshold: 99, criticalThreshold: 95, isGlobal: false },
  { id: 'thr-t-2', tableId: 'ds-002', tableName: 'GD_GIAODICH', dimension: 'uniqueness', warningThreshold: 100, criticalThreshold: 99, isGlobal: false },
  { id: 'thr-t-3', tableId: 'ds-002', tableName: 'GD_GIAODICH', dimension: 'timeliness', warningThreshold: 95, criticalThreshold: 85, isGlobal: false },
  { id: 'thr-t-4', tableId: 'ds-006', tableName: 'BAO_CAO_NGAY', dimension: 'timeliness', warningThreshold: 95, criticalThreshold: 85, isGlobal: false },
  { id: 'thr-t-5', tableId: 'ds-012', tableName: 'QUAN_LY_RR', dimension: 'accuracy', warningThreshold: 90, criticalThreshold: 80, isGlobal: false },
  { id: 'thr-t-6', tableId: 'ds-011', tableName: 'LOG_GIAODICH', dimension: 'timeliness', warningThreshold: 90, criticalThreshold: 70, isGlobal: false },
]

export const mockUsers: User[] = [
  { id: 'u-001', name: 'Nguyễn Văn Admin', email: 'admin@vietbank.vn', role: 'admin', team: 'IT Operations', dataOwnership: [], isActive: true, lastLoginAt: '2026-03-28T08:00:00' },
  { id: 'u-002', name: 'Nguyễn Thị Lan', email: 'lan.nt@vietbank.vn', role: 'data_steward', team: 'Nhóm Khách hàng', dataOwnership: ['ds-001', 'ds-005', 'ds-009', 'ds-013'], isActive: true, lastLoginAt: '2026-03-28T08:45:00' },
  { id: 'u-003', name: 'Trần Văn Minh', email: 'minh.tv@vietbank.vn', role: 'data_steward', team: 'Nhóm Giao dịch', dataOwnership: ['ds-002', 'ds-006', 'ds-011', 'ds-014'], isActive: true, lastLoginAt: '2026-03-28T07:30:00' },
  { id: 'u-004', name: 'Lê Thị Hoa', email: 'hoa.lt@vietbank.vn', role: 'data_steward', team: 'Nhóm Sản phẩm', dataOwnership: ['ds-003', 'ds-007', 'ds-008', 'ds-010', 'ds-015'], isActive: true, lastLoginAt: '2026-03-28T09:00:00' },
  { id: 'u-005', name: 'Phạm Quốc Hùng', email: 'hung.pq@vietbank.vn', role: 'data_steward', team: 'Nhóm Rủi ro', dataOwnership: ['ds-004', 'ds-012'], isActive: true, lastLoginAt: '2026-03-28T06:30:00' },
  { id: 'u-006', name: 'Vũ Thanh Tâm', email: 'tam.vt@vietbank.vn', role: 'analyst', team: 'Nhóm Báo cáo', dataOwnership: [], isActive: true, lastLoginAt: '2026-03-27T16:00:00' },
  { id: 'u-007', name: 'Đỗ Minh Quân', email: 'quan.dm@vietbank.vn', role: 'analyst', team: 'Nhóm Phân tích', dataOwnership: [], isActive: true, lastLoginAt: '2026-03-26T10:00:00' },
  { id: 'u-008', name: 'Hoàng Thị Mai', email: 'mai.ht@vietbank.vn', role: 'viewer', team: 'Kiểm toán nội bộ', dataOwnership: [], isActive: false, lastLoginAt: '2026-03-10T09:00:00' },
]

export const mockProfilingResults: ProfilingResult[] = [
  {
    id: 'pr-001', tableId: 'ds-001', tableName: 'KH_KHACHHANG', runAt: '2026-03-28T08:30:00', status: 'completed',
    totalRows: 1250000, totalColumns: 18, overallScore: 82, durationSeconds: 245,
    dimensionScores: { completeness: 91, validity: 85, consistency: 78, uniqueness: 95, accuracy: 76, timeliness: 88 },
    columnProfiles: [
      { columnName: 'MA_KH', dataType: 'VARCHAR(20)', nullCount: 0, nullRate: 0, distinctCount: 1250000, distinctRate: 100, minValue: 'KH0000001', maxValue: 'KH9999999', sampleValues: ['KH0000001', 'KH0000002', 'KH0000003'], issues: [] },
      { columnName: 'HO_TEN', dataType: 'NVARCHAR(200)', nullCount: 125, nullRate: 0.01, distinctCount: 1180000, distinctRate: 94.4, sampleValues: ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C'], issues: ['0.01% giá trị null'] },
      { columnName: 'NGAY_SINH', dataType: 'DATE', nullCount: 72500, nullRate: 5.8, distinctCount: 28000, distinctRate: 2.24, minValue: '1924-01-01', maxValue: '2008-12-31', sampleValues: ['1985-03-15', '1990-07-22', '1978-11-08'], issues: ['5.8% giá trị null - vượt ngưỡng 2%'] },
      { columnName: 'CMND_CCCD', dataType: 'VARCHAR(12)', nullCount: 18750, nullRate: 1.5, distinctCount: 1231250, distinctRate: 98.5, sampleValues: ['012345678901', '098765432101', '111222333444'], issues: ['1.5% giá trị null'] },
      { columnName: 'EMAIL', dataType: 'VARCHAR(100)', nullCount: 250000, nullRate: 20, distinctCount: 995000, distinctRate: 79.6, sampleValues: ['abc@gmail.com', 'xyz@yahoo.com', 'invalid-email'], issues: ['12.7% email sai định dạng', '20% giá trị null'] },
      { columnName: 'SO_DIEN_THOAI', dataType: 'VARCHAR(15)', nullCount: 62500, nullRate: 5, distinctCount: 1185000, distinctRate: 94.8, sampleValues: ['0901234567', '0912345678', '84901234567'], issues: ['21.5% sai định dạng'] },
    ]
  },
  {
    id: 'pr-002', tableId: 'ds-002', tableName: 'GD_GIAODICH', runAt: '2026-03-28T06:00:00', status: 'completed',
    totalRows: 45000000, totalColumns: 22, overallScore: 74, durationSeconds: 1820,
    dimensionScores: { completeness: 88, validity: 72, consistency: 65, uniqueness: 99, accuracy: 68, timeliness: 55 },
    columnProfiles: [
      { columnName: 'MA_GD', dataType: 'VARCHAR(30)', nullCount: 0, nullRate: 0, distinctCount: 45000000, distinctRate: 100, sampleValues: ['GD20260328001', 'GD20260328002'], issues: [] },
      { columnName: 'SO_TIEN', dataType: 'DECIMAL(18,2)', nullCount: 450, nullRate: 0.001, distinctCount: 8500000, distinctRate: 18.9, minValue: '1000', maxValue: '5000000000', sampleValues: ['500000', '1200000', '50000'], issues: [] },
      { columnName: 'MA_KH', dataType: 'VARCHAR(20)', nullCount: 45000, nullRate: 0.1, distinctCount: 980000, distinctRate: 2.18, sampleValues: ['KH0000001', 'KH0000050'], issues: ['9% MA_KH không tồn tại trong KH_KHACHHANG'] },
    ]
  },
  {
    id: 'pr-003', tableId: 'ds-006', tableName: 'BAO_CAO_NGAY', runAt: '2026-03-28T09:00:00', status: 'failed',
    totalRows: 0, totalColumns: 0, overallScore: 0, durationSeconds: 12,
    dimensionScores: { completeness: 0, validity: 0, consistency: 0, uniqueness: 0, accuracy: 0, timeliness: 0 },
    columnProfiles: []
  },
]

export const mockDashboardStats: DashboardStats = {
  totalTables: 15,
  tablesMonitored: 13,
  avgHealthScore: 78.4,
  openIssues: 12,
  criticalIssues: 3,
  rulesActive: 20,
  lastUpdated: new Date().toISOString()
}

export const mockTrendData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
  score: Math.round(72 + Math.sin(i * 0.4) * 8 + i * 0.2),
  issues: Math.max(1, Math.floor(15 - i * 0.3 + Math.sin(i * 0.5) * 3)),
}))

export const mockDimensionTrend = Array.from({ length: 12 }, (_, i) => {
  const month = new Date(2025, i, 1).toLocaleDateString('vi-VN', { month: 'short' })
  return {
    month,
    completeness: Math.round(85 + Math.sin(i * 0.5) * 8),
    validity: Math.round(80 + Math.sin(i * 0.6 + 1) * 9),
    consistency: Math.round(72 + Math.sin(i * 0.4 + 2) * 10),
    uniqueness: Math.round(95 + Math.sin(i * 0.3) * 3),
    accuracy: Math.round(75 + Math.sin(i * 0.5 + 1) * 8),
    timeliness: Math.round(65 + Math.sin(i * 0.7) * 12),
  }
})

export const mockPipelineJobs: PipelineJob[] = [
  {
    id: 'pj-001', name: 'ETL_KH_DAILY', description: 'Đồng bộ dữ liệu khách hàng từ hệ thống core banking',
    jobType: 'etl', technology: 'Airflow', owner: 'Nguyễn Thị Lan', ownerEmail: 'lan@company.com',
    team: 'Nhóm Khách hàng', inputTableIds: [], outputTableIds: ['ds-001'],
    status: 'active', schedule: 'Hàng ngày 05:00', lastRunAt: '2026-04-01T05:00:00', lastRunStatus: 'success',
  },
  {
    id: 'pj-002', name: 'ETL_GD_DAILY', description: 'Tổng hợp giao dịch hàng ngày vào bảng GD_GIAODICH',
    jobType: 'etl', technology: 'Kafka', owner: 'Trần Văn Minh', ownerEmail: 'minh@company.com',
    team: 'Nhóm Giao dịch', inputTableIds: ['ds-011'], outputTableIds: ['ds-002'],
    status: 'active', schedule: 'Hàng ngày 02:00', lastRunAt: '2026-04-01T02:00:00', lastRunStatus: 'success',
  },
  {
    id: 'pj-003', name: 'ETL_TK_SYNC', description: 'Đồng bộ thông tin tài khoản từ hệ thống lõi qua SSIS',
    jobType: 'etl', technology: 'SSIS', owner: 'Lê Thị Hoa', ownerEmail: 'hoa@company.com',
    team: 'Nhóm Sản phẩm', inputTableIds: [], outputTableIds: ['ds-003'],
    status: 'active', schedule: 'Hàng ngày 04:30', lastRunAt: '2026-04-01T04:30:00', lastRunStatus: 'success',
  },
  {
    id: 'pj-004', name: 'ETL_HOPDONG', description: 'Tổng hợp dữ liệu hợp đồng từ TK_TAIKHOAN và KH_KHACHHANG',
    jobType: 'etl', technology: 'Spark', owner: 'Nguyễn Thị Lan', ownerEmail: 'lan@company.com',
    team: 'Nhóm Tín dụng', inputTableIds: ['ds-003', 'ds-001'], outputTableIds: ['ds-005'],
    status: 'active', schedule: 'Hàng ngày 06:00', lastRunAt: '2026-04-01T06:00:00', lastRunStatus: 'success',
  },
  {
    id: 'pj-005', name: 'RPT_BAO_CAO_NGAY', description: 'Tổng hợp báo cáo kinh doanh hàng ngày từ GD và KH',
    jobType: 'etl', technology: 'Python', owner: 'Trần Văn Minh', ownerEmail: 'minh@company.com',
    team: 'Nhóm Báo cáo', inputTableIds: ['ds-002', 'ds-001'], outputTableIds: ['ds-006'],
    status: 'active', schedule: 'Hàng ngày 07:00', lastRunAt: '2026-04-01T07:00:00', lastRunStatus: 'failed',
  },
  {
    id: 'pj-006', name: 'ETL_KPI', description: 'Tính toán KPI kinh doanh từ GD, HĐ và báo cáo ngày',
    jobType: 'etl', technology: 'Spark', owner: 'Lê Thị Hoa', ownerEmail: 'hoa@company.com',
    team: 'Nhóm Báo cáo', inputTableIds: ['ds-002', 'ds-005', 'ds-006'], outputTableIds: ['ds-015'],
    status: 'active', schedule: 'Hàng ngày 08:00', lastRunAt: '2026-04-01T08:00:00', lastRunStatus: 'failed',
  },
  {
    id: 'pj-007', name: 'ETL_RISKDATA', description: 'Tổng hợp dữ liệu rủi ro từ GD và KH để phân tích tín dụng',
    jobType: 'etl', technology: 'Spark', owner: 'Phạm Quốc Hùng', ownerEmail: 'hung@company.com',
    team: 'Nhóm Rủi ro', inputTableIds: ['ds-002', 'ds-001'], outputTableIds: ['ds-012'],
    status: 'active', schedule: 'Hàng ngày 06:30', lastRunAt: '2026-04-01T06:30:00', lastRunStatus: 'failed',
  },
  {
    id: 'pj-008', name: 'ETL_LOG_ARCHIVE', description: 'Lưu trữ log giao dịch tổng hợp vào bảng archive tháng',
    jobType: 'etl', technology: 'Python', owner: 'Trần Văn Minh', ownerEmail: 'minh@company.com',
    team: 'Nhóm Lưu trữ', inputTableIds: ['ds-011'], outputTableIds: ['ds-014'],
    status: 'active', schedule: 'Cuối tháng 23:00', lastRunAt: '2026-03-31T23:00:00', lastRunStatus: 'success',
  },
  {
    id: 'pj-009', name: 'ETL_BIEUPHI', description: 'Cập nhật biểu phí dịch vụ từ dữ liệu tài khoản',
    jobType: 'etl', technology: 'SSIS', owner: 'Lê Thị Hoa', ownerEmail: 'hoa@company.com',
    team: 'Nhóm Sản phẩm', inputTableIds: ['ds-003'], outputTableIds: ['ds-010'],
    status: 'active', schedule: 'Hàng tuần T2 06:00', lastRunAt: '2026-03-30T06:00:00', lastRunStatus: 'success',
  },
  {
    id: 'pj-010', name: 'ETL_PHANQUYEN', description: 'Đồng bộ phân quyền dựa trên nhóm khách hàng',
    jobType: 'etl', technology: 'Python', owner: 'Nguyễn Thị Lan', ownerEmail: 'lan@company.com',
    team: 'Nhóm Bảo mật', inputTableIds: ['ds-001'], outputTableIds: ['ds-013'],
    status: 'inactive', schedule: 'Hàng ngày 03:00', lastRunAt: '2026-03-31T03:00:00', lastRunStatus: 'success',
  },
  {
    id: 'pj-011', name: 'ETL_TONG_HOP_TUAN', description: 'Tổng hợp toàn diện dữ liệu kinh doanh cuối tuần: giao dịch, khách hàng, hợp đồng, báo cáo ngày',
    jobType: 'etl', technology: 'Spark', owner: 'Lê Thị Hoa', ownerEmail: 'hoa@company.com',
    team: 'Nhóm Báo cáo', inputTableIds: ['ds-002', 'ds-001', 'ds-005', 'ds-006'], outputTableIds: ['ds-015'],
    status: 'active', schedule: 'Hàng tuần T7 22:00', lastRunAt: '2026-03-29T22:00:00', lastRunStatus: 'failed',
  },
  {
    id: 'pj-012', name: 'ETL_DM_DANHMUC', description: 'Làm mới danh mục tiền tệ và chi nhánh, cập nhật vào bảng sản phẩm',
    jobType: 'etl', technology: 'Python', owner: 'Phạm Quốc Hùng', ownerEmail: 'hung@company.com',
    team: 'Nhóm Quản trị dữ liệu', inputTableIds: ['ds-007', 'ds-008'], outputTableIds: ['ds-004'],
    status: 'active', schedule: 'Hàng tháng ngày 1 01:00', lastRunAt: '2026-04-01T01:00:00', lastRunStatus: 'success',
  },
]

// ========== CASCADE MOCK DATA ==========

export const cascadeConfig: CascadeConfig = {
  notifyDownstream: true,
  autoWaitingData: true,
  autoRerun: false,
  autoResolve: true,
  cascadeDepth: 0, // unlimited
  cascadeSummary: true,
}

export const cascadeChains: CascadeChain[] = [
  {
    id: 'chain-001',
    rootIssueId: 'ISS-031',
    rootTableId: 'ds-002',
    rootTableName: 'GD_GIAODICH',
    affectedEntities: [
      { tableId: 'ds-006', tableName: 'BAO_CAO_NGAY', type: 'report', status: 'waiting_data' },
      { tableId: 'ds-015', tableName: 'KPI_KINHDOANH', type: 'kpi', status: 'waiting_data' },
    ],
    status: 'active',
    startedAt: '2026-04-04T08:00:00Z',
    totalEvents: 7,
  },
  {
    id: 'chain-002',
    rootIssueId: 'ISS-025',
    rootTableId: 'ds-003',
    rootTableName: 'KH_KHACHHANG',
    affectedEntities: [
      { tableId: 'ds-012', tableName: 'QUAN_LY_RR', type: 'report', status: 'active' },
    ],
    status: 'resolved',
    startedAt: '2026-04-03T06:00:00Z',
    resolvedAt: '2026-04-03T09:30:00Z',
    totalEvents: 6,
  },
]

export const cascadeEvents: CascadeEvent[] = [
  // Chain 1: Active cascade — GD_GIAODICH → BAO_CAO_NGAY → KPI_KINHDOANH
  {
    id: 'ce-001',
    chainId: 'chain-001',
    triggerIssueId: 'ISS-031',
    sourceTableId: 'ds-002',
    sourceTableName: 'GD_GIAODICH',
    affectedTableId: 'ds-002',
    affectedTableName: 'GD_GIAODICH',
    affectedType: 'source',
    eventType: 'cascade_triggered',
    previousStatus: 'active',
    newStatus: 'error',
    message: 'Rule "not_null MA_GD" FAIL (score: 45/100). Bảng GD_GIAODICH chuyển trạng thái error.',
    timestamp: '2026-04-04T08:00:00Z',
  },
  {
    id: 'ce-002',
    chainId: 'chain-001',
    triggerIssueId: 'ISS-031',
    sourceTableId: 'ds-002',
    sourceTableName: 'GD_GIAODICH',
    affectedTableId: 'ds-002',
    affectedTableName: 'GD_GIAODICH',
    affectedType: 'source',
    eventType: 'notification_sent',
    notificationRecipient: 'Tran Van Minh',
    notificationChannel: 'email',
    message: 'Cảnh báo gửi cho Tran Van Minh (owner bảng GD_GIAODICH): Dữ liệu bị lỗi, cần xử lý.',
    timestamp: '2026-04-04T08:00:30Z',
  },
  {
    id: 'ce-003',
    chainId: 'chain-001',
    triggerIssueId: 'ISS-031',
    sourceTableId: 'ds-002',
    sourceTableName: 'GD_GIAODICH',
    affectedTableId: 'ds-006',
    affectedTableName: 'BAO_CAO_NGAY',
    affectedType: 'report',
    eventType: 'status_changed',
    previousStatus: 'active',
    newStatus: 'waiting_data',
    message: 'BAO_CAO_NGAY chuyển trạng thái "Chờ dữ liệu" do bảng nguồn GD_GIAODICH đang lỗi.',
    timestamp: '2026-04-04T08:01:00Z',
  },
  {
    id: 'ce-004',
    chainId: 'chain-001',
    triggerIssueId: 'ISS-031',
    sourceTableId: 'ds-002',
    sourceTableName: 'GD_GIAODICH',
    affectedTableId: 'ds-006',
    affectedTableName: 'BAO_CAO_NGAY',
    affectedType: 'report',
    eventType: 'notification_sent',
    notificationRecipient: 'Le Thi Hoa',
    notificationChannel: 'email',
    message: 'Thông báo gửi cho Le Thi Hoa (owner BC BAO_CAO_NGAY): Bảng GD_GIAODICH đang lỗi, báo cáo đang chờ dữ liệu.',
    timestamp: '2026-04-04T08:01:15Z',
  },
  {
    id: 'ce-005',
    chainId: 'chain-001',
    triggerIssueId: 'ISS-031',
    sourceTableId: 'ds-002',
    sourceTableName: 'GD_GIAODICH',
    affectedTableId: 'ds-015',
    affectedTableName: 'KPI_KINHDOANH',
    affectedType: 'kpi',
    eventType: 'status_changed',
    previousStatus: 'active',
    newStatus: 'waiting_data',
    message: 'KPI_KINHDOANH chuyển trạng thái "Chờ dữ liệu" do BAO_CAO_NGAY đang chờ dữ liệu.',
    timestamp: '2026-04-04T08:01:30Z',
  },
  {
    id: 'ce-006',
    chainId: 'chain-001',
    triggerIssueId: 'ISS-031',
    sourceTableId: 'ds-002',
    sourceTableName: 'GD_GIAODICH',
    affectedTableId: 'ds-015',
    affectedTableName: 'KPI_KINHDOANH',
    affectedType: 'kpi',
    eventType: 'notification_sent',
    notificationRecipient: 'Nguyen Van An',
    notificationChannel: 'sms',
    message: 'Thông báo gửi cho Nguyen Van An (owner KPI KPI_KINHDOANH): Dữ liệu đang lỗi, chỉ tiêu đang chờ cập nhật.',
    timestamp: '2026-04-04T08:01:45Z',
  },
  // The chain is still active - no resolution events yet for chain-001
  // This represents current state: waiting for fix

  // Chain 2: Resolved cascade — KH_KHACHHANG → QUAN_LY_RR (already resolved)
  {
    id: 'ce-101',
    chainId: 'chain-002',
    triggerIssueId: 'ISS-025',
    sourceTableId: 'ds-003',
    sourceTableName: 'KH_KHACHHANG',
    affectedTableId: 'ds-003',
    affectedTableName: 'KH_KHACHHANG',
    affectedType: 'source',
    eventType: 'cascade_triggered',
    previousStatus: 'active',
    newStatus: 'error',
    message: 'Rule "duplicate_single MSISDN" FAIL (score: 62/100). Bảng KH_KHACHHANG chuyển trạng thái error.',
    timestamp: '2026-04-03T06:00:00Z',
  },
  {
    id: 'ce-102',
    chainId: 'chain-002',
    triggerIssueId: 'ISS-025',
    sourceTableId: 'ds-003',
    sourceTableName: 'KH_KHACHHANG',
    affectedTableId: 'ds-012',
    affectedTableName: 'QUAN_LY_RR',
    affectedType: 'report',
    eventType: 'status_changed',
    previousStatus: 'active',
    newStatus: 'waiting_data',
    message: 'QUAN_LY_RR chuyển trạng thái "Chờ dữ liệu" do bảng nguồn KH_KHACHHANG đang lỗi.',
    timestamp: '2026-04-03T06:01:00Z',
  },
  {
    id: 'ce-103',
    chainId: 'chain-002',
    triggerIssueId: 'ISS-025',
    sourceTableId: 'ds-003',
    sourceTableName: 'KH_KHACHHANG',
    affectedTableId: 'ds-003',
    affectedTableName: 'KH_KHACHHANG',
    affectedType: 'source',
    eventType: 'resolved',
    previousStatus: 'error',
    newStatus: 'active',
    message: 'KH_KHACHHANG đã sửa lỗi. Chạy lại rule → PASS (score: 97/100).',
    timestamp: '2026-04-03T08:30:00Z',
  },
  {
    id: 'ce-104',
    chainId: 'chain-002',
    triggerIssueId: 'ISS-025',
    sourceTableId: 'ds-003',
    sourceTableName: 'KH_KHACHHANG',
    affectedTableId: 'ds-012',
    affectedTableName: 'QUAN_LY_RR',
    affectedType: 'report',
    eventType: 'revalidation_started',
    previousStatus: 'waiting_data',
    newStatus: 'revalidating',
    message: 'QUAN_LY_RR bắt đầu kiểm tra lại sau khi bảng nguồn KH_KHACHHANG đã OK.',
    timestamp: '2026-04-03T09:00:00Z',
  },
  {
    id: 'ce-105',
    chainId: 'chain-002',
    triggerIssueId: 'ISS-025',
    sourceTableId: 'ds-003',
    sourceTableName: 'KH_KHACHHANG',
    affectedTableId: 'ds-012',
    affectedTableName: 'QUAN_LY_RR',
    affectedType: 'report',
    eventType: 'resolved',
    previousStatus: 'revalidating',
    newStatus: 'active',
    message: 'QUAN_LY_RR chạy lại thành công. Trạng thái chuyển về Active.',
    timestamp: '2026-04-03T09:25:00Z',
  },
  {
    id: 'ce-106',
    chainId: 'chain-002',
    triggerIssueId: 'ISS-025',
    sourceTableId: 'ds-003',
    sourceTableName: 'KH_KHACHHANG',
    affectedTableId: 'ds-003',
    affectedTableName: 'KH_KHACHHANG',
    affectedType: 'source',
    eventType: 'chain_completed',
    message: 'Chuỗi cảnh báo KH_KHACHHANG → QUAN_LY_RR đã khôi phục hoàn toàn (3h30 từ phát hiện → hoàn tất).',
    timestamp: '2026-04-03T09:30:00Z',
  },
]

// Reconciliation results — derived from rules r-029, r-030, r-032
export const reconciliationResults: ReconciliationResult[] = [
  {
    id: 'recon-001',
    ruleId: 'r-029',
    ruleName: 'BC - Đối soát tổng giao dịch ngày',
    metricType: 'aggregate_reconciliation',
    reportTableId: 'ds-006',
    reportTableName: 'BAO_CAO_NGAY',
    reportColumn: 'THUC_TE',
    sourceTableId: 'ds-002',
    sourceTableName: 'GD_GIAODICH',
    sourceColumn: 'SO_TIEN',
    sourceValue: 1523456000,
    reportValue: 1525283947,
    variance: 0.12,
    tolerancePct: 0.1,
    result: 'warning',
    qualityScore: 92.5,
    checkedAt: '2026-03-28T09:00:00',
  },
  {
    id: 'recon-002',
    ruleId: 'r-030',
    ruleName: 'BC - Số dòng báo cáo khớp nguồn',
    metricType: 'report_row_count_match',
    reportTableId: 'ds-006',
    reportTableName: 'BAO_CAO_NGAY',
    reportColumn: 'COUNT(*)',
    sourceTableId: 'ds-002',
    sourceTableName: 'GD_GIAODICH',
    sourceColumn: 'COUNT(DISTINCT NGAY_GD)',
    sourceValue: 31,
    reportValue: 31,
    variance: 0.0,
    tolerancePct: 1,
    result: 'pass',
    qualityScore: 98.0,
    checkedAt: '2026-03-28T09:00:00',
  },
  {
    id: 'recon-003',
    ruleId: 'r-032',
    ruleName: 'RR - Đối soát SUM rủi ro với nguồn',
    metricType: 'aggregate_reconciliation',
    reportTableId: 'ds-012',
    reportTableName: 'QUAN_LY_RR',
    reportColumn: 'DIEM_RR',
    sourceTableId: 'ds-001',
    sourceTableName: 'KH_KHACHHANG',
    sourceColumn: 'DIEM_RR',
    sourceValue: 847523,
    reportValue: 846845,
    variance: 0.08,
    tolerancePct: 0.5,
    result: 'pass',
    qualityScore: 96.0,
    checkedAt: '2026-03-28T04:00:00',
  },
]

// KPI Period Results — điểm chất lượng theo kỳ
export const kpiPeriodResults: KpiPeriodResult[] = [
  // KPI_KINHDOANH (ds-015) — parent
  { kpiId: 'ds-015', period: '2026-01', qualityScore: 80, previousScore: 75, ruleResults: [
    { ruleId: 'r-033', ruleName: 'KPI - Biến động chỉ tiêu ≤ 30%', score: 74, result: 'warning' },
    { ruleId: 'r-034', ruleName: 'KPI - Đầy đủ kỳ tháng', score: 96, result: 'pass' },
    { ruleId: 'r-035', ruleName: 'KPI - Tổng chi nhánh = tổng công ty', score: 98, result: 'pass' },
  ]},
  { kpiId: 'ds-015', period: '2026-02', qualityScore: 77, previousScore: 80, ruleResults: [
    { ruleId: 'r-033', ruleName: 'KPI - Biến động chỉ tiêu ≤ 30%', score: 72, result: 'warning' },
    { ruleId: 'r-034', ruleName: 'KPI - Đầy đủ kỳ tháng', score: 97, result: 'pass' },
    { ruleId: 'r-035', ruleName: 'KPI - Tổng chi nhánh = tổng công ty', score: 99, result: 'pass' },
  ]},
  { kpiId: 'ds-015', period: '2026-03', qualityScore: 77, previousScore: 77, ruleResults: [
    { ruleId: 'r-033', ruleName: 'KPI - Biến động chỉ tiêu ≤ 30%', score: 72, result: 'warning' },
    { ruleId: 'r-034', ruleName: 'KPI - Đầy đủ kỳ tháng', score: 97, result: 'pass' },
    { ruleId: 'r-035', ruleName: 'KPI - Tổng chi nhánh = tổng công ty', score: 99.2, result: 'pass' },
  ]},
  // KPI_DOANHTHU_CN (ds-016)
  { kpiId: 'ds-016', period: '2026-01', qualityScore: 82, previousScore: 78, ruleResults: [
    { ruleId: 'r-036', ruleName: 'KPI CN - Biến động doanh thu ≤ 25%', score: 85, result: 'pass' },
    { ruleId: 'r-037', ruleName: 'KPI CN - Đầy đủ kỳ tháng', score: 94, result: 'pass' },
  ]},
  { kpiId: 'ds-016', period: '2026-02', qualityScore: 86, previousScore: 82, ruleResults: [
    { ruleId: 'r-036', ruleName: 'KPI CN - Biến động doanh thu ≤ 25%', score: 90, result: 'pass' },
    { ruleId: 'r-037', ruleName: 'KPI CN - Đầy đủ kỳ tháng', score: 95, result: 'pass' },
  ]},
  { kpiId: 'ds-016', period: '2026-03', qualityScore: 85, previousScore: 86, ruleResults: [
    { ruleId: 'r-036', ruleName: 'KPI CN - Biến động doanh thu ≤ 25%', score: 88.5, result: 'pass' },
    { ruleId: 'r-037', ruleName: 'KPI CN - Đầy đủ kỳ tháng', score: 96, result: 'pass' },
  ]},
  // KPI_DOANHTHU_ONLINE (ds-017)
  { kpiId: 'ds-017', period: '2026-01', qualityScore: 88, previousScore: 84, ruleResults: [
    { ruleId: 'r-038', ruleName: 'KPI Online - Biến động ≤ 35%', score: 90, result: 'pass' },
    { ruleId: 'r-039', ruleName: 'KPI Online - Đầy đủ kỳ tháng', score: 93, result: 'pass' },
  ]},
  { kpiId: 'ds-017', period: '2026-02', qualityScore: 90, previousScore: 88, ruleResults: [
    { ruleId: 'r-038', ruleName: 'KPI Online - Biến động ≤ 35%', score: 92, result: 'pass' },
    { ruleId: 'r-039', ruleName: 'KPI Online - Đầy đủ kỳ tháng', score: 95, result: 'pass' },
  ]},
  { kpiId: 'ds-017', period: '2026-03', qualityScore: 91, previousScore: 90, ruleResults: [
    { ruleId: 'r-038', ruleName: 'KPI Online - Biến động ≤ 35%', score: 93, result: 'pass' },
    { ruleId: 'r-039', ruleName: 'KPI Online - Đầy đủ kỳ tháng', score: 95.5, result: 'pass' },
  ]},
  // KPI_CHIPHI (ds-018)
  { kpiId: 'ds-018', period: '2026-01', qualityScore: 78, previousScore: 72, ruleResults: [
    { ruleId: 'r-040', ruleName: 'KPI CP - Biến động chi phí ≤ 20%', score: 80, result: 'pass' },
    { ruleId: 'r-041', ruleName: 'KPI CP - Đầy đủ phân loại chi phí', score: 88, result: 'pass' },
  ]},
  { kpiId: 'ds-018', period: '2026-02', qualityScore: 75, previousScore: 78, ruleResults: [
    { ruleId: 'r-040', ruleName: 'KPI CP - Biến động chi phí ≤ 20%', score: 74, result: 'warning' },
    { ruleId: 'r-041', ruleName: 'KPI CP - Đầy đủ phân loại chi phí', score: 91, result: 'pass' },
  ]},
  { kpiId: 'ds-018', period: '2026-03', qualityScore: 73, previousScore: 75, ruleResults: [
    { ruleId: 'r-040', ruleName: 'KPI CP - Biến động chi phí ≤ 20%', score: 76, result: 'warning' },
    { ruleId: 'r-041', ruleName: 'KPI CP - Đầy đủ phân loại chi phí', score: 90, result: 'pass' },
  ]},
  // KPI_LOINHUAN (ds-019)
  { kpiId: 'ds-019', period: '2026-01', qualityScore: 72, previousScore: 68, ruleResults: [
    { ruleId: 'r-042', ruleName: 'KPI LN - Biến động lợi nhuận ≤ 30%', score: 68, result: 'warning' },
    { ruleId: 'r-043', ruleName: 'KPI LN - Tổng con = tổng cha', score: 60, result: 'fail' },
  ]},
  { kpiId: 'ds-019', period: '2026-02', qualityScore: 70, previousScore: 72, ruleResults: [
    { ruleId: 'r-042', ruleName: 'KPI LN - Biến động lợi nhuận ≤ 30%', score: 66, result: 'warning' },
    { ruleId: 'r-043', ruleName: 'KPI LN - Tổng con = tổng cha', score: 62, result: 'fail' },
  ]},
  { kpiId: 'ds-019', period: '2026-03', qualityScore: 68, previousScore: 70, ruleResults: [
    { ruleId: 'r-042', ruleName: 'KPI LN - Biến động lợi nhuận ≤ 30%', score: 65, result: 'warning' },
    { ruleId: 'r-043', ruleName: 'KPI LN - Tổng con = tổng cha', score: 58, result: 'fail' },
  ]},
]

export function getDownstreamJobs(tableId: string): PipelineJob[] {
  return mockPipelineJobs.filter(job => job.inputTableIds.includes(tableId))
}

export function getUpstreamJobs(tableId: string): PipelineJob[] {
  return mockPipelineJobs.filter(job => job.outputTableIds.includes(tableId))
}
