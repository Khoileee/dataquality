import type {
  SystemRow, TableRow, ColumnRow, DomainRow, GroupRow, RefDataRow,
  ChannelRow, ReportRow, MetricRow,
} from './types'

/* ═══════════════ 1.3 Hệ thống & Nguồn dữ liệu ═══════════════ */

export const systems: SystemRow[] = [
  {
    id: 'HT-01', name: 'CRM — Quản lý khách hàng', purpose: 'Quản lý hồ sơ khách hàng, hợp đồng và lịch sử chăm sóc',
    kind: 'Ứng dụng nghiệp vụ', tech: 'Oracle 19c', unit: 'Ban Kinh doanh', techOwner: 'Trần Văn Hùng',
    dataOwner: 'Phạm Thu Hà', env: 'Production', status: 'Đang sử dụng', tableCount: 412,
    domainIds: ['D-KD', 'D-KH'], approval: 'Đã phê duyệt', metadataScore: 92, updatedAt: '2026-07-28',
  },
  {
    id: 'HT-02', name: 'Core thanh toán', purpose: 'Xử lý và ghi nhận giao dịch thanh toán số',
    kind: 'Ứng dụng nghiệp vụ', tech: 'PostgreSQL 15', unit: 'Trung tâm Vận hành', techOwner: 'Trần Văn Hùng',
    dataOwner: 'Phạm Thu Hà', env: 'Production', status: 'Đang sử dụng', tableCount: 268,
    domainIds: ['D-GD'], approval: 'Đã phê duyệt', metadataScore: 88, updatedAt: '2026-08-01',
  },
  {
    id: 'HT-03', name: 'Kho dữ liệu tập trung (DWH)', purpose: 'Kho dữ liệu phân tích toàn công ty',
    kind: 'Kho dữ liệu', tech: 'Apache Iceberg trên HDFS', unit: 'Đội Dữ liệu', techOwner: 'Trần Văn Hùng',
    dataOwner: 'Nguyễn Thị Phương', env: 'Production', status: 'Đang sử dụng', tableCount: 6841,
    domainIds: ['D-KD', 'D-TC', 'D-GD', 'D-RR'], approval: 'Đã phê duyệt', metadataScore: 74, updatedAt: '2026-08-05',
  },
  {
    id: 'HT-04', name: 'Vùng dữ liệu thô (Data Lake)', purpose: 'Lưu dữ liệu nguyên trạng từ nguồn trước khi xử lý',
    kind: 'Vùng dữ liệu thô', tech: 'HDFS + Parquet', unit: 'Đội Dữ liệu', techOwner: 'Trần Văn Hùng',
    dataOwner: null as any, env: 'Production', status: 'Đang sử dụng', tableCount: 2934,
    domainIds: [], approval: 'Chờ phê duyệt', metadataScore: 31, updatedAt: '2026-08-06',
  },
  {
    id: 'HT-05', name: 'Hệ thống kế toán', purpose: 'Hạch toán, sổ cái và báo cáo tài chính',
    kind: 'Ứng dụng nghiệp vụ', tech: 'SQL Server 2019', unit: 'Ban Tài chính', techOwner: 'Đỗ Quang Vinh',
    dataOwner: 'Phạm Thu Hà', env: 'Production', status: 'Đang sử dụng', tableCount: 186,
    domainIds: ['D-TC'], approval: 'Đã phê duyệt', metadataScore: 81, updatedAt: '2026-07-15',
  },
  {
    id: 'HT-06', name: 'Nền tảng BI', purpose: 'Xây dựng và phân phối báo cáo, dashboard',
    kind: 'Công cụ BI', tech: 'Power BI Service', unit: 'Phòng Phân tích Dữ liệu', techOwner: 'Nguyễn Thị Phương',
    dataOwner: 'Nguyễn Thị Phương', env: 'Production', status: 'Đang sử dụng', tableCount: 0,
    domainIds: ['D-KD', 'D-TC'], approval: 'Đã phê duyệt', metadataScore: 69, updatedAt: '2026-08-02',
  },
  {
    id: 'HT-07', name: 'Hàng đợi sự kiện', purpose: 'Truyền sự kiện thời gian thực giữa các hệ thống',
    kind: 'Hàng đợi', tech: 'Apache Kafka 3.6', unit: 'Trung tâm Hạ tầng', techOwner: 'Đỗ Quang Vinh',
    dataOwner: null as any, env: 'Production', status: 'Đang sử dụng', tableCount: 0,
    domainIds: ['D-GD'], approval: 'Dự thảo', metadataScore: 24, updatedAt: '2026-08-07',
  },
  {
    id: 'HT-08', name: 'Hệ thống quản lý rủi ro', purpose: 'Chấm điểm rủi ro, phòng chống rửa tiền (AML)',
    kind: 'Ứng dụng nghiệp vụ', tech: 'MongoDB 6', unit: 'Ban Quản lý Rủi ro', techOwner: 'Đỗ Quang Vinh',
    dataOwner: 'Phạm Thu Hà', env: 'Production', status: 'Đang sử dụng', tableCount: 94,
    domainIds: ['D-RR'], approval: 'Đã phê duyệt', metadataScore: 77, updatedAt: '2026-06-30',
  },
  {
    id: 'HT-09', name: 'Cổng đối tác A', purpose: 'Trao đổi dữ liệu đối soát với đối tác A',
    kind: 'Cơ sở dữ liệu', tech: 'SFTP + MariaDB', unit: 'Trung tâm Vận hành', techOwner: 'Trần Văn Hùng',
    dataOwner: 'Phạm Thu Hà', env: 'Production', status: 'Đang sử dụng', tableCount: 12,
    domainIds: ['D-GD'], approval: 'Đã phê duyệt', metadataScore: 63, updatedAt: '2026-07-20',
  },
  {
    id: 'HT-10', name: 'CRM cũ (đã dừng)', purpose: 'Hệ thống khách hàng cũ, chỉ còn tra cứu lịch sử',
    kind: 'Ứng dụng nghiệp vụ', tech: 'MySQL 5.7', unit: 'Ban Kinh doanh', techOwner: 'Đỗ Quang Vinh',
    dataOwner: 'Phạm Thu Hà', env: 'Production', status: 'Đã ngừng sử dụng', tableCount: 76,
    domainIds: ['D-KH'], approval: 'Ngừng sử dụng', metadataScore: 45, updatedAt: '2025-12-31',
  },
]

/* ═══════════════ 1.7 Miền dữ liệu ═══════════════ */

export const domains: DomainRow[] = [
  { id: 'D-KD', name: 'Kinh doanh', parentId: null, description: 'Dữ liệu bán hàng, doanh thu, kênh phân phối', owner: 'Nguyễn Thị Phương', tableCount: 1842, coveredPct: 71, qualityScore: 88 },
  { id: 'D-KD-DS', name: 'Doanh số', parentId: 'D-KD', description: 'Doanh số theo kênh, sản phẩm, đơn vị', owner: 'Nguyễn Thị Phương', tableCount: 612, coveredPct: 78, qualityScore: 90 },
  { id: 'D-KD-KM', name: 'Khuyến mại', parentId: 'D-KD', description: 'Chương trình khuyến mại và hiệu quả', owner: 'Lê Minh Tuấn', tableCount: 184, coveredPct: 52, qualityScore: 79 },
  { id: 'D-KH', name: 'Khách hàng', parentId: null, description: 'Hồ sơ, phân khúc và hành vi khách hàng', owner: 'Phạm Thu Hà', tableCount: 964, coveredPct: 64, qualityScore: 82 },
  { id: 'D-KH-HS', name: 'Hồ sơ khách hàng', parentId: 'D-KH', description: 'Thông tin định danh và liên hệ', owner: 'Phạm Thu Hà', tableCount: 341, coveredPct: 69, qualityScore: 84 },
  { id: 'D-GD', name: 'Giao dịch', parentId: null, description: 'Giao dịch thanh toán, đối soát, hoàn tiền', owner: 'Phạm Thu Hà', tableCount: 2104, coveredPct: 58, qualityScore: 86 },
  { id: 'D-GD-DS', name: 'Đối soát', parentId: 'D-GD', description: 'Đối soát giao dịch với đối tác và ngân hàng', owner: 'Nguyễn Thị Phương', tableCount: 268, coveredPct: 74, qualityScore: 91 },
  { id: 'D-TC', name: 'Tài chính', parentId: null, description: 'Sổ cái, chi phí, doanh thu ghi nhận', owner: 'Phạm Thu Hà', tableCount: 1438, coveredPct: 61, qualityScore: 84 },
  { id: 'D-RR', name: 'Rủi ro & Tuân thủ', parentId: null, description: 'Chấm điểm rủi ro, AML, danh sách đen', owner: 'Đỗ Quang Vinh', tableCount: 800, coveredPct: 44, qualityScore: 76 },
]

/* ═══════════════ 1.2 Bảng dữ liệu ═══════════════ */

const T = (o: Partial<TableRow> & Pick<TableRow, 'id' | 'name' | 'description'>): TableRow => ({
  systemId: 'HT-03', domain: null, tier: null, dataOwner: null, bda: null, de: null,
  rows: 0, sizeGb: 0, format: 'Iceberg', zone: 'dwh', syncFrequency: 'Hằng ngày',
  freshness: '2 giờ trước', freshnessOk: true, lifecycle: 'Đang dùng', approval: 'Đã phê duyệt',
  confidentiality: 'Nội bộ', qualityScore: null, ruleCount: 0, columnCount: 0, sensitiveColumnCount: 0,
  producedByJob: null, producedByIngest: null, consumerReports: [], downstreamTables: [],
  usageWeek: 0, metadataScore: 0, updatedAt: '2026-08-01', updatedBy: 'Trần Văn Hùng',
  ...o,
} as TableRow)

export const tables: TableRow[] = [
  T({
    id: 'bi.doi_soat_giao_dich_A', name: 'Đối soát giao dịch đối tác A',
    description: 'Bảng đối soát giao dịch hằng ngày giữa hệ thống nội bộ và đối tác A',
    systemId: 'HT-03', domain: 'D-GD-DS', tier: 'Tier 1', dataOwner: 'Phạm Thu Hà',
    bda: 'Nguyễn Thị Phương', de: 'Trần Văn Hùng', rows: 12_480_331, sizeGb: 84.6,
    format: 'Iceberg', zone: 'bi', syncFrequency: 'Hằng ngày trước 07:00', freshness: '38 phút trước',
    freshnessOk: true, qualityScore: 91, ruleCount: 7, columnCount: 14, sensitiveColumnCount: 2,
    producedByJob: 'JOB-0412', consumerReports: ['BC-001', 'BC-002', 'BC-004', 'BC-007', 'BC-011', 'BC-016'],
    downstreamTables: ['mart.doi_soat_thang', 'fin.so_cai_doi_soat'], usageWeek: 1284, metadataScore: 96,
    confidentiality: 'Mật', updatedAt: '2026-08-08', updatedBy: 'Nguyễn Thị Phương',
  }),
  T({
    id: 'raw.doi_soat_A_tho', name: 'Dữ liệu đối soát A — bản thô',
    description: 'File đối soát nhận từ SFTP đối tác A, chưa xử lý',
    systemId: 'HT-04', domain: 'D-GD-DS', tier: 'Tier 2', dataOwner: 'Phạm Thu Hà',
    bda: null, de: 'Trần Văn Hùng', rows: 12_512_004, sizeGb: 96.2, format: 'Parquet', zone: 'raw',
    syncFrequency: 'Hằng ngày 05:30', freshness: '3 giờ trước', freshnessOk: true,
    qualityScore: 78, ruleCount: 3, columnCount: 12, sensitiveColumnCount: 2,
    producedByIngest: 'NAP-012', downstreamTables: ['bi.doi_soat_giao_dich_A'],
    usageWeek: 42, metadataScore: 58, confidentiality: 'Mật', updatedAt: '2026-08-08',
  }),
  T({
    id: 'dwh.giao_dich_thanh_toan', name: 'Giao dịch thanh toán',
    description: 'Toàn bộ giao dịch thanh toán đã chuẩn hoá',
    systemId: 'HT-03', domain: 'D-GD', tier: 'Tier 1', dataOwner: 'Phạm Thu Hà',
    bda: 'Nguyễn Thị Phương', de: 'Trần Văn Hùng', rows: 486_204_118, sizeGb: 1_842,
    zone: 'dwh', syncFrequency: 'Mỗi giờ', freshness: '22 phút trước', freshnessOk: true,
    qualityScore: 94, ruleCount: 12, columnCount: 22, sensitiveColumnCount: 3,
    producedByJob: 'JOB-0208', consumerReports: ['BC-001', 'BC-003', 'BC-009'],
    downstreamTables: ['bi.doi_soat_giao_dich_A', 'mart.doanh_thu_ngay'], usageWeek: 3126, metadataScore: 91,
    confidentiality: 'Mật',
  }),
  T({
    id: 'crm.khach_hang', name: 'Khách hàng',
    description: 'Hồ sơ khách hàng gốc từ hệ thống CRM',
    systemId: 'HT-01', domain: 'D-KH-HS', tier: 'Tier 1', dataOwner: 'Phạm Thu Hà',
    bda: 'Phạm Thu Hà', de: 'Trần Văn Hùng', rows: 8_412_907, sizeGb: 62.1, format: 'Hudi',
    zone: 'crm', syncFrequency: 'Hằng ngày 02:00', freshness: '6 giờ trước', freshnessOk: true,
    qualityScore: 73, ruleCount: 9, columnCount: 18, sensitiveColumnCount: 5,
    producedByJob: 'JOB-0117', consumerReports: ['BC-005', 'BC-012'],
    downstreamTables: ['mart.phan_khuc_kh'], usageWeek: 2418, metadataScore: 88,
    confidentiality: 'Hạn chế truy cập',
  }),
  T({
    id: 'mart.doanh_thu_ngay', name: 'Doanh thu theo ngày',
    description: 'Doanh thu tổng hợp theo ngày, kênh và sản phẩm',
    systemId: 'HT-03', domain: 'D-KD-DS', tier: 'Tier 1', dataOwner: 'Phạm Thu Hà',
    bda: 'Nguyễn Thị Phương', de: 'Trần Văn Hùng', rows: 1_284_006, sizeGb: 12.4,
    zone: 'mart', syncFrequency: 'Hằng ngày trước 08:00', freshness: '1 giờ trước', freshnessOk: true,
    qualityScore: 89, ruleCount: 8, columnCount: 11, sensitiveColumnCount: 0,
    producedByJob: 'JOB-0301', consumerReports: ['BC-001', 'BC-002', 'BC-006'],
    usageWeek: 4210, metadataScore: 94,
  }),
  T({
    id: 'fin.so_cai_doi_soat', name: 'Sổ cái đối soát',
    description: 'Bút toán hạch toán phát sinh từ kết quả đối soát',
    systemId: 'HT-05', domain: 'D-TC', tier: 'Tier 1', dataOwner: 'Phạm Thu Hà',
    bda: 'Phạm Thu Hà', de: 'Đỗ Quang Vinh', rows: 24_186_442, sizeGb: 108.3,
    zone: 'fin', syncFrequency: 'Hằng ngày trước 09:00', freshness: '4 giờ trước', freshnessOk: true,
    qualityScore: 92, ruleCount: 6, columnCount: 15, sensitiveColumnCount: 0,
    producedByJob: 'JOB-0455', consumerReports: ['BC-004', 'BC-008'], usageWeek: 862, metadataScore: 90,
    confidentiality: 'Mật',
  }),
  T({
    id: 'mart.doi_soat_thang', name: 'Đối soát theo tháng',
    description: 'Tổng hợp đối soát theo tháng phục vụ báo cáo quản trị',
    systemId: 'HT-03', domain: 'D-GD-DS', tier: 'Tier 2', dataOwner: 'Phạm Thu Hà',
    bda: 'Nguyễn Thị Phương', de: 'Trần Văn Hùng', rows: 42_118, sizeGb: 0.8,
    zone: 'mart', syncFrequency: 'Hằng tháng', freshness: '8 ngày trước', freshnessOk: true,
    qualityScore: 85, ruleCount: 4, columnCount: 9, sensitiveColumnCount: 0,
    producedByJob: 'JOB-0412', consumerReports: ['BC-007'], usageWeek: 186, metadataScore: 82,
  }),
  T({
    id: 'crm.hop_dong', name: 'Hợp đồng khách hàng',
    description: 'Hợp đồng dịch vụ ký với khách hàng',
    systemId: 'HT-01', domain: 'D-KH', tier: 'Tier 2', dataOwner: 'Phạm Thu Hà',
    bda: 'Phạm Thu Hà', de: 'Trần Văn Hùng', rows: 3_128_004, sizeGb: 22.6, format: 'Hudi',
    zone: 'crm', syncFrequency: 'Hằng ngày', freshness: '5 giờ trước', freshnessOk: true,
    qualityScore: 81, ruleCount: 5, columnCount: 16, sensitiveColumnCount: 2,
    producedByJob: 'JOB-0117', consumerReports: ['BC-005'], usageWeek: 640, metadataScore: 79,
    confidentiality: 'Mật',
  }),
  T({
    id: 'rr.diem_rui_ro_kh', name: 'Điểm rủi ro khách hàng',
    description: 'Điểm chấm rủi ro AML cho từng khách hàng',
    systemId: 'HT-08', domain: 'D-RR', tier: 'Tier 1', dataOwner: 'Đỗ Quang Vinh',
    bda: null, de: 'Đỗ Quang Vinh', rows: 8_402_118, sizeGb: 18.2,
    zone: 'ops', syncFrequency: 'Hằng ngày 03:00', freshness: '18 giờ trước', freshnessOk: false,
    qualityScore: 62, ruleCount: 4, columnCount: 10, sensitiveColumnCount: 2,
    producedByJob: 'JOB-0806', consumerReports: ['BC-010'], usageWeek: 312, metadataScore: 54,
    confidentiality: 'Hạn chế truy cập', approval: 'Yêu cầu chỉnh sửa',
  }),
  T({
    id: 'mart.phan_khuc_kh', name: 'Phân khúc khách hàng',
    description: 'Phân khúc khách hàng theo giá trị và hành vi',
    systemId: 'HT-03', domain: 'D-KH', tier: 'Tier 2', dataOwner: 'Phạm Thu Hà',
    bda: 'Lê Minh Tuấn', de: 'Trần Văn Hùng', rows: 8_402_118, sizeGb: 9.4,
    zone: 'mart', syncFrequency: 'Hằng tuần', freshness: '2 ngày trước', freshnessOk: true,
    qualityScore: 76, ruleCount: 3, columnCount: 8, sensitiveColumnCount: 0,
    producedByJob: 'JOB-0523', consumerReports: ['BC-012'], usageWeek: 428, metadataScore: 71,
  }),
  T({
    id: 'dwh.san_pham', name: 'Sản phẩm dịch vụ',
    description: 'Danh mục sản phẩm, dịch vụ đang cung cấp',
    systemId: 'HT-03', domain: 'D-KD', tier: 'Tier 2', dataOwner: 'Lê Minh Tuấn',
    bda: 'Lê Minh Tuấn', de: 'Trần Văn Hùng', rows: 1_284, sizeGb: 0.1,
    zone: 'dwh', syncFrequency: 'Khi thay đổi', freshness: '12 ngày trước', freshnessOk: true,
    qualityScore: 95, ruleCount: 3, columnCount: 9, sensitiveColumnCount: 0,
    consumerReports: ['BC-006'], usageWeek: 984, metadataScore: 86,
    confidentiality: 'Công khai',
  }),
  T({
    id: 'ops.nhat_ky_job', name: 'Nhật ký chạy job',
    description: 'Nhật ký chi tiết từng lần chạy của các job xử lý',
    systemId: 'HT-03', domain: null, tier: 'Tier 3', dataOwner: null,
    bda: null, de: 'Trần Văn Hùng', rows: 128_402_118, sizeGb: 412,
    zone: 'ops', syncFrequency: 'Liên tục', freshness: '2 phút trước', freshnessOk: true,
    qualityScore: null, ruleCount: 0, columnCount: 12, sensitiveColumnCount: 0,
    usageWeek: 86, metadataScore: 34, approval: 'Dự thảo',
  }),
  T({
    id: 'raw.giao_dich_kafka', name: 'Sự kiện giao dịch từ Kafka',
    description: 'Sự kiện giao dịch nhận theo thời gian thực',
    systemId: 'HT-04', domain: null, tier: null, dataOwner: null,
    bda: null, de: null, rows: 942_186_004, sizeGb: 2_140, format: 'Parquet',
    zone: 'raw', syncFrequency: 'Thời gian thực', freshness: '1 phút trước', freshnessOk: true,
    qualityScore: null, ruleCount: 0, columnCount: 16, sensitiveColumnCount: 3,
    producedByIngest: 'NAP-031', usageWeek: 12, metadataScore: 18, approval: 'Dự thảo',
    confidentiality: 'Mật',
  }),
  T({
    id: 'raw.file_ke_toan_thang', name: 'File kế toán tháng',
    description: 'File Excel do Ban Tài chính tải lên hằng tháng',
    systemId: 'HT-04', domain: 'D-TC', tier: 'Tier 3', dataOwner: null,
    bda: null, de: null, rows: 84_204, sizeGb: 0.4, format: 'Parquet',
    zone: 'raw', syncFrequency: 'Hằng tháng', freshness: '22 ngày trước', freshnessOk: false,
    qualityScore: null, ruleCount: 0, columnCount: 11, sensitiveColumnCount: 0,
    producedByIngest: 'NAP-044', usageWeek: 4, metadataScore: 22, approval: 'Chờ phê duyệt',
  }),
  T({
    id: 'crm.khach_hang_cu', name: 'Khách hàng (hệ thống cũ)',
    description: 'Dữ liệu khách hàng từ CRM cũ, chỉ tra cứu lịch sử',
    systemId: 'HT-10', domain: 'D-KH-HS', tier: 'Tier 3', dataOwner: 'Phạm Thu Hà',
    bda: null, de: 'Đỗ Quang Vinh', rows: 4_128_006, sizeGb: 28.4, format: 'ORC',
    zone: 'crm', syncFrequency: 'Không cập nhật', freshness: '221 ngày trước', freshnessOk: false,
    lifecycle: 'Sắp ngừng', qualityScore: 48, ruleCount: 1, columnCount: 14, sensitiveColumnCount: 4,
    usageWeek: 8, metadataScore: 44, confidentiality: 'Hạn chế truy cập',
  }),
  T({
    id: 'fin.chi_phi_van_hanh', name: 'Chi phí vận hành',
    description: 'Chi phí vận hành phân bổ theo trung tâm chi phí',
    systemId: 'HT-05', domain: 'D-TC', tier: 'Tier 2', dataOwner: 'Phạm Thu Hà',
    bda: 'Phạm Thu Hà', de: 'Đỗ Quang Vinh', rows: 812_004, sizeGb: 4.2,
    zone: 'fin', syncFrequency: 'Hằng tháng', freshness: '11 ngày trước', freshnessOk: true,
    qualityScore: 87, ruleCount: 4, columnCount: 12, sensitiveColumnCount: 0,
    producedByJob: 'JOB-0455', consumerReports: ['BC-008'], usageWeek: 218, metadataScore: 83,
    confidentiality: 'Mật',
  }),
  T({
    id: 'ref.tinh_thanh', name: 'Danh mục tỉnh thành',
    description: 'Danh mục tỉnh/thành phố theo chuẩn hành chính',
    systemId: 'HT-03', domain: null, tier: 'Tier 3', dataOwner: 'Lê Minh Tuấn',
    bda: 'Lê Minh Tuấn', de: 'Trần Văn Hùng', rows: 63, sizeGb: 0.01,
    zone: 'ref', syncFrequency: 'Khi thay đổi', freshness: '96 ngày trước', freshnessOk: true,
    qualityScore: 100, ruleCount: 2, columnCount: 5, sensitiveColumnCount: 0,
    usageWeek: 1642, metadataScore: 92, confidentiality: 'Công khai',
  }),
  T({
    id: 'dwh.kenh_ban_hang', name: 'Kênh bán hàng',
    description: 'Danh mục kênh bán hàng và cấu trúc phân cấp',
    systemId: 'HT-03', domain: 'D-KD', tier: 'Tier 3', dataOwner: 'Lê Minh Tuấn',
    bda: 'Lê Minh Tuấn', de: null, rows: 184, sizeGb: 0.01,
    zone: 'dwh', syncFrequency: 'Khi thay đổi', freshness: '31 ngày trước', freshnessOk: true,
    qualityScore: 96, ruleCount: 2, columnCount: 7, sensitiveColumnCount: 0,
    consumerReports: ['BC-002'], usageWeek: 762, metadataScore: 74, confidentiality: 'Công khai',
  }),
  T({
    id: 'ops.hang_doi_canh_bao', name: 'Hàng đợi cảnh báo',
    description: 'Hàng đợi cảnh báo chờ gửi cho người nhận',
    systemId: 'HT-03', domain: null, tier: null, dataOwner: null,
    bda: null, de: null, rows: 428_004, sizeGb: 1.2,
    zone: 'ops', syncFrequency: 'Liên tục', freshness: '4 phút trước', freshnessOk: true,
    qualityScore: null, ruleCount: 0, columnCount: 8, sensitiveColumnCount: 0,
    usageWeek: 2, metadataScore: 12, approval: 'Dự thảo', lifecycle: 'Nháp',
  }),
]

export const tableById = (id: string) => tables.find(t => t.id === id)

/* ═══════════════ Cột của bảng ═══════════════ */

const C = (o: Partial<ColumnRow> & Pick<ColumnRow, 'tableId' | 'ord' | 'name' | 'type' | 'description'>): ColumnRow => ({
  glossaryId: null, tags: [], confidentiality: 'Nội bộ', businessRule: null, valueSet: null,
  isKey: false, nullable: true, nullPct: 0, distinctCount: 0, min: null, max: null, maskPolicy: null,
  ...o,
} as ColumnRow)

export const columns: ColumnRow[] = [
  // ── bi.doi_soat_giao_dich_A ──
  C({ tableId: 'bi.doi_soat_giao_dich_A', ord: 1, name: 'ma_giao_dich', type: 'string', description: 'Mã giao dịch duy nhất trong hệ thống', isKey: true, nullable: false, nullPct: 0, distinctCount: 12_480_331, min: 'GD00000001', max: 'GD12480331', glossaryId: 'TN-0011' }),
  C({ tableId: 'bi.doi_soat_giao_dich_A', ord: 2, name: 'ngay_giao_dich', type: 'date', description: 'Ngày phát sinh giao dịch', nullable: false, nullPct: 0, distinctCount: 731, min: '2024-08-01', max: '2026-08-08' }),
  C({ tableId: 'bi.doi_soat_giao_dich_A', ord: 3, name: 'ma_khach_hang', type: 'string', description: 'Mã khách hàng thực hiện giao dịch', nullPct: 0.4, distinctCount: 4_218_004, glossaryId: 'TN-0021', tags: ['PD_BASIC'], confidentiality: 'Mật' }),
  C({ tableId: 'bi.doi_soat_giao_dich_A', ord: 4, name: 'so_dien_thoai', type: 'string', description: 'Số điện thoại khách hàng tại thời điểm giao dịch', nullPct: 3.2, distinctCount: 3_842_118, tags: ['PD_SENSITIVE', 'PII_PHONE'], confidentiality: 'Hạn chế truy cập', businessRule: 'Định dạng ^(84|0)(3|5|7|8|9)[0-9]{8}$', maskPolicy: null }),
  C({ tableId: 'bi.doi_soat_giao_dich_A', ord: 5, name: 'so_cccd', type: 'string', description: 'Số căn cước công dân', nullPct: 12.8, distinctCount: 3_104_882, tags: ['PD_SENSITIVE', 'PII_ID'], confidentiality: 'Hạn chế truy cập', businessRule: 'Đúng 12 chữ số' }),
  C({ tableId: 'bi.doi_soat_giao_dich_A', ord: 6, name: 'so_tien', type: 'decimal(18,2)', description: 'Số tiền giao dịch (VND)', nullable: false, nullPct: 0, distinctCount: 842_118, min: '1000', max: '4980000000', glossaryId: 'TN-0042', businessRule: 'Phải > 0' }),
  C({ tableId: 'bi.doi_soat_giao_dich_A', ord: 7, name: 'loai_giao_dich', type: 'string', description: 'Loại giao dịch', nullable: false, nullPct: 0, distinctCount: 8, valueSet: ['NAP', 'RUT', 'CHUYEN', 'THANHTOAN', 'HOANTIEN', 'PHI', 'DIEUCHINH', 'KHAC'], businessRule: 'Phải thuộc danh mục LOAI_GD' }),
  C({ tableId: 'bi.doi_soat_giao_dich_A', ord: 8, name: 'trang_thai', type: 'string', description: 'Trạng thái đối soát', nullable: false, nullPct: 0, distinctCount: 4, valueSet: ['KHOP', 'LECH', 'THIEU_NOI_BO', 'THIEU_DOI_TAC'] }),
  C({ tableId: 'bi.doi_soat_giao_dich_A', ord: 9, name: 'ma_doi_tac', type: 'string', description: 'Mã đối tác tham gia giao dịch', nullPct: 0.1, distinctCount: 42, businessRule: 'Phải tồn tại trong danh mục DM-004' }),
  C({ tableId: 'bi.doi_soat_giao_dich_A', ord: 10, name: 'so_tien_doi_tac', type: 'decimal(18,2)', description: 'Số tiền do đối tác báo về', nullPct: 2.1, distinctCount: 836_004, min: '1000', max: '4980000000' }),
  C({ tableId: 'bi.doi_soat_giao_dich_A', ord: 11, name: 'chenh_lech', type: 'decimal(18,2)', description: 'Chênh lệch giữa nội bộ và đối tác', nullPct: 2.1, distinctCount: 12_842, min: '-4200000', max: '3800000', glossaryId: 'TN-0055' }),
  C({ tableId: 'bi.doi_soat_giao_dich_A', ord: 12, name: 'ma_tinh_thanh', type: 'string', description: 'Mã tỉnh/thành nơi phát sinh giao dịch', nullPct: 8.4, distinctCount: 63, businessRule: 'Phải tồn tại trong ref.tinh_thanh' }),
  C({ tableId: 'bi.doi_soat_giao_dich_A', ord: 13, name: 'kenh', type: 'string', description: 'Kênh phát sinh giao dịch', nullPct: 1.2, distinctCount: 12, valueSet: ['APP', 'WEB', 'POS', 'ATM', 'QR', 'API'] }),
  C({ tableId: 'bi.doi_soat_giao_dich_A', ord: 14, name: 'thoi_diem_cap_nhat', type: 'timestamp', description: 'Thời điểm bản ghi được cập nhật lần cuối', nullable: false, nullPct: 0, distinctCount: 11_842_004 }),

  // ── crm.khach_hang ──
  C({ tableId: 'crm.khach_hang', ord: 1, name: 'ma_khach_hang', type: 'string', description: 'Mã khách hàng duy nhất', isKey: true, nullable: false, nullPct: 0, distinctCount: 8_412_907, glossaryId: 'TN-0021' }),
  C({ tableId: 'crm.khach_hang', ord: 2, name: 'ho_ten', type: 'string', description: 'Họ và tên khách hàng', nullPct: 0.2, distinctCount: 6_842_004, tags: ['PD_BASIC', 'PII_NAME'], confidentiality: 'Mật' }),
  C({ tableId: 'crm.khach_hang', ord: 3, name: 'so_dien_thoai', type: 'string', description: 'Số điện thoại liên hệ chính', nullPct: 1.8, distinctCount: 8_104_228, tags: ['PD_SENSITIVE', 'PII_PHONE'], confidentiality: 'Hạn chế truy cập', businessRule: 'Định dạng số điện thoại Việt Nam' }),
  C({ tableId: 'crm.khach_hang', ord: 4, name: 'email', type: 'string', description: 'Địa chỉ thư điện tử', nullPct: 24.6, distinctCount: 5_218_004, tags: ['PD_BASIC', 'PII_EMAIL'], confidentiality: 'Mật' }),
  C({ tableId: 'crm.khach_hang', ord: 5, name: 'so_cccd', type: 'string', description: 'Số căn cước công dân', nullPct: 8.4, distinctCount: 7_842_118, tags: ['PD_SENSITIVE', 'PII_ID'], confidentiality: 'Hạn chế truy cập' }),
  C({ tableId: 'crm.khach_hang', ord: 6, name: 'dia_chi', type: 'string', description: 'Địa chỉ thường trú', nullPct: 18.2, distinctCount: 6_128_004, tags: ['PD_BASIC', 'PII_ADDRESS'], confidentiality: 'Mật' }),
  C({ tableId: 'crm.khach_hang', ord: 7, name: 'ngay_sinh', type: 'date', description: 'Ngày sinh', nullPct: 14.8, distinctCount: 24_186, tags: ['PD_BASIC'], confidentiality: 'Mật', min: '1930-01-01', max: '2008-12-31' }),
  C({ tableId: 'crm.khach_hang', ord: 8, name: 'phan_khuc', type: 'string', description: 'Phân khúc khách hàng', nullPct: 32.4, distinctCount: 5, valueSet: ['VIP', 'GOLD', 'SILVER', 'BASIC', 'NEW'], glossaryId: 'TN-0068' }),
  C({ tableId: 'crm.khach_hang', ord: 9, name: 'trang_thai', type: 'string', description: 'Trạng thái hoạt động', nullable: false, nullPct: 0, distinctCount: 4, valueSet: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'CLOSED'], glossaryId: 'TN-0002' }),
  C({ tableId: 'crm.khach_hang', ord: 10, name: 'ngay_mo', type: 'date', description: 'Ngày mở tài khoản', nullable: false, nullPct: 0, distinctCount: 4_218, min: '2014-01-02', max: '2026-08-08' }),

  // ── mart.doanh_thu_ngay ──
  C({ tableId: 'mart.doanh_thu_ngay', ord: 1, name: 'ngay', type: 'date', description: 'Ngày ghi nhận doanh thu', isKey: true, nullable: false, nullPct: 0, distinctCount: 1_096, min: '2023-08-01', max: '2026-08-08' }),
  C({ tableId: 'mart.doanh_thu_ngay', ord: 2, name: 'ma_kenh', type: 'string', description: 'Mã kênh bán hàng', isKey: true, nullable: false, nullPct: 0, distinctCount: 12 }),
  C({ tableId: 'mart.doanh_thu_ngay', ord: 3, name: 'ma_san_pham', type: 'string', description: 'Mã sản phẩm', isKey: true, nullable: false, nullPct: 0, distinctCount: 1_284 }),
  C({ tableId: 'mart.doanh_thu_ngay', ord: 4, name: 'doanh_thu', type: 'decimal(18,2)', description: 'Doanh thu ghi nhận trong ngày', nullable: false, nullPct: 0, distinctCount: 1_204_006, glossaryId: 'TN-0042', min: '0', max: '84200000000' }),
  C({ tableId: 'mart.doanh_thu_ngay', ord: 5, name: 'so_giao_dich', type: 'bigint', description: 'Số lượng giao dịch', nullable: false, nullPct: 0, distinctCount: 84_218, min: '0', max: '1284006' }),
  C({ tableId: 'mart.doanh_thu_ngay', ord: 6, name: 'so_khach_hang', type: 'bigint', description: 'Số khách hàng phát sinh', nullPct: 0.8, distinctCount: 62_418 }),
]

export const columnsOf = (tableId: string) => columns.filter(c => c.tableId === tableId)

/* ═══════════════ 1.6 Nhóm bảng ═══════════════ */

export const groups: GroupRow[] = [
  { id: 'NB-01', name: 'Đối soát giao dịch', description: 'Bộ bảng phục vụ nghiệp vụ đối soát hằng ngày', tableIds: ['bi.doi_soat_giao_dich_A', 'raw.doi_soat_A_tho', 'mart.doi_soat_thang', 'fin.so_cai_doi_soat'], createdBy: 'Nguyễn Thị Phương', createdAt: '2025-11-04', status: 'Đang dùng', usedByPolicies: 6 },
  { id: 'NB-02', name: 'Dữ liệu khách hàng', description: 'Bộ bảng chứa dữ liệu định danh khách hàng — cần kiểm soát chặt', tableIds: ['crm.khach_hang', 'crm.hop_dong', 'mart.phan_khuc_kh', 'crm.khach_hang_cu'], createdBy: 'Phạm Thu Hà', createdAt: '2025-09-18', status: 'Đang dùng', usedByPolicies: 14 },
  { id: 'NB-03', name: 'Báo cáo tài chính', description: 'Bộ bảng phục vụ lập báo cáo tài chính định kỳ', tableIds: ['fin.so_cai_doi_soat', 'fin.chi_phi_van_hanh', 'mart.doanh_thu_ngay'], createdBy: 'Phạm Thu Hà', createdAt: '2026-01-12', status: 'Đang dùng', usedByPolicies: 8 },
  { id: 'NB-04', name: 'Danh mục dùng chung', description: 'Các bảng tham chiếu dùng chung toàn hệ thống', tableIds: ['ref.tinh_thanh', 'dwh.san_pham', 'dwh.kenh_ban_hang'], createdBy: 'Lê Minh Tuấn', createdAt: '2025-06-22', status: 'Đang dùng', usedByPolicies: 3 },
  { id: 'NB-05', name: 'Rủi ro & Tuân thủ', description: 'Dữ liệu chấm điểm rủi ro và phòng chống rửa tiền', tableIds: ['rr.diem_rui_ro_kh'], createdBy: 'Đỗ Quang Vinh', createdAt: '2026-03-08', status: 'Đang dùng', usedByPolicies: 4 },
  { id: 'NB-06', name: 'Vùng thô — chờ xử lý', description: 'Bảng thô chưa gán chủ, đang chờ khai báo metadata', tableIds: ['raw.giao_dich_kafka', 'raw.file_ke_toan_thang', 'ops.hang_doi_canh_bao'], createdBy: 'Trần Văn Hùng', createdAt: '2026-07-02', status: 'Đã ngừng', usedByPolicies: 0 },
]

/* ═══════════════ 1.8 Danh mục tham chiếu ═══════════════ */

export const refdata: RefDataRow[] = [
  {
    id: 'DM-004', name: 'Danh mục đối tác', description: 'Danh sách đối tác tham gia giao dịch và đối soát',
    recordCount: 42, version: 'v12', owner: 'Nguyễn Thị Phương', approval: 'Đã phê duyệt',
    pendingCount: 3, usedByRules: 8, updatedAt: '2026-08-04',
    fields: [
      { name: 'ma_doi_tac', type: 'string', required: true, key: true, format: '^DT[0-9]{3}$' },
      { name: 'ten_doi_tac', type: 'string', required: true, key: false },
      { name: 'loai', type: 'string', required: true, key: false },
      { name: 'trang_thai', type: 'string', required: true, key: false },
      { name: 'ngay_hieu_luc', type: 'date', required: false, key: false },
    ],
    records: [
      { ma_doi_tac: 'DT001', ten_doi_tac: 'Đối tác A', loai: 'Ngân hàng', trang_thai: 'Đang hợp tác', ngay_hieu_luc: '2023-01-01' },
      { ma_doi_tac: 'DT002', ten_doi_tac: 'Đối tác B', loai: 'Ví điện tử', trang_thai: 'Đang hợp tác', ngay_hieu_luc: '2023-06-15' },
      { ma_doi_tac: 'DT003', ten_doi_tac: 'Đối tác C', loai: 'Trung gian thanh toán', trang_thai: 'Đang hợp tác', ngay_hieu_luc: '2024-02-01' },
      { ma_doi_tac: 'DT004', ten_doi_tac: 'Đối tác D', loai: 'Ngân hàng', trang_thai: 'Tạm dừng', ngay_hieu_luc: '2022-08-20' },
      { ma_doi_tac: 'DT005', ten_doi_tac: 'Đối tác E', loai: 'Ví điện tử', trang_thai: 'Đang hợp tác', ngay_hieu_luc: '2025-03-10' },
      { ma_doi_tac: 'DT006', ten_doi_tac: 'Đối tác F', loai: 'Viễn thông', trang_thai: 'Đang hợp tác', ngay_hieu_luc: '2025-09-01' },
    ],
    versions: [
      { version: 'v12', date: '2026-08-04', by: 'Nguyễn Thị Phương', note: 'Thêm đối tác F, cập nhật trạng thái DT004', added: 1, removed: 0, changed: 1 },
      { version: 'v11', date: '2026-05-18', by: 'Lê Minh Tuấn', note: 'Bổ sung trường ngày hiệu lực', added: 0, removed: 0, changed: 42 },
      { version: 'v10', date: '2026-02-02', by: 'Nguyễn Thị Phương', note: 'Thêm 4 đối tác ví điện tử', added: 4, removed: 0, changed: 0 },
    ],
    pending: [
      { code: 'DT043', name: 'Đối tác G', action: 'Thêm mới', by: 'Lê Minh Tuấn', at: '2026-08-07 14:22', note: 'Hợp đồng ký ngày 05/08' },
      { code: 'DT004', name: 'Đối tác D', action: 'Ngừng dùng', by: 'Nguyễn Thị Phương', at: '2026-08-06 09:10', note: 'Chấm dứt hợp tác từ 01/09' },
      { code: 'DT002', name: 'Đối tác B', action: 'Cập nhật', by: 'Lê Minh Tuấn', at: '2026-08-05 16:40', note: 'Đổi tên pháp nhân' },
    ],
  },
  {
    id: 'DM-001', name: 'Danh mục tỉnh/thành', description: 'Danh mục đơn vị hành chính cấp tỉnh',
    recordCount: 63, version: 'v4', owner: 'Lê Minh Tuấn', approval: 'Đã phê duyệt',
    pendingCount: 0, usedByRules: 12, updatedAt: '2026-05-02',
    fields: [
      { name: 'ma_tinh', type: 'string', required: true, key: true, format: '^[0-9]{2}$' },
      { name: 'ten_tinh', type: 'string', required: true, key: false },
      { name: 'vung', type: 'string', required: true, key: false },
    ],
    records: [
      { ma_tinh: '01', ten_tinh: 'Hà Nội', vung: 'Đồng bằng sông Hồng' },
      { ma_tinh: '79', ten_tinh: 'TP. Hồ Chí Minh', vung: 'Đông Nam Bộ' },
      { ma_tinh: '48', ten_tinh: 'Đà Nẵng', vung: 'Bắc Trung Bộ và Duyên hải miền Trung' },
      { ma_tinh: '31', ten_tinh: 'Hải Phòng', vung: 'Đồng bằng sông Hồng' },
      { ma_tinh: '92', ten_tinh: 'Cần Thơ', vung: 'Đồng bằng sông Cửu Long' },
    ],
    versions: [
      { version: 'v4', date: '2026-05-02', by: 'Lê Minh Tuấn', note: 'Cập nhật tên vùng theo quy định mới', added: 0, removed: 0, changed: 63 },
      { version: 'v3', date: '2024-11-11', by: 'Lê Minh Tuấn', note: 'Chuẩn hoá mã tỉnh 2 ký tự', added: 0, removed: 0, changed: 63 },
    ],
    pending: [],
  },
  {
    id: 'DM-007', name: 'Danh mục loại giao dịch', description: 'Phân loại nghiệp vụ của giao dịch',
    recordCount: 8, version: 'v6', owner: 'Phạm Thu Hà', approval: 'Chờ phê duyệt',
    pendingCount: 2, usedByRules: 6, updatedAt: '2026-08-06',
    fields: [
      { name: 'ma_loai', type: 'string', required: true, key: true },
      { name: 'ten_loai', type: 'string', required: true, key: false },
      { name: 'nhom', type: 'string', required: false, key: false },
    ],
    records: [
      { ma_loai: 'NAP', ten_loai: 'Nạp tiền', nhom: 'Tăng số dư' },
      { ma_loai: 'RUT', ten_loai: 'Rút tiền', nhom: 'Giảm số dư' },
      { ma_loai: 'CHUYEN', ten_loai: 'Chuyển tiền', nhom: 'Giảm số dư' },
      { ma_loai: 'THANHTOAN', ten_loai: 'Thanh toán', nhom: 'Giảm số dư' },
      { ma_loai: 'HOANTIEN', ten_loai: 'Hoàn tiền', nhom: 'Tăng số dư' },
    ],
    versions: [
      { version: 'v6', date: '2026-08-06', by: 'Phạm Thu Hà', note: 'Thêm loại ĐIỀU CHỈNH', added: 1, removed: 0, changed: 0 },
    ],
    pending: [
      { code: 'DIEUCHINH', name: 'Điều chỉnh', action: 'Thêm mới', by: 'Phạm Thu Hà', at: '2026-08-06 11:02', note: 'Phục vụ nghiệp vụ điều chỉnh sai sót' },
      { code: 'PHI', name: 'Thu phí', action: 'Cập nhật', by: 'Phạm Thu Hà', at: '2026-08-06 11:05', note: 'Đổi nhóm sang Giảm số dư' },
    ],
  },
  {
    id: 'DM-012', name: 'Danh mục trung tâm chi phí', description: 'Mã trung tâm chi phí dùng cho hạch toán',
    recordCount: 128, version: 'v9', owner: 'Phạm Thu Hà', approval: 'Đã phê duyệt',
    pendingCount: 0, usedByRules: 4, updatedAt: '2026-06-28',
    fields: [
      { name: 'ma_ttcp', type: 'string', required: true, key: true },
      { name: 'ten_ttcp', type: 'string', required: true, key: false },
      { name: 'don_vi_cha', type: 'string', required: false, key: false },
    ],
    records: [
      { ma_ttcp: 'CC001', ten_ttcp: 'Khối Kinh doanh', don_vi_cha: '—' },
      { ma_ttcp: 'CC002', ten_ttcp: 'Khối Công nghệ', don_vi_cha: '—' },
      { ma_ttcp: 'CC101', ten_ttcp: 'Phòng Phân tích Dữ liệu', don_vi_cha: 'CC002' },
    ],
    versions: [{ version: 'v9', date: '2026-06-28', by: 'Phạm Thu Hà', note: 'Tái cấu trúc phòng ban', added: 6, removed: 2, changed: 18 }],
    pending: [],
  },
]

/* ═══════════════ 1.4 Kênh trao đổi dữ liệu ═══════════════ */

export const channels: ChannelRow[] = [
  {
    id: 'KENH-01', name: 'SFTP nhận file đối soát đối tác A', purpose: 'Nhận file đối soát giao dịch hằng ngày từ đối tác A',
    kind: 'SFTP', direction: 'Nhận về', fromSystem: 'HT-09', toSystem: 'HT-04',
    payload: 'File CSV đối soát giao dịch (18 cột)', format: 'CSV', frequency: 'Hằng ngày 05:30',
    auth: 'SSH key + IP allowlist', owner: 'Trần Văn Hùng', confidentiality: 'Mật',
    status: 'Đang hoạt động', approval: 'Đã phê duyệt', linkedTables: ['raw.doi_soat_A_tho'],
    volumeDay: '~12,5 triệu dòng · 4,2 GB', updatedAt: '2026-07-30',
  },
  {
    id: 'KENH-02', name: 'Kafka sự kiện giao dịch', purpose: 'Truyền sự kiện giao dịch thời gian thực sang kho dữ liệu',
    kind: 'Kafka', direction: 'Nhận về', fromSystem: 'HT-02', toSystem: 'HT-04',
    payload: 'Topic txn.events — bản ghi Avro', format: 'Avro', frequency: 'Thời gian thực',
    auth: 'SASL/SCRAM + TLS', owner: 'Đỗ Quang Vinh', confidentiality: 'Mật',
    status: 'Đang hoạt động', approval: 'Chờ phê duyệt', linkedTables: ['raw.giao_dich_kafka'],
    volumeDay: '~2,6 triệu sự kiện/giờ', updatedAt: '2026-08-07',
  },
  {
    id: 'KENH-03', name: 'API cung cấp hồ sơ khách hàng', purpose: 'Cho phép hệ thống rủi ro tra cứu hồ sơ khách hàng',
    kind: 'API', direction: 'Gửi đi', fromSystem: 'HT-01', toSystem: 'HT-08',
    payload: 'GET /customers/{id} — 14 trường, có 4 trường nhạy cảm', format: 'JSON', frequency: 'Theo yêu cầu (~48k lượt/ngày)',
    auth: 'OAuth2 client credentials', owner: 'Trần Văn Hùng', confidentiality: 'Hạn chế truy cập',
    status: 'Đang hoạt động', approval: 'Đã phê duyệt', linkedTables: ['crm.khach_hang'],
    volumeDay: '48.204 lượt gọi', updatedAt: '2026-06-12',
  },
  {
    id: 'KENH-04', name: 'Gửi bút toán sang hệ thống kế toán', purpose: 'Đẩy bút toán đối soát sang sổ cái kế toán',
    kind: 'API', direction: 'Gửi đi', fromSystem: 'HT-03', toSystem: 'HT-05',
    payload: 'POST /journal-entries — lô 5.000 bút toán', format: 'JSON', frequency: 'Hằng ngày 08:30',
    auth: 'mTLS + chữ ký HMAC', owner: 'Đỗ Quang Vinh', confidentiality: 'Mật',
    status: 'Đang hoạt động', approval: 'Đã phê duyệt', linkedTables: ['fin.so_cai_doi_soat'],
    volumeDay: '~24.000 bút toán', updatedAt: '2026-07-08',
  },
  {
    id: 'KENH-05', name: 'FTP gửi báo cáo cho đối tác B', purpose: 'Gửi báo cáo doanh số định kỳ cho đối tác B',
    kind: 'FTP', direction: 'Gửi đi', fromSystem: 'HT-03', toSystem: 'HT-09',
    payload: 'File Excel doanh số theo tuần', format: 'CSV', frequency: 'Thứ hai hằng tuần',
    auth: 'FTP user/password — chưa mã hoá', owner: 'Lê Minh Tuấn', confidentiality: 'Nội bộ',
    status: 'Đang hoạt động', approval: 'Yêu cầu chỉnh sửa', linkedTables: ['mart.doanh_thu_ngay'],
    volumeDay: '~1 file/tuần · 8 MB', updatedAt: '2026-08-05',
  },
  {
    id: 'KENH-06', name: 'Webhook cảnh báo chất lượng', purpose: 'Đẩy cảnh báo chất lượng sang hệ thống quản lý công việc',
    kind: 'Webhook', direction: 'Gửi đi', fromSystem: 'HT-03', toSystem: 'HT-06',
    payload: 'Sự kiện cảnh báo — mã sự cố, bảng, luật, mức độ', format: 'JSON', frequency: 'Theo sự kiện',
    auth: 'Bearer token', owner: 'Nguyễn Thị Phương', confidentiality: 'Nội bộ',
    status: 'Đang hoạt động', approval: 'Đã phê duyệt', linkedTables: [],
    volumeDay: '~180 sự kiện/ngày', updatedAt: '2026-08-01',
  },
  {
    id: 'KENH-07', name: 'Đồng bộ danh mục sản phẩm', purpose: 'Đồng bộ hai chiều danh mục sản phẩm giữa CRM và kho dữ liệu',
    kind: 'API', direction: 'Hai chiều', fromSystem: 'HT-01', toSystem: 'HT-03',
    payload: 'Danh mục sản phẩm — 9 trường', format: 'JSON', frequency: 'Mỗi 4 giờ',
    auth: 'API key', owner: 'Lê Minh Tuấn', confidentiality: 'Công khai',
    status: 'Tạm dừng', approval: 'Đã phê duyệt', linkedTables: ['dwh.san_pham'],
    volumeDay: '~1.284 bản ghi', updatedAt: '2026-04-22',
  },
  {
    id: 'KENH-08', name: 'File share dữ liệu kế toán tháng', purpose: 'Ban Tài chính tải file kế toán lên thư mục dùng chung',
    kind: 'File Share', direction: 'Nhận về', fromSystem: 'HT-05', toSystem: 'HT-04',
    payload: 'File Excel hạch toán tháng', format: 'CSV', frequency: 'Hằng tháng, ngày 05',
    auth: 'Tài khoản miền (AD)', owner: 'Phạm Thu Hà', confidentiality: 'Mật',
    status: 'Đang hoạt động', approval: 'Dự thảo', linkedTables: ['raw.file_ke_toan_thang'],
    volumeDay: '~84.000 dòng/tháng', updatedAt: '2026-08-03',
  },
]

/* ═══════════════ 1.5 Chỉ tiêu ═══════════════ */

export const metrics: MetricRow[] = [
  {
    id: 'CT-001', name: 'Doanh thu ghi nhận', unit: 'VND',
    definition: 'Tổng số tiền doanh thu được ghi nhận trong kỳ theo nguyên tắc kế toán dồn tích',
    formula: 'SUM(mart.doanh_thu_ngay.doanh_thu) WHERE ngay BETWEEN :tu AND :den',
    glossaryId: 'TN-0042', reportIds: ['BC-001', 'BC-002', 'BC-006'],
    sourceTables: ['mart.doanh_thu_ngay', 'dwh.giao_dich_thanh_toan'],
    aggregation: 'Tổng theo ngày → tháng → quý', filterRule: 'Loại trừ giao dịch hoàn tiền và điều chỉnh',
    owner: 'Phạm Thu Hà', approval: 'Đã phê duyệt', qualityScore: 92, ruleCount: 3, traceable: true,
  },
  {
    id: 'CT-002', name: 'Tỷ lệ đối soát khớp', unit: '%',
    definition: 'Tỷ lệ giao dịch khớp giữa hệ thống nội bộ và đối tác trên tổng giao dịch đối soát',
    formula: "COUNT(trang_thai='KHOP') / COUNT(*) × 100",
    glossaryId: 'TN-0055', reportIds: ['BC-004', 'BC-007'],
    sourceTables: ['bi.doi_soat_giao_dich_A'],
    aggregation: 'Trung bình có trọng số theo ngày', filterRule: 'Chỉ tính giao dịch đã hoàn tất',
    owner: 'Nguyễn Thị Phương', approval: 'Đã phê duyệt', qualityScore: 88, ruleCount: 2, traceable: true,
  },
  {
    id: 'CT-003', name: 'Số khách hàng hoạt động', unit: 'khách hàng',
    definition: 'Số khách hàng có ít nhất một giao dịch trong 12 tháng gần nhất',
    formula: 'COUNT(DISTINCT ma_khach_hang) WHERE ngay_giao_dich >= ADD_MONTHS(:den, -12)',
    glossaryId: 'TN-0002', reportIds: ['BC-005', 'BC-012'],
    sourceTables: ['dwh.giao_dich_thanh_toan', 'crm.khach_hang'],
    aggregation: 'Đếm phân biệt', filterRule: 'Loại trừ tài khoản nội bộ và tài khoản thử nghiệm',
    owner: 'Phạm Thu Hà', approval: 'Đã phê duyệt', qualityScore: 79, ruleCount: 2, traceable: true,
  },
  {
    id: 'CT-004', name: 'Giá trị chênh lệch đối soát', unit: 'VND',
    definition: 'Tổng giá trị tuyệt đối chênh lệch giữa số liệu nội bộ và đối tác',
    formula: 'SUM(ABS(chenh_lech))',
    glossaryId: 'TN-0055', reportIds: ['BC-004'],
    sourceTables: ['bi.doi_soat_giao_dich_A'],
    aggregation: 'Tổng theo ngày', filterRule: "Chỉ tính trang_thai='LECH'",
    owner: 'Nguyễn Thị Phương', approval: 'Đã phê duyệt', qualityScore: 86, ruleCount: 1, traceable: true,
  },
  {
    id: 'CT-005', name: 'Chi phí trên doanh thu', unit: '%',
    definition: 'Tỷ lệ chi phí vận hành so với doanh thu ghi nhận trong kỳ',
    formula: 'SUM(fin.chi_phi_van_hanh.chi_phi) / SUM(mart.doanh_thu_ngay.doanh_thu) × 100',
    glossaryId: null, reportIds: ['BC-008'],
    sourceTables: ['fin.chi_phi_van_hanh', 'mart.doanh_thu_ngay'],
    aggregation: 'Tỷ lệ theo tháng', filterRule: 'Chi phí đã phân bổ về trung tâm chi phí',
    owner: 'Phạm Thu Hà', approval: 'Chờ phê duyệt', qualityScore: null, ruleCount: 0, traceable: true,
  },
  {
    id: 'CT-006', name: 'Tỷ lệ khách hàng rủi ro cao', unit: '%',
    definition: 'Tỷ lệ khách hàng có điểm rủi ro AML từ 70 trở lên',
    formula: 'COUNT(diem_rui_ro >= 70) / COUNT(*) × 100',
    glossaryId: null, reportIds: ['BC-010'],
    sourceTables: ['rr.diem_rui_ro_kh'],
    aggregation: 'Tỷ lệ theo tháng', filterRule: 'Chỉ khách hàng đang hoạt động',
    owner: 'Đỗ Quang Vinh', approval: 'Dự thảo', qualityScore: 58, ruleCount: 1, traceable: false,
  },
  {
    id: 'CT-007', name: 'Doanh số theo kênh', unit: 'VND',
    definition: 'Doanh số phân bổ theo từng kênh bán hàng',
    formula: 'SUM(doanh_thu) GROUP BY ma_kenh',
    glossaryId: 'TN-0042', reportIds: ['BC-002', 'BC-006'],
    sourceTables: ['mart.doanh_thu_ngay', 'dwh.kenh_ban_hang'],
    aggregation: 'Tổng theo kênh, theo tháng', filterRule: 'Chỉ kênh đang hoạt động',
    owner: 'Nguyễn Thị Phương', approval: 'Đã phê duyệt', qualityScore: 90, ruleCount: 2, traceable: true,
  },
  {
    id: 'CT-008', name: 'Số giao dịch chậm đối soát', unit: 'giao dịch',
    definition: 'Số giao dịch chưa được đối soát sau 24 giờ kể từ khi phát sinh',
    formula: "COUNT(*) WHERE trang_thai IN ('THIEU_NOI_BO','THIEU_DOI_TAC') AND tuoi_gio > 24",
    glossaryId: null, reportIds: ['BC-007', 'BC-011'],
    sourceTables: ['bi.doi_soat_giao_dich_A'],
    aggregation: 'Đếm theo ngày', filterRule: 'Không tính giao dịch đã huỷ',
    owner: 'Nguyễn Thị Phương', approval: 'Đã phê duyệt', qualityScore: 84, ruleCount: 1, traceable: true,
  },
]

/* ═══════════════ 1.5 Báo cáo ═══════════════ */

export const reports: ReportRow[] = [
  {
    id: 'BC-001', name: 'Báo cáo doanh thu ngày', description: 'Doanh thu toàn công ty theo ngày, kênh và sản phẩm',
    purpose: 'Theo dõi kết quả kinh doanh hằng ngày phục vụ điều hành',
    ownerUnit: 'Ban Kinh doanh', owner: 'Phạm Thu Hà', bda: 'Nguyễn Thị Phương',
    tool: 'Power BI', output: 'Màn hình', frequency: 'Hằng ngày', readyBy: 'Trước 08:00',
    audience: ['Ban Điều hành', 'Ban Kinh doanh', 'Ban Tài chính'],
    metricIds: ['CT-001', 'CT-007'], sourceTables: ['mart.doanh_thu_ngay', 'dwh.giao_dich_thanh_toan', 'bi.doi_soat_giao_dich_A'],
    backingTables: ['mart.doanh_thu_ngay'],
    confidentiality: 'Mật', approval: 'Đã phê duyệt', lifecycle: 'Đang dùng', traceable: true,
    qualityScore: 91, viewsMonth: 4218, updatedAt: '2026-08-06',
  },
  {
    id: 'BC-002', name: 'Báo cáo doanh số theo kênh', description: 'Doanh số và tăng trưởng theo từng kênh bán hàng',
    purpose: 'Đánh giá hiệu quả từng kênh phân phối',
    ownerUnit: 'Ban Kinh doanh', owner: 'Nguyễn Thị Phương', bda: 'Nguyễn Thị Phương',
    tool: 'Power BI', output: 'Màn hình', frequency: 'Hằng tuần', readyBy: 'Thứ hai trước 10:00',
    audience: ['Ban Kinh doanh', 'Giám đốc kênh'],
    metricIds: ['CT-007', 'CT-001'], sourceTables: ['mart.doanh_thu_ngay', 'dwh.kenh_ban_hang', 'bi.doi_soat_giao_dich_A'],
    backingTables: ['mart.doanh_thu_ngay'],
    confidentiality: 'Nội bộ', approval: 'Đã phê duyệt', lifecycle: 'Đang dùng', traceable: true,
    qualityScore: 88, viewsMonth: 1284, updatedAt: '2026-07-29',
  },
  {
    id: 'BC-004', name: 'Báo cáo đối soát đối tác', description: 'Kết quả đối soát giao dịch với từng đối tác',
    purpose: 'Phát hiện chênh lệch và xử lý tranh chấp với đối tác',
    ownerUnit: 'Trung tâm Vận hành', owner: 'Phạm Thu Hà', bda: 'Nguyễn Thị Phương',
    tool: 'SQLWF Dashboard', output: 'Bảng dữ liệu', frequency: 'Hằng ngày', readyBy: 'Trước 09:00',
    audience: ['Trung tâm Vận hành', 'Ban Tài chính', 'Đối tác'],
    metricIds: ['CT-002', 'CT-004'], sourceTables: ['bi.doi_soat_giao_dich_A', 'fin.so_cai_doi_soat'],
    backingTables: ['bi.doi_soat_giao_dich_A'],
    confidentiality: 'Mật', approval: 'Đã phê duyệt', lifecycle: 'Đang dùng', traceable: true,
    qualityScore: 92, viewsMonth: 862, updatedAt: '2026-08-08',
  },
  {
    id: 'BC-005', name: 'Báo cáo khách hàng hoạt động', description: 'Quy mô và biến động tệp khách hàng hoạt động',
    purpose: 'Theo dõi tăng trưởng khách hàng',
    ownerUnit: 'Ban Kinh doanh', owner: 'Phạm Thu Hà', bda: 'Phạm Thu Hà',
    tool: 'Power BI', output: 'Màn hình', frequency: 'Hằng tháng', readyBy: 'Ngày 03 hằng tháng',
    audience: ['Ban Điều hành', 'Ban Kinh doanh'],
    metricIds: ['CT-003'], sourceTables: ['crm.khach_hang', 'crm.hop_dong', 'dwh.giao_dich_thanh_toan'],
    backingTables: [],
    confidentiality: 'Mật', approval: 'Đã phê duyệt', lifecycle: 'Đang dùng', traceable: true,
    qualityScore: 76, viewsMonth: 418, updatedAt: '2026-08-03',
  },
  {
    id: 'BC-006', name: 'Báo cáo hiệu quả sản phẩm', description: 'Doanh thu và số giao dịch theo từng sản phẩm',
    purpose: 'Đánh giá sản phẩm nào đang tạo ra giá trị',
    ownerUnit: 'Ban Sản phẩm', owner: 'Lê Minh Tuấn', bda: 'Lê Minh Tuấn',
    tool: 'Superset', output: 'Màn hình', frequency: 'Hằng tuần', readyBy: 'Thứ ba trước 09:00',
    audience: ['Ban Sản phẩm'],
    metricIds: ['CT-001', 'CT-007'], sourceTables: ['mart.doanh_thu_ngay', 'dwh.san_pham'],
    backingTables: ['mart.doanh_thu_ngay'],
    confidentiality: 'Nội bộ', approval: 'Chờ phê duyệt', lifecycle: 'Đang dùng', traceable: true,
    qualityScore: 84, viewsMonth: 286, updatedAt: '2026-08-04',
  },
  {
    id: 'BC-007', name: 'Báo cáo đối soát tháng', description: 'Tổng hợp kết quả đối soát theo tháng',
    purpose: 'Báo cáo quản trị định kỳ cho lãnh đạo',
    ownerUnit: 'Trung tâm Vận hành', owner: 'Phạm Thu Hà', bda: 'Nguyễn Thị Phương',
    tool: 'Excel', output: 'File', frequency: 'Hằng tháng', readyBy: 'Ngày 05 hằng tháng',
    audience: ['Ban Điều hành'],
    metricIds: ['CT-002', 'CT-008'], sourceTables: ['mart.doi_soat_thang', 'bi.doi_soat_giao_dich_A'],
    backingTables: ['mart.doi_soat_thang'],
    confidentiality: 'Mật', approval: 'Đã phê duyệt', lifecycle: 'Đang dùng', traceable: true,
    qualityScore: 85, viewsMonth: 124, updatedAt: '2026-08-05',
  },
  {
    id: 'BC-008', name: 'Báo cáo chi phí vận hành', description: 'Chi phí vận hành theo trung tâm chi phí',
    purpose: 'Kiểm soát chi phí và so sánh với kế hoạch',
    ownerUnit: 'Ban Tài chính', owner: 'Phạm Thu Hà', bda: 'Phạm Thu Hà',
    tool: 'Excel', output: 'File', frequency: 'Hằng tháng', readyBy: 'Ngày 08 hằng tháng',
    audience: ['Ban Tài chính', 'Ban Điều hành'],
    metricIds: ['CT-005'], sourceTables: ['fin.chi_phi_van_hanh', 'fin.so_cai_doi_soat'],
    backingTables: ['fin.chi_phi_van_hanh'],
    confidentiality: 'Mật', approval: 'Đã phê duyệt', lifecycle: 'Đang dùng', traceable: true,
    qualityScore: 87, viewsMonth: 96, updatedAt: '2026-07-31',
  },
  {
    id: 'BC-010', name: 'Báo cáo rủi ro khách hàng', description: 'Phân bố điểm rủi ro AML của tệp khách hàng',
    purpose: 'Báo cáo tuân thủ phòng chống rửa tiền',
    ownerUnit: 'Ban Quản lý Rủi ro', owner: 'Đỗ Quang Vinh', bda: 'Đỗ Quang Vinh',
    tool: 'SQLWF Dashboard', output: 'Bảng dữ liệu', frequency: 'Hằng tháng', readyBy: 'Ngày 10 hằng tháng',
    audience: ['Ban Quản lý Rủi ro', 'Cơ quan quản lý'],
    metricIds: ['CT-006'], sourceTables: ['rr.diem_rui_ro_kh'],
    backingTables: ['rr.diem_rui_ro_kh'],
    confidentiality: 'Hạn chế truy cập', approval: 'Yêu cầu chỉnh sửa', lifecycle: 'Đang dùng', traceable: false,
    qualityScore: 58, viewsMonth: 42, updatedAt: '2026-07-12',
  },
  {
    id: 'BC-011', name: 'Bảng theo dõi giao dịch chậm', description: 'Danh sách giao dịch chưa đối soát quá hạn',
    purpose: 'Điều hành xử lý giao dịch tồn đọng trong ngày',
    ownerUnit: 'Trung tâm Vận hành', owner: 'Nguyễn Thị Phương', bda: 'Nguyễn Thị Phương',
    tool: 'SQLWF Dashboard', output: 'Bảng dữ liệu', frequency: 'Mỗi giờ', readyBy: 'Liên tục',
    audience: ['Trung tâm Vận hành'],
    metricIds: ['CT-008'], sourceTables: ['bi.doi_soat_giao_dich_A'],
    backingTables: ['bi.doi_soat_giao_dich_A'],
    confidentiality: 'Nội bộ', approval: 'Đã phê duyệt', lifecycle: 'Đang dùng', traceable: true,
    qualityScore: 89, viewsMonth: 1842, updatedAt: '2026-08-07',
  },
  {
    id: 'BC-012', name: 'Báo cáo phân khúc khách hàng', description: 'Cơ cấu tệp khách hàng theo phân khúc giá trị',
    purpose: 'Định hướng chương trình chăm sóc theo phân khúc',
    ownerUnit: 'Ban Kinh doanh', owner: 'Lê Minh Tuấn', bda: 'Lê Minh Tuấn',
    tool: 'Power BI', output: 'Màn hình', frequency: 'Hằng tháng', readyBy: 'Ngày 05 hằng tháng',
    audience: ['Ban Kinh doanh', 'Ban Sản phẩm'],
    metricIds: ['CT-003'], sourceTables: ['mart.phan_khuc_kh', 'crm.khach_hang'],
    backingTables: ['mart.phan_khuc_kh'],
    confidentiality: 'Mật', approval: 'Đã phê duyệt', lifecycle: 'Đang dùng', traceable: true,
    qualityScore: 74, viewsMonth: 318, updatedAt: '2026-08-02',
  },
  {
    id: 'BC-016', name: 'Báo cáo đối soát nội bộ (cũ)', description: 'Báo cáo đối soát phiên bản cũ, đang chuyển sang BC-004',
    purpose: 'Duy trì song song trong giai đoạn chuyển đổi',
    ownerUnit: 'Trung tâm Vận hành', owner: 'Phạm Thu Hà', bda: 'Nguyễn Thị Phương',
    tool: 'Excel', output: 'File', frequency: 'Hằng ngày', readyBy: 'Trước 10:00',
    audience: ['Trung tâm Vận hành'],
    metricIds: ['CT-002'], sourceTables: ['bi.doi_soat_giao_dich_A'],
    backingTables: [],
    confidentiality: 'Nội bộ', approval: 'Đã phê duyệt', lifecycle: 'Sắp ngừng', traceable: true,
    qualityScore: 82, viewsMonth: 38, updatedAt: '2026-06-18',
  },
]

export const reportById = (id: string) => reports.find(r => r.id === id)

/** Báo cáo nào đọc trực tiếp bảng này làm bảng kết quả đầu ra */
export const reportsBackedBy = (tableId: string) => reports.filter(r => r.backingTables.includes(tableId))

/** Báo cáo nào dùng bảng này để tính toán (bảng nguồn) */
export const reportsUsing = (tableId: string) => reports.filter(r => r.sourceTables.includes(tableId))
export const metricById = (id: string) => metrics.find(m => m.id === id)
export const systemById = (id: string) => systems.find(s => s.id === id)
export const domainById = (id: string) => domains.find(d => d.id === id)
export const domainName = (id: string | null) => (id ? domains.find(d => d.id === id)?.name ?? id : null)
