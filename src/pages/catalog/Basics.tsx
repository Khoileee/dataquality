import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  PageHeader, KpiRow, FilterBar, DataTable, CellTitle, Panel, Note, Chip, StatusChip,
  ActionButton, IconBtn, RowActions, EntityLink, InfoGrid, EmptyState, InlineTabs, TreeView,
  Field, TextInput, TextArea, SelectInput, ProgressBar, Modal, useToast, SectionTitle,
} from '@/components/common'
import { groups, tables, domains, domainName, refdata, fmt, STATS } from '@/data'
import { match, useDemoSave } from '@/lib/demo'
import { usersByRole } from '@/data/enums'

/** Kiểu dữ liệu của trường trong danh mục tham chiếu — hằng số của hệ thống */
const REFDATA_FIELD_TYPES = ['string', 'number', 'date', 'boolean']

/* ═════════ 1.6 Nhóm bảng ═════════ */

export function GroupList() {
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<any>(null)
  const rows = useMemo(() => groups.filter(g => match(`${g.id} ${g.name} ${g.description}`, q)), [q])

  return (
    <>
      <PageHeader
        code="1.1"
        title="Nhóm bảng"
        desc="Gom bảng thành bộ để phân quyền và theo dõi chung — một chính sách áp cho cả nhóm thay vì khai từng bảng"
        crumbs={[{ label: 'Data Catalog' }, { label: 'Nhóm bảng' }]}
        actions={<ActionButton icon="plus" to="/catalog/groups/create">Thêm nhóm bảng</ActionButton>}
      />

      <KpiRow
        items={[
          { label: 'Số nhóm bảng', value: groups.length, sub: `${groups.filter(g => g.status === 'Đang dùng').length} đang dùng` },
          { label: 'Bảng đã gom nhóm', value: new Set(groups.flatMap(g => g.tableIds)).size, sub: 'trong số bảng đã khai chi tiết' },
          { label: 'Chính sách dùng nhóm', value: groups.reduce((a, g) => a + g.usedByPolicies, 0), sub: 'trên tổng 1.847 chính sách' },
          { label: 'Nhóm không có chính sách', value: groups.filter(g => !g.usedByPolicies).length, sub: 'gom nhưng chưa dùng', tone: 'warn' },
        ]}
      />

      <div className="mt-4">
        <FilterBar placeholder="Tìm theo tên nhóm, mô tả…" value={q} onChange={setQ} right={<span className="text-[12px] text-slate-400">{rows.length} nhóm</span>} />
      </div>

      <DataTable
        stt
        rows={rows}
        rowKey={g => g.id}
        highlightRow={g => (g.status === 'Đã ngừng' ? 'bad' : undefined)}
        columns={[
          { key: 'id', label: 'Mã', nowrap: true, render: g => <span className="mono text-[12px] font-semibold">{g.id}</span> },
          { key: 'name', label: 'Tên nhóm', width: '24%', render: g => <CellTitle title={g.name} sub={g.description} /> },
          { key: 'count', label: 'Số bảng', align: 'right', nowrap: true, render: g => <Chip tone="b">{g.tableIds.length}</Chip> },
          {
            key: 'tables', label: 'Bảng trong nhóm', width: '30%',
            render: g => (
              <div className="flex flex-wrap gap-1">
                {g.tableIds.slice(0, 3).map(t => <Chip key={t} tone="n" title={t}>{t.split('.').pop()}</Chip>)}
                {g.tableIds.length > 3 && <Chip tone="n">+{g.tableIds.length - 3}</Chip>}
              </div>
            ),
          },
          { key: 'policies', label: 'Chính sách dùng', align: 'center', nowrap: true, render: g => (g.usedByPolicies ? <Chip tone="g">{g.usedByPolicies}</Chip> : <Chip tone="o">0</Chip>) },
          { key: 'createdBy', label: 'Người tạo', nowrap: true },
          { key: 'createdAt', label: 'Ngày tạo', nowrap: true },
          { key: 'status', label: 'Trạng thái', nowrap: true, render: g => <StatusChip value={g.status} /> },
          { key: 'act', label: '', align: 'right', nowrap: true, render: g => <RowActions><IconBtn icon="view" title="Xem" onClick={() => setPick(g)} /><IconBtn icon="edit" title="Sửa" to={`/catalog/groups/create?id=${g.id}`} /></RowActions> },
        ]}
      />

      <Note tone="info" title="Vì sao gom nhóm lại tiết kiệm" className="mt-4">
        Nhóm <b>NB-02 Dữ liệu khách hàng</b> đang được <b>14 chính sách</b> tham chiếu.
        Nếu không có nhóm, mỗi chính sách phải khai riêng 4 bảng — thành 56 dòng chính sách phải bảo trì thay vì 14.
      </Note>

      <Modal open={!!pick} onClose={() => setPick(null)} title={pick?.name} desc={pick && `${pick.id} · ${pick.description}`} size="lg">
        {pick && (
          <DataTable
            dense
            rows={pick.tableIds.map((t: string) => tables.find(x => x.id === t)).filter(Boolean)}
            rowKey={(t: any) => t.id}
            columns={[
              { key: 'id', label: 'Bảng', render: (t: any) => <EntityLink to={`/catalog/tables/${encodeURIComponent(t.id)}`}>{t.id}</EntityLink> },
              { key: 'name', label: 'Tên nghiệp vụ' },
              { key: 'domain', label: 'Miền', nowrap: true, render: (t: any) => domainName(t.domain) ?? '—' },
              { key: 'tier', label: 'Mức QT', nowrap: true, render: (t: any) => t.tier ?? '—' },
              { key: 'sens', label: 'Cột nhạy cảm', align: 'right', nowrap: true, render: (t: any) => t.sensitiveColumnCount },
              { key: 'q', label: 'Chất lượng', align: 'right', nowrap: true, render: (t: any) => t.qualityScore ?? '—' },
            ]}
          />
        )}
      </Modal>
    </>
  )
}

export function GroupCreate() {
  const save = useDemoSave('/catalog/groups')
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [q, setQ] = useState('')

  const avail = tables.filter(t => !picked.includes(t.id) && match(`${t.id} ${t.name}`, q))

  return (
    <>
      <PageHeader
        code="1.1"
        title="Thêm nhóm bảng"
        desc="Chọn các bảng đã có trong danh mục để gom thành một bộ dùng cho phân quyền và theo dõi"
        crumbs={[{ label: 'Data Catalog' }, { label: 'Nhóm bảng', href: '/catalog/groups' }, { label: 'Thêm mới' }]}
      />

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 items-start">
        <Panel title="Thông tin nhóm">
          <div className="space-y-4">
            <Field label="Tên nhóm" required><TextInput value={name} onChange={e => setName(e.target.value)} placeholder="Đối soát giao dịch" /></Field>
            <Field label="Mô tả" required><TextArea rows={3} value={desc} onChange={e => setDesc(e.target.value)} /></Field>
            <Field label="Người tạo"><TextInput value="Nguyễn Thị Phương" readOnly /></Field>
            <Note tone="warn" title="Ràng buộc RB2">
              Chỉ chọn được bảng <b>đã có trong danh mục</b>. Bảng chưa khai thì không xuất hiện ở cột bên phải.
            </Note>
          </div>
        </Panel>

        <Panel title={`Chọn bảng — đã chọn ${picked.length} bảng`}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase text-slate-400">Bảng sẵn có ({avail.length})</div>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Tìm bảng…"
                className="mb-2 h-8 w-full rounded-lg border border-slate-300 px-2.5 text-[12.5px] outline-none focus:border-blue-400"
              />
              <div className="max-h-[420px] space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-1.5">
                {avail.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setPicked(p => [...p, t.id])}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-blue-50"
                  >
                    <span className="min-w-0">
                      <span className="mono block truncate text-[11.5px] font-semibold text-slate-700">{t.id}</span>
                      <span className="block truncate text-[10.5px] text-slate-400">{t.name}</span>
                    </span>
                    <span className="shrink-0 text-blue-500">+</span>
                  </button>
                ))}
                {!avail.length && <div className="py-6 text-center text-[12px] text-slate-400">Không còn bảng phù hợp</div>}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase text-slate-400">Bảng trong nhóm ({picked.length})</div>
              <div className="mt-[38px] max-h-[420px] space-y-1 overflow-y-auto rounded-lg border border-blue-200 bg-blue-50/40 p-1.5">
                {picked.map(id => {
                  const t = tables.find(x => x.id === id)!
                  return (
                    <button
                      key={id}
                      onClick={() => setPicked(p => p.filter(x => x !== id))}
                      className="flex w-full items-center justify-between gap-2 rounded-md bg-white px-2 py-1.5 text-left transition hover:bg-red-50"
                    >
                      <span className="min-w-0">
                        <span className="mono block truncate text-[11.5px] font-semibold text-slate-700">{t.id}</span>
                        <span className="block truncate text-[10.5px] text-slate-400">{t.name}</span>
                      </span>
                      <span className="shrink-0 text-red-400">×</span>
                    </button>
                  )
                })}
                {!picked.length && <div className="py-6 text-center text-[12px] text-slate-400">Chưa chọn bảng nào</div>}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/catalog/groups">Huỷ</ActionButton>
        <ActionButton disabled={!name || !desc || !picked.length} onClick={() => save('Đã tạo nhóm bảng')}>Lưu nhóm bảng</ActionButton>
      </div>
    </>
  )
}

/* ═════════ 1.7 Miền dữ liệu ═════════ */

export function DomainList() {
  const [active, setActive] = useState('D-KD')
  const d = domains.find(x => x.id === active)!
  const roots = domains.filter(x => !x.parentId)

  const treeNodes = roots.map(r => ({
    id: r.id,
    label: r.name,
    count: r.tableCount,
    children: domains.filter(c => c.parentId === r.id).map(c => ({ id: c.id, label: c.name, count: c.tableCount })),
  }))

  const domTables = tables.filter(t => t.domain === active || domains.find(x => x.id === t.domain)?.parentId === active)

  return (
    <>
      <PageHeader
        code="1.4"
        title="Miền dữ liệu"
        desc="Khai miền nghiệp vụ phân cấp — mỗi bảng bắt buộc thuộc một miền, mỗi miền có người chịu trách nhiệm"
        crumbs={[{ label: 'Data Catalog' }, { label: 'Miền dữ liệu' }]}
        actions={<ActionButton icon="plus" to="/catalog/domains/create">Thêm miền</ActionButton>}
      />

      <KpiRow
        items={[
          { label: 'Số miền dữ liệu', value: domains.length, sub: `${roots.length} miền gốc · ${domains.length - roots.length} miền con` },
          { label: 'Bảng đã gán miền', value: fmt(STATS.totalTables - STATS.tablesNoDomain), sub: '62% tổng số bảng' },
          { label: 'Bảng chưa gán miền', value: fmt(STATS.tablesNoDomain), sub: '38% — không ai chịu trách nhiệm', tone: 'bad' },
          { label: 'Miền có người phụ trách', value: `${domains.filter(x => x.owner).length}/${domains.length}`, sub: 'đủ 100%', tone: 'ok' },
        ]}
      />

      <div className="mt-4 grid grid-cols-[280px_minmax(0,1fr)] gap-4 items-start">
        <Panel title="Cây miền dữ liệu">
          <TreeView nodes={treeNodes} activeId={active} onPick={setActive} />
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <div className="text-[12px] font-bold text-red-700">— Chưa gán miền —</div>
            <div className="mt-0.5 text-[11px] text-red-600">{fmt(STATS.tablesNoDomain)} bảng · không ai chịu trách nhiệm</div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title={`Miền: ${d.name}`} actions={<ActionButton variant="ghost" icon="edit" to={`/catalog/domains/create?id=${d.id}`}>Sửa</ActionButton>}>
            <InfoGrid
              items={[
                { label: 'Mã miền', value: <span className="mono">{d.id}</span> },
                { label: 'Miền cha', value: d.parentId ? domainName(d.parentId) : '— là miền gốc' },
                { label: 'Người chịu trách nhiệm', value: d.owner },
                { label: 'Số bảng', value: fmt(d.tableCount) },
                { label: 'Mô tả', value: d.description, full: true },
              ]}
            />
            <div className="mt-3 grid grid-cols-2 gap-4">
              <ProgressBar pct={d.coveredPct} target={90} label="Độ phủ metadata" note={`${d.coveredPct}% · mục tiêu 90%`} />
              <ProgressBar pct={d.qualityScore ?? 0} target={85} label="Điểm chất lượng miền" note={`${d.qualityScore ?? '—'}/100`} />
            </div>
          </Panel>

          <Panel title={`Bảng thuộc miền này (${domTables.length} bảng đã khai chi tiết)`}>
            <DataTable
              dense
              rows={domTables}
              rowKey={t => t.id}
              empty="Chưa có bảng nào của miền này được khai chi tiết"
              columns={[
                { key: 'id', label: 'Bảng', render: t => <EntityLink to={`/catalog/tables/${encodeURIComponent(t.id)}`}>{t.id}</EntityLink> },
                { key: 'name', label: 'Tên nghiệp vụ' },
                { key: 'tier', label: 'Mức QT', nowrap: true, render: t => t.tier ?? '—' },
                { key: 'bda', label: 'BDA', nowrap: true, render: t => t.bda ?? <span className="text-red-500">—</span> },
                { key: 'rows', label: 'Số dòng', align: 'right', nowrap: true, render: t => fmt(t.rows) },
                { key: 'q', label: 'Chất lượng', align: 'right', nowrap: true, render: t => t.qualityScore ?? '—' },
              ]}
            />
          </Panel>
        </div>
      </div>
    </>
  )
}

export function DomainCreate() {
  const save = useDemoSave('/catalog/domains')
  const [f, setF] = useState({ name: '', parentId: '', description: '', owner: '' })
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }))

  return (
    <>
      <PageHeader
        code="1.4"
        title="Thêm miền dữ liệu"
        desc="Miền dữ liệu là chiều phân loại nghiệp vụ dùng chung cho toàn hệ thống"
        crumbs={[{ label: 'Data Catalog' }, { label: 'Miền dữ liệu', href: '/catalog/domains' }, { label: 'Thêm mới' }]}
      />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title="Thông tin miền">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tên miền" required full><TextInput value={f.name} onChange={set('name')} placeholder="Đối soát" /></Field>
            <Field label="Miền cha" hint="Để trống nếu đây là miền gốc">
              <SelectInput value={f.parentId} onChange={set('parentId')}>
                <option value="">— Là miền gốc —</option>
                {domains.filter(d => !d.parentId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="Người chịu trách nhiệm" required>
              <SelectInput value={f.owner} onChange={set('owner')}>
                <option value="">— Chọn —</option>
                {usersByRole().map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </SelectInput>
            </Field>
            <Field label="Mô tả" required full><TextArea rows={3} value={f.description} onChange={set('description')} /></Field>
          </div>
        </Panel>
        <Note tone="info" title="Miền dữ liệu dùng để làm gì">
          <ul className="ml-4 list-disc space-y-1">
            <li>Là <b>chiều lọc chính</b> khi tra cứu danh mục và khi xem sức khoẻ dữ liệu.</li>
            <li>Là <b>phạm vi cấp quyền</b> — một chính sách có thể áp cho cả miền thay vì từng bảng.</li>
            <li>Là <b>đơn vị chịu trách nhiệm</b> — mỗi miền có một người chịu trách nhiệm rõ ràng.</li>
            <li>Là <b>đơn vị báo cáo</b> — bảng sức khoẻ theo miền tại menu 8.1.</li>
          </ul>
        </Note>
      </div>
      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/catalog/domains">Huỷ</ActionButton>
        <ActionButton disabled={!f.name || !f.owner || !f.description} onClick={() => save('Đã tạo miền dữ liệu')}>Lưu</ActionButton>
      </div>
    </>
  )
}

/* ═════════ 1.8 Danh mục tham chiếu ═════════ */

export function RefdataList() {
  const [q, setQ] = useState('')
  const rows = useMemo(() => refdata.filter(r => match(`${r.id} ${r.name} ${r.description}`, q)), [q])

  return (
    <>
      <PageHeader
        code="1.5"
        title="Danh mục tham chiếu"
        desc="Danh mục dùng chung (đối tác, tỉnh/thành, loại giao dịch…) — nguồn đối chiếu cho luật chất lượng ở menu 3.1"
        crumbs={[{ label: 'Data Catalog' }, { label: 'Danh mục tham chiếu' }]}
        actions={<ActionButton icon="plus" to="/catalog/refdata/create">Thêm danh mục</ActionButton>}
      />

      <KpiRow
        items={[
          { label: 'Số danh mục', value: refdata.length, sub: `${refdata.reduce((a, r) => a + r.recordCount, 0)} bản ghi` },
          { label: 'Bản ghi chờ duyệt', value: refdata.reduce((a, r) => a + r.pendingCount, 0), sub: 'trên 2 danh mục', tone: 'warn' },
          { label: 'Luật chất lượng đang dùng', value: refdata.reduce((a, r) => a + r.usedByRules, 0), sub: 'luật kiểu tham chiếu danh mục' },
          { label: 'Danh mục đã phê duyệt', value: refdata.filter(r => r.approval === 'Đã phê duyệt').length, sub: `trên ${refdata.length} danh mục`, tone: 'ok' },
        ]}
      />

      <div className="mt-4">
        <FilterBar placeholder="Tìm theo tên danh mục…" value={q} onChange={setQ} right={<span className="text-[12px] text-slate-400">{rows.length} danh mục</span>} />
      </div>

      <DataTable
        stt
        rows={rows}
        rowKey={r => r.id}
        highlightRow={r => (r.pendingCount ? 'warn' : undefined)}
        columns={[
          { key: 'id', label: 'Mã', nowrap: true, render: r => <EntityLink to={`/catalog/refdata/${r.id}`}>{r.id}</EntityLink> },
          { key: 'name', label: 'Tên danh mục', width: '26%', render: r => <CellTitle title={r.name} sub={r.description} /> },
          { key: 'recordCount', label: 'Số bản ghi', align: 'right', nowrap: true, render: r => fmt(r.recordCount) },
          { key: 'fields', label: 'Số trường', align: 'right', nowrap: true, render: r => r.fields.length },
          { key: 'version', label: 'Phiên bản', nowrap: true, render: r => <Chip tone="b">{r.version}</Chip> },
          { key: 'pending', label: 'Chờ duyệt', align: 'center', nowrap: true, render: r => (r.pendingCount ? <Chip tone="o">{r.pendingCount}</Chip> : <span className="text-slate-300">—</span>) },
          { key: 'usedByRules', label: 'Luật đang dùng', align: 'center', nowrap: true, render: r => <Chip tone="g">{r.usedByRules}</Chip> },
          { key: 'owner', label: 'Người phụ trách', nowrap: true },
          { key: 'approval', label: 'Trạng thái', nowrap: true, render: r => <StatusChip value={r.approval} /> },
          { key: 'updatedAt', label: 'Cập nhật', nowrap: true },
          { key: 'act', label: '', align: 'right', nowrap: true, render: r => <RowActions><IconBtn icon="open" title="Chi tiết" to={`/catalog/refdata/${r.id}`} /></RowActions> },
        ]}
      />

      <Note tone="warn" title="Chỗ luồng dễ đứt — đã xử lý" className="mt-4">
        Luật <b>"mã phải tồn tại trong danh mục"</b> (loại RL-11) hiện có <b>lượt dùng = 0</b> vì module Chất lượng chưa gọi được vào danh mục này.
        Đây là việc <b>nối</b>, không phải xây mới — chỉ cần mở API cho menu 3.1 truy vấn.
      </Note>
    </>
  )
}

export function RefdataDetail() {
  const { id = '' } = useParams()
  const r = refdata.find(x => x.id === id)
  const [tab, setTab] = useState('data')
  const [cmp, setCmp] = useState<any>(null)
  const toast = useToast()

  if (!r) return <EmptyState text="Không tìm thấy danh mục" action={<ActionButton to="/catalog/refdata">Về danh sách</ActionButton>} />

  return (
    <>
      <PageHeader
        code="1.5"
        title={r.name}
        desc={`${r.id} · ${r.description} · ${fmt(r.recordCount)} bản ghi · phiên bản ${r.version}`}
        crumbs={[{ label: 'Data Catalog' }, { label: 'Danh mục tham chiếu', href: '/catalog/refdata' }, { label: r.id }]}
        actions={
          <>
            <StatusChip value={r.approval} />
            <ActionButton variant="ghost" icon="import">Nạp file</ActionButton>
            <ActionButton variant="ghost" icon="export">Xuất Excel</ActionButton>
            <ActionButton icon="plus">Thêm bản ghi</ActionButton>
          </>
        }
      />

      <InlineTabs
        items={[
          { id: 'data', label: 'Dữ liệu', badge: r.records.length },
          { id: 'fields', label: 'Định nghĩa trường', badge: r.fields.length },
          { id: 'versions', label: 'Phiên bản', badge: r.versions.length },
          { id: 'pending', label: 'Chờ duyệt', badge: r.pendingCount },
          { id: 'log', label: 'Nhật ký' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'data' && (
        <DataTable
          rows={r.records}
          columns={r.fields.map(f => ({
            key: f.name,
            label: <span>{f.name}{f.required && <span className="text-red-500"> *</span>}{f.key && <Chip tone="b" className="ml-1">khoá</Chip>}</span>,
            nowrap: true,
            render: (row: any) => <span className={f.key ? 'mono font-semibold' : ''}>{row[f.name] ?? '—'}</span>,
          }))}
        />
      )}

      {tab === 'fields' && (
        <DataTable
          rows={r.fields}
          rowKey={f => f.name}
          columns={[
            { key: 'name', label: 'Tên trường', render: f => <span className="mono font-semibold">{f.name}</span> },
            { key: 'type', label: 'Kiểu dữ liệu', nowrap: true, render: f => <Chip tone="n">{f.type}</Chip> },
            { key: 'required', label: 'Bắt buộc', align: 'center', nowrap: true, render: f => (f.required ? <Chip tone="r">Có</Chip> : '—') },
            { key: 'key', label: 'Khoá chính', align: 'center', nowrap: true, render: f => (f.key ? <Chip tone="b">Có</Chip> : '—') },
            { key: 'format', label: 'Định dạng', render: f => (f.format ? <span className="mono text-[11.5px]">{f.format}</span> : '—') },
            { key: 'range', label: 'Giá trị hợp lệ', render: f => (f.min || f.max ? `${f.min ?? ''} – ${f.max ?? ''}` : '—') },
          ]}
        />
      )}

      {tab === 'versions' && (
        <DataTable
          rows={r.versions}
          rowKey={v => v.version}
          columns={[
            { key: 'version', label: 'Phiên bản', nowrap: true, render: v => <Chip tone={v.version === r.version ? 'g' : 'n'}>{v.version}{v.version === r.version ? ' · hiện hành' : ''}</Chip> },
            { key: 'date', label: 'Ngày', nowrap: true },
            { key: 'by', label: 'Người thực hiện', nowrap: true },
            { key: 'note', label: 'Nội dung thay đổi' },
            { key: 'stat', label: 'Thay đổi', nowrap: true, render: v => <span className="text-[11.5px]"><span className="text-emerald-600">+{v.added}</span> · <span className="text-red-600">−{v.removed}</span> · <span className="text-amber-600">~{v.changed}</span></span> },
            { key: 'act', label: '', align: 'right', nowrap: true, render: v => <RowActions><ActionButton variant="ghost" onClick={() => setCmp(v)}>So sánh</ActionButton></RowActions> },
          ]}
        />
      )}

      {tab === 'pending' && (
        r.pending.length ? (
          <DataTable
            rows={r.pending}
            rowKey={p => p.code}
            highlightRow={() => 'warn'}
            columns={[
              { key: 'code', label: 'Mã', nowrap: true, render: p => <span className="mono font-semibold">{p.code}</span> },
              { key: 'name', label: 'Tên' },
              { key: 'action', label: 'Thao tác', nowrap: true, render: p => <Chip tone={p.action === 'Thêm mới' ? 'g' : p.action === 'Ngừng dùng' ? 'r' : 'o'}>{p.action}</Chip> },
              { key: 'by', label: 'Người gửi', nowrap: true },
              { key: 'at', label: 'Thời điểm', nowrap: true, render: p => <span className="mono text-[11.5px]">{p.at}</span> },
              { key: 'note', label: 'Ghi chú' },
              {
                key: 'act', label: '', align: 'right', nowrap: true,
                render: p => (
                  <RowActions>
                    <ActionButton variant="ghost" onClick={() => toast.warn('Đã yêu cầu chỉnh sửa', `Bản ghi ${p.code} chuyển về người gửi.`)}>Yêu cầu sửa</ActionButton>
                    <ActionButton onClick={() => toast.success('Đã phê duyệt', `Bản ghi ${p.code} có hiệu lực từ bây giờ (demo).`)}>Duyệt</ActionButton>
                  </RowActions>
                ),
              },
            ]}
          />
        ) : <EmptyState text="Không có bản ghi nào chờ duyệt" />
      )}

      {tab === 'log' && (
        <DataTable
          rows={[
            { at: '2026-08-07 14:22', by: 'Lê Minh Tuấn', act: 'Gửi duyệt thêm mới', detail: 'DT043 — Đối tác G' },
            { at: '2026-08-06 09:10', by: 'Nguyễn Thị Phương', act: 'Gửi duyệt ngừng dùng', detail: 'DT004 — Đối tác D' },
            { at: '2026-08-04 10:02', by: 'Nguyễn Thị Phương', act: 'Phê duyệt phiên bản', detail: 'v12 có hiệu lực' },
            { at: '2026-05-18 16:40', by: 'Lê Minh Tuấn', act: 'Sửa định nghĩa trường', detail: 'Bổ sung trường ngay_hieu_luc' },
          ]}
          columns={[
            { key: 'at', label: 'Thời điểm', nowrap: true, render: x => <span className="mono text-[11.5px]">{x.at}</span> },
            { key: 'by', label: 'Người thực hiện', nowrap: true },
            { key: 'act', label: 'Thao tác', nowrap: true, render: x => <Chip tone="n">{x.act}</Chip> },
            { key: 'detail', label: 'Chi tiết' },
          ]}
        />
      )}

      <Modal open={!!cmp} onClose={() => setCmp(null)} title={cmp && `So sánh ${cmp.version} với phiên bản trước`} size="lg">
        {cmp && (
          <div className="space-y-3">
            <InfoGrid
              cols={4}
              items={[
                { label: 'Phiên bản', value: cmp.version },
                { label: 'Thêm mới', value: <span className="font-bold text-emerald-600">+{cmp.added}</span> },
                { label: 'Loại bỏ', value: <span className="font-bold text-red-600">−{cmp.removed}</span> },
                { label: 'Sửa đổi', value: <span className="font-bold text-amber-600">~{cmp.changed}</span> },
              ]}
            />
            <div className="overflow-hidden rounded-lg border border-slate-800">
              <pre className="mono bg-slate-900 px-3 py-3 text-[11.5px] leading-relaxed text-slate-200">
                <span className="block bg-[#123522] text-[#75E0A7]">+ DT006 | Đối tác F | Viễn thông | Đang hợp tác | 2025-09-01</span>
                <span className="block bg-[#3D1D1D] text-[#FDA29B]">- DT004 | Đối tác D | Ngân hàng | Đang hợp tác | 2022-08-20</span>
                <span className="block bg-[#123522] text-[#75E0A7]">+ DT004 | Đối tác D | Ngân hàng | Tạm dừng     | 2022-08-20</span>
                <span className="block text-slate-500">  DT001 | Đối tác A | Ngân hàng | Đang hợp tác | 2023-01-01</span>
                <span className="block text-slate-500">  DT002 | Đối tác B | Ví điện tử| Đang hợp tác | 2023-06-15</span>
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export function RefdataCreate() {
  const save = useDemoSave('/catalog/refdata')
  const [f, setF] = useState({ name: '', description: '', owner: '' })
  const [fields, setFields] = useState([{ name: 'ma', type: 'string', required: true, key: true, format: '' }])
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }))

  return (
    <>
      <PageHeader
        code="1.5"
        title="Thêm danh mục tham chiếu"
        desc="Định nghĩa cấu trúc trường trước, sau đó nạp dữ liệu bằng file hoặc nhập tay"
        crumbs={[{ label: 'Data Catalog' }, { label: 'Danh mục tham chiếu', href: '/catalog/refdata' }, { label: 'Thêm mới' }]}
      />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 items-start">
        <Panel title="Thông tin danh mục">
          <div className="space-y-4">
            <Field label="Tên danh mục" required><TextInput value={f.name} onChange={set('name')} placeholder="Danh mục đối tác" /></Field>
            <Field label="Mô tả" required><TextArea rows={3} value={f.description} onChange={set('description')} /></Field>
            <Field label="Người phụ trách" required>
              <SelectInput value={f.owner} onChange={set('owner')}>
                <option value="">— Chọn —</option>
                {usersByRole().map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </SelectInput>
            </Field>
            <Note tone="info" title="Danh mục này sẽ dùng ở đâu">
              Sau khi phê duyệt, danh mục xuất hiện trong danh sách chọn của loại kiểm tra
              <b> "Mã phải tồn tại trong danh mục" (RL-11)</b> ở menu 3.2.
            </Note>
          </div>
        </Panel>

        <Panel
          title="Định nghĩa trường"
          actions={<ActionButton variant="ghost" icon="plus" onClick={() => setFields(p => [...p, { name: '', type: 'string', required: false, key: false, format: '' }])}>Thêm trường</ActionButton>}
        >
          <div className="space-y-2">
            {fields.map((fl, i) => (
              <div key={i} className="grid grid-cols-[1.4fr_1fr_auto_auto_1.2fr_auto] items-end gap-2 rounded-lg border border-slate-200 p-2.5">
                <Field label="Tên trường"><TextInput mono value={fl.name} onChange={e => setFields(p => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></Field>
                <Field label="Kiểu">
                  <SelectInput value={fl.type} onChange={e => setFields(p => p.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}>
                    {REFDATA_FIELD_TYPES.map(t => <option key={t}>{t}</option>)}
                  </SelectInput>
                </Field>
                <label className="flex flex-col items-center gap-1 pb-2 text-[11px] text-slate-500">
                  Bắt buộc
                  <input type="checkbox" checked={fl.required} onChange={e => setFields(p => p.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)))} />
                </label>
                <label className="flex flex-col items-center gap-1 pb-2 text-[11px] text-slate-500">
                  Khoá
                  <input type="checkbox" checked={fl.key} onChange={e => setFields(p => p.map((x, j) => (j === i ? { ...x, key: e.target.checked } : x)))} />
                </label>
                <Field label="Định dạng (regex)"><TextInput mono value={fl.format} onChange={e => setFields(p => p.map((x, j) => (j === i ? { ...x, format: e.target.value } : x)))} placeholder="^DT[0-9]{3}$" /></Field>
                <button onClick={() => setFields(p => p.filter((_, j) => j !== i))} className="mb-2 rounded px-2 py-1 text-[12px] text-red-500 hover:bg-red-50">Xoá</button>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/catalog/refdata">Huỷ</ActionButton>
        <ActionButton disabled={!f.name || !f.owner || !fields.some(x => x.name)} onClick={() => save('Đã tạo danh mục tham chiếu')}>Lưu và gửi duyệt</ActionButton>
      </div>
    </>
  )
}
