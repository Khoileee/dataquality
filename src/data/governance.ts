import type { GlossaryRow, TagRow, LineageEdge, ApprovalItem, Confidentiality } from './types'

/* ═══════════════ 2.1 Từ điển nghiệp vụ ═══════════════ */

export const glossary: GlossaryRow[] = [
  {
    id: 'TN-0042', name: 'Doanh thu ghi nhận', aliases: ['Doanh thu', 'Revenue', 'Doanh thu thuần'],
    book: 'Từ điển Tài chính', definition:
      'Số tiền doanh thu được ghi nhận vào kết quả kinh doanh trong kỳ theo nguyên tắc kế toán dồn tích, sau khi trừ hoàn tiền và điều chỉnh.',
    formula: 'Tổng số tiền giao dịch thành công − Hoàn tiền − Điều chỉnh giảm',
    unit: 'VND', scope: 'Toàn công ty', cde: true,
    owner: 'Phạm Thu Hà', steward: 'Nguyễn Thị Phương', approver: 'Phạm Thu Hà',
    parentId: null, relatedIds: ['TN-0055', 'TN-0011'],
    boundColumns: [
      { tableId: 'bi.doi_soat_giao_dich_A', column: 'so_tien' },
      { tableId: 'mart.doanh_thu_ngay', column: 'doanh_thu' },
    ],
    boundMetrics: ['CT-001', 'CT-007'],
    approval: 'Đã phê duyệt', version: 'v4', updatedAt: '2026-06-20',
    history: [
      { version: 'v4', date: '2026-06-20', by: 'Phạm Thu Hà', note: 'Bổ sung loại trừ điều chỉnh giảm' },
      { version: 'v3', date: '2025-12-02', by: 'Nguyễn Thị Phương', note: 'Làm rõ nguyên tắc dồn tích' },
      { version: 'v2', date: '2025-04-11', by: 'Phạm Thu Hà', note: 'Đánh dấu là CDE' },
    ],
  },
  {
    id: 'TN-0002', name: 'Khách hàng hoạt động', aliases: ['Active customer', 'KH hoạt động'],
    book: 'Từ điển Khách hàng',
    definition: 'Khách hàng có ít nhất một giao dịch thành công trong 12 tháng gần nhất tính đến ngày báo cáo.',
    formula: 'Có ≥ 1 giao dịch thành công trong 12 tháng gần nhất', unit: 'khách hàng',
    scope: 'Toàn công ty', cde: true,
    owner: 'Phạm Thu Hà', steward: 'Lê Minh Tuấn', approver: 'Phạm Thu Hà',
    parentId: null, relatedIds: ['TN-0021', 'TN-0068'],
    boundColumns: [{ tableId: 'crm.khach_hang', column: 'trang_thai' }],
    boundMetrics: ['CT-003'],
    approval: 'Đã phê duyệt', version: 'v3', updatedAt: '2026-03-14',
    history: [
      { version: 'v3', date: '2026-03-14', by: 'Phạm Thu Hà', note: 'Chốt mốc 12 tháng thay vì 6 tháng' },
      { version: 'v2', date: '2025-08-01', by: 'Lê Minh Tuấn', note: 'Bổ sung điều kiện giao dịch thành công' },
    ],
  },
  {
    id: 'TN-0055', name: 'Chênh lệch đối soát', aliases: ['Chênh lệch', 'Sai lệch đối soát'],
    book: 'Từ điển Vận hành',
    definition: 'Khoản chênh giữa số liệu giao dịch ghi nhận nội bộ và số liệu do đối tác báo về cho cùng một giao dịch.',
    formula: 'Số tiền nội bộ − Số tiền đối tác', unit: 'VND',
    scope: 'Nghiệp vụ đối soát', cde: true,
    owner: 'Nguyễn Thị Phương', steward: 'Nguyễn Thị Phương', approver: 'Phạm Thu Hà',
    parentId: null, relatedIds: ['TN-0042'],
    boundColumns: [{ tableId: 'bi.doi_soat_giao_dich_A', column: 'chenh_lech' }],
    boundMetrics: ['CT-002', 'CT-004'],
    approval: 'Đã phê duyệt', version: 'v2', updatedAt: '2026-05-08',
    history: [{ version: 'v2', date: '2026-05-08', by: 'Nguyễn Thị Phương', note: 'Chuẩn hoá dấu của chênh lệch' }],
  },
  {
    id: 'TN-0021', name: 'Mã khách hàng', aliases: ['Customer ID', 'CIF'],
    book: 'Từ điển Khách hàng',
    definition: 'Mã định danh duy nhất của một khách hàng trong toàn hệ thống, do hệ thống CRM sinh ra.',
    formula: null, unit: null, scope: 'Toàn công ty', cde: true,
    owner: 'Phạm Thu Hà', steward: 'Trần Văn Hùng', approver: 'Phạm Thu Hà',
    parentId: null, relatedIds: ['TN-0002'],
    boundColumns: [
      { tableId: 'crm.khach_hang', column: 'ma_khach_hang' },
      { tableId: 'bi.doi_soat_giao_dich_A', column: 'ma_khach_hang' },
    ],
    boundMetrics: [], approval: 'Đã phê duyệt', version: 'v1', updatedAt: '2025-02-10',
    history: [{ version: 'v1', date: '2025-02-10', by: 'Phạm Thu Hà', note: 'Khởi tạo' }],
  },
  {
    id: 'TN-0011', name: 'Giao dịch', aliases: ['Transaction', 'GD'],
    book: 'Từ điển Vận hành',
    definition: 'Một lần chuyển giao giá trị giữa các bên qua hệ thống thanh toán, có mã định danh duy nhất.',
    formula: null, unit: null, scope: 'Toàn công ty', cde: false,
    owner: 'Phạm Thu Hà', steward: 'Nguyễn Thị Phương', approver: 'Phạm Thu Hà',
    parentId: null, relatedIds: ['TN-0042', 'TN-0055'],
    boundColumns: [{ tableId: 'bi.doi_soat_giao_dich_A', column: 'ma_giao_dich' }],
    boundMetrics: [], approval: 'Đã phê duyệt', version: 'v2', updatedAt: '2025-11-20',
    history: [{ version: 'v2', date: '2025-11-20', by: 'Nguyễn Thị Phương', note: 'Bổ sung phạm vi áp dụng' }],
  },
  {
    id: 'TN-0068', name: 'Phân khúc khách hàng', aliases: ['Segment', 'Phân khúc'],
    book: 'Từ điển Khách hàng',
    definition: 'Nhóm khách hàng được chia theo giá trị đóng góp và mức độ hoạt động trong 12 tháng.',
    formula: 'Theo bảng quy tắc phân khúc — 5 mức VIP/GOLD/SILVER/BASIC/NEW',
    unit: null, scope: 'Ban Kinh doanh', cde: false,
    owner: 'Lê Minh Tuấn', steward: 'Lê Minh Tuấn', approver: 'Phạm Thu Hà',
    parentId: 'TN-0002', relatedIds: ['TN-0002'],
    boundColumns: [{ tableId: 'crm.khach_hang', column: 'phan_khuc' }],
    boundMetrics: [], approval: 'Chờ phê duyệt', version: 'v2', updatedAt: '2026-08-05',
    history: [{ version: 'v2', date: '2026-08-05', by: 'Lê Minh Tuấn', note: 'Đổi ngưỡng phân khúc VIP' }],
  },
  {
    id: 'TN-0090', name: 'Tỷ lệ đối soát khớp', aliases: ['Match rate'],
    book: 'Từ điển Vận hành',
    definition: 'Tỷ lệ phần trăm số giao dịch khớp hoàn toàn giữa hai bên trên tổng số giao dịch đưa vào đối soát.',
    formula: 'Số giao dịch khớp / Tổng giao dịch đối soát × 100', unit: '%',
    scope: 'Nghiệp vụ đối soát', cde: false,
    owner: 'Nguyễn Thị Phương', steward: 'Nguyễn Thị Phương', approver: 'Phạm Thu Hà',
    parentId: null, relatedIds: ['TN-0055'],
    boundColumns: [], boundMetrics: ['CT-002'],
    approval: 'Dự thảo', version: 'v1', updatedAt: '2026-08-07',
    history: [{ version: 'v1', date: '2026-08-07', by: 'Nguyễn Thị Phương', note: 'Khởi tạo — chưa gắn cột nào' }],
  },
  {
    id: 'TN-0104', name: 'Trung tâm chi phí', aliases: ['Cost center', 'TTCP'],
    book: 'Từ điển Tài chính',
    definition: 'Đơn vị tổ chức được gán mã để tập hợp và phân bổ chi phí phát sinh.',
    formula: null, unit: null, scope: 'Ban Tài chính', cde: false,
    owner: 'Phạm Thu Hà', steward: 'Phạm Thu Hà', approver: 'Phạm Thu Hà',
    parentId: null, relatedIds: [],
    boundColumns: [], boundMetrics: ['CT-005'],
    approval: 'Đã phê duyệt', version: 'v1', updatedAt: '2026-01-30',
    history: [{ version: 'v1', date: '2026-01-30', by: 'Phạm Thu Hà', note: 'Khởi tạo' }],
  },
]

export const glossaryById = (id: string | null) => (id ? glossary.find(g => g.id === id) : undefined)

/* ═══════════════ 2.2 Phân loại & Nhãn — 2 trục độc lập ═══════════════ */

/** Trục 1 — Mức phân loại bảo mật (GĐ4 mục 3) */
export const CONFIDENTIALITY_LEVELS: {
  id: Confidentiality
  order: number
  description: string
  defaultRules: string[]
  objectCount: number
}[] = [
  {
    id: 'Công khai', order: 1,
    description: 'Dữ liệu có thể công bố ra ngoài mà không gây rủi ro.',
    defaultRules: ['Không giới hạn tải xuống', 'Không cần phê duyệt khi cấp quyền'],
    objectCount: 842,
  },
  {
    id: 'Nội bộ', order: 2,
    description: 'Chỉ dùng trong nội bộ công ty, không chia sẻ ra ngoài.',
    defaultRules: ['Tải xuống ghi nhật ký', 'Cấp quyền theo nhóm'],
    objectCount: 6218,
  },
  {
    id: 'Mật', order: 3,
    description: 'Dữ liệu nhạy cảm về kinh doanh hoặc cá nhân, chỉ người có nhu cầu mới được truy cập.',
    defaultRules: ['Tải xuống cần phê duyệt riêng', 'Bắt buộc che cột nhạy cảm', 'Quyền có thời hạn tối đa 6 tháng'],
    objectCount: 3418,
  },
  {
    id: 'Hạn chế truy cập', order: 4,
    description: 'Mức cao nhất — chỉ danh sách người được chỉ định, có ghi nhật ký đầy đủ.',
    defaultRules: ['Cấm tải xuống', 'Bắt buộc che dữ liệu', 'Quyền tối đa 3 tháng', 'Cảnh báo mọi truy cập bất thường'],
    objectCount: 1004,
  },
]

/** Trục 2 — Nhãn loại dữ liệu nhạy cảm */
export const tags: TagRow[] = [
  { id: 'DATA_GENERAL', name: 'Dữ liệu thông thường', parentId: null, description: 'Không chứa dữ liệu cá nhân hay nhạy cảm', sensitivity: 'Thấp', legalBasis: '—', columnCount: 214_424, defaultMask: null, defaultConfidentiality: 'Nội bộ', syncedToOpa: true },
  { id: 'PD_BASIC', name: 'Dữ liệu cá nhân cơ bản', parentId: null, description: 'Thông tin định danh cơ bản của cá nhân', sensitivity: 'Trung bình', legalBasis: 'Nghị định 13/2023/NĐ-CP — Điều 2.3', columnCount: 268, defaultMask: 'Che một phần', defaultConfidentiality: 'Mật', syncedToOpa: true },
  { id: 'PII_NAME', name: 'Họ tên', parentId: 'PD_BASIC', description: 'Họ và tên đầy đủ của cá nhân', sensitivity: 'Trung bình', legalBasis: 'Nghị định 13/2023/NĐ-CP', columnCount: 84, defaultMask: 'Giữ ký tự đầu', defaultConfidentiality: 'Mật', syncedToOpa: true },
  { id: 'PII_EMAIL', name: 'Thư điện tử', parentId: 'PD_BASIC', description: 'Địa chỉ email cá nhân', sensitivity: 'Trung bình', legalBasis: 'Nghị định 13/2023/NĐ-CP', columnCount: 62, defaultMask: 'Che phần trước @', defaultConfidentiality: 'Mật', syncedToOpa: true },
  { id: 'PII_ADDRESS', name: 'Địa chỉ', parentId: 'PD_BASIC', description: 'Địa chỉ thường trú hoặc liên hệ', sensitivity: 'Trung bình', legalBasis: 'Nghị định 13/2023/NĐ-CP', columnCount: 122, defaultMask: 'Chỉ giữ tỉnh/thành', defaultConfidentiality: 'Mật', syncedToOpa: true },
  { id: 'PD_SENSITIVE', name: 'Dữ liệu cá nhân nhạy cảm', parentId: null, description: 'Dữ liệu cá nhân nhạy cảm theo quy định pháp luật', sensitivity: 'Cao', legalBasis: 'Nghị định 13/2023/NĐ-CP — Điều 2.4', columnCount: 144, defaultMask: 'Che toàn bộ', defaultConfidentiality: 'Hạn chế truy cập', syncedToOpa: true },
  { id: 'PII_PHONE', name: 'Số điện thoại', parentId: 'PD_SENSITIVE', description: 'Số điện thoại liên hệ của cá nhân', sensitivity: 'Cao', legalBasis: 'Nghị định 13/2023/NĐ-CP', columnCount: 58, defaultMask: 'Giữ 3 số cuối', defaultConfidentiality: 'Hạn chế truy cập', syncedToOpa: true },
  { id: 'PII_ID', name: 'Số căn cước / CMND', parentId: 'PD_SENSITIVE', description: 'Số giấy tờ tuỳ thân', sensitivity: 'Cao', legalBasis: 'Nghị định 13/2023/NĐ-CP', columnCount: 46, defaultMask: 'Che toàn bộ', defaultConfidentiality: 'Hạn chế truy cập', syncedToOpa: true },
  { id: 'PII_ACCOUNT', name: 'Số tài khoản', parentId: 'PD_SENSITIVE', description: 'Số tài khoản ngân hàng hoặc ví', sensitivity: 'Cao', legalBasis: 'Luật Các tổ chức tín dụng', columnCount: 40, defaultMask: 'Giữ 4 số cuối', defaultConfidentiality: 'Hạn chế truy cập', syncedToOpa: false },
]

export const tagById = (id: string) => tags.find(t => t.id === id)

/** Cột hệ thống nghi ngờ chứa dữ liệu nhạy cảm — bộ dò tự động (GĐ4 FR-02) */
export const tagSuggestions = [
  { tableId: 'raw.giao_dich_kafka', column: 'msisdn', suggest: 'PII_PHONE', confidence: 96, reason: 'Mẫu giá trị khớp định dạng số điện thoại (98,2% mẫu)' },
  { tableId: 'raw.giao_dich_kafka', column: 'cust_identity', suggest: 'PII_ID', confidence: 91, reason: 'Tên cột chứa "identity" và giá trị 12 chữ số' },
  { tableId: 'raw.giao_dich_kafka', column: 'acc_no', suggest: 'PII_ACCOUNT', confidence: 88, reason: 'Tên cột viết tắt của account number' },
  { tableId: 'crm.khach_hang_cu', column: 'sdt_lien_he', suggest: 'PII_PHONE', confidence: 94, reason: 'Mẫu giá trị khớp định dạng số điện thoại' },
  { tableId: 'crm.khach_hang_cu', column: 'cmnd', suggest: 'PII_ID', confidence: 97, reason: 'Tên cột trùng từ khoá CMND' },
  { tableId: 'crm.khach_hang_cu', column: 'dchi', suggest: 'PII_ADDRESS', confidence: 72, reason: 'Giá trị chứa từ khoá địa danh' },
  { tableId: 'crm.hop_dong', column: 'nguoi_dai_dien', suggest: 'PII_NAME', confidence: 84, reason: 'Giá trị là tên người Việt Nam' },
  { tableId: 'fin.so_cai_doi_soat', column: 'tk_nhan', suggest: 'PII_ACCOUNT', confidence: 79, reason: 'Giá trị 10–16 chữ số liên tiếp' },
]

/* ═══════════════ 2.3 Truy vết luồng dữ liệu ═══════════════ */

export const lineageEdges: LineageEdge[] = [
  {
    id: 'LNG-001', fromType: 'Kênh', from: 'KENH-01', toType: 'Bảng', to: 'raw.doi_soat_A_tho',
    viaJob: null, transform: 'Nạp nguyên trạng từ file CSV theo mẫu NAP-012',
    level: 'Bảng', schedule: 'Hằng ngày 05:30', source: 'Tự động — cấu hình cửa nạp',
    approval: 'Đã phê duyệt', declaredBy: 'Hệ thống', declaredAt: '2026-01-04', note: '',
  },
  {
    id: 'LNG-002', fromType: 'Bảng', from: 'raw.doi_soat_A_tho', toType: 'Bảng', to: 'bi.doi_soat_giao_dich_A',
    viaJob: 'JOB-0412', transform: 'Chuẩn hoá kiểu dữ liệu · đối chiếu với dwh.giao_dich_thanh_toan · tính chênh lệch',
    level: 'Bảng', schedule: '0 0 6 * * ?', source: 'Tự động — phân tích SQL',
    approval: 'Đã phê duyệt', declaredBy: 'Hệ thống', declaredAt: '2026-01-04', note: '',
  },
  {
    id: 'LNG-003', fromType: 'Bảng', from: 'dwh.giao_dich_thanh_toan', toType: 'Bảng', to: 'bi.doi_soat_giao_dich_A',
    viaJob: 'JOB-0412', transform: 'JOIN theo ma_giao_dich để lấy số tiền nội bộ',
    level: 'Bảng', schedule: '0 0 6 * * ?', source: 'Tự động — phân tích SQL',
    approval: 'Đã phê duyệt', declaredBy: 'Hệ thống', declaredAt: '2026-01-04', note: '',
  },
  {
    id: 'LNG-004', fromType: 'Cột', from: 'bi.doi_soat_giao_dich_A.so_tien', toType: 'Chỉ tiêu', to: 'CT-001',
    viaJob: null, transform: 'SUM(so_tien) sau khi loại trừ hoàn tiền',
    level: 'Nghiệp vụ', schedule: 'Hằng ngày', source: 'Khai báo thủ công',
    approval: 'Đã phê duyệt', declaredBy: 'Nguyễn Thị Phương', declaredAt: '2026-03-12',
    note: 'Công cụ BI không xuất được lineage nên khai tay',
  },
  {
    id: 'LNG-005', fromType: 'Chỉ tiêu', from: 'CT-001', toType: 'Báo cáo', to: 'BC-001',
    viaJob: null, transform: 'Hiển thị dạng thẻ số liệu và biểu đồ cột theo ngày',
    level: 'Nghiệp vụ', schedule: 'Hằng ngày trước 08:00', source: 'Khai báo thủ công',
    approval: 'Đã phê duyệt', declaredBy: 'Nguyễn Thị Phương', declaredAt: '2026-03-12', note: '',
  },
  {
    id: 'LNG-006', fromType: 'Bảng', from: 'bi.doi_soat_giao_dich_A', toType: 'Bảng', to: 'fin.so_cai_doi_soat',
    viaJob: 'JOB-0455', transform: 'Sinh bút toán từ giao dịch lệch',
    level: 'Bảng', schedule: '0 30 8 * * ?', source: 'Tự động — phân tích SQL',
    approval: 'Đã phê duyệt', declaredBy: 'Hệ thống', declaredAt: '2026-02-01', note: '',
  },
  {
    id: 'LNG-007', fromType: 'Bảng', from: 'bi.doi_soat_giao_dich_A', toType: 'Bảng', to: 'mart.doi_soat_thang',
    viaJob: 'JOB-0412', transform: 'GROUP BY tháng, đối tác',
    level: 'Bảng', schedule: 'Ngày 01 hằng tháng', source: 'Tự động — phân tích SQL',
    approval: 'Đã phê duyệt', declaredBy: 'Hệ thống', declaredAt: '2026-02-01', note: '',
  },
  {
    id: 'LNG-008', fromType: 'Hệ thống', from: 'HT-09', toType: 'Hệ thống', to: 'HT-04',
    viaJob: null, transform: 'Trao đổi file đối soát qua SFTP',
    level: 'Hệ thống', schedule: 'Hằng ngày', source: 'Tự động — cấu hình cửa nạp',
    approval: 'Đã phê duyệt', declaredBy: 'Hệ thống', declaredAt: '2026-01-04', note: '',
  },
  {
    id: 'LNG-009', fromType: 'Bảng', from: 'crm.khach_hang', toType: 'Báo cáo', to: 'BC-005',
    viaJob: null, transform: 'Power BI đọc trực tiếp qua DirectQuery',
    level: 'Nghiệp vụ', schedule: 'Hằng tháng', source: 'Khai báo thủ công',
    approval: 'Chờ phê duyệt', declaredBy: 'Phạm Thu Hà', declaredAt: '2026-08-06',
    note: 'Chờ Data Owner xác nhận phạm vi cột được đọc',
  },
  {
    id: 'LNG-010', fromType: 'Bảng', from: 'rr.diem_rui_ro_kh', toType: 'Báo cáo', to: 'BC-010',
    viaJob: null, transform: 'Xuất file thủ công hằng tháng rồi ghép trong Excel',
    level: 'Nghiệp vụ', schedule: 'Hằng tháng', source: 'Khai báo thủ công',
    approval: 'Yêu cầu chỉnh sửa', declaredBy: 'Đỗ Quang Vinh', declaredAt: '2026-07-30',
    note: 'Thiếu mô tả bước biến đổi — người duyệt yêu cầu bổ sung',
  },
  {
    id: 'LNG-011', fromType: 'Kênh', from: 'KENH-02', toType: 'Bảng', to: 'raw.giao_dich_kafka',
    viaJob: null, transform: 'Nạp sự kiện Avro theo thời gian thực',
    level: 'Bảng', schedule: 'Liên tục', source: 'Tự động — cấu hình cửa nạp',
    approval: 'Dự thảo', declaredBy: 'Hệ thống', declaredAt: '2026-08-07', note: '',
  },
  {
    id: 'LNG-012', fromType: 'Bảng', from: 'mart.doanh_thu_ngay', toType: 'Chỉ tiêu', to: 'CT-007',
    viaJob: null, transform: 'SUM(doanh_thu) GROUP BY ma_kenh',
    level: 'Nghiệp vụ', schedule: 'Hằng tuần', source: 'Khai báo thủ công',
    approval: 'Đã phê duyệt', declaredBy: 'Nguyễn Thị Phương', declaredAt: '2026-04-02', note: '',
  },
]

/* ═══════════════ 2.4 Phê duyệt & Phiên bản ═══════════════ */

export const pendingApprovals: ApprovalItem[] = [
  {
    id: 'PD-0087', objectType: 'Bảng dữ liệu', objectId: 'raw.file_ke_toan_thang', objectName: 'File kế toán tháng',
    change: 'Khai báo metadata lần đầu — gán miền Tài chính, Tier 3',
    submittedBy: 'Trần Văn Hùng', submittedAt: '2026-08-07 09:14', approver: 'Phạm Thu Hà',
    state: 'Chờ phê duyệt', waitingDays: 2, priority: 'Trung bình',
    diff: [
      { field: 'Miền dữ liệu', before: '— chưa gán', after: 'Tài chính' },
      { field: 'Mức quan trọng', before: '— chưa gán', after: 'Tier 3' },
      { field: 'Đầu mối kỹ thuật', before: '—', after: 'Trần Văn Hùng' },
    ],
  },
  {
    id: 'PD-0086', objectType: 'Thuật ngữ', objectId: 'TN-0068', objectName: 'Phân khúc khách hàng',
    change: 'Đổi ngưỡng phân khúc VIP từ 500 triệu lên 800 triệu',
    submittedBy: 'Lê Minh Tuấn', submittedAt: '2026-08-05 16:02', approver: 'Phạm Thu Hà',
    state: 'Chờ phê duyệt', waitingDays: 4, priority: 'Cao',
    diff: [
      { field: 'Công thức', before: 'VIP: doanh số 12 tháng ≥ 500.000.000', after: 'VIP: doanh số 12 tháng ≥ 800.000.000' },
      { field: 'Phiên bản', before: 'v1', after: 'v2' },
    ],
  },
  {
    id: 'PD-0085', objectType: 'Quan hệ luồng dữ liệu', objectId: 'LNG-009', objectName: 'crm.khach_hang → BC-005',
    change: 'Khai báo thủ công quan hệ nguồn — đích mức nghiệp vụ',
    submittedBy: 'Phạm Thu Hà', submittedAt: '2026-08-06 10:40', approver: 'Nguyễn Thị Phương',
    state: 'Chờ phê duyệt', waitingDays: 3, priority: 'Trung bình',
    diff: [
      { field: 'Đối tượng nguồn', before: '—', after: 'crm.khach_hang' },
      { field: 'Đối tượng đích', before: '—', after: 'BC-005 — Báo cáo khách hàng hoạt động' },
      { field: 'Mức truy vết', before: '—', after: 'Nghiệp vụ' },
    ],
  },
  {
    id: 'PD-0084', objectType: 'Danh mục tham chiếu', objectId: 'DM-007', objectName: 'Danh mục loại giao dịch',
    change: 'Thêm loại ĐIỀU CHỈNH và cập nhật nhóm cho loại PHÍ',
    submittedBy: 'Phạm Thu Hà', submittedAt: '2026-08-06 11:05', approver: 'Nguyễn Thị Phương',
    state: 'Chờ phê duyệt', waitingDays: 3, priority: 'Cao',
    diff: [
      { field: 'Bản ghi thêm mới', before: '—', after: 'DIEUCHINH — Điều chỉnh' },
      { field: 'PHI.nhom', before: 'Khác', after: 'Giảm số dư' },
    ],
  },
  {
    id: 'PD-0083', objectType: 'Kênh trao đổi dữ liệu', objectId: 'KENH-02', objectName: 'Kafka sự kiện giao dịch',
    change: 'Khai báo kênh mới — cần xác nhận mức phân loại và người phụ trách',
    submittedBy: 'Đỗ Quang Vinh', submittedAt: '2026-08-07 08:20', approver: 'Phạm Thu Hà',
    state: 'Chờ phê duyệt', waitingDays: 2, priority: 'Cao',
    diff: [
      { field: 'Mức phân loại', before: '—', after: 'Mật' },
      { field: 'Phương thức xác thực', before: '—', after: 'SASL/SCRAM + TLS' },
    ],
  },
  {
    id: 'PD-0082', objectType: 'Báo cáo', objectId: 'BC-006', objectName: 'Báo cáo hiệu quả sản phẩm',
    change: 'Bổ sung chỉ tiêu CT-007 vào báo cáo',
    submittedBy: 'Lê Minh Tuấn', submittedAt: '2026-08-04 14:55', approver: 'Nguyễn Thị Phương',
    state: 'Chờ phê duyệt', waitingDays: 5, priority: 'Thấp',
    diff: [{ field: 'Danh sách chỉ tiêu', before: 'CT-001', after: 'CT-001, CT-007' }],
  },
]

export const approvalHistory: ApprovalItem[] = [
  {
    id: 'PD-0081', objectType: 'Bảng dữ liệu', objectId: 'rr.diem_rui_ro_kh', objectName: 'Điểm rủi ro khách hàng',
    change: 'Cập nhật mô tả nghiệp vụ và gán Data Owner',
    submittedBy: 'Đỗ Quang Vinh', submittedAt: '2026-08-02 09:30', approver: 'Phạm Thu Hà',
    state: 'Yêu cầu chỉnh sửa', waitingDays: 0, priority: 'Cao',
    diff: [{ field: 'Mô tả', before: 'Bang diem rui ro', after: 'Điểm chấm rủi ro AML cho từng khách hàng' }],
  },
  {
    id: 'PD-0080', objectType: 'Thuật ngữ', objectId: 'TN-0042', objectName: 'Doanh thu ghi nhận',
    change: 'Bổ sung loại trừ điều chỉnh giảm vào công thức',
    submittedBy: 'Nguyễn Thị Phương', submittedAt: '2026-06-18 11:20', approver: 'Phạm Thu Hà',
    state: 'Đã phê duyệt', waitingDays: 0, priority: 'Cao',
    diff: [{ field: 'Công thức', before: 'Tổng giao dịch − Hoàn tiền', after: 'Tổng giao dịch − Hoàn tiền − Điều chỉnh giảm' }],
  },
  {
    id: 'PD-0079', objectType: 'Bảng dữ liệu', objectId: 'bi.doi_soat_giao_dich_A', objectName: 'Đối soát giao dịch đối tác A',
    change: 'Nâng mức quan trọng lên Tier 1 và gán chu kỳ cam kết 07:00',
    submittedBy: 'Nguyễn Thị Phương', submittedAt: '2026-05-10 15:44', approver: 'Phạm Thu Hà',
    state: 'Đã phê duyệt', waitingDays: 0, priority: 'Cao',
    diff: [
      { field: 'Mức quan trọng', before: 'Tier 2', after: 'Tier 1' },
      { field: 'Chu kỳ cập nhật', before: 'Hằng ngày', after: 'Hằng ngày trước 07:00' },
    ],
  },
  {
    id: 'PD-0078', objectType: 'Kênh trao đổi dữ liệu', objectId: 'KENH-05', objectName: 'FTP gửi báo cáo cho đối tác B',
    change: 'Khai báo kênh gửi báo cáo doanh số ra ngoài',
    submittedBy: 'Lê Minh Tuấn', submittedAt: '2026-08-01 10:02', approver: 'Phạm Thu Hà',
    state: 'Yêu cầu chỉnh sửa', waitingDays: 0, priority: 'Nghiêm trọng',
    diff: [{ field: 'Phương thức xác thực', before: '—', after: 'FTP user/password — chưa mã hoá' }],
  },
]
