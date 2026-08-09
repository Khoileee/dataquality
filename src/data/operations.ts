import { STATS } from './stats'

/* ═══════════════ 8.1 Sức khoẻ dữ liệu ═══════════════ */

export const healthBars = [
  { label: 'Bảng đã gán miền dữ liệu', pct: 62, target: 90, note: `${(STATS.totalTables - STATS.tablesNoDomain).toLocaleString('vi-VN')} / ${STATS.totalTables.toLocaleString('vi-VN')}` },
  { label: 'Bảng đã có người phụ trách', pct: 34, target: 95, note: `${STATS.tablesWithOwner.toLocaleString('vi-VN')} / ${STATS.totalTables.toLocaleString('vi-VN')}` },
  { label: 'Bảng có mô tả nghiệp vụ', pct: 58, target: 90, note: '6.660 / 11.482' },
  { label: 'Metadata đã được phê duyệt', pct: 41, target: 85, note: '4.708 / 11.482' },
  { label: 'Bảng đang được kiểm chất lượng', pct: 0.6, target: 25, note: `${STATS.tablesWithQuality} / ${STATS.totalTables.toLocaleString('vi-VN')}` },
  { label: 'Cột nhạy cảm đã gắn nhãn', pct: 78, target: 100, note: '412 / 528 cột nghi ngờ' },
  { label: 'Cột nhạy cảm đã có chính sách che', pct: 0, target: 100, note: `${STATS.maskedColumns} / ${STATS.sensitiveColumns}` },
  { label: 'Báo cáo / chỉ tiêu truy vết được tới nguồn', pct: 31, target: 80, note: `${STATS.reportsTraceable} / ${STATS.totalReports}` },
  { label: 'Độ phủ quan hệ luồng dữ liệu (lineage)', pct: 46, target: 85, note: '848 / 1.842 job đã bật quét' },
  { label: 'Quyền truy cập có thời hạn', pct: 13, target: 100, note: '235 / 1.847 chính sách' },
]

export const weakestTables = [
  { id: 'rr.diem_rui_ro_kh', score: 62, usageWeek: 312, reason: 'Dữ liệu trễ 18 giờ · chưa có đầu mối nghiệp vụ', reports: 1 },
  { id: 'crm.khach_hang', score: 73, usageWeek: 2_418, reason: 'Tỷ lệ điền email 75% · số căn cước sai định dạng 8%', reports: 2 },
  { id: 'mart.phan_khuc_kh', score: 76, usageWeek: 428, reason: '32% khách hàng chưa có phân khúc', reports: 1 },
  { id: 'raw.doi_soat_A_tho', score: 78, usageWeek: 42, reason: 'Số điện thoại sai định dạng 5,8%', reports: 0 },
  { id: 'crm.khach_hang_cu', score: 48, usageWeek: 8, reason: 'Không cập nhật 221 ngày · sắp ngừng sử dụng', reports: 0 },
]

export const moduleContribution = [
  { module: '① Data Catalog', gives: 'Danh mục · metadata · người phụ trách · mức quan trọng', metric: 'Độ phủ danh mục · độ hoàn thiện metadata' },
  { module: '② Governance', gives: 'Thuật ngữ · nhãn phân loại · quan hệ luồng dữ liệu · phê duyệt', metric: 'Tỷ lệ đã phê duyệt · độ phủ lineage' },
  { module: '③ Data Quality', gives: 'Điểm chất lượng 6 chiều · sự cố · thời gian xử lý', metric: 'Điểm chất lượng · số lỗi lặp lại' },
  { module: '④ Nạp & Điều phối', gives: 'Độ tươi dữ liệu · kết quả chạy job · lô bị giữ', metric: 'Tỷ lệ job đúng giờ cam kết' },
  { module: '⑤ Data Security', gives: 'Quyền · che dữ liệu · nhật ký · truy cập bất thường', metric: 'Quyền quá hạn · cột đã che' },
  { module: '⑥ Chính sách & Tuân thủ', gives: 'Chính sách · vòng đời · kết quả đánh giá', metric: 'Điểm tuân thủ · phát hiện chưa khắc phục' },
  { module: '⑦ Dữ liệu chủ', gives: 'Bản ghi chuẩn · tỷ lệ trùng · mức độ áp dụng', metric: 'Tỷ lệ hệ thống dùng mã chuẩn' },
]

/** Tiến độ theo giai đoạn BDA */
export const phaseProgress = [
  { phase: 'GĐ1 — Khảo sát & nền tảng', desc: 'Phạm vi · vai trò · tiêu chuẩn metadata · kiến trúc', pct: 100, status: 'Hoàn thành' },
  { phase: 'GĐ2 — Danh mục · Metadata · Lineage', desc: '8 menu Catalog + 4 menu Governance', pct: 62, status: 'Đang triển khai' },
  { phase: 'GĐ3 — Chất lượng dữ liệu', desc: '5 menu Data Quality + cổng chất lượng tại cửa nạp', pct: 34, status: 'Đang triển khai' },
  { phase: 'GĐ4 — Phân loại · Bảo mật · Tuân thủ', desc: '5 menu Security + 3 menu Chính sách & Tuân thủ', pct: 28, status: 'Đang triển khai' },
  { phase: 'GĐ5 — Dữ liệu chủ & mở rộng', desc: '4 menu MDM', pct: 12, status: 'Mới bắt đầu' },
]

export const domainHealth = [
  { domain: 'Kinh doanh', owner: 'Nguyễn Thị Phương', tables: 1_842, covered: 71, quality: 88, sensitive: 62, masked: 0, incidents: 4 },
  { domain: 'Khách hàng', owner: 'Phạm Thu Hà', tables: 964, covered: 64, quality: 82, sensitive: 184, masked: 0, incidents: 6 },
  { domain: 'Giao dịch', owner: 'Phạm Thu Hà', tables: 2_104, covered: 58, quality: 86, sensitive: 128, masked: 0, incidents: 8 },
  { domain: 'Tài chính', owner: 'Phạm Thu Hà', tables: 1_438, covered: 61, quality: 84, sensitive: 24, masked: 0, incidents: 2 },
  { domain: 'Rủi ro & Tuân thủ', owner: 'Đỗ Quang Vinh', tables: 800, covered: 44, quality: 76, sensitive: 14, masked: 0, incidents: 3 },
  { domain: '— Chưa gán miền —', owner: '— không ai', tables: 4_334, covered: 0, quality: null, sensitive: 0, masked: 0, incidents: 0 },
]

/* ═══════════════ 8.2 Cấu hình hệ thống ═══════════════ */

export const connections = [
  { id: 'KN-01', name: 'DWH_ICEBERG', kind: 'JDBC — Spark Thrift', target: 'thrift://dwh-master:10000', system: 'HT-03', auth: 'Kerberos keytab', status: 'Hoạt động', lastCheck: '2026-08-09 09:00' },
  { id: 'KN-02', name: 'CRM_ORACLE', kind: 'JDBC — Oracle', target: 'jdbc:oracle:thin:@crm-db:1521/CRMPRD', system: 'HT-01', auth: 'Tài khoản dịch vụ', status: 'Hoạt động', lastCheck: '2026-08-09 09:00' },
  { id: 'KN-03', name: 'CORE_PG', kind: 'JDBC — PostgreSQL', target: 'jdbc:postgresql://core-db:5432/payment', system: 'HT-02', auth: 'Tài khoản dịch vụ', status: 'Hoạt động', lastCheck: '2026-08-09 09:00' },
  { id: 'KN-04', name: 'KAFKA_TXN', kind: 'Kafka', target: 'kafka-1:9093,kafka-2:9093', system: 'HT-07', auth: 'SASL/SCRAM + TLS', status: 'Hoạt động', lastCheck: '2026-08-09 09:00' },
  { id: 'KN-05', name: 'HDFS_PARTNER_B', kind: 'SFTP', target: 'sftp://partner-b.example/outbound', system: 'HT-09', auth: 'SSH key', status: 'Lỗi xác thực', lastCheck: '2026-08-09 09:00' },
  { id: 'KN-06', name: 'FIN_MSSQL', kind: 'JDBC — SQL Server', target: 'jdbc:sqlserver://fin-db:1433;database=GL', system: 'HT-05', auth: 'Tài khoản dịch vụ', status: 'Hoạt động', lastCheck: '2026-08-09 09:00' },
  { id: 'KN-07', name: 'RISK_MONGO', kind: 'MongoDB', target: 'mongodb://risk-db:27017/aml', system: 'HT-08', auth: 'SCRAM-SHA-256', status: 'Cảnh báo', lastCheck: '2026-08-09 09:00' },
]

export const tierDefinitions = [
  { tier: 'Tier 1', name: 'Trọng yếu', criteria: 'Phục vụ báo cáo cho Ban Điều hành hoặc cơ quan quản lý; hoặc > 1.000 lượt dùng/tuần', required: ['Người sở hữu dữ liệu', 'Đầu mối nghiệp vụ', 'Đầu mối kỹ thuật', 'Mô tả nghiệp vụ', 'Chu kỳ cập nhật cam kết', 'Tối thiểu 5 luật chất lượng'], sla: 'Xử lý sự cố trong 24 giờ', count: 284 },
  { tier: 'Tier 2', name: 'Quan trọng', criteria: 'Phục vụ báo cáo cấp ban hoặc là bảng nguồn của bảng Tier 1', required: ['Đầu mối nghiệp vụ', 'Đầu mối kỹ thuật', 'Mô tả nghiệp vụ', 'Tối thiểu 2 luật chất lượng'], sla: 'Xử lý sự cố trong 72 giờ', count: 1_842 },
  { tier: 'Tier 3', name: 'Thông thường', criteria: 'Các bảng còn lại đã được khai báo', required: ['Đầu mối kỹ thuật'], sla: 'Xử lý theo kế hoạch', count: 9_356 },
]

export const namingRules = [
  { id: 'CT-01', object: 'Bảng', pattern: '^[a-z][a-z0-9_]{2,62}$', example: 'bi.doi_soat_giao_dich_a', note: 'Chữ thường, không dấu, phân cách bằng gạch dưới' },
  { id: 'CT-02', object: 'Tiền tố vùng lưu trữ', pattern: '^(raw|dwh|mart|bi|fin|crm|ops|ref)\\.', example: 'mart.doanh_thu_ngay', note: 'Bắt buộc có tiền tố vùng' },
  { id: 'CT-03', object: 'Cột', pattern: '^[a-z][a-z0-9_]{1,62}$', example: 'ma_khach_hang', note: 'Không dùng tên viết tắt khó hiểu' },
  { id: 'CT-04', object: 'Job', pattern: '^JOB-[0-9]{4}$', example: 'JOB-0412', note: 'Mã tự sinh theo thứ tự' },
  { id: 'CT-05', object: 'Chỉ tiêu', pattern: '^CT-[0-9]{3}$', example: 'CT-001', note: 'Mã tự sinh' },
  { id: 'CT-06', object: 'Báo cáo', pattern: '^BC-[0-9]{3}$', example: 'BC-001', note: 'Mã tự sinh' },
]

export const systemParams = [
  { group: 'Chất lượng dữ liệu', key: 'nguong_canh_bao_mac_dinh', value: '99', unit: '%', note: 'Ngưỡng cảnh báo toàn cục khi luật không khai riêng' },
  { group: 'Chất lượng dữ liệu', key: 'nguong_nghiem_trong_mac_dinh', value: '95', unit: '%', note: 'Ngưỡng nghiêm trọng toàn cục' },
  { group: 'Chất lượng dữ liệu', key: 'so_dong_loi_luu_toi_da', value: '10.000', unit: 'dòng', note: 'Số dòng lỗi lưu lại cho mỗi lần kiểm tra' },
  { group: 'Cổng chặn', key: 'bat_cong_chan_tu_tier', value: 'Tier 1', unit: '—', note: 'Chỉ áp cổng chặn cho bảng từ mức này trở lên' },
  { group: 'Nguồn gốc dữ liệu', key: 'bat_quet_lineage_mac_dinh', value: 'Bật', unit: '—', note: 'Job tạo mới mặc định bật quét nguồn gốc' },
  { group: 'Bảo mật', key: 'thoi_han_quyen_toi_da_mat', value: '6', unit: 'tháng', note: 'Thời hạn tối đa cho quyền trên dữ liệu mức Mật' },
  { group: 'Bảo mật', key: 'thoi_han_quyen_toi_da_han_che', value: '3', unit: 'tháng', note: 'Thời hạn tối đa cho dữ liệu mức Hạn chế truy cập' },
  { group: 'Bảo mật', key: 'nguong_tai_xuong_canh_bao', value: '50.000', unit: 'dòng', note: 'Vượt ngưỡng này sẽ sinh cảnh báo truy cập bất thường' },
  { group: 'Sự cố', key: 'bat_buoc_4_mat_khi_dong', value: 'Bật', unit: '—', note: 'Người xử lý không được tự đóng sự cố' },
  { group: 'Sự cố', key: 'han_xu_ly_nghiem_trong', value: '24', unit: 'giờ', note: 'Hạn xử lý mặc định cho sự cố nghiêm trọng' },
]
