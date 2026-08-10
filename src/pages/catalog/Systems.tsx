import { useMemo, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import {
  RouteTabs, PageHeader, KpiRow, FilterBar, DataTable, CellTitle, CellStack, Panel, Note, Chip, StatusChip,
  ActionButton, IconBtn, RowActions, EntityLink, InfoGrid, ProgressBar, EmptyState,
  Field, TextInput, TextArea, SelectInput, Steps, SectionTitle, FlowDiagram,
} from '@/components/common'
import { systems, systemById, tables, channels, domains, domainName, STATS, fmt, lineageEdges } from '@/data'
import { SYSTEM_KINDS, ENVIRONMENTS, SYSTEM_STATUS, ORG_UNITS, usersByRole } from '@/data/enums'
import { match, useDemoSave } from '@/lib/demo'
import { ChannelList } from './Channels'
import { NextStep } from '@/components/common'

export function SystemList({ embedded }: { embedded?: boolean } = {}) {
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('')
  const [env, setEnv] = useState('')

  const rows = useMemo(
    () => systems.filter(s => (!kind || s.kind === kind) && (!env || s.env === env) && match(`${s.id} ${s.name} ${s.purpose} ${s.tech} ${s.unit}`, q)),
    [q, kind, env]
  )

  const noOwner = systems.filter(s => !s.dataOwner).length

  return (
    <>

      <KpiRow
        items={[
          { label: 'Tổng số hệ thống', value: STATS.totalSystems, sub: `${systems.length} hệ thống đã khai chi tiết` },
          { label: 'Đang sử dụng', value: systems.filter(s => s.status === 'Đang sử dụng').length, sub: '1 hệ thống đã ngừng', tone: 'ok' },
          { label: 'Chưa có Người sở hữu', value: noOwner, sub: 'không ai chịu trách nhiệm dữ liệu', tone: 'bad' },
          { label: 'Bảng thuộc hệ thống đã khai', value: fmt(systems.reduce((a, s) => a + s.tableCount, 0)), sub: `trên tổng ${fmt(STATS.totalTables)}` },
          { label: 'Chờ phê duyệt', value: systems.filter(s => s.approval !== 'Đã phê duyệt' && s.approval !== 'Ngừng sử dụng').length, sub: 'metadata chưa có hiệu lực', tone: 'warn' },
        ]}
      />

      <div className="mt-4">
        <FilterBar
          placeholder="Tìm theo tên hệ thống, công nghệ, đơn vị quản lý…"
          value={q}
          onChange={setQ}
          filters={[
            { label: 'Loại', options: ['Cơ sở dữ liệu', 'Kho dữ liệu', 'Vùng dữ liệu thô', 'Ứng dụng nghiệp vụ', 'Công cụ BI', 'Hàng đợi'], value: kind, onChange: setKind },
            { label: 'Môi trường', options: ['Production', 'Test', 'UAT'], value: env, onChange: setEnv },
          ]}
          right={<span className="text-[12px] text-slate-400">{rows.length} hệ thống</span>}
        />
      </div>

      <DataTable
        stt
        rows={rows}
        rowKey={s => s.id}
        highlightRow={s => (!s.dataOwner ? 'warn' : s.status === 'Đã ngừng sử dụng' ? 'bad' : undefined)}
        columns={[
          {
            key: 'name', label: 'Hệ thống', width: '26%', min: 300, info: 'system.name',
            render: s => <CellTitle title={<EntityLink to={`/catalog/systems/${s.id}`} mono={false}>{s.name}</EntityLink>} sub={<><span className="mono">{s.id}</span> · {s.purpose}</>} />,
          },
          {
            key: 'kind', label: 'Loại · Công nghệ', width: '15%', min: 170, info: 'system.kind',
            render: s => <CellStack top={<Chip tone="t">{s.kind}</Chip>} bottom={<span className="mono">{s.tech}</span>} />,
          },
          {
            key: 'unit', label: 'Đơn vị quản lý', width: '14%', min: 160, info: 'system.unit',
            render: s => <CellStack top={s.unit} bottom={<Chip tone={s.env === 'Production' ? 'b' : 'n'}>{s.env}</Chip>} />,
          },
          {
            key: 'owner', label: 'Người phụ trách', width: '16%', min: 180, info: 'system.dataOwner',
            render: s => (
              <CellStack
                top={s.dataOwner ?? <span className="font-semibold text-red-600">— chưa có Người sở hữu</span>}
                bottom={<>Kỹ thuật: {s.techOwner}</>}
                tone={s.dataOwner ? undefined : 'danger'}
              />
            ),
          },
          { key: 'tableCount', label: 'Số bảng', align: 'right', min: 90, nowrap: true, info: 'system.tableCount', render: s => <span className="font-semibold">{fmt(s.tableCount)}</span> },
          {
            key: 'meta', label: 'Hoàn thiện metadata', width: '13%', min: 150, info: 'system.metadataScore',
            render: s => <ProgressBar pct={s.metadataScore} target={85} height={10} note={`${s.metadataScore}%`} />,
          },
          {
            key: 'status', label: 'Trạng thái', width: '12%', min: 140,
            render: s => (
              <CellStack
                top={<Chip tone={s.status === 'Đang sử dụng' ? 'g' : 'n'}>{s.status}</Chip>}
                bottom={<StatusChip value={s.approval} />}
              />
            ),
          },
          { key: 'act', label: '', align: 'right', min: 96, nowrap: true, render: s => <RowActions><IconBtn icon="open" title="Chi tiết" to={`/catalog/systems/${s.id}`} /><IconBtn icon="edit" title="Sửa" to={`/catalog/systems/create?id=${s.id}`} /></RowActions> },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Note tone="bad" title="Vì sao menu này là bổ sung sau review">
          Thiết kế DMP ban đầu chỉ có <b>Kết nối</b> trong Cấu hình hệ thống — thiên về tham số kỹ thuật (JDBC, FTP, Kerberos).
          GĐ2 mục 5.1 yêu cầu quản lý hệ thống như một <b>đối tượng metadata</b>: mục đích sử dụng · đơn vị quản lý · đầu mối kỹ thuật · môi trường · trạng thái sử dụng.
        </Note>
        <Note tone="info" title="Khai ở đây, dùng ở đâu">
          Mỗi bảng ở menu 1.1 bắt buộc trỏ về một hệ thống ở đây · Kênh trao đổi ở 1.2 khai hệ thống gửi và hệ thống nhận ·
          Truy vết luồng dữ liệu mức <b>hệ thống</b> ở menu 2.3 vẽ trực tiếp từ dữ liệu này.
        </Note>
      </div>

      <NextStep
        done="khai hệ thống nguồn"
        steps={[
          { label: 'Khai kênh trao đổi', desc: 'Đường dữ liệu giữa hai hệ thống', to: '/catalog/systems/channels' },
          { label: 'Khai bảng thuộc hệ thống', desc: 'Trung tâm của cả tool — 1.1', to: '/catalog/tables' },
          { label: 'Khai mẫu nạp dữ liệu', desc: 'Đưa dữ liệu từ hệ thống về — 4.2', to: '/ingestion/templates' },
        ]}
      />
    </>
  )
}

export function SystemDetail() {
  const { id = '' } = useParams()
  const s = systemById(id)
  if (!s) return <EmptyState text="Không tìm thấy hệ thống" action={<ActionButton to="/catalog/systems">Về danh sách</ActionButton>} />

  const sysTables = tables.filter(t => t.systemId === s.id)
  const sysChannels = channels.filter(c => c.fromSystem === s.id || c.toSystem === s.id)
  const sysLineage = lineageEdges.filter(e => e.level === 'Hệ thống' && (e.from === s.id || e.to === s.id))

  return (
    <>
      <PageHeader
        code="1.2"
        title={s.name}
        desc={`${s.id} · ${s.purpose}`}
        crumbs={[{ label: 'Data Catalog' }, { label: 'Hệ thống & Nguồn dữ liệu', href: '/catalog/systems' }, { label: s.name }]}
        actions={
          <>
            <Chip tone="t">{s.kind}</Chip>
            <StatusChip value={s.approval} />
            <ActionButton variant="ghost" icon="edit" to={`/catalog/systems/create?id=${s.id}`}>Sửa</ActionButton>
          </>
        }
      />

      <KpiRow
        items={[
          { label: 'Số bảng', value: fmt(s.tableCount), sub: `${sysTables.length} bảng đã khai chi tiết` },
          { label: 'Kênh trao đổi', value: sysChannels.length, sub: 'gửi đi và nhận về' },
          { label: 'Miền dữ liệu phục vụ', value: s.domainIds.length, sub: s.domainIds.map(d => domainName(d)).join(', ') || '— chưa gán' },
          { label: 'Hoàn thiện metadata', value: `${s.metadataScore}%`, sub: 'mục tiêu 85%', tone: s.metadataScore >= 85 ? 'ok' : s.metadataScore >= 60 ? 'warn' : 'bad' },
          { label: 'Trạng thái', value: s.status === 'Đang sử dụng' ? 'Đang dùng' : 'Đã ngừng', sub: `Cập nhật ${s.updatedAt}`, tone: s.status === 'Đang sử dụng' ? 'ok' : 'bad' },
        ]}
      />

      <div className="mt-4 grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4">
          <Panel title="Thông tin mô tả — theo bộ tiêu chuẩn GĐ2 mục 5.1">
            <InfoGrid
              items={[
                { label: 'Mã hệ thống', value: <span className="mono">{s.id}</span> },
                { label: 'Tên hệ thống', value: s.name },
                { label: 'Mục đích sử dụng', value: s.purpose, full: true },
                { label: 'Loại hệ thống / vùng lưu trữ', value: s.kind },
                { label: 'Công nghệ nền tảng', value: <span className="mono">{s.tech}</span> },
                { label: 'Đơn vị quản lý', value: s.unit },
                { label: 'Đầu mối kỹ thuật', value: s.techOwner },
                { label: 'Người sở hữu dữ liệu', value: s.dataOwner ?? <span className="font-semibold text-red-600">— chưa gán</span> },
                { label: 'Môi trường', value: s.env },
                { label: 'Trạng thái sử dụng', value: s.status },
                { label: 'Cập nhật lần cuối', value: s.updatedAt },
              ]}
            />
          </Panel>

          <Panel title={`Bảng dữ liệu thuộc hệ thống (${sysTables.length} bảng đã khai chi tiết trên tổng ${fmt(s.tableCount)})`}>
            <DataTable
              dense
              rows={sysTables}
              rowKey={t => t.id}
              empty="Chưa có bảng nào của hệ thống này được khai chi tiết"
              columns={[
                { key: 'id', label: 'Tên bảng', render: t => <EntityLink to={`/catalog/tables/${encodeURIComponent(t.id)}`}>{t.id}</EntityLink> },
                { key: 'name', label: 'Tên nghiệp vụ' },
                { key: 'domain', label: 'Miền', nowrap: true, render: t => (t.domain ? <Chip tone="t">{domainName(t.domain)}</Chip> : <Chip tone="r">chưa gán</Chip>) },
                { key: 'rows', label: 'Số dòng', align: 'right', nowrap: true, render: t => fmt(t.rows) },
                { key: 'q', label: 'Chất lượng', align: 'right', nowrap: true, render: t => t.qualityScore ?? '—' },
              ]}
            />
          </Panel>

          <Panel title={`Kênh trao đổi dữ liệu liên quan (${sysChannels.length})`}>
            <DataTable
              dense
              rows={sysChannels}
              rowKey={c => c.id}
              empty="Không có kênh trao đổi nào gắn với hệ thống này"
              columns={[
                { key: 'id', label: 'Mã kênh', nowrap: true, render: c => <EntityLink to={`/catalog/channels/${c.id}`}>{c.id}</EntityLink> },
                { key: 'name', label: 'Tên kênh' },
                { key: 'kind', label: 'Loại', nowrap: true, render: c => <Chip tone="t">{c.kind}</Chip> },
                { key: 'dir', label: 'Chiều', nowrap: true, render: c => <Chip tone={c.direction === 'Gửi đi' ? 'o' : c.direction === 'Nhận về' ? 'b' : 'p'}>{c.direction}</Chip> },
                { key: 'freq', label: 'Tần suất', nowrap: true },
              ]}
            />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Miền dữ liệu hệ thống phục vụ">
            <div className="flex flex-wrap gap-1.5">
              {s.domainIds.length
                ? s.domainIds.map(d => <Chip key={d} tone="t">{domainName(d)}</Chip>)
                : <span className="text-[12px] text-slate-400">Chưa gán miền dữ liệu nào</span>}
            </div>
          </Panel>

          <Panel title="Quan hệ luồng dữ liệu mức hệ thống">
            {sysLineage.length ? (
              <div className="space-y-2">
                {sysLineage.map(e => (
                  <div key={e.id} className="rounded-lg border border-slate-200 px-3 py-2 text-[12px]">
                    <div className="font-semibold text-slate-700">
                      {systemById(e.from)?.name ?? e.from} <span className="text-blue-500">→</span> {systemById(e.to)?.name ?? e.to}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">{e.transform}</div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[12px] text-slate-400">Chưa ghi nhận quan hệ mức hệ thống</span>
            )}
            <ActionButton variant="soft" className="mt-2" to="/governance/lineage">Xem bản đồ luồng dữ liệu</ActionButton>
          </Panel>

          <Panel title="Độ hoàn thiện metadata">
            <ProgressBar pct={s.metadataScore} target={85} note={`${s.metadataScore}% · mục tiêu 85%`} />
            <div className="mt-3 space-y-1.5 text-[12px]">
              {[
                ['Có mục đích sử dụng', !!s.purpose],
                ['Có đơn vị quản lý', !!s.unit],
                ['Có đầu mối kỹ thuật', !!s.techOwner],
                ['Có Người sở hữu dữ liệu', !!s.dataOwner],
                ['Đã gán miền dữ liệu', s.domainIds.length > 0],
                ['Metadata đã phê duyệt', s.approval === 'Đã phê duyệt'],
              ].map(([l, ok]) => (
                <div key={l as string} className="flex items-center justify-between">
                  <span className="text-slate-600">{l}</span>
                  <Chip tone={ok ? 'g' : 'r'}>{ok ? 'Đạt' : 'Thiếu'}</Chip>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

export function SystemCreate() {
  const save = useDemoSave('/catalog/systems')
  const [step, setStep] = useState(0)
  const [f, setF] = useState({
    id: '', name: '', purpose: '', kind: 'Ứng dụng nghiệp vụ', tech: '',
    unit: '', techOwner: '', dataOwner: '', env: 'Production', status: 'Đang sử dụng',
  })
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }))
  const ok = f.name && f.purpose && f.tech && f.unit && f.techOwner && f.dataOwner

  return (
    <>
      <PageHeader
        code="1.2"
        title="Thêm hệ thống / nguồn dữ liệu"
        desc="Bộ trường theo tiêu chuẩn thông tin mô tả GĐ2 mục 5.1"
        crumbs={[{ label: 'Data Catalog' }, { label: 'Hệ thống & Nguồn dữ liệu', href: '/catalog/systems' }, { label: 'Thêm mới' }]}
      />
      <Steps items={['Thông tin chung', 'Trách nhiệm quản lý', 'Xem lại']} current={step} onJump={setStep} />

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title={['Thông tin chung', 'Trách nhiệm quản lý', 'Xem lại và gửi duyệt'][step]}>
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Mã hệ thống" hint="Để trống để hệ thống tự sinh"><TextInput mono value={f.id} onChange={set('id')} placeholder="HT-11" /></Field>
              <Field label="Tên hệ thống" info="system.name" required><TextInput value={f.name} onChange={set('name')} placeholder="Hệ thống CRM — quản lý khách hàng" /></Field>
              <Field label="Mục đích sử dụng" info="system.purpose" required full hint="Ví dụ: quản lý hồ sơ khách hàng, hợp đồng và lịch sử chăm sóc">
                <TextArea rows={2} value={f.purpose} onChange={set('purpose')} />
              </Field>
              <Field label="Loại hệ thống / vùng lưu trữ" info="system.kind" required>
                <SelectInput value={f.kind} onChange={set('kind')}>
                  {SYSTEM_KINDS.map(k => <option key={k}>{k}</option>)}
                </SelectInput>
              </Field>
              <Field label="Công nghệ nền tảng" info="system.tech" required><TextInput mono value={f.tech} onChange={set('tech')} placeholder="Oracle 19c" /></Field>
              <Field label="Môi trường" info="system.env" required>
                <SelectInput value={f.env} onChange={set('env')}>{ENVIRONMENTS.map(e => <option key={e}>{e}</option>)}</SelectInput>
              </Field>
              <Field label="Trạng thái sử dụng" required>
                <SelectInput value={f.status} onChange={set('status')}>{SYSTEM_STATUS.map(e => <option key={e}>{e}</option>)}</SelectInput>
              </Field>
            </div>
          )}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Đơn vị quản lý" info="system.unit" required>
                <SelectInput value={f.unit} onChange={set('unit')}>
                  <option value="">— Chọn —</option>
                  {ORG_UNITS.map(u => <option key={u}>{u}</option>)}
                </SelectInput>
              </Field>
              <Field label="Đầu mối kỹ thuật" info="system.techOwner" required>
                <SelectInput value={f.techOwner} onChange={set('techOwner')}>
                  <option value="">— Chọn —</option>
                  {usersByRole('Đầu mối kỹ thuật').map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </SelectInput>
              </Field>
              <Field label="Người sở hữu dữ liệu" info="system.dataOwner" required hint="Người phê duyệt định nghĩa và phạm vi sử dụng dữ liệu của hệ thống">
                <SelectInput value={f.dataOwner} onChange={set('dataOwner')}>
                  <option value="">— Chọn —</option>
                  {usersByRole('Người sở hữu dữ liệu').map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </SelectInput>
              </Field>
              <Field label="Miền dữ liệu phục vụ" hint="Có thể bổ sung sau khi khai bảng">
                <SelectInput><option value="">— Chọn nhiều —</option>{domains.map(d => <option key={d.id}>{d.name}</option>)}</SelectInput>
              </Field>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <InfoGrid
                items={[
                  { label: 'Tên hệ thống', value: f.name || '—' },
                  { label: 'Loại', value: f.kind },
                  { label: 'Công nghệ', value: f.tech || '—' },
                  { label: 'Môi trường', value: f.env },
                  { label: 'Đơn vị quản lý', value: f.unit || '—' },
                  { label: 'Đầu mối kỹ thuật', value: f.techOwner || '—' },
                  { label: 'Người sở hữu dữ liệu', value: f.dataOwner || '—' },
                  { label: 'Trạng thái', value: f.status },
                  { label: 'Mục đích sử dụng', value: f.purpose || '—', full: true },
                ]}
              />
              <Note tone={ok ? 'ok' : 'warn'} title={ok ? 'Đủ điều kiện gửi duyệt' : 'Còn thiếu thông tin bắt buộc'}>
                {ok ? 'Bản ghi sẽ chuyển sang trạng thái Chờ phê duyệt và xuất hiện tại menu 2.4.' : 'Cần điền đủ tên, mục đích, công nghệ, đơn vị quản lý và hai vai trò phụ trách.'}
              </Note>
            </div>
          )}
        </Panel>

        <Panel title="Vì sao phải khai hệ thống trước">
          <Note tone="info">
            Thứ tự khai báo bắt buộc: <b>chuẩn tên · miền · nhãn · hệ thống</b> → <b>bảng</b> → <b>cột</b> → <b>job</b> → <b>lineage</b> → <b>luật chất lượng</b> → <b>quyền</b>.
            Khai bảng mà chưa có hệ thống thì không truy được nguồn gốc dữ liệu về tận nơi phát sinh.
          </Note>
        </Panel>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/catalog/systems">Huỷ</ActionButton>
        <div className="flex gap-2">
          {step > 0 && <ActionButton variant="ghost" onClick={() => setStep(s => s - 1)}>Quay lại</ActionButton>}
          {step < 2
            ? <ActionButton onClick={() => setStep(s => s + 1)}>Tiếp tục</ActionButton>
            : <ActionButton disabled={!ok} onClick={() => save('Đã gửi phê duyệt hệ thống mới')}>Gửi phê duyệt</ActionButton>}
        </div>
      </div>
    </>
  )
}


/**
 * Menu 1.1 — Hệ thống & Nguồn dữ liệu.
 * Gộp menu cũ 1.4 "Kênh trao đổi dữ liệu" thành tab: kênh là QUAN HỆ giữa hai hệ thống,
 * không phải một thực thể đứng riêng (nguyên tắc NT7).
 */
export function SystemsPage() {
  const { pathname } = useLocation()
  const tab = pathname.endsWith('/channels') ? 'channels' : 'systems'

  return (
    <>
      <PageHeader
        code="1.1"
        title="Hệ thống & Nguồn dữ liệu"
        desc={
          tab === 'systems'
            ? 'Quản lý hệ thống tạo ra dữ liệu và nơi dữ liệu được lưu trữ — nhóm đối tượng số 1 trong 7 nhóm bắt buộc của GĐ2'
            : 'Đường trao đổi dữ liệu giữa hai hệ thống — cả chiều nhận về và chiều gửi đi'
        }
        crumbs={[{ label: 'Data Catalog' }, { label: 'Hệ thống & Nguồn dữ liệu' }]}
        actions={
          tab === 'systems' ? (
            <>
              <ActionButton variant="ghost" icon="import">Nạp từ file</ActionButton>
              <ActionButton icon="plus" to="/catalog/systems/create">Thêm hệ thống</ActionButton>
            </>
          ) : (
            <>
              <ActionButton variant="ghost" icon="import">Nạp từ file</ActionButton>
              <ActionButton icon="plus" to="/catalog/channels/create">Thêm kênh</ActionButton>
            </>
          )
        }
      />

      <RouteTabs
        items={[
          { label: 'Hệ thống', to: '/catalog/systems', end: true, badge: systems.length },
          { label: 'Kênh trao đổi', to: '/catalog/systems/channels', badge: channels.length },
        ]}
      />

      {tab === 'systems' ? <SystemList embedded /> : <ChannelList embedded />}
    </>
  )
}
