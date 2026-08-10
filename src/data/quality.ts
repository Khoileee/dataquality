import type {
  RuleType, RuleInstance, ProfileRow, IncidentRow, AlertRule, AlertChannel,
} from './types'

/* ═══════════════ 3.1 Thư viện luật — 28 loại kiểm tra ═══════════════ */

export const ruleTypes: RuleType[] = [
  // ── Đầy đủ (Completeness) — mức cột ──
  { id: 'RL-01', code: 'not_null', name: 'Không được để trống', dimension: 'completeness', level: 'Cột', appliesTo: 'Cột bất kỳ', params: '—', builtin: true, usage: 214, defaultWarn: 99, defaultCrit: 95, sqlTemplate: 'SELECT COUNT(*) FROM {bang} WHERE {cot} IS NULL', description: 'Cột bắt buộc không được có giá trị rỗng' },
  { id: 'RL-02', code: 'fill_rate', name: 'Tỷ lệ điền tối thiểu', dimension: 'completeness', level: 'Cột', appliesTo: 'Cột tuỳ chọn', params: 'ty_le_toi_thieu', builtin: true, usage: 86, defaultWarn: 90, defaultCrit: 80, sqlTemplate: 'SELECT COUNT({cot})*100.0/COUNT(*) FROM {bang}', description: 'Tỷ lệ bản ghi có giá trị phải đạt ngưỡng tối thiểu' },
  { id: 'RL-03', code: 'null_rate_by_period', name: 'Tỷ lệ rỗng theo kỳ', dimension: 'completeness', level: 'Cột', appliesTo: 'Cột có phân vùng thời gian', params: 'ky · nguong', builtin: true, usage: 42, defaultWarn: 5, defaultCrit: 10, sqlTemplate: 'SELECT {ky}, SUM(CASE WHEN {cot} IS NULL THEN 1 ELSE 0 END)*100.0/COUNT(*) FROM {bang} GROUP BY {ky}', description: 'Phát hiện kỳ nào đột ngột thiếu dữ liệu' },
  { id: 'RL-04', code: 'conditional_not_null', name: 'Bắt buộc có điều kiện', dimension: 'completeness', level: 'Cột', appliesTo: 'Cột phụ thuộc cột khác', params: 'dieu_kien', builtin: true, usage: 28, defaultWarn: 99, defaultCrit: 97, sqlTemplate: 'SELECT COUNT(*) FROM {bang} WHERE {dieu_kien} AND {cot} IS NULL', description: 'Khi thoả điều kiện thì cột không được rỗng' },

  // ── Hợp lệ (Validity) — mức cột ──
  { id: 'RL-05', code: 'format_regex', name: 'Đúng định dạng (biểu thức)', dimension: 'validity', level: 'Cột', appliesTo: 'Cột văn bản', params: 'bieu_thuc', builtin: true, usage: 96, defaultWarn: 99, defaultCrit: 97, sqlTemplate: 'SELECT COUNT(*) FROM {bang} WHERE NOT regexp_like({cot}, {bieu_thuc})', description: 'Giá trị phải khớp biểu thức chính quy' },
  { id: 'RL-06', code: 'blacklist_pattern', name: 'Không chứa mẫu cấm', dimension: 'validity', level: 'Cột', appliesTo: 'Cột văn bản', params: 'danh_sach_mau', builtin: true, usage: 18, defaultWarn: 100, defaultCrit: 99, sqlTemplate: 'SELECT COUNT(*) FROM {bang} WHERE regexp_like({cot}, {mau_cam})', description: 'Chặn giá trị rác như "test", "NULL", "999999"' },
  { id: 'RL-07', code: 'value_range', name: 'Nằm trong khoảng giá trị', dimension: 'validity', level: 'Cột', appliesTo: 'Cột số / ngày', params: 'min · max', builtin: true, usage: 74, defaultWarn: 99, defaultCrit: 96, sqlTemplate: 'SELECT COUNT(*) FROM {bang} WHERE {cot} NOT BETWEEN {min} AND {max}', description: 'Giá trị phải nằm trong khoảng cho phép' },
  { id: 'RL-08', code: 'allowed_values', name: 'Thuộc tập giá trị cho phép', dimension: 'validity', level: 'Cột', appliesTo: 'Cột phân loại', params: 'tap_gia_tri', builtin: true, usage: 62, defaultWarn: 100, defaultCrit: 98, sqlTemplate: 'SELECT COUNT(*) FROM {bang} WHERE {cot} NOT IN ({tap_gia_tri})', description: 'Giá trị phải thuộc danh sách được khai' },

  // ── Nhất quán (Consistency) — mức cột ──
  { id: 'RL-09', code: 'fixed_datatype', name: 'Kiểu dữ liệu không đổi', dimension: 'consistency', level: 'Cột', appliesTo: 'Cột bất kỳ', params: 'kieu_mong_doi', builtin: true, usage: 34, defaultWarn: 100, defaultCrit: 100, sqlTemplate: '-- so sánh lược đồ hiện tại với lược đồ đã duyệt', description: 'Phát hiện kiểu dữ liệu bị đổi ngầm' },
  { id: 'RL-10', code: 'mode_check', name: 'Giá trị phổ biến ổn định', dimension: 'consistency', level: 'Cột', appliesTo: 'Cột phân loại', params: 'do_lech_cho_phep', builtin: true, usage: 12, defaultWarn: 15, defaultCrit: 30, sqlTemplate: 'SELECT {cot}, COUNT(*) FROM {bang} GROUP BY {cot} ORDER BY 2 DESC', description: 'Phân bố giá trị không được lệch đột ngột' },
  { id: 'RL-11', code: 'referential_integrity', name: 'Mã phải tồn tại trong danh mục', dimension: 'consistency', level: 'Cột', appliesTo: 'Cột mã tham chiếu', params: 'danh_muc · cot_ma', builtin: true, usage: 0, defaultWarn: 100, defaultCrit: 99, sqlTemplate: 'SELECT COUNT(*) FROM {bang} t LEFT JOIN {danh_muc} d ON t.{cot}=d.{cot_ma} WHERE d.{cot_ma} IS NULL', description: '⚠️ Chưa dùng lần nào — cần mở API cho Danh mục tham chiếu (menu 1.5)' },

  // ── Không trùng lặp (Uniqueness) — mức cột ──
  { id: 'RL-12', code: 'duplicate_single', name: 'Không trùng theo một cột', dimension: 'uniqueness', level: 'Cột', appliesTo: 'Cột khoá', params: '—', builtin: true, usage: 68, defaultWarn: 100, defaultCrit: 99, sqlTemplate: 'SELECT {cot}, COUNT(*) FROM {bang} GROUP BY {cot} HAVING COUNT(*)>1', description: 'Cột khoá không được có giá trị trùng' },

  // ── Chính xác (Accuracy) — mức cột ──
  { id: 'RL-13', code: 'reference_match', name: 'Khớp với nguồn đối chiếu', dimension: 'accuracy', level: 'Cột', appliesTo: 'Cột số / mã', params: 'bang_doi_chieu · cot_doi_chieu', builtin: true, usage: 26, defaultWarn: 99, defaultCrit: 97, sqlTemplate: 'SELECT COUNT(*) FROM {bang} a JOIN {bang_doi_chieu} b ON a.{khoa}=b.{khoa} WHERE a.{cot} <> b.{cot_doi_chieu}', description: 'Giá trị phải khớp với hệ thống nguồn' },
  { id: 'RL-14', code: 'statistics_bound', name: 'Chỉ số thống kê trong ngưỡng', dimension: 'accuracy', level: 'Cột', appliesTo: 'Cột số', params: 'chi_so · min · max', builtin: true, usage: 38, defaultWarn: 95, defaultCrit: 90, sqlTemplate: 'SELECT AVG({cot}), STDDEV({cot}) FROM {bang}', description: 'Trung bình / độ lệch chuẩn phải nằm trong ngưỡng' },
  { id: 'RL-15', code: 'sum_range', name: 'Tổng nằm trong khoảng', dimension: 'accuracy', level: 'Cột', appliesTo: 'Cột số tiền', params: 'min · max', builtin: true, usage: 22, defaultWarn: 98, defaultCrit: 95, sqlTemplate: 'SELECT SUM({cot}) FROM {bang} WHERE {dieu_kien}', description: 'Tổng giá trị trong kỳ phải nằm trong khoảng dự kiến' },
  { id: 'RL-16', code: 'expression_pct', name: 'Tỷ lệ thoả biểu thức', dimension: 'accuracy', level: 'Cột', appliesTo: 'Cột bất kỳ', params: 'bieu_thuc · ty_le', builtin: true, usage: 44, defaultWarn: 95, defaultCrit: 90, sqlTemplate: 'SELECT SUM(CASE WHEN {bieu_thuc} THEN 1 ELSE 0 END)*100.0/COUNT(*) FROM {bang}', description: 'Tỷ lệ bản ghi thoả biểu thức nghiệp vụ' },

  // ── Kịp thời (Timeliness) — mức cột ──
  { id: 'RL-17', code: 'on_time', name: 'Dữ liệu về đúng giờ cam kết', dimension: 'timeliness', level: 'Cột', appliesTo: 'Cột thời gian', params: 'gio_cam_ket', builtin: true, usage: 58, defaultWarn: 100, defaultCrit: 95, sqlTemplate: 'SELECT MAX({cot}) FROM {bang}', description: 'Dữ liệu phải sẵn sàng trước giờ cam kết' },
  { id: 'RL-18', code: 'freshness', name: 'Độ tươi dữ liệu', dimension: 'timeliness', level: 'Cột', appliesTo: 'Cột thời gian cập nhật', params: 'so_gio_toi_da', builtin: true, usage: 92, defaultWarn: 100, defaultCrit: 95, sqlTemplate: 'SELECT (CURRENT_TIMESTAMP - MAX({cot})) FROM {bang}', description: 'Khoảng cách từ lần cập nhật cuối không vượt ngưỡng' },

  // ── Mức bảng ──
  { id: 'RL-19', code: 'row_count', name: 'Số dòng trong ngưỡng', dimension: 'completeness', level: 'Bảng', appliesTo: 'Bảng bất kỳ', params: 'min · max', builtin: true, usage: 128, defaultWarn: 95, defaultCrit: 90, sqlTemplate: 'SELECT COUNT(*) FROM {bang}', description: 'Số bản ghi phải nằm trong khoảng dự kiến' },
  { id: 'RL-20', code: 'time_coverage', name: 'Phủ đủ khoảng thời gian', dimension: 'completeness', level: 'Bảng', appliesTo: 'Bảng có phân vùng ngày', params: 'so_ngay', builtin: true, usage: 36, defaultWarn: 100, defaultCrit: 98, sqlTemplate: 'SELECT COUNT(DISTINCT {cot_ngay}) FROM {bang}', description: 'Không được thiếu ngày trong khoảng dữ liệu' },
  { id: 'RL-21', code: 'volume_change', name: 'Biến động khối lượng', dimension: 'accuracy', level: 'Bảng', appliesTo: 'Bảng bất kỳ', params: 'bien_dong_toi_da_pct', builtin: true, usage: 84, defaultWarn: 20, defaultCrit: 40, sqlTemplate: 'SELECT COUNT(*) FROM {bang} WHERE ngay = CURRENT_DATE', description: 'Số dòng hôm nay không lệch quá nhiều so với trung bình' },
  { id: 'RL-22', code: 'table_size', name: 'Dung lượng bảng', dimension: 'accuracy', level: 'Bảng', appliesTo: 'Bảng bất kỳ', params: 'max_gb', builtin: true, usage: 14, defaultWarn: 90, defaultCrit: 80, sqlTemplate: '-- đọc từ siêu dữ liệu lưu trữ', description: 'Cảnh báo bảng phình bất thường' },
  { id: 'RL-23', code: 'custom_expression', name: 'Biểu thức tuỳ chỉnh', dimension: 'accuracy', level: 'Bảng', appliesTo: 'Bảng bất kỳ', params: 'cau_sql', builtin: false, usage: 52, defaultWarn: 100, defaultCrit: 98, sqlTemplate: '{cau_sql_nguoi_dung_khai}', description: 'Người dùng tự viết câu SQL kiểm tra' },
  { id: 'RL-24', code: 'duplicate_composite', name: 'Không trùng theo tổ hợp cột', dimension: 'uniqueness', level: 'Bảng', appliesTo: 'Bảng có khoá tổ hợp', params: 'danh_sach_cot', builtin: true, usage: 46, defaultWarn: 100, defaultCrit: 99, sqlTemplate: 'SELECT {cot1},{cot2}, COUNT(*) FROM {bang} GROUP BY 1,2 HAVING COUNT(*)>1', description: 'Tổ hợp cột khoá không được trùng' },

  // ── Dành riêng cho báo cáo ──
  { id: 'RL-25', code: 'aggregate_reconciliation', name: 'Đối chiếu tổng giữa hai bảng', dimension: 'consistency', level: 'Bảng', appliesTo: 'Báo cáo · Bảng tổng hợp', params: 'bang_nguon · bieu_thuc_tong', builtin: true, usage: 0, defaultWarn: 100, defaultCrit: 99, sqlTemplate: 'SELECT (SELECT SUM({cot}) FROM {bang_dich}) - (SELECT SUM({cot}) FROM {bang_nguon})', description: '⚠️ Chưa dùng lần nào — cần khai báo cặp bảng nguồn/đích' },
  { id: 'RL-26', code: 'report_row_count_match', name: 'Số dòng báo cáo khớp nguồn', dimension: 'consistency', level: 'Bảng', appliesTo: 'Báo cáo', params: 'bang_nguon', builtin: true, usage: 8, defaultWarn: 100, defaultCrit: 99, sqlTemplate: 'SELECT COUNT(*) FROM {bang_bao_cao} vs {bang_nguon}', description: 'Số dòng trên báo cáo phải khớp với nguồn' },

  // ── Dành riêng cho chỉ tiêu ──
  { id: 'RL-27', code: 'kpi_variance', name: 'Biến động chỉ tiêu', dimension: 'accuracy', level: 'Bảng', appliesTo: 'Chỉ tiêu', params: 'bien_dong_toi_da_pct', builtin: true, usage: 16, defaultWarn: 15, defaultCrit: 30, sqlTemplate: '-- so sánh giá trị chỉ tiêu kỳ này với kỳ trước', description: 'Chỉ tiêu không được nhảy bất thường giữa hai kỳ' },
  { id: 'RL-28', code: 'parent_child_match', name: 'Chỉ tiêu cha bằng tổng con', dimension: 'consistency', level: 'Bảng', appliesTo: 'Chỉ tiêu phân cấp', params: 'chi_tieu_cha · chi_tieu_con', builtin: true, usage: 6, defaultWarn: 100, defaultCrit: 99, sqlTemplate: '-- so sánh chỉ tiêu tổng với tổng các chỉ tiêu thành phần', description: 'Tổng chỉ tiêu con phải bằng chỉ tiêu cha' },
]

export const ruleTypeById = (id: string) => ruleTypes.find(r => r.id === id)

/* ═══════════════ 3.2 Luật đã gán & kết quả ═══════════════ */

const RI = (o: Partial<RuleInstance> & Pick<RuleInstance, 'id' | 'ruleTypeId' | 'ruleName' | 'dimension' | 'objectId' | 'objectLabel'>): RuleInstance => ({
  objectType: 'Bảng', column: null, params: '—', warn: 99, crit: 95,
  thresholdSource: 'Toàn cục', trigger: 'Theo lịch', schedule: 'Hằng ngày 07:15',
  blockDownstream: false, severity: 'Trung bình', owner: 'Nguyễn Thị Phương',
  status: 'Đang chạy', lastRun: '2026-08-09 07:15', lastResult: 'Đạt', lastScore: 100,
  trend: [100, 100, 100, 100, 100, 100, 100], failedRows: 0, totalRows: 0,
  ...o,
} as RuleInstance)

export const ruleInstances: RuleInstance[] = [
  RI({ id: 'LT-0001', ruleTypeId: 'RL-01', ruleName: 'Không được để trống', dimension: 'completeness', objectType: 'Cột', objectId: 'bi.doi_soat_giao_dich_A', objectLabel: 'bi.doi_soat_giao_dich_A', column: 'ma_giao_dich', params: '—', warn: 100, crit: 99.9, severity: 'Nghiêm trọng', blockDownstream: true, thresholdSource: 'Theo lần gán', lastScore: 100, totalRows: 12_480_331, trend: [100, 100, 100, 100, 100, 100, 100] }),
  RI({ id: 'LT-0002', ruleTypeId: 'RL-05', ruleName: 'Đúng định dạng (biểu thức)', dimension: 'validity', objectType: 'Cột', objectId: 'bi.doi_soat_giao_dich_A', objectLabel: 'bi.doi_soat_giao_dich_A', column: 'so_dien_thoai', params: "^(84|0)(3|5|7|8|9)[0-9]{8}$", warn: 99, crit: 97, severity: 'Cao', lastResult: 'Không đạt', lastScore: 94.2, failedRows: 723_058, totalRows: 12_480_331, trend: [99, 98, 99, 97, 96, 95, 94], thresholdSource: 'Theo bảng' }),
  RI({ id: 'LT-0003', ruleTypeId: 'RL-08', ruleName: 'Thuộc tập giá trị cho phép', dimension: 'validity', objectType: 'Cột', objectId: 'bi.doi_soat_giao_dich_A', objectLabel: 'bi.doi_soat_giao_dich_A', column: 'loai_giao_dich', params: 'DM-007 · 8 giá trị', warn: 100, crit: 98, severity: 'Cao', lastScore: 99.98, failedRows: 2_418, totalRows: 12_480_331, lastResult: 'Cảnh báo', trend: [100, 100, 100, 100, 100, 100, 99.98] }),
  RI({ id: 'LT-0004', ruleTypeId: 'RL-12', ruleName: 'Không trùng theo một cột', dimension: 'uniqueness', objectType: 'Cột', objectId: 'bi.doi_soat_giao_dich_A', objectLabel: 'bi.doi_soat_giao_dich_A', column: 'ma_giao_dich', warn: 100, crit: 99.9, severity: 'Nghiêm trọng', blockDownstream: true, totalRows: 12_480_331 }),
  RI({ id: 'LT-0005', ruleTypeId: 'RL-18', ruleName: 'Độ tươi dữ liệu', dimension: 'timeliness', objectId: 'bi.doi_soat_giao_dich_A', objectLabel: 'bi.doi_soat_giao_dich_A', params: 'tối đa 26 giờ', severity: 'Cao', trigger: 'Theo sự kiện', schedule: 'Sau khi JOB-0412 kết thúc', lastScore: 100, blockDownstream: true }),
  RI({ id: 'LT-0006', ruleTypeId: 'RL-21', ruleName: 'Biến động khối lượng', dimension: 'accuracy', objectId: 'bi.doi_soat_giao_dich_A', objectLabel: 'bi.doi_soat_giao_dich_A', params: 'lệch tối đa 20%', warn: 80, crit: 60, severity: 'Trung bình', lastScore: 96, trend: [98, 97, 99, 96, 95, 97, 96], totalRows: 12_480_331 }),
  RI({ id: 'LT-0007', ruleTypeId: 'RL-16', ruleName: 'Tỷ lệ thoả biểu thức', dimension: 'accuracy', objectType: 'Cột', objectId: 'bi.doi_soat_giao_dich_A', objectLabel: 'bi.doi_soat_giao_dich_A', column: 'chenh_lech', params: 'ABS(chenh_lech) < 1000', warn: 98, crit: 95, severity: 'Cao', lastScore: 97.4, lastResult: 'Cảnh báo', failedRows: 324_488, totalRows: 12_480_331, trend: [99, 98, 98, 97, 98, 97, 97] }),
  RI({ id: 'LT-0008', ruleTypeId: 'RL-01', ruleName: 'Không được để trống', dimension: 'completeness', objectType: 'Cột', objectId: 'crm.khach_hang', objectLabel: 'crm.khach_hang', column: 'so_dien_thoai', warn: 99, crit: 97, severity: 'Cao', lastScore: 98.2, lastResult: 'Cảnh báo', failedRows: 151_432, totalRows: 8_412_907, trend: [99, 99, 98, 98, 98, 98, 98] }),
  RI({ id: 'LT-0009', ruleTypeId: 'RL-02', ruleName: 'Tỷ lệ điền tối thiểu', dimension: 'completeness', objectType: 'Cột', objectId: 'crm.khach_hang', objectLabel: 'crm.khach_hang', column: 'email', params: 'tối thiểu 80%', warn: 80, crit: 70, severity: 'Trung bình', lastScore: 75.4, lastResult: 'Không đạt', failedRows: 2_069_575, totalRows: 8_412_907, trend: [79, 78, 78, 77, 76, 76, 75] }),
  RI({ id: 'LT-0010', ruleTypeId: 'RL-05', ruleName: 'Đúng định dạng (biểu thức)', dimension: 'validity', objectType: 'Cột', objectId: 'crm.khach_hang', objectLabel: 'crm.khach_hang', column: 'so_cccd', params: '^[0-9]{12}$', warn: 99, crit: 96, severity: 'Cao', lastScore: 91.6, lastResult: 'Không đạt', failedRows: 706_684, totalRows: 8_412_907, trend: [94, 93, 93, 92, 92, 91, 91] }),
  RI({ id: 'LT-0011', ruleTypeId: 'RL-24', ruleName: 'Không trùng theo tổ hợp cột', dimension: 'uniqueness', objectId: 'mart.doanh_thu_ngay', objectLabel: 'mart.doanh_thu_ngay', params: 'ngay + ma_kenh + ma_san_pham', warn: 100, crit: 99.9, severity: 'Nghiêm trọng', totalRows: 1_284_006 }),
  RI({ id: 'LT-0012', ruleTypeId: 'RL-19', ruleName: 'Số dòng trong ngưỡng', dimension: 'completeness', objectId: 'mart.doanh_thu_ngay', objectLabel: 'mart.doanh_thu_ngay', params: '1.000 – 2.000 dòng/ngày', severity: 'Cao', lastScore: 100, totalRows: 1_284_006 }),
  RI({ id: 'LT-0013', ruleTypeId: 'RL-17', ruleName: 'Dữ liệu về đúng giờ cam kết', dimension: 'timeliness', objectId: 'mart.doanh_thu_ngay', objectLabel: 'mart.doanh_thu_ngay', params: 'trước 08:00', severity: 'Nghiêm trọng', blockDownstream: true, lastScore: 100, trend: [100, 100, 0, 100, 100, 100, 100] }),
  RI({ id: 'LT-0014', ruleTypeId: 'RL-25', ruleName: 'Đối chiếu tổng giữa hai bảng', dimension: 'consistency', objectType: 'Báo cáo', objectId: 'BC-001', objectLabel: 'BC-001 — Báo cáo doanh thu ngày', params: 'SUM(doanh_thu) khớp dwh.giao_dich_thanh_toan', warn: 100, crit: 99, severity: 'Nghiêm trọng', status: 'Nháp', lastResult: 'Đạt', lastScore: 100 }),
  RI({ id: 'LT-0015', ruleTypeId: 'RL-27', ruleName: 'Biến động chỉ tiêu', dimension: 'accuracy', objectType: 'Chỉ tiêu', objectId: 'CT-001', objectLabel: 'CT-001 — Doanh thu ghi nhận', params: 'lệch tối đa 15% so với kỳ trước', warn: 85, crit: 70, severity: 'Cao', lastScore: 92, trend: [96, 94, 95, 93, 92, 94, 92] }),
  RI({ id: 'LT-0016', ruleTypeId: 'RL-18', ruleName: 'Độ tươi dữ liệu', dimension: 'timeliness', objectId: 'rr.diem_rui_ro_kh', objectLabel: 'rr.diem_rui_ro_kh', params: 'tối đa 12 giờ', severity: 'Cao', lastResult: 'Không đạt', lastScore: 0, trend: [100, 100, 100, 0, 0, 0, 0], owner: 'Đỗ Quang Vinh' }),
  RI({ id: 'LT-0017', ruleTypeId: 'RL-14', ruleName: 'Chỉ số thống kê trong ngưỡng', dimension: 'accuracy', objectType: 'Cột', objectId: 'rr.diem_rui_ro_kh', objectLabel: 'rr.diem_rui_ro_kh', column: 'diem_rui_ro', params: 'trung bình 20 – 45', warn: 95, crit: 88, severity: 'Trung bình', lastScore: 88.4, lastResult: 'Cảnh báo', owner: 'Đỗ Quang Vinh' }),
  RI({ id: 'LT-0018', ruleTypeId: 'RL-11', ruleName: 'Mã phải tồn tại trong danh mục', dimension: 'consistency', objectType: 'Cột', objectId: 'bi.doi_soat_giao_dich_A', objectLabel: 'bi.doi_soat_giao_dich_A', column: 'ma_doi_tac', params: 'DM-004 · ma_doi_tac', warn: 100, crit: 99, severity: 'Cao', status: 'Nháp', lastResult: 'Đạt', lastScore: 100, trend: [0, 0, 0, 0, 0, 0, 0] }),
  RI({ id: 'LT-0019', ruleTypeId: 'RL-07', ruleName: 'Nằm trong khoảng giá trị', dimension: 'validity', objectType: 'Cột', objectId: 'raw.doi_soat_A_tho', objectLabel: 'raw.doi_soat_A_tho', column: 'so_tien', params: '1.000 – 5.000.000.000', severity: 'Cao', lastScore: 99.7, owner: 'Trần Văn Hùng', totalRows: 12_512_004 }),
  RI({ id: 'LT-0020', ruleTypeId: 'RL-19', ruleName: 'Số dòng trong ngưỡng', dimension: 'completeness', objectId: 'raw.doi_soat_A_tho', objectLabel: 'raw.doi_soat_A_tho', params: '10 tr – 15 tr dòng', severity: 'Nghiêm trọng', lastScore: 100, owner: 'Trần Văn Hùng', trigger: 'Theo sự kiện', schedule: 'Ngay khi nạp xong lô' }),
  RI({ id: 'LT-0021', ruleTypeId: 'RL-12', ruleName: 'Không trùng theo một cột', dimension: 'uniqueness', objectType: 'Dữ liệu chủ', objectId: 'MDM-KH', objectLabel: 'MDM-KH — Khách hàng chuẩn', column: 'so_cccd', warn: 100, crit: 99.5, severity: 'Nghiêm trọng', lastScore: 99.7, lastResult: 'Cảnh báo', owner: 'Phạm Thu Hà', failedRows: 3_182, totalRows: 1_284_500 }),
  RI({ id: 'LT-0022', ruleTypeId: 'RL-20', ruleName: 'Phủ đủ khoảng thời gian', dimension: 'completeness', objectId: 'fin.so_cai_doi_soat', objectLabel: 'fin.so_cai_doi_soat', params: 'không thiếu ngày trong 90 ngày', severity: 'Cao', lastScore: 100, owner: 'Phạm Thu Hà' }),
]

export const rulesOf = (objectId: string) => ruleInstances.filter(r => r.objectId === objectId)

/* ═══════════════ 3.3 Phân tích dữ liệu (Profiling) ═══════════════ */

export const profiles: ProfileRow[] = [
  { tableId: 'bi.doi_soat_giao_dich_A', column: 'ma_giao_dich', type: 'string', nullPct: 0, distinct: 12_480_331, min: 'GD00000001', max: 'GD12480331', mean: null, topValue: '—', topPct: 0, duplicates: 0, scannedAt: '2026-08-09 03:12', suggestions: [{ rule: 'Không trùng theo một cột', reason: 'Số giá trị phân biệt bằng số dòng → đây là khoá', dimension: 'uniqueness' }] },
  { tableId: 'bi.doi_soat_giao_dich_A', column: 'so_dien_thoai', type: 'string', nullPct: 3.2, distinct: 3_842_118, min: '0300000001', max: '0999999998', mean: null, topValue: '0912345678', topPct: 0.02, duplicates: 8_638_213, scannedAt: '2026-08-09 03:12', suggestions: [{ rule: 'Đúng định dạng (biểu thức)', reason: '5,8% giá trị không khớp mẫu số điện thoại Việt Nam', dimension: 'validity' }, { rule: 'Tỷ lệ điền tối thiểu', reason: 'Tỷ lệ rỗng 3,2% — vượt ngưỡng khuyến nghị 1%', dimension: 'completeness' }] },
  { tableId: 'bi.doi_soat_giao_dich_A', column: 'so_cccd', type: 'string', nullPct: 12.8, distinct: 3_104_882, min: '001000000001', max: '096999999999', mean: null, topValue: '(rỗng)', topPct: 12.8, duplicates: 9_375_449, scannedAt: '2026-08-09 03:12', suggestions: [{ rule: 'Đúng định dạng (biểu thức)', reason: 'Có giá trị 9 ký tự (CMND cũ) lẫn 12 ký tự', dimension: 'validity' }] },
  { tableId: 'bi.doi_soat_giao_dich_A', column: 'so_tien', type: 'decimal', nullPct: 0, distinct: 842_118, min: '1000', max: '4980000000', mean: '412.804', topValue: '50000', topPct: 4.2, duplicates: 0, scannedAt: '2026-08-09 03:12', suggestions: [{ rule: 'Nằm trong khoảng giá trị', reason: 'Giá trị lớn nhất 4,98 tỷ — cần xác nhận có hợp lệ', dimension: 'validity' }, { rule: 'Chỉ số thống kê trong ngưỡng', reason: 'Trung bình ổn định qua 7 ngày → phù hợp giám sát', dimension: 'accuracy' }] },
  { tableId: 'bi.doi_soat_giao_dich_A', column: 'loai_giao_dich', type: 'string', nullPct: 0, distinct: 8, min: 'CHUYEN', max: 'THANHTOAN', mean: null, topValue: 'THANHTOAN', topPct: 42.6, duplicates: 0, scannedAt: '2026-08-09 03:12', suggestions: [{ rule: 'Thuộc tập giá trị cho phép', reason: 'Chỉ 8 giá trị phân biệt → phù hợp kiểm tập giá trị', dimension: 'validity' }] },
  { tableId: 'bi.doi_soat_giao_dich_A', column: 'ma_doi_tac', type: 'string', nullPct: 0.1, distinct: 42, min: 'DT001', max: 'DT042', mean: null, topValue: 'DT001', topPct: 61.4, duplicates: 0, scannedAt: '2026-08-09 03:12', suggestions: [{ rule: 'Mã phải tồn tại trong danh mục', reason: 'Giá trị khớp mẫu mã của danh mục DM-004', dimension: 'consistency' }] },
  { tableId: 'bi.doi_soat_giao_dich_A', column: 'chenh_lech', type: 'decimal', nullPct: 2.1, distinct: 12_842, min: '-4200000', max: '3800000', mean: '184', topValue: '0', topPct: 94.8, duplicates: 0, scannedAt: '2026-08-09 03:12', suggestions: [{ rule: 'Tỷ lệ thoả biểu thức', reason: '94,8% bằng 0 → nên giám sát tỷ lệ khác 0', dimension: 'accuracy' }] },
  { tableId: 'bi.doi_soat_giao_dich_A', column: 'ma_tinh_thanh', type: 'string', nullPct: 8.4, distinct: 63, min: '01', max: '96', mean: null, topValue: '79', topPct: 28.4, duplicates: 0, scannedAt: '2026-08-09 03:12', suggestions: [{ rule: 'Mã phải tồn tại trong danh mục', reason: 'Khớp danh mục DM-001 — tỉnh/thành', dimension: 'consistency' }] },
  { tableId: 'crm.khach_hang', column: 'email', type: 'string', nullPct: 24.6, distinct: 5_218_004, min: 'a@a.vn', max: 'zz@zz.com', mean: null, topValue: '(rỗng)', topPct: 24.6, duplicates: 1_125_328, scannedAt: '2026-08-09 03:18', suggestions: [{ rule: 'Tỷ lệ điền tối thiểu', reason: 'Tỷ lệ rỗng 24,6% — rất cao với cột liên hệ', dimension: 'completeness' }] },
  { tableId: 'crm.khach_hang', column: 'phan_khuc', type: 'string', nullPct: 32.4, distinct: 5, min: 'BASIC', max: 'VIP', mean: null, topValue: '(rỗng)', topPct: 32.4, duplicates: 0, scannedAt: '2026-08-09 03:18', suggestions: [{ rule: 'Bắt buộc có điều kiện', reason: 'Khách hàng ACTIVE nhưng chưa có phân khúc', dimension: 'completeness' }, { rule: 'Thuộc tập giá trị cho phép', reason: '5 giá trị phân biệt — khớp tập giá trị đã khai', dimension: 'validity' }] },
]

export const profilesOf = (tableId: string) => profiles.filter(p => p.tableId === tableId)

/* ═══════════════ 3.4 Sự cố chất lượng ═══════════════ */

export const incidents: IncidentRow[] = [
  {
    id: 'SC-0231', title: 'Số điện thoại sai định dạng vượt ngưỡng', objectType: 'Bảng',
    objectId: 'bi.doi_soat_giao_dich_A', column: 'so_dien_thoai',
    ruleId: 'LT-0002', ruleName: 'Đúng định dạng (biểu thức)', dimension: 'validity',
    severity: 'Cao', status: 'Đang xử lý', assignee: 'Trần Văn Hùng', reporter: 'Hệ thống',
    dueAt: '2026-08-11 17:00', openedAt: '2026-08-07 07:22', openedDays: 2, recurrence: 4,
    rootCause: 'Đối tác A gửi số điện thoại có tiền tố +84 thay vì 84', closeReason: null,
    failedRows: 723_058,
    sampleRows: [
      { ma_giao_dich: 'GD11840221', so_dien_thoai: '+84912345678', ngay_giao_dich: '2026-08-07', ma_doi_tac: 'DT001' },
      { ma_giao_dich: 'GD11840577', so_dien_thoai: '84 912 345 679', ngay_giao_dich: '2026-08-07', ma_doi_tac: 'DT001' },
      { ma_giao_dich: 'GD11841002', so_dien_thoai: '0912-345-680', ngay_giao_dich: '2026-08-07', ma_doi_tac: 'DT001' },
      { ma_giao_dich: 'GD11841338', so_dien_thoai: '', ngay_giao_dich: '2026-08-07', ma_doi_tac: 'DT003' },
    ],
    timeline: [
      { time: '2026-08-07 07:22', who: 'Hệ thống', title: 'Phát hiện lỗi', text: 'Luật LT-0002 trả về 94,2% — dưới ngưỡng cảnh báo 99%', tone: 'r' },
      { time: '2026-08-07 07:23', who: 'Hệ thống', title: 'Gửi cảnh báo', text: 'Email + Telegram tới nhóm Đối soát', tone: 'o' },
      { time: '2026-08-07 08:05', who: 'Nguyễn Thị Phương', title: 'Gán người xử lý', text: 'Gán cho Trần Văn Hùng — hạn 11/08', tone: 'b' },
      { time: '2026-08-08 09:40', who: 'Trần Văn Hùng', title: 'Cập nhật nguyên nhân', text: 'Đối tác A đổi định dạng số điện thoại từ bản phát hành 05/08', tone: 'b' },
      { time: '2026-08-09 10:15', who: 'Trần Văn Hùng', title: 'Đang chuẩn hoá', text: 'Bổ sung bước chuẩn hoá số điện thoại vào JOB-0412 bước 2', tone: 'b' },
    ],
    recheck: null,
  },
  {
    id: 'SC-0230', title: 'Tỷ lệ điền email dưới ngưỡng', objectType: 'Bảng',
    objectId: 'crm.khach_hang', column: 'email',
    ruleId: 'LT-0009', ruleName: 'Tỷ lệ điền tối thiểu', dimension: 'completeness',
    severity: 'Trung bình', status: 'Chờ kiểm tra lại', assignee: 'Phạm Thu Hà', reporter: 'Hệ thống',
    dueAt: '2026-08-10 17:00', openedAt: '2026-08-05 03:20', openedDays: 4, recurrence: 12,
    rootCause: 'Kênh đăng ký qua ứng dụng không bắt buộc nhập email', closeReason: null,
    failedRows: 2_069_575,
    sampleRows: [
      { ma_khach_hang: 'KH8412001', ho_ten: 'Nguyễn V*** A', email: '', ngay_mo: '2026-08-01' },
      { ma_khach_hang: 'KH8412044', ho_ten: 'Trần T*** B', email: '', ngay_mo: '2026-08-02' },
    ],
    timeline: [
      { time: '2026-08-05 03:20', who: 'Hệ thống', title: 'Phát hiện lỗi', text: 'Tỷ lệ điền 75,4% — dưới ngưỡng 80%', tone: 'r' },
      { time: '2026-08-05 09:12', who: 'Phạm Thu Hà', title: 'Nhận xử lý', tone: 'b' },
      { time: '2026-08-08 16:30', who: 'Phạm Thu Hà', title: 'Đã xử lý', text: 'Đã bổ sung trường email bắt buộc trên luồng đăng ký. Chờ hệ thống kiểm tra lại.', tone: 'g' },
    ],
    recheck: { at: '2026-08-09 03:20', result: 'Không đạt', score: 75.9 },
  },
  {
    id: 'SC-0229', title: 'Dữ liệu điểm rủi ro không cập nhật quá 12 giờ', objectType: 'Bảng',
    objectId: 'rr.diem_rui_ro_kh', column: null,
    ruleId: 'LT-0016', ruleName: 'Độ tươi dữ liệu', dimension: 'timeliness',
    severity: 'Nghiêm trọng', status: 'Mới', assignee: null, reporter: 'Hệ thống',
    dueAt: '2026-08-09 17:00', openedAt: '2026-08-09 06:00', openedDays: 0, recurrence: 3,
    rootCause: null, closeReason: null, failedRows: 0,
    sampleRows: [],
    timeline: [
      { time: '2026-08-09 06:00', who: 'Hệ thống', title: 'Phát hiện lỗi', text: 'Lần cập nhật cuối cách đây 18 giờ — vượt ngưỡng 12 giờ', tone: 'r' },
      { time: '2026-08-09 06:01', who: 'Hệ thống', title: 'Chưa có người phụ trách', text: 'Bảng chưa gán đầu mối nghiệp vụ — không tự gán được', tone: 'o' },
    ],
    recheck: null,
  },
  {
    id: 'SC-0228', title: 'Số căn cước sai định dạng', objectType: 'Bảng',
    objectId: 'crm.khach_hang', column: 'so_cccd',
    ruleId: 'LT-0010', ruleName: 'Đúng định dạng (biểu thức)', dimension: 'validity',
    severity: 'Cao', status: 'Chờ duyệt đóng', assignee: 'Trần Văn Hùng', reporter: 'Hệ thống',
    dueAt: '2026-08-09 17:00', openedAt: '2026-08-01 03:18', openedDays: 8, recurrence: 6,
    rootCause: 'Dữ liệu CMND 9 số cũ chưa chuyển đổi sang CCCD 12 số',
    closeReason: null, failedRows: 706_684,
    sampleRows: [
      { ma_khach_hang: 'KH0012884', so_cccd: '012345678', ngay_mo: '2016-03-04' },
      { ma_khach_hang: 'KH0018420', so_cccd: '01234567', ngay_mo: '2015-11-22' },
    ],
    timeline: [
      { time: '2026-08-01 03:18', who: 'Hệ thống', title: 'Phát hiện lỗi', tone: 'r' },
      { time: '2026-08-02 10:00', who: 'Phạm Thu Hà', title: 'Gán người xử lý', text: 'Gán Trần Văn Hùng', tone: 'b' },
      { time: '2026-08-07 15:22', who: 'Trần Văn Hùng', title: 'Đề xuất đóng', text: 'Đây là dữ liệu lịch sử, không sửa được. Đề nghị tách luật riêng cho khách hàng mở trước 2021.', tone: 'o' },
      { time: '2026-08-08 09:00', who: 'Hệ thống', title: 'Chuyển chờ duyệt đóng', text: 'Áp dụng nguyên tắc 4 mắt — người xử lý không được tự đóng', tone: 'o' },
    ],
    recheck: { at: '2026-08-08 03:18', result: 'Không đạt', score: 91.6 },
  },
  {
    id: 'SC-0227', title: 'Doanh thu ngày về trễ sau 08:00', objectType: 'Bảng',
    objectId: 'mart.doanh_thu_ngay', column: null,
    ruleId: 'LT-0013', ruleName: 'Dữ liệu về đúng giờ cam kết', dimension: 'timeliness',
    severity: 'Nghiêm trọng', status: 'Đã đóng', assignee: 'Trần Văn Hùng', reporter: 'Hệ thống',
    dueAt: '2026-08-04 12:00', openedAt: '2026-08-04 08:05', openedDays: 0, recurrence: 2,
    rootCause: 'JOB-0301 chờ bảng nguồn bị chặn bởi cổng chất lượng',
    closeReason: 'Đã khắc phục — nguyên nhân từ hệ thống nguồn', failedRows: 0,
    sampleRows: [],
    timeline: [
      { time: '2026-08-04 08:05', who: 'Hệ thống', title: 'Phát hiện lỗi', tone: 'r' },
      { time: '2026-08-04 08:20', who: 'Trần Văn Hùng', title: 'Nhận xử lý', tone: 'b' },
      { time: '2026-08-04 10:40', who: 'Trần Văn Hùng', title: 'Đã xử lý', text: 'Chạy lại JOB-0301 sau khi bảng nguồn được cho qua', tone: 'g' },
      { time: '2026-08-04 11:15', who: 'Hệ thống', title: 'Kiểm tra lại — Đạt', text: 'Luật LT-0013 đạt 100%', tone: 'g' },
      { time: '2026-08-04 11:30', who: 'Nguyễn Thị Phương', title: 'Đóng sự cố', text: 'Lý do: Đã khắc phục — nguyên nhân từ hệ thống nguồn', tone: 'n' },
    ],
    recheck: { at: '2026-08-04 11:15', result: 'Đạt', score: 100 },
  },
  {
    id: 'SC-0226', title: 'Chênh lệch đối soát vượt ngưỡng', objectType: 'Bảng',
    objectId: 'bi.doi_soat_giao_dich_A', column: 'chenh_lech',
    ruleId: 'LT-0007', ruleName: 'Tỷ lệ thoả biểu thức', dimension: 'accuracy',
    severity: 'Cao', status: 'Đã gán', assignee: 'Nguyễn Thị Phương', reporter: 'Hệ thống',
    dueAt: '2026-08-12 17:00', openedAt: '2026-08-08 07:20', openedDays: 1, recurrence: 8,
    rootCause: null, closeReason: null, failedRows: 324_488,
    sampleRows: [
      { ma_giao_dich: 'GD11842004', so_tien: '2500000', so_tien_doi_tac: '2450000', chenh_lech: '50000' },
      { ma_giao_dich: 'GD11842118', so_tien: '180000', so_tien_doi_tac: '0', chenh_lech: '180000' },
    ],
    timeline: [
      { time: '2026-08-08 07:20', who: 'Hệ thống', title: 'Phát hiện lỗi', text: 'Tỷ lệ chênh lệch < 1.000đ chỉ đạt 97,4%', tone: 'r' },
      { time: '2026-08-08 08:00', who: 'Hệ thống', title: 'Tự gán người phụ trách', text: 'Gán cho đầu mối nghiệp vụ của bảng: Nguyễn Thị Phương', tone: 'b' },
    ],
    recheck: null,
  },
  {
    id: 'SC-0225', title: 'Loại giao dịch xuất hiện giá trị lạ', objectType: 'Bảng',
    objectId: 'bi.doi_soat_giao_dich_A', column: 'loai_giao_dich',
    ruleId: 'LT-0003', ruleName: 'Thuộc tập giá trị cho phép', dimension: 'validity',
    severity: 'Trung bình', status: 'Đã giải quyết', assignee: 'Lê Minh Tuấn', reporter: 'Nguyễn Thị Phương',
    dueAt: '2026-08-08 17:00', openedAt: '2026-08-06 07:18', openedDays: 3, recurrence: 1,
    rootCause: 'Nghiệp vụ mới ĐIỀU CHỈNH chưa được bổ sung vào danh mục DM-007',
    closeReason: null, failedRows: 2_418,
    sampleRows: [{ ma_giao_dich: 'GD11838004', loai_giao_dich: 'DIEUCHINH', ngay_giao_dich: '2026-08-06' }],
    timeline: [
      { time: '2026-08-06 07:18', who: 'Hệ thống', title: 'Phát hiện lỗi', tone: 'r' },
      { time: '2026-08-06 11:02', who: 'Phạm Thu Hà', title: 'Gửi duyệt bổ sung danh mục', text: 'Tạo yêu cầu PD-0084 thêm giá trị ĐIỀU CHỈNH vào DM-007', tone: 'b' },
      { time: '2026-08-08 14:20', who: 'Lê Minh Tuấn', title: 'Đã giải quyết', text: 'Chờ danh mục được duyệt là luật sẽ đạt', tone: 'g' },
    ],
    recheck: null,
  },
  {
    id: 'SC-0224', title: 'Điểm rủi ro trung bình lệch ngưỡng', objectType: 'Bảng',
    objectId: 'rr.diem_rui_ro_kh', column: 'diem_rui_ro',
    ruleId: 'LT-0017', ruleName: 'Chỉ số thống kê trong ngưỡng', dimension: 'accuracy',
    severity: 'Trung bình', status: 'Đang xử lý', assignee: 'Đỗ Quang Vinh', reporter: 'Hệ thống',
    dueAt: '2026-08-13 17:00', openedAt: '2026-08-06 03:05', openedDays: 3, recurrence: 2,
    rootCause: null, closeReason: null, failedRows: 0, sampleRows: [],
    timeline: [
      { time: '2026-08-06 03:05', who: 'Hệ thống', title: 'Phát hiện lỗi', text: 'Trung bình 47,2 — vượt ngưỡng trên 45', tone: 'r' },
      { time: '2026-08-06 09:30', who: 'Đỗ Quang Vinh', title: 'Nhận xử lý', tone: 'b' },
    ],
    recheck: null,
  },
]

export const incidentById = (id: string) => incidents.find(i => i.id === id)

export const CLOSE_REASONS = [
  'Đã khắc phục — dữ liệu đạt sau khi kiểm tra lại',
  'Đã khắc phục — nguyên nhân từ hệ thống nguồn',
  'Cảnh báo sai — luật đặt chưa đúng',
  'Chấp nhận rủi ro — có phê duyệt của Người sở hữu dữ liệu',
  'Trùng với sự cố khác',
  'Không còn áp dụng — đối tượng đã ngừng sử dụng',
]

/* ═══════════════ 3.5 Cảnh báo ═══════════════ */

export const alertRules: AlertRule[] = [
  { id: 'CB-01', name: 'Sự cố nghiêm trọng trên bảng Tier 1', condition: 'Mức độ = Nghiêm trọng VÀ Tier = 1', scope: 'Toàn hệ thống', mode: 'Gửi ngay', channels: ['KG-01', 'KG-03'], recipients: ['Nhóm Đối soát', 'Trần Văn Hùng', 'Nguyễn Thị Phương'], dedupe: 'Không gửi lại trong 4 giờ cho cùng luật', status: 'Bật', sentMonth: 42, owner: 'Nguyễn Thị Phương' },
  { id: 'CB-02', name: 'Dữ liệu về trễ so với giờ cam kết', condition: 'Chiều Kịp thời không đạt', scope: 'Bảng có chu kỳ cam kết', mode: 'Gửi ngay', channels: ['KG-01', 'KG-02'], recipients: ['Đầu mối kỹ thuật của bảng'], dedupe: 'Một lần cho mỗi bảng mỗi ngày', status: 'Bật', sentMonth: 128, owner: 'Trần Văn Hùng' },
  { id: 'CB-03', name: 'Tổng hợp chất lượng hằng ngày', condition: 'Mọi kết quả kiểm tra trong ngày', scope: 'Toàn hệ thống', mode: 'Tổng hợp ngày', channels: ['KG-01'], recipients: ['Nhóm Quản trị dữ liệu'], dedupe: '—', status: 'Bật', sentMonth: 31, owner: 'Nguyễn Thị Phương' },
  { id: 'CB-04', name: 'Lô dữ liệu bị giữ ở vùng chờ', condition: 'Cổng chất lượng chặn lô nạp', scope: 'Cửa nạp dữ liệu', mode: 'Gửi ngay', channels: ['KG-03', 'KG-04'], recipients: ['Trần Văn Hùng'], dedupe: 'Theo từng lô', status: 'Bật', sentMonth: 18, owner: 'Trần Văn Hùng' },
  { id: 'CB-05', name: 'Báo cáo tuần cho lãnh đạo', condition: 'Tổng hợp điểm chất lượng theo miền', scope: 'Toàn hệ thống', mode: 'Tổng hợp tuần', channels: ['KG-01'], recipients: ['Ban Điều hành'], dedupe: '—', status: 'Bật', sentMonth: 4, owner: 'Nguyễn Thị Phương' },
  { id: 'CB-06', name: 'Sự cố quá hạn chưa xử lý', condition: 'Sự cố quá hạn > 24 giờ', scope: 'Toàn hệ thống', mode: 'Gom lô 15 phút', channels: ['KG-01', 'KG-03'], recipients: ['Người xử lý', 'Người sở hữu dữ liệu'], dedupe: 'Mỗi 12 giờ', status: 'Bật', sentMonth: 26, owner: 'Phạm Thu Hà' },
  { id: 'CB-07', name: 'Cảnh báo thử nghiệm nhóm Rủi ro', condition: 'Bảng thuộc miền Rủi ro & Tuân thủ', scope: 'Miền Rủi ro & Tuân thủ', mode: 'Gửi ngay', channels: ['KG-02'], recipients: ['Đỗ Quang Vinh'], dedupe: 'Không', status: 'Tắt', sentMonth: 0, owner: 'Đỗ Quang Vinh' },
]

export const alertChannels: AlertChannel[] = [
  { id: 'KG-01', name: 'Email nhóm Quản trị dữ liệu', kind: 'Email', config: 'smtp.noibo.vn:587 · dataops@congty.vn', status: 'Hoạt động', sentMonth: 1284, failed: 4, failRate: 0.3 },
  { id: 'KG-02', name: 'SMS đầu mối trực', kind: 'SMS', config: 'Brandname DATAOPS · 6 số điện thoại', status: 'Hoạt động', sentMonth: 86, failed: 3, failRate: 3.5 },
  { id: 'KG-03', name: 'Telegram nhóm Đối soát', kind: 'Telegram', config: 'Bot @dmp_alert_bot · chat -100248…', status: 'Hoạt động', sentMonth: 642, failed: 1, failRate: 0.2 },
  { id: 'KG-04', name: 'Tạo phiếu Jira', kind: 'Jira', config: 'Dự án DATAOPS · loại phiếu Sự cố dữ liệu', status: 'Hoạt động', sentMonth: 128, failed: 0, failRate: 0 },
  { id: 'KG-05', name: 'Webhook hệ thống giám sát', kind: 'Webhook', config: 'POST https://monitor.noibo.vn/hooks/dmp', status: 'Lỗi', sentMonth: 42, failed: 18, failRate: 42.9 },
  { id: 'KG-06', name: 'Email Ban Điều hành', kind: 'Email', config: 'smtp.noibo.vn:587 · bandieuhanh@congty.vn', status: 'Tạm dừng', sentMonth: 4, failed: 0, failRate: 0 },
]

/* Mức che dữ liệu — dùng ở màn chính sách che (5.2) */
export const MASK_TYPES = [
  { id: 'full', name: 'Che toàn bộ', sample: '0912345678', masked: '**********', sql: "REGEXP_REPLACE({cot}, '.', '*')" },
  { id: 'last4', name: 'Giữ 4 ký tự cuối', sample: '0912345678', masked: '******5678', sql: "CONCAT(REPEAT('*', LENGTH({cot})-4), RIGHT({cot},4))" },
  { id: 'first1', name: 'Giữ ký tự đầu', sample: 'Nguyễn Văn An', masked: 'N************', sql: "CONCAT(LEFT({cot},1), REPEAT('*', LENGTH({cot})-1))" },
  { id: 'email', name: 'Che phần trước @', sample: 'an.nguyen@congty.vn', masked: '***@congty.vn', sql: "CONCAT('***', SUBSTR({cot}, INSTR({cot},'@')))" },
  { id: 'hash', name: 'Băm một chiều', sample: '001234567890', masked: 'a3f9…c21e', sql: 'SHA2({cot}, 256)' },
  { id: 'null', name: 'Trả về rỗng', sample: '001234567890', masked: '(NULL)', sql: 'CAST(NULL AS STRING)' },
  { id: 'const', name: 'Thay bằng hằng số', sample: '2.500.000', masked: '0', sql: "'0'" },
  { id: 'partial_addr', name: 'Chỉ giữ tỉnh/thành', sample: 'Số 5, Nguyễn Trãi, Thanh Xuân, Hà Nội', masked: '…, Hà Nội', sql: "CONCAT('…, ', REGEXP_EXTRACT({cot}, '[^,]+$'))" },
]
