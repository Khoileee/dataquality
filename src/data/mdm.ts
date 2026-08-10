import type { MdmModel, MdmSourceRecord, MdmDuplicate, GoldenRecord, DistributionChannel } from './types'

/* ═══════════════ 7.1 Mô hình dữ liệu chủ ═══════════════ */

export const mdmModels: MdmModel[] = [
  {
    id: 'MDM-KH', name: 'Khách hàng chuẩn', entity: 'Khách hàng',
    codeRule: 'KH + 10 chữ số tuần tự — ví dụ KH0000001284',
    matchKeys: ['so_cccd', 'so_dien_thoai + ho_ten', 'ma_khach_hang_nguon'],
    survivorship: 'Ưu tiên hệ thống CRM > Core thanh toán > CRM cũ; trường rỗng lấy từ nguồn kế tiếp',
    owner: 'Phạm Thu Hà', steward: 'Nguyễn Thị Phương',
    sourceSystems: ['HT-01', 'HT-02', 'HT-08', 'HT-10'],
    goldenCount: 1_284_500, sourceCount: 8_412_907, duplicatePending: 3_182, approval: 'Đã phê duyệt',
    attributes: [
      { name: 'ma_kh_chuan', label: 'Mã khách hàng chuẩn', type: 'string(12)', required: true, identity: true, standardRule: 'Sinh theo quy tắc mã chuẩn', confidentiality: 'Nội bộ' },
      { name: 'ho_ten', label: 'Họ và tên', type: 'string(120)', required: true, identity: false, standardRule: 'Viết hoa chữ cái đầu, bỏ khoảng trắng thừa, bỏ dấu tiếng Việt khi so khớp', confidentiality: 'Mật' },
      { name: 'so_cccd', label: 'Số căn cước', type: 'string(12)', required: true, identity: true, standardRule: 'Đúng 12 chữ số; CMND 9 số chuyển đổi theo bảng tra', confidentiality: 'Hạn chế truy cập' },
      { name: 'so_dien_thoai', label: 'Số điện thoại', type: 'string(15)', required: true, identity: true, standardRule: 'Chuẩn hoá về dạng 84XXXXXXXXX', confidentiality: 'Hạn chế truy cập' },
      { name: 'ngay_sinh', label: 'Ngày sinh', type: 'date', required: false, identity: false, standardRule: 'Định dạng ISO yyyy-MM-dd', confidentiality: 'Mật' },
      { name: 'dia_chi', label: 'Địa chỉ', type: 'string(255)', required: false, identity: false, standardRule: 'Chuẩn hoá tỉnh/thành theo danh mục DM-001', confidentiality: 'Mật' },
      { name: 'email', label: 'Thư điện tử', type: 'string(120)', required: false, identity: false, standardRule: 'Chuyển về chữ thường', confidentiality: 'Mật' },
      { name: 'trang_thai', label: 'Trạng thái', type: 'string(20)', required: true, identity: false, standardRule: 'Thuộc tập ACTIVE/INACTIVE/CLOSED', confidentiality: 'Nội bộ' },
    ],
  },
  {
    id: 'MDM-SP', name: 'Sản phẩm chuẩn', entity: 'Sản phẩm/Dịch vụ',
    codeRule: 'SP + nhóm 2 ký tự + 4 chữ số — ví dụ SPTT0042',
    matchKeys: ['ma_san_pham_nguon', 'ten_san_pham + nhom'],
    survivorship: 'Ưu tiên hệ thống quản lý sản phẩm; giá lấy từ bản ghi mới nhất',
    owner: 'Lê Minh Tuấn', steward: 'Lê Minh Tuấn',
    sourceSystems: ['HT-01', 'HT-03'],
    goldenCount: 1_284, sourceCount: 1_842, duplicatePending: 42, approval: 'Đã phê duyệt',
    attributes: [
      { name: 'ma_sp_chuan', label: 'Mã sản phẩm chuẩn', type: 'string(8)', required: true, identity: true, standardRule: 'Sinh theo quy tắc mã chuẩn', confidentiality: 'Công khai' },
      { name: 'ten_san_pham', label: 'Tên sản phẩm', type: 'string(200)', required: true, identity: false, standardRule: 'Bỏ khoảng trắng thừa, chuẩn hoá viết hoa', confidentiality: 'Công khai' },
      { name: 'nhom_san_pham', label: 'Nhóm sản phẩm', type: 'string(50)', required: true, identity: false, standardRule: 'Thuộc danh mục nhóm sản phẩm', confidentiality: 'Công khai' },
      { name: 'don_vi_tinh', label: 'Đơn vị tính', type: 'string(20)', required: true, identity: false, standardRule: 'Thuộc danh mục đơn vị tính', confidentiality: 'Công khai' },
      { name: 'trang_thai', label: 'Trạng thái', type: 'string(20)', required: true, identity: false, standardRule: 'ACTIVE/STOPPED', confidentiality: 'Công khai' },
    ],
  },
  {
    id: 'MDM-DV', name: 'Đơn vị tổ chức chuẩn', entity: 'Đơn vị/Tổ chức',
    codeRule: 'DV + 5 chữ số theo cây tổ chức',
    matchKeys: ['ma_don_vi_nguon', 'ten_don_vi'],
    survivorship: 'Ưu tiên hệ thống nhân sự; cấu trúc cây lấy từ hệ thống kế toán',
    owner: 'Phạm Thu Hà', steward: 'Phạm Thu Hà',
    sourceSystems: ['HT-05', 'HT-01'],
    goldenCount: 128, sourceCount: 186, duplicatePending: 6, approval: 'Chờ phê duyệt',
    attributes: [
      { name: 'ma_dv_chuan', label: 'Mã đơn vị chuẩn', type: 'string(7)', required: true, identity: true, standardRule: 'Sinh theo cây tổ chức', confidentiality: 'Nội bộ' },
      { name: 'ten_don_vi', label: 'Tên đơn vị', type: 'string(150)', required: true, identity: false, standardRule: 'Theo quyết định thành lập', confidentiality: 'Nội bộ' },
      { name: 'don_vi_cha', label: 'Đơn vị cấp trên', type: 'string(7)', required: false, identity: false, standardRule: 'Tham chiếu mã đơn vị chuẩn', confidentiality: 'Nội bộ' },
      { name: 'loai_don_vi', label: 'Loại đơn vị', type: 'string(30)', required: true, identity: false, standardRule: 'Khối/Ban/Phòng/Đội', confidentiality: 'Nội bộ' },
    ],
  },
  {
    id: 'MDM-DM', name: 'Danh mục dùng chung', entity: 'Danh mục dùng chung',
    codeRule: 'Theo từng danh mục — kế thừa menu 1.5',
    matchKeys: ['ma_danh_muc + ma_gia_tri'],
    survivorship: 'Danh mục tham chiếu là nguồn duy nhất',
    owner: 'Lê Minh Tuấn', steward: 'Lê Minh Tuấn',
    sourceSystems: ['HT-03'],
    goldenCount: 261, sourceCount: 261, duplicatePending: 0, approval: 'Dự thảo',
    attributes: [
      { name: 'ma_danh_muc', label: 'Mã danh mục', type: 'string(10)', required: true, identity: true, standardRule: 'Tham chiếu menu 1.5', confidentiality: 'Công khai' },
      { name: 'ma_gia_tri', label: 'Mã giá trị', type: 'string(20)', required: true, identity: true, standardRule: 'Duy nhất trong danh mục', confidentiality: 'Công khai' },
      { name: 'ten_gia_tri', label: 'Tên giá trị', type: 'string(150)', required: true, identity: false, standardRule: '—', confidentiality: 'Công khai' },
    ],
  },
]

export const mdmModelById = (id: string) => mdmModels.find(m => m.id === id)

/* ═══════════════ 7.2 Bản ghi nguồn ═══════════════ */

export const mdmSourceRecords: MdmSourceRecord[] = [
  { id: 'BN-000001', modelId: 'MDM-KH', sourceSystem: 'HT-01', sourceKey: 'KH8412001', values: { ho_ten: 'Nguyễn Văn An', so_cccd: '001088012345', so_dien_thoai: '84912345678', ngay_sinh: '1988-04-12', dia_chi: 'Số 5, Thanh Xuân, Hà Nội', email: 'an.nv@gmail.com' }, normalized: true, issues: [], goldenId: 'GR-0000012', matchScore: 100, status: 'Đã liên kết', loadedAt: '2026-08-08 02:14' },
  { id: 'BN-000002', modelId: 'MDM-KH', sourceSystem: 'HT-02', sourceKey: 'C-88120', values: { ho_ten: 'NGUYEN VAN AN', so_cccd: '001088012345', so_dien_thoai: '0912345678', ngay_sinh: '1988-04-12', dia_chi: 'Thanh Xuan, Ha Noi', email: '' }, normalized: true, issues: [], goldenId: 'GR-0000012', matchScore: 98, status: 'Đã liên kết', loadedAt: '2026-08-08 02:14' },
  { id: 'BN-000003', modelId: 'MDM-KH', sourceSystem: 'HT-10', sourceKey: 'OLD-4412', values: { ho_ten: 'Nguyễn V. An', so_cccd: '012345678', so_dien_thoai: '+84912345678', ngay_sinh: '', dia_chi: 'Hà Nội', email: 'an.nv@gmail.com' }, normalized: false, issues: ['Số căn cước 9 số — cần chuyển đổi', 'Thiếu ngày sinh'], goldenId: null, matchScore: 92, status: 'Chưa xử lý', loadedAt: '2026-08-08 02:16' },
  { id: 'BN-000004', modelId: 'MDM-KH', sourceSystem: 'HT-01', sourceKey: 'KH8412044', values: { ho_ten: 'Trần Thị Bình', so_cccd: '001190044556', so_dien_thoai: '84987654321', ngay_sinh: '1990-09-02', dia_chi: 'Quận 1, TP. Hồ Chí Minh', email: 'binh.tt@yahoo.com' }, normalized: true, issues: [], goldenId: 'GR-0000044', matchScore: 100, status: 'Đã liên kết', loadedAt: '2026-08-08 02:14' },
  { id: 'BN-000005', modelId: 'MDM-KH', sourceSystem: 'HT-08', sourceKey: 'RSK-90211', values: { ho_ten: 'Tran Thi Binh', so_cccd: '001190044556', so_dien_thoai: '0987654321', ngay_sinh: '1990-09-02', dia_chi: 'TPHCM', email: '' }, normalized: true, issues: [], goldenId: 'GR-0000044', matchScore: 96, status: 'Đã liên kết', loadedAt: '2026-08-08 02:18' },
  { id: 'BN-000006', modelId: 'MDM-KH', sourceSystem: 'HT-02', sourceKey: 'C-91044', values: { ho_ten: 'Trần Thị Bình', so_cccd: '', so_dien_thoai: '0987654321', ngay_sinh: '1990-09-02', dia_chi: 'Hồ Chí Minh', email: 'binh.tt@yahoo.com' }, normalized: true, issues: ['Thiếu số căn cước'], goldenId: null, matchScore: 88, status: 'Đã chuẩn hoá', loadedAt: '2026-08-08 02:15' },
  { id: 'BN-000007', modelId: 'MDM-KH', sourceSystem: 'HT-01', sourceKey: 'KH8412188', values: { ho_ten: 'Lê Hoàng Cường', so_cccd: '038085112233', so_dien_thoai: '84905112233', ngay_sinh: '1985-01-20', dia_chi: 'Hải Châu, Đà Nẵng', email: 'cuong.lh@congty.vn' }, normalized: true, issues: [], goldenId: 'GR-0000188', matchScore: 100, status: 'Đã liên kết', loadedAt: '2026-08-08 02:14' },
  { id: 'BN-000008', modelId: 'MDM-KH', sourceSystem: 'HT-10', sourceKey: 'OLD-8821', values: { ho_ten: 'LE HOANG CUONG', so_cccd: '038085112233', so_dien_thoai: '0905112233', ngay_sinh: '1985-01-20', dia_chi: 'Da Nang', email: '' }, normalized: true, issues: ['Bản ghi từ hệ thống đã ngừng sử dụng'], goldenId: 'GR-0000188', matchScore: 97, status: 'Đã liên kết', loadedAt: '2026-08-08 02:16' },
  { id: 'BN-000009', modelId: 'MDM-KH', sourceSystem: 'HT-02', sourceKey: 'C-77120', values: { ho_ten: 'Phạm Minh Đức', so_cccd: '001092778899', so_dien_thoai: '84936778899', ngay_sinh: '1992-07-15', dia_chi: 'Cầu Giấy, Hà Nội', email: 'duc.pm@outlook.com' }, normalized: true, issues: [], goldenId: null, matchScore: null, status: 'Đã chuẩn hoá', loadedAt: '2026-08-09 02:14' },
  { id: 'BN-000010', modelId: 'MDM-KH', sourceSystem: 'HT-01', sourceKey: 'KH8412901', values: { ho_ten: 'Test User', so_cccd: '000000000000', so_dien_thoai: '0000000000', ngay_sinh: '2000-01-01', dia_chi: 'test', email: 'test@test' }, normalized: false, issues: ['Nghi ngờ dữ liệu thử nghiệm'], goldenId: null, matchScore: null, status: 'Loại trừ', loadedAt: '2026-08-09 02:14' },
  { id: 'BN-000011', modelId: 'MDM-SP', sourceSystem: 'HT-01', sourceKey: 'P-0042', values: { ten_san_pham: 'Chuyển tiền nhanh 24/7', nhom_san_pham: 'Thanh toán', don_vi_tinh: 'Giao dịch', trang_thai: 'ACTIVE' }, normalized: true, issues: [], goldenId: 'GR-SP0042', matchScore: 100, status: 'Đã liên kết', loadedAt: '2026-08-05 04:00' },
  { id: 'BN-000012', modelId: 'MDM-SP', sourceSystem: 'HT-03', sourceKey: 'SP42', values: { ten_san_pham: 'Chuyen tien nhanh 24/7', nhom_san_pham: 'Thanh toan', don_vi_tinh: 'GD', trang_thai: 'ACTIVE' }, normalized: false, issues: ['Tên không dấu', 'Đơn vị tính viết tắt'], goldenId: null, matchScore: 94, status: 'Chưa xử lý', loadedAt: '2026-08-05 04:00' },
]

export const sourceRecordById = (id: string) => mdmSourceRecords.find(r => r.id === id)

/* ═══════════════ 7.3 Nghi ngờ trùng ═══════════════ */

export const mdmDuplicates: MdmDuplicate[] = [
  { id: 'NT-0001', modelId: 'MDM-KH', score: 92, reason: 'Trùng số căn cước sau khi chuyển đổi CMND 9 số → CCCD 12 số; họ tên tương đồng 88%', records: ['BN-000001', 'BN-000003'], status: 'Chưa xem xét', reviewer: null, decidedAt: null, note: null },
  { id: 'NT-0002', modelId: 'MDM-KH', score: 88, reason: 'Trùng số điện thoại và ngày sinh; bản ghi nguồn thiếu số căn cước', records: ['BN-000004', 'BN-000006'], status: 'Đang xem xét', reviewer: 'Nguyễn Thị Phương', decidedAt: null, note: 'Đang chờ CRM bổ sung số căn cước để xác nhận' },
  { id: 'NT-0003', modelId: 'MDM-KH', score: 97, reason: 'Trùng số căn cước và số điện thoại; chỉ khác cách viết dấu tiếng Việt', records: ['BN-000007', 'BN-000008'], status: 'Đã hợp nhất', reviewer: 'Nguyễn Thị Phương', decidedAt: '2026-08-08 10:20', note: 'Hợp nhất vào GR-0000188, ưu tiên bản ghi CRM' },
  { id: 'NT-0004', modelId: 'MDM-KH', score: 71, reason: 'Họ tên và ngày sinh trùng nhưng số căn cước khác nhau hoàn toàn', records: ['BN-000009', 'BN-000004'], status: 'Từ chối hợp nhất', reviewer: 'Phạm Thu Hà', decidedAt: '2026-08-09 08:40', note: 'Hai người khác nhau — trùng tên và ngày sinh là ngẫu nhiên' },
  { id: 'NT-0005', modelId: 'MDM-SP', score: 94, reason: 'Tên sản phẩm giống nhau sau khi bỏ dấu; cùng nhóm sản phẩm', records: ['BN-000011', 'BN-000012'], status: 'Chưa xem xét', reviewer: null, decidedAt: null, note: null },
  { id: 'NT-0006', modelId: 'MDM-KH', score: 85, reason: 'Trùng email và số điện thoại; họ tên viết tắt khác nhau', records: ['BN-000001', 'BN-000002'], status: 'Đã hợp nhất', reviewer: 'Nguyễn Thị Phương', decidedAt: '2026-08-08 10:15', note: 'Hợp nhất vào GR-0000012' },
]

export const duplicateById = (id: string) => mdmDuplicates.find(d => d.id === id)

/* ═══════════════ 7.4 Bản ghi chuẩn ═══════════════ */

export const goldenRecords: GoldenRecord[] = [
  {
    id: 'GR-0000012', modelId: 'MDM-KH', code: 'KH0000000012',
    values: { ho_ten: 'Nguyễn Văn An', so_cccd: '001088012345', so_dien_thoai: '84912345678', ngay_sinh: '1988-04-12', dia_chi: 'Số 5, Thanh Xuân, Hà Nội', email: 'an.nv@gmail.com', trang_thai: 'ACTIVE' },
    sourceRecordIds: ['BN-000001', 'BN-000002'], confidence: 98,
    createdAt: '2026-06-02 03:12', updatedAt: '2026-08-08 10:15', version: 3,
    distributedTo: [
      { system: 'HT-01 — CRM', at: '2026-08-08 10:20', status: 'Đồng bộ' },
      { system: 'HT-02 — Core thanh toán', at: '2026-08-08 10:20', status: 'Đồng bộ' },
      { system: 'HT-08 — Quản lý rủi ro', at: '2026-07-15 03:00', status: 'Lệch phiên bản' },
    ],
    history: [
      { at: '2026-08-08 10:15', by: 'Nguyễn Thị Phương', field: 'Nguồn liên kết', before: '1 bản ghi', after: '2 bản ghi (hợp nhất NT-0006)' },
      { at: '2026-07-02 09:40', by: 'Hệ thống', field: 'email', before: '(rỗng)', after: 'an.nv@gmail.com' },
      { at: '2026-06-02 03:12', by: 'Hệ thống', field: '—', before: '—', after: 'Tạo bản ghi chuẩn' },
    ],
  },
  {
    id: 'GR-0000044', modelId: 'MDM-KH', code: 'KH0000000044',
    values: { ho_ten: 'Trần Thị Bình', so_cccd: '001190044556', so_dien_thoai: '84987654321', ngay_sinh: '1990-09-02', dia_chi: 'Quận 1, TP. Hồ Chí Minh', email: 'binh.tt@yahoo.com', trang_thai: 'ACTIVE' },
    sourceRecordIds: ['BN-000004', 'BN-000005'], confidence: 96,
    createdAt: '2026-06-02 03:12', updatedAt: '2026-08-08 02:18', version: 2,
    distributedTo: [
      { system: 'HT-01 — CRM', at: '2026-08-08 03:00', status: 'Đồng bộ' },
      { system: 'HT-02 — Core thanh toán', at: '2026-08-08 03:00', status: 'Đồng bộ' },
      { system: 'HT-08 — Quản lý rủi ro', at: '2026-08-08 03:00', status: 'Đồng bộ' },
    ],
    history: [
      { at: '2026-08-08 02:18', by: 'Hệ thống', field: 'Nguồn liên kết', before: '1 bản ghi', after: '2 bản ghi' },
      { at: '2026-06-02 03:12', by: 'Hệ thống', field: '—', before: '—', after: 'Tạo bản ghi chuẩn' },
    ],
  },
  {
    id: 'GR-0000188', modelId: 'MDM-KH', code: 'KH0000000188',
    values: { ho_ten: 'Lê Hoàng Cường', so_cccd: '038085112233', so_dien_thoai: '84905112233', ngay_sinh: '1985-01-20', dia_chi: 'Hải Châu, Đà Nẵng', email: 'cuong.lh@congty.vn', trang_thai: 'ACTIVE' },
    sourceRecordIds: ['BN-000007', 'BN-000008'], confidence: 97,
    createdAt: '2026-06-02 03:12', updatedAt: '2026-08-08 10:20', version: 2,
    distributedTo: [
      { system: 'HT-01 — CRM', at: '2026-08-08 10:25', status: 'Đồng bộ' },
      { system: 'HT-02 — Core thanh toán', at: '2026-08-08 10:25', status: 'Đồng bộ' },
      { system: 'HT-08 — Quản lý rủi ro', at: '—', status: 'Chưa nhận' },
    ],
    history: [
      { at: '2026-08-08 10:20', by: 'Nguyễn Thị Phương', field: 'Nguồn liên kết', before: '1 bản ghi', after: '2 bản ghi (hợp nhất NT-0003)' },
      { at: '2026-06-02 03:12', by: 'Hệ thống', field: '—', before: '—', after: 'Tạo bản ghi chuẩn' },
    ],
  },
  {
    id: 'GR-SP0042', modelId: 'MDM-SP', code: 'SPTT0042',
    values: { ten_san_pham: 'Chuyển tiền nhanh 24/7', nhom_san_pham: 'Thanh toán', don_vi_tinh: 'Giao dịch', trang_thai: 'ACTIVE' },
    sourceRecordIds: ['BN-000011'], confidence: 100,
    createdAt: '2026-05-10 04:00', updatedAt: '2026-05-10 04:00', version: 1,
    distributedTo: [
      { system: 'HT-01 — CRM', at: '2026-08-09 04:00', status: 'Đồng bộ' },
      { system: 'HT-03 — Kho dữ liệu', at: '2026-08-09 04:00', status: 'Đồng bộ' },
    ],
    history: [{ at: '2026-05-10 04:00', by: 'Hệ thống', field: '—', before: '—', after: 'Tạo bản ghi chuẩn' }],
  },
]

export const goldenById = (id: string) => goldenRecords.find(g => g.id === id)

export const distributionChannels: DistributionChannel[] = [
  { id: 'PP-01', modelId: 'MDM-KH', target: 'HT-01 — CRM', method: 'API', frequency: 'Theo sự kiện', lastSync: '2026-08-09 09:42', recordsSynced: 1_284_500, drift: 0, status: 'Đồng bộ' },
  { id: 'PP-02', modelId: 'MDM-KH', target: 'HT-02 — Core thanh toán', method: 'API', frequency: 'Theo sự kiện', lastSync: '2026-08-09 09:42', recordsSynced: 1_284_500, drift: 0, status: 'Đồng bộ' },
  { id: 'PP-03', modelId: 'MDM-KH', target: 'HT-08 — Quản lý rủi ro', method: 'Theo lô', frequency: 'Hằng ngày 03:00', lastSync: '2026-07-15 03:00', recordsSynced: 1_248_120, drift: 36_380, status: 'Lệch' },
  { id: 'PP-04', modelId: 'MDM-KH', target: 'HT-10 — CRM cũ', method: 'Theo lô', frequency: 'Đã ngừng', lastSync: '2025-12-31 22:00', recordsSynced: 0, drift: 1_284_500, status: 'Lỗi' },
  { id: 'PP-05', modelId: 'MDM-SP', target: 'HT-01 — CRM', method: 'API', frequency: 'Mỗi 4 giờ', lastSync: '2026-08-09 08:00', recordsSynced: 1_284, drift: 0, status: 'Đồng bộ' },
  { id: 'PP-06', modelId: 'MDM-SP', target: 'HT-03 — Kho dữ liệu', method: 'Theo lô', frequency: 'Hằng ngày', lastSync: '2026-08-09 04:00', recordsSynced: 1_284, drift: 0, status: 'Đồng bộ' },
  { id: 'PP-07', modelId: 'MDM-DV', target: 'HT-05 — Hệ thống kế toán', method: 'Theo lô', frequency: 'Hằng tuần', lastSync: '2026-08-04 02:00', recordsSynced: 122, drift: 6, status: 'Lệch' },
]
