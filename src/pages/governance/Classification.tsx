import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PageHeader, KpiRow, Panel, Note, Chip, StatusChip, ActionButton, DataTable, TreeView,
  InfoGrid, InlineTabs, Modal, useToast, EntityLink, SectionTitle, ProgressBar,
  Field, TextInput, TextArea, SelectInput, Toggle, EmptyState,
} from '@/components/common'
import { tags, tagById, CONFIDENTIALITY_LEVELS, tagSuggestions, columns, tables, STATS, fmt } from '@/data'
import { useDemoSave } from '@/lib/demo'
import { MASK_TYPES } from '@/data'
import { TAG_SENSITIVITY, CONFIDENTIALITY_NAMES } from '@/data/enums'

export function Classification() {
  const [sp, setSp] = useSearchParams()
  const [axis, setAxis] = useState<'tags' | 'levels'>('tags')
  const [active, setActive] = useState(sp.get('tag') ?? 'PD_SENSITIVE')
  const [scan, setScan] = useState(false)
  const toast = useToast()

  const tag = tagById(active)
  const roots = tags.filter(t => !t.parentId)
  const treeNodes = roots.map(r => ({
    id: r.id,
    label: <span className="mono text-[11.5px]">{r.id}</span>,
    count: r.columnCount,
    children: tags.filter(c => c.parentId === r.id).map(c => ({ id: c.id, label: <span className="mono text-[11.5px]">{c.id}</span>, count: c.columnCount })),
  }))

  const taggedCols = useMemo(() => columns.filter(c => c.tags.includes(active)), [active])

  return (
    <>
      <PageHeader
        code="2.2"
        title="Phân loại & Nhãn"
        desc="Hai trục độc lập: mức phân loại bảo mật (4 cấp) và nhãn loại dữ liệu nhạy cảm — chính sách viết theo nhãn, không viết theo tên cột"
        crumbs={[{ label: 'Governance' }, { label: 'Phân loại & Nhãn' }]}
        actions={
          <>
            <ActionButton variant="ghost" onClick={() => setScan(true)}>🤖 Xem {tagSuggestions.length} cột hệ thống nghi ngờ</ActionButton>
            <ActionButton icon="plus" to="/governance/classification/create">Thêm nhãn</ActionButton>
          </>
        }
      />

      <KpiRow
        items={[
          { label: 'Cột nhạy cảm đã gắn nhãn', value: fmt(STATS.sensitiveColumns), sub: `${STATS.sensitiveBasic} cơ bản + ${STATS.sensitiveHigh} nhạy cảm cao` },
          { label: 'Cột đã có chính sách che', value: `${STATS.maskedColumns}/${STATS.sensitiveColumns}`, sub: 'chưa che cột nào', tone: 'bad' },
          { label: 'Nhãn trong cây phân loại', value: tags.length, sub: `${roots.length} nhãn gốc · ${tags.length - roots.length} nhãn con` },
          { label: 'Cột hệ thống nghi ngờ', value: tagSuggestions.length, sub: 'bộ dò tự động phát hiện', tone: 'warn' },
          { label: 'Nhãn chưa đồng bộ OPA', value: tags.filter(t => !t.syncedToOpa).length, sub: 'chính sách chưa có hiệu lực', tone: 'warn' },
        ]}
      />

      <div className="mt-4">
        <InlineTabs
          items={[
            { id: 'tags', label: 'Trục 2 — Nhãn dữ liệu nhạy cảm', badge: tags.length },
            { id: 'levels', label: 'Trục 1 — Mức phân loại bảo mật', badge: CONFIDENTIALITY_LEVELS.length },
          ]}
          active={axis}
          onChange={v => setAxis(v as any)}
        />
      </div>

      {axis === 'levels' ? (
        <>
          <Note tone="info" title="Vì sao tách thành hai trục — sửa lỗi thiết kế phát hiện khi review" className="mb-4">
            Thiết kế ban đầu trộn chung <span className="mono">PD_BASIC / PD_SENSITIVE / DATA_GENERAL</span> làm một trục duy nhất.
            Nhưng GĐ4 mục 3 yêu cầu <b>hai thứ khác nhau</b>: ① <b>mức phân loại</b> (Công khai · Nội bộ · Mật · Hạn chế truy cập) gán cho <i>bảng, cột, báo cáo</i>;
            ② <b>nhãn loại dữ liệu nhạy cảm</b> (số điện thoại, số căn cước, số tài khoản…) gán cho <i>cột</i>.
            Chính sách <b>che dữ liệu</b> viết theo trục ②, chính sách <b>hạn chế tải xuống</b> viết theo trục ①.
          </Note>

          <div className="grid grid-cols-4 gap-3">
            {CONFIDENTIALITY_LEVELS.map(l => (
              <Panel
                key={l.id}
                title={<span className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[10px] font-bold">{l.order}</span>{l.id}</span>}
                tone={l.order === 4 ? 'bad' : l.order === 3 ? 'warn' : l.order === 2 ? 'info' : 'ok'}
              >
                <p className="text-[12px] leading-relaxed text-slate-700">{l.description}</p>
                <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Đối tượng đang mang mức này</div>
                <div className="text-[19px] font-extrabold text-slate-800">{fmt(l.objectCount)}</div>
                <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Quy tắc mặc định</div>
                <ul className="mt-1 ml-4 list-disc space-y-0.5 text-[11.5px] text-slate-600">
                  {l.defaultRules.map(r => <li key={r}>{r}</li>)}
                </ul>
              </Panel>
            ))}
          </div>

          <Panel title="Bảng dữ liệu theo mức phân loại" className="mt-4">
            <DataTable
              rows={tables}
              rowKey={t => t.id}
              highlightRow={t => (t.confidentiality === 'Hạn chế truy cập' ? 'bad' : t.confidentiality === 'Mật' ? 'warn' : undefined)}
              columns={[
                { key: 'id', label: 'Bảng', render: t => <EntityLink to={`/catalog/tables/${encodeURIComponent(t.id)}`}>{t.id}</EntityLink> },
                { key: 'name', label: 'Tên nghiệp vụ' },
                { key: 'conf', label: 'Mức phân loại', nowrap: true, render: t => <StatusChip value={t.confidentiality} /> },
                { key: 'sens', label: 'Cột nhạy cảm', align: 'right', nowrap: true, render: t => (t.sensitiveColumnCount ? <Chip tone="r">{t.sensitiveColumnCount}</Chip> : '—') },
                { key: 'download', label: 'Được tải xuống', nowrap: true, render: t => (t.confidentiality === 'Hạn chế truy cập' ? <Chip tone="r">Cấm</Chip> : t.confidentiality === 'Mật' ? <Chip tone="o">Cần phê duyệt</Chip> : <Chip tone="g">Được</Chip>) },
                { key: 'expiry', label: 'Thời hạn quyền tối đa', nowrap: true, render: t => (t.confidentiality === 'Hạn chế truy cập' ? '3 tháng' : t.confidentiality === 'Mật' ? '6 tháng' : 'Không giới hạn') },
              ]}
            />
          </Panel>
        </>
      ) : (
        <div className="grid grid-cols-[250px_minmax(0,1.2fr)_minmax(0,1fr)] gap-4 items-start">
          <Panel title="Cây nhãn phân loại">
            <TreeView nodes={treeNodes} activeId={active} onPick={id => { setActive(id); setSp({ tag: id }) }} />
          </Panel>

          {tag ? (
            <div className="space-y-4">
              <Panel title={<span className="mono">{tag.id}</span>} desc={tag.name}>
                <InfoGrid
                  items={[
                    { label: 'Tên hiển thị', value: tag.name },
                    { label: 'Nhãn cha', value: tag.parentId ? tagById(tag.parentId)?.name : '— là nhãn gốc' },
                    { label: 'Mức nhạy cảm', value: <Chip tone={tag.sensitivity === 'Cao' ? 'r' : tag.sensitivity === 'Trung bình' ? 'o' : 'n'}>{tag.sensitivity}</Chip> },
                    { label: 'Số cột mang nhãn', value: fmt(tag.columnCount) },
                    { label: 'Mô tả', value: tag.description, full: true },
                    { label: 'Căn cứ pháp lý', value: tag.legalBasis, full: true },
                    { label: 'Đồng bộ sang OPA', value: tag.syncedToOpa ? <Chip tone="g">Đã đồng bộ</Chip> : <Chip tone="r">Chưa đồng bộ</Chip> },
                  ]}
                />
              </Panel>

              <Panel title="Chính sách tự áp cho mọi cột mang nhãn này">
                <DataTable
                  dense
                  rows={[
                    { policy: 'Che dữ liệu', value: tag.defaultMask ?? '— không che', scope: `${tag.columnCount} cột`, status: tag.defaultMask ? 'Đã cấu hình' : 'Chưa cấu hình' },
                    { policy: 'Mức phân loại mặc định', value: tag.defaultConfidentiality, scope: 'Cột và bảng chứa cột', status: 'Đã cấu hình' },
                    { policy: 'Hạn chế tải xuống', value: tag.sensitivity === 'Cao' ? 'Cấm tải xuống' : 'Ghi nhật ký', scope: 'Mọi lượt xuất dữ liệu', status: 'Đã cấu hình' },
                    { policy: 'Cảnh báo truy cập bất thường', value: tag.sensitivity === 'Cao' ? 'Bật — ngưỡng 50.000 dòng' : 'Tắt', scope: 'Giám sát truy cập', status: tag.sensitivity === 'Cao' ? 'Đã cấu hình' : 'Chưa cấu hình' },
                  ]}
                  columns={[
                    { key: 'policy', label: 'Chính sách', nowrap: true, render: r => <span className="font-semibold">{r.policy}</span> },
                    { key: 'value', label: 'Giá trị áp dụng' },
                    { key: 'scope', label: 'Phạm vi', nowrap: true },
                    { key: 'status', label: 'Trạng thái', nowrap: true, render: r => <Chip tone={r.status === 'Đã cấu hình' ? 'g' : 'r'}>{r.status}</Chip> },
                  ]}
                />
                <Note tone="info" title="Nguyên tắc NT2 — khai một lần dùng nhiều nơi" className="mt-3">
                  Gắn nhãn ở đây <b>một lần</b> → chính sách che ở menu 5.2 tự áp cho toàn bộ {fmt(tag.columnCount)} cột,
                  không phải khai lại từng cột. Đây là điều kiện để scale lên {fmt(STATS.totalTables)} bảng.
                </Note>
              </Panel>
            </div>
          ) : <EmptyState text="Chọn một nhãn ở cây bên trái" />}

          <Panel title={`Cột đang mang nhãn ${active} (hiển thị ${taggedCols.length} / ${tag?.columnCount ?? 0})`}>
            <div className="max-h-[560px] space-y-1.5 overflow-y-auto">
              {taggedCols.map(c => (
                <div key={`${c.tableId}.${c.name}`} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="mono text-[12px] font-semibold text-slate-800">{c.name}</div>
                  <EntityLink to={`/catalog/tables/${encodeURIComponent(c.tableId)}/columns`}>{c.tableId}</EntityLink>
                  <div className="mt-1 flex items-center justify-between">
                    <StatusChip value={c.confidentiality} />
                    {c.maskPolicy ? <Chip tone="g">{c.maskPolicy}</Chip> : <Chip tone="r">chưa che</Chip>}
                  </div>
                </div>
              ))}
              {!taggedCols.length && <div className="py-8 text-center text-[12px] text-slate-400">Không có cột nào đã khai chi tiết mang nhãn này</div>}
            </div>
          </Panel>
        </div>
      )}

      <Modal
        open={scan}
        onClose={() => setScan(false)}
        size="lg"
        title="Bộ dò tự động — cột nghi ngờ chứa dữ liệu cá nhân"
        desc="Nhận diện dựa trên tên cột và mẫu giá trị (GĐ4 · FR-02). Cần người có thẩm quyền xác nhận trước khi gắn nhãn."
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setScan(false)}>Đóng</ActionButton>
            <ActionButton onClick={() => { setScan(false); toast.success('Đã gửi 8 đề xuất gắn nhãn', 'Chờ Người sở hữu dữ liệu xác nhận tại menu 2.4.') }}>
              Xác nhận tất cả
            </ActionButton>
          </>
        }
      >
        <DataTable
          rows={tagSuggestions}
          rowKey={s => `${s.tableId}.${s.column}`}
          highlightRow={s => (s.confidence >= 90 ? 'bad' : 'warn')}
          columns={[
            { key: 'tableId', label: 'Bảng', render: s => <span className="mono text-[11.5px]">{s.tableId}</span> },
            { key: 'column', label: 'Cột', nowrap: true, render: s => <span className="mono font-semibold">{s.column}</span> },
            { key: 'suggest', label: 'Nhãn đề xuất', nowrap: true, render: s => <Chip tone="r">{s.suggest}</Chip> },
            { key: 'confidence', label: 'Độ tin cậy', align: 'right', nowrap: true, render: s => <span className={s.confidence >= 90 ? 'font-bold text-red-600' : 'font-bold text-amber-600'}>{s.confidence}%</span> },
            { key: 'reason', label: 'Căn cứ nhận diện' },
            {
              key: 'act', label: '', align: 'right', nowrap: true,
              render: s => (
                <div className="flex gap-1 whitespace-nowrap">
                  <ActionButton variant="ghost" onClick={() => toast.info('Đã bỏ qua', `${s.column} sẽ không được đề xuất lại trong 90 ngày.`)}>Bỏ qua</ActionButton>
                  <ActionButton onClick={() => toast.success('Đã gắn nhãn', `${s.column} → ${s.suggest}`)}>Xác nhận</ActionButton>
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </>
  )
}

export function ClassificationCreate() {
  const save = useDemoSave('/governance/classification')
  const [f, setF] = useState({ id: '', name: '', parentId: '', description: '', sensitivity: 'Trung bình', legalBasis: '', defaultMask: '', defaultConf: 'Mật' })
  const [sync, setSync] = useState(true)
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }))
  const ok = f.id && f.name && f.description

  return (
    <>
      <PageHeader
        code="2.2"
        title="Thêm nhãn dữ liệu nhạy cảm"
        desc="Nhãn là đơn vị mà chính sách bảo mật viết theo — không viết chính sách theo tên cột"
        crumbs={[{ label: 'Governance' }, { label: 'Phân loại & Nhãn', href: '/governance/classification' }, { label: 'Thêm nhãn' }]}
      />

      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title="Thông tin nhãn">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mã nhãn" info="tag.id" required hint="Đồng bộ sang hệ thống phân quyền OPA nên không đổi được sau khi tạo">
              <TextInput mono value={f.id} onChange={set('id')} placeholder="PII_TAX_CODE" />
            </Field>
            <Field label="Tên hiển thị" required><TextInput value={f.name} onChange={set('name')} placeholder="Mã số thuế cá nhân" /></Field>
            <Field label="Nhãn cha" hint="Để trống nếu đây là nhãn gốc">
              <SelectInput value={f.parentId} onChange={set('parentId')}>
                <option value="">— Là nhãn gốc —</option>
                {tags.filter(t => !t.parentId).map(t => <option key={t.id} value={t.id}>{t.id} — {t.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="Mức nhạy cảm" info="tag.sensitivity" required>
              <SelectInput value={f.sensitivity} onChange={set('sensitivity')}>{TAG_SENSITIVITY.map(s => <option key={s}>{s}</option>)}</SelectInput>
            </Field>
            <Field label="Mô tả" required full><TextArea rows={2} value={f.description} onChange={set('description')} /></Field>
            <Field label="Căn cứ pháp lý" full hint="Ví dụ: Nghị định 13/2023/NĐ-CP — Điều 2.4">
              <TextInput value={f.legalBasis} onChange={set('legalBasis')} />
            </Field>
          </div>

          <SectionTitle right={<span className="text-[11px] text-slate-400">Áp tự động cho mọi cột mang nhãn</span>}>Chính sách mặc định</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kiểu che dữ liệu mặc định" info="tag.defaultMask">
              <SelectInput value={f.defaultMask} onChange={set('defaultMask')}>
                <option value="">— Không che —</option>
                {MASK_TYPES.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="Mức phân loại mặc định" hint="Bảng chứa cột mang nhãn này sẽ được nâng lên mức tối thiểu là mức này">
              <SelectInput value={f.defaultConf} onChange={set('defaultConf')}>{CONFIDENTIALITY_NAMES.map(c => <option key={c}>{c}</option>)}</SelectInput>
            </Field>
            <div className="col-span-full">
              <Toggle checked={sync} onChange={setSync} label="Đồng bộ nhãn sang hệ thống phân quyền OPA" hint="Tắt thì chính sách viết theo nhãn này sẽ không có hiệu lực ở tầng truy vấn" />
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Nhãn này sẽ kéo theo gì">
            <DataTable
              dense
              rows={[
                { k: 'Che dữ liệu', v: f.defaultMask || '— không che', tone: f.defaultMask ? 'g' : 'n' },
                { k: 'Mức phân loại tối thiểu', v: f.defaultConf, tone: 'b' },
                { k: 'Hạn chế tải xuống', v: f.sensitivity === 'Cao' ? 'Cấm tải xuống' : 'Ghi nhật ký', tone: f.sensitivity === 'Cao' ? 'r' : 'n' },
                { k: 'Cảnh báo bất thường', v: f.sensitivity === 'Cao' ? 'Bật' : 'Tắt', tone: f.sensitivity === 'Cao' ? 'o' : 'n' },
                { k: 'Đồng bộ OPA', v: sync ? 'Có' : 'Không', tone: sync ? 'g' : 'r' },
              ]}
              columns={[
                { key: 'k', label: 'Chính sách', nowrap: true },
                { key: 'v', label: 'Giá trị', render: r => <Chip tone={r.tone as any}>{r.v}</Chip> },
              ]}
            />
          </Panel>
          <Note tone="warn" title="Mã nhãn không đổi được">
            Mã nhãn được đồng bộ sang hệ thống phân quyền OPA và nhúng vào các chính sách đã ban hành.
            Đổi mã sau khi tạo sẽ làm mọi chính sách tham chiếu tới nó mất hiệu lực.
          </Note>
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/governance/classification">Huỷ</ActionButton>
        <ActionButton disabled={!ok} onClick={() => save('Đã tạo nhãn phân loại')}>Lưu và đồng bộ</ActionButton>
      </div>
    </>
  )
}
