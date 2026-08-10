import { useMemo, useState } from 'react'
import {
  PageHeader, KpiRow, FilterBar, DataTable, Panel, Note, Chip, StatusChip, ActionButton,
  IconBtn, RowActions, EntityLink, InfoGrid, InlineTabs, Modal, useToast, Field, SelectInput,
  SectionTitle, ProgressBar, EmptyState, Drawer,
} from '@/components/common'
import { auditLog, anomalies, users, userPermissionReport, policies, STATS, fmt } from '@/data'
import { match } from '@/lib/demo'

/* ═════════ 5.4 Nhật ký kiểm toán ═════════ */

export function AuditLog() {
  const [q, setQ] = useState('')
  const [action, setAction] = useState('')
  const [result, setResult] = useState('')
  const [pick, setPick] = useState<any>(null)

  const rows = useMemo(
    () => auditLog.filter(a => (!action || a.action === action) && (!result || a.result === result) && match(`${a.user} ${a.objectId} ${a.detail} ${a.ip}`, q)),
    [q, action, result]
  )

  return (
    <>
      <PageHeader
        code="5.4"
        title="Nhật ký kiểm toán"
        desc="Ai truy cập gì, lúc nào, và chính sách nào quyết định — gộp 5 màn nhật ký rời rạc của SQLWF về một chỗ"
        crumbs={[{ label: 'Data Security' }, { label: 'Nhật ký kiểm toán' }]}
        actions={<ActionButton variant="ghost" icon="export">Xuất nhật ký</ActionButton>}
      />

      <KpiRow
        items={[
          { label: 'Bản ghi trong kỳ', value: fmt(98_421), sub: '30 ngày gần nhất' },
          { label: 'Lượt bị từ chối', value: auditLog.filter(a => a.result === 'Từ chối').length, sub: 'chính sách chặn thành công', tone: 'ok' },
          { label: 'Lượt cảnh báo', value: auditLog.filter(a => a.result === 'Cảnh báo').length, sub: 'cho phép nhưng bất thường', tone: 'bad' },
          { label: 'Lượt tải xuống', value: auditLog.filter(a => a.action === 'Tải xuống').length, sub: 'điểm rủi ro lộ dữ liệu', tone: 'warn' },
          { label: 'Thời gian lưu nhật ký', value: '5 năm', sub: 'theo quy tắc vòng đời VD-04' },
        ]}
      />

      <div className="mt-4">
        <FilterBar
          placeholder="Tìm theo người dùng, đối tượng, địa chỉ IP…"
          value={q}
          onChange={setQ}
          filters={[
            { label: 'Hành động', options: ['Xem', 'Truy vấn', 'Tải xuống', 'Sửa metadata', 'Cấp quyền', 'Thu hồi quyền', 'Chia sẻ', 'Đăng nhập'], value: action, onChange: setAction },
            { label: 'Kết quả', options: ['Cho phép', 'Từ chối', 'Cảnh báo'], value: result, onChange: setResult },
          ]}
          right={<span className="text-[12px] text-slate-400">{rows.length} bản ghi</span>}
        />
      </div>

      <DataTable
        stt
        rows={rows}
        rowKey={a => a.id}
        highlightRow={a => (a.result === 'Từ chối' ? 'bad' : a.result === 'Cảnh báo' ? 'warn' : undefined)}
        onRowClick={a => setPick(a)}
        columns={[
          { key: 'at', label: 'Thời điểm', nowrap: true, render: a => <span className="mono text-[11.5px]">{a.at}</span> },
          { key: 'user', label: 'Người dùng', nowrap: true, render: a => <span className="font-semibold">{a.user}</span> },
          { key: 'action', label: 'Hành động', nowrap: true, render: a => <Chip tone={a.action === 'Tải xuống' ? 'o' : a.action === 'Cấp quyền' || a.action === 'Thu hồi quyền' ? 'p' : 'n'}>{a.action}</Chip> },
          { key: 'objectType', label: 'Loại đối tượng', nowrap: true, render: a => <Chip tone="t">{a.objectType}</Chip> },
          { key: 'objectId', label: 'Đối tượng', nowrap: true, render: a => <span className="mono text-[11.5px]">{a.objectId}</span> },
          { key: 'detail', label: 'Chi tiết', width: '22%', render: a => <span className="text-[11.5px]">{a.detail}</span> },
          { key: 'rows', label: 'Số dòng', align: 'right', nowrap: true, render: a => (a.rows ? <span className={a.rows > 100_000 ? 'font-bold text-red-600' : ''}>{fmt(a.rows)}</span> : '—') },
          { key: 'decidedBy', label: 'Chính sách quyết định', width: '18%', render: a => <span className="text-[11.5px] text-slate-600">{a.decidedBy}</span> },
          { key: 'ip', label: 'Địa chỉ IP', nowrap: true, render: a => <span className={a.ip.startsWith('10.24') ? 'mono text-[11px] text-slate-500' : 'mono text-[11px] font-bold text-red-600'}>{a.ip}</span> },
          { key: 'result', label: 'Kết quả', nowrap: true, render: a => <Chip tone={a.result === 'Cho phép' ? 'g' : a.result === 'Từ chối' ? 'r' : 'o'}>{a.result}</Chip> },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Note tone="ok" title="Cột “Chính sách nào quyết định” là điểm mới">
          SQLWF cũ chỉ ghi <i>ai làm gì</i>, không ghi <i>vì sao được phép</i>. Khi kiểm toán hỏi
          <i> "căn cứ nào cho người này xem bảng đó"</i> thì phải mở 4 màn phân quyền kiểm tay.
          Nay mỗi dòng nhật ký trỏ thẳng tới mã chính sách hoặc mã yêu cầu cấp quyền.
        </Note>
        <Note tone="bad" title="Hai dòng đáng chú ý trong kỳ">
          <b>NK-98413</b> — Phan Văn Nam (đã nghỉ việc) truy vấn toàn bộ 8,4 triệu dòng bảng khách hàng từ IP ngoài dải nội bộ lúc 22:14.<br />
          <b>NK-98418</b> — Ngô Hoài Sơn tải xuống 482.000 dòng dữ liệu mức Hạn chế truy cập, vượt ngưỡng 50.000 dòng.
        </Note>
      </div>

      <Drawer open={!!pick} onClose={() => setPick(null)} title={pick && `Bản ghi ${pick.id}`} desc={pick?.at} width={560}>
        {pick && (
          <div className="space-y-4">
            <InfoGrid
              items={[
                { label: 'Thời điểm', value: pick.at },
                { label: 'Người thực hiện', value: pick.user },
                { label: 'Hành động', value: pick.action },
                { label: 'Kết quả', value: <Chip tone={pick.result === 'Cho phép' ? 'g' : pick.result === 'Từ chối' ? 'r' : 'o'}>{pick.result}</Chip> },
                { label: 'Loại đối tượng', value: pick.objectType },
                { label: 'Đối tượng', value: <span className="mono">{pick.objectId}</span> },
                { label: 'Số dòng tác động', value: pick.rows ? fmt(pick.rows) : '—' },
                { label: 'Địa chỉ IP', value: <span className="mono">{pick.ip}</span> },
                { label: 'Chi tiết', value: pick.detail, full: true },
                { label: 'Chính sách quyết định', value: pick.decidedBy, full: true },
              ]}
            />
            <Note tone="info" title="Bốn trường bắt buộc theo GĐ4 mục 5.4">
              Người thực hiện và thời điểm · đối tượng dữ liệu và hành động · kết quả · căn cứ quyết định.
              Bản ghi này có đủ cả bốn.
            </Note>
          </div>
        )}
      </Drawer>
    </>
  )
}

/* ═════════ 5.5 Báo cáo quyền & Giám sát truy cập ═════════ */

export function PermReport({ embedded }: { embedded?: boolean } = {}) {
  const [tab, setTab] = useState('report')
  const [userId, setUserId] = useState('U-004')
  const [pick, setPick] = useState<any>(null)
  const toast = useToast()

  const u = users.find(x => x.id === userId)!
  const revoke = userPermissionReport.filter(p => p.suggestion === 'Thu hồi')

  return (
    <>
      {!embedded && (
        <PageHeader
          code="5.2"
          title="Báo cáo quyền & Giám sát truy cập"
          desc="Trả lời “một người đang có quyền gì trên toàn hệ thống” ở một chỗ, và phát hiện truy cập bất thường"
          crumbs={[{ label: 'Data Security' }, { label: 'Báo cáo quyền & Giám sát' }]}
          actions={<ActionButton variant="ghost" icon="export">Xuất báo cáo</ActionButton>}
        />
      )}

      <InlineTabs
        items={[
          { id: 'report', label: 'Báo cáo quyền theo người dùng' },
          { id: 'anomaly', label: 'Giám sát truy cập bất thường', badge: anomalies.filter(a => a.status === 'Mới' || a.status === 'Đang xác minh').length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'report' ? (
        <>
          <Panel className="mb-4">
            <div className="flex items-end gap-3">
              <Field label="Chọn người dùng" className="w-[380px]">
                <SelectInput value={userId} onChange={e => setUserId(e.target.value)}>
                  {users.map(x => <option key={x.id} value={x.id}>{x.name} — {x.account} · {x.unit}</option>)}
                </SelectInput>
              </Field>
              <div className="flex gap-2 pb-1">
                <Chip tone={u.status === 'Hoạt động' ? 'g' : 'r'}>{u.status}</Chip>
                <Chip tone="t">{u.role}</Chip>
                {u.groups.map(g => <Chip key={g} tone="n">{g}</Chip>)}
              </div>
              <ActionButton className="ml-auto" variant="ghost" to="/catalog/tables">Tra theo BẢNG thay vì theo người</ActionButton>
            </div>
          </Panel>

          <KpiRow
            items={[
              { label: 'Số bảng có quyền', value: fmt(u.tableGrants), sub: 'gồm quyền trực tiếp và kế thừa nhóm' },
              { label: 'Quyền đề xuất thu hồi', value: revoke.length, sub: 'không dùng trong 90 ngày', tone: 'bad' },
              { label: 'Quyền vô thời hạn', value: userPermissionReport.filter(p => p.expiry === 'Vô thời hạn').length, sub: `trên ${userPermissionReport.length} quyền hiển thị`, tone: 'warn' },
              { label: 'Cột bị che', value: userPermissionReport.reduce((a, p) => a + p.masked.length, 0), sub: 'do chính sách theo nhãn' },
              { label: 'Đăng nhập gần nhất', value: u.lastLogin.slice(0, 10), sub: u.employed ? 'đang làm việc' : 'đã nghỉ việc', tone: u.employed ? 'ok' : 'bad' },
            ]}
          />

          <div className="mt-4">
            <DataTable
              rows={userPermissionReport}
              rowKey={p => p.object}
              highlightRow={p => (p.suggestion === 'Thu hồi' ? 'bad' : p.suggestion === 'Rà soát' ? 'warn' : undefined)}
              columns={[
                { key: 'object', label: 'Đối tượng', width: '20%', render: p => (p.type === 'Bảng' ? <EntityLink to={`/catalog/tables/${encodeURIComponent(p.object)}`}>{p.object}</EntityLink> : <span className="mono text-[12px]">{p.object}</span>) },
                { key: 'type', label: 'Loại', nowrap: true, render: p => <Chip tone="t">{p.type}</Chip> },
                { key: 'right', label: 'Quyền', nowrap: true },
                { key: 'source', label: 'Nguồn quyền', width: '16%', render: p => <span className="text-[11.5px]">{p.source}</span> },
                { key: 'expiry', label: 'Thời hạn', nowrap: true, render: p => <span className={p.expiry === 'Vô thời hạn' ? 'font-semibold text-red-600' : ''}>{p.expiry}</span> },
                { key: 'used90d', label: '90 ngày qua có dùng', align: 'center', nowrap: true, render: p => (p.used90d ? <Chip tone="g">Có</Chip> : <Chip tone="r">Không</Chip>) },
                { key: 'lastUse', label: 'Lần dùng cuối', nowrap: true },
                { key: 'masked', label: 'Cột bị che', render: p => (p.masked.length ? <div className="flex flex-wrap gap-1">{p.masked.map(m => <Chip key={m} tone="p">{m}</Chip>)}</div> : '—') },
                { key: 'suggestion', label: 'Đề xuất', nowrap: true, render: p => <Chip tone={p.suggestion === 'Thu hồi' ? 'r' : p.suggestion === 'Rà soát' ? 'o' : 'g'}>{p.suggestion}</Chip> },
                {
                  key: 'act', label: '', align: 'right', nowrap: true,
                  render: p => (
                    <RowActions>
                      {p.suggestion === 'Thu hồi' && (
                        <ActionButton variant="danger" onClick={() => toast.success('Đã thu hồi quyền', `${p.object} — ghi nhật ký ở menu 5.4.`)}>Thu hồi</ActionButton>
                      )}
                    </RowActions>
                  ),
                },
              ]}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <Note tone="bad" title={`${revoke.length} quyền chưa dùng lần nào trong 90 ngày`}>
              Quyền thừa là rủi ro thừa. Nếu tài khoản bị lộ, kẻ tấn công dùng được cả những quyền người dùng không bao giờ cần đến.
              Rà soát định kỳ theo báo cáo này là cách rẻ nhất để giảm bề mặt rủi ro.
            </Note>
            <Panel title="Vì sao cần màn này">
              <div className="text-[12.5px] leading-relaxed text-slate-600">
                Trước đây quyền của một người rải ở <b>4 màn khác nhau</b> — nhóm dữ liệu, quyền thư mục, nhãn chặn hàm SQL, quyền menu.
                Muốn biết một người đang có quyền gì thì phải mở từng màn kiểm tay, và vẫn không chắc đủ.
                Màn này gom lại một chỗ, kèm cột <b>90 ngày qua có dùng không</b> để đề xuất thu hồi.
              </div>
            </Panel>
          </div>
        </>
      ) : (
        <>
          <Note tone="warn" title="Bổ sung sau review — gap D8" className="mb-4">
            GĐ4 · FR-04 yêu cầu <i>"theo dõi và cảnh báo khi phát hiện truy cập bất thường (ví dụ tải xuống số lượng lớn bất thường)"</i>.
            Thiết kế ban đầu chỉ có nhật ký kiểm toán — ghi lại nhưng không ai đọc. Màn này biến nhật ký thành cảnh báo có người xử lý.
          </Note>

          <KpiRow
            items={[
              { label: 'Cảnh báo trong kỳ', value: anomalies.length, sub: '30 ngày gần nhất' },
              { label: 'Chưa xử lý', value: anomalies.filter(a => a.status === 'Mới').length, sub: 'cần xác minh ngay', tone: 'bad' },
              { label: 'Đang xác minh', value: anomalies.filter(a => a.status === 'Đang xác minh').length, sub: 'đã có người nhận', tone: 'warn' },
              { label: 'Mức nghiêm trọng', value: anomalies.filter(a => a.severity === 'Nghiêm trọng').length, sub: 'ưu tiên xử lý trước', tone: 'bad' },
              { label: 'Đã xử lý', value: anomalies.filter(a => a.status === 'Đã xử lý' || a.status === 'Bỏ qua').length, sub: 'có kết luận rõ ràng', tone: 'ok' },
            ]}
          />

          <div className="mt-4">
            <DataTable
              rows={anomalies}
              rowKey={a => a.id}
              highlightRow={a => (a.severity === 'Nghiêm trọng' && a.status !== 'Đã xử lý' ? 'bad' : a.status === 'Mới' ? 'warn' : undefined)}
              columns={[
                { key: 'id', label: 'Mã', nowrap: true, render: a => <span className="mono text-[12px] font-semibold">{a.id}</span> },
                { key: 'at', label: 'Thời điểm', nowrap: true, render: a => <span className="mono text-[11.5px]">{a.at}</span> },
                { key: 'user', label: 'Người dùng', nowrap: true, render: a => <span className="font-semibold">{a.user}</span> },
                { key: 'kind', label: 'Loại bất thường', nowrap: true, render: a => <Chip tone={a.severity === 'Nghiêm trọng' ? 'r' : 'o'}>{a.kind}</Chip> },
                { key: 'object', label: 'Đối tượng', nowrap: true, render: a => <span className="mono text-[11.5px]">{a.object}</span> },
                { key: 'metric', label: 'Giá trị đo được', width: '20%', render: a => <span className="font-semibold text-red-600">{a.metric}</span> },
                { key: 'threshold', label: 'Ngưỡng', width: '18%', render: a => <span className="text-[11.5px] text-slate-500">{a.threshold}</span> },
                { key: 'severity', label: 'Mức độ', nowrap: true, render: a => <StatusChip value={a.severity} /> },
                { key: 'handler', label: 'Người xử lý', nowrap: true, render: a => a.handler ?? <span className="text-red-500">— chưa gán</span> },
                { key: 'status', label: 'Trạng thái', nowrap: true, render: a => <Chip tone={a.status === 'Mới' ? 'r' : a.status === 'Đang xác minh' ? 'o' : a.status === 'Đã xử lý' ? 'g' : 'n'}>{a.status}</Chip> },
                { key: 'act', label: '', align: 'right', nowrap: true, render: a => <RowActions><ActionButton variant="ghost" onClick={() => setPick(a)}>Xử lý</ActionButton></RowActions> },
              ]}
            />
          </div>

          <Panel title="Ngưỡng phát hiện bất thường đang áp dụng" className="mt-4">
            <DataTable
              dense
              rows={[
                { kind: 'Tải xuống bất thường', rule: 'Vượt 50.000 dòng một lần với dữ liệu mức Hạn chế truy cập', action: 'Cảnh báo + yêu cầu xác nhận' },
                { kind: 'Truy vấn quét toàn bảng', rule: 'SELECT * không có điều kiện trên bảng > 1 triệu dòng', action: 'Chặn + cảnh báo' },
                { kind: 'Truy cập ngoài giờ', rule: 'Truy vấn ngoài khung 06:00 – 22:00', action: 'Cảnh báo mức Trung bình' },
                { kind: 'IP lạ', rule: 'Địa chỉ IP ngoài dải nội bộ 10.24.0.0/16', action: 'Chặn + cảnh báo mức Nghiêm trọng' },
                { kind: 'Truy cập dữ liệu Mật lần đầu', rule: 'Lần đầu người dùng truy cập đối tượng mức Mật trở lên', action: 'Cảnh báo mức Thấp — ghi nhận để theo dõi' },
              ]}
              columns={[
                { key: 'kind', label: 'Loại bất thường', nowrap: true, render: r => <span className="font-semibold">{r.kind}</span> },
                { key: 'rule', label: 'Điều kiện phát hiện' },
                { key: 'action', label: 'Xử lý tự động', nowrap: true, render: r => <Chip tone={r.action.includes('Chặn') ? 'r' : 'o'}>{r.action}</Chip> },
              ]}
            />
          </Panel>

          <Modal
            open={!!pick}
            onClose={() => setPick(null)}
            title={pick && `${pick.id} — ${pick.kind}`}
            desc={pick && `${pick.user} · ${pick.at}`}
            footer={
              <>
                <ActionButton variant="ghost" onClick={() => { setPick(null); toast.info('Đã bỏ qua', 'Cảnh báo được đánh dấu là hợp lệ.') }}>Bỏ qua — hợp lệ</ActionButton>
                <ActionButton variant="danger" onClick={() => { setPick(null); toast.success('Đã khoá tài khoản và thu hồi quyền', 'Ghi nhật ký ở menu 5.4.') }}>Khoá tài khoản</ActionButton>
              </>
            }
          >
            {pick && (
              <div className="space-y-3">
                <InfoGrid
                  items={[
                    { label: 'Người dùng', value: pick.user },
                    { label: 'Thời điểm', value: pick.at },
                    { label: 'Loại bất thường', value: pick.kind },
                    { label: 'Mức độ', value: <StatusChip value={pick.severity} /> },
                    { label: 'Đối tượng', value: <span className="mono">{pick.object}</span> },
                    { label: 'Trạng thái', value: pick.status },
                    { label: 'Giá trị đo được', value: <span className="font-bold text-red-600">{pick.metric}</span>, full: true },
                    { label: 'Ngưỡng quy định', value: pick.threshold, full: true },
                  ]}
                />
                <Note tone="warn" title="Bối cảnh người dùng">
                  {users.find(u => u.name === pick.user)?.employed === false
                    ? 'Tài khoản này đã nghỉ việc nhưng chưa bị khoá — rủi ro cao, đề nghị khoá ngay.'
                    : `Người dùng đang có quyền trên ${fmt(users.find(u => u.name === pick.user)?.tableGrants ?? 0)} bảng. Kiểm tra ở tab Báo cáo quyền trước khi quyết định.`}
                </Note>
              </div>
            )}
          </Modal>
        </>
      )}
    </>
  )
}
