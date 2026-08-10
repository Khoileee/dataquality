import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PageHeader, KpiRow, FilterBar, DataTable, CellStack, Panel, Note, Chip, ActionButton,
  InlineTabs, Modal, InfoGrid, SectionTitle, EmptyState,
} from '@/components/common'
import { FIELDS, FIELD_GROUPS, ORIGIN_LABEL, ORIGIN_TONE, fieldStats, type FieldDef, type OriginKind } from '@/data/fieldMeta'
import { ENUM_REGISTRY } from '@/data/enums'
import { match } from '@/lib/demo'

export function MetadataStandard({ embedded }: { embedded?: boolean } = {}) {
  const [tab, setTab] = useState('fields')
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('')
  const [origin, setOrigin] = useState('')
  const [pick, setPick] = useState<FieldDef | null>(null)

  const stats = fieldStats()

  const rows = useMemo(
    () => FIELDS.filter(f =>
      (!group || f.group === group) &&
      (!origin || ORIGIN_LABEL[f.origin] === origin) &&
      match(`${f.key} ${f.label} ${f.desc} ${f.from} ${f.values ?? ''}`, q)),
    [q, group, origin]
  )

  return (
    <>
      {!embedded && (
        <PageHeader
          code="8.2"
          title="Tiêu chuẩn thông tin mô tả"
          desc="Từ điển mọi trường thông tin trên hệ thống — mỗi trường trả lời được hai câu: giá trị từ đâu ra, và khai xong dùng ở đâu"
          crumbs={[{ label: 'Governance' }, { label: 'Tiêu chuẩn thông tin mô tả' }]}
          actions={<ActionButton variant="ghost" icon="export">Xuất bộ tiêu chuẩn</ActionButton>}
        />
      )}

      <Note tone="info" title="Đây là kết quả đầu ra bắt buộc của Giai đoạn 1" className="mb-4">
        GĐ1 mục 2.4 yêu cầu <i>"thống nhất các thông tin mô tả cần quản lý đối với từng loại đối tượng, làm chuẩn chung trước khi xây dựng hệ thống"</i>,
        và GĐ2 mục 5 đặc tả chi tiết từng trường theo 7 nhóm đối tượng.
        Màn này là <b>nơi duy nhất</b> tra được nguồn gốc của mọi trường — dùng khi ai đó hỏi
        <i> "trường này ở đâu ra, khai để làm gì"</i>.
      </Note>

      <KpiRow
        items={[
          { label: 'Trường đã chuẩn hoá', value: stats.total, sub: `${FIELD_GROUPS.length} nhóm đối tượng` },
          { label: 'Trường bắt buộc', value: stats.required, sub: 'không điền thì không lưu được' },
          { label: 'Người dùng khai tay', value: stats.byOrigin.find(o => o.kind === 'declare')?.count ?? 0, sub: 'cần quy trình và người chịu trách nhiệm', tone: 'info' },
          { label: 'Hệ thống tự sinh', value: (stats.byOrigin.find(o => o.kind === 'auto')?.count ?? 0) + (stats.byOrigin.find(o => o.kind === 'derived')?.count ?? 0), sub: 'thu thập tự động hoặc tự tính', tone: 'ok' },
          { label: 'Trường không có nơi dùng', value: stats.orphan, sub: stats.orphan ? 'khai rồi để đó — cần xem lại' : 'mọi trường đều có nơi dùng', tone: stats.orphan ? 'bad' : 'ok' },
        ]}
      />

      <div className="mt-4">
        <InlineTabs
          items={[
            { id: 'fields', label: 'Danh sách trường', badge: FIELDS.length },
            { id: 'origin', label: 'Theo cách có giá trị' },
            { id: 'groups', label: 'Theo nhóm đối tượng', badge: FIELD_GROUPS.length },
            { id: 'enums', label: 'Danh sách giá trị chọn', badge: ENUM_REGISTRY.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'fields' && (
        <>
          <FilterBar
            placeholder="Tìm theo tên trường, mã trường, mô tả, nguồn giá trị…"
            value={q}
            onChange={setQ}
            filters={[
              { label: 'Nhóm đối tượng', options: FIELD_GROUPS, value: group, onChange: setGroup },
              { label: 'Cách có giá trị', options: Object.values(ORIGIN_LABEL), value: origin, onChange: setOrigin },
            ]}
            right={<span className="text-[12px] text-slate-400">{rows.length} trường</span>}
          />

          <DataTable
            stt
            rows={rows}
            rowKey={f => f.key}
            onRowClick={f => setPick(f)}
            highlightRow={f => (f.uses.length === 0 ? 'bad' : undefined)}
            columns={[
              {
                key: 'label', label: 'Trường thông tin', width: '19%', min: 200,
                render: f => <CellStack top={<span className="font-semibold text-slate-800">{f.label}{f.required && <span className="ml-1 text-red-500">*</span>}</span>} bottom={<span className="mono">{f.key}</span>} />,
              },
              { key: 'group', label: 'Nhóm đối tượng', width: '13%', min: 150, render: f => <Chip tone="t">{f.group}</Chip> },
              { key: 'origin', label: 'Cách có giá trị', width: '11%', min: 130, render: f => <Chip tone={ORIGIN_TONE[f.origin]}>{ORIGIN_LABEL[f.origin]}</Chip> },
              { key: 'from', label: '← Giá trị từ đâu ra', width: '31%', min: 300, render: f => <span className="text-[11.5px] leading-snug">{f.from}</span> },
              {
                key: 'uses', label: '→ Khai xong dùng ở đâu', width: '26%', min: 260,
                render: f => f.uses.length
                  ? <div className="space-y-0.5">{f.uses.slice(0, 3).map((u, i) => (
                      <div key={i} className="text-[11px] leading-snug"><span className="font-semibold text-blue-700">{u.menu}</span></div>
                    ))}{f.uses.length > 3 && <div className="text-[10.5px] text-slate-400">+{f.uses.length - 3} nơi khác</div>}</div>
                  : <span className="font-semibold text-red-600">— chưa dùng ở đâu</span>,
              },
            ]}
          />

          {stats.orphan > 0 && (
            <Note tone="bad" title={`${stats.orphan} trường khai rồi nhưng không dùng ở đâu`} className="mt-4">
              Đây chính là vấn đề <i>"khai rồi để đó"</i>. Trường không có nơi tiêu thụ thì nên bỏ khỏi bộ tiêu chuẩn,
              hoặc phải chỉ ra được menu nào sẽ dùng tới.
            </Note>
          )}
        </>
      )}

      {tab === 'origin' && (
        <div className="grid grid-cols-3 gap-3">
          {stats.byOrigin.map(o => {
            const list = FIELDS.filter(f => f.origin === o.kind)
            return (
              <Panel key={o.kind} title={<span className="flex items-center gap-2"><Chip tone={ORIGIN_TONE[o.kind]}>{o.label}</Chip><span className="text-[11px] font-normal text-slate-400">{o.count} trường</span></span>}>
                <div className="mb-2 text-[11.5px] leading-relaxed text-slate-600">{ORIGIN_NOTE[o.kind]}</div>
                <div className="max-h-[300px] space-y-1 overflow-y-auto">
                  {list.map(f => (
                    <button key={f.key} onClick={() => setPick(f)} className="block w-full rounded-md px-2 py-1 text-left text-[11.5px] text-slate-700 transition hover:bg-slate-50">
                      <span className="font-semibold">{f.label}</span>
                      <span className="mono ml-1 text-[10px] text-slate-400">{f.key}</span>
                    </button>
                  ))}
                </div>
              </Panel>
            )
          })}
        </div>
      )}

      {tab === 'groups' && (
        <div className="space-y-4">
          {FIELD_GROUPS.map(g => {
            const list = FIELDS.filter(f => f.group === g)
            return (
              <Panel key={g} title={g} desc={`${list.length} trường · ${list.filter(f => f.required).length} bắt buộc`}>
                <DataTable
                  dense
                  rows={list}
                  rowKey={f => f.key}
                  onRowClick={f => setPick(f)}
                  columns={[
                    { key: 'label', label: 'Trường', width: '22%', min: 190, render: f => <span className="font-semibold text-slate-800">{f.label}{f.required && <span className="ml-1 text-red-500">*</span>}</span> },
                    { key: 'desc', label: 'Là gì', width: '34%', min: 280, render: f => <span className="text-[11.5px] leading-snug">{f.desc}</span> },
                    { key: 'origin', label: 'Cách có giá trị', min: 130, nowrap: true, render: f => <Chip tone={ORIGIN_TONE[f.origin]}>{ORIGIN_LABEL[f.origin]}</Chip> },
                    { key: 'uses', label: 'Số nơi sử dụng', align: 'center', min: 110, nowrap: true, render: f => (f.uses.length ? <Chip tone="b">{f.uses.length}</Chip> : <Chip tone="r">0</Chip>) },
                  ]}
                />
              </Panel>
            )
          })}
        </div>
      )}

      {tab === 'enums' && (
        <>
          <Note tone="warn" title="Mọi ô chọn trên giao diện phải lấy từ đây" className="mb-4">
            Không viết thẳng danh sách giá trị trong màn hình. Mỗi danh sách dưới đây trả lời được hai câu:
            <b> ai quản lý</b> và <b>thêm giá trị mới thì làm ở đâu</b>.
            Danh sách nào không trả lời được thì không được đưa lên giao diện — đó là gốc của lời phê bình
            <i> "trường thông tin trông đầy đủ nhưng không giải thích được nguồn gốc"</i>.
          </Note>

          <DataTable
            stt
            rows={ENUM_REGISTRY}
            rowKey={e => e.name}
            highlightRow={e => (e.src.kind === 'catalog' ? 'ok' : undefined)}
            columns={[
              { key: 'name', label: 'Danh sách giá trị', width: '18%', min: 200, render: e => <span className="font-semibold text-slate-800">{e.name}</span> },
              {
                key: 'kind', label: 'Loại nguồn', min: 150, nowrap: true,
                render: e => (
                  <Chip tone={e.src.kind === 'catalog' ? 'g' : e.src.kind === 'derived' ? 'p' : 'n'}>
                    {e.src.kind === 'catalog' ? 'Danh mục quản lý được' : e.src.kind === 'derived' ? 'Suy từ dữ liệu' : 'Hằng số nghiệp vụ'}
                  </Chip>
                ),
              },
              { key: 'count', label: 'Số giá trị', align: 'right', min: 90, nowrap: true, render: e => e.values.length },
              {
                key: 'values', label: 'Các giá trị', width: '32%', min: 300,
                render: e => <div className="flex flex-wrap gap-1">{e.values.slice(0, 6).map(v => <Chip key={v} tone="n">{v}</Chip>)}{e.values.length > 6 && <Chip tone="b">+{e.values.length - 6}</Chip>}</div>,
              },
              { key: 'managedBy', label: 'Ai quản lý · thêm giá trị ở đâu', width: '34%', min: 320, render: e => <span className="text-[11.5px] leading-snug">{e.src.managedBy}</span> },
              {
                key: 'route', label: '', align: 'right', min: 110, nowrap: true,
                render: e => (e.src.route ? <Link to={e.src.route} className="text-[11.5px] font-semibold text-blue-600 hover:underline">Mở màn quản lý →</Link> : <span className="text-[11px] text-slate-400">sửa ở cấu hình</span>),
              },
            ]}
          />

          <div className="mt-4 grid grid-cols-3 gap-3">
            {(['catalog', 'const', 'derived'] as const).map(k => (
              <Panel
                key={k}
                title={k === 'catalog' ? 'Danh mục quản lý được' : k === 'const' ? 'Hằng số nghiệp vụ' : 'Suy từ dữ liệu'}
                tone={k === 'catalog' ? 'ok' : 'default'}
              >
                <div className="text-[21px] font-extrabold text-slate-800">{ENUM_REGISTRY.filter(e => e.src.kind === k).length}</div>
                <div className="mt-1 text-[11.5px] leading-relaxed text-slate-600">
                  {k === 'catalog'
                    ? 'Người dùng thêm/sửa được ở một menu cụ thể. Đây là loại tốt nhất — giá trị luôn nhất quán và có người chịu trách nhiệm.'
                    : k === 'const'
                      ? 'Cố định theo yêu cầu BDA hoặc quy định pháp lý. Thêm giá trị phải sửa cấu hình hệ thống, không tự thêm khi đang dùng.'
                      : 'Sinh động từ bản ghi đã có trong hệ thống — không cần khai riêng.'}
                </div>
              </Panel>
            ))}
          </div>
        </>
      )}

      <Modal
        open={!!pick}
        onClose={() => setPick(null)}
        size="lg"
        title={pick?.label}
        desc={pick && `Mã trường ${pick.key} · nhóm ${pick.group}`}
        footer={
          <>
            {pick?.fromRoute && <ActionButton variant="ghost" to={pick.fromRoute}>Tới nơi khai báo</ActionButton>}
            <ActionButton onClick={() => setPick(null)}>Đóng</ActionButton>
          </>
        }
      >
        {pick && (
          <div className="space-y-4">
            <InfoGrid
              items={[
                { label: 'Là gì', value: pick.desc, full: true },
                { label: 'Cách có giá trị', value: <Chip tone={ORIGIN_TONE[pick.origin]}>{ORIGIN_LABEL[pick.origin]}</Chip> },
                { label: 'Bắt buộc điền', value: pick.required ? <Chip tone="r">Có</Chip> : <Chip tone="n">Không</Chip> },
              ]}
            />

            <Panel title="← Giá trị này từ đâu ra" tone="info">
              <div className="text-[12.5px] leading-relaxed text-slate-700">{pick.from}</div>
              {pick.values && (
                <>
                  <SectionTitle>Giá trị hợp lệ</SectionTitle>
                  <div className="text-[12px] leading-relaxed text-slate-700">{pick.values}</div>
                </>
              )}
              {pick.fromRoute && (
                <div className="mt-3">
                  <Link to={pick.fromRoute} className="text-[12px] font-semibold text-blue-600 hover:underline">Mở màn khai báo →</Link>
                </div>
              )}
            </Panel>

            <Panel title={`→ Khai xong thì dùng ở đâu (${pick.uses.length})`} tone={pick.uses.length ? 'ok' : 'bad'}>
              {pick.uses.length ? (
                <div className="space-y-2">
                  {pick.uses.map((u, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12.5px] font-bold text-slate-800">{u.menu}</span>
                        {u.route && <Link to={u.route} className="shrink-0 text-[11.5px] font-semibold text-blue-600 hover:underline">Mở màn →</Link>}
                      </div>
                      <div className="mt-0.5 text-[11.5px] leading-relaxed text-slate-600">{u.how}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[12.5px] text-red-700">
                  Trường này chưa được menu nào sử dụng. Khai vào chỉ tốn công mà không tạo ra giá trị — nên bỏ khỏi bộ tiêu chuẩn.
                </div>
              )}
            </Panel>
          </div>
        )}
      </Modal>
    </>
  )
}

const ORIGIN_NOTE: Record<OriginKind, string> = {
  declare: 'Người dùng gõ vào trên màn hình. Đây là nhóm tốn công nhất — mỗi trường phải có người chịu trách nhiệm và quy trình cập nhật, nếu không sẽ rơi vào tình trạng khai rồi để đó.',
  ref: 'Chọn từ một danh mục có nơi quản lý riêng. Ưu điểm: giá trị luôn nhất quán, đổi ở nguồn là đổi mọi nơi. Đây là cách nên dùng thay cho gõ tay.',
  auto: 'Hệ thống lấy từ nguồn kỹ thuật qua kết nối. Không cần người khai, nhưng phụ thuộc vào việc kết nối có hoạt động không.',
  derived: 'Hệ thống tính ra từ dữ liệu đã có. Không khai được, không sửa được — muốn đổi thì phải đổi dữ liệu gốc.',
  workflow: 'Do một quy trình sinh ra: phê duyệt, xin quyền, xử lý sự cố. Trạng thái đổi theo bước của quy trình chứ không đổi bằng tay.',
  const: 'Danh sách cố định do hệ thống định nghĩa, thường bắt nguồn từ yêu cầu nghiệp vụ hoặc quy định pháp lý. Muốn thêm giá trị thì phải sửa cấu hình, không tự thêm được khi đang dùng.',
}
