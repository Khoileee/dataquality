import { useMemo, useState } from 'react'
import {
  PageHeader, KpiRow, FilterBar, DataTable, CellTitle, Panel, Note, Chip, StatusChip,
  ActionButton, IconBtn, RowActions, EntityLink, InfoGrid, EmptyState, Steps, Modal, useToast,
  Field, TextInput, TextArea, SelectInput, Toggle, OptionCards, SectionTitle, FlowDiagram,
} from '@/components/common'
import { ingestTemplates, ingestById, quarantine, QUARANTINE_ACTIONS, tables, channels, ruleTypes, STATS, fmt, pipelineTasks, RUN_QUALITY_COMBOS, jobs } from '@/data'
import { match, useDemoSave } from '@/lib/demo'
import { DATA_FORMATS, INGEST_KINDS, usersByRole } from '@/data/enums'

/* ═════════ 4.2 Cửa nạp dữ liệu ═════════ */

export function TemplateList() {
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('')
  const rows = useMemo(() => ingestTemplates.filter(t => (!kind || t.kind === kind) && match(`${t.id} ${t.name} ${t.source} ${t.targetTable}`, q)), [q, kind])

  return (
    <>
      <PageHeader
        code="4.2"
        title="Cửa nạp dữ liệu"
        desc="Gom mọi đường dữ liệu vào một chỗ, cùng một khuôn khai báo — có cổng chất lượng chặn dữ liệu xấu ngay tại cửa"
        crumbs={[{ label: 'Nạp & Điều phối' }, { label: 'Cửa nạp dữ liệu' }]}
        actions={
          <>
            <ActionButton variant="ghost" to="/ingestion/quarantine">Vùng chờ ({quarantine.filter(q => q.status === 'Đang giữ').length})</ActionButton>
            <ActionButton icon="plus" to="/ingestion/templates/create">Tạo mẫu nạp</ActionButton>
          </>
        }
      />

      <KpiRow
        items={[
          { label: 'Số mẫu nạp', value: STATS.ingestTemplates, sub: `${ingestTemplates.length} mẫu đã khai chi tiết` },
          { label: 'Có cổng chất lượng', value: `${ingestTemplates.filter(t => t.qualityGate).length}/${ingestTemplates.length}`, sub: `toàn hệ thống ${STATS.ingestWithGate}/${STATS.ingestTemplates}`, tone: 'bad' },
          { label: 'Lô đang giữ ở vùng chờ', value: quarantine.filter(q => q.status === 'Đang giữ').length, sub: 'chờ người quyết định', tone: 'warn' },
          { label: 'Nạp lỗi gần nhất', value: ingestTemplates.filter(t => t.lastResult !== 'Thành công').length, sub: 'trong số mẫu đã khai', tone: 'bad' },
          { label: 'Loại cửa nạp', value: 6, sub: 'gộp từ 6 màn SQLWF cũ' },
        ]}
      />

      <div className="mt-4">
        <FilterBar
          placeholder="Tìm theo mã mẫu, tên, nguồn, bảng đích…"
          value={q}
          onChange={setQ}
          filters={[{ label: 'Loại cửa nạp', options: ['SFTP đối tác', 'Tải file thủ công', 'Đồng bộ CSDL', 'Kafka', 'API', 'Di trú dữ liệu'], value: kind, onChange: setKind }]}
          right={<span className="text-[12px] text-slate-400">{rows.length} mẫu nạp</span>}
        />
      </div>

      <DataTable
        stt
        rows={rows}
        rowKey={t => t.id}
        highlightRow={t => (t.lastResult === 'Thất bại' ? 'bad' : t.lastResult === 'Giữ ở vùng chờ' ? 'warn' : undefined)}
        columns={[
          { key: 'id', label: 'Mã mẫu', nowrap: true, render: t => <EntityLink to={`/ingestion/templates/${t.id}`}>{t.id}</EntityLink> },
          { key: 'name', label: 'Tên mẫu nạp', width: '18%', render: t => <CellTitle title={t.name} sub={t.source} /> },
          { key: 'kind', label: 'Loại cửa nạp', nowrap: true, render: t => <Chip tone="t">{t.kind}</Chip> },
          { key: 'targetTable', label: 'Bảng đích', nowrap: true, render: t => (t.targetTable === '—' ? <span className="text-slate-400">— gửi ra ngoài</span> : <EntityLink to={`/catalog/tables/${encodeURIComponent(t.targetTable)}`}>{t.targetTable}</EntityLink>) },
          { key: 'format', label: 'Định dạng', width: '13%', render: t => <span className="text-[11.5px]">{t.format}</span> },
          { key: 'schedule', label: 'Lịch', nowrap: true },
          {
            key: 'gate', label: 'Cổng chất lượng', nowrap: true,
            render: t => (t.qualityGate
              ? <div><Chip tone="g">Bật · {t.gateRules} luật</Chip><div className="mt-0.5 text-[10.5px] text-slate-400">{t.gateMode}</div></div>
              : <Chip tone="r">Chưa bật</Chip>),
          },
          { key: 'lastLoad', label: 'Lần nạp gần nhất', nowrap: true, render: t => <span className="mono text-[11.5px]">{t.lastLoad}</span> },
          { key: 'lastResult', label: 'Kết quả', nowrap: true, render: t => <Chip tone={t.lastResult === 'Thành công' ? 'g' : t.lastResult === 'Thất bại' ? 'r' : 'o'}>{t.lastResult}</Chip> },
          { key: 'legacyScreen', label: 'Màn SQLWF cũ', nowrap: true, render: t => <span className="mono text-[10.5px] text-slate-400">{t.legacyScreen}</span> },
          { key: 'owner', label: 'Phụ trách', nowrap: true },
          { key: 'act', label: '', align: 'right', nowrap: true, render: t => <RowActions><IconBtn icon="open" title="Chi tiết" to={`/ingestion/templates/${t.id}`} /><IconBtn icon="edit" title="Sửa" to={`/ingestion/templates/create?id=${t.id}`} /></RowActions> },
        ]}
      />

      <Panel title="Sáu màn SQLWF cũ được gộp về một menu" className="mt-4">
        <DataTable
          dense
          rows={[
            { old: 'import-data', what: 'Tải file thủ công có quản lý mẫu', now: 'Loại cửa nạp: Tải file thủ công' },
            { old: 'sync-management', what: 'Đồng bộ MariaDB / MongoDB / OracleDB có duyệt', now: 'Loại cửa nạp: Đồng bộ CSDL' },
            { old: 'invoice-uploader', what: 'Tải hoá đơn theo nghiệp vụ riêng', now: 'Loại cửa nạp: Tải file thủ công + mẫu riêng' },
            { old: 'data-migration-management', what: 'Di trú dữ liệu một lần', now: 'Loại cửa nạp: Di trú dữ liệu' },
            { old: 'fsync', what: 'Đồng bộ file giữa hệ thống', now: 'Loại cửa nạp: API / File Share' },
            { old: 'clean-delivery', what: 'Giao dữ liệu sạch cho đối tác', now: 'Loại cửa nạp: SFTP đối tác — chiều gửi đi' },
          ]}
          columns={[
            { key: 'old', label: 'Màn cũ', nowrap: true, render: r => <span className="mono text-[11.5px] text-slate-500">{r.old}</span> },
            { key: 'what', label: 'Làm gì' },
            { key: 'now', label: 'Về đâu trong DMP', render: r => <span className="font-semibold text-blue-700">{r.now}</span> },
          ]}
        />
        <Note tone="info" title="Gộp nhưng không ép" className="mt-3">
          Sáu màn có nghiệp vụ khác nhau, nên <b>loại cửa nạp</b> được thiết kế như một trường phân loại có cấu hình riêng theo loại —
          không ép mọi thứ vào một khuôn cứng.
        </Note>
      </Panel>
    </>
  )
}

export function TemplateDetail() {
  const id = window.location.pathname.split('/').pop() ?? ''
  const t = ingestById(id)
  if (!t) return <EmptyState text="Không tìm thấy mẫu nạp" action={<ActionButton to="/ingestion/templates">Về danh sách</ActionButton>} />

  const batches = quarantine.filter(q => q.templateId === t.id)
  const ch = channels.find(c => t.source.includes(c.id))

  return (
    <>
      <PageHeader
        code="4.2"
        title={t.name}
        desc={`${t.id} · ${t.kind} · nạp vào ${t.targetTable}`}
        crumbs={[{ label: 'Nạp & Điều phối' }, { label: 'Cửa nạp dữ liệu', href: '/ingestion/templates' }, { label: t.id }]}
        actions={
          <>
            <Chip tone="t">{t.kind}</Chip>
            <Chip tone={t.qualityGate ? 'g' : 'r'}>{t.qualityGate ? `Cổng chất lượng: ${t.gateMode}` : 'Chưa có cổng chất lượng'}</Chip>
            <ActionButton variant="ghost" icon="edit" to={`/ingestion/templates/create?id=${t.id}`}>Sửa</ActionButton>
          </>
        }
      />

      <Panel title="Đường đi của lô dữ liệu" className="mb-4">
        <FlowDiagram
          width={880}
          height={120}
          nodes={[
            { id: 'src', x: 20, y: 30, w: 200, h: 60, title: t.source.split('·')[0].trim(), sub: t.kind, tone: 'source', to: ch ? `/catalog/channels/${ch.id}` : undefined },
            { id: 'gate', x: 300, y: 30, w: 180, h: 60, title: 'Cổng chất lượng', sub: t.qualityGate ? `${t.gateRules} luật · ${t.gateMode}` : 'Chưa bật — dữ liệu vào thẳng', tone: t.qualityGate ? 'ok' : 'bad', badge: t.qualityGate ? { text: 'BẬT', tone: 'g' } : { text: 'TẮT', tone: 'r' } },
            { id: 'hold', x: 560, y: 0, w: 170, h: 52, title: 'Vùng chờ', sub: `${batches.filter(b => b.status === 'Đang giữ').length} lô đang giữ`, tone: 'warn', to: '/ingestion/quarantine' },
            { id: 'tgt', x: 560, y: 68, w: 170, h: 52, title: t.targetTable, sub: 'Bảng đích', tone: 'target', to: t.targetTable !== '—' ? `/catalog/tables/${encodeURIComponent(t.targetTable)}` : undefined },
          ]}
          edges={[
            { from: 'src', to: 'gate', label: t.schedule },
            { from: 'gate', to: 'hold', tone: 'warn', dashed: true, label: 'dòng lỗi' },
            { from: 'gate', to: 'tgt', tone: 'ok', label: 'dòng đạt' },
          ]}
        />
      </Panel>

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4">
          <Panel title="Thông tin mẫu nạp">
            <InfoGrid
              items={[
                { label: 'Mã mẫu', value: <span className="mono">{t.id}</span> },
                { label: 'Loại cửa nạp', value: t.kind },
                { label: 'Nguồn dữ liệu', value: t.source, full: true },
                { label: 'Bảng đích', value: t.targetTable },
                { label: 'Định dạng', value: t.format },
                { label: 'Lịch nạp', value: t.schedule },
                { label: 'Người phụ trách', value: t.owner },
                { label: 'Trạng thái', value: <StatusChip value={t.status} /> },
                { label: 'Lần nạp gần nhất', value: `${t.lastLoad} — ${t.lastResult}` },
                { label: 'Màn SQLWF cũ tương ứng', value: <span className="mono">{t.legacyScreen}</span> },
              ]}
            />
          </Panel>

          <Panel title="Lịch sử nạp">
            <DataTable
              dense
              rows={batches.length ? batches : [{ id: '—', arrivedAt: t.lastLoad, totalRows: 0, heldRows: 0, status: t.lastResult, reason: 'Không có lô nào bị giữ' } as any]}
              rowKey={(b: any) => b.id}
              columns={[
                { key: 'id', label: 'Mã lô', nowrap: true, render: (b: any) => <span className="mono text-[11.5px] font-semibold">{b.id}</span> },
                { key: 'arrivedAt', label: 'Thời điểm', nowrap: true, render: (b: any) => <span className="mono text-[11.5px]">{b.arrivedAt}</span> },
                { key: 'totalRows', label: 'Tổng dòng', align: 'right', nowrap: true, render: (b: any) => fmt(b.totalRows) },
                { key: 'heldRows', label: 'Dòng bị giữ', align: 'right', nowrap: true, render: (b: any) => (b.heldRows ? <span className="font-semibold text-red-600">{fmt(b.heldRows)}</span> : '0') },
                { key: 'reason', label: 'Lý do' },
                { key: 'status', label: 'Trạng thái', nowrap: true, render: (b: any) => <Chip tone={b.status === 'Đang giữ' ? 'o' : b.status === 'Đã loại bỏ' ? 'r' : 'g'}>{b.status}</Chip> },
              ]}
            />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Cổng chất lượng tại cửa nạp" tone={t.qualityGate ? 'ok' : 'bad'}>
            {t.qualityGate ? (
              <>
                <InfoGrid
                  cols={1}
                  items={[
                    { label: 'Số luật kiểm tại cửa', value: `${t.gateRules} luật` },
                    { label: 'Mức xử lý khi vi phạm', value: <Chip tone="o">{t.gateMode}</Chip> },
                  ]}
                />
                <DataTable
                  dense
                  rows={[
                    { rule: 'Số dòng trong ngưỡng', param: '10 tr – 15 tr dòng', action: 'Chặn cả lô' },
                    { rule: 'Đúng định dạng số điện thoại', param: '^(84|0)(3|5|7|8|9)[0-9]{8}$', action: 'Tách dòng lỗi' },
                    { rule: 'Không trùng mã giao dịch', param: 'ma_giao_dich', action: 'Tách dòng lỗi' },
                    { rule: 'Nằm trong khoảng giá trị', param: 'so_tien: 1.000 – 5 tỷ', action: 'Chỉ cảnh báo' },
                  ]}
                  columns={[
                    { key: 'rule', label: 'Luật kiểm', render: r => <span className="text-[11.5px] font-semibold">{r.rule}</span> },
                    { key: 'param', label: 'Tham số', render: r => <span className="mono text-[10.5px]">{r.param}</span> },
                    { key: 'action', label: 'Xử lý', nowrap: true, render: r => <Chip tone={r.action === 'Chặn cả lô' ? 'r' : r.action === 'Tách dòng lỗi' ? 'o' : 'n'}>{r.action}</Chip> },
                  ]}
                />
              </>
            ) : (
              <Note tone="bad" title="Chưa bật cổng chất lượng">
                Dữ liệu từ nguồn này vào thẳng bảng đích mà <b>không qua bất kỳ kiểm tra nào</b>.
                Lỗi chỉ được phát hiện sau khi đã nằm trong kho và có thể đã lan sang báo cáo.
              </Note>
            )}
          </Panel>

          <Note tone="info" title="Ba mức xử lý khi dữ liệu vi phạm">
            <b>Chặn cả lô</b> — không nạp gì cả, yêu cầu nguồn gửi lại. Dùng cho lỗi cấu trúc.<br />
            <b>Tách dòng lỗi</b> — nạp dòng đạt, giữ riêng dòng lỗi ở vùng chờ. Dùng cho lỗi giá trị.<br />
            <b>Chỉ cảnh báo</b> — vẫn nạp hết, gửi thông báo. Dùng khi chưa chắc luật đúng.
          </Note>
        </div>
      </div>
    </>
  )
}

export function TemplateCreate() {
  const save = useDemoSave('/ingestion/templates')
  const [step, setStep] = useState(3)
  const [f, setF] = useState({ name: '', kind: 'SFTP đối tác', source: '', target: '', format: 'CSV', schedule: 'Hằng ngày 05:30' })
  const [gate, setGate] = useState(true)
  const [gateMode, setGateMode] = useState('Tách dòng lỗi')
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }))
  const ok = f.name && f.source && f.target

  const STEP_LABELS = ['Loại cửa nạp', 'Nguồn dữ liệu', 'Bảng đích & Ánh xạ', 'Cổng chất lượng', 'Lịch nạp']

  return (
    <>
      <PageHeader
        code="4.2"
        title="Tạo mẫu nạp dữ liệu"
        desc="Khai một lần, mọi lô dữ liệu từ nguồn này đều đi qua cùng một khuôn kiểm tra"
        crumbs={[{ label: 'Nạp & Điều phối' }, { label: 'Cửa nạp dữ liệu', href: '/ingestion/templates' }, { label: 'Tạo mẫu nạp' }]}
      />
      <Steps items={STEP_LABELS} current={step} onJump={setStep} />

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title={STEP_LABELS[step]}>
          {step === 0 && (
            <Field label="Loại cửa nạp" required>
              <OptionCards
                cols={2}
                value={f.kind}
                onChange={v => setF(p => ({ ...p, kind: v }))}
                options={[
                  { id: 'SFTP đối tác', label: 'SFTP đối tác', desc: 'Nhận file định kỳ từ đối tác bên ngoài' },
                  { id: 'Tải file thủ công', label: 'Tải file thủ công', desc: 'Người dùng tải file lên qua giao diện' },
                  { id: 'Đồng bộ CSDL', label: 'Đồng bộ CSDL', desc: 'Kết nối trực tiếp cơ sở dữ liệu nguồn' },
                  { id: 'Kafka', label: 'Kafka', desc: 'Nhận sự kiện theo thời gian thực' },
                  { id: 'API', label: 'API', desc: 'Gọi giao diện lập trình ứng dụng để lấy dữ liệu' },
                  { id: 'Di trú dữ liệu', label: 'Di trú dữ liệu', desc: 'Chuyển dữ liệu một lần từ hệ thống cũ' },
                ]}
              />
            </Field>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tên mẫu nạp" required full><TextInput value={f.name} onChange={set('name')} placeholder="File đối soát đối tác A" /></Field>
              <Field label="Kênh trao đổi dữ liệu" required full hint="Chọn kênh đã khai ở menu 1.2 để lineage nối được từ nguồn">
                <SelectInput value={f.source} onChange={set('source')}>
                  <option value="">— Chọn kênh —</option>
                  {channels.map(c => <option key={c.id} value={c.id}>{c.id} — {c.name}</option>)}
                </SelectInput>
              </Field>
              <Field label="Định dạng dữ liệu" required>
                <SelectInput value={f.format} onChange={set('format')}>{DATA_FORMATS.map(x => <option key={x}>{x}</option>)}</SelectInput>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Bảng đích" required hint="Chỉ chọn được bảng đã có trong danh mục (ràng buộc RB2)">
                <SelectInput value={f.target} onChange={set('target')}>
                  <option value="">— Chọn bảng —</option>
                  {tables.map(t => <option key={t.id} value={t.id}>{t.id} — {t.name}</option>)}
                </SelectInput>
              </Field>
              <SectionTitle>Ánh xạ cột nguồn → cột đích</SectionTitle>
              <DataTable
                dense
                rows={[
                  { src: 'txn_id', dst: 'ma_giao_dich', type: 'string', req: true },
                  { src: 'txn_date', dst: 'ngay_giao_dich', type: 'date', req: true },
                  { src: 'msisdn', dst: 'so_dien_thoai', type: 'string', req: false },
                  { src: 'amount', dst: 'so_tien', type: 'decimal(18,2)', req: true },
                  { src: 'partner_code', dst: 'ma_doi_tac', type: 'string', req: true },
                ]}
                columns={[
                  { key: 'src', label: 'Cột trong file nguồn', render: r => <span className="mono text-[11.5px]">{r.src}</span> },
                  { key: 'dst', label: 'Cột bảng đích', render: r => <span className="mono text-[11.5px] font-semibold text-blue-700">{r.dst}</span> },
                  { key: 'type', label: 'Kiểu dữ liệu', nowrap: true, render: r => <Chip tone="n">{r.type}</Chip> },
                  { key: 'req', label: 'Bắt buộc', align: 'center', nowrap: true, render: r => (r.req ? <Chip tone="r">Có</Chip> : '—') },
                ]}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Toggle checked={gate} onChange={setGate} label="Bật cổng chất lượng tại cửa nạp" hint="Kiểm dữ liệu trước khi cho vào bảng đích — chặn được lỗi từ gốc thay vì phát hiện sau" />
              {gate && (
                <>
                  <Field label="Mức xử lý mặc định khi vi phạm" info="ingest.gateMode" required>
                    <OptionCards
                      cols={3}
                      value={gateMode}
                      onChange={setGateMode}
                      options={[
                        { id: 'Chặn cả lô', label: 'Chặn cả lô', desc: 'Không nạp gì, yêu cầu nguồn gửi lại. Dùng cho lỗi cấu trúc.' },
                        { id: 'Tách dòng lỗi', label: 'Tách dòng lỗi', desc: 'Nạp dòng đạt, giữ riêng dòng lỗi. Dùng cho lỗi giá trị.' },
                        { id: 'Chỉ cảnh báo', label: 'Chỉ cảnh báo', desc: 'Vẫn nạp hết, gửi thông báo. Dùng khi chưa chắc luật đúng.' },
                      ]}
                    />
                  </Field>
                  <SectionTitle right={<ActionButton variant="ghost" icon="plus">Thêm luật</ActionButton>}>Luật kiểm tại cửa</SectionTitle>
                  <DataTable
                    dense
                    rows={[
                      { rule: 'Số dòng trong ngưỡng', param: '10 tr – 15 tr dòng', action: 'Chặn cả lô' },
                      { rule: 'Đúng định dạng (biểu thức)', param: 'so_dien_thoai', action: 'Tách dòng lỗi' },
                      { rule: 'Không trùng theo một cột', param: 'ma_giao_dich', action: 'Tách dòng lỗi' },
                      { rule: 'Nằm trong khoảng giá trị', param: 'so_tien: 1.000 – 5 tỷ', action: 'Chỉ cảnh báo' },
                    ]}
                    columns={[
                      { key: 'rule', label: 'Loại kiểm tra', render: r => <span className="font-semibold">{r.rule}</span> },
                      { key: 'param', label: 'Tham số', render: r => <span className="mono text-[11px]">{r.param}</span> },
                      { key: 'action', label: 'Mức xử lý', nowrap: true, render: r => <Chip tone={r.action === 'Chặn cả lô' ? 'r' : r.action === 'Tách dòng lỗi' ? 'o' : 'n'}>{r.action}</Chip> },
                      { key: 'act', label: '', align: 'right', nowrap: true, render: () => <RowActions><IconBtn icon="edit" title="Sửa" /><IconBtn icon="delete" title="Xoá" tone="danger" /></RowActions> },
                    ]}
                  />
                  <Note tone="ok" title="Đây là tính năng vượt yêu cầu BDA">
                    BDA yêu cầu <i>"phát hiện sớm lỗi dữ liệu"</i>. Cổng chất lượng làm được hơn thế: <b>chặn trước khi dữ liệu xấu vào kho</b>.
                    Toàn hệ thống hiện có <b>{STATS.ingestWithGate}/{STATS.ingestTemplates}</b> mẫu nạp bật cổng — đây là dư địa cải thiện lớn nhất.
                  </Note>
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Lịch nạp" required>
                <SelectInput value={f.schedule} onChange={set('schedule')}>
                  {['Liên tục', 'Mỗi giờ', 'Hằng ngày 05:30', 'Hằng ngày 02:00', 'Thứ hai hằng tuần', 'Ngày 05 hằng tháng', 'Một lần'].map(s => <option key={s}>{s}</option>)}
                </SelectInput>
              </Field>
              <Field label="Người phụ trách" required>
                <SelectInput>{usersByRole().map(u => <option key={u.value} value={u.value}>{u.label}</option>)}</SelectInput>
              </Field>
            </div>
          )}
        </Panel>

        <Panel title="Tóm tắt mẫu nạp">
          <InfoGrid
            cols={1}
            items={[
              { label: 'Tên mẫu', value: f.name || '—' },
              { label: 'Loại cửa nạp', value: f.kind },
              { label: 'Nguồn', value: f.source || '—' },
              { label: 'Bảng đích', value: <span className="mono">{f.target || '—'}</span> },
              { label: 'Định dạng', value: f.format },
              { label: 'Lịch nạp', value: f.schedule },
              { label: 'Cổng chất lượng', value: gate ? <Chip tone="g">{gateMode}</Chip> : <Chip tone="r">Chưa bật</Chip> },
            ]}
          />
        </Panel>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/ingestion/templates">Huỷ</ActionButton>
        <div className="flex gap-2">
          {step > 0 && <ActionButton variant="ghost" onClick={() => setStep(s => s - 1)}>Quay lại</ActionButton>}
          {step < 4
            ? <ActionButton onClick={() => setStep(s => s + 1)}>Tiếp tục</ActionButton>
            : <ActionButton disabled={!ok} onClick={() => save('Đã tạo mẫu nạp')}>Lưu mẫu nạp</ActionButton>}
        </div>
      </div>
    </>
  )
}

/* ═════════ 4.2 Vùng chờ ═════════ */

export function Quarantine() {
  const [pick, setPick] = useState<any>(null)
  const [act, setAct] = useState<any>(null)
  const [reason, setReason] = useState('')
  const toast = useToast()

  return (
    <>
      <PageHeader
        code="4.2"
        title="Vùng chờ dữ liệu"
        desc="Lô dữ liệu bị cổng chất lượng giữ lại — người phụ trách quyết định cho qua, tách dòng lỗi, loại bỏ hay nạp lại"
        crumbs={[{ label: 'Nạp & Điều phối' }, { label: 'Cửa nạp dữ liệu', href: '/ingestion/templates' }, { label: 'Vùng chờ' }]}
      />

      <KpiRow
        items={[
          { label: 'Lô đang giữ', value: quarantine.filter(q => q.status === 'Đang giữ').length, sub: 'chờ người quyết định', tone: 'bad' },
          { label: 'Dòng đang bị giữ', value: fmt(quarantine.filter(q => q.status === 'Đang giữ').reduce((a, q) => a + q.heldRows, 0)), sub: 'chưa vào bảng đích', tone: 'warn' },
          { label: 'Đã cho qua', value: quarantine.filter(q => q.status === 'Đã cho qua').length, sub: 'có ghi lý do' },
          { label: 'Đã loại bỏ', value: quarantine.filter(q => q.status === 'Đã loại bỏ').length, sub: 'yêu cầu nguồn gửi lại' },
          { label: 'Sự cố liên quan', value: new Set(quarantine.map(q => q.incidentId).filter(Boolean)).size, sub: 'đã tạo phiếu xử lý' },
        ]}
      />

      <div className="mt-4">
        <DataTable
          rows={quarantine}
          rowKey={b => b.id}
          highlightRow={b => (b.status === 'Đang giữ' ? 'bad' : undefined)}
          columns={[
            { key: 'id', label: 'Mã lô', nowrap: true, render: b => <span className="mono text-[12px] font-semibold">{b.id}</span> },
            { key: 'templateId', label: 'Đến từ mẫu nạp', nowrap: true, render: b => <EntityLink to={`/ingestion/templates/${b.templateId}`}>{b.templateId}</EntityLink> },
            { key: 'arrivedAt', label: 'Thời điểm', nowrap: true, render: b => <span className="mono text-[11.5px]">{b.arrivedAt}</span> },
            { key: 'blockLevel', label: 'Mức chặn', nowrap: true, render: b => <Chip tone={b.blockLevel === 'Chặn cả lô' ? 'r' : b.blockLevel === 'Tách dòng lỗi' ? 'o' : 'n'}>{b.blockLevel}</Chip> },
            { key: 'reason', label: 'Vì sao bị giữ', width: '24%' },
            { key: 'heldRows', label: 'Dòng bị giữ', align: 'right', nowrap: true, render: b => <span className="font-semibold text-red-600">{fmt(b.heldRows)}</span> },
            { key: 'totalRows', label: 'Tổng dòng', align: 'right', nowrap: true, render: b => fmt(b.totalRows) },
            { key: 'incidentId', label: 'Sự cố', nowrap: true, render: b => (b.incidentId ? <EntityLink to={`/quality/incidents/${b.incidentId}`}>{b.incidentId}</EntityLink> : '—') },
            { key: 'status', label: 'Trạng thái', nowrap: true, render: b => <Chip tone={b.status === 'Đang giữ' ? 'o' : b.status === 'Đã loại bỏ' ? 'r' : 'g'}>{b.status}</Chip> },
            { key: 'act', label: '', align: 'right', nowrap: true, render: b => <RowActions><ActionButton variant="ghost" onClick={() => setPick(b)}>Xem & xử lý</ActionButton></RowActions> },
          ]}
        />
      </div>

      <Panel title="Bốn hành động trên một lô" className="mt-4">
        <div className="grid grid-cols-4 gap-3">
          {QUARANTINE_ACTIONS.map(a => (
            <div key={a.id} className="rounded-lg border border-slate-200 px-3 py-2.5">
              <div className="text-[13px] font-bold text-slate-800">{a.label}</div>
              <div className="mt-1 text-[11.5px] leading-snug text-slate-500">{a.desc}</div>
              {a.needReason && <Chip tone="o" className="mt-2">Bắt buộc điền lý do</Chip>}
            </div>
          ))}
        </div>
      </Panel>

      <Modal
        open={!!pick}
        onClose={() => { setPick(null); setAct(null); setReason('') }}
        size="lg"
        title={pick && `Lô ${pick.id}`}
        desc={pick && `${pick.reason} · ${fmt(pick.heldRows)} / ${fmt(pick.totalRows)} dòng bị giữ`}
        footer={
          pick?.status === 'Đang giữ' ? (
            <div className="flex w-full items-center justify-between">
              <div className="flex gap-2">
                {QUARANTINE_ACTIONS.map(a => (
                  <ActionButton key={a.id} variant={act?.id === a.id ? 'primary' : 'ghost'} onClick={() => setAct(a)}>{a.label}</ActionButton>
                ))}
              </div>
              <ActionButton
                disabled={!act || (act.needReason && reason.trim().length < 20)}
                onClick={() => { toast.success(`Đã ${act.label.replace(/[✔✕⇄↻] /, '').toLowerCase()}`, `Lô ${pick.id} — bản demo không ghi dữ liệu.`); setPick(null); setAct(null); setReason('') }}
              >
                Xác nhận
              </ActionButton>
            </div>
          ) : <ActionButton variant="ghost" onClick={() => setPick(null)}>Đóng</ActionButton>
        }
      >
        {pick && (
          <div className="space-y-4">
            <InfoGrid
              items={[
                { label: 'Mã lô', value: <span className="mono">{pick.id}</span> },
                { label: 'Mẫu nạp', value: pick.templateId },
                { label: 'Thời điểm đến', value: pick.arrivedAt },
                { label: 'Mức chặn', value: <Chip tone={pick.blockLevel === 'Chặn cả lô' ? 'r' : 'o'}>{pick.blockLevel}</Chip> },
                { label: 'Dòng bị giữ', value: `${fmt(pick.heldRows)} / ${fmt(pick.totalRows)}` },
                { label: 'Sự cố liên quan', value: pick.incidentId ?? '— chưa tạo' },
                { label: 'Lý do bị giữ', value: pick.reason, full: true },
              ]}
            />

            {!!pick.sampleRows.length && (
              <div>
                <SectionTitle>Dòng lỗi mẫu</SectionTitle>
                <DataTable
                  dense
                  rows={pick.sampleRows}
                  columns={Object.keys(pick.sampleRows[0]).map((k: string) => ({
                    key: k,
                    label: <span className="mono">{k}</span>,
                    render: (row: any) => <span className={k === 'loi' || k === 'ghi_chu' ? 'text-[11.5px] font-semibold text-red-600' : 'mono text-[11.5px]'}>{row[k]}</span>,
                  }))}
                />
              </div>
            )}

            {act?.needReason && (
              <Field
                label={`Lý do ${act.label.toLowerCase()}`}
                required
                hint={`Tối thiểu 20 ký tự — hiện ${reason.trim().length}. Lý do được ghi vào nhật ký kiểm toán.`}
                error={reason.trim().length > 0 && reason.trim().length < 20 ? `Còn thiếu ${20 - reason.trim().length} ký tự` : undefined}
              >
                <TextArea
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  invalid={reason.trim().length > 0 && reason.trim().length < 20}
                  placeholder="Ví dụ: Đối tác xác nhận số điện thoại đúng, chỉ khác định dạng. Đã bổ sung bước chuẩn hoá ở JOB-0412 v12."
                />
              </Field>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}

/* ═════════ 4.3 Theo dõi & Pipeline ═════════ */

export function PipelineMonitor() {
  const toast = useToast()

  return (
    <>
      <PageHeader
        code="4.3"
        title="Theo dõi & Pipeline"
        desc="Xem job nào đang chạy, hỏng ở bước nào, và sơ đồ pipeline có phủ badge chất lượng lên từng nút"
        crumbs={[{ label: 'Nạp & Điều phối' }, { label: 'Theo dõi & Pipeline' }]}
        actions={<ActionButton variant="ghost" icon="run" onClick={() => toast.info('Đang làm mới', 'Cập nhật trạng thái các tác vụ — minh hoạ.')}>Làm mới</ActionButton>}
      />

      <KpiRow
        items={[
          { label: 'Tác vụ chạy hôm nay', value: fmt(1_284), sub: 'trên toàn hệ thống' },
          { label: 'Thành công nhưng dữ liệu xấu', value: 42, sub: 'nguy hiểm nhất — không ai biết', tone: 'bad' },
          { label: 'Thất bại', value: 18, sub: 'hỏng rõ ràng, dễ phát hiện', tone: 'warn' },
          { label: 'Bị cổng chất lượng chặn', value: 6, sub: 'đúng thiết kế', tone: 'info' },
          { label: 'Job đúng giờ cam kết', value: '94%', sub: 'mục tiêu 98%', tone: 'warn' },
        ]}
      />

      <Panel title="Sơ đồ pipeline — badge chất lượng phủ lên từng nút" className="mt-4">
        <FlowDiagram
          width={1010}
          height={340}
          nodes={[
            { id: 'n1', x: 10, y: 20, w: 165, title: 'KENH-01', sub: 'SFTP đối tác A · 05:30', tone: 'source', to: '/catalog/channels/KENH-01' },
            { id: 'n2', x: 205, y: 20, w: 175, title: 'raw.doi_soat_A_tho', sub: 'NAP-012', tone: 'warn', badge: { text: 'Cổng chặn 723K dòng', tone: 'r' }, to: '/catalog/tables/raw.doi_soat_A_tho' },
            { id: 'n3', x: 410, y: 20, w: 155, title: 'JOB-0412', sub: '5 bước · 34 phút', tone: 'neutral', badge: { text: 'Thành công', tone: 'g' }, to: '/orchestration/jobs/JOB-0412' },
            { id: 'n4', x: 595, y: 20, w: 185, title: 'bi.doi_soat_giao_dich_A', sub: 'Tier 1 · 12,5 tr dòng', tone: 'bad', badge: { text: 'CL 91 · 2 luật cảnh báo', tone: 'o' }, to: '/catalog/tables/bi.doi_soat_giao_dich_A' },
            { id: 'n5', x: 810, y: 20, w: 175, title: 'BC-004', sub: 'Báo cáo đối soát', tone: 'target', badge: { text: 'Có thể sai số', tone: 'r' }, to: '/catalog/reports/BC-004' },
            { id: 'n6', x: 10, y: 200, w: 165, title: 'KENH-02', sub: 'Kafka · liên tục', tone: 'source', to: '/catalog/channels/KENH-02' },
            { id: 'n7', x: 205, y: 200, w: 175, title: 'raw.giao_dich_kafka', sub: 'NAP-031 · không có cổng', tone: 'neutral', badge: { text: 'Chưa kiểm chất lượng', tone: 'n' }, to: '/catalog/tables/raw.giao_dich_kafka' },
            { id: 'n8', x: 410, y: 200, w: 155, title: 'JOB-0208', sub: '8 bước · 12 phút', tone: 'neutral', badge: { text: 'Thành công', tone: 'g' }, to: '/orchestration/jobs/JOB-0208' },
            { id: 'n9', x: 595, y: 200, w: 185, title: 'dwh.giao_dich_thanh_toan', sub: '486 tr dòng', tone: 'ok', badge: { text: 'CL 94', tone: 'g' }, to: '/catalog/tables/dwh.giao_dich_thanh_toan' },
          ]}
          edges={[
            { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3', tone: 'bad', dashed: true, label: 'dữ liệu lỗi lọt qua' },
            { from: 'n3', to: 'n4' }, { from: 'n4', to: 'n5', tone: 'bad', dashed: true, label: 'lan lỗi' },
            { from: 'n6', to: 'n7' }, { from: 'n7', to: 'n8' }, { from: 'n8', to: 'n9' },
            { from: 'n9', to: 'n3', tone: 'neutral' },
          ]}
        />
      </Panel>

      <div className="mt-4">
        <Panel title="Tác vụ gần đây">
          <DataTable
            rows={pipelineTasks}
            rowKey={t => t.taskCode}
            highlightRow={t => (t.combo.includes('có vấn đề') ? 'bad' : t.runResult === 'Thất bại' ? 'warn' : undefined)}
            columns={[
              { key: 'taskCode', label: 'Mã tác vụ', nowrap: true, render: t => <span className="mono text-[11.5px] font-semibold">{t.taskCode}</span> },
              { key: 'job', label: 'Job', nowrap: true, render: t => <EntityLink to={`/orchestration/jobs/${t.job}`}>{t.job}</EntityLink> },
              { key: 'table', label: 'Bảng đích', nowrap: true, render: t => <EntityLink to={`/catalog/tables/${encodeURIComponent(t.table)}`}>{t.table}</EntityLink> },
              { key: 'runResult', label: 'Kết quả chạy', nowrap: true, render: t => <StatusChip value={t.runResult} /> },
              { key: 'qualityResult', label: 'Kết quả chất lượng', nowrap: true, render: t => <Chip tone={t.qualityResult === 'Đạt' ? 'g' : t.qualityResult === 'Cảnh báo' ? 'o' : t.qualityResult === 'Không đạt' ? 'r' : 'n'}>{t.qualityResult}</Chip> },
              { key: 'combo', label: 'Ý nghĩa', width: '26%', render: t => <span className={t.combo.includes('có vấn đề') ? 'font-semibold text-red-600' : 'text-[11.5px]'}>{t.combo}</span> },
              { key: 'at', label: 'Thời điểm', nowrap: true, render: t => <span className="mono text-[11px]">{t.at}</span> },
            ]}
          />
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4">
          <Panel title="Bốn tổ hợp trạng thái chạy × chất lượng">
            <DataTable
              dense
              rows={RUN_QUALITY_COMBOS}
              columns={[
                { key: 'run', label: 'Chạy', nowrap: true, render: r => <Chip tone={r.run === 'Thành công' ? 'g' : r.run === 'Thất bại' ? 'r' : 'o'}>{r.run}</Chip> },
                { key: 'quality', label: 'Chất lượng', nowrap: true, render: r => <Chip tone={r.tone}>{r.quality}</Chip> },
                { key: 'meaning', label: 'Ý nghĩa' },
                { key: 'count', label: 'Số lượng', align: 'right', nowrap: true, render: r => fmt(r.count) },
              ]}
            />
          </Panel>

          <Note tone="bad" title="Job chạy thành công vẫn có thể sinh ra số sai">
            Đây là tổ hợp <b>nguy hiểm nhất</b>: hệ thống giám sát cũ báo <i>"thành công"</i> nên không ai kiểm tra,
            trong khi dữ liệu bên trong đã sai. Có <b>42 lượt</b> như vậy hôm nay.
            Chỉ khi nối <b>kết quả chạy</b> với <b>kết quả chất lượng</b> mới nhìn ra.
          </Note>

          <Panel title="Chặn lan lỗi">
            <DataTable
              dense
              rows={[
                { level: 'Cổng chất lượng tại cửa nạp', where: 'menu 4.2', effect: 'Chặn dữ liệu xấu trước khi vào kho' },
                { level: 'Luật chặn job hạ nguồn', where: 'menu 3.2', effect: 'Job đọc bảng lỗi sẽ không chạy' },
                { level: 'Cảnh báo lan truyền', where: 'menu 3.4', effect: 'Báo cho người dùng báo cáo hạ nguồn' },
                { level: 'Đánh dấu báo cáo nghi ngờ', where: 'menu 1.3', effect: 'Hiện cảnh báo trên báo cáo dùng dữ liệu lỗi' },
              ]}
              columns={[
                { key: 'level', label: 'Lớp chặn', render: r => <span className="font-semibold">{r.level}</span> },
                { key: 'where', label: 'Ở đâu', nowrap: true, render: r => <Chip tone="b">{r.where}</Chip> },
                { key: 'effect', label: 'Tác dụng' },
              ]}
            />
          </Panel>
        </div>
      </div>
    </>
  )
}
