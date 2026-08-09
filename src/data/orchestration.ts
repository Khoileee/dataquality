import type { JobRow, JobStep, JobRun, JobVersion, IngestTemplate, QuarantineBatch } from './types'

/* ═══════════════ 4.1 Luồng xử lý (Job) ═══════════════ */

export const jobs: JobRow[] = [
  {
    id: 'JOB-0412', name: 'Đối soát giao dịch đối tác A', group: 'Đối soát',
    purpose: 'Đối chiếu giao dịch nội bộ với file đối tác A, tính chênh lệch và ghi bảng đích',
    targetTable: 'bi.doi_soat_giao_dich_A', targetInCatalog: true,
    sourceTables: ['raw.doi_soat_A_tho', 'dwh.giao_dich_thanh_toan', 'ref.tinh_thanh'],
    steps: 5, schedule: '0 0 6 * * ?', scheduleText: 'Hằng ngày 06:00', slaTime: '07:00',
    lastRun: '2026-08-09 06:00', lastResult: 'Thành công', durationMin: 34,
    lineageScan: true, approval: 'Đã phê duyệt', owner: 'Nguyễn Thị Phương', de: 'Trần Văn Hùng',
    version: 'v12', alertTo: ['Nhóm Đối soát', 'Trần Văn Hùng'],
  },
  {
    id: 'JOB-0208', name: 'Chuẩn hoá giao dịch thanh toán', group: 'Giao dịch',
    purpose: 'Chuẩn hoá và làm sạch giao dịch từ nguồn Kafka và Core thanh toán',
    targetTable: 'dwh.giao_dich_thanh_toan', targetInCatalog: true,
    sourceTables: ['raw.giao_dich_kafka'],
    steps: 8, schedule: '0 5 * * * ?', scheduleText: 'Mỗi giờ, phút thứ 5', slaTime: '—',
    lastRun: '2026-08-09 10:05', lastResult: 'Thành công', durationMin: 12,
    lineageScan: true, approval: 'Đã phê duyệt', owner: 'Phạm Thu Hà', de: 'Trần Văn Hùng',
    version: 'v28', alertTo: ['Trần Văn Hùng'],
  },
  {
    id: 'JOB-0301', name: 'Tổng hợp doanh thu ngày', group: 'Kinh doanh',
    purpose: 'Tổng hợp doanh thu theo ngày, kênh và sản phẩm phục vụ báo cáo',
    targetTable: 'mart.doanh_thu_ngay', targetInCatalog: true,
    sourceTables: ['dwh.giao_dich_thanh_toan', 'dwh.san_pham', 'dwh.kenh_ban_hang'],
    steps: 4, schedule: '0 30 7 * * ?', scheduleText: 'Hằng ngày 07:30', slaTime: '08:00',
    lastRun: '2026-08-09 07:30', lastResult: 'Thành công', durationMin: 18,
    lineageScan: true, approval: 'Đã phê duyệt', owner: 'Nguyễn Thị Phương', de: 'Trần Văn Hùng',
    version: 'v9', alertTo: ['Nhóm Kinh doanh'],
  },
  {
    id: 'JOB-0117', name: 'Đồng bộ hồ sơ khách hàng', group: 'Khách hàng',
    purpose: 'Đồng bộ khách hàng và hợp đồng từ CRM về kho dữ liệu',
    targetTable: 'crm.khach_hang', targetInCatalog: true,
    sourceTables: [],
    steps: 6, schedule: '0 0 2 * * ?', scheduleText: 'Hằng ngày 02:00', slaTime: '04:00',
    lastRun: '2026-08-09 02:00', lastResult: 'Thành công', durationMin: 62,
    lineageScan: true, approval: 'Đã phê duyệt', owner: 'Phạm Thu Hà', de: 'Trần Văn Hùng',
    version: 'v16', alertTo: ['Phạm Thu Hà'],
  },
  {
    id: 'JOB-0455', name: 'Sinh bút toán đối soát', group: 'Tài chính',
    purpose: 'Sinh bút toán hạch toán từ kết quả đối soát và chi phí vận hành',
    targetTable: 'fin.so_cai_doi_soat', targetInCatalog: true,
    sourceTables: ['bi.doi_soat_giao_dich_A', 'fin.chi_phi_van_hanh'],
    steps: 5, schedule: '0 30 8 * * ?', scheduleText: 'Hằng ngày 08:30', slaTime: '09:00',
    lastRun: '2026-08-09 08:30', lastResult: 'Thành công', durationMin: 22,
    lineageScan: true, approval: 'Đã phê duyệt', owner: 'Phạm Thu Hà', de: 'Đỗ Quang Vinh',
    version: 'v7', alertTo: ['Ban Tài chính'],
  },
  {
    id: 'JOB-0523', name: 'Phân khúc khách hàng', group: 'Khách hàng',
    purpose: 'Tính phân khúc khách hàng theo doanh số 12 tháng',
    targetTable: 'mart.phan_khuc_kh', targetInCatalog: true,
    sourceTables: ['crm.khach_hang', 'dwh.giao_dich_thanh_toan'],
    steps: 3, schedule: '0 0 3 ? * MON', scheduleText: 'Thứ hai hằng tuần 03:00', slaTime: '06:00',
    lastRun: '2026-08-04 03:00', lastResult: 'Thành công', durationMin: 48,
    lineageScan: false, approval: 'Đã phê duyệt', owner: 'Lê Minh Tuấn', de: 'Trần Văn Hùng',
    version: 'v4', alertTo: ['Lê Minh Tuấn'],
  },
  {
    id: 'JOB-0806', name: 'Chấm điểm rủi ro khách hàng', group: 'Rủi ro',
    purpose: 'Chấm điểm rủi ro AML cho toàn bộ khách hàng đang hoạt động',
    targetTable: 'rr.diem_rui_ro_kh', targetInCatalog: true,
    sourceTables: ['crm.khach_hang', 'dwh.giao_dich_thanh_toan'],
    steps: 7, schedule: '0 0 3 * * ?', scheduleText: 'Hằng ngày 03:00', slaTime: '06:00',
    lastRun: '2026-08-08 03:00', lastResult: 'Thất bại', durationMin: 8,
    lineageScan: false, approval: 'Đã phê duyệt', owner: 'Đỗ Quang Vinh', de: 'Đỗ Quang Vinh',
    version: 'v11', alertTo: ['Đỗ Quang Vinh'],
  },
  {
    id: 'JOB-0912', name: 'Kết xuất dữ liệu marketing', group: 'Kinh doanh',
    purpose: 'Kết xuất tệp khách hàng phục vụ chiến dịch marketing',
    targetTable: 'mart.tep_marketing_thang', targetInCatalog: false,
    sourceTables: ['crm.khach_hang', 'mart.phan_khuc_kh'],
    steps: 3, schedule: '0 0 4 1 * ?', scheduleText: 'Ngày 01 hằng tháng 04:00', slaTime: '—',
    lastRun: '2026-08-01 04:00', lastResult: 'Thành công', durationMin: 14,
    lineageScan: false, approval: 'Chờ phê duyệt', owner: 'Lê Minh Tuấn', de: 'Trần Văn Hùng',
    version: 'v2', alertTo: [],
  },
  {
    id: 'JOB-1044', name: 'Dọn dữ liệu nhật ký cũ', group: 'Vận hành',
    purpose: 'Xoá nhật ký job quá 180 ngày theo chính sách vòng đời',
    targetTable: 'ops.nhat_ky_job', targetInCatalog: true,
    sourceTables: ['ops.nhat_ky_job'],
    steps: 2, schedule: '0 0 1 ? * SUN', scheduleText: 'Chủ nhật hằng tuần 01:00', slaTime: '—',
    lastRun: '2026-08-03 01:00', lastResult: 'Thành công', durationMin: 6,
    lineageScan: false, approval: 'Đã phê duyệt', owner: 'Trần Văn Hùng', de: 'Trần Văn Hùng',
    version: 'v3', alertTo: [],
  },
  {
    id: 'JOB-1188', name: 'Nạp file kế toán tháng', group: 'Tài chính',
    purpose: 'Đọc file Excel kế toán tháng và ghi vào vùng thô',
    targetTable: 'raw.file_ke_toan_thang', targetInCatalog: true,
    sourceTables: [],
    steps: 2, schedule: '0 0 9 5 * ?', scheduleText: 'Ngày 05 hằng tháng 09:00', slaTime: '—',
    lastRun: '2026-08-05 09:00', lastResult: 'Bị chặn', durationMin: 2,
    lineageScan: true, approval: 'Chờ phê duyệt', owner: 'Phạm Thu Hà', de: 'Đỗ Quang Vinh',
    version: 'v1', alertTo: ['Phạm Thu Hà'],
  },
]

export const jobById = (id: string) => jobs.find(j => j.id === id)

export const jobSteps: JobStep[] = [
  { jobId: 'JOB-0412', ord: 1, name: 'Đọc file đối soát thô', type: 'Đọc nguồn', dependsOn: [], durationSec: 182, status: 'Thành công', sql: 'SELECT *\nFROM raw.doi_soat_A_tho\nWHERE ngay_du_lieu = :ngay_chay' },
  { jobId: 'JOB-0412', ord: 2, name: 'Chuẩn hoá kiểu dữ liệu', type: 'SparkSQL', dependsOn: [1], durationSec: 246, status: 'Thành công', sql: "SELECT\n  ma_giao_dich,\n  CAST(ngay_giao_dich AS DATE)         AS ngay_giao_dich,\n  regexp_replace(so_dien_thoai,'\\\\D','') AS so_dien_thoai,\n  CAST(so_tien AS DECIMAL(18,2))       AS so_tien\nFROM tmp_doi_soat_tho" },
  { jobId: 'JOB-0412', ord: 3, name: 'Lấy số tiền nội bộ', type: 'SparkSQL', dependsOn: [1], durationSec: 428, status: 'Thành công', sql: 'SELECT\n  g.ma_giao_dich,\n  g.so_tien       AS so_tien_noi_bo,\n  g.ma_khach_hang,\n  g.kenh\nFROM dwh.giao_dich_thanh_toan g\nWHERE g.ngay_giao_dich = :ngay_chay' },
  { jobId: 'JOB-0412', ord: 4, name: 'Đối chiếu và tính chênh lệch', type: 'SparkSQL', dependsOn: [2, 3], durationSec: 682, status: 'Thành công', sql: "SELECT\n  COALESCE(a.ma_giao_dich, b.ma_giao_dich) AS ma_giao_dich,\n  b.so_tien_noi_bo                        AS so_tien,\n  a.so_tien                               AS so_tien_doi_tac,\n  b.so_tien_noi_bo - a.so_tien            AS chenh_lech,\n  CASE\n    WHEN a.ma_giao_dich IS NULL THEN 'THIEU_DOI_TAC'\n    WHEN b.ma_giao_dich IS NULL THEN 'THIEU_NOI_BO'\n    WHEN b.so_tien_noi_bo = a.so_tien THEN 'KHOP'\n    ELSE 'LECH'\n  END                                     AS trang_thai\nFROM tmp_doi_tac a\nFULL OUTER JOIN tmp_noi_bo b USING (ma_giao_dich)" },
  { jobId: 'JOB-0412', ord: 5, name: 'Ghi bảng đích', type: 'Ghi bảng', dependsOn: [4], durationSec: 502, status: 'Thành công', sql: 'INSERT OVERWRITE TABLE bi.doi_soat_giao_dich_A\nPARTITION (ngay_giao_dich = :ngay_chay)\nSELECT * FROM tmp_ket_qua' },
]

export const stepsOf = (jobId: string) => jobSteps.filter(s => s.jobId === jobId)

export const jobRuns: JobRun[] = [
  { jobId: 'JOB-0412', runId: 'R-20260809-01', startedAt: '2026-08-09 06:00:02', durationMin: 34, result: 'Thành công', rowsWritten: 12_480_331, failedStep: null, note: '', steps: [{ name: 'B1', startPct: 0, widthPct: 9, ok: true }, { name: 'B2', startPct: 9, widthPct: 12, ok: true }, { name: 'B3', startPct: 9, widthPct: 21, ok: true }, { name: 'B4', startPct: 31, widthPct: 34, ok: true }, { name: 'B5', startPct: 65, widthPct: 35, ok: true }] },
  { jobId: 'JOB-0412', runId: 'R-20260808-01', startedAt: '2026-08-08 06:00:04', durationMin: 38, result: 'Thành công', rowsWritten: 12_442_006, failedStep: null, note: 'Chậm hơn thường lệ 4 phút', steps: [{ name: 'B1', startPct: 0, widthPct: 10, ok: true }, { name: 'B2', startPct: 10, widthPct: 13, ok: true }, { name: 'B3', startPct: 10, widthPct: 24, ok: true }, { name: 'B4', startPct: 34, widthPct: 32, ok: true }, { name: 'B5', startPct: 66, widthPct: 34, ok: true }] },
  { jobId: 'JOB-0412', runId: 'R-20260807-02', startedAt: '2026-08-07 08:40:11', durationMin: 31, result: 'Thành công', rowsWritten: 12_401_884, failedStep: null, note: 'Chạy lại sau khi khắc phục lỗi bước 2', steps: [{ name: 'B1', startPct: 0, widthPct: 9, ok: true }, { name: 'B2', startPct: 9, widthPct: 11, ok: true }, { name: 'B3', startPct: 9, widthPct: 20, ok: true }, { name: 'B4', startPct: 29, widthPct: 36, ok: true }, { name: 'B5', startPct: 65, widthPct: 35, ok: true }] },
  { jobId: 'JOB-0412', runId: 'R-20260807-01', startedAt: '2026-08-07 06:00:03', durationMin: 8, result: 'Thất bại', rowsWritten: 0, failedStep: 2, note: 'Bước 2 lỗi: giá trị số điện thoại không ép được kiểu', steps: [{ name: 'B1', startPct: 0, widthPct: 32, ok: true }, { name: 'B2', startPct: 32, widthPct: 68, ok: false }] },
  { jobId: 'JOB-0412', runId: 'R-20260806-01', startedAt: '2026-08-06 06:00:02', durationMin: 33, result: 'Thành công', rowsWritten: 12_388_204, failedStep: null, note: '', steps: [{ name: 'B1', startPct: 0, widthPct: 9, ok: true }, { name: 'B2', startPct: 9, widthPct: 12, ok: true }, { name: 'B3', startPct: 9, widthPct: 22, ok: true }, { name: 'B4', startPct: 31, widthPct: 34, ok: true }, { name: 'B5', startPct: 65, widthPct: 35, ok: true }] },
  { jobId: 'JOB-0412', runId: 'R-20260805-01', startedAt: '2026-08-05 06:00:05', durationMin: 36, result: 'Thành công', rowsWritten: 12_360_118, failedStep: null, note: '', steps: [{ name: 'B1', startPct: 0, widthPct: 10, ok: true }, { name: 'B2', startPct: 10, widthPct: 12, ok: true }, { name: 'B3', startPct: 10, widthPct: 22, ok: true }, { name: 'B4', startPct: 32, widthPct: 33, ok: true }, { name: 'B5', startPct: 65, widthPct: 35, ok: true }] },
]

export const runsOf = (jobId: string) => jobRuns.filter(r => r.jobId === jobId)

export const jobVersions: JobVersion[] = [
  { jobId: 'JOB-0412', version: 'v12', date: '2026-08-08 11:20', by: 'Trần Văn Hùng', note: 'Bổ sung chuẩn hoá số điện thoại ở bước 2', approvedBy: 'Nguyễn Thị Phương', current: true },
  { jobId: 'JOB-0412', version: 'v11', date: '2026-06-14 09:02', by: 'Trần Văn Hùng', note: 'Thêm cột ma_tinh_thanh vào bảng đích', approvedBy: 'Nguyễn Thị Phương', current: false },
  { jobId: 'JOB-0412', version: 'v10', date: '2026-04-02 16:41', by: 'Nguyễn Thị Phương', note: 'Đổi logic xác định trạng thái LECH', approvedBy: 'Phạm Thu Hà', current: false },
  { jobId: 'JOB-0412', version: 'v9', date: '2026-02-18 10:12', by: 'Trần Văn Hùng', note: 'Tối ưu bước 3 — thêm bộ lọc theo phân vùng ngày', approvedBy: 'Nguyễn Thị Phương', current: false },
  { jobId: 'JOB-0412', version: 'v8', date: '2025-12-05 14:30', by: 'Trần Văn Hùng', note: 'Chuyển bảng đích sang định dạng Iceberg', approvedBy: 'Phạm Thu Hà', current: false },
  { jobId: 'JOB-0412', version: 'v7', date: '2025-10-11 08:55', by: 'Đỗ Quang Vinh', note: 'Bật quét nguồn gốc dữ liệu', approvedBy: 'Nguyễn Thị Phương', current: false },
]

export const versionsOf = (jobId: string) => jobVersions.filter(v => v.jobId === jobId)

/* ═══════════════ 4.2 Cửa nạp dữ liệu ═══════════════ */

export const ingestTemplates: IngestTemplate[] = [
  { id: 'NAP-012', name: 'File đối soát đối tác A', kind: 'SFTP đối tác', source: 'KENH-01 · sftp://partner-a/outbound/', targetTable: 'raw.doi_soat_A_tho', format: 'CSV · UTF-8 · 18 cột', schedule: 'Hằng ngày 05:30', qualityGate: true, gateRules: 4, gateMode: 'Tách dòng lỗi', legacyScreen: 'import-data', owner: 'Trần Văn Hùng', status: 'Đang dùng', lastLoad: '2026-08-09 05:32', lastResult: 'Giữ ở vùng chờ' },
  { id: 'NAP-031', name: 'Sự kiện giao dịch Kafka', kind: 'Kafka', source: 'KENH-02 · topic txn.events', targetTable: 'raw.giao_dich_kafka', format: 'Avro', schedule: 'Liên tục', qualityGate: false, gateRules: 0, gateMode: '—', legacyScreen: 'sync-management', owner: 'Đỗ Quang Vinh', status: 'Đang dùng', lastLoad: '2026-08-09 10:12', lastResult: 'Thành công' },
  { id: 'NAP-044', name: 'File kế toán tháng', kind: 'Tải file thủ công', source: 'KENH-08 · thư mục dùng chung', targetTable: 'raw.file_ke_toan_thang', format: 'Excel · 11 cột', schedule: 'Ngày 05 hằng tháng', qualityGate: false, gateRules: 0, gateMode: '—', legacyScreen: 'invoice-uploader', owner: 'Phạm Thu Hà', status: 'Đang dùng', lastLoad: '2026-08-05 09:04', lastResult: 'Thất bại' },
  { id: 'NAP-007', name: 'Đồng bộ CRM sang kho dữ liệu', kind: 'Đồng bộ CSDL', source: 'HT-01 · Oracle · 14 bảng', targetTable: 'crm.khach_hang', format: 'JDBC', schedule: 'Hằng ngày 02:00', qualityGate: false, gateRules: 0, gateMode: '—', legacyScreen: 'sync-management', owner: 'Trần Văn Hùng', status: 'Đang dùng', lastLoad: '2026-08-09 02:04', lastResult: 'Thành công' },
  { id: 'NAP-058', name: 'Di trú dữ liệu CRM cũ', kind: 'Di trú dữ liệu', source: 'HT-10 · MySQL', targetTable: 'crm.khach_hang_cu', format: 'JDBC', schedule: 'Một lần — đã hoàn tất', qualityGate: false, gateRules: 0, gateMode: '—', legacyScreen: 'data-migration-management', owner: 'Đỗ Quang Vinh', status: 'Tạm dừng', lastLoad: '2025-12-31 22:10', lastResult: 'Thành công' },
  { id: 'NAP-066', name: 'API danh mục sản phẩm', kind: 'API', source: 'KENH-07 · GET /products', targetTable: 'dwh.san_pham', format: 'JSON', schedule: 'Mỗi 4 giờ', qualityGate: false, gateRules: 0, gateMode: '—', legacyScreen: 'fsync', owner: 'Lê Minh Tuấn', status: 'Tạm dừng', lastLoad: '2026-04-22 08:00', lastResult: 'Thành công' },
  { id: 'NAP-081', name: 'Giao dữ liệu sạch cho đối tác B', kind: 'SFTP đối tác', source: 'KENH-05 · gửi đi', targetTable: '—', format: 'CSV', schedule: 'Thứ hai hằng tuần', qualityGate: false, gateRules: 0, gateMode: '—', legacyScreen: 'clean-delivery', owner: 'Lê Minh Tuấn', status: 'Đang dùng', lastLoad: '2026-08-04 07:00', lastResult: 'Thành công' },
]

export const ingestById = (id: string) => ingestTemplates.find(t => t.id === id)

export const quarantine: QuarantineBatch[] = [
  {
    id: 'LO-20260809-012', templateId: 'NAP-012', arrivedAt: '2026-08-09 05:32', blockLevel: 'Tách dòng lỗi',
    reason: 'Số điện thoại sai định dạng — 723.058 dòng không khớp biểu thức', heldRows: 723_058, totalRows: 12_512_004,
    incidentId: 'SC-0231', status: 'Đang giữ',
    sampleRows: [
      { dong: '18442', ma_giao_dich: 'GD11840221', so_dien_thoai: '+84912345678', loi: 'Không khớp ^(84|0)(3|5|7|8|9)[0-9]{8}$' },
      { dong: '18477', ma_giao_dich: 'GD11840577', so_dien_thoai: '84 912 345 679', loi: 'Chứa khoảng trắng' },
      { dong: '19002', ma_giao_dich: 'GD11841002', so_dien_thoai: '0912-345-680', loi: 'Chứa dấu gạch ngang' },
    ],
  },
  {
    id: 'LO-20260808-012', templateId: 'NAP-012', arrivedAt: '2026-08-08 05:31', blockLevel: 'Tách dòng lỗi',
    reason: 'Số điện thoại sai định dạng — 618.204 dòng', heldRows: 618_204, totalRows: 12_442_006,
    incidentId: 'SC-0231', status: 'Đã cho qua',
    sampleRows: [{ dong: '12004', ma_giao_dich: 'GD11828004', so_dien_thoai: '+84987654321', loi: 'Không khớp biểu thức' }],
  },
  {
    id: 'LO-20260805-044', templateId: 'NAP-044', arrivedAt: '2026-08-05 09:04', blockLevel: 'Chặn cả lô',
    reason: 'Thiếu cột bắt buộc "ma_ttcp" trong file Excel', heldRows: 84_204, totalRows: 84_204,
    incidentId: null, status: 'Đang giữ',
    sampleRows: [{ dong: '1', cot_thieu: 'ma_ttcp', ghi_chu: 'Tiêu đề cột trong file là "Trung tam chi phi"' }],
  },
  {
    id: 'LO-20260802-012', templateId: 'NAP-012', arrivedAt: '2026-08-02 05:30', blockLevel: 'Chỉ cảnh báo',
    reason: 'Số dòng thấp hơn trung bình 22%', heldRows: 0, totalRows: 9_742_118,
    incidentId: null, status: 'Đã nạp lại', sampleRows: [],
  },
  {
    id: 'LO-20260728-012', templateId: 'NAP-012', arrivedAt: '2026-07-28 05:33', blockLevel: 'Chặn cả lô',
    reason: 'File trùng với lô đã nạp ngày 27/07 — cùng mã kiểm tra', heldRows: 12_284_006, totalRows: 12_284_006,
    incidentId: null, status: 'Đã loại bỏ', sampleRows: [],
  },
]

export const QUARANTINE_ACTIONS = [
  { id: 'pass', label: '✔ Cho qua', desc: 'Nạp toàn bộ lô vào bảng đích, chấp nhận dòng lỗi', needReason: true },
  { id: 'split', label: '⇄ Tách dòng lỗi', desc: 'Nạp dòng đạt, giữ riêng dòng lỗi để xử lý sau', needReason: false },
  { id: 'reject', label: '✕ Loại bỏ lô', desc: 'Không nạp, yêu cầu nguồn gửi lại', needReason: true },
  { id: 'reload', label: '↻ Nạp lại', desc: 'Yêu cầu hệ thống đọc lại file từ nguồn', needReason: false },
]

/* ═══════════════ 4.3 Giám sát pipeline ═══════════════ */

export const pipelineTasks = [
  { taskCode: 'TSK-0412-01', job: 'JOB-0412', table: 'bi.doi_soat_giao_dich_A', runResult: 'Thành công', qualityResult: 'Cảnh báo', combo: 'Chạy xong nhưng dữ liệu có vấn đề', at: '2026-08-09 06:34' },
  { taskCode: 'TSK-0208-01', job: 'JOB-0208', table: 'dwh.giao_dich_thanh_toan', runResult: 'Thành công', qualityResult: 'Đạt', combo: 'Bình thường', at: '2026-08-09 10:17' },
  { taskCode: 'TSK-0301-01', job: 'JOB-0301', table: 'mart.doanh_thu_ngay', runResult: 'Thành công', qualityResult: 'Đạt', combo: 'Bình thường', at: '2026-08-09 07:48' },
  { taskCode: 'TSK-0806-01', job: 'JOB-0806', table: 'rr.diem_rui_ro_kh', runResult: 'Thất bại', qualityResult: 'Không đạt', combo: 'Hỏng rõ ràng', at: '2026-08-08 03:08' },
  { taskCode: 'TSK-0455-01', job: 'JOB-0455', table: 'fin.so_cai_doi_soat', runResult: 'Thành công', qualityResult: 'Đạt', combo: 'Bình thường', at: '2026-08-09 08:52' },
  { taskCode: 'TSK-1188-01', job: 'JOB-1188', table: 'raw.file_ke_toan_thang', runResult: 'Bị chặn', qualityResult: 'Không chạy', combo: 'Cổng chất lượng chặn trước khi nạp', at: '2026-08-05 09:04' },
  { taskCode: 'TSK-0117-01', job: 'JOB-0117', table: 'crm.khach_hang', runResult: 'Thành công', qualityResult: 'Cảnh báo', combo: 'Chạy xong nhưng dữ liệu có vấn đề', at: '2026-08-09 03:02' },
]

export const RUN_QUALITY_COMBOS = [
  { run: 'Thành công', quality: 'Đạt', meaning: 'Bình thường — không cần làm gì', tone: 'g' as const, count: 1_284 },
  { run: 'Thành công', quality: 'Không đạt / Cảnh báo', meaning: '⭐ Job chạy xong vẫn sinh ra số sai — nguy hiểm nhất vì không ai biết', tone: 'r' as const, count: 42 },
  { run: 'Thất bại', quality: 'Không chạy', meaning: 'Hỏng rõ ràng — dễ phát hiện', tone: 'o' as const, count: 18 },
  { run: 'Bị chặn', quality: 'Không chạy', meaning: 'Cổng chất lượng chặn từ đầu — đúng thiết kế', tone: 'b' as const, count: 6 },
]
