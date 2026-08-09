import type { DataPolicy, LifecycleRule, SharingAgreement, Assessment, Remediation } from './types'

/* ═══════════════ 6.1 Chính sách dữ liệu ═══════════════ */

export const dataPolicies: DataPolicy[] = [
  {
    id: 'CSDL-01', name: 'Chính sách quản trị dữ liệu tổng thể', category: 'Quản trị',
    summary: 'Quy định vai trò, trách nhiệm, quy trình phê duyệt và tiêu chuẩn thông tin mô tả dữ liệu áp dụng toàn công ty.',
    scope: 'Toàn bộ dữ liệu thuộc phạm vi quản trị', issuer: 'Ban Điều hành',
    effectiveFrom: '2026-01-01', reviewAt: '2027-01-01', version: 'v2.0', status: 'Đang hiệu lực',
    linkedObjects: 11_482, compliancePct: 62,
    controls: [
      'Mọi bảng Tier 1 phải có Người sở hữu dữ liệu và Đầu mối nghiệp vụ',
      'Metadata phải qua quy trình phê duyệt 5 trạng thái trước khi có hiệu lực',
      'Thuật ngữ nghiệp vụ phải được duyệt bởi Người sở hữu dữ liệu',
    ],
  },
  {
    id: 'CSDL-02', name: 'Chính sách phân loại và bảo vệ dữ liệu', category: 'Bảo mật',
    summary: 'Quy định 4 mức phân loại, nguyên tắc gắn nhãn dữ liệu cá nhân và biện pháp bảo vệ tương ứng.',
    scope: 'Toàn bộ bảng, cột, báo cáo', issuer: 'Ban Quản lý Rủi ro',
    effectiveFrom: '2026-03-01', reviewAt: '2027-03-01', version: 'v1.3', status: 'Đang hiệu lực',
    linkedObjects: 412, compliancePct: 48,
    controls: [
      'Mọi cột chứa dữ liệu cá nhân phải được gắn nhãn trong 30 ngày kể từ khi phát hiện',
      'Dữ liệu mức Hạn chế truy cập bắt buộc có chính sách che',
      'Cấm tải xuống dữ liệu mức Hạn chế truy cập nếu không có phê duyệt riêng',
    ],
  },
  {
    id: 'CSDL-03', name: 'Chính sách lưu trữ và xóa dữ liệu', category: 'Lưu trữ',
    summary: 'Quy định thời gian lưu trữ, điều kiện lưu kho và điều kiện xóa cho từng loại dữ liệu.',
    scope: 'Dữ liệu khách hàng, giao dịch, nhật ký', issuer: 'Ban Pháp chế',
    effectiveFrom: '2025-07-01', reviewAt: '2026-12-31', version: 'v1.1', status: 'Đang hiệu lực',
    linkedObjects: 2_842, compliancePct: 71,
    controls: [
      'Dữ liệu giao dịch lưu tối thiểu 10 năm theo quy định ngành',
      'Dữ liệu cá nhân xóa sau 24 tháng kể từ khi chấm dứt quan hệ hợp đồng',
      'Nhật ký hệ thống lưu 180 ngày trên môi trường nóng, sau đó lưu kho',
    ],
  },
  {
    id: 'CSDL-04', name: 'Chính sách cấp quyền truy cập dữ liệu', category: 'Cấp quyền',
    summary: 'Quy định nguyên tắc cấp quyền theo vai trò, mục đích và thời hạn; bắt buộc phê duyệt và tự thu hồi.',
    scope: 'Toàn bộ người dùng và nhóm', issuer: 'Trung tâm Hạ tầng',
    effectiveFrom: '2026-02-01', reviewAt: '2027-02-01', version: 'v1.0', status: 'Đang hiệu lực',
    linkedObjects: 1_847, compliancePct: 13,
    controls: [
      'Mọi quyền phải có thời hạn — cấm quyền vô thời hạn với dữ liệu Mật/Hạn chế',
      'Yêu cầu cấp quyền phải nêu mục đích sử dụng tối thiểu 30 ký tự',
      'Quyền hết hạn phải được thu hồi tự động trong 24 giờ',
      'Tài khoản nghỉ việc phải bị khóa trong 24 giờ kể từ ngày chấm dứt',
    ],
  },
  {
    id: 'CSDL-05', name: 'Chính sách chia sẻ dữ liệu cho bên thứ ba', category: 'Chia sẻ',
    summary: 'Quy định điều kiện, phạm vi, thời hạn và biện pháp bảo vệ khi chia sẻ dữ liệu ra ngoài tổ chức.',
    scope: 'Dữ liệu chia sẻ với đối tác, cơ quan quản lý', issuer: 'Ban Pháp chế',
    effectiveFrom: '2025-10-01', reviewAt: '2026-10-01', version: 'v1.2', status: 'Đang hiệu lực',
    linkedObjects: 6, compliancePct: 83,
    controls: [
      'Mọi chia sẻ ra ngoài phải có thoả thuận bằng văn bản, nêu rõ mục đích và thời hạn',
      'Dữ liệu cá nhân chia sẻ ra ngoài phải được che hoặc ẩn danh',
      'Ghi nhật ký đầy đủ mọi lượt chia sẻ',
    ],
  },
  {
    id: 'CSDL-06', name: 'Chính sách chất lượng dữ liệu', category: 'Chất lượng',
    summary: 'Quy định 6 chiều chất lượng, ngưỡng tối thiểu theo mức quan trọng và trách nhiệm xử lý lỗi.',
    scope: 'Bảng Tier 1 và Tier 2', issuer: 'Phòng Phân tích Dữ liệu',
    effectiveFrom: '2026-04-01', reviewAt: '2027-04-01', version: 'v1.0', status: 'Đang hiệu lực',
    linkedObjects: 64, compliancePct: 34,
    controls: [
      'Bảng Tier 1 phải có tối thiểu 5 luật chất lượng phủ đủ 4 chiều',
      'Sự cố mức Nghiêm trọng phải xử lý trong 24 giờ',
      'Đóng sự cố bắt buộc theo nguyên tắc 4 mắt',
    ],
  },
  {
    id: 'CSDL-07', name: 'Chính sách quản lý dữ liệu chủ', category: 'Quản trị',
    summary: 'Quy định mô hình dữ liệu chuẩn, quy tắc hợp nhất và nghĩa vụ sử dụng bản ghi chuẩn của các hệ thống.',
    scope: 'Khách hàng, sản phẩm, đơn vị', issuer: 'Ban Điều hành',
    effectiveFrom: '2026-09-01', reviewAt: '2027-09-01', version: 'v0.9', status: 'Dự thảo',
    linkedObjects: 4, compliancePct: 0,
    controls: [
      'Hệ thống mới bắt buộc dùng mã chuẩn thay vì tự sinh mã riêng',
      'Không tự động hợp nhất bản ghi khi chưa có xác nhận của đầu mối quản trị dữ liệu',
    ],
  },
  {
    id: 'CSDL-08', name: 'Chính sách bảo mật dữ liệu (bản cũ)', category: 'Bảo mật',
    summary: 'Bản chính sách bảo mật ban hành 2023, đã được thay thế bởi CSDL-02.',
    scope: 'Toàn công ty', issuer: 'Ban Quản lý Rủi ro',
    effectiveFrom: '2023-05-01', reviewAt: '2026-03-01', version: 'v1.0', status: 'Hết hiệu lực',
    linkedObjects: 0, compliancePct: 100, controls: ['— đã thay thế —'],
  },
]

export const policyById = (id: string) => dataPolicies.find(p => p.id === id)

/* ═══════════════ 6.2 Vòng đời & Lưu trữ ═══════════════ */

export const lifecycleRules: LifecycleRule[] = [
  {
    id: 'VD-01', name: 'Dữ liệu giao dịch thanh toán', dataKind: 'Giao dịch',
    scope: 'Miền Giao dịch — 2.104 bảng', activeMonths: 24, retentionMonths: 120, archiveMonths: 36,
    deleteCondition: 'Sau 10 năm kể từ ngày phát sinh giao dịch',
    legalBasis: 'Luật Kế toán 2015 — Điều 41', policyId: 'CSDL-03',
    affectedTables: ['dwh.giao_dich_thanh_toan', 'bi.doi_soat_giao_dich_A', 'raw.doi_soat_A_tho'],
    autoEnforced: false, nextAction: 'Chuyển 4,2 TB dữ liệu 2016 sang lưu kho', nextActionAt: '2026-09-01',
    status: 'Đang áp dụng',
  },
  {
    id: 'VD-02', name: 'Dữ liệu cá nhân khách hàng', dataKind: 'Khách hàng',
    scope: 'Miền Khách hàng — 964 bảng', activeMonths: 12, retentionMonths: 24, archiveMonths: 12,
    deleteCondition: 'Sau 24 tháng kể từ khi chấm dứt quan hệ hợp đồng, trừ khi có nghĩa vụ pháp lý khác',
    legalBasis: 'Nghị định 13/2023/NĐ-CP — Điều 16', policyId: 'CSDL-03',
    affectedTables: ['crm.khach_hang', 'crm.hop_dong', 'crm.khach_hang_cu'],
    autoEnforced: false, nextAction: 'Xóa 128.400 hồ sơ khách hàng đã đóng trước 08/2024', nextActionAt: '2026-08-31',
    status: 'Chờ phê duyệt',
  },
  {
    id: 'VD-03', name: 'Nhật ký hệ thống và nhật ký job', dataKind: 'Vận hành',
    scope: 'ops.* — 186 bảng', activeMonths: 6, retentionMonths: 24, archiveMonths: 18,
    deleteCondition: 'Xóa sau 24 tháng',
    legalBasis: 'Quy định nội bộ về lưu trữ nhật ký', policyId: 'CSDL-03',
    affectedTables: ['ops.nhat_ky_job', 'ops.hang_doi_canh_bao'],
    autoEnforced: true, nextAction: 'JOB-1044 chạy tự động hằng tuần', nextActionAt: '2026-08-10',
    status: 'Đang áp dụng',
  },
  {
    id: 'VD-04', name: 'Nhật ký kiểm toán truy cập', dataKind: 'Tuân thủ',
    scope: 'Nhật ký kiểm toán DMP', activeMonths: 12, retentionMonths: 60, archiveMonths: 48,
    deleteCondition: 'Không xóa trước 5 năm — phục vụ kiểm toán',
    legalBasis: 'Nghị định 13/2023/NĐ-CP · yêu cầu kiểm toán nội bộ', policyId: 'CSDL-03',
    affectedTables: [], autoEnforced: true, nextAction: 'Không có hành động đến 2030', nextActionAt: '—',
    status: 'Đang áp dụng',
  },
  {
    id: 'VD-05', name: 'Dữ liệu vùng thô chưa khai báo', dataKind: 'Vùng thô',
    scope: 'raw.* chưa gán chủ — 2.934 bảng', activeMonths: 3, retentionMonths: 6, archiveMonths: 0,
    deleteCondition: 'Xóa sau 6 tháng nếu không có người nhận phụ trách',
    legalBasis: 'Quy định nội bộ về tối ưu hạ tầng', policyId: 'CSDL-01',
    affectedTables: ['raw.giao_dich_kafka', 'raw.file_ke_toan_thang'],
    autoEnforced: false, nextAction: 'Cảnh báo 412 bảng sắp đến hạn xóa', nextActionAt: '2026-09-15',
    status: 'Tạm dừng',
  },
  {
    id: 'VD-06', name: 'Dữ liệu báo cáo tài chính', dataKind: 'Tài chính',
    scope: 'Miền Tài chính — 1.438 bảng', activeMonths: 36, retentionMonths: 120, archiveMonths: 60,
    deleteCondition: 'Không xóa trước 10 năm',
    legalBasis: 'Luật Kế toán 2015', policyId: 'CSDL-03',
    affectedTables: ['fin.so_cai_doi_soat', 'fin.chi_phi_van_hanh'],
    autoEnforced: false, nextAction: 'Lưu kho dữ liệu 2020–2021', nextActionAt: '2026-12-31',
    status: 'Đang áp dụng',
  },
]

export const sharingAgreements: SharingAgreement[] = [
  { id: 'CS3-01', partner: 'Đối tác A — Ngân hàng', dataScope: 'File đối soát giao dịch (không chứa dữ liệu cá nhân)', purpose: 'Đối soát giao dịch song phương', method: 'SFTP · KENH-01', from: '2023-01-01', to: '2027-01-01', approvedBy: 'Ban Pháp chế', status: 'Đang hiệu lực', maskApplied: 'Không chứa dữ liệu cá nhân', volumeMonth: '~375 triệu dòng' },
  { id: 'CS3-02', partner: 'Đối tác B — Ví điện tử', dataScope: 'Báo cáo doanh số tổng hợp theo tuần', purpose: 'Quản trị hợp tác kinh doanh', method: 'FTP · KENH-05', from: '2025-06-01', to: '2026-09-30', approvedBy: 'Ban Kinh doanh', status: 'Sắp hết hạn', maskApplied: 'Chỉ số liệu tổng hợp', volumeMonth: '4 file' },
  { id: 'CS3-03', partner: 'Cơ quan quản lý', dataScope: 'Báo cáo rủi ro AML — BC-010', purpose: 'Báo cáo tuân thủ định kỳ', method: 'Cổng báo cáo điện tử', from: '2024-01-01', to: 'Không thời hạn', approvedBy: 'Ban Quản lý Rủi ro', status: 'Đang hiệu lực', maskApplied: 'Ẩn danh mã khách hàng', volumeMonth: '1 báo cáo' },
  { id: 'CS3-04', partner: 'Đơn vị kiểm toán độc lập', dataScope: 'Sổ cái đối soát và nhật ký kiểm toán', purpose: 'Kiểm toán báo cáo tài chính năm', method: 'Truy cập có thời hạn qua DMP', from: '2026-01-15', to: '2026-04-15', approvedBy: 'Ban Tài chính', status: 'Hết hạn', maskApplied: 'Che cột dữ liệu cá nhân', volumeMonth: '—' },
]

/* ═══════════════ 6.3 Đánh giá tuân thủ ═══════════════ */

export const assessments: Assessment[] = [
  {
    id: 'DG-2026-Q2', name: 'Đánh giá tuân thủ quý II/2026', period: 'Quý II/2026',
    policyIds: ['CSDL-01', 'CSDL-02', 'CSDL-03', 'CSDL-04', 'CSDL-06'],
    assessor: 'Ban Kiểm toán nội bộ', startedAt: '2026-07-01', finishedAt: '2026-07-28',
    status: 'Chờ khắc phục', passed: 11, failed: 7, na: 2,
    items: [
      { code: 'KT-01', text: 'Mọi bảng Tier 1 có Người sở hữu dữ liệu', policyId: 'CSDL-01', result: 'Không đạt', evidence: 'Danh mục bảng — 7.578/11.482 bảng chưa có người phụ trách', finding: '7.578 bảng chưa gán người phụ trách, trong đó 42 bảng Tier 1' },
      { code: 'KT-02', text: 'Metadata Tier 1 đã được phê duyệt', policyId: 'CSDL-01', result: 'Đạt', evidence: 'Hàng đợi phê duyệt — 96% bảng Tier 1 ở trạng thái Đã phê duyệt', finding: null },
      { code: 'KT-03', text: 'Thuật ngữ nghiệp vụ được duyệt bởi Người sở hữu dữ liệu', policyId: 'CSDL-01', result: 'Đạt', evidence: 'Từ điển nghiệp vụ — 218 thuật ngữ, 205 đã duyệt', finding: null },
      { code: 'KT-04', text: 'Cột chứa dữ liệu cá nhân đã được gắn nhãn', policyId: 'CSDL-02', result: 'Không đạt', evidence: 'Bộ dò tự động phát hiện thêm 8 cột chưa gắn nhãn', finding: '8 cột nghi ngờ chứa dữ liệu cá nhân chưa được xác nhận nhãn' },
      { code: 'KT-05', text: 'Dữ liệu Hạn chế truy cập có chính sách che', policyId: 'CSDL-02', result: 'Không đạt', evidence: 'Chính sách che — 0/412 cột nhạy cảm có chính sách che tại thời điểm đánh giá', finding: '412 cột nhạy cảm chưa có chính sách che dữ liệu' },
      { code: 'KT-06', text: 'Cấm tải xuống dữ liệu Hạn chế truy cập', policyId: 'CSDL-02', result: 'Không đạt', evidence: 'Nhật ký — ghi nhận 2 lượt tải xuống bị đánh dấu Cảnh báo', finding: 'Chính sách hạn chế tải xuống chưa được thực thi ở tầng truy vấn' },
      { code: 'KT-07', text: 'Quyền truy cập có thời hạn', policyId: 'CSDL-04', result: 'Không đạt', evidence: 'Chính sách truy cập — 1.612/1.847 quyền vô thời hạn', finding: '87% chính sách quyền không có thời hạn' },
      { code: 'KT-08', text: 'Tài khoản nghỉ việc bị khóa trong 24 giờ', policyId: 'CSDL-04', result: 'Không đạt', evidence: 'Danh sách người dùng — 9 tài khoản đã nghỉ việc chưa khóa', finding: '9 tài khoản nghỉ việc vẫn còn quyền trên 132 bảng' },
      { code: 'KT-09', text: 'Yêu cầu cấp quyền nêu mục đích rõ ràng', policyId: 'CSDL-04', result: 'Đạt', evidence: 'Yêu cầu cấp quyền — mọi yêu cầu mới đều có lý do ≥ 30 ký tự', finding: null },
      { code: 'KT-10', text: 'Quyền hết hạn được thu hồi tự động', policyId: 'CSDL-04', result: 'Đạt', evidence: 'Nhật ký thu hồi quyền — thu hồi trong 24 giờ', finding: null },
      { code: 'KT-11', text: 'Dữ liệu giao dịch lưu tối thiểu 10 năm', policyId: 'CSDL-03', result: 'Đạt', evidence: 'Quy tắc vòng đời VD-01', finding: null },
      { code: 'KT-12', text: 'Dữ liệu cá nhân được xóa đúng hạn', policyId: 'CSDL-03', result: 'Không đạt', evidence: 'Quy tắc VD-02 đang ở trạng thái Chờ phê duyệt', finding: '128.400 hồ sơ khách hàng quá hạn xóa chưa được xử lý' },
      { code: 'KT-13', text: 'Nhật ký hệ thống lưu đủ thời gian quy định', policyId: 'CSDL-03', result: 'Đạt', evidence: 'Quy tắc VD-03 tự động thực thi', finding: null },
      { code: 'KT-14', text: 'Bảng Tier 1 có tối thiểu 5 luật chất lượng', policyId: 'CSDL-06', result: 'Không đạt', evidence: 'Chỉ 64/11.482 bảng đang được kiểm chất lượng', finding: 'Độ phủ kiểm tra chất lượng chỉ đạt 0,6% số bảng' },
      { code: 'KT-15', text: 'Sự cố Nghiêm trọng xử lý trong 24 giờ', policyId: 'CSDL-06', result: 'Đạt', evidence: 'Sự cố chất lượng — thời gian xử lý trung bình 18 giờ', finding: null },
      { code: 'KT-16', text: 'Đóng sự cố theo nguyên tắc 4 mắt', policyId: 'CSDL-06', result: 'Đạt', evidence: 'Vòng đời sự cố bắt buộc qua trạng thái Chờ duyệt đóng', finding: null },
      { code: 'KT-17', text: 'Nhật ký truy cập ghi đủ trường bắt buộc', policyId: 'CSDL-02', result: 'Đạt', evidence: 'Nhật ký kiểm toán có đủ người · thời điểm · đối tượng · hành động · IP · chính sách quyết định', finding: null },
      { code: 'KT-18', text: 'Có quy trình phát hiện truy cập bất thường', policyId: 'CSDL-02', result: 'Đạt', evidence: 'Giám sát truy cập — 6 cảnh báo trong kỳ', finding: null },
      { code: 'KT-19', text: 'Mô hình dữ liệu chủ được phê duyệt', policyId: 'CSDL-01', result: 'Không áp dụng', evidence: 'Chính sách CSDL-07 còn ở trạng thái Dự thảo', finding: null },
      { code: 'KT-20', text: 'Hệ thống sử dụng mã chuẩn từ dữ liệu chủ', policyId: 'CSDL-01', result: 'Không áp dụng', evidence: 'Giai đoạn 5 chưa triển khai', finding: null },
    ],
  },
  {
    id: 'DG-2026-Q1', name: 'Đánh giá tuân thủ quý I/2026', period: 'Quý I/2026',
    policyIds: ['CSDL-01', 'CSDL-03', 'CSDL-04'],
    assessor: 'Ban Kiểm toán nội bộ', startedAt: '2026-04-01', finishedAt: '2026-04-22',
    status: 'Đã hoàn thành', passed: 8, failed: 4, na: 0,
    items: [
      { code: 'KT-01', text: 'Mọi bảng Tier 1 có Người sở hữu dữ liệu', policyId: 'CSDL-01', result: 'Không đạt', evidence: '8.104 bảng chưa gán người phụ trách', finding: 'Chưa cải thiện so với quý trước' },
      { code: 'KT-07', text: 'Quyền truy cập có thời hạn', policyId: 'CSDL-04', result: 'Không đạt', evidence: '1.688/1.842 quyền vô thời hạn', finding: '92% quyền không có thời hạn' },
      { code: 'KT-09', text: 'Yêu cầu cấp quyền nêu mục đích rõ ràng', policyId: 'CSDL-04', result: 'Đạt', evidence: 'Đã áp dụng ràng buộc 30 ký tự', finding: null },
      { code: 'KT-11', text: 'Dữ liệu giao dịch lưu tối thiểu 10 năm', policyId: 'CSDL-03', result: 'Đạt', evidence: 'Quy tắc vòng đời VD-01', finding: null },
    ],
  },
  {
    id: 'DG-2026-Q3', name: 'Đánh giá tuân thủ quý III/2026', period: 'Quý III/2026',
    policyIds: ['CSDL-01', 'CSDL-02', 'CSDL-03', 'CSDL-04', 'CSDL-05', 'CSDL-06'],
    assessor: 'Ban Kiểm toán nội bộ', startedAt: '2026-08-01', finishedAt: null,
    status: 'Đang đánh giá', passed: 4, failed: 1, na: 0,
    items: [
      { code: 'KT-02', text: 'Metadata Tier 1 đã được phê duyệt', policyId: 'CSDL-01', result: 'Đạt', evidence: 'Đang thu thập', finding: null },
      { code: 'KT-05', text: 'Dữ liệu Hạn chế truy cập có chính sách che', policyId: 'CSDL-02', result: 'Đạt', evidence: 'Đã ban hành 4 chính sách che theo nhãn', finding: null },
      { code: 'KT-08', text: 'Tài khoản nghỉ việc bị khóa trong 24 giờ', policyId: 'CSDL-04', result: 'Không đạt', evidence: 'Vẫn còn 9 tài khoản chưa khóa', finding: 'Chưa khắc phục từ quý II' },
      { code: 'KT-15', text: 'Sự cố Nghiêm trọng xử lý trong 24 giờ', policyId: 'CSDL-06', result: 'Đạt', evidence: 'Đang theo dõi', finding: null },
      { code: 'KT-21', text: 'Chia sẻ bên thứ ba có thoả thuận bằng văn bản', policyId: 'CSDL-05', result: 'Đạt', evidence: '4/4 thoả thuận có văn bản', finding: null },
    ],
  },
]

export const assessmentById = (id: string) => assessments.find(a => a.id === id)

export const remediations: Remediation[] = [
  { id: 'KP-01', assessmentId: 'DG-2026-Q2', finding: '412 cột nhạy cảm chưa có chính sách che dữ liệu', severity: 'Nghiêm trọng', owner: 'Nguyễn Thị Phương', dueAt: '2026-09-30', status: 'Đang khắc phục', plan: 'Ban hành 4 chính sách che theo nhãn (PII_PHONE, PII_ID, PII_EMAIL, PII_ADDRESS) và áp tự động cho mọi cột mang nhãn.', progressPct: 65 },
  { id: 'KP-02', assessmentId: 'DG-2026-Q2', finding: '9 tài khoản nghỉ việc vẫn còn quyền trên 132 bảng', severity: 'Nghiêm trọng', owner: 'Quản trị hệ thống', dueAt: '2026-08-15', status: 'Đang khắc phục', plan: 'Đồng bộ trạng thái nhân sự từ hệ thống HR mỗi ngày, tự động khóa tài khoản và thu hồi quyền.', progressPct: 40 },
  { id: 'KP-03', assessmentId: 'DG-2026-Q2', finding: '87% chính sách quyền không có thời hạn', severity: 'Cao', owner: 'Quản trị hệ thống', dueAt: '2026-12-31', status: 'Mới', plan: 'Rà soát 1.612 chính sách vô thời hạn, gán thời hạn tối đa 12 tháng; cấm tạo mới quyền vô thời hạn với dữ liệu Mật.', progressPct: 5 },
  { id: 'KP-04', assessmentId: 'DG-2026-Q2', finding: '7.578 bảng chưa gán người phụ trách', severity: 'Cao', owner: 'Nguyễn Thị Phương', dueAt: '2027-03-31', status: 'Đang khắc phục', plan: 'Chiến dịch nhận phụ trách theo miền; bắt buộc gán người phụ trách khi khai báo bảng mới.', progressPct: 22 },
  { id: 'KP-05', assessmentId: 'DG-2026-Q2', finding: '128.400 hồ sơ khách hàng quá hạn xóa chưa xử lý', severity: 'Cao', owner: 'Phạm Thu Hà', dueAt: '2026-08-31', status: 'Chờ kiểm chứng', plan: 'Phê duyệt quy tắc vòng đời VD-02 và chạy đợt xóa đầu tiên có đối chiếu nghĩa vụ pháp lý.', progressPct: 85 },
  { id: 'KP-06', assessmentId: 'DG-2026-Q2', finding: 'Độ phủ kiểm tra chất lượng chỉ đạt 0,6% số bảng', severity: 'Cao', owner: 'Nguyễn Thị Phương', dueAt: '2027-06-30', status: 'Đang khắc phục', plan: 'Gán luật tự động theo mẫu cho toàn bộ bảng Tier 1 và Tier 2 trọng yếu, mục tiêu phủ 1.200 bảng.', progressPct: 12 },
  { id: 'KP-07', assessmentId: 'DG-2026-Q2', finding: '8 cột nghi ngờ chứa dữ liệu cá nhân chưa xác nhận nhãn', severity: 'Trung bình', owner: 'Trần Văn Hùng', dueAt: '2026-08-20', status: 'Chờ kiểm chứng', plan: 'Xác nhận kết quả bộ dò tự động và gắn nhãn cho 8 cột.', progressPct: 90 },
  { id: 'KP-08', assessmentId: 'DG-2026-Q2', finding: 'Chính sách hạn chế tải xuống chưa thực thi ở tầng truy vấn', severity: 'Nghiêm trọng', owner: 'Trần Văn Hùng', dueAt: '2026-10-31', status: 'Mới', plan: 'Bổ sung kiểm tra mức phân loại vào cổng truy vấn trước khi cho phép xuất dữ liệu.', progressPct: 0 },
  { id: 'KP-09', assessmentId: 'DG-2026-Q1', finding: '92% quyền không có thời hạn', severity: 'Cao', owner: 'Quản trị hệ thống', dueAt: '2026-06-30', status: 'Đã đóng', plan: 'Đã giảm từ 92% xuống 87% — tiếp tục theo dõi ở KP-03.', progressPct: 100 },
]
