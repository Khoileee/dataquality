import { useMemo, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import {
  RouteTabs, PageHeader, KpiRow, FilterBar, DataTable, CellTitle, Panel, Note, Chip, StatusChip,
  ActionButton, IconBtn, RowActions, EntityLink, InfoGrid, EmptyState, InlineTabs, Modal,
  useToast, Field, TextInput, TextArea, SelectInput, Steps, SectionTitle, ProgressBar,
  Timeline, FlowDiagram, StatusFlow, Toggle, CodeBlock,
} from '@/components/common'
import {
  mdmModels, mdmModelById, mdmSourceRecords, sourceRecordById, mdmDuplicates, duplicateById,
  goldenRecords, goldenById, distributionChannels, systems, systemById, STATS, fmt,
} from '@/data'
import { match, useDemoSave } from '@/lib/demo'
import { MDM_ENTITIES, usersByRole } from '@/data/enums'

/* ═════════ 7.1 Mô hình dữ liệu chủ ═════════ */

export function MdmModelList() {
  const [q, setQ] = useState('')
  const rows = useMemo(() => mdmModels.filter(m => match(`${m.id} ${m.name} ${m.entity}`, q)), [q])

  return (
    <>
      <PageHeader
        code="7.1"
        title="Mô hình dữ liệu chủ"
        desc="Thống nhất cấu trúc, thuộc tính bắt buộc, khóa định danh và quy tắc sinh mã trước khi thu thập và hợp nhất (GĐ5 · FR-01)"
        crumbs={[{ label: 'Dữ liệu chủ (MDM)' }, { label: 'Mô hình dữ liệu chủ' }]}
        actions={<ActionButton icon="plus" to="/mdm/models/create">Thiết kế mô hình mới</ActionButton>}
      />

      <KpiRow
        items={[
          { label: 'Mô hình dữ liệu chủ', value: mdmModels.length, sub: 'khách hàng · sản phẩm · đơn vị · danh mục' },
          { label: 'Bản ghi chuẩn', value: fmt(STATS.mdmGolden), sub: 'Golden Record đã tạo', tone: 'ok' },
          { label: 'Bản ghi nguồn', value: fmt(mdmModels.reduce((a, m) => a + m.sourceCount, 0)), sub: 'từ 4 hệ thống nguồn' },
          { label: 'Nghi ngờ trùng chờ xử lý', value: fmt(STATS.mdmDuplicatesPending), sub: 'cần đầu mối quản trị xem xét', tone: 'bad' },
          { label: 'Hệ thống dùng mã chuẩn', value: `${STATS.mdmSystemsAdopted}/${STATS.mdmSystemsTotal}`, sub: '33% — mục tiêu 100%', tone: 'warn' },
        ]}
      />

      <div className="mt-4">
        <FilterBar placeholder="Tìm theo tên mô hình, loại đối tượng…" value={q} onChange={setQ} right={<span className="text-[12px] text-slate-400">{rows.length} mô hình</span>} />
      </div>

      <DataTable
        stt
        rows={rows}
        rowKey={m => m.id}
        highlightRow={m => (m.approval !== 'Đã phê duyệt' ? 'warn' : m.duplicatePending > 1000 ? 'bad' : undefined)}
        columns={[
          { key: 'id', label: 'Mã', nowrap: true, render: m => <EntityLink to={`/mdm/models/${m.id}`}>{m.id}</EntityLink> },
          { key: 'name', label: 'Tên mô hình', width: '18%', render: m => <CellTitle title={m.name} sub={`Đầu mối quản trị: ${m.steward}`} /> },
          { key: 'entity', label: 'Loại dữ liệu chủ', nowrap: true, render: m => <Chip tone="t">{m.entity}</Chip> },
          { key: 'attributes', label: 'Thuộc tính', align: 'center', nowrap: true, render: m => <div><Chip tone="b">{m.attributes.length}</Chip><div className="mt-0.5 text-[10px] text-slate-400">{m.attributes.filter(a => a.required).length} bắt buộc</div></div> },
          { key: 'matchKeys', label: 'Khóa định danh', width: '18%', render: m => <div className="flex flex-wrap gap-1">{m.matchKeys.map(k => <Chip key={k} tone="p">{k}</Chip>)}</div> },
          { key: 'sourceSystems', label: 'Hệ thống nguồn', nowrap: true, render: m => <Chip tone="n">{m.sourceSystems.length} hệ thống</Chip> },
          { key: 'sourceCount', label: 'Bản ghi nguồn', align: 'right', nowrap: true, render: m => fmt(m.sourceCount) },
          { key: 'goldenCount', label: 'Bản ghi chuẩn', align: 'right', nowrap: true, render: m => <span className="font-semibold text-emerald-600">{fmt(m.goldenCount)}</span> },
          { key: 'duplicatePending', label: 'Nghi ngờ trùng', align: 'right', nowrap: true, render: m => (m.duplicatePending ? <span className="font-semibold text-red-600">{fmt(m.duplicatePending)}</span> : '0') },
          { key: 'owner', label: 'Người sở hữu', nowrap: true },
          { key: 'approval', label: 'Phê duyệt', nowrap: true, render: m => <StatusChip value={m.approval} /> },
          { key: 'act', label: '', align: 'right', nowrap: true, render: m => <RowActions><IconBtn icon="open" title="Chi tiết" to={`/mdm/models/${m.id}`} /></RowActions> },
        ]}
      />

      <Panel title="Năm bước của quy trình quản lý dữ liệu chủ" className="mt-4">
        <FlowDiagram
          width={980}
          height={118}
          nodes={[
            { id: 'p1', x: 6, y: 25, w: 172, h: 62, title: '① Thu thập', sub: 'Lấy dữ liệu từ hệ thống nguồn', tone: 'source', to: '/mdm/sources' },
            { id: 'p2', x: 202, y: 25, w: 172, h: 62, title: '② Chuẩn hoá', sub: 'Đưa về cùng khuôn dạng', tone: 'neutral', to: '/mdm/sources' },
            { id: 'p3', x: 398, y: 25, w: 172, h: 62, title: '③ Phát hiện trùng', sub: 'So khớp và chấm điểm', tone: 'warn', to: '/mdm/duplicates', badge: { text: `${fmt(STATS.mdmDuplicatesPending)} chờ`, tone: 'r' } },
            { id: 'p4', x: 594, y: 25, w: 172, h: 62, title: '④ Hợp nhất', sub: 'Tạo bản ghi chuẩn', tone: 'ok', to: '/mdm/golden' },
            { id: 'p5', x: 790, y: 25, w: 182, h: 62, title: '⑤ Phân phối', sub: 'API · theo lô · theo sự kiện', tone: 'target', to: '/mdm/golden' },
          ]}
          edges={[{ from: 'p1', to: 'p2' }, { from: 'p2', to: 'p3' }, { from: 'p3', to: 'p4' }, { from: 'p4', to: 'p5' }]}
        />
      </Panel>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Note tone="bad" title="Vì sao module này là bổ sung sau review">
          Toàn bộ <b>Giai đoạn 5</b> của lộ trình BDA là Quản lý dữ liệu chủ, với 6 yêu cầu chức năng FR-01 → FR-06.
          Thiết kế DMP ban đầu <b>không có menu nào</b> cho phần này. Lãnh đạo đọc tài liệu sẽ kết luận tool không làm được GĐ5 và
          có thể xin ngân sách cho một tool thứ hai.
        </Note>
        <Note tone="info" title="Triển khai ở Đợt 5 — nhưng phải có mặt trên bản đồ ngay">
          Module này kế thừa danh mục dữ liệu (GĐ1–2), quy tắc chất lượng (GĐ3) và phân loại bảo mật (GĐ4).
          Dựng khung ngay từ đầu để lãnh đạo thấy tool có đường đi tới cuối lộ trình, còn khối lượng thực hiện dồn về đợt cuối.
        </Note>
      </div>
    </>
  )
}

export function MdmModelDetail() {
  const { id = '' } = useParams()
  const m = mdmModelById(id)
  if (!m) return <EmptyState text="Không tìm thấy mô hình" action={<ActionButton to="/mdm/models">Về danh sách</ActionButton>} />

  const dups = mdmDuplicates.filter(d => d.modelId === m.id)
  const dist = distributionChannels.filter(d => d.modelId === m.id)

  return (
    <>
      <PageHeader
        code="7.1"
        title={m.name}
        desc={`${m.id} · ${m.entity} · ${fmt(m.goldenCount)} bản ghi chuẩn từ ${fmt(m.sourceCount)} bản ghi nguồn`}
        crumbs={[{ label: 'Dữ liệu chủ (MDM)' }, { label: 'Mô hình dữ liệu chủ', href: '/mdm/models' }, { label: m.id }]}
        actions={
          <>
            <Chip tone="t">{m.entity}</Chip>
            <StatusChip value={m.approval} />
            <ActionButton variant="ghost" icon="edit" to={`/mdm/models/create?id=${m.id}`}>Sửa</ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4">
          <Panel title={`Thuộc tính mô hình chuẩn (${m.attributes.length})`}>
            <DataTable
              rows={m.attributes}
              rowKey={a => a.name}
              highlightRow={a => (a.identity ? 'ok' : undefined)}
              columns={[
                { key: 'name', label: 'Tên thuộc tính', nowrap: true, render: a => <span className="mono text-[12px] font-semibold">{a.name}</span> },
                { key: 'label', label: 'Tên hiển thị', nowrap: true },
                { key: 'type', label: 'Kiểu dữ liệu', nowrap: true, render: a => <Chip tone="n">{a.type}</Chip> },
                { key: 'required', label: 'Bắt buộc', align: 'center', nowrap: true, render: a => (a.required ? <Chip tone="r">Có</Chip> : '—') },
                { key: 'identity', label: 'Khóa định danh', align: 'center', nowrap: true, render: a => (a.identity ? <Chip tone="p">Có</Chip> : '—') },
                { key: 'standardRule', label: 'Quy tắc chuẩn hoá', width: '30%', render: a => <span className="text-[11.5px]">{a.standardRule}</span> },
                { key: 'confidentiality', label: 'Phân loại', nowrap: true, render: a => <StatusChip value={a.confidentiality} /> },
              ]}
            />
          </Panel>

          <Panel title="Quy tắc quản lý">
            <InfoGrid
              items={[
                { label: 'Quy tắc sinh mã chuẩn', value: <span className="mono">{m.codeRule}</span>, full: true },
                { label: 'Khóa so khớp', value: <div className="flex flex-wrap gap-1">{m.matchKeys.map(k => <Chip key={k} tone="p">{k}</Chip>)}</div>, full: true },
                { label: 'Quy tắc chọn giá trị khi hợp nhất', value: m.survivorship, full: true },
                { label: 'Người sở hữu dữ liệu', value: m.owner },
                { label: 'Đầu mối quản trị dữ liệu chủ', value: m.steward },
              ]}
            />
          </Panel>

          <Panel title="Hệ thống nguồn">
            <DataTable
              dense
              rows={m.sourceSystems.map(s => systemById(s)).filter(Boolean) as any[]}
              rowKey={s => s.id}
              columns={[
                { key: 'id', label: 'Mã', nowrap: true, render: s => <EntityLink to={`/catalog/systems/${s.id}`}>{s.id}</EntityLink> },
                { key: 'name', label: 'Hệ thống' },
                { key: 'tech', label: 'Công nghệ', nowrap: true, render: s => <span className="mono text-[11.5px]">{s.tech}</span> },
                { key: 'status', label: 'Trạng thái', nowrap: true, render: s => <Chip tone={s.status === 'Đang sử dụng' ? 'g' : 'n'}>{s.status}</Chip> },
              ]}
            />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Mức độ hợp nhất">
            <ProgressBar
              pct={Math.round((m.goldenCount / m.sourceCount) * 100)}
              label="Tỷ lệ hợp nhất"
              note={`${fmt(m.goldenCount)} chuẩn / ${fmt(m.sourceCount)} nguồn`}
              tone="info"
            />
            <div className="mt-3 space-y-1.5 text-[12px]">
              <div className="flex justify-between"><span className="text-slate-600">Bản ghi nguồn</span><span className="font-semibold">{fmt(m.sourceCount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Bản ghi chuẩn</span><span className="font-semibold text-emerald-600">{fmt(m.goldenCount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Nghi ngờ trùng chờ xử lý</span><span className="font-semibold text-red-600">{fmt(m.duplicatePending)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Tỷ lệ giảm trùng lặp</span><span className="font-semibold">{Math.round((1 - m.goldenCount / m.sourceCount) * 100)}%</span></div>
            </div>
          </Panel>

          <Panel title="Phân phối tới hệ thống">
            <div className="space-y-1.5">
              {dist.map(d => (
                <div key={d.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-slate-800">{d.target}</span>
                    <Chip tone={d.status === 'Đồng bộ' ? 'g' : d.status === 'Lệch' ? 'o' : 'r'}>{d.status}</Chip>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{d.method} · {d.frequency} · lần cuối {d.lastSync}</div>
                  {d.drift > 0 && <div className="mt-0.5 text-[11px] font-semibold text-red-600">Lệch {fmt(d.drift)} bản ghi</div>}
                </div>
              ))}
              {!dist.length && <span className="text-[12px] text-slate-400">Chưa cấu hình kênh phân phối</span>}
            </div>
          </Panel>

          <Note tone="warn" title="Không tự động hợp nhất khi chưa xác nhận">
            GĐ5 · FR-03 ghi rõ: <i>"đưa ra danh sách bản ghi nghi ngờ trùng để đầu mối quản trị dữ liệu xem xét,
            không tự động hợp nhất khi chưa xác nhận"</i>. Hiện có <b>{fmt(m.duplicatePending)}</b> bản ghi đang chờ.
          </Note>
        </div>
      </div>
    </>
  )
}

export function MdmModelCreate() {
  const save = useDemoSave('/mdm/models')
  const [step, setStep] = useState(0)
  const [f, setF] = useState({ name: '', entity: 'Khách hàng', codeRule: '', survivorship: '', owner: '', steward: '' })
  const [attrs, setAttrs] = useState([
    { name: 'ma_chuan', label: 'Mã chuẩn', type: 'string(12)', required: true, identity: true, rule: 'Sinh theo quy tắc mã chuẩn' },
  ])
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }))
  const ok = f.name && f.codeRule && f.owner && f.steward && attrs.some(a => a.identity)

  return (
    <>
      <PageHeader
        code="7.1"
        title="Thiết kế mô hình dữ liệu chuẩn"
        desc="Định nghĩa thuộc tính, khóa định danh và quy tắc quản lý trước khi thu thập dữ liệu từ các nguồn"
        crumbs={[{ label: 'Dữ liệu chủ (MDM)' }, { label: 'Mô hình dữ liệu chủ', href: '/mdm/models' }, { label: 'Thiết kế mới' }]}
      />
      <Steps items={['Loại dữ liệu chủ', 'Thuộc tính', 'Quy tắc quản lý']} current={step} onJump={setStep} />

      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title={['Chọn loại dữ liệu chủ', 'Định nghĩa thuộc tính', 'Quy tắc sinh mã và hợp nhất'][step]}>
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tên mô hình" required full><TextInput value={f.name} onChange={set('name')} placeholder="Khách hàng chuẩn" /></Field>
              <Field label="Loại dữ liệu chủ" required>
                <SelectInput value={f.entity} onChange={set('entity')}>{MDM_ENTITIES.map(e => <option key={e}>{e}</option>)}</SelectInput>
              </Field>
              <Field label="Người sở hữu dữ liệu" required>
                <SelectInput value={f.owner} onChange={set('owner')}>
                  <option value="">— Chọn —</option>
                  {usersByRole('Người sở hữu dữ liệu').map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </SelectInput>
              </Field>
              <Field label="Đầu mối quản trị dữ liệu chủ" required hint="Người xem xét và quyết định hợp nhất bản ghi nghi ngờ trùng">
                <SelectInput value={f.steward} onChange={set('steward')}>
                  <option value="">— Chọn —</option>
                  {usersByRole('Đầu mối nghiệp vụ').map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </SelectInput>
              </Field>
              <div className="col-span-full">
                <Note tone="info" title="Thứ tự ưu tiên triển khai — GĐ5 mục 3">
                  <b>Khách hàng</b> ưu tiên cao nếu được quản lý ở nhiều hệ thống ·
                  <b> Sản phẩm/Dịch vụ</b> ưu tiên theo mức độ dùng chung giữa báo cáo ·
                  <b> Đơn vị/Tổ chức</b> ưu tiên nếu dùng làm chiều phân tích trong nhiều báo cáo ·
                  <b> Danh mục dùng chung</b> theo nhu cầu thực tế.
                </Note>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <Note tone="warn" title="Phải có ít nhất một khóa định danh">
                Khóa định danh là trường hoặc tổ hợp trường xác định một bản ghi là duy nhất — cơ sở để phát hiện trùng.
              </Note>
              <div className="space-y-2">
                {attrs.map((a, i) => (
                  <div key={i} className="grid grid-cols-[1.2fr_1.2fr_1fr_auto_auto_1.6fr_auto] items-end gap-2 rounded-lg border border-slate-200 p-2.5">
                    <Field label="Tên thuộc tính"><TextInput mono value={a.name} onChange={e => setAttrs(p => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></Field>
                    <Field label="Tên hiển thị"><TextInput value={a.label} onChange={e => setAttrs(p => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} /></Field>
                    <Field label="Kiểu"><TextInput mono value={a.type} onChange={e => setAttrs(p => p.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))} /></Field>
                    <label className="flex flex-col items-center gap-1 pb-2 text-[11px] text-slate-500">
                      Bắt buộc
                      <input type="checkbox" checked={a.required} onChange={e => setAttrs(p => p.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)))} />
                    </label>
                    <label className="flex flex-col items-center gap-1 pb-2 text-[11px] text-slate-500">
                      Định danh
                      <input type="checkbox" checked={a.identity} onChange={e => setAttrs(p => p.map((x, j) => (j === i ? { ...x, identity: e.target.checked } : x)))} />
                    </label>
                    <Field label="Quy tắc chuẩn hoá"><TextInput value={a.rule} onChange={e => setAttrs(p => p.map((x, j) => (j === i ? { ...x, rule: e.target.value } : x)))} /></Field>
                    <button onClick={() => setAttrs(p => p.filter((_, j) => j !== i))} className="mb-2 rounded px-2 py-1 text-[12px] text-red-500 hover:bg-red-50">Xoá</button>
                  </div>
                ))}
              </div>
              <ActionButton variant="ghost" icon="plus" onClick={() => setAttrs(p => [...p, { name: '', label: '', type: 'string(100)', required: false, identity: false, rule: '' }])}>Thêm thuộc tính</ActionButton>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Quy tắc sinh mã chuẩn" info="mdm.goldenCode" required hint="Mã của bản ghi chuẩn (Golden Record)">
                <TextInput mono value={f.codeRule} onChange={set('codeRule')} placeholder="KH + 10 chữ số tuần tự — ví dụ KH0000001284" />
              </Field>
              <Field label="Quy tắc chọn giá trị khi hợp nhất" info="mdm.survivorship" required hint="Khi các nguồn có giá trị khác nhau cho cùng một thuộc tính thì lấy của nguồn nào">
                <TextArea rows={3} value={f.survivorship} onChange={set('survivorship')} placeholder="Ưu tiên hệ thống CRM > Core thanh toán > CRM cũ; trường rỗng lấy từ nguồn kế tiếp" />
              </Field>
              <Note tone="info" title="Quy tắc hợp nhất quyết định chất lượng bản ghi chuẩn">
                Ba cách phổ biến: <b>theo độ tin cậy nguồn</b> (hệ thống nào chuẩn hơn) ·
                <b> theo thời gian</b> (bản ghi mới nhất thắng) ·
                <b> theo độ đầy đủ</b> (bản ghi nào có nhiều trường hơn thì thắng).
                Có thể kết hợp cả ba theo từng thuộc tính.
              </Note>
            </div>
          )}
        </Panel>

        <Panel title="Xem trước mô hình">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-[13px] font-bold text-slate-800">{f.name || 'chưa đặt tên'}</div>
            <Chip tone="t" className="mt-1">{f.entity}</Chip>
            <div className="mt-3 text-[11px] font-semibold uppercase text-slate-400">Thuộc tính ({attrs.length})</div>
            <div className="mt-1 space-y-1">
              {attrs.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-[11.5px]">
                  <span className="mono text-slate-700">{a.name || '—'}</span>
                  <div className="flex gap-1">
                    {a.required && <Chip tone="r">bắt buộc</Chip>}
                    {a.identity && <Chip tone="p">định danh</Chip>}
                  </div>
                </div>
              ))}
            </div>
            {f.codeRule && (
              <>
                <div className="mt-3 text-[11px] font-semibold uppercase text-slate-400">Quy tắc mã</div>
                <div className="mono mt-0.5 text-[11.5px] text-blue-700">{f.codeRule}</div>
              </>
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/mdm/models">Huỷ</ActionButton>
        <div className="flex gap-2">
          {step > 0 && <ActionButton variant="ghost" onClick={() => setStep(s => s - 1)}>Quay lại</ActionButton>}
          {step < 2
            ? <ActionButton onClick={() => setStep(s => s + 1)}>Tiếp tục</ActionButton>
            : <ActionButton disabled={!ok} onClick={() => save('Đã gửi phê duyệt mô hình dữ liệu chủ')}>Gửi phê duyệt</ActionButton>}
        </div>
      </div>
    </>
  )
}

/* ═════════ 7.2 Bản ghi nguồn ═════════ */

export function MdmSources({ embedded }: { embedded?: boolean } = {}) {
  const [model, setModel] = useState('MDM-KH')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [pick, setPick] = useState<any>(null)
  const toast = useToast()

  const m = mdmModelById(model)!
  const rows = useMemo(
    () => mdmSourceRecords.filter(r => r.modelId === model && (!status || r.status === status) &&
      match(`${r.id} ${r.sourceKey} ${Object.values(r.values).join(' ')}`, q)),
    [model, q, status]
  )

  const attrs = m.attributes.filter(a => a.name !== 'ma_kh_chuan' && a.name !== 'ma_sp_chuan')

  return (
    <>
      {!embedded && (
        <PageHeader
          code="7.2"
          title="Bản ghi nguồn"
          desc="Dữ liệu thu thập từ các hệ thống nguồn, đã hoặc chưa chuẩn hoá — bước ① và ② của quy trình MDM"
          crumbs={[{ label: 'Dữ liệu chủ (MDM)' }, { label: 'Bản ghi nguồn' }]}
          actions={
            <>
              <ActionButton variant="ghost" icon="run" onClick={() => toast.info('Đang thu thập', 'Kết nối 4 hệ thống nguồn để lấy dữ liệu mới — minh hoạ.')}>Thu thập lại</ActionButton>
              <ActionButton variant="ghost" onClick={() => toast.info('Đang chuẩn hoá', 'Áp quy tắc chuẩn hoá cho bản ghi chưa xử lý — minh hoạ.')}>Chuẩn hoá</ActionButton>
            </>
          }
        />
      )}

      <Panel className="mb-4">
        <div className="flex items-end gap-3">
          <Field label="Mô hình dữ liệu chủ" className="w-[340px]">
            <SelectInput value={model} onChange={e => setModel(e.target.value)}>
              {mdmModels.map(x => <option key={x.id} value={x.id}>{x.id} — {x.name}</option>)}
            </SelectInput>
          </Field>
          <div className="flex gap-3 pb-1 text-[12px] text-slate-500">
            <span>Nguồn: <b className="text-slate-800">{m.sourceSystems.length} hệ thống</b></span>
            <span>Tổng bản ghi: <b className="text-slate-800">{fmt(m.sourceCount)}</b></span>
            <span>Khóa so khớp: <b className="text-slate-800">{m.matchKeys.join(' · ')}</b></span>
          </div>
        </div>
      </Panel>

      <KpiRow
        items={[
          { label: 'Bản ghi nguồn (mô hình này)', value: fmt(m.sourceCount), sub: `hiển thị ${rows.length} bản ghi mẫu` },
          { label: 'Đã chuẩn hoá', value: mdmSourceRecords.filter(r => r.modelId === model && r.normalized).length, sub: 'sẵn sàng so khớp', tone: 'ok' },
          { label: 'Chưa xử lý', value: mdmSourceRecords.filter(r => r.modelId === model && r.status === 'Chưa xử lý').length, sub: 'còn lỗi định dạng', tone: 'warn' },
          { label: 'Đã liên kết bản ghi chuẩn', value: mdmSourceRecords.filter(r => r.modelId === model && r.goldenId).length, sub: 'có Golden Record', tone: 'ok' },
          { label: 'Loại trừ', value: mdmSourceRecords.filter(r => r.modelId === model && r.status === 'Loại trừ').length, sub: 'dữ liệu thử nghiệm', tone: 'n' as any },
        ]}
      />

      <div className="mt-4">
        <FilterBar
          placeholder="Tìm theo mã nguồn, giá trị thuộc tính…"
          value={q}
          onChange={setQ}
          filters={[{ label: 'Trạng thái', options: ['Chưa xử lý', 'Đã chuẩn hoá', 'Đã liên kết', 'Loại trừ'], value: status, onChange: setStatus }]}
          right={<span className="text-[12px] text-slate-400">{rows.length} bản ghi</span>}
        />
      </div>

      <DataTable
        stt
        rows={rows}
        rowKey={r => r.id}
        highlightRow={r => (r.issues.length ? 'warn' : r.status === 'Loại trừ' ? 'bad' : undefined)}
        onRowClick={r => setPick(r)}
        columns={[
          { key: 'id', label: 'Mã bản ghi', nowrap: true, render: r => <span className="mono text-[11.5px] font-semibold">{r.id}</span> },
          { key: 'sourceSystem', label: 'Hệ thống nguồn', nowrap: true, render: r => <EntityLink to={`/catalog/systems/${r.sourceSystem}`}>{r.sourceSystem}</EntityLink> },
          { key: 'sourceKey', label: 'Mã gốc', nowrap: true, render: r => <span className="mono text-[11.5px]">{r.sourceKey}</span> },
          ...attrs.slice(0, 4).map(a => ({
            key: a.name,
            label: a.label,
            nowrap: true,
            render: (r: any) => <span className={a.confidentiality === 'Hạn chế truy cập' ? 'mono text-[11.5px] text-slate-400' : 'text-[12px]'}>
              {a.confidentiality === 'Hạn chế truy cập' && r.values[a.name] ? maskValue(r.values[a.name]) : (r.values[a.name] || '—')}
            </span>,
          })),
          { key: 'normalized', label: 'Chuẩn hoá', align: 'center', nowrap: true, render: r => (r.normalized ? <Chip tone="g">Đã</Chip> : <Chip tone="o">Chưa</Chip>) },
          { key: 'issues', label: 'Vấn đề', width: '18%', render: r => (r.issues.length ? <div className="flex flex-wrap gap-1">{r.issues.map((i: string) => <Chip key={i} tone="r">{i}</Chip>)}</div> : '—') },
          { key: 'matchScore', label: 'Điểm khớp', align: 'right', nowrap: true, render: r => (r.matchScore ? <span className={r.matchScore >= 90 ? 'font-bold text-emerald-600' : 'font-bold text-amber-600'}>{r.matchScore}%</span> : '—') },
          { key: 'goldenId', label: 'Bản ghi chuẩn', nowrap: true, render: r => (r.goldenId ? <EntityLink to={`/mdm/golden/${r.goldenId}`}>{r.goldenId}</EntityLink> : <span className="text-slate-300">— chưa liên kết</span>) },
          { key: 'status', label: 'Trạng thái', nowrap: true, render: r => <Chip tone={r.status === 'Đã liên kết' ? 'g' : r.status === 'Đã chuẩn hoá' ? 'b' : r.status === 'Loại trừ' ? 'n' : 'o'}>{r.status}</Chip> },
        ]}
      />

      <Note tone="info" title="Chuẩn hoá là bước quyết định chất lượng so khớp" className="mt-4">
        Cùng một người nhưng CRM ghi <span className="mono">"Nguyễn Văn An"</span>, Core ghi <span className="mono">"NGUYEN VAN AN"</span>,
        CRM cũ ghi <span className="mono">"Nguyễn V. An"</span> — và số điện thoại lần lượt là <span className="mono">84912345678</span>,
        <span className="mono"> 0912345678</span>, <span className="mono">+84912345678</span>.
        Không chuẩn hoá thì thuật toán so khớp không nhận ra đây là một người.
      </Note>

      <Modal open={!!pick} onClose={() => setPick(null)} size="lg" title={pick && `Bản ghi nguồn ${pick.id}`} desc={pick && `${pick.sourceSystem} · mã gốc ${pick.sourceKey}`} footer={<ActionButton variant="ghost" onClick={() => setPick(null)}>Đóng</ActionButton>}>
        {pick && (
          <div className="space-y-4">
            <InfoGrid
              items={[
                { label: 'Hệ thống nguồn', value: systemById(pick.sourceSystem)?.name ?? pick.sourceSystem },
                { label: 'Mã bản ghi gốc', value: <span className="mono">{pick.sourceKey}</span> },
                { label: 'Thời điểm nạp', value: pick.loadedAt },
                { label: 'Trạng thái', value: <Chip tone="b">{pick.status}</Chip> },
                { label: 'Điểm khớp', value: pick.matchScore ? `${pick.matchScore}%` : '— chưa so khớp' },
                { label: 'Bản ghi chuẩn liên kết', value: pick.goldenId ?? '— chưa liên kết' },
              ]}
            />
            <div>
              <SectionTitle>Giá trị thuộc tính</SectionTitle>
              <DataTable
                dense
                rows={Object.entries(pick.values).map(([k, v]) => {
                  const at = m.attributes.find(a => a.name === k)
                  return { attr: at?.label ?? k, name: k, value: v as string, conf: at?.confidentiality ?? 'Nội bộ', rule: at?.standardRule ?? '—' }
                })}
                rowKey={r => r.name}
                columns={[
                  { key: 'attr', label: 'Thuộc tính', nowrap: true, render: r => <span className="font-semibold">{r.attr}</span> },
                  { key: 'value', label: 'Giá trị nguồn', render: r => <span className="mono text-[11.5px]">{r.value || '(rỗng)'}</span> },
                  { key: 'conf', label: 'Phân loại', nowrap: true, render: r => <StatusChip value={r.conf} /> },
                  { key: 'rule', label: 'Quy tắc chuẩn hoá', render: r => <span className="text-[11px] text-slate-500">{r.rule}</span> },
                ]}
              />
            </div>
            {!!pick.issues.length && (
              <Note tone="bad" title="Vấn đề cần xử lý trước khi so khớp">
                <ul className="ml-4 mt-1 list-disc space-y-0.5">{pick.issues.map((i: string) => <li key={i}>{i}</li>)}</ul>
              </Note>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}

function maskValue(v: string) {
  if (!v) return '—'
  return v.length > 4 ? '*'.repeat(v.length - 4) + v.slice(-4) : '****'
}

/* ═════════ 7.3 Nghi ngờ trùng & Hợp nhất ═════════ */

export function MdmDuplicates({ embedded }: { embedded?: boolean } = {}) {
  const [status, setStatus] = useState('')
  const [pick, setPick] = useState<any>(null)
  const [note, setNote] = useState('')
  const toast = useToast()

  const rows = useMemo(() => mdmDuplicates.filter(d => !status || d.status === status), [status])

  return (
    <>
      {!embedded && (
        <PageHeader
          code="7.2"
          title="Nghi ngờ trùng & Hợp nhất"
          desc="Danh sách bản ghi nghi ngờ trùng để đầu mối quản trị dữ liệu xem xét — hệ thống không tự hợp nhất khi chưa xác nhận"
          crumbs={[{ label: 'Dữ liệu chủ (MDM)' }, { label: 'Nghi ngờ trùng & Hợp nhất' }]}
        />
      )}

      <StatusFlow
        steps={[
          { label: 'Chưa xem xét', count: mdmDuplicates.filter(d => d.status === 'Chưa xem xét').length, tone: 'b' },
          { label: 'Đang xem xét', count: mdmDuplicates.filter(d => d.status === 'Đang xem xét').length, tone: 'o' },
          { label: 'Đã hợp nhất', count: mdmDuplicates.filter(d => d.status === 'Đã hợp nhất').length, tone: 'g' },
          { label: 'Từ chối hợp nhất', count: mdmDuplicates.filter(d => d.status === 'Từ chối hợp nhất').length, tone: 'n' },
        ]}
        active={status}
        onPick={l => setStatus(status === l ? '' : l)}
      />

      <KpiRow
        items={[
          { label: 'Nghi ngờ trùng toàn hệ thống', value: fmt(STATS.mdmDuplicatesPending), sub: `hiển thị ${mdmDuplicates.length} trường hợp mẫu`, tone: 'bad' },
          { label: 'Chưa xem xét', value: mdmDuplicates.filter(d => d.status === 'Chưa xem xét').length, sub: 'tồn đọng cần xử lý', tone: 'warn' },
          { label: 'Đã hợp nhất', value: mdmDuplicates.filter(d => d.status === 'Đã hợp nhất').length, sub: 'giảm bản ghi trùng', tone: 'ok' },
          { label: 'Từ chối hợp nhất', value: mdmDuplicates.filter(d => d.status === 'Từ chối hợp nhất').length, sub: 'ghi lý do để không xét lại' },
          { label: 'Điểm khớp trung bình', value: `${Math.round(mdmDuplicates.reduce((a, d) => a + d.score, 0) / mdmDuplicates.length)}%`, sub: 'ngưỡng đề xuất hợp nhất 85%' },
        ]}
      />

      <div className="mt-4">
        <DataTable
          stt
          rows={rows}
          rowKey={d => d.id}
          highlightRow={d => (d.status === 'Chưa xem xét' ? 'warn' : d.status === 'Đã hợp nhất' ? 'ok' : undefined)}
          columns={[
            { key: 'id', label: 'Mã', nowrap: true, render: d => <span className="mono text-[12px] font-semibold">{d.id}</span> },
            { key: 'modelId', label: 'Mô hình', nowrap: true, render: d => <EntityLink to={`/mdm/models/${d.modelId}`}>{d.modelId}</EntityLink> },
            { key: 'records', label: 'Bản ghi nghi ngờ trùng', width: '18%', render: d => <div className="flex flex-wrap gap-1">{d.records.map(r => <Chip key={r} tone="n">{r}</Chip>)}</div> },
            { key: 'score', label: 'Điểm khớp', align: 'right', nowrap: true, render: d => <span className={d.score >= 90 ? 'font-bold text-red-600' : d.score >= 80 ? 'font-bold text-amber-600' : 'font-bold text-slate-600'}>{d.score}%</span> },
            { key: 'reason', label: 'Căn cứ so khớp', width: '30%', render: d => <span className="text-[11.5px]">{d.reason}</span> },
            { key: 'reviewer', label: 'Người xem xét', nowrap: true, render: d => d.reviewer ?? <span className="text-slate-300">— chưa gán</span> },
            { key: 'decidedAt', label: 'Thời điểm quyết định', nowrap: true, render: d => d.decidedAt ?? '—' },
            { key: 'status', label: 'Trạng thái', nowrap: true, render: d => <StatusChip value={d.status} /> },
            { key: 'act', label: '', align: 'right', nowrap: true, render: d => <RowActions><ActionButton variant="ghost" onClick={() => setPick(d)}>{d.status === 'Đã hợp nhất' || d.status === 'Từ chối hợp nhất' ? 'Xem' : 'Xem xét'}</ActionButton></RowActions> },
          ]}
        />
      </div>

      <Note tone="info" title="Ngưỡng điểm khớp và cách xử lý" className="mt-4">
        <b>≥ 95%</b> — gần như chắc chắn trùng, đề xuất hợp nhất ·
        <b> 85–94%</b> — nhiều khả năng trùng, cần người xem xét ·
        <b> 70–84%</b> — nghi ngờ, thường là trùng tên hoặc ngày sinh ngẫu nhiên ·
        <b> &lt; 70%</b> — không đưa vào danh sách.
        Bản ghi bị từ chối hợp nhất được ghi lại để <b>không xét lại lần sau</b>.
      </Note>

      <Modal
        open={!!pick}
        onClose={() => { setPick(null); setNote('') }}
        size="xl"
        title={pick && `${pick.id} — So sánh bản ghi nghi ngờ trùng`}
        desc={pick && `Điểm khớp ${pick.score}% · ${pick.reason}`}
        footer={
          pick && (pick.status === 'Chưa xem xét' || pick.status === 'Đang xem xét') ? (
            <>
              <ActionButton variant="ghost" onClick={() => { setPick(null); setNote('') }}>Đóng</ActionButton>
              <ActionButton variant="ghost" disabled={!note.trim()} onClick={() => { toast.warn('Đã từ chối hợp nhất', 'Ghi nhận lý do — lần sau hệ thống không đề xuất lại cặp này.'); setPick(null); setNote('') }}>
                Từ chối hợp nhất
              </ActionButton>
              <ActionButton onClick={() => { toast.success('Đã hợp nhất', 'Tạo bản ghi chuẩn và phân phối tới các hệ thống đăng ký.'); setPick(null); setNote('') }}>
                Hợp nhất thành bản ghi chuẩn
              </ActionButton>
            </>
          ) : <ActionButton variant="ghost" onClick={() => setPick(null)}>Đóng</ActionButton>
        }
      >
        {pick && <DuplicateCompare dup={pick} note={note} setNote={setNote} />}
      </Modal>
    </>
  )
}

function DuplicateCompare({ dup, note, setNote }: { dup: any; note: string; setNote: (v: string) => void }) {
  const recs = dup.records.map((r: string) => sourceRecordById(r)).filter(Boolean) as any[]
  const m = mdmModelById(dup.modelId)!
  const attrs = m.attributes.filter(a => !a.name.startsWith('ma_') || a.name.includes('nguon'))

  return (
    <div className="space-y-4">
      <InfoGrid
        items={[
          { label: 'Mô hình', value: m.name },
          { label: 'Điểm khớp', value: <span className={dup.score >= 90 ? 'font-bold text-red-600' : 'font-bold text-amber-600'}>{dup.score}%</span> },
          { label: 'Số bản ghi', value: recs.length },
          { label: 'Trạng thái', value: <StatusChip value={dup.status} /> },
          { label: 'Căn cứ so khớp', value: dup.reason, full: true },
          ...(dup.note ? [{ label: 'Ghi chú quyết định', value: dup.note, full: true }] : []),
        ]}
      />

      <div>
        <SectionTitle right={<span className="text-[11px] text-slate-400">Ô tô vàng là giá trị khác nhau giữa các nguồn</span>}>So sánh giá trị từng thuộc tính</SectionTitle>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold uppercase text-slate-500">Thuộc tính</th>
                {recs.map(r => (
                  <th key={r.id} className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-[10.5px] font-bold uppercase text-slate-500">
                    {r.sourceSystem}
                    <div className="mono text-[10px] font-normal normal-case text-slate-400">{r.sourceKey}</div>
                  </th>
                ))}
                <th className="border-b border-slate-200 bg-emerald-50 px-3 py-2 text-left text-[10.5px] font-bold uppercase text-emerald-700">Giá trị chuẩn đề xuất</th>
              </tr>
            </thead>
            <tbody>
              {attrs.map(a => {
                const vals = recs.map(r => r.values[a.name] ?? '')
                const differ = new Set(vals.filter(Boolean).map(v => v.toLowerCase())).size > 1
                const best = vals.find(v => v) ?? '—'
                return (
                  <tr key={a.name} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 font-semibold text-slate-700">{a.label}</td>
                    {vals.map((v, i) => (
                      <td key={i} className={`px-3 py-2 ${differ ? 'bg-amber-50' : ''}`}>
                        <span className="mono text-[11.5px]">{v || <span className="text-slate-300">(rỗng)</span>}</span>
                      </td>
                    ))}
                    <td className="bg-emerald-50 px-3 py-2">
                      <span className="mono text-[11.5px] font-bold text-emerald-700">{best}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Note tone="info" title="Quy tắc chọn giá trị khi hợp nhất">
        {m.survivorship}
      </Note>

      {(dup.status === 'Chưa xem xét' || dup.status === 'Đang xem xét') && (
        <Field label="Ghi chú quyết định" hint="Bắt buộc khi từ chối hợp nhất — để lần sau hệ thống không đề xuất lại cặp này">
          <TextArea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Ví dụ: Hai người khác nhau — trùng tên và ngày sinh là ngẫu nhiên, số căn cước khác hoàn toàn." />
        </Field>
      )}
    </div>
  )
}

/* ═════════ 7.4 Bản ghi chuẩn & Phân phối ═════════ */

export function MdmGolden({ embedded }: { embedded?: boolean } = {}) {
  const [tab, setTab] = useState('golden')
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<any>(null)
  const toast = useToast()

  const rows = useMemo(() => goldenRecords.filter(g => match(`${g.id} ${g.code} ${Object.values(g.values).join(' ')}`, q)), [q])

  return (
    <>
      {!embedded && (
        <PageHeader
          code="7.2"
          title="Bản ghi chuẩn & Phân phối"
          desc="Golden Record — nguồn dữ liệu chuẩn duy nhất, có liên kết ngược tới bản ghi nguồn và lịch sử thay đổi"
          crumbs={[{ label: 'Dữ liệu chủ (MDM)' }, { label: 'Bản ghi chuẩn & Phân phối' }]}
          actions={<ActionButton variant="ghost" icon="run" onClick={() => toast.info('Đang phân phối', 'Đẩy bản ghi chuẩn tới các hệ thống đăng ký — minh hoạ.')}>Phân phối lại</ActionButton>}
        />
      )}

      <KpiRow
        items={[
          { label: 'Bản ghi chuẩn', value: fmt(STATS.mdmGolden), sub: `hiển thị ${goldenRecords.length} bản ghi mẫu`, tone: 'ok' },
          { label: 'Hệ thống đã đồng bộ', value: distributionChannels.filter(d => d.status === 'Đồng bộ').length, sub: `trên ${distributionChannels.length} kênh phân phối`, tone: 'ok' },
          { label: 'Kênh bị lệch', value: distributionChannels.filter(d => d.status !== 'Đồng bộ').length, sub: 'dữ liệu chưa nhất quán', tone: 'bad' },
          { label: 'Bản ghi lệch phiên bản', value: fmt(distributionChannels.reduce((a, d) => a + d.drift, 0)), sub: 'cần đồng bộ lại', tone: 'warn' },
          { label: 'Độ tin cậy trung bình', value: `${Math.round(goldenRecords.reduce((a, g) => a + g.confidence, 0) / goldenRecords.length)}%`, sub: 'điểm hợp nhất', tone: 'ok' },
        ]}
      />

      <div className="mt-4">
        <InlineTabs
          items={[
            { id: 'golden', label: 'Bản ghi chuẩn', badge: goldenRecords.length },
            { id: 'dist', label: 'Kênh phân phối', badge: distributionChannels.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'golden' ? (
        <>
          <FilterBar placeholder="Tìm theo mã chuẩn, giá trị thuộc tính…" value={q} onChange={setQ} right={<span className="text-[12px] text-slate-400">{rows.length} bản ghi</span>} />
          <DataTable
            stt
            rows={rows}
            rowKey={g => g.id}
            onRowClick={g => setPick(g)}
            columns={[
              { key: 'code', label: 'Mã chuẩn', nowrap: true, render: g => <span className="mono text-[12px] font-bold text-blue-700">{g.code}</span> },
              { key: 'modelId', label: 'Mô hình', nowrap: true, render: g => <EntityLink to={`/mdm/models/${g.modelId}`}>{g.modelId}</EntityLink> },
              ...['ho_ten', 'ten_san_pham'].map(k => ({
                key: k, label: k === 'ho_ten' ? 'Tên' : 'Tên sản phẩm', nowrap: true,
                render: (g: any) => <span className="font-semibold">{g.values[k] ?? '—'}</span>,
              })).slice(0, 1),
              { key: 'attrs', label: 'Thuộc tính chính', width: '26%', render: g => <span className="text-[11.5px] text-slate-600">{Object.entries(g.values).slice(1, 4).map(([k, v]) => `${v}`).join(' · ')}</span> },
              { key: 'sources', label: 'Bản ghi nguồn', align: 'center', nowrap: true, render: g => <Chip tone="b">{g.sourceRecordIds.length}</Chip> },
              { key: 'confidence', label: 'Độ tin cậy', align: 'right', nowrap: true, render: g => <span className={g.confidence >= 95 ? 'font-bold text-emerald-600' : 'font-bold text-amber-600'}>{g.confidence}%</span> },
              { key: 'version', label: 'Phiên bản', align: 'center', nowrap: true, render: g => <Chip tone="n">v{g.version}</Chip> },
              { key: 'dist', label: 'Phân phối', nowrap: true, render: g => <div className="flex gap-1">{g.distributedTo.map(d => <Chip key={d.system} tone={d.status === 'Đồng bộ' ? 'g' : d.status === 'Lệch phiên bản' ? 'o' : 'r'} title={d.system}>{d.system.split('—')[0].trim()}</Chip>)}</div> },
              { key: 'updatedAt', label: 'Cập nhật', nowrap: true, render: g => <span className="mono text-[11.5px]">{g.updatedAt}</span> },
              { key: 'act', label: '', align: 'right', nowrap: true, render: g => <RowActions><IconBtn icon="view" title="Chi tiết" onClick={() => setPick(g)} /></RowActions> },
            ]}
          />
        </>
      ) : (
        <>
          <DataTable
            rows={distributionChannels}
            rowKey={d => d.id}
            highlightRow={d => (d.status === 'Lỗi' ? 'bad' : d.status === 'Lệch' ? 'warn' : undefined)}
            columns={[
              { key: 'id', label: 'Mã', nowrap: true, render: d => <span className="mono text-[12px] font-semibold">{d.id}</span> },
              { key: 'modelId', label: 'Mô hình', nowrap: true, render: d => <EntityLink to={`/mdm/models/${d.modelId}`}>{d.modelId}</EntityLink> },
              { key: 'target', label: 'Hệ thống nhận', width: '22%', render: d => <span className="font-semibold text-slate-800">{d.target}</span> },
              { key: 'method', label: 'Phương thức', nowrap: true, render: d => <Chip tone="t">{d.method}</Chip> },
              { key: 'frequency', label: 'Tần suất', nowrap: true },
              { key: 'lastSync', label: 'Đồng bộ lần cuối', nowrap: true, render: d => <span className="mono text-[11.5px]">{d.lastSync}</span> },
              { key: 'recordsSynced', label: 'Bản ghi đã đồng bộ', align: 'right', nowrap: true, render: d => fmt(d.recordsSynced) },
              { key: 'drift', label: 'Lệch', align: 'right', nowrap: true, render: d => (d.drift ? <span className="font-bold text-red-600">{fmt(d.drift)}</span> : '0') },
              { key: 'status', label: 'Trạng thái', nowrap: true, render: d => <Chip tone={d.status === 'Đồng bộ' ? 'g' : d.status === 'Lệch' ? 'o' : 'r'}>{d.status}</Chip> },
              { key: 'act', label: '', align: 'right', nowrap: true, render: d => <RowActions><IconBtn icon="run" title="Đồng bộ ngay" onClick={() => toast.info('Đang đồng bộ', `${d.target} — minh hoạ.`)} /></RowActions> },
            ]}
          />

          <div className="mt-4 grid grid-cols-2 gap-4">
            <Note tone="bad" title="PP-04 lỗi — CRM cũ không nhận dữ liệu chuẩn">
              Hệ thống <b>HT-10 CRM cũ</b> đã ngừng sử dụng nhưng vẫn còn <b>{fmt(1_284_500)}</b> bản ghi lệch.
              Cần quyết định: ngừng phân phối và đóng kênh, hay đồng bộ một lần cuối trước khi tắt hệ thống.
            </Note>
            <Note tone="warn" title="PP-03 lệch 36.380 bản ghi">
              Hệ thống quản lý rủi ro đồng bộ theo lô hằng ngày nhưng lần cuối là <b>15/07</b> — đã 25 ngày.
              Nghĩa là chấm điểm rủi ro đang chạy trên dữ liệu khách hàng cũ.
            </Note>
          </div>
        </>
      )}

      <Modal open={!!pick} onClose={() => setPick(null)} size="lg" title={pick && `Bản ghi chuẩn ${pick.code}`} desc={pick && `${pick.id} · phiên bản v${pick.version} · độ tin cậy ${pick.confidence}%`} footer={<ActionButton variant="ghost" onClick={() => setPick(null)}>Đóng</ActionButton>}>
        {pick && (
          <div className="space-y-4">
            <div>
              <SectionTitle>Giá trị chuẩn</SectionTitle>
              <InfoGrid
                items={Object.entries(pick.values).map(([k, v]) => {
                  const at = mdmModelById(pick.modelId)?.attributes.find(a => a.name === k)
                  return { label: at?.label ?? k, value: <span className="mono text-[12.5px]">{v as string}</span> }
                })}
              />
            </div>

            <div>
              <SectionTitle>Bản ghi nguồn đã hợp nhất ({pick.sourceRecordIds.length})</SectionTitle>
              <DataTable
                dense
                rows={pick.sourceRecordIds.map((r: string) => sourceRecordById(r)).filter(Boolean)}
                rowKey={(r: any) => r.id}
                columns={[
                  { key: 'id', label: 'Mã bản ghi', nowrap: true, render: (r: any) => <span className="mono text-[11.5px]">{r.id}</span> },
                  { key: 'sourceSystem', label: 'Hệ thống nguồn', nowrap: true, render: (r: any) => systemById(r.sourceSystem)?.name ?? r.sourceSystem },
                  { key: 'sourceKey', label: 'Mã gốc', nowrap: true, render: (r: any) => <span className="mono text-[11.5px]">{r.sourceKey}</span> },
                  { key: 'matchScore', label: 'Điểm khớp', align: 'right', nowrap: true, render: (r: any) => (r.matchScore ? `${r.matchScore}%` : '—') },
                  { key: 'loadedAt', label: 'Nạp lúc', nowrap: true },
                ]}
              />
            </div>

            <div>
              <SectionTitle>Phân phối tới hệ thống</SectionTitle>
              <DataTable
                dense
                rows={pick.distributedTo}
                rowKey={(d: any) => d.system}
                columns={[
                  { key: 'system', label: 'Hệ thống' },
                  { key: 'at', label: 'Thời điểm', nowrap: true, render: (d: any) => <span className="mono text-[11.5px]">{d.at}</span> },
                  { key: 'status', label: 'Trạng thái', nowrap: true, render: (d: any) => <Chip tone={d.status === 'Đồng bộ' ? 'g' : d.status === 'Lệch phiên bản' ? 'o' : 'r'}>{d.status}</Chip> },
                ]}
              />
            </div>

            <div>
              <SectionTitle>Lịch sử thay đổi</SectionTitle>
              <Timeline
                items={pick.history.map((h: any) => ({
                  time: h.at, who: h.by, title: h.field === '—' ? h.after : `Thay đổi ${h.field}`,
                  text: h.field === '—' ? undefined : `${h.before} → ${h.after}`,
                  tone: 'b' as const,
                }))}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}


/**
 * Menu 7.2 — Dữ liệu chủ.
 * Gộp ba menu cũ 7.2 Bản ghi nguồn · 7.3 Nghi ngờ trùng · 7.4 Bản ghi chuẩn thành ba tab:
 * đây là BA TRẠNG THÁI của cùng một bản ghi, đi một chiều nguồn → nghi ngờ → chuẩn.
 */
export function MdmRecords() {
  const { pathname } = useLocation()
  const tab = pathname.endsWith('/duplicates') ? 'duplicates'
    : pathname.endsWith('/golden') ? 'golden'
    : 'sources'

  const nSources = mdmSourceRecords.length
  const nDup = mdmDuplicates.filter(d => d.status === 'Chưa xem xét' || d.status === 'Đang xem xét').length
  const nGolden = goldenRecords.length

  const step = (id: string, no: string, label: string, count: number, to: string) => {
    const active = tab === id
    const done = (id === 'sources' && tab !== 'sources') || (id === 'duplicates' && tab === 'golden')
    return (
      <Link
        key={id}
        to={to}
        className={
          'flex flex-1 items-center gap-2.5 rounded-lg border px-3.5 py-2.5 transition-colors ' +
          (active
            ? 'border-blue-300 bg-blue-50'
            : done
              ? 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50'
              : 'border-slate-200 bg-white hover:bg-slate-50')
        }
      >
        <span
          className={
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ' +
            (active ? 'bg-blue-600 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500')
          }
        >
          {done ? '✓' : no}
        </span>
        <span className="min-w-0">
          <span className={'block truncate text-[12.5px] ' + (active ? 'font-bold text-slate-900' : 'text-slate-600')}>
            {label}
          </span>
          <span className="block text-[11px] text-slate-400">{fmt(count)} bản ghi</span>
        </span>
      </Link>
    )
  }

  return (
    <>
      <PageHeader
        code="7.2"
        title="Dữ liệu chủ"
        desc="Ba bước của một dây chuyền — gom bản ghi từ các hệ thống nguồn, tìm bản trùng, chốt bản ghi chuẩn duy nhất"
        crumbs={[{ label: 'Dữ liệu chủ (MDM)' }, { label: 'Dữ liệu chủ' }]}
        actions={<ActionButton variant="ghost" icon="export">Xuất danh sách</ActionButton>}
      />

      <div className="mb-4 flex items-center gap-2">
        {step('sources', '1', 'Bản ghi nguồn', nSources, '/mdm/records')}
        <span className="text-slate-300">→</span>
        {step('duplicates', '2', 'Nghi ngờ trùng', nDup, '/mdm/records/duplicates')}
        <span className="text-slate-300">→</span>
        {step('golden', '3', 'Bản ghi chuẩn', nGolden, '/mdm/records/golden')}
      </div>

      {tab === 'sources' && <MdmSources embedded />}
      {tab === 'duplicates' && <MdmDuplicates embedded />}
      {tab === 'golden' && <MdmGolden embedded />}
    </>
  )
}
