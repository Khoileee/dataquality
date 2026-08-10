import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  PageHeader, KpiRow, FilterBar, DataTable, Panel, Note, Chip, StatusChip, ActionButton,
  IconBtn, RowActions, EntityLink, InfoGrid, RouteTabs, TreeView, CodeBlock, Modal, useToast,
  Field, TextInput, TextArea, SelectInput, Steps, SectionTitle, OptionCards, Toggle, EmptyState,
} from '@/components/common'
import { policies, POLICY_PRECEDENCE, MASK_TYPES, tags, tagById, columns, tables, groups, users, STATS, fmt, CONFIDENTIALITY_LEVELS } from '@/data'
import { match, useDemoSave } from '@/lib/demo'
import { PermReport } from '@/pages/security/Audit'

const KIND_BY_TAB: Record<string, string> = {
  data: 'Quyền dữ liệu',
  mask: 'Che dữ liệu',
  rowfilter: 'Lọc theo dòng',
  download: 'Hạn chế tải xuống',
}

export function Policies() {
  const { pathname } = useLocation()
  const tab = pathname.split('/').pop() || 'data'
  const [q, setQ] = useState('')
  const [activeTag, setActiveTag] = useState('PD_SENSITIVE')

  const rows = useMemo(() => {
    if (tab === 'by-tag') return policies.filter(p => p.source === 'Kế thừa nhãn')
    return policies.filter(p => p.kind === KIND_BY_TAB[tab] && match(`${p.id} ${p.subject} ${p.scope}`, q))
  }, [tab, q])

  const base = '/security/policies'

  return (
    <>
      <PageHeader
        code="5.2"
        title="Chính sách truy cập"
        desc="Một nơi duy nhất cho mọi chính sách trên DỮ LIỆU — quyền, che dữ liệu, lọc theo dòng, hạn chế tải xuống"
        crumbs={[{ label: 'Data Security' }, { label: 'Chính sách truy cập' }]}
        actions={
          <>
            {tab === 'mask' && <ActionButton icon="plus" to="/security/policies/mask/create">Thêm chính sách che</ActionButton>}
            {tab === 'rowfilter' && <ActionButton icon="plus" to="/security/policies/rowfilter/create">Thêm điều kiện lọc</ActionButton>}
            {(tab === 'data' || tab === 'download') && <ActionButton icon="plus">Thêm chính sách</ActionButton>}
          </>
        }
      />

      <KpiRow
        items={[
          { label: 'Tổng chính sách', value: fmt(STATS.totalPolicies), sub: `${fmt(STATS.policiesByGroup)} theo nhóm · ${fmt(STATS.policiesByUser)} theo người` },
          { label: 'Vô thời hạn', value: `${Math.round((STATS.policiesNoExpiry / STATS.totalPolicies) * 100)}%`, sub: fmt(STATS.policiesNoExpiry), tone: 'bad' },
          { label: 'Nguồn “Thủ công”', value: `${Math.round((STATS.policiesManualSource / STATS.totalPolicies) * 100)}%`, sub: `${fmt(STATS.policiesManualSource)} — không truy được lý do cấp`, tone: 'bad' },
          { label: 'Cột nhạy cảm đã che', value: `${STATS.maskedColumns}/${STATS.sensitiveColumns}`, sub: 'chính sách che theo nhãn mới ban hành', tone: 'warn' },
          { label: 'Bảng trùng do phân quyền chi nhánh', value: STATS.duplicateTablesForBranchAcl, sub: 'bỏ được nhờ lọc theo dòng', tone: 'warn' },
        ]}
      />

      <div className="mt-4">
        <RouteTabs
          items={[
            { label: 'Quyền dữ liệu', to: `${base}/data`, badge: policies.filter(p => p.kind === 'Quyền dữ liệu').length },
            { label: 'Che dữ liệu', to: `${base}/mask`, badge: policies.filter(p => p.kind === 'Che dữ liệu').length },
            { label: 'Lọc theo dòng', to: `${base}/rowfilter`, badge: policies.filter(p => p.kind === 'Lọc theo dòng').length },
            { label: 'Hạn chế tải xuống', to: `${base}/download`, badge: policies.filter(p => p.kind === 'Hạn chế tải xuống').length },
            { label: 'Chính sách theo nhãn', to: `${base}/by-tag` },
            { label: 'Báo cáo quyền', to: `${base}/report` },
          ]}
        />
      </div>

      {tab === 'data' && (
        <>
          <FilterBar placeholder="Tìm theo đối tượng được cấp, phạm vi…" value={q} onChange={setQ} right={<span className="text-[12px] text-slate-400">{rows.length} chính sách</span>} />
          <DataTable
            stt
            rows={rows}
            rowKey={p => p.id}
            highlightRow={p => (p.expiry === 'Vô thời hạn' ? 'warn' : p.status !== 'Đang hiệu lực' ? 'bad' : undefined)}
            columns={[
              { key: 'id', label: 'Mã', nowrap: true, render: p => <span className="mono text-[12px] font-semibold">{p.id}</span> },
              { key: 'subject', label: 'Đối tượng được cấp', width: '20%', render: p => <div><div className="font-semibold text-slate-800">{p.subject}</div><Chip tone="n">{p.subjectType}</Chip></div> },
              { key: 'scopeLevel', label: 'Phạm vi', width: '18%', render: p => <div><Chip tone="t">{p.scopeLevel}</Chip><div className="mt-0.5 text-[11.5px] text-slate-500">{p.scope}</div></div> },
              { key: 'right', label: 'Quyền', nowrap: true },
              { key: 'excludedColumns', label: 'Cột loại trừ', render: p => (p.excludedColumns.length ? <div className="flex flex-wrap gap-1">{p.excludedColumns.map(c => <Chip key={c} tone="r">{c}</Chip>)}</div> : '—') },
              { key: 'expiry', label: 'Thời hạn', nowrap: true, render: p => <span className={p.expiry === 'Vô thời hạn' ? 'font-semibold text-red-600' : ''}>{p.expiry}</span> },
              { key: 'source', label: 'Nguồn', nowrap: true, render: p => (p.sourceRef ? <EntityLink to={`/security/requests/${p.sourceRef}`}>{p.sourceRef}</EntityLink> : <Chip tone={p.source === 'Thủ công' ? 'o' : 'n'}>{p.source}</Chip>) },
              { key: 'status', label: 'Trạng thái', nowrap: true, render: p => <Chip tone={p.status === 'Đang hiệu lực' ? 'g' : 'n'}>{p.status}</Chip> },
              { key: 'act', label: '', align: 'right', nowrap: true, render: () => <RowActions><IconBtn icon="edit" title="Sửa" /><IconBtn icon="delete" title="Thu hồi" tone="danger" /></RowActions> },
            ]}
          />
          <Note tone="bad" title="87% chính sách quyền không có thời hạn" className="mt-4">
            GĐ4 · FR-03 yêu cầu <i>"cấp quyền theo vai trò, đơn vị, mục đích và <b>thời hạn</b>; tự động thu hồi khi hết hạn"</i>.
            Hiện <b>{fmt(STATS.policiesNoExpiry)}/{fmt(STATS.totalPolicies)}</b> chính sách vô thời hạn và
            <b> {fmt(STATS.policiesManualSource)}</b> chính sách có nguồn <i>Thủ công</i> — không truy được ai xin, vì mục đích gì.
          </Note>
        </>
      )}

      {tab === 'mask' && <MaskTab rows={rows} />}
      {tab === 'rowfilter' && <RowFilterTab rows={rows} />}
      {tab === 'download' && <DownloadTab rows={rows} />}
      {tab === 'by-tag' && <ByTagTab activeTag={activeTag} setActiveTag={setActiveTag} />}
      {tab === 'report' && <PermReport embedded />}
    </>
  )
}

/* ── Tab Che dữ liệu ── */
function MaskTab({ rows }: { rows: any[] }) {
  return (
    <>
      <Note tone="bad" title="Tính năng này chưa tồn tại trong SQLWF — đã kiểm tra mã nguồn" className="mb-4">
        Mã nguồn SQLWF <b>không có trường</b> <span className="mono">maskType</span> nào. Nhãn <span className="mono">tagIds</span> hiện chỉ dùng để
        <b> chặn hàm SQL</b>, không che được một phần giá trị. Nghĩa là <b>{STATS.sensitiveColumns} cột</b> chứa số điện thoại và số căn cước
        đang <b>trả về nguyên giá trị</b> cho mọi người có quyền đọc bảng.
      </Note>

      <DataTable
        stt
        rows={rows}
        rowKey={p => p.id}
        columns={[
          { key: 'id', label: 'Mã', nowrap: true, render: p => <span className="mono text-[12px] font-semibold">{p.id}</span> },
          { key: 'subject', label: 'Áp cho ai', width: '20%' },
          { key: 'scope', label: 'Phạm vi', width: '20%', render: p => <div><Chip tone="t">{p.scopeLevel}</Chip><div className="mt-0.5 text-[11.5px]">{p.scope}</div></div> },
          { key: 'maskType', label: 'Kiểu che', nowrap: true, render: p => <Chip tone="p">{p.maskType}</Chip> },
          { key: 'source', label: 'Nguồn', nowrap: true, render: p => <Chip tone="n">{p.source}</Chip> },
          { key: 'createdAt', label: 'Ngày tạo', nowrap: true },
          { key: 'status', label: 'Trạng thái', nowrap: true, render: p => <Chip tone="g">{p.status}</Chip> },
          { key: 'act', label: '', align: 'right', nowrap: true, render: () => <RowActions><IconBtn icon="edit" title="Sửa" /><IconBtn icon="delete" title="Xoá" tone="danger" /></RowActions> },
        ]}
      />

      <div className="mt-4 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title="Tám kiểu che dữ liệu">
          <DataTable
            dense
            rows={MASK_TYPES}
            rowKey={m => m.id}
            columns={[
              { key: 'name', label: 'Kiểu che', nowrap: true, render: m => <span className="font-semibold">{m.name}</span> },
              { key: 'sample', label: 'Giá trị gốc', render: m => <span className="mono text-[11.5px]">{m.sample}</span> },
              { key: 'masked', label: 'Người dùng thấy', render: m => <span className="mono text-[11.5px] font-bold text-blue-700">{m.masked}</span> },
              { key: 'sql', label: 'Câu SQL viết lại', render: m => <span className="mono text-[10.5px] text-slate-500">{m.sql}</span> },
            ]}
          />
        </Panel>

        <div className="space-y-4">
          <Panel title="Đường đi của câu truy vấn">
            <CodeBlock dark>
              <span className="block text-slate-500">-- Người dùng gõ:</span>
              <span className="block"><span className="text-[#93B4FF]">SELECT</span> ma_giao_dich, so_dien_thoai</span>
              <span className="block"><span className="text-[#93B4FF]">FROM</span> bi.doi_soat_giao_dich_A</span>
              <span className="block text-slate-500">{'\n'}-- Cổng truy vấn viết lại thành:</span>
              <span className="block"><span className="text-[#93B4FF]">SELECT</span> ma_giao_dich,</span>
              <span className="block">  <span className="text-[#FFD479]">CONCAT(REPEAT('*', LENGTH(so_dien_thoai)-4),</span></span>
              <span className="block">  <span className="text-[#FFD479]">       RIGHT(so_dien_thoai, 4))</span> <span className="text-[#93B4FF]">AS</span> so_dien_thoai</span>
              <span className="block"><span className="text-[#93B4FF]">FROM</span> bi.doi_soat_giao_dich_A</span>
              <span className="block"><span className="text-[#93B4FF]">WHERE</span> ma_tinh_thanh <span className="text-[#93B4FF]">IN</span> (<span className="text-[#FFD479]">'01','79'</span>) <span className="text-slate-500">-- lọc theo dòng</span></span>
            </CodeBlock>
          </Panel>

          <Note tone="bad" title="Hai lỗ hổng phải bịt">
            <b>① Xuất dữ liệu ra ngoài</b> — màn tải file và giao dữ liệu cho đối tác không đi qua cổng truy vấn nên không bị che. Phải chặn ở menu 5.2 tab Hạn chế tải xuống.<br />
            <b>② Truy vấn qua công cụ ngoài</b> — người dùng kết nối trực tiếp bằng JDBC bỏ qua cổng. Phải chặn ở tầng kết nối, chỉ cho phép qua cổng truy vấn.
          </Note>
        </div>
      </div>
    </>
  )
}

/* ── Tab Lọc theo dòng ── */
function RowFilterTab({ rows }: { rows: any[] }) {
  return (
    <>
      <DataTable
        stt
        rows={rows}
        rowKey={p => p.id}
        columns={[
          { key: 'id', label: 'Mã', nowrap: true, render: p => <span className="mono text-[12px] font-semibold">{p.id}</span> },
          { key: 'subject', label: 'Áp cho ai', width: '18%' },
          { key: 'scope', label: 'Bảng', nowrap: true, render: p => <EntityLink to={`/catalog/tables/${encodeURIComponent(p.scope)}`}>{p.scope}</EntityLink> },
          { key: 'rowFilter', label: 'Điều kiện lọc', width: '32%', render: p => <span className="mono text-[11.5px] text-blue-700">{p.rowFilter}</span> },
          { key: 'expiry', label: 'Thời hạn', nowrap: true },
          { key: 'createdBy', label: 'Người tạo', nowrap: true },
          { key: 'status', label: 'Trạng thái', nowrap: true, render: p => <Chip tone="g">{p.status}</Chip> },
          { key: 'act', label: '', align: 'right', nowrap: true, render: () => <RowActions><IconBtn icon="edit" title="Sửa" /><IconBtn icon="delete" title="Xoá" tone="danger" /></RowActions> },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-4 items-start">
        <Panel title="Cơ chế nối điều kiện">
          <CodeBlock dark>
            <span className="block text-slate-500">-- Nhiều chính sách lọc cùng áp lên một người</span>
            <span className="block text-slate-500">-- được nối bằng AND, không phải OR</span>
            <span className="block">{'\n'}<span className="text-[#93B4FF]">WHERE</span> (ma_tinh_thanh <span className="text-[#93B4FF]">IN</span> (<span className="text-[#FFD479]">${'{user.tinh_thanh}'}</span>))</span>
            <span className="block">  <span className="text-[#93B4FF]">AND</span> (trang_thai = <span className="text-[#FFD479]">'ACTIVE'</span>)</span>
            <span className="block">  <span className="text-[#93B4FF]">AND</span> (ngay_giao_dich &gt;= <span className="text-[#FFD479]">ADD_MONTHS(CURRENT_DATE, -12)</span>)</span>
          </CodeBlock>
          <Note tone="warn" title="Nối bằng AND nên càng nhiều chính sách càng chặt" className="mt-3">
            Người thuộc nhiều nhóm sẽ bị áp giao của mọi điều kiện. Nếu người dùng báo <i>"không thấy dữ liệu"</i>,
            kiểm tra ở menu 5.2 xem có bao nhiêu điều kiện đang chồng lên nhau.
          </Note>
        </Panel>

        <div className="space-y-4">
          <Panel title="Hai kiểu điều kiện lọc">
            <DataTable
              dense
              rows={[
                { kind: 'Tĩnh', ex: "trang_thai = 'ACTIVE'", when: 'Điều kiện giống nhau cho mọi người trong nhóm' },
                { kind: 'Động theo người dùng', ex: '${user.don_vi} = don_vi_quan_ly', when: 'Mỗi người thấy phần dữ liệu của mình — thay thế 41 bảng sao chép' },
              ]}
              columns={[
                { key: 'kind', label: 'Kiểu', nowrap: true, render: r => <Chip tone={r.kind === 'Tĩnh' ? 'n' : 'p'}>{r.kind}</Chip> },
                { key: 'ex', label: 'Ví dụ', render: r => <span className="mono text-[11px]">{r.ex}</span> },
                { key: 'when', label: 'Dùng khi nào' },
              ]}
            />
          </Panel>

          <Note tone="ok" title={`Bỏ được ${STATS.duplicateTablesForBranchAcl} bảng sao chép`}>
            Hiện có <b>{STATS.duplicateTablesForBranchAcl} bảng</b> được sao chép chỉ để phân quyền theo chi nhánh —
            cùng cấu trúc, chỉ khác dữ liệu lọc sẵn. Một điều kiện lọc theo dòng động thay thế được toàn bộ,
            tiết kiệm dung lượng lưu trữ và bỏ được {STATS.duplicateTablesForBranchAcl} job đồng bộ.
          </Note>
        </div>
      </div>
    </>
  )
}

/* ── Tab Hạn chế tải xuống ── */
function DownloadTab({ rows }: { rows: any[] }) {
  return (
    <>
      <Note tone="warn" title="Bổ sung sau review — gap D8" className="mb-4">
        GĐ4 · FR-04 yêu cầu <i>"hạn chế tải xuống đối với dữ liệu mức Mật/Hạn chế truy cập, hoặc yêu cầu phê duyệt riêng khi tải xuống"</i>.
        Chính sách này viết theo <b>mức phân loại</b> (trục 1), khác với chính sách che viết theo <b>nhãn dữ liệu nhạy cảm</b> (trục 2).
      </Note>

      <DataTable
        stt
        rows={rows}
        rowKey={p => p.id}
        columns={[
          { key: 'id', label: 'Mã', nowrap: true, render: p => <span className="mono text-[12px] font-semibold">{p.id}</span> },
          { key: 'subject', label: 'Áp cho ai', width: '22%' },
          { key: 'scope', label: 'Phạm vi', width: '26%' },
          { key: 'right', label: 'Quy tắc', render: p => <Chip tone={p.right.includes('Cấm') ? 'r' : 'o'}>{p.right}</Chip> },
          { key: 'source', label: 'Nguồn', nowrap: true, render: p => <Chip tone="n">{p.source}</Chip> },
          { key: 'status', label: 'Trạng thái', nowrap: true, render: p => <Chip tone="g">{p.status}</Chip> },
        ]}
      />

      <Panel title="Quy tắc mặc định theo mức phân loại" className="mt-4">
        <DataTable
          dense
          rows={CONFIDENTIALITY_LEVELS}
          rowKey={l => l.id}
          columns={[
            { key: 'id', label: 'Mức phân loại', nowrap: true, render: l => <StatusChip value={l.id} /> },
            { key: 'objectCount', label: 'Số đối tượng', align: 'right', nowrap: true, render: l => fmt(l.objectCount) },
            { key: 'download', label: 'Quy tắc tải xuống', render: l => <span className="font-semibold">{l.defaultRules.find(r => r.toLowerCase().includes('tải xuống')) ?? 'Không giới hạn'}</span> },
            { key: 'other', label: 'Quy tắc khác', render: l => <span className="text-[11.5px] text-slate-500">{l.defaultRules.filter(r => !r.toLowerCase().includes('tải xuống')).join(' · ')}</span> },
          ]}
        />
      </Panel>
    </>
  )
}

/* ── Tab Chính sách theo nhãn ── */
function ByTagTab({ activeTag, setActiveTag }: { activeTag: string; setActiveTag: (v: string) => void }) {
  const tag = tagById(activeTag)
  const roots = tags.filter(t => !t.parentId)
  const treeNodes = roots.map(r => ({
    id: r.id,
    label: <span className="mono text-[11.5px]">{r.id}</span>,
    count: r.columnCount,
    children: tags.filter(c => c.parentId === r.id).map(c => ({ id: c.id, label: <span className="mono text-[11.5px]">{c.id}</span>, count: c.columnCount })),
  }))

  return (
    <div className="grid grid-cols-[250px_minmax(0,1fr)] gap-4 items-start">
      <Panel title="Cây nhãn">
        <TreeView nodes={treeNodes} activeId={activeTag} onPick={setActiveTag} />
      </Panel>

      <div className="space-y-4">
        {tag && (
          <Panel title={`Chính sách áp cho ${tag.columnCount} cột mang nhãn ${tag.id}`}>
            <DataTable
              rows={[
                { p: 'Che dữ liệu', v: tag.defaultMask ?? '— không che', who: 'Mọi người trừ Người sở hữu dữ liệu', tone: tag.defaultMask ? 'g' : 'n' },
                { p: 'Mức phân loại tối thiểu', v: tag.defaultConfidentiality, who: 'Bảng chứa cột được nâng lên mức này', tone: 'b' },
                { p: 'Hạn chế tải xuống', v: tag.sensitivity === 'Cao' ? 'Cấm tải xuống' : 'Ghi nhật ký', who: 'Người dùng thường', tone: tag.sensitivity === 'Cao' ? 'r' : 'n' },
                { p: 'Cảnh báo truy cập bất thường', v: tag.sensitivity === 'Cao' ? 'Bật — ngưỡng 50.000 dòng' : 'Tắt', who: 'Giám sát ở menu 5.2', tone: tag.sensitivity === 'Cao' ? 'o' : 'n' },
                { p: 'Thời hạn quyền tối đa', v: tag.sensitivity === 'Cao' ? '3 tháng' : '6 tháng', who: 'Áp khi phê duyệt yêu cầu cấp quyền', tone: 'b' },
              ]}
              columns={[
                { key: 'p', label: 'Chính sách', nowrap: true, render: r => <span className="font-semibold">{r.p}</span> },
                { key: 'v', label: 'Giá trị áp dụng', render: r => <Chip tone={r.tone as any}>{r.v}</Chip> },
                { key: 'who', label: 'Áp cho ai' },
              ]}
            />
            <Note tone="info" title="Nguyên tắc RB3 — chính sách viết theo nhãn, không theo tên cột" className="mt-3">
              Gắn nhãn một lần ở menu 2.2, chính sách tự áp cho <b>toàn bộ {fmt(tag.columnCount)} cột</b> mang nhãn đó.
              Cột mới thêm sau này mang nhãn cũng tự được bảo vệ, không cần khai lại.
              Đây là điều kiện bắt buộc để scale lên {fmt(STATS.totalTables)} bảng.
            </Note>
          </Panel>
        )}

        <Panel title="Thứ tự ưu tiên khi nhiều chính sách cùng áp">
          <DataTable
            dense
            rows={POLICY_PRECEDENCE}
            rowKey={p => String(p.level)}
            columns={[
              { key: 'level', label: 'Ưu tiên', align: 'center', nowrap: true, render: p => <Chip tone={p.level === 1 ? 'r' : p.level === 2 ? 'o' : 'n'}>{p.level}</Chip> },
              { key: 'name', label: 'Loại chính sách', render: p => <span className="font-semibold">{p.name}</span> },
              { key: 'note', label: 'Ghi chú' },
            ]}
          />
        </Panel>
      </div>
    </div>
  )
}

/* ═════════ Thêm chính sách che ═════════ */

export function MaskCreate() {
  const save = useDemoSave('/security/policies/mask')
  const [step, setStep] = useState(0)
  const [scopeKind, setScopeKind] = useState<'tag' | 'column' | 'name'>('tag')
  const [tagId, setTagId] = useState('PII_PHONE')
  const [maskType, setMaskType] = useState('last4')
  const [exceptRoles, setExceptRoles] = useState<string[]>(['G-OWNER'])

  const tag = tagById(tagId)
  const mask = MASK_TYPES.find(m => m.id === maskType)!
  const affectedCols = columns.filter(c => c.tags.includes(tagId))

  return (
    <>
      <PageHeader
        code="5.2"
        title="Thêm chính sách che dữ liệu"
        desc="Che dữ liệu nhạy cảm khi hiển thị cho người không đủ quyền xem đầy đủ (GĐ4 · FR-04)"
        crumbs={[{ label: 'Data Security' }, { label: 'Chính sách truy cập', href: '/security/policies/mask' }, { label: 'Thêm chính sách che' }]}
      />
      <Steps items={['Phạm vi áp dụng', 'Kiểu che', 'Áp cho ai', 'Xem lại tác động']} current={step} onJump={setStep} />

      <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title={['Chọn phạm vi áp dụng', 'Chọn kiểu che dữ liệu', 'Áp cho ai và ngoại lệ', 'Xem lại tác động'][step]}>
          {step === 0 && (
            <div className="space-y-4">
              <Field label="Viết chính sách theo" required hint="Khuyến nghị viết theo nhãn để tự áp cho cột mới thêm sau này">
                <OptionCards
                  cols={3}
                  value={scopeKind}
                  onChange={v => setScopeKind(v as any)}
                  options={[
                    { id: 'tag', label: 'Theo nhãn', desc: 'Áp cho mọi cột mang nhãn — khuyến nghị' },
                    { id: 'column', label: 'Theo cột cụ thể', desc: 'Chỉ áp cho một cột đích danh' },
                    { id: 'name', label: 'Theo tên cột', desc: 'Áp cho mọi cột có tên khớp mẫu' },
                  ]}
                />
              </Field>

              {scopeKind === 'tag' && (
                <Field label="Nhãn dữ liệu nhạy cảm" required>
                  <SelectInput value={tagId} onChange={e => setTagId(e.target.value)}>
                    {tags.filter(t => t.id !== 'DATA_GENERAL').map(t => <option key={t.id} value={t.id}>{t.id} — {t.name} ({t.columnCount} cột)</option>)}
                  </SelectInput>
                </Field>
              )}
              {scopeKind === 'column' && (
                <Field label="Cột" required>
                  <SelectInput>
                    {columns.filter(c => c.tags.length).map(c => <option key={`${c.tableId}.${c.name}`}>{c.tableId}.{c.name}</option>)}
                  </SelectInput>
                </Field>
              )}
              {scopeKind === 'name' && (
                <Field label="Mẫu tên cột" required hint="Biểu thức chính quy khớp tên cột">
                  <TextInput mono defaultValue="^(so_dien_thoai|sdt|msisdn|phone)$" />
                </Field>
              )}

              {scopeKind === 'tag' && tag && (
                <Note tone="warn" title={`Chính sách sẽ áp cho ${fmt(tag.columnCount)} cột`}>
                  Mọi cột đang mang nhãn <span className="mono">{tag.id}</span> và mọi cột <b>sẽ được gắn nhãn này trong tương lai</b> đều tự động áp chính sách.
                </Note>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <Field label="Kiểu che" required>
                <div className="grid grid-cols-2 gap-2">
                  {MASK_TYPES.map(m => (
                    <label key={m.id} className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition ${maskType === m.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" className="mt-1" checked={maskType === m.id} onChange={() => setMaskType(m.id)} />
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-semibold text-slate-800">{m.name}</span>
                        <span className="mono block text-[10.5px] text-slate-500">{m.sample} → <b className="text-blue-700">{m.masked}</b></span>
                      </span>
                    </label>
                  ))}
                </div>
              </Field>

              <div>
                <SectionTitle>Câu SQL viết lại tương ứng</SectionTitle>
                <CodeBlock dark title={`Kiểu che: ${mask.name}`}>
                  <span className="block text-slate-500">-- Người dùng gõ:</span>
                  <span className="block"><span className="text-[#93B4FF]">SELECT</span> {scopeKind === 'tag' ? 'so_dien_thoai' : 'cot_nhay_cam'} <span className="text-[#93B4FF]">FROM</span> bang</span>
                  <span className="block text-slate-500">{'\n'}-- Cổng truy vấn viết lại:</span>
                  <span className="block"><span className="text-[#93B4FF]">SELECT</span> <span className="text-[#FFD479]">{mask.sql.replace('{cot}', scopeKind === 'tag' ? 'so_dien_thoai' : 'cot_nhay_cam')}</span></span>
                  <span className="block">  <span className="text-[#93B4FF]">AS</span> {scopeKind === 'tag' ? 'so_dien_thoai' : 'cot_nhay_cam'} <span className="text-[#93B4FF]">FROM</span> bang</span>
                  <span className="block text-slate-500">{'\n'}-- Kết quả người dùng thấy: {mask.masked}</span>
                </CodeBlock>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Áp cho ai" required>
                <OptionCards
                  cols={2}
                  value="all"
                  onChange={() => {}}
                  options={[
                    { id: 'all', label: 'Mọi người trừ ngoại lệ', desc: 'Khuyến nghị — mặc định che, chỉ mở cho người có nhu cầu' },
                    { id: 'group', label: 'Chỉ nhóm chỉ định', desc: 'Che có chọn lọc — dễ sót người' },
                  ]}
                />
              </Field>

              <Field label="Ngoại lệ — ai được xem đầy đủ" hint="Mọi lượt xem đầy đủ đều được ghi nhật ký kiểm toán">
                <div className="space-y-1.5">
                  {[
                    { id: 'G-OWNER', label: 'Người sở hữu dữ liệu', note: 'Chịu trách nhiệm về dữ liệu mình sở hữu' },
                    { id: 'G-ADMIN', label: 'Đơn vị vận hành hệ thống', note: 'Cần cho vận hành và xử lý sự cố' },
                    { id: 'G-RUIRO', label: 'Ban Quản lý Rủi ro', note: 'Yêu cầu tuân thủ pháp lý — cần có phê duyệt riêng' },
                  ].map(r => (
                    <label key={r.id} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition ${exceptRoles.includes(r.id) ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}>
                      <input type="checkbox" checked={exceptRoles.includes(r.id)} onChange={() => setExceptRoles(p => (p.includes(r.id) ? p.filter(x => x !== r.id) : [...p, r.id]))} />
                      <span>
                        <span className="block text-[12.5px] font-semibold text-slate-800">{r.label}</span>
                        <span className="block text-[11px] text-slate-500">{r.note}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Note tone="bad" title="Chính sách này sẽ động tới">
                <div className="mt-2 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-red-200 bg-white px-3 py-2">
                    <div className="text-[10.5px] font-bold uppercase text-slate-400">Cột bị che</div>
                    <div className="text-[21px] font-extrabold text-red-600">{fmt(tag?.columnCount ?? 0)}</div>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-white px-3 py-2">
                    <div className="text-[10.5px] font-bold uppercase text-slate-400">Người dùng ảnh hưởng</div>
                    <div className="text-[21px] font-extrabold text-red-600">184</div>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-white px-3 py-2">
                    <div className="text-[10.5px] font-bold uppercase text-slate-400">Báo cáo ảnh hưởng</div>
                    <div className="text-[21px] font-extrabold text-red-600">11</div>
                  </div>
                </div>
                <div className="mt-2.5">
                  <b>Cảnh báo:</b> 11 báo cáo đang hiển thị giá trị đầy đủ của các cột này. Sau khi áp chính sách, báo cáo sẽ hiện giá trị đã che
                  trừ khi người xem thuộc nhóm ngoại lệ. Cần thông báo trước cho đơn vị sở hữu báo cáo.
                </div>
              </Note>

              <div>
                <SectionTitle>Cột sẽ bị che (hiển thị {affectedCols.length} cột đã khai chi tiết)</SectionTitle>
                <DataTable
                  dense
                  rows={affectedCols}
                  rowKey={c => `${c.tableId}.${c.name}`}
                  empty="Không có cột nào đã khai chi tiết mang nhãn này"
                  columns={[
                    { key: 'tableId', label: 'Bảng', render: c => <EntityLink to={`/catalog/tables/${encodeURIComponent(c.tableId)}/columns`}>{c.tableId}</EntityLink> },
                    { key: 'name', label: 'Cột', nowrap: true, render: c => <span className="mono font-semibold">{c.name}</span> },
                    { key: 'description', label: 'Mô tả' },
                    { key: 'conf', label: 'Phân loại', nowrap: true, render: c => <StatusChip value={c.confidentiality} /> },
                    { key: 'after', label: 'Sau khi che', nowrap: true, render: () => <span className="mono font-bold text-blue-700">{mask.masked}</span> },
                  ]}
                />
              </div>
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Xem trước kết quả">
            <div className="space-y-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-[10.5px] font-bold uppercase text-slate-400">Người sở hữu dữ liệu thấy</div>
                <div className="mono mt-1 text-[13px] font-semibold text-slate-800">{mask.sample}</div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="text-[10.5px] font-bold uppercase text-blue-500">Người dùng thường thấy</div>
                <div className="mono mt-1 text-[13px] font-bold text-blue-700">{mask.masked}</div>
              </div>
            </div>
          </Panel>

          <Note tone="info" title="Che dữ liệu không thay dữ liệu gốc">
            Giá trị trong bảng <b>không đổi</b>. Việc che xảy ra ở <b>cổng truy vấn</b> — câu SQL được viết lại trước khi chạy.
            Nghĩa là bật/tắt chính sách có hiệu lực ngay, không cần chạy lại job.
          </Note>
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/security/policies/mask">Huỷ</ActionButton>
        <div className="flex gap-2">
          {step > 0 && <ActionButton variant="ghost" onClick={() => setStep(s => s - 1)}>Quay lại</ActionButton>}
          {step < 3
            ? <ActionButton onClick={() => setStep(s => s + 1)}>Tiếp tục</ActionButton>
            : <ActionButton onClick={() => save('Đã ban hành chính sách che dữ liệu', `Áp cho ${fmt(tag?.columnCount ?? 0)} cột — có hiệu lực ngay.`)}>Ban hành chính sách</ActionButton>}
        </div>
      </div>
    </>
  )
}

/* ═════════ Thêm điều kiện lọc theo dòng ═════════ */

export function RowFilterCreate() {
  const save = useDemoSave('/security/policies/rowfilter')
  const [step, setStep] = useState(0)
  const [subject, setSubject] = useState('G-VANHANH')
  const [table, setTable] = useState('bi.doi_soat_giao_dich_A')
  const [expr, setExpr] = useState('ma_tinh_thanh IN (${user.tinh_thanh_phu_trach})')
  const [tested, setTested] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const toast = useToast()

  const VARS = [
    { v: '${user.account}', d: 'Tài khoản đăng nhập', ex: 'phuong.nt' },
    { v: '${user.don_vi}', d: 'Đơn vị của người dùng', ex: 'Ban Kinh doanh' },
    { v: '${user.tinh_thanh_phu_trach}', d: 'Danh sách tỉnh/thành người dùng phụ trách', ex: "'01','79'" },
    { v: '${user.nhom}', d: 'Danh sách nhóm người dùng thuộc về', ex: "'G-DOISOAT','G-BDA'" },
    { v: '${user.vai_tro}', d: 'Vai trò chính', ex: 'Đầu mối nghiệp vụ' },
  ]

  return (
    <>
      <PageHeader
        code="5.2"
        title="Thêm điều kiện lọc theo dòng"
        desc="Mỗi người chỉ thấy phần dữ liệu thuộc phạm vi của mình — thay cho việc sao chép bảng theo chi nhánh"
        crumbs={[{ label: 'Data Security' }, { label: 'Chính sách truy cập', href: '/security/policies/rowfilter' }, { label: 'Thêm điều kiện lọc' }]}
      />
      <Steps items={['Áp cho ai', 'Bảng áp dụng', 'Biểu thức điều kiện', 'Chạy đối chiếu']} current={step} onJump={setStep} />

      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title={['Chọn đối tượng áp dụng', 'Chọn bảng', 'Viết biểu thức điều kiện', 'Chạy đối chiếu trước khi lưu'][step]}>
          {step === 0 && (
            <Field label="Áp cho nhóm hoặc người dùng" required>
              <SelectInput value={subject} onChange={e => setSubject(e.target.value)}>
                <optgroup label="Nhóm">
                  <option value="G-VANHANH">G-VANHANH — Trung tâm Vận hành</option>
                  <option value="G-BDA">G-BDA — Đầu mối nghiệp vụ</option>
                  <option value="G-RUIRO">G-RUIRO — Ban Quản lý Rủi ro</option>
                  <option value="G-SANPHAM">G-SANPHAM — Ban Sản phẩm</option>
                </optgroup>
                <optgroup label="Người dùng">
                  {users.filter(u => u.employed).map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </optgroup>
              </SelectInput>
            </Field>
          )}

          {step === 1 && (
            <Field label="Bảng áp dụng điều kiện lọc" required>
              <SelectInput value={table} onChange={e => setTable(e.target.value)}>
                {tables.map(t => <option key={t.id} value={t.id}>{t.id} — {t.name}</option>)}
              </SelectInput>
            </Field>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Biểu thức điều kiện" required hint="Viết như mệnh đề WHERE. Biến ${…} được thay bằng giá trị của người đang truy vấn.">
                <div className="overflow-hidden rounded-lg border border-slate-800">
                  <textarea
                    value={expr}
                    onChange={e => { setExpr(e.target.value); setTested(false) }}
                    rows={4}
                    className="mono w-full bg-slate-900 px-3.5 py-3 text-[12px] leading-relaxed text-slate-200 outline-none"
                    spellCheck={false}
                  />
                </div>
              </Field>

              <div>
                <SectionTitle>Năm biến dùng được</SectionTitle>
                <DataTable
                  dense
                  rows={VARS}
                  rowKey={v => v.v}
                  columns={[
                    { key: 'v', label: 'Biến', nowrap: true, render: r => <span className="mono text-[11.5px] font-bold text-amber-600">{r.v}</span> },
                    { key: 'd', label: 'Ý nghĩa' },
                    { key: 'ex', label: 'Giá trị ví dụ', render: r => <span className="mono text-[11px] text-slate-500">{r.ex}</span> },
                    { key: 'act', label: '', align: 'right', nowrap: true, render: r => <ActionButton variant="ghost" onClick={() => { setExpr(e => e + ' ' + r.v); setTested(false) }}>Chèn</ActionButton> },
                  ]}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Note tone={tested ? 'ok' : 'warn'} title={tested ? 'Đã chạy đối chiếu — đạt' : 'Bắt buộc chạy đối chiếu trước khi lưu'}>
                {tested
                  ? 'Điều kiện lọc trả về đúng phạm vi dữ liệu cho cả 5 tài khoản mẫu. Nút lưu đã mở.'
                  : 'Điều kiện lọc sai có thể khiến người dùng không thấy dữ liệu nào, hoặc tệ hơn là thấy dữ liệu không được phép. Phải chạy thử trên 5 tài khoản mẫu trước.'}
              </Note>
              <ActionButton size="md" icon="run" onClick={() => { setTestOpen(true); setTested(true) }}>Chạy đối chiếu 5 tài khoản</ActionButton>

              {tested && (
                <div>
                  <SectionTitle>Kết quả đối chiếu</SectionTitle>
                  <DataTable
                    dense
                    rows={[
                      { who: 'Nguyễn Thị Phương', unit: 'Ban Kinh doanh', before: '12.480.331', after: '3.542.118', ok: true },
                      { who: 'Trần Văn Hùng', unit: 'Đội Dữ liệu', before: '12.480.331', after: '12.480.331', ok: true },
                      { who: 'Phạm Thu Hà', unit: 'Ban Tài chính', before: '12.480.331', after: '12.480.331', ok: true },
                      { who: 'Lê Minh Tuấn', unit: 'Ban Sản phẩm', before: '12.480.331', after: '1.284.006', ok: true },
                      { who: 'Hoàng Hồng Mai', unit: 'Ban Tài chính', before: '12.480.331', after: '842.118', ok: true },
                    ]}
                    columns={[
                      { key: 'who', label: 'Tài khoản', nowrap: true, render: r => <span className="font-semibold">{r.who}</span> },
                      { key: 'unit', label: 'Đơn vị', nowrap: true },
                      { key: 'before', label: 'Số dòng trước lọc', align: 'right', nowrap: true },
                      { key: 'after', label: 'Số dòng sau lọc', align: 'right', nowrap: true, render: r => <span className="font-bold text-blue-700">{r.after}</span> },
                      { key: 'ok', label: 'Đánh giá', nowrap: true, render: r => <Chip tone={r.ok ? 'g' : 'r'}>{r.ok ? 'Đúng phạm vi' : 'Sai phạm vi'}</Chip> },
                    ]}
                  />
                </div>
              )}
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Câu truy vấn sau khi áp">
            <CodeBlock dark>
              <span className="block"><span className="text-[#93B4FF]">SELECT</span> * <span className="text-[#93B4FF]">FROM</span> {table}</span>
              <span className="block"><span className="text-[#93B4FF]">WHERE</span> <span className="text-[#FFD479]">{expr || '/* chưa nhập điều kiện */'}</span></span>
            </CodeBlock>
          </Panel>

          <Note tone="ok" title={`Bỏ được ${STATS.duplicateTablesForBranchAcl} bảng sao chép`}>
            Hiện tại mỗi chi nhánh có một bảng riêng chỉ để phân quyền — cùng cấu trúc, khác dữ liệu.
            Một điều kiện lọc động thay thế được toàn bộ: bỏ {STATS.duplicateTablesForBranchAcl} bảng, {STATS.duplicateTablesForBranchAcl} job đồng bộ,
            và không còn nguy cơ lệch dữ liệu giữa bản gốc và bản sao.
          </Note>
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/security/policies/rowfilter">Huỷ</ActionButton>
        <div className="flex gap-2">
          {step > 0 && <ActionButton variant="ghost" onClick={() => setStep(s => s - 1)}>Quay lại</ActionButton>}
          {step < 3
            ? <ActionButton onClick={() => setStep(s => s + 1)}>Tiếp tục</ActionButton>
            : <ActionButton disabled={!tested} title={!tested ? 'Phải chạy đối chiếu trước khi lưu' : undefined} onClick={() => save('Đã ban hành điều kiện lọc theo dòng')}>Ban hành</ActionButton>}
        </div>
      </div>

      <Modal open={testOpen} onClose={() => setTestOpen(false)} title="Kết quả chạy đối chiếu" desc="Kiểm tra điều kiện lọc trên 5 tài khoản mẫu" footer={<ActionButton onClick={() => setTestOpen(false)}>Đã hiểu</ActionButton>}>
        <div className="space-y-3">
          <Note tone="ok" title="Cả 5 tài khoản đều trả về đúng phạm vi">
            Không có tài khoản nào thấy 0 dòng, cũng không có tài khoản nào thấy dữ liệu ngoài phạm vi được giao.
          </Note>
          <CodeBlock dark title="Ví dụ với tài khoản phuong.nt">
            <span className="block text-slate-500">-- ${'{user.tinh_thanh_phu_trach}'} = '01','79'</span>
            <span className="block"><span className="text-[#93B4FF]">SELECT</span> * <span className="text-[#93B4FF]">FROM</span> {table}</span>
            <span className="block"><span className="text-[#93B4FF]">WHERE</span> ma_tinh_thanh <span className="text-[#93B4FF]">IN</span> (<span className="text-[#FFD479]">'01','79'</span>)</span>
            <span className="block text-slate-500">-- Kết quả: 3.542.118 / 12.480.331 dòng</span>
          </CodeBlock>
        </div>
      </Modal>
    </>
  )
}
