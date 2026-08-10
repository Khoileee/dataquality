/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DANH SÁCH GIÁ TRỊ CHỌN — mỗi danh sách phải chỉ ra được NGUỒN QUẢN LÝ
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Nguyên tắc: KHÔNG viết thẳng mảng giá trị trong màn hình.
 * Mọi ô chọn trên giao diện phải lấy từ đây, và mỗi danh sách phải trả lời được:
 *   — Ai quản lý danh sách này?
 *   — Thêm giá trị mới thì làm ở đâu?
 *
 * Ba loại nguồn:
 *   ① Danh mục quản lý được  → người dùng thêm/sửa được ở một menu cụ thể
 *   ② Hằng số nghiệp vụ      → cố định theo yêu cầu BDA hoặc quy định pháp lý, sửa phải đổi cấu hình
 *   ③ Suy ra từ dữ liệu khác → sinh động từ bản ghi đã có trong hệ thống
 */

import { users } from './security'
import { domains, systems, tables, refdata } from './catalog'
import { tags } from './governance'
import { ruleTypes } from './quality'

export type EnumSource = {
  /** Danh sách này do đâu quản lý */
  managedBy: string
  /** Đường dẫn tới nơi quản lý, nếu quản lý được */
  route?: string
  /** Loại nguồn */
  kind: 'catalog' | 'const' | 'derived'
}

const S = (kind: EnumSource['kind'], managedBy: string, route?: string): EnumSource => ({ kind, managedBy, route })

/* ═════════ ① DANH MỤC QUẢN LÝ ĐƯỢC ═════════ */

/** Đơn vị tổ chức — lấy từ mô hình dữ liệu chủ Đơn vị, đồng bộ từ hệ thống nhân sự */
export const ORG_UNITS = [
  'Ban Điều hành',
  'Ban Kinh doanh',
  'Ban Tài chính',
  'Ban Sản phẩm',
  'Ban Quản lý Rủi ro',
  'Ban Pháp chế',
  'Trung tâm Vận hành',
  'Trung tâm Hạ tầng',
  'Đội Dữ liệu',
  'Phòng Phân tích Dữ liệu',
]
export const ORG_UNITS_SRC = S('catalog', 'Mô hình dữ liệu chủ MDM-DV — Đơn vị tổ chức, đồng bộ từ hệ thống nhân sự', '/mdm/models/MDM-DV')

/** Miền dữ liệu — suy từ danh mục miền */
export const DOMAIN_OPTIONS = () => domains.map(d => ({ value: d.id, label: `${d.parentId ? '  ↳ ' : ''}${d.name}` }))
export const DOMAIN_SRC = S('catalog', 'Danh mục miền dữ liệu — menu 1.4', '/catalog/domains')

/** Hệ thống nguồn — suy từ danh mục hệ thống, chỉ lấy hệ thống đang dùng */
export const SYSTEM_OPTIONS = (onlyActive = true) =>
  systems.filter(s => !onlyActive || s.status === 'Đang sử dụng').map(s => ({ value: s.id, label: `${s.id} — ${s.name}` }))
export const SYSTEM_SRC = S('catalog', 'Danh mục hệ thống & nguồn dữ liệu — menu 1.2', '/catalog/systems')

/** Bảng dữ liệu — suy từ danh mục bảng (ràng buộc RB2) */
export const TABLE_OPTIONS = () => tables.map(t => ({ value: t.id, label: t.id }))
export const TABLE_SRC = S('catalog', 'Danh mục bảng dữ liệu — menu 1.1 · ràng buộc RB2 chỉ chọn được bảng đã khai', '/catalog/tables')

/** Nhãn dữ liệu nhạy cảm — suy từ cây nhãn */
export const TAG_OPTIONS = () => tags.filter(t => t.id !== 'DATA_GENERAL').map(t => ({ value: t.id, label: `${t.id} — ${t.name} (${t.columnCount} cột)` }))
export const TAG_SRC = S('catalog', 'Cây nhãn phân loại — menu 2.2', '/governance/classification')

/** Danh mục tham chiếu — dùng làm tập giá trị cho luật chất lượng */
export const REFDATA_OPTIONS = () => refdata.map(r => ({ value: r.id, label: `${r.id} — ${r.name} (${r.recordCount} bản ghi)` }))
export const REFDATA_SRC = S('catalog', 'Danh mục tham chiếu — menu 1.5', '/catalog/refdata')

/** Loại kiểm tra chất lượng — suy từ thư viện luật */
export const RULE_TYPE_OPTIONS = () => ruleTypes.map(r => ({ value: r.id, label: `${r.name} (${r.code})`, dimension: r.dimension }))
export const RULE_TYPE_SRC = S('catalog', 'Thư viện luật — menu 3.1', '/quality/rules')

/** Người dùng theo vai trò — suy từ danh sách người dùng, chỉ lấy người đang làm việc */
export const usersByRole = (role?: string) =>
  users.filter(u => u.employed && u.status === 'Hoạt động' && (!role || u.role === role))
    .map(u => ({ value: u.name, label: `${u.name} — ${u.unit}` }))
export const USER_SRC = S('catalog', 'Danh sách người dùng — menu 5.1, đồng bộ từ hệ thống quản lý người dùng tập trung', '/security/users')

/** Từ điển thuật ngữ — chỉ thuật ngữ đã phê duyệt mới gắn được */
export const GLOSSARY_SRC = S('catalog', 'Từ điển nghiệp vụ — menu 2.1, chỉ thuật ngữ Đã phê duyệt', '/governance/glossary')

/* ═════════ ② HẰNG SỐ NGHIỆP VỤ ═════════ */

/** 5 vai trò — GĐ1 mục 2.3 */
export const ROLE_NAMES = [
  'Người sở hữu dữ liệu',
  'Đầu mối nghiệp vụ',
  'Đầu mối kỹ thuật',
  'Đơn vị vận hành hệ thống',
  'Người sử dụng dữ liệu',
]
export const ROLE_SRC = S('const', 'Mô hình vai trò và trách nhiệm — kết quả đầu ra của Giai đoạn 1 mục 2.3')

/** 4 mức phân loại — GĐ4 mục 3 */
export const CONFIDENTIALITY_NAMES = ['Công khai', 'Nội bộ', 'Mật', 'Hạn chế truy cập']
export const CONFIDENTIALITY_SRC = S('const', 'Bốn mức phân loại theo GĐ4 mục 3 — quy tắc mặc định của từng mức khai tại menu 2.2', '/governance/classification')

/** Loại hệ thống — theo vai trò trong kiến trúc dữ liệu */
export const SYSTEM_KINDS = ['Cơ sở dữ liệu', 'Kho dữ liệu', 'Vùng dữ liệu thô', 'Ứng dụng nghiệp vụ', 'Công cụ BI', 'Hàng đợi']
export const SYSTEM_KIND_SRC = S('const', 'Sáu loại cố định theo kiến trúc dữ liệu của tổ chức')

export const ENVIRONMENTS = ['Production', 'Test', 'UAT']
export const ENV_SRC = S('const', 'Ba môi trường vận hành theo quy định của Trung tâm Hạ tầng')

export const SYSTEM_STATUS = ['Đang sử dụng', 'Đã ngừng sử dụng']
export const SYSTEM_STATUS_SRC = S('const', 'Hai trạng thái sử dụng của hệ thống')

/** Vùng lưu trữ — tiền tố bắt buộc trong tên bảng, kiểm theo chuẩn CT-02 */
export const STORAGE_ZONES = ['raw', 'dwh', 'mart', 'bi', 'fin', 'crm', 'ops', 'ref']
export const ZONE_SRC = S('const', 'Tám vùng lưu trữ, khớp chuẩn đặt tên CT-02 khai tại menu 8.2', '/operations/settings')

export const TABLE_FORMATS = ['Iceberg', 'Hudi', 'Parquet', 'ORC']
export const FORMAT_SRC = S('const', 'Bốn định dạng lưu trữ đang dùng trong hạ tầng — thu thập tự động, không khai tay')

export const SYNC_FREQUENCIES = ['Thời gian thực', 'Mỗi giờ', 'Hằng ngày', 'Hằng tuần', 'Hằng tháng', 'Khi thay đổi', 'Không cập nhật']
export const SYNC_SRC = S('const', 'Bảy chu kỳ cập nhật chuẩn — là tham số của luật Độ tươi dữ liệu ở menu 3.2', '/quality/board')

export const LIFECYCLE_STATES = ['Nháp', 'Đang dùng', 'Sắp ngừng', 'Đã ngừng']
export const LIFECYCLE_SRC = S('const', 'Bốn trạng thái vòng đời sử dụng của đối tượng dữ liệu')

export const APPROVAL_STATES = ['Dự thảo', 'Chờ phê duyệt', 'Yêu cầu chỉnh sửa', 'Đã phê duyệt', 'Ngừng sử dụng']
export const APPROVAL_SRC = S('const', 'Năm trạng thái phê duyệt theo GĐ2 mục 8.1 — quy trình chung cho mọi metadata', '/governance/approvals')

export const SEVERITIES = ['Nghiêm trọng', 'Cao', 'Trung bình', 'Thấp']
export const SEVERITY_SRC = S('const', 'Bốn mức độ nghiêm trọng — quyết định cách cảnh báo và hạn xử lý ở menu 8.2', '/operations/settings')

export const CHANNEL_KINDS = ['API', 'Kafka', 'SFTP', 'FTP', 'File Share', 'Webhook']
export const CHANNEL_KIND_SRC = S('const', 'Sáu phương thức trao đổi dữ liệu đang dùng giữa các hệ thống')

export const CHANNEL_DIRECTIONS = ['Nhận về', 'Gửi đi', 'Hai chiều']
export const CHANNEL_DIR_SRC = S('const', 'Ba chiều dữ liệu — chiều Gửi đi bị kiểm mức phân loại trước khi xuất', '/security/policies/download')

export const DATA_FORMATS = ['JSON', 'Avro', 'CSV', 'XML', 'Parquet', 'Excel']
export const DATA_FORMAT_SRC = S('const', 'Sáu định dạng dữ liệu trao đổi được hỗ trợ')

export const BI_TOOLS = ['Power BI', 'Excel', 'SQLWF Dashboard', 'Superset']
export const BI_TOOL_SRC = S('const', 'Bốn công cụ dựng báo cáo đang dùng trong tổ chức — khai tại menu 1.2 dưới dạng hệ thống loại Công cụ BI', '/catalog/systems')

export const REPORT_OUTPUTS = ['Màn hình', 'Bảng dữ liệu', 'File']
export const REPORT_OUTPUT_SRC = S('const', 'Ba hình thức đầu ra theo GĐ2 mục 5.5')

export const REPORT_FREQUENCIES = ['Mỗi giờ', 'Hằng ngày', 'Hằng tuần', 'Hằng tháng', 'Hằng quý']
export const REPORT_FREQ_SRC = S('const', 'Năm tần suất phát hành báo cáo')

export const ACCESS_PURPOSES = ['Phân tích nghiệp vụ', 'Lập báo cáo định kỳ', 'Tuân thủ pháp lý', 'Xử lý sự cố', 'Nghiên cứu', 'Kiểm toán']
export const PURPOSE_SRC = S('const', 'Sáu mục đích sử dụng dữ liệu được chấp nhận theo chính sách CSDL-04', '/compliance/policies/CSDL-04')

export const GRANT_DURATIONS = ['1 tháng', '3 tháng', '6 tháng', '12 tháng']
export const DURATION_SRC = S('const', 'Bốn mốc thời hạn — giới hạn tối đa theo mức phân loại, khai tại menu 8.2. Không có lựa chọn Vô thời hạn', '/operations/settings')

export const RIGHT_KINDS = ['Đọc', 'Đọc không che', 'Đọc · Ghi']
export const RIGHT_SRC = S('const', 'Ba loại quyền trên dữ liệu — quyền menu khai riêng tại menu 5.1', '/security/users')

export const RULE_TRIGGERS = ['Theo lịch', 'Theo sự kiện', 'Thủ công']
export const TRIGGER_SRC = S('const', 'Ba cách kích hoạt kiểm tra theo GĐ3 · FR-02')

export const RULE_SCHEDULES = ['Mỗi giờ', 'Hằng ngày 02:00', 'Hằng ngày 07:15', 'Thứ hai hằng tuần', 'Ngày 01 hằng tháng']
export const RULE_SCHEDULE_SRC = S('const', 'Năm khung giờ quét chuẩn — đặt lệch nhau để không dồn tải lên cụm xử lý')

export const GATE_MODES = ['Chặn cả lô', 'Tách dòng lỗi', 'Chỉ cảnh báo']
export const GATE_MODE_SRC = S('const', 'Ba mức xử lý của cổng chất lượng tại cửa nạp')

export const INGEST_KINDS = ['SFTP đối tác', 'Tải file thủ công', 'Đồng bộ CSDL', 'Kafka', 'API', 'Di trú dữ liệu']
export const INGEST_KIND_SRC = S('const', 'Sáu loại cửa nạp — gộp từ 6 màn nạp dữ liệu rời rạc của SQLWF')

export const JOB_GROUPS = ['Đối soát', 'Giao dịch', 'Kinh doanh', 'Khách hàng', 'Tài chính', 'Rủi ro', 'Vận hành']
export const JOB_GROUP_SRC = S('const', 'Bảy nhóm job theo miền nghiệp vụ — khớp với danh mục miền dữ liệu ở menu 1.4', '/catalog/domains')

export const POLICY_CATEGORIES = ['Quản trị', 'Chất lượng', 'Bảo mật', 'Cấp quyền', 'Chia sẻ', 'Lưu trữ']
export const POLICY_CAT_SRC = S('const', 'Sáu nhóm chính sách theo Phương án xây dựng hệ thống mục 5')

export const MDM_ENTITIES = ['Khách hàng', 'Sản phẩm/Dịch vụ', 'Đơn vị/Tổ chức', 'Danh mục dùng chung']
export const MDM_ENTITY_SRC = S('const', 'Bốn loại dữ liệu chủ ưu tiên theo GĐ5 mục 3')

export const LINEAGE_LEVELS = ['Hệ thống', 'Bảng', 'Cột', 'Nghiệp vụ']
export const LINEAGE_LEVEL_SRC = S('const', 'Bốn mức truy vết theo GĐ2 · FR-06')

export const OBJECT_TYPES = ['Hệ thống', 'Bảng', 'Cột', 'File', 'Kênh', 'Báo cáo', 'Chỉ tiêu']
export const OBJECT_TYPE_SRC = S('const', 'Bảy nhóm đối tượng dữ liệu bắt buộc quản lý theo GĐ2 mục 3')

export const GLOSSARY_BOOKS = ['Từ điển Tài chính', 'Từ điển Khách hàng', 'Từ điển Vận hành']
export const GLOSSARY_BOOK_SRC = S('catalog', 'Danh sách từ điển do quản trị viên tạo tại menu 2.1', '/governance/glossary')

export const TAG_SENSITIVITY = ['Cao', 'Trung bình', 'Thấp']
export const TAG_SENSITIVITY_SRC = S('const', 'Ba mức nhạy cảm — quyết định quy tắc che và cảnh báo mặc định của nhãn')

/** Bảng tra nguồn của mọi danh sách — dùng ở màn 2.5 Tiêu chuẩn thông tin mô tả */
export const ENUM_REGISTRY: { name: string; values: string[]; src: EnumSource }[] = [
  { name: 'Đơn vị tổ chức', values: ORG_UNITS, src: ORG_UNITS_SRC },
  { name: 'Vai trò quản trị dữ liệu', values: ROLE_NAMES, src: ROLE_SRC },
  { name: 'Mức phân loại bảo mật', values: CONFIDENTIALITY_NAMES, src: CONFIDENTIALITY_SRC },
  { name: 'Loại hệ thống', values: SYSTEM_KINDS, src: SYSTEM_KIND_SRC },
  { name: 'Môi trường', values: ENVIRONMENTS, src: ENV_SRC },
  { name: 'Trạng thái hệ thống', values: SYSTEM_STATUS, src: SYSTEM_STATUS_SRC },
  { name: 'Vùng lưu trữ', values: STORAGE_ZONES, src: ZONE_SRC },
  { name: 'Định dạng lưu trữ bảng', values: TABLE_FORMATS, src: FORMAT_SRC },
  { name: 'Chu kỳ cập nhật', values: SYNC_FREQUENCIES, src: SYNC_SRC },
  { name: 'Trạng thái vòng đời', values: LIFECYCLE_STATES, src: LIFECYCLE_SRC },
  { name: 'Trạng thái phê duyệt', values: APPROVAL_STATES, src: APPROVAL_SRC },
  { name: 'Mức độ nghiêm trọng', values: SEVERITIES, src: SEVERITY_SRC },
  { name: 'Loại kênh trao đổi', values: CHANNEL_KINDS, src: CHANNEL_KIND_SRC },
  { name: 'Chiều dữ liệu', values: CHANNEL_DIRECTIONS, src: CHANNEL_DIR_SRC },
  { name: 'Định dạng dữ liệu trao đổi', values: DATA_FORMATS, src: DATA_FORMAT_SRC },
  { name: 'Công cụ dựng báo cáo', values: BI_TOOLS, src: BI_TOOL_SRC },
  { name: 'Hình thức đầu ra báo cáo', values: REPORT_OUTPUTS, src: REPORT_OUTPUT_SRC },
  { name: 'Tần suất báo cáo', values: REPORT_FREQUENCIES, src: REPORT_FREQ_SRC },
  { name: 'Mục đích sử dụng dữ liệu', values: ACCESS_PURPOSES, src: PURPOSE_SRC },
  { name: 'Thời hạn quyền', values: GRANT_DURATIONS, src: DURATION_SRC },
  { name: 'Loại quyền dữ liệu', values: RIGHT_KINDS, src: RIGHT_SRC },
  { name: 'Cách kích hoạt kiểm tra', values: RULE_TRIGGERS, src: TRIGGER_SRC },
  { name: 'Khung giờ quét', values: RULE_SCHEDULES, src: RULE_SCHEDULE_SRC },
  { name: 'Mức xử lý cổng chất lượng', values: GATE_MODES, src: GATE_MODE_SRC },
  { name: 'Loại cửa nạp', values: INGEST_KINDS, src: INGEST_KIND_SRC },
  { name: 'Nhóm job', values: JOB_GROUPS, src: JOB_GROUP_SRC },
  { name: 'Nhóm chính sách', values: POLICY_CATEGORIES, src: POLICY_CAT_SRC },
  { name: 'Loại dữ liệu chủ', values: MDM_ENTITIES, src: MDM_ENTITY_SRC },
  { name: 'Mức truy vết', values: LINEAGE_LEVELS, src: LINEAGE_LEVEL_SRC },
  { name: 'Loại đối tượng dữ liệu', values: OBJECT_TYPES, src: OBJECT_TYPE_SRC },
  { name: 'Từ điển thuật ngữ', values: GLOSSARY_BOOKS, src: GLOSSARY_BOOK_SRC },
  { name: 'Mức nhạy cảm của nhãn', values: TAG_SENSITIVITY, src: TAG_SENSITIVITY_SRC },
]
