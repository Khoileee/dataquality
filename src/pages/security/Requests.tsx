import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  PageHeader, KpiRow, FilterBar, DataTable, Panel, Note, Chip, StatusChip, ActionButton,
  IconBtn, RowActions, EntityLink, InfoGrid, EmptyState, StatusFlow, Modal, useToast,
  Field, TextInput, TextArea, SelectInput, Steps, SectionTitle, ReadOnlyValue, OptionCards, Timeline,
} from '@/components/common'
import { accessRequests, requestById, tables, tableById, columnsOf, users, policies, STATS, fmt, reports, groups } from '@/data'
import { match, useDemoSave } from '@/lib/demo'
import { ACCESS_PURPOSES, GRANT_DURATIONS, RIGHT_KINDS } from '@/data/enums'

const STATUS_STEPS = [
  { label: 'Chờ phê duyệt', tone: 'o' as const },
  { label: 'Đã phê duyệt – đang hiệu lực', tone: 'g' as const },
  { label: 'Từ chối', tone: 'r' as const },
  { label: 'Đã thu hồi', tone: 'n' as const },
  { label: 'Hết hạn', tone: 'n' as const },
]

export function RequestList() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const rows = useMemo(
    () => accessRequests.filter(r => (!status || r.status === status) && match(`${r.id} ${r.requester} ${r.objectId} ${r.reason}`, q)),
    [q, status]
  )

  return (
    <>
      <PageHeader
        code="5.3"
        title="Yêu cầu cấp quyền"
        desc="Xin quyền có dấu vết: gửi → người sở hữu dữ liệu duyệt → quyền có thời hạn → tự thu hồi khi hết hạn"
        crumbs={[{ label: 'Data Security' }, { label: 'Yêu cầu cấp quyền' }]}
        actions={<ActionButton icon="plus" to="/security/requests/create">Xin quyền truy cập</ActionButton>}
      />

      <StatusFlow
        steps={STATUS_STEPS.map(s => ({ ...s, count: accessRequests.filter(r => r.status === s.label).length }))}
        active={status}
        onPick={l => setStatus(status === l ? '' : l)}
      />

      <KpiRow
        items={[
          { label: 'Chờ phê duyệt', value: accessRequests.filter(r => r.status === 'Chờ phê duyệt').length, sub: 'chờ Người sở hữu dữ liệu', tone: 'warn' },
          { label: 'Đang hiệu lực', value: accessRequests.filter(r => r.status.includes('đang hiệu lực')).length, sub: 'có thời hạn rõ ràng', tone: 'ok' },
          { label: 'Chờ quá 2 ngày', value: accessRequests.filter(r => r.waitingDays >= 2).length, sub: 'cần nhắc người duyệt', tone: 'bad' },
          { label: 'Quyền cấp qua quy trình', value: `${accessRequests.filter(r => r.status.includes('hiệu lực')).length}/${fmt(STATS.totalPolicies)}`, sub: `${fmt(STATS.policiesManualSource)} quyền còn cấp thủ công`, tone: 'bad' },
          { label: 'Thời gian duyệt trung bình', value: '1,4 ngày', sub: 'cam kết tối đa 2 ngày làm việc', tone: 'ok' },
        ]}
      />

      <div className="mt-4">
        <FilterBar
          placeholder="Tìm theo mã yêu cầu, người xin, đối tượng…"
          value={q}
          onChange={setQ}
          filters={[{ label: 'Trạng thái', options: STATUS_STEPS.map(s => s.label), value: status, onChange: setStatus }]}
          right={<span className="text-[12px] text-slate-400">{rows.length} yêu cầu</span>}
        />
      </div>

      <DataTable
        stt
        rows={rows}
        rowKey={r => r.id}
        highlightRow={r => (r.waitingDays >= 2 ? 'warn' : r.status === 'Từ chối' ? 'bad' : undefined)}
        columns={[
          { key: 'id', label: 'Mã YC', nowrap: true, render: r => <EntityLink to={`/security/requests/${r.id}`}>{r.id}</EntityLink> },
          { key: 'requester', label: 'Người xin', nowrap: true, render: r => <div><div className="font-semibold">{r.requester}</div><div className="text-[10.5px] text-slate-400">{r.requesterUnit}</div></div> },
          { key: 'objectId', label: 'Xin quyền trên', width: '16%', render: r => <div><Chip tone="t">{r.objectType}</Chip><div className="mono mt-0.5 text-[11.5px]">{r.objectId}</div></div> },
          { key: 'right', label: 'Loại quyền', nowrap: true, render: r => <Chip tone={r.right.includes('không che') ? 'r' : 'b'}>{r.right}</Chip> },
          { key: 'reason', label: 'Lý do', width: '24%', render: r => <span className="text-[11.5px]">{r.reason}</span> },
          { key: 'purpose', label: 'Mục đích', nowrap: true, render: r => <Chip tone="n">{r.purpose}</Chip> },
          { key: 'want', label: 'Thời hạn xin', nowrap: true, render: r => <span className="mono text-[11px]">{r.wantFrom} → {r.wantTo}</span> },
          { key: 'approver', label: 'Người duyệt', nowrap: true },
          { key: 'waitingDays', label: 'Đã chờ', align: 'right', nowrap: true, render: r => (r.waitingDays ? <span className={r.waitingDays >= 2 ? 'font-bold text-red-600' : ''}>{r.waitingDays} ngày</span> : '—') },
          { key: 'status', label: 'Trạng thái', nowrap: true, render: r => <StatusChip value={r.status} /> },
          { key: 'act', label: '', align: 'right', nowrap: true, render: r => <RowActions><ActionButton variant="ghost" to={`/security/requests/${r.id}`}>{r.status === 'Chờ phê duyệt' ? 'Duyệt' : 'Xem'}</ActionButton></RowActions> },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Note tone="bad" title="Hiện 76% quyền được cấp thủ công, không qua quy trình">
          <b>{fmt(STATS.policiesManualSource)}/{fmt(STATS.totalPolicies)}</b> chính sách có nguồn <i>Thủ công</i> —
          nghĩa là ai đó cấp trực tiếp, không có yêu cầu, không có lý do, không có thời hạn.
          Khi kiểm toán hỏi <i>"vì sao người này được xem bảng đó"</i> thì không có câu trả lời.
        </Note>
        <Note tone="info" title="Bốn trạng thái theo GĐ4 mục 6.1">
          <b>Chờ phê duyệt</b> — yêu cầu đã gửi, chưa xử lý ·
          <b> Đã phê duyệt – đang hiệu lực</b> — quyền đã cấp và còn trong thời hạn ·
          <b> Từ chối</b> — không được chấp thuận ·
          <b> Đã thu hồi / hết hạn</b> — quyền không còn hiệu lực.
        </Note>
      </div>
    </>
  )
}

export function RequestCreate() {
  const save = useDemoSave('/security/requests')
  const [step, setStep] = useState(0)
  const [objType, setObjType] = useState('Bảng')
  const [objId, setObjId] = useState('bi.doi_soat_giao_dich_A')
  const [right, setRight] = useState('Đọc')
  const [purpose, setPurpose] = useState('Phân tích nghiệp vụ')
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('3 tháng')

  const t = tableById(objId)
  const reasonOk = reason.trim().length >= 30
  const sensitiveCols = t ? columnsOf(t.id).filter(c => c.tags.length) : []

  return (
    <>
      <PageHeader
        code="5.3"
        title="Xin quyền truy cập dữ liệu"
        desc="Nêu rõ mục đích sử dụng và thời hạn — quyền vô thời hạn không được chấp nhận với dữ liệu Mật trở lên"
        crumbs={[{ label: 'Data Security' }, { label: 'Yêu cầu cấp quyền', href: '/security/requests' }, { label: 'Xin quyền' }]}
      />
      <Steps items={['Chọn dữ liệu', 'Lý do và mục đích', 'Thời hạn và gửi']} current={step} onJump={setStep} />

      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title={['Chọn dữ liệu cần truy cập', 'Lý do và mục đích sử dụng', 'Thời hạn và gửi yêu cầu'][step]}>
          {step === 0 && (
            <div className="space-y-4">
              <Field label="Loại đối tượng" required>
                <OptionCards
                  cols={4}
                  value={objType}
                  onChange={setObjType}
                  options={[
                    { id: 'Bảng', label: 'Bảng' },
                    { id: 'Cột', label: 'Cột' },
                    { id: 'Báo cáo', label: 'Báo cáo' },
                    { id: 'Nhóm bảng', label: 'Nhóm bảng' },
                  ]}
                />
              </Field>
              <Field label="Đối tượng cụ thể" required>
                <SelectInput value={objId} onChange={e => setObjId(e.target.value)}>
                  {(objType === 'Báo cáo' ? reports.map(r => ({ v: r.id, l: `${r.id} — ${r.name}` }))
                    : objType === 'Nhóm bảng' ? groups.map(g => ({ v: g.id, l: `${g.id} — ${g.name}` }))
                    : tables.map(x => ({ v: x.id, l: x.id }))
                  ).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </SelectInput>
              </Field>
              <Field label="Loại quyền" required>
                <SelectInput value={right} onChange={e => setRight(e.target.value)}>
                  {RIGHT_KINDS.map(rk => <option key={rk}>{rk}</option>)}
                </SelectInput>
              </Field>

              {t && (
                <Panel title={`Hồ sơ bảng ${t.id}`} tone="info">
                  <InfoGrid
                    items={[
                      { label: 'Tên nghiệp vụ', value: t.name },
                      { label: 'Mức phân loại', value: <StatusChip value={t.confidentiality} /> },
                      { label: 'Mức quan trọng', value: t.tier ?? '—' },
                      { label: 'Người sở hữu dữ liệu', value: t.dataOwner ?? '— chưa gán' },
                      { label: 'Số cột nhạy cảm', value: `${t.sensitiveColumnCount} cột` },
                      { label: 'Số dòng', value: fmt(t.rows) },
                    ]}
                  />
                  {!!sensitiveCols.length && (
                    <div className="mt-3">
                      <div className="mb-1.5 text-[11px] font-semibold uppercase text-slate-400">Cột sẽ bị che nếu chỉ xin quyền Đọc</div>
                      <div className="flex flex-wrap gap-1.5">
                        {sensitiveCols.map(c => <Chip key={c.name} tone="r">{c.name}</Chip>)}
                      </div>
                    </div>
                  )}
                </Panel>
              )}

              {right === 'Đọc không che' && (
                <Note tone="bad" title="Xin quyền đọc không che cần lý do đặc biệt">
                  Người duyệt sẽ yêu cầu căn cứ pháp lý hoặc yêu cầu nghiệp vụ cụ thể.
                  Mọi lượt xem giá trị đầy đủ đều được ghi nhật ký kiểm toán tại menu 5.4.
                </Note>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field label="Mục đích sử dụng" required>
                <SelectInput value={purpose} onChange={e => setPurpose(e.target.value)}>
                  {ACCESS_PURPOSES.map(p => <option key={p}>{p}</option>)}
                </SelectInput>
              </Field>
              <Field
                label="Lý do chi tiết"
                required
                hint={`Tối thiểu 30 ký tự — hiện ${reason.trim().length}. Lý do rõ ràng giúp được duyệt nhanh hơn.`}
                error={reason.trim().length > 0 && !reasonOk ? `Còn thiếu ${30 - reason.trim().length} ký tự` : undefined}
              >
                <TextArea
                  rows={4}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  invalid={reason.trim().length > 0 && !reasonOk}
                  placeholder="Ví dụ: Cần phân tích tỷ lệ lệch đối soát theo sản phẩm để đề xuất cải tiến quy trình thanh toán trong quý 3."
                />
              </Field>

              <Note tone="info" title="Gợi ý: 4/9 người trong nhóm của bạn đã xin bảng này">
                Nếu cả nhóm đều cần, nên xin <b>theo nhóm</b> thay vì từng người — dễ quản lý và dễ thu hồi hơn.
                <ActionButton variant="soft" className="mt-2">Chuyển sang xin theo nhóm</ActionButton>
              </Note>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Thời hạn sử dụng" required hint="Không có lựa chọn vô thời hạn — mọi quyền đều phải có ngày hết hạn">
                <SelectInput value={duration} onChange={e => setDuration(e.target.value)}>
                  {GRANT_DURATIONS.map(d => <option key={d}>{d}</option>)}
                </SelectInput>
              </Field>

              {t && (t.confidentiality === 'Hạn chế truy cập' || t.confidentiality === 'Mật') && (
                <Note tone="warn" title={`Dữ liệu mức ${t.confidentiality} có giới hạn thời hạn`}>
                  Theo chính sách CSDL-04, quyền trên dữ liệu mức <b>{t.confidentiality}</b> tối đa
                  <b> {t.confidentiality === 'Hạn chế truy cập' ? '3 tháng' : '6 tháng'}</b>.
                  Hết hạn hệ thống tự thu hồi, muốn dùng tiếp phải xin lại.
                </Note>
              )}

              <SectionTitle>Xem lại yêu cầu</SectionTitle>
              <InfoGrid
                items={[
                  { label: 'Người xin', value: 'Nguyễn Thị Phương — Ban Kinh doanh' },
                  { label: 'Đối tượng', value: `${objType} · ${objId}` },
                  { label: 'Loại quyền', value: right },
                  { label: 'Mục đích', value: purpose },
                  { label: 'Thời hạn', value: duration },
                  { label: 'Người duyệt', value: t?.dataOwner ?? 'Người sở hữu dữ liệu của đối tượng' },
                  { label: 'Lý do', value: reason || '— chưa nhập', full: true },
                ]}
              />
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Quy trình sau khi gửi">
            <Timeline
              items={[
                { time: 'Ngay lập tức', title: 'Yêu cầu chuyển tới người duyệt', text: t?.dataOwner ?? 'Người sở hữu dữ liệu', tone: 'b' },
                { time: 'Tối đa 2 ngày làm việc', title: 'Người duyệt quyết định', text: 'Đồng ý toàn phần · đồng ý có giới hạn · từ chối', tone: 'o' },
                { time: 'Nếu đồng ý', title: 'Quyền có hiệu lực ngay', text: 'Sinh chính sách ở menu 5.2, ghi nhật ký ở menu 5.4', tone: 'g' },
                { time: `Sau ${duration}`, title: 'Tự động thu hồi', text: 'Nhận thông báo trước 7 ngày để gia hạn nếu còn cần', tone: 'n' },
              ]}
            />
          </Panel>
          <Note tone="info" title="Vì sao không có “vô thời hạn”">
            87% chính sách hiện tại là vô thời hạn — không ai biết còn cần hay không.
            Quyền có hạn buộc rà soát định kỳ và tự dọn quyền thừa.
          </Note>
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/security/requests">Huỷ</ActionButton>
        <div className="flex gap-2">
          {step > 0 && <ActionButton variant="ghost" onClick={() => setStep(s => s - 1)}>Quay lại</ActionButton>}
          {step < 2
            ? <ActionButton disabled={step === 1 && !reasonOk} onClick={() => setStep(s => s + 1)}>Tiếp tục</ActionButton>
            : <ActionButton disabled={!reasonOk} onClick={() => save('Đã gửi yêu cầu cấp quyền', 'Người sở hữu dữ liệu sẽ nhận thông báo ngay.')}>Gửi yêu cầu</ActionButton>}
        </div>
      </div>
    </>
  )
}

export function RequestApprove() {
  const { id = '' } = useParams()
  const r = requestById(id)
  const [decision, setDecision] = useState<'full' | 'limited' | 'reject'>('limited')
  const [excluded, setExcluded] = useState<string[]>(['so_dien_thoai', 'so_cccd'])
  const [expiry, setExpiry] = useState('3 tháng')
  const [note, setNote] = useState('')
  const [confirm, setConfirm] = useState(false)
  const save = useDemoSave('/security/requests')
  const toast = useToast()

  if (!r) return <EmptyState text="Không tìm thấy yêu cầu" action={<ActionButton to="/security/requests">Về danh sách</ActionButton>} />

  const t = tableById(r.objectId)
  const sensitiveCols = t ? columnsOf(t.id).filter(c => c.tags.length) : []
  const pending = r.status === 'Chờ phê duyệt'

  return (
    <>
      <PageHeader
        code="5.3"
        title={`${r.id} — ${pending ? 'Duyệt yêu cầu cấp quyền' : 'Chi tiết yêu cầu'}`}
        desc={`${r.requester} xin quyền ${r.right} trên ${r.objectId}`}
        crumbs={[{ label: 'Data Security' }, { label: 'Yêu cầu cấp quyền', href: '/security/requests' }, { label: r.id }]}
        actions={<StatusChip value={r.status} />}
      />

      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4">
          <Panel title="Nội dung yêu cầu">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Người xin"><ReadOnlyValue>{r.requester} — {r.requesterUnit}</ReadOnlyValue></Field>
              <Field label="Ngày gửi"><ReadOnlyValue>{r.createdAt}</ReadOnlyValue></Field>
              <Field label="Đối tượng"><ReadOnlyValue mono>{r.objectType} · {r.objectId}</ReadOnlyValue></Field>
              <Field label="Loại quyền xin"><ReadOnlyValue>{r.right}</ReadOnlyValue></Field>
              <Field label="Mục đích sử dụng"><ReadOnlyValue>{r.purpose}</ReadOnlyValue></Field>
              <Field label="Thời hạn mong muốn"><ReadOnlyValue>{r.wantFrom} → {r.wantTo}</ReadOnlyValue></Field>
              <Field label="Lý do chi tiết" full>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] leading-relaxed text-slate-700">{r.reason}</div>
              </Field>
            </div>
          </Panel>

          {pending ? (
            <Panel title="Quyết định">
              <Field label="Mức quyền cấp" required>
                <OptionCards
                  cols={3}
                  value={decision}
                  onChange={v => setDecision(v as any)}
                  options={[
                    { id: 'full', label: 'Đồng ý toàn phần', desc: 'Cấp đúng như yêu cầu, không giới hạn cột' },
                    { id: 'limited', label: 'Đồng ý có giới hạn', desc: 'Cấp quyền nhưng che một số cột nhạy cảm' },
                    { id: 'reject', label: 'Từ chối', desc: 'Không cấp quyền, phải nêu lý do' },
                  ]}
                />
              </Field>

              {decision === 'limited' && !!sensitiveCols.length && (
                <div className="mt-4">
                  <Field label="Cột loại trừ khỏi phạm vi cấp quyền" hint="Cột được chọn sẽ bị che hoặc không trả về">
                    <div className="space-y-1.5">
                      {sensitiveCols.map(c => (
                        <label key={c.name} className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 transition ${excluded.includes(c.name) ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                          <span className="flex items-center gap-2.5">
                            <input type="checkbox" checked={excluded.includes(c.name)} onChange={() => setExcluded(p => (p.includes(c.name) ? p.filter(x => x !== c.name) : [...p, c.name]))} />
                            <span>
                              <span className="mono block text-[12px] font-semibold">{c.name}</span>
                              <span className="block text-[11px] text-slate-500">{c.description}</span>
                            </span>
                          </span>
                          <div className="flex gap-1">{c.tags.map(tg => <Chip key={tg} tone="r">{tg}</Chip>)}</div>
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {decision !== 'reject' && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Field label="Thời hạn cấp" required hint={t?.confidentiality === 'Hạn chế truy cập' ? 'Tối đa 3 tháng với dữ liệu Hạn chế truy cập' : 'Tối đa 6 tháng với dữ liệu Mật'}>
                    <SelectInput value={expiry} onChange={e => setExpiry(e.target.value)}>
                      {GRANT_DURATIONS.map(d => <option key={d}>{d}</option>)}
                    </SelectInput>
                  </Field>
                </div>
              )}

              <Field label={decision === 'reject' ? 'Lý do từ chối' : 'Ghi chú quyết định'} required={decision === 'reject'} className="mt-4">
                <TextArea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder={decision === 'reject' ? 'Nêu rõ vì sao từ chối và người xin cần làm gì tiếp theo…' : 'Ghi chú thêm cho người xin…'} />
              </Field>
            </Panel>
          ) : (
            <Panel title="Kết quả xử lý">
              <InfoGrid
                items={[
                  { label: 'Trạng thái', value: <StatusChip value={r.status} /> },
                  { label: 'Người duyệt', value: r.approver },
                  { label: 'Mức quyền được cấp', value: r.grantedLevel ?? '— không cấp' },
                  { label: 'Ghi chú quyết định', value: r.decisionNote ?? '—', full: true },
                ]}
              />
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <Panel title="Hệ thống đã chuẩn bị sẵn cho người duyệt">
            <DataTable
              dense
              rows={[
                { k: 'Người xin đã có quyền gì', v: `${users.find(u => u.name === r.requester)?.tableGrants ?? 0} bảng`, note: 'Xem chi tiết ở menu 5.2' },
                { k: 'Đã từng xin đối tượng này', v: accessRequests.filter(x => x.requester === r.requester && x.objectId === r.objectId).length > 1 ? 'Có — lần thứ 2' : 'Chưa từng', note: '' },
                { k: 'Mức phân loại đối tượng', v: t?.confidentiality ?? '—', note: t?.confidentiality === 'Mật' ? 'Tối đa 6 tháng' : t?.confidentiality === 'Hạn chế truy cập' ? 'Tối đa 3 tháng' : '' },
                { k: 'Số cột nhạy cảm', v: `${sensitiveCols.length} cột`, note: sensitiveCols.map(c => c.name).join(', ') },
                { k: 'Bao nhiêu người cùng đơn vị đã có quyền', v: '4 / 9 người', note: 'Nên cân nhắc cấp theo nhóm' },
              ]}
              columns={[
                { key: 'k', label: 'Thông tin', nowrap: true, render: x => <span className="font-semibold">{x.k}</span> },
                { key: 'v', label: 'Giá trị', nowrap: true, render: x => <Chip tone="b">{x.v}</Chip> },
                { key: 'note', label: 'Ghi chú', render: x => <span className="text-[11px] text-slate-500">{x.note}</span> },
              ]}
            />
          </Panel>

          <Panel title="Duyệt xong thì gì xảy ra">
            <Timeline
              items={[
                { time: 'Ngay lập tức', title: 'Sinh chính sách quyền', text: 'Xuất hiện ở menu 5.2 với nguồn = mã yêu cầu này', tone: 'g' },
                { time: 'Ngay lập tức', title: 'Ghi nhật ký kiểm toán', text: 'Ai duyệt, lúc nào, cấp mức nào — menu 5.4', tone: 'b' },
                { time: 'Ngay lập tức', title: 'Thông báo người xin', text: 'Email + thông báo trong hệ thống', tone: 'b' },
                { time: `Trước hạn 7 ngày`, title: 'Nhắc gia hạn', text: 'Nếu không gia hạn, quyền tự thu hồi', tone: 'o' },
                { time: `Sau ${expiry}`, title: 'Tự động thu hồi', text: 'Chính sách chuyển sang trạng thái Hết hạn', tone: 'n' },
              ]}
            />
          </Panel>
        </div>
      </div>

      {pending && (
        <div className="mt-4 flex justify-between">
          <ActionButton variant="ghost" to="/security/requests">Quay lại</ActionButton>
          <div className="flex gap-2">
            <ActionButton variant="danger" disabled={decision !== 'reject' || !note.trim()} onClick={() => save('Đã từ chối yêu cầu', 'Người xin nhận được thông báo kèm lý do.')}>Từ chối</ActionButton>
            <ActionButton disabled={decision === 'reject'} onClick={() => setConfirm(true)}>Phê duyệt</ActionButton>
          </div>
        </div>
      )}

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Xác nhận phê duyệt"
        desc={`${r.id} — ${r.requester}`}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setConfirm(false)}>Huỷ</ActionButton>
            <ActionButton onClick={() => { setConfirm(false); save('Đã phê duyệt cấp quyền', `Quyền có hiệu lực ngay, hết hạn sau ${expiry}.`) }}>Đồng ý phê duyệt</ActionButton>
          </>
        }
      >
        <InfoGrid
          items={[
            { label: 'Người được cấp', value: `${r.requester} — ${r.requesterUnit}` },
            { label: 'Đối tượng', value: <span className="mono">{r.objectId}</span> },
            { label: 'Mức quyền', value: decision === 'full' ? 'Đồng ý toàn phần' : 'Đồng ý có giới hạn' },
            { label: 'Thời hạn', value: expiry },
            { label: 'Cột loại trừ', value: decision === 'limited' && excluded.length ? excluded.join(', ') : '— không loại trừ cột nào', full: true },
            { label: 'Ghi chú', value: note || '—', full: true },
          ]}
        />
        <Note tone="warn" title="Quyền có hiệu lực ngay sau khi bấm đồng ý" className="mt-3">
          Chính sách mới sẽ xuất hiện tại menu 5.2 với nguồn <b>{r.id}</b>, và mọi lượt truy cập sau đó được ghi nhật ký.
        </Note>
      </Modal>
    </>
  )
}
