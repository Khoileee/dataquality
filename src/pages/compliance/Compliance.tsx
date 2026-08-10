import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  PageHeader, KpiRow, FilterBar, DataTable, CellTitle, Panel, Note, Chip, StatusChip,
  ActionButton, IconBtn, RowActions, EntityLink, InfoGrid, EmptyState, InlineTabs, Modal,
  useToast, Field, TextInput, TextArea, SelectInput, Steps, SectionTitle, ProgressBar,
  Timeline, ScoreRing, Toggle,
} from '@/components/common'
import {
  dataPolicies, policyById, lifecycleRules, sharingAgreements, assessments, assessmentById,
  remediations, tables, STATS, fmt,
} from '@/data'
import { match, useDemoSave } from '@/lib/demo'
import { POLICY_CATEGORIES, ORG_UNITS } from '@/data/enums'

/* ═════════ 6.1 Chính sách dữ liệu ═════════ */

export function PolicyList() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const rows = useMemo(() => dataPolicies.filter(p => (!cat || p.category === cat) && match(`${p.id} ${p.name} ${p.summary} ${p.issuer}`, q)), [q, cat])

  const active = dataPolicies.filter(p => p.status === 'Đang hiệu lực')
  const avgCompliance = Math.round(active.reduce((a, p) => a + p.compliancePct, 0) / active.length)

  return (
    <>
      <PageHeader
        code="6.1"
        title="Chính sách dữ liệu"
        desc="Danh mục chính sách quản trị, chất lượng, bảo mật, cấp quyền, chia sẻ và lưu trữ — module bổ sung sau review"
        crumbs={[{ label: 'Chính sách & Tuân thủ' }, { label: 'Chính sách dữ liệu' }]}
        actions={<ActionButton icon="plus" to="/compliance/policies/create">Ban hành chính sách</ActionButton>}
      />

      <KpiRow
        items={[
          { label: 'Chính sách đã ban hành', value: dataPolicies.length, sub: `${active.length} đang hiệu lực` },
          { label: 'Mức tuân thủ trung bình', value: `${avgCompliance}%`, sub: 'trên các chính sách đang hiệu lực', tone: avgCompliance >= 70 ? 'ok' : 'bad' },
          { label: 'Chính sách tuân thủ dưới 50%', value: active.filter(p => p.compliancePct < 50).length, sub: 'cần kế hoạch khắc phục', tone: 'bad' },
          { label: 'Đến hạn rà soát trong 6 tháng', value: dataPolicies.filter(p => p.reviewAt <= '2027-02-01' && p.status === 'Đang hiệu lực').length, sub: 'chính sách cần cập nhật', tone: 'warn' },
          { label: 'Chính sách dự thảo', value: dataPolicies.filter(p => p.status === 'Dự thảo').length, sub: 'chưa có hiệu lực', tone: 'warn' },
        ]}
      />

      <div className="mt-4">
        <FilterBar
          placeholder="Tìm theo tên chính sách, đơn vị ban hành…"
          value={q}
          onChange={setQ}
          filters={[{ label: 'Nhóm', options: ['Quản trị', 'Chất lượng', 'Bảo mật', 'Cấp quyền', 'Chia sẻ', 'Lưu trữ'], value: cat, onChange: setCat }]}
          right={<span className="text-[12px] text-slate-400">{rows.length} chính sách</span>}
        />
      </div>

      <DataTable
        stt
        rows={rows}
        rowKey={p => p.id}
        highlightRow={p => (p.status === 'Đang hiệu lực' && p.compliancePct < 50 ? 'bad' : p.status === 'Dự thảo' ? 'warn' : undefined)}
        columns={[
          { key: 'id', label: 'Mã', nowrap: true, render: p => <EntityLink to={`/compliance/policies/${p.id}`}>{p.id}</EntityLink> },
          { key: 'name', label: 'Tên chính sách', width: '24%', render: p => <CellTitle title={p.name} sub={p.summary} /> },
          { key: 'category', label: 'Nhóm', nowrap: true, render: p => <Chip tone="t">{p.category}</Chip> },
          { key: 'scope', label: 'Phạm vi áp dụng', width: '16%', render: p => <span className="text-[11.5px]">{p.scope}</span> },
          { key: 'issuer', label: 'Đơn vị ban hành', nowrap: true },
          { key: 'effectiveFrom', label: 'Ngày hiệu lực', nowrap: true },
          { key: 'reviewAt', label: 'Hạn rà soát', nowrap: true },
          { key: 'version', label: 'Phiên bản', nowrap: true, render: p => <Chip tone="b">{p.version}</Chip> },
          { key: 'linkedObjects', label: 'Đối tượng áp', align: 'right', nowrap: true, render: p => fmt(p.linkedObjects) },
          {
            key: 'compliancePct', label: 'Mức tuân thủ', width: '130px',
            render: p => (p.status === 'Đang hiệu lực' ? <ProgressBar pct={p.compliancePct} target={90} height={10} note={`${p.compliancePct}%`} /> : <span className="text-slate-300">—</span>),
          },
          { key: 'status', label: 'Trạng thái', nowrap: true, render: p => <Chip tone={p.status === 'Đang hiệu lực' ? 'g' : p.status === 'Dự thảo' ? 'o' : 'n'}>{p.status}</Chip> },
          { key: 'act', label: '', align: 'right', nowrap: true, render: p => <RowActions><IconBtn icon="open" title="Chi tiết" to={`/compliance/policies/${p.id}`} /></RowActions> },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Note tone="bad" title="Vì sao module này là bổ sung sau review">
          Phương án BDA mục 5.6 và GĐ4 · FR-05/FR-06 yêu cầu quản lý <b>chính sách · vòng đời dữ liệu · chia sẻ bên thứ ba · checklist tuân thủ · kế hoạch khắc phục</b>.
          Thiết kế DMP ban đầu chỉ có <b>Nhật ký kiểm toán</b> — trả lời được <i>"ai đã làm gì"</i> nhưng không trả lời được
          <i> "việc đó có đúng quy định không"</i> và <i>"quy định đó là gì"</i>.
        </Note>
        <Note tone="warn" title="Chính sách tuân thủ thấp nhất: CSDL-04 chỉ 13%">
          Chính sách cấp quyền truy cập yêu cầu <b>mọi quyền phải có thời hạn</b>, nhưng {fmt(STATS.policiesNoExpiry)}/{fmt(STATS.totalPolicies)} chính sách quyền
          hiện đang vô thời hạn. Đây là phát hiện không phù hợp nghiêm trọng nhất của kỳ đánh giá quý II.
        </Note>
      </div>
    </>
  )
}

export function PolicyDetail() {
  const { id = '' } = useParams()
  const p = policyById(id)
  if (!p) return <EmptyState text="Không tìm thấy chính sách" action={<ActionButton to="/compliance/policies">Về danh sách</ActionButton>} />

  const relatedLifecycle = lifecycleRules.filter(l => l.policyId === p.id)
  const relatedAssessments = assessments.filter(a => a.policyIds.includes(p.id))
  const findings = relatedAssessments.flatMap(a => a.items.filter(i => i.policyId === p.id && i.result === 'Không đạt'))

  return (
    <>
      <PageHeader
        code="6.1"
        title={p.name}
        desc={`${p.id} · ${p.category} · ban hành bởi ${p.issuer} · hiệu lực từ ${p.effectiveFrom}`}
        crumbs={[{ label: 'Chính sách & Tuân thủ' }, { label: 'Chính sách dữ liệu', href: '/compliance/policies' }, { label: p.id }]}
        actions={
          <>
            <Chip tone="t">{p.category}</Chip>
            <Chip tone="b">{p.version}</Chip>
            <Chip tone={p.status === 'Đang hiệu lực' ? 'g' : p.status === 'Dự thảo' ? 'o' : 'n'}>{p.status}</Chip>
            <ActionButton variant="ghost" icon="edit">Sửa</ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4">
          <Panel title="Nội dung chính sách">
            <p className="text-[13.5px] leading-relaxed text-slate-700">{p.summary}</p>
            <SectionTitle right={<span className="text-[11px] text-slate-400">{p.controls.length} yêu cầu kiểm soát</span>}>Yêu cầu kiểm soát cụ thể</SectionTitle>
            <ol className="ml-4 list-decimal space-y-1.5 text-[12.5px] text-slate-700">
              {p.controls.map(c => <li key={c}>{c}</li>)}
            </ol>
          </Panel>

          <Panel title="Thông tin quản lý">
            <InfoGrid
              items={[
                { label: 'Mã chính sách', value: <span className="mono">{p.id}</span> },
                { label: 'Nhóm chính sách', value: p.category },
                { label: 'Phạm vi áp dụng', value: p.scope, full: true },
                { label: 'Đơn vị ban hành', value: p.issuer },
                { label: 'Ngày hiệu lực', value: p.effectiveFrom },
                { label: 'Hạn rà soát tiếp theo', value: p.reviewAt },
                { label: 'Phiên bản', value: p.version },
                { label: 'Số đối tượng áp dụng', value: fmt(p.linkedObjects) },
                { label: 'Trạng thái', value: p.status },
              ]}
            />
          </Panel>

          {!!findings.length && (
            <Panel title={`Phát hiện không phù hợp (${findings.length})`} tone="bad">
              <DataTable
                dense
                rows={findings}
                rowKey={f => f.code}
                columns={[
                  { key: 'code', label: 'Mã', nowrap: true, render: f => <span className="mono font-semibold">{f.code}</span> },
                  { key: 'text', label: 'Yêu cầu kiểm tra' },
                  { key: 'finding', label: 'Phát hiện', render: f => <span className="font-semibold text-red-600">{f.finding}</span> },
                  { key: 'evidence', label: 'Bằng chứng', render: f => <span className="text-[11px] text-slate-500">{f.evidence}</span> },
                ]}
              />
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <Panel title="Mức tuân thủ">
            <div className="flex items-center gap-4">
              <ScoreRing score={p.compliancePct} label="tuân thủ" />
              <div className="text-[12px] leading-relaxed text-slate-600">
                {p.compliancePct >= 80
                  ? 'Mức tuân thủ tốt. Tiếp tục theo dõi định kỳ.'
                  : p.compliancePct >= 50
                    ? 'Cần cải thiện. Có phát hiện chưa khắc phục.'
                    : 'Mức tuân thủ thấp — cần kế hoạch khắc phục có thời hạn cụ thể.'}
              </div>
            </div>
          </Panel>

          {!!relatedLifecycle.length && (
            <Panel title="Quy tắc vòng đời áp dụng chính sách này">
              <div className="space-y-1.5">
                {relatedLifecycle.map(l => (
                  <div key={l.id} className="rounded-lg border border-slate-200 px-3 py-2">
                    <div className="text-[12.5px] font-semibold text-slate-800">{l.name}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">Lưu trữ {l.retentionMonths} tháng · {l.scope}</div>
                    <Chip tone={l.status === 'Đang áp dụng' ? 'g' : 'o'} className="mt-1">{l.status}</Chip>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <Panel title="Kỳ đánh giá liên quan">
            <div className="space-y-1.5">
              {relatedAssessments.map(a => (
                <div key={a.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <EntityLink to={`/compliance/assessments/${a.id}`} mono={false}>{a.name}</EntityLink>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                    <Chip tone="g">{a.passed} đạt</Chip>
                    <Chip tone="r">{a.failed} không đạt</Chip>
                    <Chip tone="n">{a.na} không áp dụng</Chip>
                  </div>
                </div>
              ))}
              {!relatedAssessments.length && <span className="text-[12px] text-slate-400">Chưa có kỳ đánh giá nào</span>}
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

export function PolicyCreate() {
  const save = useDemoSave('/compliance/policies')
  const [f, setF] = useState({ name: '', category: 'Quản trị', summary: '', scope: '', issuer: '', effectiveFrom: '', reviewAt: '' })
  const [controls, setControls] = useState<string[]>([''])
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }))
  const ok = f.name && f.summary && f.scope && f.issuer && controls.some(c => c.trim())

  return (
    <>
      <PageHeader
        code="6.1"
        title="Ban hành chính sách dữ liệu"
        desc="Chính sách chỉ có giá trị khi mỗi yêu cầu kiểm soát đo được — đó là cơ sở để chấm mức tuân thủ tự động"
        crumbs={[{ label: 'Chính sách & Tuân thủ' }, { label: 'Chính sách dữ liệu', href: '/compliance/policies' }, { label: 'Ban hành mới' }]}
      />

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title="Nội dung chính sách">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tên chính sách" required full><TextInput value={f.name} onChange={set('name')} placeholder="Chính sách lưu trữ và xóa dữ liệu khách hàng" /></Field>
            <Field label="Nhóm chính sách" required>
              <SelectInput value={f.category} onChange={set('category')}>{POLICY_CATEGORIES.map(c => <option key={c}>{c}</option>)}</SelectInput>
            </Field>
            <Field label="Đơn vị ban hành" required>
              <SelectInput value={f.issuer} onChange={set('issuer')}>
                <option value="">— Chọn —</option>
                {ORG_UNITS.map(i => <option key={i}>{i}</option>)}
              </SelectInput>
            </Field>
            <Field label="Tóm tắt nội dung" info="dataPolicy.controls" required full><TextArea rows={3} value={f.summary} onChange={set('summary')} /></Field>
            <Field label="Phạm vi áp dụng" required full hint="Loại dữ liệu, hệ thống hoặc đơn vị áp dụng chính sách">
              <TextInput value={f.scope} onChange={set('scope')} placeholder="Dữ liệu khách hàng, giao dịch, nhật ký" />
            </Field>
            <Field label="Ngày hiệu lực" required><TextInput type="date" value={f.effectiveFrom} onChange={set('effectiveFrom')} /></Field>
            <Field label="Hạn rà soát tiếp theo" required><TextInput type="date" value={f.reviewAt} onChange={set('reviewAt')} /></Field>
          </div>

          <SectionTitle right={<ActionButton variant="ghost" icon="plus" onClick={() => setControls(p => [...p, ''])}>Thêm yêu cầu</ActionButton>}>
            Yêu cầu kiểm soát
          </SectionTitle>
          <div className="space-y-2">
            {controls.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">{i + 1}</span>
                <TextInput
                  value={c}
                  onChange={e => setControls(p => p.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder="Mọi bảng Tier 1 phải có Người sở hữu dữ liệu và Đầu mối nghiệp vụ"
                />
                <button onClick={() => setControls(p => p.filter((_, j) => j !== i))} className="shrink-0 rounded px-2 py-1 text-[12px] text-red-500 hover:bg-red-50">Xoá</button>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Note tone="info" title="Yêu cầu kiểm soát phải đo được">
            Viết <b>"Mọi bảng Tier 1 phải có Người sở hữu dữ liệu"</b> thì hệ thống đếm được ngay từ danh mục.<br />
            Viết <b>"Dữ liệu phải được quản lý tốt"</b> thì không ai chấm được — chính sách thành khẩu hiệu.
          </Note>
          <Panel title="Xem trước">
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="text-[13px] font-bold text-slate-800">{f.name || 'chưa đặt tên'}</div>
              <div className="mt-1 text-[11.5px] text-slate-500">{f.summary || 'chưa có tóm tắt'}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                <Chip tone="t">{f.category}</Chip>
                {f.issuer && <Chip tone="n">{f.issuer}</Chip>}
                {f.effectiveFrom && <Chip tone="b">hiệu lực {f.effectiveFrom}</Chip>}
              </div>
              <div className="mt-3 text-[11px] font-semibold uppercase text-slate-400">Yêu cầu kiểm soát ({controls.filter(c => c.trim()).length})</div>
              <ol className="ml-4 mt-1 list-decimal space-y-0.5 text-[11.5px] text-slate-600">
                {controls.filter(c => c.trim()).map((c, i) => <li key={i}>{c}</li>)}
              </ol>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/compliance/policies">Huỷ</ActionButton>
        <ActionButton disabled={!ok} onClick={() => save('Đã ban hành chính sách')}>Ban hành</ActionButton>
      </div>
    </>
  )
}

/* ═════════ 6.2 Vòng đời & Lưu trữ ═════════ */

export function Lifecycle() {
  const [tab, setTab] = useState('rules')
  const [pick, setPick] = useState<any>(null)
  const toast = useToast()

  return (
    <>
      <PageHeader
        code="6.2"
        title="Vòng đời & Lưu trữ"
        desc="Thời gian sử dụng, lưu trữ, lưu kho và điều kiện xóa cho từng loại dữ liệu — kèm thoả thuận chia sẻ bên thứ ba"
        crumbs={[{ label: 'Chính sách & Tuân thủ' }, { label: 'Vòng đời & Lưu trữ' }]}
        actions={<ActionButton icon="plus">{tab === 'rules' ? 'Thêm quy tắc vòng đời' : 'Thêm thoả thuận chia sẻ'}</ActionButton>}
      />

      <KpiRow
        items={[
          { label: 'Quy tắc vòng đời', value: lifecycleRules.length, sub: `${lifecycleRules.filter(l => l.status === 'Đang áp dụng').length} đang áp dụng` },
          { label: 'Tự động thực thi', value: lifecycleRules.filter(l => l.autoEnforced).length, sub: `${lifecycleRules.filter(l => !l.autoEnforced).length} còn làm thủ công`, tone: 'warn' },
          { label: 'Chờ phê duyệt', value: lifecycleRules.filter(l => l.status === 'Chờ phê duyệt').length, sub: 'chưa thực thi được', tone: 'bad' },
          { label: 'Thoả thuận chia sẻ', value: sharingAgreements.length, sub: `${sharingAgreements.filter(s => s.status === 'Đang hiệu lực').length} đang hiệu lực` },
          { label: 'Sắp hết hạn', value: sharingAgreements.filter(s => s.status === 'Sắp hết hạn').length, sub: 'cần gia hạn hoặc dừng', tone: 'warn' },
        ]}
      />

      <div className="mt-4">
        <InlineTabs
          items={[
            { id: 'rules', label: 'Quy tắc vòng đời dữ liệu', badge: lifecycleRules.length },
            { id: 'sharing', label: 'Chia sẻ bên thứ ba', badge: sharingAgreements.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'rules' ? (
        <>
          <DataTable
            rows={lifecycleRules}
            rowKey={l => l.id}
            highlightRow={l => (l.status === 'Chờ phê duyệt' ? 'bad' : l.status === 'Tạm dừng' ? 'warn' : undefined)}
            columns={[
              { key: 'id', label: 'Mã', nowrap: true, render: l => <span className="mono text-[12px] font-semibold">{l.id}</span> },
              { key: 'name', label: 'Quy tắc', width: '18%', render: l => <CellTitle title={l.name} sub={l.scope} /> },
              { key: 'dataKind', label: 'Loại dữ liệu', nowrap: true, render: l => <Chip tone="t">{l.dataKind}</Chip> },
              { key: 'activeMonths', label: 'Sử dụng', align: 'right', nowrap: true, render: l => `${l.activeMonths} tháng` },
              { key: 'archiveMonths', label: 'Lưu kho', align: 'right', nowrap: true, render: l => `${l.archiveMonths} tháng` },
              { key: 'retentionMonths', label: 'Tổng lưu trữ', align: 'right', nowrap: true, render: l => <span className="font-semibold">{l.retentionMonths} tháng</span> },
              { key: 'deleteCondition', label: 'Điều kiện xóa', width: '20%', render: l => <span className="text-[11.5px]">{l.deleteCondition}</span> },
              { key: 'legalBasis', label: 'Căn cứ pháp lý', width: '14%', render: l => <span className="text-[11px] text-slate-500">{l.legalBasis}</span> },
              { key: 'autoEnforced', label: 'Tự động', align: 'center', nowrap: true, render: l => (l.autoEnforced ? <Chip tone="g">Có</Chip> : <Chip tone="o">Thủ công</Chip>) },
              { key: 'nextAction', label: 'Hành động kế tiếp', width: '18%', render: l => <div><div className="text-[11.5px]">{l.nextAction}</div><div className="text-[10.5px] text-slate-400">{l.nextActionAt}</div></div> },
              { key: 'status', label: 'Trạng thái', nowrap: true, render: l => <Chip tone={l.status === 'Đang áp dụng' ? 'g' : l.status === 'Chờ phê duyệt' ? 'o' : 'n'}>{l.status}</Chip> },
              { key: 'act', label: '', align: 'right', nowrap: true, render: l => <RowActions><ActionButton variant="ghost" onClick={() => setPick(l)}>Xem</ActionButton></RowActions> },
            ]}
          />

          <div className="mt-4 grid grid-cols-2 gap-4">
            <Note tone="bad" title="VD-02 đang chờ phê duyệt — 128.400 hồ sơ quá hạn xóa">
              Quy tắc xóa dữ liệu cá nhân khách hàng sau 24 tháng kể từ khi chấm dứt hợp đồng
              (Nghị định 13/2023/NĐ-CP — Điều 16) <b>chưa được phê duyệt</b> nên chưa thực thi được.
              Đây là phát hiện KT-12 của kỳ đánh giá quý II, đang ở kế hoạch khắc phục KP-05.
            </Note>
            <Note tone="info" title="Bốn mốc trong vòng đời dữ liệu">
              <b>Sử dụng</b> — dữ liệu còn được truy vấn thường xuyên, để trên môi trường nóng ·
              <b> Lưu trữ</b> — vẫn phải giữ theo quy định nhưng ít dùng ·
              <b> Lưu kho</b> — chuyển sang lưu trữ giá rẻ, truy cập chậm ·
              <b> Xóa</b> — hết nghĩa vụ pháp lý, xóa vĩnh viễn có ghi nhật ký.
            </Note>
          </div>
        </>
      ) : (
        <>
          <DataTable
            rows={sharingAgreements}
            rowKey={s => s.id}
            highlightRow={s => (s.status === 'Sắp hết hạn' ? 'warn' : s.status === 'Hết hạn' ? 'bad' : undefined)}
            columns={[
              { key: 'id', label: 'Mã', nowrap: true, render: s => <span className="mono text-[12px] font-semibold">{s.id}</span> },
              { key: 'partner', label: 'Bên thứ ba', nowrap: true, render: s => <span className="font-semibold text-slate-800">{s.partner}</span> },
              { key: 'dataScope', label: 'Phạm vi dữ liệu chia sẻ', width: '22%' },
              { key: 'purpose', label: 'Mục đích', width: '16%' },
              { key: 'method', label: 'Phương thức', nowrap: true, render: s => <Chip tone="t">{s.method}</Chip> },
              { key: 'maskApplied', label: 'Biện pháp bảo vệ', width: '16%', render: s => <span className="text-[11.5px]">{s.maskApplied}</span> },
              { key: 'period', label: 'Thời hạn', nowrap: true, render: s => <span className="mono text-[11px]">{s.from} → {s.to}</span> },
              { key: 'approvedBy', label: 'Đơn vị phê duyệt', nowrap: true },
              { key: 'volumeMonth', label: 'Khối lượng/tháng', nowrap: true },
              { key: 'status', label: 'Trạng thái', nowrap: true, render: s => <Chip tone={s.status === 'Đang hiệu lực' ? 'g' : s.status === 'Sắp hết hạn' ? 'o' : 'n'}>{s.status}</Chip> },
            ]}
          />
          <Note tone="warn" title="CS3-02 sắp hết hạn ngày 30/09/2026" className="mt-4">
            Thoả thuận gửi báo cáo doanh số cho đối tác B qua kênh <b>KENH-05</b> — kênh này đang dùng
            <b> FTP user/password không mã hoá</b> và đã bị trả về <i>Yêu cầu chỉnh sửa</i> ở menu 1.2.
            Nên chuyển sang SFTP trước khi gia hạn.
          </Note>
        </>
      )}

      <Modal open={!!pick} onClose={() => setPick(null)} size="lg" title={pick?.name} desc={pick && `${pick.id} · ${pick.scope}`} footer={<ActionButton variant="ghost" onClick={() => setPick(null)}>Đóng</ActionButton>}>
        {pick && (
          <div className="space-y-4">
            <InfoGrid
              items={[
                { label: 'Loại dữ liệu', value: pick.dataKind },
                { label: 'Phạm vi', value: pick.scope },
                { label: 'Thời gian sử dụng', value: `${pick.activeMonths} tháng` },
                { label: 'Thời gian lưu kho', value: `${pick.archiveMonths} tháng` },
                { label: 'Tổng thời gian lưu trữ', value: `${pick.retentionMonths} tháng` },
                { label: 'Tự động thực thi', value: pick.autoEnforced ? 'Có' : 'Không — làm thủ công' },
                { label: 'Điều kiện xóa', value: pick.deleteCondition, full: true },
                { label: 'Căn cứ pháp lý', value: pick.legalBasis, full: true },
                { label: 'Chính sách gốc', value: <EntityLink to={`/compliance/policies/${pick.policyId}`}>{pick.policyId}</EntityLink> },
                { label: 'Trạng thái', value: pick.status },
              ]}
            />
            <div>
              <SectionTitle>Dòng thời gian vòng đời</SectionTitle>
              <div className="flex items-center gap-1">
                <div className="flex-1 rounded-l bg-emerald-100 px-3 py-2 text-center">
                  <div className="text-[11px] font-bold text-emerald-700">Sử dụng</div>
                  <div className="text-[10.5px] text-emerald-600">0 – {pick.activeMonths} tháng</div>
                </div>
                <div className="flex-1 bg-blue-100 px-3 py-2 text-center">
                  <div className="text-[11px] font-bold text-blue-700">Lưu trữ</div>
                  <div className="text-[10.5px] text-blue-600">{pick.activeMonths} – {pick.retentionMonths - pick.archiveMonths} tháng</div>
                </div>
                <div className="flex-1 bg-amber-100 px-3 py-2 text-center">
                  <div className="text-[11px] font-bold text-amber-700">Lưu kho</div>
                  <div className="text-[10.5px] text-amber-600">{pick.retentionMonths - pick.archiveMonths} – {pick.retentionMonths} tháng</div>
                </div>
                <div className="flex-1 rounded-r bg-red-100 px-3 py-2 text-center">
                  <div className="text-[11px] font-bold text-red-700">Xóa</div>
                  <div className="text-[10.5px] text-red-600">sau {pick.retentionMonths} tháng</div>
                </div>
              </div>
            </div>
            {!!pick.affectedTables.length && (
              <div>
                <SectionTitle>Bảng chịu tác động</SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {pick.affectedTables.map((t: string) => (
                    <EntityLink key={t} to={`/catalog/tables/${encodeURIComponent(t)}`}>{t}</EntityLink>
                  ))}
                </div>
              </div>
            )}
            <Note tone={pick.status === 'Chờ phê duyệt' ? 'bad' : 'info'} title="Hành động kế tiếp">
              <b>{pick.nextAction}</b> — dự kiến {pick.nextActionAt}.
              {pick.status === 'Chờ phê duyệt' && ' Quy tắc chưa được phê duyệt nên hành động này chưa thực thi được.'}
            </Note>
          </div>
        )}
      </Modal>
    </>
  )
}

/* ═════════ 6.3 Đánh giá tuân thủ ═════════ */

export function AssessmentList() {
  const [tab, setTab] = useState('assessments')

  return (
    <>
      <PageHeader
        code="6.3"
        title="Đánh giá tuân thủ"
        desc="Checklist đánh giá theo chính sách, ghi nhận phát hiện không phù hợp và theo dõi kế hoạch khắc phục"
        crumbs={[{ label: 'Chính sách & Tuân thủ' }, { label: 'Đánh giá tuân thủ' }]}
        actions={<ActionButton icon="plus">Tạo kỳ đánh giá</ActionButton>}
      />

      <KpiRow
        items={[
          { label: 'Điểm tuân thủ hiện tại', value: `${STATS.complianceScore}%`, sub: 'kỳ quý II/2026', tone: 'warn' },
          { label: 'Phát hiện chưa khắc phục', value: STATS.openFindings, sub: `${remediations.filter(r => r.status !== 'Đã đóng').length} kế hoạch đang chạy`, tone: 'bad' },
          { label: 'Kế hoạch quá hạn', value: remediations.filter(r => r.status !== 'Đã đóng' && r.dueAt < '2026-08-09').length, sub: 'cần báo cáo lãnh đạo', tone: 'bad' },
          { label: 'Kỳ đánh giá', value: assessments.length, sub: `${assessments.filter(a => a.status === 'Đang đánh giá').length} đang thực hiện` },
          { label: 'Mức độ hoàn thành khắc phục', value: `${Math.round(remediations.reduce((a, r) => a + r.progressPct, 0) / remediations.length)}%`, sub: 'trung bình các kế hoạch', tone: 'warn' },
        ]}
      />

      <div className="mt-4">
        <InlineTabs
          items={[
            { id: 'assessments', label: 'Kỳ đánh giá', badge: assessments.length },
            { id: 'remediations', label: 'Kế hoạch khắc phục', badge: remediations.filter(r => r.status !== 'Đã đóng').length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'assessments' ? (
        <DataTable
          rows={assessments}
          rowKey={a => a.id}
          highlightRow={a => (a.status === 'Chờ khắc phục' ? 'warn' : undefined)}
          columns={[
            { key: 'id', label: 'Mã kỳ', nowrap: true, render: a => <EntityLink to={`/compliance/assessments/${a.id}`}>{a.id}</EntityLink> },
            { key: 'name', label: 'Tên kỳ đánh giá', width: '22%', render: a => <span className="font-semibold text-slate-800">{a.name}</span> },
            { key: 'period', label: 'Kỳ', nowrap: true, render: a => <Chip tone="t">{a.period}</Chip> },
            { key: 'policyIds', label: 'Chính sách đánh giá', render: a => <div className="flex flex-wrap gap-1">{a.policyIds.map(p => <Chip key={p} tone="n">{p}</Chip>)}</div> },
            { key: 'assessor', label: 'Đơn vị đánh giá', nowrap: true },
            { key: 'period2', label: 'Thời gian', nowrap: true, render: a => <span className="mono text-[11px]">{a.startedAt} → {a.finishedAt ?? 'đang chạy'}</span> },
            { key: 'result', label: 'Kết quả', nowrap: true, render: a => <div className="flex gap-1"><Chip tone="g">{a.passed}</Chip><Chip tone="r">{a.failed}</Chip><Chip tone="n">{a.na}</Chip></div> },
            {
              key: 'score', label: 'Điểm tuân thủ', width: '120px',
              render: a => <ProgressBar pct={Math.round((a.passed / (a.passed + a.failed || 1)) * 100)} target={90} height={10} note={`${Math.round((a.passed / (a.passed + a.failed || 1)) * 100)}%`} />,
            },
            { key: 'status', label: 'Trạng thái', nowrap: true, render: a => <Chip tone={a.status === 'Đã hoàn thành' ? 'g' : a.status === 'Chờ khắc phục' ? 'o' : 'b'}>{a.status}</Chip> },
            { key: 'act', label: '', align: 'right', nowrap: true, render: a => <RowActions><IconBtn icon="open" title="Chi tiết" to={`/compliance/assessments/${a.id}`} /></RowActions> },
          ]}
        />
      ) : (
        <>
          <DataTable
            rows={remediations}
            rowKey={r => r.id}
            highlightRow={r => (r.status !== 'Đã đóng' && r.dueAt < '2026-08-09' ? 'bad' : r.severity === 'Nghiêm trọng' && r.status !== 'Đã đóng' ? 'warn' : undefined)}
            columns={[
              { key: 'id', label: 'Mã', nowrap: true, render: r => <span className="mono text-[12px] font-semibold">{r.id}</span> },
              { key: 'finding', label: 'Phát hiện không phù hợp', width: '26%', render: r => <span className="font-semibold text-slate-800">{r.finding}</span> },
              { key: 'severity', label: 'Mức độ', nowrap: true, render: r => <StatusChip value={r.severity} /> },
              { key: 'plan', label: 'Kế hoạch khắc phục', width: '28%', render: r => <span className="text-[11.5px]">{r.plan}</span> },
              { key: 'owner', label: 'Người phụ trách', nowrap: true },
              { key: 'dueAt', label: 'Hạn khắc phục', nowrap: true, render: r => <span className={r.status !== 'Đã đóng' && r.dueAt < '2026-08-09' ? 'font-bold text-red-600' : ''}>{r.dueAt}</span> },
              { key: 'progressPct', label: 'Tiến độ', width: '120px', render: r => <ProgressBar pct={r.progressPct} height={10} note={`${r.progressPct}%`} /> },
              { key: 'status', label: 'Trạng thái', nowrap: true, render: r => <Chip tone={r.status === 'Đã đóng' ? 'g' : r.status === 'Chờ kiểm chứng' ? 'p' : r.status === 'Mới' ? 'r' : 'o'}>{r.status}</Chip> },
              { key: 'assessmentId', label: 'Kỳ đánh giá', nowrap: true, render: r => <EntityLink to={`/compliance/assessments/${r.assessmentId}`}>{r.assessmentId}</EntityLink> },
            ]}
          />
          <Note tone="bad" title="Hai kế hoạch quá hạn" className="mt-4">
            <b>KP-02</b> — khoá 9 tài khoản nghỉ việc, hạn 15/08, mới đạt 40%.<br />
            <b>KP-05</b> — xóa 128.400 hồ sơ quá hạn, hạn 31/08, đạt 85% nhưng đang chờ phê duyệt quy tắc vòng đời VD-02.
          </Note>
        </>
      )}
    </>
  )
}

export function AssessmentDetail() {
  const { id = '' } = useParams()
  const a = assessmentById(id)
  const toast = useToast()
  if (!a) return <EmptyState text="Không tìm thấy kỳ đánh giá" action={<ActionButton to="/compliance/assessments">Về danh sách</ActionButton>} />

  const score = Math.round((a.passed / (a.passed + a.failed || 1)) * 100)
  const rem = remediations.filter(r => r.assessmentId === a.id)

  return (
    <>
      <PageHeader
        code="6.3"
        title={a.name}
        desc={`${a.id} · ${a.period} · đánh giá bởi ${a.assessor} · ${a.startedAt} → ${a.finishedAt ?? 'đang thực hiện'}`}
        crumbs={[{ label: 'Chính sách & Tuân thủ' }, { label: 'Đánh giá tuân thủ', href: '/compliance/assessments' }, { label: a.id }]}
        actions={
          <>
            <Chip tone={a.status === 'Đã hoàn thành' ? 'g' : a.status === 'Chờ khắc phục' ? 'o' : 'b'}>{a.status}</Chip>
            <ActionButton variant="ghost" icon="export" onClick={() => toast.info('Xuất hồ sơ đánh giá', 'Gồm checklist, bằng chứng và kế hoạch khắc phục — minh hoạ.')}>Xuất hồ sơ</ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4">
          <Panel title={`Checklist đánh giá (${a.items.length} mục)`}>
            <DataTable
              rows={a.items}
              rowKey={i => i.code}
              highlightRow={i => (i.result === 'Không đạt' ? 'bad' : i.result === 'Không áp dụng' ? undefined : 'ok')}
              columns={[
                { key: 'code', label: 'Mã', nowrap: true, render: i => <span className="mono text-[11.5px] font-semibold">{i.code}</span> },
                { key: 'text', label: 'Yêu cầu kiểm tra', width: '28%' },
                { key: 'policyId', label: 'Chính sách', nowrap: true, render: i => <EntityLink to={`/compliance/policies/${i.policyId}`}>{i.policyId}</EntityLink> },
                { key: 'result', label: 'Kết quả', nowrap: true, render: i => <Chip tone={i.result === 'Đạt' ? 'g' : i.result === 'Không đạt' ? 'r' : 'n'}>{i.result}</Chip> },
                { key: 'evidence', label: 'Bằng chứng', width: '26%', render: i => <span className="text-[11.5px] text-slate-500">{i.evidence}</span> },
                { key: 'finding', label: 'Phát hiện', render: i => (i.finding ? <span className="text-[11.5px] font-semibold text-red-600">{i.finding}</span> : '—') },
              ]}
            />
          </Panel>

          {!!rem.length && (
            <Panel title={`Kế hoạch khắc phục (${rem.length})`}>
              <DataTable
                dense
                rows={rem}
                rowKey={r => r.id}
                columns={[
                  { key: 'id', label: 'Mã', nowrap: true, render: r => <span className="mono font-semibold">{r.id}</span> },
                  { key: 'finding', label: 'Phát hiện', width: '28%' },
                  { key: 'owner', label: 'Phụ trách', nowrap: true },
                  { key: 'dueAt', label: 'Hạn', nowrap: true },
                  { key: 'progressPct', label: 'Tiến độ', width: '110px', render: r => <ProgressBar pct={r.progressPct} height={10} note={`${r.progressPct}%`} /> },
                  { key: 'status', label: 'Trạng thái', nowrap: true, render: r => <Chip tone={r.status === 'Đã đóng' ? 'g' : r.status === 'Mới' ? 'r' : 'o'}>{r.status}</Chip> },
                ]}
              />
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <Panel title="Điểm tuân thủ kỳ này">
            <div className="flex items-center gap-4">
              <ScoreRing score={score} label="tuân thủ" size={92} />
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between text-[12px]"><span className="text-slate-600">Đạt</span><Chip tone="g">{a.passed}</Chip></div>
                <div className="flex items-center justify-between text-[12px]"><span className="text-slate-600">Không đạt</span><Chip tone="r">{a.failed}</Chip></div>
                <div className="flex items-center justify-between text-[12px]"><span className="text-slate-600">Không áp dụng</span><Chip tone="n">{a.na}</Chip></div>
              </div>
            </div>
          </Panel>

          <Panel title="Chính sách được đánh giá">
            <div className="space-y-1.5">
              {a.policyIds.map(p => {
                const pol = policyById(p)
                const items = a.items.filter(i => i.policyId === p)
                const pass = items.filter(i => i.result === 'Đạt').length
                return (
                  <div key={p} className="rounded-lg border border-slate-200 px-3 py-2">
                    <EntityLink to={`/compliance/policies/${p}`} mono={false}>{pol?.name ?? p}</EntityLink>
                    <div className="mt-1"><ProgressBar pct={items.length ? Math.round((pass / items.length) * 100) : 0} height={8} note={`${pass}/${items.length} mục đạt`} /></div>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Note tone="info" title="Hồ sơ bằng chứng tuân thủ">
            GĐ4 · FR-06 yêu cầu lưu <b>chính sách đã ban hành · nhật ký cấp/thu hồi quyền · nhật ký truy cập · lịch sử thay đổi metadata · kết quả kiểm tra chất lượng</b>.
            Mỗi mục checklist ở đây trỏ trực tiếp tới nguồn bằng chứng trong hệ thống — không phải chụp màn hình rời rạc.
          </Note>
        </div>
      </div>
    </>
  )
}
