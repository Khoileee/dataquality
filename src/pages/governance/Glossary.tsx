import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  PageHeader, KpiRow, FilterBar, DataTable, CellTitle, Panel, Note, Chip, StatusChip,
  ActionButton, IconBtn, RowActions, EntityLink, InfoGrid, EmptyState, Steps, Field,
  TextInput, TextArea, SelectInput, Toggle, ChipInput, Timeline, SectionTitle, ProgressBar,
} from '@/components/common'
import { glossary, glossaryById, tableById, metricById, STATS } from '@/data'
import { match, useDemoSave } from '@/lib/demo'
import { GLOSSARY_BOOKS, usersByRole } from '@/data/enums'

export function GlossaryList() {
  const [q, setQ] = useState('')
  const [book, setBook] = useState('')
  const [state, setState] = useState('')

  const rows = useMemo(
    () => glossary.filter(g => (!book || g.book === book) && (!state || g.approval === state) && match(`${g.id} ${g.name} ${g.aliases.join(' ')} ${g.definition}`, q)),
    [q, book, state]
  )

  return (
    <>
      <PageHeader
        code="2.1"
        title="Từ điển nghiệp vụ"
        desc="Thống nhất cách hiểu và cách tính khái niệm trong toàn công ty — gắn thuật ngữ vào cột và chỉ tiêu để tra cứu được"
        crumbs={[{ label: 'Governance' }, { label: 'Từ điển nghiệp vụ' }]}
        actions={
          <>
            <ActionButton variant="ghost" icon="import">Nạp hàng loạt</ActionButton>
            <ActionButton icon="plus" to="/governance/glossary/create">Thêm thuật ngữ</ActionButton>
          </>
        }
      />

      <KpiRow
        items={[
          { label: 'Tổng số thuật ngữ', value: STATS.glossaryTerms, sub: `${glossary.length} thuật ngữ đã khai chi tiết` },
          { label: 'Đã gắn vào cột', value: `${STATS.glossaryBound}`, sub: '65% — còn 76 thuật ngữ chưa gắn', tone: 'warn' },
          { label: 'Đánh dấu CDE', value: STATS.glossaryCde, sub: 'dữ liệu trọng yếu doanh nghiệp', tone: 'info' },
          { label: 'Đã phê duyệt', value: glossary.filter(g => g.approval === 'Đã phê duyệt').length, sub: `trên ${glossary.length} thuật ngữ chi tiết`, tone: 'ok' },
          { label: 'Chưa gắn cột nào', value: glossary.filter(g => !g.boundColumns.length).length, sub: 'khai rồi để đó', tone: 'bad' },
        ]}
      />

      <div className="mt-4">
        <FilterBar
          placeholder="Tìm theo tên thuật ngữ, bí danh, định nghĩa…"
          value={q}
          onChange={setQ}
          filters={[
            { label: 'Từ điển', options: ['Từ điển Tài chính', 'Từ điển Khách hàng', 'Từ điển Vận hành'], value: book, onChange: setBook },
            { label: 'Trạng thái', options: ['Dự thảo', 'Chờ phê duyệt', 'Đã phê duyệt'], value: state, onChange: setState },
          ]}
          right={<span className="text-[12px] text-slate-400">{rows.length} thuật ngữ</span>}
        />
      </div>

      <DataTable
        stt
        rows={rows}
        rowKey={g => g.id}
        highlightRow={g => (!g.boundColumns.length && !g.boundMetrics.length ? 'bad' : undefined)}
        columns={[
          { key: 'id', label: 'Mã', nowrap: true, render: g => <EntityLink to={`/governance/glossary/${g.id}`}>{g.id}</EntityLink> },
          { key: 'name', label: 'Tên thuật ngữ', width: '22%', render: g => <CellTitle title={g.name} sub={g.aliases.length ? `Bí danh: ${g.aliases.join(', ')}` : undefined} /> },
          { key: 'book', label: 'Thuộc từ điển', nowrap: true, render: g => <Chip tone="t">{g.book}</Chip> },
          { key: 'cde', label: 'CDE', align: 'center', nowrap: true, render: g => (g.cde ? <Chip tone="r">CDE</Chip> : <span className="text-slate-300">—</span>) },
          {
            key: 'bound', label: 'Số cột đã gắn', align: 'center', nowrap: true,
            render: g => (g.boundColumns.length ? <Chip tone="g">{g.boundColumns.length}</Chip> : <Chip tone="r">0</Chip>),
          },
          { key: 'metrics', label: 'Chỉ tiêu dùng', align: 'center', nowrap: true, render: g => (g.boundMetrics.length ? <Chip tone="p">{g.boundMetrics.length}</Chip> : <span className="text-slate-300">—</span>) },
          { key: 'owner', label: 'Chủ sở hữu', nowrap: true },
          { key: 'steward', label: 'Người phụ trách', nowrap: true },
          { key: 'version', label: 'Phiên bản', nowrap: true, render: g => <Chip tone="b">{g.version}</Chip> },
          { key: 'approval', label: 'Trạng thái', nowrap: true, render: g => <StatusChip value={g.approval} /> },
          { key: 'act', label: '', align: 'right', nowrap: true, render: g => <RowActions><IconBtn icon="open" title="Chi tiết" to={`/governance/glossary/${g.id}`} /><IconBtn icon="edit" title="Sửa" to={`/governance/glossary/create?id=${g.id}`} /></RowActions> },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Note tone="bad" title="Điểm nhấn của màn này: cột “Số cột đã gắn” bằng 0">
          Thuật ngữ khai xong mà không gắn vào cột hoặc chỉ tiêu nào thì <b>không ai tra ra nó</b>.
          Gõ "doanh thu" trong ô tìm kiếm vẫn không ra cột nào — đúng vấn đề V2 <i>"khai rồi để đó"</i> mà tài liệu đề xuất đã nêu.
        </Note>
        <Note tone="info" title="Từ điển này mạnh hơn mặt bằng thị trường">
          Đã có <b>cờ CDE</b>, <b>người phụ trách tách khỏi chủ sở hữu</b>, phân cấp thuật ngữ cha–con, bí danh, đính kèm tài liệu, nạp hàng loạt và quy trình duyệt.
          Việc còn thiếu duy nhất là <b>đưa thuật ngữ vào chỉ mục tìm kiếm</b> — đã làm ở menu 1.1.
        </Note>
      </div>
    </>
  )
}

export function GlossaryDetail() {
  const { id = '' } = useParams()
  const g = glossaryById(id)
  if (!g) return <EmptyState text="Không tìm thấy thuật ngữ" action={<ActionButton to="/governance/glossary">Về danh sách</ActionButton>} />

  const parent = g.parentId ? glossaryById(g.parentId) : null

  return (
    <>
      <PageHeader
        code="2.1"
        title={g.name}
        desc={`${g.id} · ${g.book} · phiên bản ${g.version}`}
        crumbs={[{ label: 'Governance' }, { label: 'Từ điển nghiệp vụ', href: '/governance/glossary' }, { label: g.id }]}
        actions={
          <>
            {g.cde && <Chip tone="r">CDE</Chip>}
            <StatusChip value={g.approval} />
            <ActionButton variant="ghost" icon="edit" to={`/governance/glossary/create?id=${g.id}`}>Sửa</ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4">
          <Panel title="Định nghĩa">
            <p className="text-[14px] leading-relaxed text-slate-800">{g.definition}</p>
            {g.formula && (
              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Công thức tính</div>
                <div className="mono mt-1 text-[12.5px] text-slate-800">{g.formula}</div>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {g.aliases.map(a => <Chip key={a} tone="n">{a}</Chip>)}
            </div>
          </Panel>

          <Panel title="Thông tin quản trị">
            <InfoGrid
              items={[
                { label: 'Mã thuật ngữ', value: <span className="mono">{g.id}</span> },
                { label: 'Thuộc từ điển', value: g.book },
                { label: 'Đơn vị tính', value: g.unit ?? '— không áp dụng' },
                { label: 'Phạm vi áp dụng', value: g.scope },
                { label: 'Chủ sở hữu (phê duyệt)', value: g.owner },
                { label: 'Người phụ trách (cập nhật)', value: g.steward },
                { label: 'Người phê duyệt', value: g.approver },
                { label: 'Thuật ngữ cha', value: parent ? <EntityLink to={`/governance/glossary/${parent.id}`} mono={false}>{parent.name}</EntityLink> : '— là thuật ngữ gốc' },
                { label: 'Cập nhật lần cuối', value: g.updatedAt },
                { label: 'Đánh dấu CDE', value: g.cde ? 'Có — dữ liệu trọng yếu doanh nghiệp' : 'Không' },
              ]}
            />
            {!!g.relatedIds.length && (
              <div className="mt-3">
                <div className="mb-1.5 text-[11px] font-semibold uppercase text-slate-400">Thuật ngữ liên quan</div>
                <div className="flex flex-wrap gap-1.5">
                  {g.relatedIds.map(r => {
                    const rel = glossaryById(r)
                    return <EntityLink key={r} to={`/governance/glossary/${r}`} mono={false}><Chip tone="b">{rel?.name ?? r}</Chip></EntityLink>
                  })}
                </div>
              </div>
            )}
          </Panel>

          <Panel title={`Cột dữ liệu đang gắn thuật ngữ này (${g.boundColumns.length})`}>
            {g.boundColumns.length ? (
              <DataTable
                dense
                rows={g.boundColumns}
                rowKey={c => `${c.tableId}.${c.column}`}
                columns={[
                  { key: 'tableId', label: 'Bảng', render: c => <EntityLink to={`/catalog/tables/${encodeURIComponent(c.tableId)}/columns`}>{c.tableId}</EntityLink> },
                  { key: 'column', label: 'Cột', render: c => <span className="mono text-[12px] font-semibold">{c.column}</span> },
                  { key: 'name', label: 'Tên nghiệp vụ của bảng', render: c => tableById(c.tableId)?.name ?? '—' },
                  { key: 'domain', label: 'Miền', nowrap: true, render: c => tableById(c.tableId)?.domain ?? '—' },
                ]}
              />
            ) : (
              <Note tone="bad" title="Thuật ngữ chưa gắn vào cột nào">
                Người dùng tra cứu sẽ không tìm ra dữ liệu tương ứng. Hãy gắn thuật ngữ vào ít nhất một cột hoặc một chỉ tiêu.
              </Note>
            )}
          </Panel>

          {!!g.boundMetrics.length && (
            <Panel title={`Chỉ tiêu sử dụng thuật ngữ này (${g.boundMetrics.length})`}>
              <div className="space-y-1.5">
                {g.boundMetrics.map(m => {
                  const met = metricById(m)
                  return (
                    <div key={m} className="rounded-lg border border-slate-200 px-3 py-2">
                      <EntityLink to={`/catalog/reports/metrics/${m}`} mono={false}>{met?.name ?? m}</EntityLink>
                      <div className="mono mt-0.5 text-[11px] text-slate-400">{met?.formula}</div>
                    </div>
                  )
                })}
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <Note tone="info" title="Thuật ngữ này dùng để làm gì">
            Gắn vào cột ở menu <b>1.2</b> → người dùng tra cứu hiểu ngay ý nghĩa cột ·
            Gắn vào chỉ tiêu ở menu <b>1.5</b> → thống nhất công thức giữa các báo cáo ·
            Xuất hiện trong chỉ mục tìm kiếm ở menu <b>1.1</b>.
          </Note>

          {g.cde && (
            <Note tone="warn" title="Ý nghĩa cờ CDE">
              <b>CDE — Critical Data Element</b>: dữ liệu trọng yếu doanh nghiệp.
              Mọi cột gắn thuật ngữ CDE <b>bắt buộc</b> có luật chất lượng, có người sở hữu, và thay đổi định nghĩa phải qua phê duyệt của Người sở hữu dữ liệu.
            </Note>
          )}

          <Panel title="Lịch sử phiên bản">
            <Timeline
              items={g.history.map((h, i) => ({
                time: h.date, who: h.by, title: `Phiên bản ${h.version}`, text: h.note,
                tone: i === 0 ? ('g' as const) : ('n' as const),
              }))}
            />
          </Panel>

          <Panel title="Mức độ sử dụng">
            <ProgressBar
              pct={Math.min(100, (g.boundColumns.length + g.boundMetrics.length) * 25)}
              target={50}
              label="Độ phủ áp dụng"
              note={`${g.boundColumns.length} cột · ${g.boundMetrics.length} chỉ tiêu`}
            />
          </Panel>
        </div>
      </div>
    </>
  )
}

export function GlossaryCreate() {
  const save = useDemoSave('/governance/glossary')
  const [step, setStep] = useState(0)
  const [f, setF] = useState({ name: '', book: 'Từ điển Tài chính', definition: '', formula: '', unit: '', scope: '', owner: '', steward: '' })
  const [aliases, setAliases] = useState<string[]>([])
  const [cde, setCde] = useState(false)
  const [bound, setBound] = useState<string[]>([])
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }))

  const CANDIDATES = [
    { id: 'bi.doi_soat_giao_dich_A.so_tien', label: 'bi.doi_soat_giao_dich_A · so_tien' },
    { id: 'mart.doanh_thu_ngay.doanh_thu', label: 'mart.doanh_thu_ngay · doanh_thu' },
    { id: 'crm.khach_hang.trang_thai', label: 'crm.khach_hang · trang_thai' },
    { id: 'bi.doi_soat_giao_dich_A.chenh_lech', label: 'bi.doi_soat_giao_dich_A · chenh_lech' },
    { id: 'crm.khach_hang.phan_khuc', label: 'crm.khach_hang · phan_khuc' },
  ]

  const ok = f.name && f.definition && f.owner && f.steward

  return (
    <>
      <PageHeader
        code="2.1"
        title="Thêm thuật ngữ nghiệp vụ"
        desc="Thuật ngữ chỉ có giá trị khi được gắn vào cột hoặc chỉ tiêu cụ thể"
        crumbs={[{ label: 'Governance' }, { label: 'Từ điển nghiệp vụ', href: '/governance/glossary' }, { label: 'Thêm mới' }]}
      />
      <Steps items={['Định nghĩa', 'Gắn vào cột / chỉ tiêu', 'Quản trị và gửi duyệt']} current={step} onJump={setStep} />

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title={['Định nghĩa thuật ngữ', 'Gắn thuật ngữ vào dữ liệu', 'Thông tin quản trị'][step]}>
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Mã thuật ngữ"><TextInput mono value="(tự sinh khi lưu)" readOnly /></Field>
              <Field label="Thuộc từ điển" info="term.book" required>
                <SelectInput value={f.book} onChange={set('book')}>{GLOSSARY_BOOKS.map(b => <option key={b}>{b}</option>)}</SelectInput>
              </Field>
              <Field label="Tên thuật ngữ" required full><TextInput value={f.name} onChange={set('name')} placeholder="Doanh thu ghi nhận" /></Field>
              <Field label="Định nghĩa" required full hint="Viết đủ để hai đơn vị khác nhau đọc xong hiểu giống nhau">
                <TextArea rows={3} value={f.definition} onChange={set('definition')} />
              </Field>
              <Field label="Công thức tính" full hint="Để trống nếu thuật ngữ không phải đại lượng đo được">
                <TextInput value={f.formula} onChange={set('formula')} placeholder="Tổng số tiền giao dịch thành công − Hoàn tiền − Điều chỉnh giảm" />
              </Field>
              <Field label="Đơn vị tính"><TextInput value={f.unit} onChange={set('unit')} placeholder="VND" /></Field>
              <Field label="Phạm vi áp dụng"><TextInput value={f.scope} onChange={set('scope')} placeholder="Toàn công ty" /></Field>
              <Field label="Bí danh" full hint="Gõ rồi nhấn Enter để thêm — dùng để tìm kiếm">
                <ChipInput values={aliases} onChange={setAliases} placeholder="Doanh thu, Revenue…" />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div>
              {!bound.length && (
                <Note tone="bad" title="Chưa gắn cột nào" className="mb-3">
                  Thuật ngữ không gắn cột hoặc chỉ tiêu nào thì <b>không ai tra ra được</b> — vẫn cho lưu nhưng sẽ bị đánh dấu đỏ ở danh sách.
                </Note>
              )}
              <div className="space-y-1.5">
                {CANDIDATES.map(c => (
                  <label key={c.id} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition ${bound.includes(c.id) ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="checkbox" checked={bound.includes(c.id)} onChange={() => setBound(p => (p.includes(c.id) ? p.filter(x => x !== c.id) : [...p, c.id]))} />
                    <span className="mono text-[12px] text-slate-700">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Chủ sở hữu" required hint="Người phê duyệt định nghĩa">
                <SelectInput value={f.owner} onChange={set('owner')}>
                  <option value="">— Chọn —</option>
                  {usersByRole('Người sở hữu dữ liệu').map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </SelectInput>
              </Field>
              <Field label="Người phụ trách" required hint="Người cập nhật nội dung">
                <SelectInput value={f.steward} onChange={set('steward')}>
                  <option value="">— Chọn —</option>
                  {usersByRole('Đầu mối nghiệp vụ').map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </SelectInput>
              </Field>
              <div className="col-span-full">
                <Toggle checked={cde} onChange={setCde} label="Đánh dấu là CDE — dữ liệu trọng yếu doanh nghiệp" hint="Cột gắn thuật ngữ CDE bắt buộc có luật chất lượng và có người sở hữu" />
              </div>
              {cde && (
                <div className="col-span-full">
                  <Note tone="warn" title="Đánh dấu CDE kéo theo ràng buộc">
                    Mọi cột gắn thuật ngữ này sẽ bị hệ thống kiểm tra: phải có luật chất lượng, phải có Người sở hữu dữ liệu,
                    và thay đổi định nghĩa phải qua phê duyệt cấp Người sở hữu dữ liệu.
                  </Note>
                </div>
              )}
            </div>
          )}
        </Panel>

        <Panel title="Xem trước">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-slate-800">{f.name || 'chưa đặt tên'}</span>
              {cde && <Chip tone="r">CDE</Chip>}
            </div>
            <div className="mt-1 text-[12px] leading-relaxed text-slate-600">{f.definition || 'chưa có định nghĩa'}</div>
            {f.formula && <div className="mono mt-2 rounded bg-blue-50 px-2 py-1 text-[11.5px] text-blue-800">{f.formula}</div>}
            <div className="mt-2 flex flex-wrap gap-1">
              <Chip tone="t">{f.book}</Chip>
              {f.unit && <Chip tone="n">{f.unit}</Chip>}
              {aliases.map(a => <Chip key={a} tone="n">{a}</Chip>)}
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Đã gắn {bound.length} cột</div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/governance/glossary">Huỷ</ActionButton>
        <div className="flex gap-2">
          {step > 0 && <ActionButton variant="ghost" onClick={() => setStep(s => s - 1)}>Quay lại</ActionButton>}
          {step < 2
            ? <ActionButton onClick={() => setStep(s => s + 1)}>Tiếp tục</ActionButton>
            : <ActionButton disabled={!ok} onClick={() => save('Đã gửi phê duyệt thuật ngữ')}>Gửi phê duyệt</ActionButton>}
        </div>
      </div>
    </>
  )
}
