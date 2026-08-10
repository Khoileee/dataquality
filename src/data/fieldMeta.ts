/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TỪ ĐIỂN TRƯỜNG THÔNG TIN — nguồn gốc và nơi sử dụng của TỪNG trường trên UI
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Mục đích: trả lời được hai câu hỏi cho mọi trường xuất hiện trên giao diện
 *   ① Giá trị này TỪ ĐÂU ra?  — khai tay ở menu nào · thu thập tự động từ đâu ·
 *                                chọn từ danh mục nào · hệ thống tự tính bằng công thức gì
 *   ② Khai xong thì DÙNG Ở ĐÂU? — là đầu vào cho màn nào, quyết định hành vi gì
 *
 * Nguyên tắc: KHÔNG có trường nào không truy được nguồn. Trường nào là hằng số
 * cố định của hệ thống thì phải ghi rõ là hằng số và sửa ở đâu.
 */

/** Cách một trường có được giá trị */
export type OriginKind =
  | 'declare'   // người dùng khai tay trên màn hình
  | 'ref'       // chọn từ danh mục / danh sách có nơi quản lý riêng
  | 'auto'      // hệ thống thu thập tự động từ nguồn kỹ thuật
  | 'derived'   // hệ thống tự tính từ dữ liệu đã có
  | 'workflow'  // sinh ra bởi một quy trình (phê duyệt, xin quyền, sự cố…)
  | 'const'     // hằng số cố định của hệ thống

export const ORIGIN_LABEL: Record<OriginKind, string> = {
  declare: 'Người dùng khai tay',
  ref: 'Chọn từ danh mục có sẵn',
  auto: 'Hệ thống thu thập tự động',
  derived: 'Hệ thống tự tính',
  workflow: 'Sinh ra từ quy trình',
  const: 'Hằng số của hệ thống',
}

export const ORIGIN_TONE: Record<OriginKind, 'b' | 'g' | 't' | 'p' | 'o' | 'n'> = {
  declare: 'b', ref: 't', auto: 'g', derived: 'p', workflow: 'o', const: 'n',
}

export type FieldUse = {
  /** Menu sử dụng trường này */
  menu: string
  route?: string
  /** Dùng để làm gì — nói rõ hành vi, không nói chung chung */
  how: string
}

export type FieldDef = {
  key: string
  label: string
  /** Trường này là gì — một câu */
  desc: string
  origin: OriginKind
  /** Nguồn cụ thể: tên menu khai báo, tên hệ thống thu thập, hoặc công thức tính */
  from: string
  /** Đường dẫn tới nơi khai báo, nếu có */
  fromRoute?: string
  /** Bắt buộc điền hay không */
  required?: boolean
  /** Nếu là danh sách chọn: các giá trị hợp lệ lấy từ đâu */
  values?: string
  /** Khai xong dùng ở đâu */
  uses: FieldUse[]
  /** Thuộc nhóm đối tượng nào trong 7 nhóm của GĐ2 mục 3 */
  group: string
}

const F = (d: FieldDef) => d

export const FIELDS: FieldDef[] = [
  /* ─────────────── ① HỆ THỐNG & NGUỒN DỮ LIỆU (menu 1.2) ─────────────── */
  F({
    key: 'system.id', label: 'Mã hệ thống', group: 'Hệ thống & nơi lưu trữ',
    desc: 'Mã định danh duy nhất của một hệ thống nguồn trong danh mục.',
    origin: 'derived', from: 'Hệ thống tự sinh theo thứ tự khi tạo bản ghi mới — tiền tố HT + 2 chữ số',
    fromRoute: '/catalog/systems/create',
    uses: [
      { menu: '1.2 Bảng dữ liệu', route: '/catalog/tables', how: 'Mỗi bảng bắt buộc trỏ về một mã hệ thống' },
      { menu: '1.4 Kênh trao đổi', route: '/catalog/channels', how: 'Khai hệ thống gửi và hệ thống nhận' },
      { menu: '2.3 Truy vết luồng dữ liệu', route: '/governance/lineage', how: 'Vẽ quan hệ mức hệ thống' },
      { menu: '7.1 Mô hình dữ liệu chủ', route: '/mdm/models', how: 'Khai hệ thống nguồn của dữ liệu chủ' },
    ],
  }),
  F({
    key: 'system.name', label: 'Tên hệ thống', group: 'Hệ thống & nơi lưu trữ', required: true,
    desc: 'Tên gọi nghiệp vụ của hệ thống, dùng để hiển thị ở mọi nơi tham chiếu tới.',
    origin: 'declare', from: 'Đầu mối kỹ thuật khai tay tại menu 1.2', fromRoute: '/catalog/systems/create',
    uses: [
      { menu: '1.2 Bảng dữ liệu', route: '/catalog/tables', how: 'Hiển thị ở cột Hệ thống thay cho mã' },
      { menu: '8.1 Sức khoẻ dữ liệu', route: '/operations/health', how: 'Nhóm chỉ số theo hệ thống' },
    ],
  }),
  F({
    key: 'system.purpose', label: 'Mục đích sử dụng', group: 'Hệ thống & nơi lưu trữ', required: true,
    desc: 'Hệ thống này sinh ra để làm gì — viết cho người nghiệp vụ đọc hiểu.',
    origin: 'declare', from: 'Đầu mối kỹ thuật khai tay tại menu 1.2', fromRoute: '/catalog/systems/create',
    uses: [
      { menu: '1.1 Tìm kiếm toàn hệ thống', route: '/catalog/search', how: 'Nội dung được đưa vào chỉ mục tìm kiếm' },
    ],
  }),
  F({
    key: 'system.kind', label: 'Loại hệ thống / vùng lưu trữ', group: 'Hệ thống & nơi lưu trữ', required: true,
    desc: 'Phân loại kỹ thuật của hệ thống theo vai trò trong kiến trúc dữ liệu.',
    origin: 'const', from: 'Danh sách cố định 6 giá trị do hệ thống định nghĩa',
    values: 'Cơ sở dữ liệu · Kho dữ liệu · Vùng dữ liệu thô · Ứng dụng nghiệp vụ · Công cụ BI · Hàng đợi',
    uses: [{ menu: '1.3 Hệ thống & Nguồn dữ liệu', route: '/catalog/systems', how: 'Lọc danh sách theo loại' }],
  }),
  F({
    key: 'system.tech', label: 'Công nghệ nền tảng', group: 'Hệ thống & nơi lưu trữ', required: true,
    desc: 'Sản phẩm và phiên bản đang chạy — ví dụ Oracle 19c, Apache Iceberg trên HDFS.',
    origin: 'declare', from: 'Đầu mối kỹ thuật khai tay tại menu 1.2', fromRoute: '/catalog/systems/create',
    uses: [{ menu: '8.2 Cấu hình hệ thống', route: '/operations/settings', how: 'Đối chiếu khi khai kết nối kỹ thuật tới hệ thống' }],
  }),
  F({
    key: 'system.unit', label: 'Đơn vị quản lý', group: 'Hệ thống & nơi lưu trữ', required: true,
    desc: 'Đơn vị tổ chức chịu trách nhiệm vận hành hệ thống.',
    origin: 'ref', from: 'Danh mục đơn vị tổ chức — mô hình dữ liệu chủ MDM-DV', fromRoute: '/mdm/models/MDM-DV',
    values: 'Lấy từ bản ghi chuẩn của mô hình Đơn vị tổ chức (menu 7.1), đồng bộ từ hệ thống nhân sự',
    uses: [{ menu: '5.2 Chính sách truy cập', route: '/security/policies/data', how: 'Cấp quyền theo đơn vị' }],
  }),
  F({
    key: 'system.techOwner', label: 'Đầu mối kỹ thuật', group: 'Hệ thống & nơi lưu trữ', required: true,
    desc: 'Người chịu trách nhiệm kỹ thuật: kết nối, cấu trúc, sự cố hạ tầng.',
    origin: 'ref', from: 'Danh sách người dùng tại menu 5.1', fromRoute: '/security/users',
    values: 'Chỉ người dùng đang hoạt động, có vai trò Đầu mối kỹ thuật',
    uses: [
      { menu: '3.4 Sự cố chất lượng', route: '/quality/incidents', how: 'Tự gán sự cố kỹ thuật cho người này' },
      { menu: '3.5 Cảnh báo', route: '/quality/alerts', how: 'Người nhận cảnh báo mặc định' },
    ],
  }),
  F({
    key: 'system.dataOwner', label: 'Người sở hữu dữ liệu', group: 'Hệ thống & nơi lưu trữ', required: true,
    desc: 'Người phê duyệt định nghĩa, phạm vi sử dụng và cấp quyền trên dữ liệu của hệ thống.',
    origin: 'ref', from: 'Danh sách người dùng tại menu 5.1', fromRoute: '/security/users',
    values: 'Chỉ người dùng có vai trò Người sở hữu dữ liệu (GĐ1 mục 2.3)',
    uses: [
      { menu: '2.4 Phê duyệt & Phiên bản', route: '/governance/approvals', how: 'Hồ sơ metadata của hệ thống vào hàng đợi duyệt của người này' },
      { menu: '5.3 Yêu cầu cấp quyền', route: '/security/requests', how: 'Người duyệt yêu cầu xin quyền' },
    ],
  }),
  F({
    key: 'system.env', label: 'Môi trường', group: 'Hệ thống & nơi lưu trữ', required: true,
    desc: 'Môi trường vận hành của hệ thống.',
    origin: 'const', from: 'Danh sách cố định 3 giá trị', values: 'Production · Test · UAT',
    uses: [{ menu: '1.2 Bảng dữ liệu', route: '/catalog/tables', how: 'Chỉ bảng thuộc hệ thống Production mới tính vào chỉ số quản trị' }],
  }),
  F({
    key: 'system.tableCount', label: 'Số bảng', group: 'Hệ thống & nơi lưu trữ',
    desc: 'Số bảng dữ liệu thuộc hệ thống này.',
    origin: 'derived', from: 'Đếm số bản ghi tại menu 1.1 có trường Hệ thống bằng mã hệ thống này',
    uses: [{ menu: '8.1 Sức khoẻ dữ liệu', route: '/operations/health', how: 'Tính độ phủ danh mục theo hệ thống' }],
  }),
  F({
    key: 'system.metadataScore', label: 'Độ hoàn thiện metadata', group: 'Hệ thống & nơi lưu trữ',
    desc: 'Tỷ lệ trường thông tin bắt buộc đã được điền so với bộ tiêu chuẩn.',
    origin: 'derived', from: 'Số trường bắt buộc đã điền ÷ tổng số trường bắt buộc trong bộ tiêu chuẩn (menu 8.2) × 100',
    fromRoute: '/governance/standard',
    uses: [{ menu: '8.1 Sức khoẻ dữ liệu', route: '/operations/health', how: 'Chỉ số nghiệm thu GĐ2 — tỷ lệ có mô tả, tỷ lệ có người phụ trách' }],
  }),

  /* ─────────────── ② BẢNG DỮ LIỆU (menu 1.1) ─────────────── */
  F({
    key: 'table.id', label: 'Tên bảng', group: 'Bảng và cột dữ liệu', required: true,
    desc: 'Tên kỹ thuật đầy đủ của bảng, gồm tiền tố vùng lưu trữ.',
    origin: 'auto', from: 'Thu thập tự động từ lược đồ của hệ thống nguồn qua kết nối khai ở menu 8.2; khai tay khi hệ thống nguồn chưa nối được',
    fromRoute: '/operations/settings',
    values: 'Bắt buộc khớp biểu thức chuẩn đặt tên CT-01 khai tại menu 8.2 — sai chuẩn thì không lưu được',
    uses: [
      { menu: '3.2 Luật & Kết quả', route: '/quality/board', how: 'Gán luật kiểm tra theo mã bảng' },
      { menu: '4.1 Luồng xử lý', route: '/orchestration/jobs', how: 'Chọn làm bảng đích của job' },
      { menu: '5.2 Chính sách truy cập', route: '/security/policies/data', how: 'Phạm vi cấp quyền' },
      { menu: '2.3 Truy vết luồng dữ liệu', route: '/governance/lineage', how: 'Nút trên sơ đồ luồng dữ liệu' },
    ],
  }),
  F({
    key: 'table.description', label: 'Mô tả nghiệp vụ', group: 'Bảng và cột dữ liệu', required: true,
    desc: 'Bảng này chứa dữ liệu gì, phục vụ nghiệp vụ nào — viết cho người nghiệp vụ.',
    origin: 'declare', from: 'Đầu mối nghiệp vụ khai tay tại menu 1.1', fromRoute: '/catalog/tables/create',
    uses: [
      { menu: '1.1 Tìm kiếm toàn hệ thống', route: '/catalog/search', how: 'Nội dung được đưa vào chỉ mục tìm kiếm toàn văn' },
      { menu: '8.1 Sức khoẻ dữ liệu', route: '/operations/health', how: 'Tính chỉ số Tỷ lệ có mô tả' },
    ],
  }),
  F({
    key: 'table.systemId', label: 'Hệ thống lưu trữ', group: 'Bảng và cột dữ liệu', required: true,
    desc: 'Bảng này nằm ở hệ thống nào.',
    origin: 'ref', from: 'Danh mục hệ thống tại menu 1.2', fromRoute: '/catalog/systems',
    values: 'Chỉ hệ thống có trạng thái Đang sử dụng',
    uses: [{ menu: '2.3 Truy vết luồng dữ liệu', route: '/governance/lineage', how: 'Dựng quan hệ mức hệ thống từ quan hệ mức bảng' }],
  }),
  F({
    key: 'table.domain', label: 'Miền dữ liệu', group: 'Bảng và cột dữ liệu', required: true,
    desc: 'Nhóm lĩnh vực nghiệp vụ mà bảng thuộc về.',
    origin: 'ref', from: 'Danh mục miền dữ liệu tại menu 1.4', fromRoute: '/catalog/domains',
    values: 'Cây miền phân cấp 2 cấp, khai tại menu 1.4',
    uses: [
      { menu: '5.2 Chính sách truy cập', route: '/security/policies/data', how: 'Cấp quyền cho cả miền thay vì từng bảng' },
      { menu: '8.1 Sức khoẻ dữ liệu', route: '/operations/health/by-domain', how: 'Bảng sức khoẻ theo miền — mỗi miền có người chịu trách nhiệm' },
      { menu: '3.5 Cảnh báo', route: '/quality/alerts', how: 'Phạm vi áp dụng của quy tắc cảnh báo' },
    ],
  }),
  F({
    key: 'table.tier', label: 'Mức quan trọng (Tier)', group: 'Bảng và cột dữ liệu', required: true,
    desc: 'Mức độ trọng yếu của bảng, quyết định điều kiện bắt buộc và cam kết xử lý.',
    origin: 'ref', from: 'Định nghĩa Tier khai tại menu 8.2', fromRoute: '/operations/settings',
    values: 'Tier 1 Trọng yếu · Tier 2 Quan trọng · Tier 3 Thông thường — tiêu chí phân loại khai ở menu 8.2',
    uses: [
      { menu: '1.2 Bảng dữ liệu', route: '/catalog/tables/create', how: 'Quyết định trường nào bắt buộc điền khi khai bảng' },
      { menu: '3.2 Luật & Kết quả', route: '/quality/board', how: 'Ngưỡng chất lượng cấp bảng lấy theo Tier' },
      { menu: '3.4 Sự cố chất lượng', route: '/quality/incidents', how: 'Hạn xử lý sự cố lấy theo cam kết của Tier' },
      { menu: '4.1 Luồng xử lý', route: '/orchestration/jobs/create', how: 'Bảng đích Tier 1 thì không tắt được quét nguồn gốc' },
    ],
  }),
  F({
    key: 'table.dataOwner', label: 'Người sở hữu dữ liệu', group: 'Bảng và cột dữ liệu', required: true,
    desc: 'Người phê duyệt định nghĩa, phạm vi sử dụng và các yêu cầu cấp quyền trên bảng.',
    origin: 'ref', from: 'Danh sách người dùng tại menu 5.1', fromRoute: '/security/users',
    values: 'Chỉ người dùng có vai trò Người sở hữu dữ liệu',
    uses: [
      { menu: '2.4 Phê duyệt & Phiên bản', route: '/governance/approvals', how: 'Hồ sơ thay đổi metadata vào hàng đợi duyệt của người này' },
      { menu: '5.3 Yêu cầu cấp quyền', route: '/security/requests', how: 'Người duyệt yêu cầu xin quyền trên bảng' },
      { menu: '5.2 Chính sách truy cập', route: '/security/policies/mask', how: 'Ngoại lệ mặc định được xem dữ liệu không che' },
    ],
  }),
  F({
    key: 'table.bda', label: 'Đầu mối nghiệp vụ (BDA)', group: 'Bảng và cột dữ liệu', required: true,
    desc: 'Người cập nhật mô tả, thuật ngữ, quy tắc nghiệp vụ của bảng.',
    origin: 'ref', from: 'Danh sách người dùng tại menu 5.1', fromRoute: '/security/users',
    values: 'Chỉ người dùng có vai trò Đầu mối nghiệp vụ',
    uses: [
      { menu: '3.4 Sự cố chất lượng', route: '/quality/incidents', how: '⭐ Hệ thống TỰ GÁN sự cố nghiệp vụ cho người này — bảng không có BDA thì sự cố nằm ở trạng thái Mới, không ai nhận' },
      { menu: '3.5 Cảnh báo', route: '/quality/alerts', how: 'Người nhận cảnh báo mặc định của bảng' },
    ],
  }),
  F({
    key: 'table.de', label: 'Đầu mối kỹ thuật (DE)', group: 'Bảng và cột dữ liệu', required: true,
    desc: 'Người cập nhật cấu trúc, nguồn dữ liệu, job sinh ra bảng.',
    origin: 'ref', from: 'Danh sách người dùng tại menu 5.1', fromRoute: '/security/users',
    values: 'Chỉ người dùng có vai trò Đầu mối kỹ thuật',
    uses: [{ menu: '3.4 Sự cố chất lượng', route: '/quality/incidents', how: 'Tự gán sự cố kỹ thuật (độ tươi, cấu trúc, job hỏng)' }],
  }),
  F({
    key: 'table.confidentiality', label: 'Mức phân loại', group: 'Bảng và cột dữ liệu', required: true,
    desc: 'Mức độ nhạy cảm của toàn bộ bảng theo 4 cấp của GĐ4.',
    origin: 'declare', from: 'Khai tay tại menu 1.1; hệ thống TỰ NÂNG lên mức cao hơn nếu bảng chứa cột mang nhãn nhạy cảm khai ở menu 2.2',
    fromRoute: '/governance/classification',
    values: 'Công khai · Nội bộ · Mật · Hạn chế truy cập — 4 mức cố định theo GĐ4 mục 3',
    uses: [
      { menu: '5.2 Chính sách truy cập', route: '/security/policies/download', how: 'Quyết định có được tải xuống không, có cần phê duyệt riêng không' },
      { menu: '5.3 Yêu cầu cấp quyền', route: '/security/requests/create', how: 'Giới hạn thời hạn tối đa của quyền — Mật 6 tháng, Hạn chế 3 tháng' },
      { menu: '5.5 Giám sát truy cập', route: '/security/report', how: 'Ngưỡng cảnh báo tải xuống bất thường' },
    ],
  }),
  F({
    key: 'table.syncFrequency', label: 'Chu kỳ cập nhật', group: 'Bảng và cột dữ liệu', required: true,
    desc: 'Cam kết dữ liệu được cập nhật với tần suất nào, xong trước mấy giờ.',
    origin: 'declare', from: 'Đầu mối nghiệp vụ khai tay tại menu 1.1', fromRoute: '/catalog/tables/create',
    uses: [
      { menu: '3.2 Luật & Kết quả', route: '/quality/board', how: '⭐ Là tham số của luật Độ tươi dữ liệu và luật Dữ liệu về đúng giờ cam kết — không khai chu kỳ thì không sinh được luật kịp thời' },
      { menu: '1.2 Bảng dữ liệu', route: '/catalog/tables', how: 'Đối chiếu với độ tươi thực tế để tô màu cảnh báo' },
    ],
  }),
  F({
    key: 'table.freshness', label: 'Độ tươi', group: 'Bảng và cột dữ liệu',
    desc: 'Khoảng thời gian từ lần dữ liệu được cập nhật gần nhất tới hiện tại.',
    origin: 'derived', from: 'Thời điểm hiện tại trừ đi thời điểm kết thúc lần chạy thành công gần nhất của job sinh ra bảng (menu 4.1); nếu bảng không do job sinh thì lấy giá trị lớn nhất của cột thời gian cập nhật',
    fromRoute: '/orchestration/jobs',
    uses: [{ menu: '8.1 Sức khoẻ dữ liệu', route: '/operations/health', how: 'Chỉ số Tỷ lệ job đúng giờ cam kết' }],
  }),
  F({
    key: 'table.rows', label: 'Số dòng', group: 'Bảng và cột dữ liệu',
    desc: 'Số bản ghi hiện có trong bảng.',
    origin: 'auto', from: 'Thu thập tự động từ siêu dữ liệu của hệ thống lưu trữ qua kết nối khai ở menu 8.2',
    fromRoute: '/operations/settings',
    uses: [
      { menu: '3.2 Luật & Kết quả', route: '/quality/board', how: 'Mẫu số khi tính tỷ lệ dòng lỗi' },
      { menu: '3.3 Phân tích dữ liệu', route: '/quality/profiling', how: 'Tính độ phân tán của cột' },
    ],
  }),
  F({
    key: 'table.sizeGb', label: 'Dung lượng', group: 'Bảng và cột dữ liệu',
    desc: 'Dung lượng lưu trữ thực tế của bảng.',
    origin: 'auto', from: 'Thu thập tự động từ siêu dữ liệu của hệ thống lưu trữ',
    uses: [{ menu: '6.2 Vòng đời & Lưu trữ', route: '/compliance/lifecycle', how: 'Ước lượng khối lượng khi chuyển sang lưu kho hoặc xóa' }],
  }),
  F({
    key: 'table.format', label: 'Định dạng lưu trữ', group: 'Bảng và cột dữ liệu',
    desc: 'Định dạng tệp mà bảng đang dùng.',
    origin: 'auto', from: 'Thu thập tự động từ siêu dữ liệu lưu trữ',
    values: 'Iceberg · Hudi · Parquet · ORC — bốn định dạng đang dùng trong hạ tầng',
    uses: [{ menu: '4.1 Luồng xử lý', route: '/orchestration/jobs', how: 'Quyết định cách job ghi dữ liệu (ghi đè hay bổ sung)' }],
  }),
  F({
    key: 'table.zone', label: 'Vùng lưu trữ', group: 'Bảng và cột dữ liệu', required: true,
    desc: 'Tầng dữ liệu mà bảng thuộc về, thể hiện bằng tiền tố trong tên bảng.',
    origin: 'derived', from: 'Tách từ tiền tố của tên bảng theo chuẩn đặt tên CT-02 khai ở menu 8.2',
    fromRoute: '/operations/settings',
    values: 'raw · dwh · mart · bi · fin · crm · ops · ref',
    uses: [{ menu: '6.2 Vòng đời & Lưu trữ', route: '/compliance/lifecycle', how: 'Quy tắc vòng đời áp theo vùng — vùng thô có thời hạn ngắn hơn' }],
  }),
  F({
    key: 'table.lifecycle', label: 'Trạng thái vòng đời', group: 'Bảng và cột dữ liệu', required: true,
    desc: 'Bảng đang ở giai đoạn nào trong vòng đời sử dụng.',
    origin: 'declare', from: 'Đầu mối kỹ thuật khai tay tại menu 1.1', fromRoute: '/catalog/tables/create',
    values: 'Nháp · Đang dùng · Sắp ngừng · Đã ngừng',
    uses: [
      { menu: '1.5 Báo cáo & Chỉ tiêu', route: '/catalog/reports', how: 'Cảnh báo khi báo cáo còn dùng bảng đã ngừng' },
      { menu: '6.2 Vòng đời & Lưu trữ', route: '/compliance/lifecycle', how: 'Bảng Đã ngừng vào diện xem xét xóa' },
    ],
  }),
  F({
    key: 'table.approval', label: 'Trạng thái phê duyệt', group: 'Bảng và cột dữ liệu',
    desc: 'Metadata của bảng đã có hiệu lực chưa.',
    origin: 'workflow', from: 'Sinh ra bởi quy trình phê duyệt tại menu 2.4', fromRoute: '/governance/approvals',
    values: 'Dự thảo · Chờ phê duyệt · Yêu cầu chỉnh sửa · Đã phê duyệt · Ngừng sử dụng — 5 trạng thái theo GĐ2 mục 8.1',
    uses: [{ menu: '8.1 Sức khoẻ dữ liệu', route: '/operations/health', how: 'Chỉ số nghiệm thu Tỷ lệ đã được phê duyệt' }],
  }),
  F({
    key: 'table.qualityScore', label: 'Điểm chất lượng', group: 'Bảng và cột dữ liệu',
    desc: 'Điểm tổng hợp chất lượng dữ liệu của bảng trên thang 100.',
    origin: 'derived', from: 'Trung bình điểm của các chiều chất lượng CÓ luật gán cho bảng; điểm mỗi chiều là trung bình điểm các luật thuộc chiều đó (menu 3.2)',
    fromRoute: '/quality/board',
    uses: [
      { menu: '1.5 Báo cáo & Chỉ tiêu', route: '/catalog/reports', how: 'Điểm chất lượng báo cáo lấy trung bình từ các bảng nguồn' },
      { menu: '4.3 Theo dõi & Pipeline', route: '/orchestration/monitor', how: 'Badge chất lượng phủ lên nút trên sơ đồ pipeline' },
      { menu: '8.1 Sức khoẻ dữ liệu', route: '/operations/health', how: 'Điểm chất lượng toàn hệ thống' },
    ],
  }),
  F({
    key: 'table.ruleCount', label: 'Số luật chất lượng', group: 'Bảng và cột dữ liệu',
    desc: 'Số luật kiểm tra đang gán cho bảng và các cột của bảng.',
    origin: 'derived', from: 'Đếm bản ghi tại menu 3.2 có Đối tượng áp dụng là bảng này', fromRoute: '/quality/board',
    uses: [{ menu: '8.2 Cấu hình hệ thống', route: '/operations/settings', how: 'Đối chiếu với điều kiện bắt buộc của Tier — Tier 1 cần tối thiểu 5 luật' }],
  }),
  F({
    key: 'table.sensitiveColumnCount', label: 'Số cột nhạy cảm', group: 'Bảng và cột dữ liệu',
    desc: 'Số cột của bảng đang mang nhãn dữ liệu cá nhân hoặc nhạy cảm.',
    origin: 'derived', from: 'Đếm cột có trường Nhãn khác rỗng, nhãn khai tại menu 2.2', fromRoute: '/governance/classification',
    uses: [
      { menu: '5.2 Chính sách truy cập', route: '/security/policies/mask', how: 'Xác định phạm vi áp chính sách che dữ liệu' },
      { menu: '8.1 Sức khoẻ dữ liệu', route: '/operations/health', how: 'Chỉ số Cột nhạy cảm đã có chính sách che' },
    ],
  }),
  F({
    key: 'table.producedByJob', label: 'Sinh ra bởi job', group: 'Bảng và cột dữ liệu',
    desc: 'Job nào ghi dữ liệu vào bảng này.',
    origin: 'derived', from: 'Tìm job tại menu 4.1 có trường Bảng đích bằng bảng này', fromRoute: '/orchestration/jobs',
    uses: [
      { menu: '1.2 tab Nguồn gốc', how: 'Vẽ mắt xích job trên sơ đồ nguồn gốc' },
      { menu: '3.2 Luật & Kết quả', route: '/quality/board', how: 'Luật kích hoạt theo sự kiện chạy ngay sau khi job này kết thúc' },
    ],
  }),
  F({
    key: 'table.usageWeek', label: 'Lượt dùng mỗi tuần', group: 'Bảng và cột dữ liệu',
    desc: 'Số lượt truy vấn vào bảng trong 7 ngày gần nhất.',
    origin: 'auto', from: 'Đếm từ lịch sử truy vấn của SQLWF — DMP đọc lại, không tự ghi',
    uses: [{ menu: '8.1 Sức khoẻ dữ liệu', route: '/operations/health', how: '⭐ Nhân với điểm chất lượng để xếp thứ tự ưu tiên cải thiện — bảng điểm thấp mà dùng nhiều thì ưu tiên trước' }],
  }),
  F({
    key: 'table.servesReports', label: 'Bảng phục vụ báo cáo', group: 'Bảng và cột dữ liệu',
    desc: 'Đánh dấu bảng là bảng kết quả đầu ra phục vụ trực tiếp một hoặc nhiều báo cáo.',
    origin: 'derived', from: 'Bảng được ít nhất một báo cáo tại menu 1.3 khai là Bảng kết quả đầu ra', fromRoute: '/catalog/reports',
    uses: [
      { menu: '3.2 Luật & Kết quả', route: '/quality/assign', how: 'Bảng phục vụ báo cáo được ưu tiên gán luật đối chiếu tổng và luật kịp thời' },
      { menu: '2.3 Truy vết luồng dữ liệu', route: '/governance/lineage', how: 'Là mắt xích cuối trước khi tới báo cáo trên sơ đồ mức nghiệp vụ' },
    ],
  }),

  /* ─────────────── ③ CỘT DỮ LIỆU ─────────────── */
  F({
    key: 'column.name', label: 'Tên cột', group: 'Bảng và cột dữ liệu',
    desc: 'Tên kỹ thuật của cột trong bảng.',
    origin: 'auto', from: 'Thu thập tự động từ lược đồ bảng qua kết nối khai ở menu 8.2',
    values: 'Kiểm theo chuẩn đặt tên CT-03 khai tại menu 8.2',
    uses: [{ menu: '5.2 Chính sách truy cập', route: '/security/policies/mask', how: 'Phạm vi che dữ liệu theo cột cụ thể hoặc theo mẫu tên cột' }],
  }),
  F({
    key: 'column.type', label: 'Kiểu dữ liệu', group: 'Bảng và cột dữ liệu',
    desc: 'Kiểu dữ liệu kỹ thuật của cột.',
    origin: 'auto', from: 'Thu thập tự động từ lược đồ bảng',
    uses: [{ menu: '3.2 Luật & Kết quả', route: '/quality/assign', how: 'Lọc loại kiểm tra phù hợp — cột số mới gán được luật khoảng giá trị' }],
  }),
  F({
    key: 'column.description', label: 'Mô tả cột', group: 'Bảng và cột dữ liệu',
    desc: 'Ý nghĩa nghiệp vụ của cột.',
    origin: 'declare', from: 'Đầu mối nghiệp vụ khai tay tại tab Cột của menu 1.1',
    uses: [{ menu: '1.1 Tìm kiếm toàn hệ thống', route: '/catalog/search', how: 'Đưa vào chỉ mục tìm kiếm' }],
  }),
  F({
    key: 'column.glossaryId', label: 'Thuật ngữ nghiệp vụ', group: 'Bảng và cột dữ liệu',
    desc: 'Thuật ngữ chuẩn mà cột này thể hiện.',
    origin: 'ref', from: 'Từ điển nghiệp vụ tại menu 2.1', fromRoute: '/governance/glossary',
    values: 'Chỉ thuật ngữ có trạng thái Đã phê duyệt',
    uses: [
      { menu: '1.1 Tìm kiếm toàn hệ thống', route: '/catalog/search', how: '⭐ Gõ tên thuật ngữ ra được cột mang thuật ngữ đó — đây là lý do phải gắn' },
      { menu: '2.1 Từ điển nghiệp vụ', route: '/governance/glossary', how: 'Cột Số cột đã gắn của thuật ngữ' },
    ],
  }),
  F({
    key: 'column.tags', label: 'Nhãn dữ liệu nhạy cảm', group: 'Bảng và cột dữ liệu',
    desc: 'Loại dữ liệu cá nhân hoặc nhạy cảm mà cột chứa.',
    origin: 'ref', from: 'Cây nhãn phân loại tại menu 2.2; bộ dò tự động đề xuất, người có thẩm quyền xác nhận',
    fromRoute: '/governance/classification',
    values: 'PD_BASIC · PD_SENSITIVE và các nhãn con — khai tại menu 2.2',
    uses: [
      { menu: '5.2 Chính sách truy cập', route: '/security/policies/by-tag', how: '⭐ Chính sách che dữ liệu viết THEO NHÃN, không viết theo tên cột — gắn nhãn một lần là chính sách tự áp cho mọi cột mang nhãn' },
      { menu: '1.2 Bảng dữ liệu', route: '/catalog/tables', how: 'Cộng dồn thành Số cột nhạy cảm của bảng' },
    ],
  }),
  F({
    key: 'column.businessRule', label: 'Quy tắc nghiệp vụ', group: 'Bảng và cột dữ liệu',
    desc: 'Ràng buộc nghiệp vụ áp cho giá trị của cột, viết bằng lời.',
    origin: 'declare', from: 'Đầu mối nghiệp vụ khai tay tại tab Cột của menu 1.1',
    uses: [{ menu: '3.2 Luật & Kết quả', route: '/quality/assign', how: '⭐ Là NGUỒN GỢI Ý tham số khi gán luật — ví dụ quy tắc "định dạng số điện thoại" gợi ý biểu thức chính quy cho luật Đúng định dạng' }],
  }),
  F({
    key: 'column.valueSet', label: 'Tập giá trị hợp lệ', group: 'Bảng và cột dữ liệu',
    desc: 'Danh sách giá trị mà cột được phép nhận.',
    origin: 'declare', from: 'Khai tay tại tab Cột của menu 1.1, hoặc trỏ tới một danh mục tham chiếu ở menu 1.5',
    fromRoute: '/catalog/refdata',
    uses: [{ menu: '3.2 Luật & Kết quả', route: '/quality/assign', how: '⭐ Là tham số trực tiếp của luật Thuộc tập giá trị cho phép và luật Mã phải tồn tại trong danh mục' }],
  }),
  F({
    key: 'column.nullPct', label: 'Tỷ lệ rỗng', group: 'Bảng và cột dữ liệu',
    desc: 'Phần trăm bản ghi có giá trị rỗng ở cột này.',
    origin: 'derived', from: 'Kết quả quét Phân tích dữ liệu tại menu 1.1 — ⭐ ĐO MỘT NƠI, HIỆN NHIỀU NƠI, tab Cột chỉ đọc lại',
    fromRoute: '/quality/profiling',
    uses: [{ menu: '3.2 Luật & Kết quả', route: '/quality/assign', how: 'Gợi ý gán luật Tỷ lệ điền tối thiểu khi tỷ lệ rỗng vượt ngưỡng khuyến nghị' }],
  }),
  F({
    key: 'column.distinctCount', label: 'Số giá trị phân biệt', group: 'Bảng và cột dữ liệu',
    desc: 'Số giá trị khác nhau xuất hiện trong cột.',
    origin: 'derived', from: 'Kết quả quét Phân tích dữ liệu tại menu 1.1', fromRoute: '/quality/profiling',
    uses: [{ menu: '3.2 Luật & Kết quả', route: '/quality/assign', how: 'Bằng số dòng thì gợi ý cột là khoá; ít giá trị thì gợi ý luật tập giá trị' }],
  }),
  F({
    key: 'column.maskPolicy', label: 'Chính sách che', group: 'Bảng và cột dữ liệu',
    desc: 'Kiểu che dữ liệu đang áp cho cột khi hiển thị.',
    origin: 'derived', from: 'Suy ra từ chính sách che tại menu 5.2 khớp với nhãn hoặc tên cột này', fromRoute: '/security/policies/mask',
    uses: [{ menu: '8.1 Sức khoẻ dữ liệu', route: '/operations/health', how: 'Chỉ số Cột nhạy cảm đã có chính sách che' }],
  }),

  /* ─────────────── ④ KÊNH TRAO ĐỔI DỮ LIỆU (menu 1.2) ─────────────── */
  F({
    key: 'channel.kind', label: 'Loại kết nối', group: 'Kênh trao đổi dữ liệu', required: true,
    desc: 'Phương thức kỹ thuật dùng để trao đổi dữ liệu.',
    origin: 'const', from: 'Danh sách cố định 6 giá trị', values: 'API · Kafka · SFTP · FTP · File Share · Webhook',
    uses: [{ menu: '4.2 Cửa nạp dữ liệu', route: '/ingestion/templates', how: 'Quyết định loại cửa nạp và cấu hình đi kèm' }],
  }),
  F({
    key: 'channel.direction', label: 'Chiều dữ liệu', group: 'Kênh trao đổi dữ liệu', required: true,
    desc: 'Dữ liệu đi vào, đi ra hay cả hai.',
    origin: 'const', from: 'Danh sách cố định 3 giá trị', values: 'Nhận về · Gửi đi · Hai chiều',
    uses: [
      { menu: '5.2 Chính sách truy cập', route: '/security/policies/download', how: '⭐ Kênh Gửi đi bị kiểm tra mức phân loại trước khi cho xuất dữ liệu' },
      { menu: '6.2 Vòng đời & Lưu trữ', route: '/compliance/lifecycle', how: 'Kênh gửi ra ngoài bắt buộc có thoả thuận chia sẻ bên thứ ba' },
    ],
  }),
  F({
    key: 'channel.fromSystem', label: 'Hệ thống gửi', group: 'Kênh trao đổi dữ liệu', required: true,
    desc: 'Hệ thống phát dữ liệu.',
    origin: 'ref', from: 'Danh mục hệ thống tại menu 1.2', fromRoute: '/catalog/systems',
    uses: [{ menu: '2.3 Truy vết luồng dữ liệu', route: '/governance/lineage', how: 'Dựng quan hệ mức hệ thống' }],
  }),
  F({
    key: 'channel.auth', label: 'Phương thức xác thực', group: 'Kênh trao đổi dữ liệu', required: true,
    desc: 'Cách hai đầu xác thực lẫn nhau khi trao đổi dữ liệu.',
    origin: 'declare', from: 'Đầu mối kỹ thuật khai tay tại menu 1.2', fromRoute: '/catalog/channels/create',
    uses: [{ menu: '6.3 Đánh giá tuân thủ', route: '/compliance/assessments', how: '⭐ Là bằng chứng cho mục kiểm tra về bảo vệ dữ liệu khi truyền — kênh không mã hoá bị đánh Không đạt' }],
  }),
  F({
    key: 'channel.linkedTables', label: 'Bảng dữ liệu liên quan', group: 'Kênh trao đổi dữ liệu',
    desc: 'Bảng nào nhận dữ liệu từ kênh hoặc cấp dữ liệu cho kênh.',
    origin: 'ref', from: 'Danh mục bảng tại menu 1.1', fromRoute: '/catalog/tables',
    uses: [{ menu: '2.3 Truy vết luồng dữ liệu', route: '/governance/lineage', how: 'Sinh quan hệ kênh → bảng, đây là mắt xích đầu tiên của chuỗi truy vết' }],
  }),

  /* ─────────────── ⑤ BÁO CÁO & CHỈ TIÊU (menu 1.3) ─────────────── */
  F({
    key: 'report.backingTables', label: 'Bảng kết quả đầu ra', group: 'Thông tin nghiệp vụ (báo cáo, chỉ tiêu)',
    desc: 'Bảng chứa sẵn số liệu đã tổng hợp mà báo cáo đọc trực tiếp để hiển thị.',
    origin: 'ref', from: 'Danh mục bảng tại menu 1.1', fromRoute: '/catalog/tables',
    values: 'Thường là bảng thuộc vùng mart hoặc bi. Để trống nếu công cụ BI tự truy vấn từ nhiều bảng nguồn',
    uses: [
      { menu: '1.2 Bảng dữ liệu', route: '/catalog/tables', how: '⭐ Bảng được chọn ở đây được đánh dấu là Bảng phục vụ báo cáo, ưu tiên gán luật chất lượng' },
      { menu: '2.3 Truy vết luồng dữ liệu', route: '/governance/lineage', how: 'Là mắt xích nối bảng với báo cáo trên sơ đồ mức nghiệp vụ' },
    ],
  }),
  F({
    key: 'report.sourceTables', label: 'Bảng nguồn', group: 'Thông tin nghiệp vụ (báo cáo, chỉ tiêu)', required: true,
    desc: 'Các bảng cung cấp dữ liệu để tính ra số liệu của báo cáo.',
    origin: 'ref', from: 'Danh mục bảng tại menu 1.1', fromRoute: '/catalog/tables',
    values: 'Chỉ bảng đã có trong danh mục — ràng buộc RB2',
    uses: [
      { menu: '1.2 tab Nguồn gốc', how: 'Phân tích ảnh hưởng: bảng hỏng thì báo cáo nào sai' },
      { menu: '1.5 Báo cáo & Chỉ tiêu', route: '/catalog/reports', how: 'Điểm chất lượng báo cáo lấy trung bình từ điểm các bảng nguồn' },
    ],
  }),
  F({
    key: 'report.metricIds', label: 'Chỉ tiêu thể hiện', group: 'Thông tin nghiệp vụ (báo cáo, chỉ tiêu)', required: true,
    desc: 'Danh sách chỉ tiêu xuất hiện trong báo cáo.',
    origin: 'ref', from: 'Danh mục chỉ tiêu tại menu 1.3', fromRoute: '/catalog/reports',
    uses: [{ menu: '2.3 Truy vết luồng dữ liệu', route: '/governance/lineage', how: 'Mắt xích chỉ tiêu → báo cáo trên sơ đồ mức nghiệp vụ' }],
  }),
  F({
    key: 'report.readyBy', label: 'Thời gian dữ liệu sẵn sàng', group: 'Thông tin nghiệp vụ (báo cáo, chỉ tiêu)', required: true,
    desc: 'Cam kết báo cáo có số liệu đúng trước mấy giờ.',
    origin: 'declare', from: 'Đơn vị sở hữu báo cáo khai tay tại menu 1.3', fromRoute: '/catalog/reports/create',
    uses: [
      { menu: '3.2 Luật & Kết quả', route: '/quality/assign', how: '⭐ Là tham số của luật Dữ liệu về đúng giờ cam kết áp cho báo cáo' },
      { menu: '4.1 Luồng xử lý', route: '/orchestration/jobs', how: 'Đối chiếu ngược để đặt giờ cam kết cho job sinh ra bảng nguồn' },
    ],
  }),
  F({
    key: 'report.audience', label: 'Đối tượng sử dụng', group: 'Thông tin nghiệp vụ (báo cáo, chỉ tiêu)', required: true,
    desc: 'Đơn vị hoặc vai trò nào dùng báo cáo này.',
    origin: 'declare', from: 'Đơn vị sở hữu báo cáo khai tay tại menu 1.3', fromRoute: '/catalog/reports/create',
    uses: [{ menu: '1.2 tab Nguồn gốc', how: '⭐ Là danh sách người cần thông báo khi phân tích ảnh hưởng — xuất ra được' }],
  }),
  F({
    key: 'report.traceable', label: 'Truy vết được tới nguồn', group: 'Thông tin nghiệp vụ (báo cáo, chỉ tiêu)',
    desc: 'Có đủ chuỗi quan hệ từ báo cáo về tận bảng gốc hay không.',
    origin: 'derived', from: 'Đúng khi tồn tại đường đi liên tục trên sơ đồ lineage (menu 2.3) từ báo cáo ngược về ít nhất một bảng thuộc vùng raw hoặc một kênh trao đổi',
    fromRoute: '/governance/lineage',
    uses: [{ menu: '8.1 Sức khoẻ dữ liệu', route: '/operations/health/progress', how: '⭐ Chỉ số nghiệm thu GĐ2 mục 10 — Tỷ lệ báo cáo/chỉ tiêu truy vết được đến nguồn' }],
  }),
  F({
    key: 'report.viewsMonth', label: 'Lượt xem mỗi tháng', group: 'Thông tin nghiệp vụ (báo cáo, chỉ tiêu)',
    desc: 'Số lượt mở báo cáo trong tháng gần nhất.',
    origin: 'auto', from: 'Thu thập từ nhật ký sử dụng của công cụ BI (hệ thống HT-06) qua kênh trao đổi khai ở menu 1.2',
    fromRoute: '/catalog/channels',
    uses: [{ menu: '1.2 tab Nguồn gốc', how: 'Ước lượng mức độ ảnh hưởng khi bảng nguồn thay đổi' }],
  }),
  F({
    key: 'metric.formula', label: 'Công thức tính', group: 'Thông tin nghiệp vụ (báo cáo, chỉ tiêu)', required: true,
    desc: 'Cách tính ra giá trị của chỉ tiêu, viết đủ để người khác tính lại ra cùng con số.',
    origin: 'declare', from: 'Đầu mối nghiệp vụ khai tay tại menu 1.3', fromRoute: '/catalog/reports/metrics/create',
    uses: [
      { menu: '2.1 Từ điển nghiệp vụ', route: '/governance/glossary', how: 'Đối chiếu với công thức của thuật ngữ liên kết để phát hiện lệch định nghĩa' },
      { menu: '3.2 Luật & Kết quả', route: '/quality/assign', how: 'Là cơ sở để viết luật Chỉ tiêu cha bằng tổng con' },
    ],
  }),
  F({
    key: 'metric.filterRule', label: 'Điều kiện lấy dữ liệu', group: 'Thông tin nghiệp vụ (báo cáo, chỉ tiêu)',
    desc: 'Cái gì bị loại trừ khi tính chỉ tiêu — đây là chỗ hay lệch số nhất giữa các đơn vị.',
    origin: 'declare', from: 'Đầu mối nghiệp vụ khai tay tại menu 1.3', fromRoute: '/catalog/reports/metrics/create',
    uses: [{ menu: '3.4 Sự cố chất lượng', route: '/quality/incidents', how: 'Là căn cứ phân tích khi hai báo cáo cho ra số khác nhau' }],
  }),

  /* ─────────────── ⑥ THUẬT NGỮ NGHIỆP VỤ (menu 2.1) ─────────────── */
  F({
    key: 'term.book', label: 'Thuộc từ điển', group: 'Thuật ngữ nghiệp vụ', required: true,
    desc: 'Nhóm từ điển mà thuật ngữ thuộc về.',
    origin: 'declare', from: 'Danh sách từ điển do quản trị viên tạo tại menu 2.1', fromRoute: '/governance/glossary',
    values: 'Từ điển Tài chính · Từ điển Khách hàng · Từ điển Vận hành — thêm mới khi cần',
    uses: [{ menu: '1.1 Tìm kiếm toàn hệ thống', route: '/catalog/search', how: 'Bộ lọc mặt theo từ điển' }],
  }),
  F({
    key: 'term.cde', label: 'Cờ CDE', group: 'Thuật ngữ nghiệp vụ',
    desc: 'Đánh dấu thuật ngữ là dữ liệu trọng yếu doanh nghiệp (Critical Data Element).',
    origin: 'declare', from: 'Người sở hữu dữ liệu đánh dấu tại menu 2.1', fromRoute: '/governance/glossary/create',
    uses: [
      { menu: '3.2 Luật & Kết quả', route: '/quality/board', how: '⭐ Mọi cột gắn thuật ngữ CDE BẮT BUỘC có luật chất lượng — hệ thống kiểm tra và cảnh báo nếu thiếu' },
      { menu: '2.4 Phê duyệt & Phiên bản', route: '/governance/approvals', how: 'Thay đổi định nghĩa thuật ngữ CDE phải qua phê duyệt cấp Người sở hữu dữ liệu' },
    ],
  }),
  F({
    key: 'term.boundColumns', label: 'Cột đã gắn', group: 'Thuật ngữ nghiệp vụ',
    desc: 'Các cột dữ liệu đang mang thuật ngữ này.',
    origin: 'derived', from: 'Đếm ngược từ trường Thuật ngữ của cột tại tab Cột của menu 1.1', fromRoute: '/catalog/tables',
    uses: [{ menu: '2.1 Từ điển nghiệp vụ', route: '/governance/glossary', how: '⭐ Bằng 0 thì thuật ngữ vô dụng — không ai tra ra được, tô đỏ trong danh sách' }],
  }),

  /* ─────────────── ⑦ NHÃN PHÂN LOẠI (menu 2.2) ─────────────── */
  F({
    key: 'tag.id', label: 'Mã nhãn', group: 'Phân loại và bảo mật', required: true,
    desc: 'Mã định danh của nhãn, dùng trong mọi chính sách bảo mật.',
    origin: 'declare', from: 'Quản trị viên khai tay tại menu 2.2', fromRoute: '/governance/classification/create',
    values: '⚠️ Đồng bộ sang hệ thống phân quyền OPA nên KHÔNG đổi được sau khi tạo',
    uses: [{ menu: '5.2 Chính sách truy cập', route: '/security/policies/by-tag', how: 'Chính sách che dữ liệu và hạn chế tải xuống viết theo mã nhãn' }],
  }),
  F({
    key: 'tag.defaultMask', label: 'Kiểu che mặc định', group: 'Phân loại và bảo mật',
    desc: 'Cách che dữ liệu áp tự động cho mọi cột mang nhãn này.',
    origin: 'ref', from: 'Danh sách 8 kiểu che do hệ thống định nghĩa, xem đầy đủ tại menu 5.2 tab Che dữ liệu',
    fromRoute: '/security/policies/mask',
    values: 'Che toàn bộ · Giữ 4 ký tự cuối · Giữ ký tự đầu · Che phần trước @ · Băm một chiều · Trả về rỗng · Thay bằng hằng số · Chỉ giữ tỉnh/thành',
    uses: [{ menu: '5.2 Chính sách truy cập', route: '/security/policies/mask', how: '⭐ Sinh ra chính sách che tự động cho toàn bộ cột mang nhãn, không phải khai từng cột' }],
  }),
  F({
    key: 'tag.sensitivity', label: 'Mức nhạy cảm', group: 'Phân loại và bảo mật', required: true,
    desc: 'Mức độ nhạy cảm của loại dữ liệu mang nhãn này.',
    origin: 'const', from: 'Danh sách cố định 3 giá trị', values: 'Cao · Trung bình · Thấp',
    uses: [
      { menu: '5.2 Chính sách truy cập', route: '/security/policies/download', how: 'Mức Cao thì cấm tải xuống, mức khác thì chỉ ghi nhật ký' },
      { menu: '5.5 Giám sát truy cập', route: '/security/report', how: 'Bật cảnh báo truy cập bất thường cho nhãn mức Cao' },
    ],
  }),
  F({
    key: 'confidentiality', label: 'Mức phân loại bảo mật', group: 'Phân loại và bảo mật', required: true,
    desc: 'Trục phân loại độc lập với nhãn dữ liệu nhạy cảm — áp cho bảng, cột, báo cáo và kênh.',
    origin: 'const', from: '4 mức cố định theo GĐ4 mục 3, quy tắc mặc định của từng mức khai tại menu 2.2',
    fromRoute: '/governance/classification',
    values: 'Công khai · Nội bộ · Mật · Hạn chế truy cập',
    uses: [
      { menu: '5.2 Chính sách truy cập', route: '/security/policies/download', how: 'Quy tắc hạn chế tải xuống viết theo trục này' },
      { menu: '5.3 Yêu cầu cấp quyền', route: '/security/requests/create', how: 'Giới hạn thời hạn tối đa của quyền' },
      { menu: '6.2 Vòng đời & Lưu trữ', route: '/compliance/lifecycle', how: 'Quy tắc lưu trữ và xóa áp theo mức phân loại' },
    ],
  }),

  /* ─────────────── ⑧ QUAN HỆ LUỒNG DỮ LIỆU (menu 2.3) ─────────────── */
  F({
    key: 'lineage.level', label: 'Mức truy vết', group: 'Quan hệ luồng dữ liệu (lineage)', required: true,
    desc: 'Quan hệ này được ghi nhận ở mức chi tiết nào.',
    origin: 'const', from: '4 mức cố định theo GĐ2 mục 5.7', values: 'Hệ thống · Bảng · Cột · Nghiệp vụ',
    uses: [{ menu: '2.3 Truy vết luồng dữ liệu', route: '/governance/lineage', how: 'Chọn mức để đổi cách vẽ bản đồ luồng dữ liệu' }],
  }),
  F({
    key: 'lineage.source', label: 'Nguồn thu thập', group: 'Quan hệ luồng dữ liệu (lineage)',
    desc: 'Quan hệ này do hệ thống tự phát hiện hay do người khai tay.',
    origin: 'derived', from: 'Hệ thống tự xác định: phân tích câu SQL của job (menu 4.1) · đọc cấu hình cửa nạp (menu 4.2) · hoặc do người dùng khai tại menu 2.3',
    values: 'Tự động — phân tích SQL · Tự động — cấu hình cửa nạp · Khai báo thủ công',
    uses: [{ menu: '2.4 Phê duyệt & Phiên bản', route: '/governance/approvals', how: '⭐ Quan hệ Khai báo thủ công BẮT BUỘC qua phê duyệt; quan hệ tự động thì không cần' }],
  }),
  F({
    key: 'lineage.transform', label: 'Bước biến đổi chính', group: 'Quan hệ luồng dữ liệu (lineage)', required: true,
    desc: 'Dữ liệu bị biến đổi thế nào khi đi từ nguồn sang đích.',
    origin: 'declare', from: 'Trích tự động từ câu SQL của job nếu phát hiện được; người khai tay điền khi khai báo thủ công tại menu 2.3',
    fromRoute: '/governance/lineage/create',
    uses: [{ menu: '2.4 Phê duyệt & Phiên bản', route: '/governance/approvals', how: '⭐ Là trường người duyệt đọc kỹ nhất — mô tả chung chung thì bị trả về Yêu cầu chỉnh sửa' }],
  }),

  /* ─────────────── ⑨ CHẤT LƯỢNG DỮ LIỆU (menu 3.x) ─────────────── */
  F({
    key: 'ruleType.dimension', label: 'Chiều chất lượng', group: 'Chất lượng dữ liệu', required: true,
    desc: 'Loại kiểm tra này thuộc chiều chất lượng nào trong 6 chiều.',
    origin: 'const', from: '6 chiều cố định theo GĐ3 mục 3',
    values: 'Đầy đủ · Hợp lệ · Nhất quán · Không trùng lặp · Chính xác · Kịp thời',
    uses: [
      { menu: '3.2 Luật & Kết quả', route: '/quality/board', how: 'Tính điểm theo từng chiều — điểm bảng là trung bình các chiều CÓ luật' },
      { menu: '8.2 Cấu hình hệ thống', route: '/operations/settings', how: 'Điều kiện bắt buộc của Tier 1 là phủ đủ 4 chiều' },
    ],
  }),
  F({
    key: 'ruleType.defaultWarn', label: 'Ngưỡng mặc định của loại luật', group: 'Chất lượng dữ liệu', required: true,
    desc: 'Ngưỡng dùng khi gán luật mà không khai ngưỡng riêng.',
    origin: 'declare', from: 'Khai khi tạo loại kiểm tra tại menu 3.1', fromRoute: '/quality/rules/create',
    values: '⚠️ Nếu loại luật chưa khai ngưỡng thì lấy tham số toàn cục nguong_canh_bao_mac_dinh tại menu 8.2',
    uses: [{ menu: '3.2 Luật & Kết quả', route: '/quality/assign', how: 'Là cấp ③ trong ngưỡng ba cấp: lần gán → bảng → loại luật' }],
  }),
  F({
    key: 'rule.thresholdSource', label: 'Nguồn ngưỡng', group: 'Chất lượng dữ liệu',
    desc: 'Ngưỡng đang áp cho luật này lấy từ cấp nào.',
    origin: 'derived', from: 'Hệ thống chọn theo thứ tự ưu tiên: ngưỡng khai ở lần gán → ngưỡng của bảng theo Tier → ngưỡng mặc định của loại luật (menu 3.1) → tham số toàn cục (menu 8.2)',
    values: 'Theo lần gán · Theo bảng · Toàn cục',
    uses: [{ menu: '3.2 Luật & Kết quả', route: '/quality/board', how: 'Giải thích vì sao hai luật cùng loại lại có ngưỡng khác nhau' }],
  }),
  F({
    key: 'rule.trigger', label: 'Cách kích hoạt', group: 'Chất lượng dữ liệu', required: true,
    desc: 'Luật được chạy khi nào.',
    origin: 'const', from: '3 cách cố định theo GĐ3 · FR-02', values: 'Theo lịch · Theo sự kiện · Thủ công',
    uses: [{ menu: '4.1 Luồng xử lý', route: '/orchestration/jobs', how: '⭐ Kiểu Theo sự kiện chạy ngay sau khi job sinh ra bảng đích kết thúc thành công' }],
  }),
  F({
    key: 'rule.blockDownstream', label: 'Chặn job hạ nguồn', group: 'Chất lượng dữ liệu',
    desc: 'Khi luật hỏng thì có chặn job đọc bảng này chạy hay không.',
    origin: 'declare', from: 'Chọn ở bước Hành động khi hỏng khi gán luật tại menu 3.2', fromRoute: '/quality/assign',
    values: '⚠️ Chỉ bật được khi bảng đạt mức Tier khai ở tham số bat_cong_chan_tu_tier tại menu 8.2',
    uses: [{ menu: '4.3 Theo dõi & Pipeline', route: '/orchestration/monitor', how: 'Job hạ nguồn chuyển sang trạng thái Bị chặn thay vì chạy trên dữ liệu xấu' }],
  }),
  F({
    key: 'rule.lastScore', label: 'Điểm luật', group: 'Chất lượng dữ liệu',
    desc: 'Tỷ lệ bản ghi đạt yêu cầu ở lần chạy gần nhất.',
    origin: 'derived', from: '(Số bản ghi kiểm tra − số bản ghi lỗi) ÷ số bản ghi kiểm tra × 100, lấy từ lần chạy gần nhất',
    uses: [
      { menu: '1.2 Bảng dữ liệu', route: '/catalog/tables', how: 'Cộng dồn thành điểm chất lượng của bảng' },
      { menu: '3.4 Sự cố chất lượng', route: '/quality/incidents', how: 'Dưới ngưỡng nghiêm trọng thì sinh sự cố tự động' },
    ],
  }),
  F({
    key: 'incident.assignee', label: 'Người xử lý sự cố', group: 'Chất lượng dữ liệu',
    desc: 'Người chịu trách nhiệm khắc phục lỗi dữ liệu.',
    origin: 'derived', from: '⭐ Hệ thống TỰ GÁN theo đầu mối của bảng khai ở menu 1.1: lỗi nghiệp vụ gán cho BDA, lỗi kỹ thuật gán cho DE. Bảng chưa có đầu mối thì để trống và cảnh báo',
    fromRoute: '/catalog/tables',
    uses: [{ menu: '3.4 Sự cố chất lượng', route: '/quality/incidents', how: '⭐ Nguyên tắc bốn mắt — người xử lý KHÔNG được tự đóng sự cố mình xử lý' }],
  }),
  F({
    key: 'incident.dueAt', label: 'Hạn xử lý sự cố', group: 'Chất lượng dữ liệu',
    desc: 'Thời hạn phải khắc phục xong.',
    origin: 'derived', from: 'Thời điểm phát hiện cộng với cam kết xử lý của Tier bảng, khai tại menu 8.2 (Tier 1: 24 giờ · Tier 2: 72 giờ)',
    fromRoute: '/operations/settings',
    uses: [{ menu: '3.5 Cảnh báo', route: '/quality/alerts', how: 'Quá hạn thì kích hoạt quy tắc cảnh báo Sự cố quá hạn chưa xử lý' }],
  }),
  F({
    key: 'incident.recheck', label: 'Kết quả kiểm tra lại', group: 'Chất lượng dữ liệu',
    desc: 'Kết quả chạy lại luật sau khi người xử lý báo đã khắc phục.',
    origin: 'derived', from: 'Hệ thống tự chạy lại đúng luật đã sinh ra sự cố, ngay sau khi phiếu chuyển sang trạng thái Chờ kiểm tra lại',
    uses: [{ menu: '3.4 Sự cố chất lượng', route: '/quality/incidents', how: '⭐ Không đạt thì phiếu QUAY LẠI trạng thái phân công, không cho đóng (GĐ3 mục 6)' }],
  }),

  /* ─────────────── ⑩ JOB VÀ CỬA NẠP (menu 4.x) ─────────────── */
  F({
    key: 'job.targetTable', label: 'Bảng đích của job', group: 'Job và tiến trình xử lý', required: true,
    desc: 'Bảng mà job ghi kết quả vào.',
    origin: 'ref', from: 'Danh mục bảng tại menu 1.1', fromRoute: '/catalog/tables',
    values: '⚠️ Ràng buộc RB2 — chỉ chọn được bảng đã có trong danh mục. Bảng chưa khai thì job không lưu được',
    uses: [
      { menu: '1.2 Bảng dữ liệu', route: '/catalog/tables', how: 'Trường Sinh ra bởi job của bảng đích được suy ngược từ đây' },
      { menu: '2.3 Truy vết luồng dữ liệu', route: '/governance/lineage', how: 'Sinh quan hệ bảng nguồn → job → bảng đích' },
    ],
  }),
  F({
    key: 'job.sourceTables', label: 'Bảng nguồn của job', group: 'Job và tiến trình xử lý',
    desc: 'Các bảng mà job đọc dữ liệu từ đó.',
    origin: 'auto', from: '⭐ Bộ phân tích câu SQL tự dò tên bảng trong mệnh đề FROM và JOIN của từng bước. Bảng tạm khai bằng CREATE TEMP VIEW thì KHÔNG dò được, phải khai tay tại menu 2.3',
    fromRoute: '/governance/lineage/create',
    uses: [{ menu: '2.3 Truy vết luồng dữ liệu', route: '/governance/lineage', how: 'Nguồn chính của quan hệ luồng dữ liệu mức bảng' }],
  }),
  F({
    key: 'job.slaTime', label: 'Giờ cam kết của job', group: 'Job và tiến trình xử lý',
    desc: 'Job phải chạy xong trước mấy giờ.',
    origin: 'declare', from: 'Đầu mối kỹ thuật khai tay tại menu 4.1', fromRoute: '/orchestration/jobs/create',
    values: 'Nên đặt sớm hơn Thời gian dữ liệu sẵn sàng của báo cáo dùng bảng đích (menu 1.3)',
    uses: [{ menu: '3.2 Luật & Kết quả', route: '/quality/board', how: 'Là tham số của luật Dữ liệu về đúng giờ cam kết trên bảng đích' }],
  }),
  F({
    key: 'job.lineageScan', label: 'Bật quét nguồn gốc', group: 'Job và tiến trình xử lý',
    desc: 'Có cho phép hệ thống phân tích câu SQL của job để sinh quan hệ luồng dữ liệu không.',
    origin: 'declare', from: 'Chọn khi tạo job tại menu 4.1; mặc định BẬT theo tham số bat_quet_lineage_mac_dinh tại menu 8.2',
    fromRoute: '/operations/settings',
    values: '⚠️ Bảng đích là Tier 1 thì bắt buộc bật, không tắt được',
    uses: [{ menu: '8.1 Sức khoẻ dữ liệu', route: '/operations/health', how: 'Chỉ số Độ phủ quan hệ luồng dữ liệu' }],
  }),
  F({
    key: 'ingest.gateMode', label: 'Mức xử lý của cổng chất lượng', group: 'Job và tiến trình xử lý',
    desc: 'Làm gì khi lô dữ liệu nạp vào vi phạm luật kiểm tại cửa.',
    origin: 'declare', from: 'Chọn khi tạo mẫu nạp tại menu 4.2', fromRoute: '/ingestion/templates/create',
    values: 'Chặn cả lô · Tách dòng lỗi · Chỉ cảnh báo',
    uses: [{ menu: '4.2 Vùng chờ', route: '/ingestion/quarantine', how: 'Quyết định lô bị giữ toàn bộ hay chỉ giữ dòng lỗi' }],
  }),
  F({
    key: 'ingest.gateRules', label: 'Luật kiểm tại cửa', group: 'Job và tiến trình xử lý',
    desc: 'Các luật chất lượng chạy trước khi dữ liệu vào bảng đích.',
    origin: 'ref', from: 'Thư viện loại kiểm tra tại menu 3.1', fromRoute: '/quality/rules',
    uses: [{ menu: '4.2 Vùng chờ', route: '/ingestion/quarantine', how: 'Luật nào hỏng thì hiện ở cột Vì sao bị giữ' }],
  }),

  /* ─────────────── ⑪ BẢO MẬT (menu 5.x) ─────────────── */
  F({
    key: 'user.account', label: 'Tài khoản', group: 'Người dùng và phân quyền',
    desc: 'Tên đăng nhập của người dùng.',
    origin: 'auto', from: 'Đồng bộ từ hệ thống quản lý người dùng tập trung (AD) — DMP không tự tạo tài khoản',
    uses: [{ menu: '5.4 Nhật ký kiểm toán', route: '/security/audit', how: 'Ghi nhận ai thực hiện hành động' }],
  }),
  F({
    key: 'user.role', label: 'Vai trò', group: 'Người dùng và phân quyền', required: true,
    desc: 'Vai trò của người dùng trong mô hình trách nhiệm quản trị dữ liệu.',
    origin: 'const', from: '5 vai trò cố định theo GĐ1 mục 2.3, gán tại menu 5.1', fromRoute: '/security/users',
    values: 'Người sở hữu dữ liệu · Đầu mối nghiệp vụ · Đầu mối kỹ thuật · Đơn vị vận hành hệ thống · Người sử dụng dữ liệu',
    uses: [
      { menu: '1.2 Bảng dữ liệu', route: '/catalog/tables/create', how: 'Lọc danh sách chọn khi gán người phụ trách cho bảng' },
      { menu: '5.1 Nhóm & Quyền menu', route: '/security/users', how: 'Ma trận Menu × Vai trò quyết định vào được màn nào' },
    ],
  }),
  F({
    key: 'user.tableGrants', label: 'Số bảng có quyền', group: 'Người dùng và phân quyền',
    desc: 'Tổng số bảng mà người dùng đọc được, gồm quyền trực tiếp và quyền kế thừa từ nhóm.',
    origin: 'derived', from: 'Gộp mọi chính sách tại menu 5.2 áp cho người này hoặc cho nhóm mà người này thuộc về, rồi đếm số bảng phân biệt',
    fromRoute: '/security/policies/data',
    uses: [{ menu: '5.5 Báo cáo quyền', route: '/security/report', how: 'Đối chiếu với lịch sử sử dụng để đề xuất thu hồi quyền thừa' }],
  }),
  F({
    key: 'user.employed', label: 'Trạng thái nhân sự', group: 'Người dùng và phân quyền',
    desc: 'Người dùng còn làm việc tại tổ chức hay đã nghỉ.',
    origin: 'auto', from: 'Đồng bộ hằng ngày từ hệ thống nhân sự — DMP không tự khai',
    uses: [{ menu: '5.5 Giám sát truy cập', route: '/security/report', how: '⭐ Đã nghỉ mà tài khoản chưa khoá thì sinh cảnh báo mức Nghiêm trọng' }],
  }),
  F({
    key: 'policy.scopeLevel', label: 'Cấp phạm vi chính sách', group: 'Người dùng và phân quyền', required: true,
    desc: 'Chính sách áp ở cấp nào — càng rộng càng khó kiểm soát.',
    origin: 'const', from: '6 cấp cố định', values: 'Toàn hệ thống · Miền · Nhóm bảng · Bảng · Cột · Nhãn',
    uses: [{ menu: '5.2 Chính sách truy cập', route: '/security/policies/by-tag', how: 'Quyết định thứ tự ưu tiên khi nhiều chính sách cùng áp lên một người' }],
  }),
  F({
    key: 'policy.expiry', label: 'Thời hạn quyền', group: 'Người dùng và phân quyền', required: true,
    desc: 'Quyền có hiệu lực đến khi nào.',
    origin: 'derived', from: 'Do người duyệt chọn tại menu 5.3, giới hạn tối đa theo mức phân loại của đối tượng — tham số thoi_han_quyen_toi_da_* tại menu 8.2',
    fromRoute: '/operations/settings',
    values: '⚠️ Không có lựa chọn Vô thời hạn với dữ liệu mức Mật trở lên',
    uses: [{ menu: '5.5 Báo cáo quyền', route: '/security/report', how: 'Hết hạn thì hệ thống tự thu hồi và ghi nhật ký' }],
  }),
  F({
    key: 'policy.source', label: 'Nguồn chính sách', group: 'Người dùng và phân quyền',
    desc: 'Chính sách này được tạo ra bằng con đường nào.',
    origin: 'derived', from: 'Hệ thống tự ghi khi tạo chính sách',
    values: 'Yêu cầu cấp quyền (có mã YC truy ngược được) · Kế thừa nhãn · Đồng bộ AD · Thủ công',
    uses: [{ menu: '6.3 Đánh giá tuân thủ', route: '/compliance/assessments', how: '⭐ Chính sách nguồn Thủ công không truy được lý do cấp — là phát hiện không phù hợp khi kiểm toán' }],
  }),
  F({
    key: 'audit.decidedBy', label: 'Chính sách quyết định', group: 'Người dùng và phân quyền',
    desc: 'Căn cứ nào cho phép hoặc từ chối hành động này.',
    origin: 'derived', from: '⭐ Cổng truy vấn ghi lại mã chính sách tại menu 5.2 đã được áp dụng khi quyết định cho phép hay từ chối',
    fromRoute: '/security/policies/data',
    uses: [{ menu: '6.3 Đánh giá tuân thủ', route: '/compliance/assessments', how: 'Là bằng chứng trả lời câu hỏi kiểm toán "căn cứ nào cho người này xem bảng đó"' }],
  }),
  F({
    key: 'anomaly.threshold', label: 'Ngưỡng phát hiện bất thường', group: 'Người dùng và phân quyền',
    desc: 'Vượt mức nào thì coi là truy cập bất thường.',
    origin: 'ref', from: 'Tham số nguong_tai_xuong_canh_bao và các ngưỡng khác khai tại menu 8.2', fromRoute: '/operations/settings',
    uses: [{ menu: '5.5 Giám sát truy cập', route: '/security/report', how: 'So sánh với giá trị đo được để sinh cảnh báo' }],
  }),

  /* ─────────────── ⑫ CHÍNH SÁCH & TUÂN THỦ (menu 6.x) ─────────────── */
  F({
    key: 'dataPolicy.controls', label: 'Yêu cầu kiểm soát', group: 'Chính sách và tuân thủ', required: true,
    desc: 'Các điều khoản cụ thể mà chính sách bắt buộc phải đạt.',
    origin: 'declare', from: 'Đơn vị ban hành khai tay tại menu 6.1', fromRoute: '/compliance/policies/create',
    values: '⚠️ Phải viết ở dạng ĐO ĐƯỢC để hệ thống chấm tự động — ví dụ "Mọi bảng Tier 1 phải có Người sở hữu dữ liệu"',
    uses: [{ menu: '6.3 Đánh giá tuân thủ', route: '/compliance/assessments', how: 'Mỗi yêu cầu kiểm soát thành một mục trong checklist đánh giá' }],
  }),
  F({
    key: 'dataPolicy.compliancePct', label: 'Mức tuân thủ chính sách', group: 'Chính sách và tuân thủ',
    desc: 'Tỷ lệ đối tượng trong phạm vi đạt yêu cầu của chính sách.',
    origin: 'derived', from: 'Số mục checklist Đạt ÷ tổng số mục có áp dụng của chính sách đó, lấy từ kỳ đánh giá gần nhất tại menu 6.3',
    fromRoute: '/compliance/assessments',
    uses: [{ menu: '8.1 Sức khoẻ dữ liệu', route: '/operations/health', how: 'Cộng dồn thành điểm tuân thủ toàn hệ thống' }],
  }),
  F({
    key: 'lifecycle.retentionMonths', label: 'Thời gian lưu trữ', group: 'Chính sách và tuân thủ', required: true,
    desc: 'Tổng thời gian phải giữ dữ liệu trước khi được xóa.',
    origin: 'declare', from: 'Ban Pháp chế khai tay tại menu 6.2, kèm căn cứ pháp lý', fromRoute: '/compliance/lifecycle',
    uses: [{ menu: '4.1 Luồng xử lý', route: '/orchestration/jobs', how: 'Job dọn dữ liệu đọc quy tắc này để biết xóa gì, khi nào' }],
  }),
  F({
    key: 'assessment.evidence', label: 'Bằng chứng', group: 'Chính sách và tuân thủ', required: true,
    desc: 'Căn cứ để kết luận mục kiểm tra đạt hay không đạt.',
    origin: 'derived', from: '⭐ Trỏ trực tiếp tới số liệu trong hệ thống — ví dụ "Danh mục bảng: 7.578/11.482 bảng chưa có người phụ trách". KHÔNG phải ảnh chụp màn hình rời rạc',
    uses: [{ menu: '6.3 Đánh giá tuân thủ', route: '/compliance/assessments', how: 'Là hồ sơ trả lời kiểm toán, lưu 5 năm theo quy tắc vòng đời VD-04' }],
  }),

  /* ─────────────── ⑬ DỮ LIỆU CHỦ (menu 7.x) ─────────────── */
  F({
    key: 'mdm.matchKeys', label: 'Khóa so khớp', group: 'Dữ liệu chủ', required: true,
    desc: 'Trường hoặc tổ hợp trường dùng để nhận ra hai bản ghi là cùng một đối tượng.',
    origin: 'declare', from: 'Người sở hữu dữ liệu chủ khai khi thiết kế mô hình tại menu 7.1', fromRoute: '/mdm/models/create',
    uses: [{ menu: '7.3 Nghi ngờ trùng', route: '/mdm/duplicates', how: '⭐ Là cơ sở tính Điểm khớp — không khai khóa thì không phát hiện được trùng' }],
  }),
  F({
    key: 'mdm.survivorship', label: 'Quy tắc chọn giá trị khi hợp nhất', group: 'Dữ liệu chủ', required: true,
    desc: 'Khi các nguồn có giá trị khác nhau cho cùng một thuộc tính thì lấy của nguồn nào.',
    origin: 'declare', from: 'Người sở hữu dữ liệu chủ khai tại menu 7.1', fromRoute: '/mdm/models/create',
    uses: [{ menu: '7.4 Bản ghi chuẩn', route: '/mdm/golden', how: 'Quyết định giá trị chuẩn của từng thuộc tính trong Golden Record' }],
  }),
  F({
    key: 'mdm.duplicateScore', label: 'Điểm khớp', group: 'Dữ liệu chủ',
    desc: 'Mức độ tương đồng giữa hai bản ghi nghi ngờ trùng.',
    origin: 'derived', from: 'Hệ thống tính theo khóa so khớp khai ở menu 7.1: khóa định danh trùng tính điểm cao, thuộc tính tương đồng tính điểm theo tỷ lệ giống nhau sau khi chuẩn hoá',
    fromRoute: '/mdm/models',
    values: '≥ 95% đề xuất hợp nhất · 85–94% cần người xem xét · 70–84% nghi ngờ · dưới 70% không đưa vào danh sách',
    uses: [{ menu: '7.3 Nghi ngờ trùng', route: '/mdm/duplicates', how: 'Xếp thứ tự ưu tiên xem xét' }],
  }),
  F({
    key: 'mdm.goldenCode', label: 'Mã bản ghi chuẩn', group: 'Dữ liệu chủ',
    desc: 'Mã duy nhất của bản ghi chuẩn, dùng chung cho mọi hệ thống.',
    origin: 'derived', from: 'Sinh theo quy tắc sinh mã chuẩn khai tại menu 7.1', fromRoute: '/mdm/models',
    uses: [{ menu: '7.4 Phân phối', route: '/mdm/golden', how: '⭐ Là mã mà mọi hệ thống phải dùng thay cho mã riêng của mình' }],
  }),

  /* ─────────────── ⑭ CẤU HÌNH HỆ THỐNG (menu 8.2) ─────────────── */
  F({
    key: 'config.namingRule', label: 'Chuẩn đặt tên', group: 'Cấu hình hệ thống', required: true,
    desc: 'Biểu thức chính quy mà tên đối tượng phải khớp.',
    origin: 'declare', from: 'Đơn vị vận hành hệ thống khai tại menu 8.2', fromRoute: '/operations/settings',
    uses: [{ menu: '1.2 Bảng dữ liệu', route: '/catalog/tables/create', how: '⭐ Là CỔNG CHẶN — tên sai chuẩn thì không lưu được, không phải chỉ cảnh báo' }],
  }),
  F({
    key: 'config.tierDefinition', label: 'Định nghĩa mức quan trọng', group: 'Cấu hình hệ thống', required: true,
    desc: 'Tiêu chí phân loại Tier và điều kiện bắt buộc của từng mức.',
    origin: 'declare', from: 'Đơn vị vận hành hệ thống khai tại menu 8.2', fromRoute: '/operations/settings',
    uses: [
      { menu: '1.2 Bảng dữ liệu', route: '/catalog/tables/create', how: 'Quyết định trường nào bắt buộc điền' },
      { menu: '3.4 Sự cố chất lượng', route: '/quality/incidents', how: 'Cam kết thời gian xử lý sự cố' },
    ],
  }),
  F({
    key: 'config.blockGateFromTier', label: 'Bật cổng chặn từ mức nào', group: 'Cấu hình hệ thống',
    desc: 'Từ mức Tier nào trở lên thì cho phép bật cổng chặn dữ liệu xấu.',
    origin: 'declare', from: 'Tham số bat_cong_chan_tu_tier khai tại menu 8.2', fromRoute: '/operations/settings',
    values: '⚠️ Đặt quá rộng ngay từ đầu sẽ khiến người dùng không khai được gì và quay lưng với hệ thống',
    uses: [
      { menu: '3.2 Luật & Kết quả', route: '/quality/assign', how: 'Quyết định có bật được Chặn job hạ nguồn không' },
      { menu: '4.2 Cửa nạp dữ liệu', route: '/ingestion/templates', how: 'Quyết định có bật được cổng chất lượng tại cửa không' },
    ],
  }),
]

export const FIELD_MAP: Record<string, FieldDef> = Object.fromEntries(FIELDS.map(f => [f.key, f]))

export const fieldOf = (key?: string) => (key ? FIELD_MAP[key] : undefined)

/** Nhóm đối tượng theo GĐ2 mục 3 — dùng để nhóm ở màn Tiêu chuẩn thông tin mô tả */
export const FIELD_GROUPS = Array.from(new Set(FIELDS.map(f => f.group)))

/** Thống kê để hiển thị ở màn 2.5 */
export const fieldStats = () => ({
  total: FIELDS.length,
  byOrigin: (Object.keys(ORIGIN_LABEL) as OriginKind[]).map(k => ({
    kind: k, label: ORIGIN_LABEL[k], count: FIELDS.filter(f => f.origin === k).length,
  })),
  required: FIELDS.filter(f => f.required).length,
  withUses: FIELDS.filter(f => f.uses.length > 0).length,
  orphan: FIELDS.filter(f => f.uses.length === 0).length,
})
