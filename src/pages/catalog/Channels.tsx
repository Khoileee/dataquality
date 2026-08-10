import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  PageHeader, KpiRow, FilterBar, DataTable, CellTitle, Panel, Note, Chip, StatusChip,
  ActionButton, IconBtn, RowActions, EntityLink, InfoGrid, EmptyState, Field, TextInput,
  TextArea, SelectInput, Steps, FlowDiagram,
} from '@/components/common'
import { channels, systems, systemById, STATS } from '@/data'
import { CHANNEL_KINDS, CHANNEL_DIRECTIONS, DATA_FORMATS, CONFIDENTIALITY_NAMES, usersByRole } from '@/data/enums'
import { match, useDemoSave } from '@/lib/demo'

const dirTone = (d: string) => (d === 'Gửi đi' ? 'o' : d === 'Nhận về' ? 'b' : 'p')

export function ChannelList({ embedded }: { embedded?: boolean } = {}) {
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('')
  const [dir, setDir] = useState('')

  const rows = useMemo(
    () => channels.filter(c => (!kind || c.kind === kind) && (!dir || c.direction === dir) && match(`${c.id} ${c.name} ${c.purpose} ${c.payload}`, q)),
    [q, kind, dir]
  )

  const weakAuth = channels.filter(c => c.auth.includes('chưa mã hoá')).length

  return (
    <>
      {!embedded && (
        <PageHeader
          code="1.2"
          title="Kênh trao đổi dữ liệu"
          desc="Giao diện lập trình ứng dụng (API), kênh Kafka, FTP/SFTP và các phương thức gửi — nhận dữ liệu giữa các hệ thống"
          crumbs={[{ label: 'Data Catalog' }, { label: 'Kênh trao đổi dữ liệu' }]}
          actions={
            <>
              <ActionButton variant="ghost" icon="import">Nạp từ file</ActionButton>
              <ActionButton icon="plus" to="/catalog/channels/create">Thêm kênh</ActionButton>
            </>
          }
        />
      )}

      <KpiRow
        items={[
          { label: 'Tổng số kênh', value: STATS.totalChannels, sub: `${channels.length} kênh đã khai chi tiết` },
          { label: 'Kênh gửi ra ngoài', value: channels.filter(c => c.direction !== 'Nhận về').length, sub: 'điểm rủi ro lộ dữ liệu', tone: 'warn' },
          { label: 'Chứa dữ liệu nhạy cảm', value: channels.filter(c => c.confidentiality === 'Mật' || c.confidentiality === 'Hạn chế truy cập').length, sub: 'mức Mật trở lên', tone: 'bad' },
          { label: 'Xác thực yếu', value: weakAuth, sub: 'chưa mã hoá đường truyền', tone: 'bad' },
          { label: 'Chờ phê duyệt', value: channels.filter(c => c.approval !== 'Đã phê duyệt').length, sub: 'metadata chưa có hiệu lực', tone: 'warn' },
        ]}
      />

      <div className="mt-4">
        <FilterBar
          placeholder="Tìm theo tên kênh, mục đích, nội dung trao đổi…"
          value={q}
          onChange={setQ}
          filters={[
            { label: 'Loại', options: ['API', 'Kafka', 'SFTP', 'FTP', 'File Share', 'Webhook'], value: kind, onChange: setKind },
            { label: 'Chiều', options: ['Gửi đi', 'Nhận về', 'Hai chiều'], value: dir, onChange: setDir },
          ]}
          right={<span className="text-[12px] text-slate-400">{rows.length} kênh</span>}
        />
      </div>

      <DataTable
        stt
        rows={rows}
        rowKey={c => c.id}
        highlightRow={c => (c.auth.includes('chưa mã hoá') ? 'bad' : c.approval !== 'Đã phê duyệt' ? 'warn' : undefined)}
        columns={[
          { key: 'name', label: 'Kênh', width: '22%', render: c => <CellTitle title={<EntityLink to={`/catalog/channels/${c.id}`} mono={false}>{c.name}</EntityLink>} sub={`${c.id} · ${c.purpose}`} /> },
          { key: 'kind', label: 'Loại', nowrap: true, render: c => <Chip tone="t">{c.kind}</Chip> },
          { key: 'dir', label: 'Chiều', nowrap: true, render: c => <Chip tone={dirTone(c.direction)}>{c.direction}</Chip> },
          { key: 'flow', label: 'Hệ thống gửi → nhận', width: '18%', render: c => <span className="text-[11.5px]">{systemById(c.fromSystem)?.name ?? c.fromSystem} <span className="text-blue-500">→</span> {systemById(c.toSystem)?.name ?? c.toSystem}</span> },
          { key: 'payload', label: 'Dữ liệu trao đổi', width: '16%', render: c => <span className="text-[11.5px]">{c.payload}</span> },
          { key: 'format', label: 'Định dạng', nowrap: true, render: c => <Chip tone="n">{c.format}</Chip> },
          { key: 'frequency', label: 'Tần suất', nowrap: true },
          { key: 'auth', label: 'Xác thực', width: '13%', render: c => <span className={c.auth.includes('chưa mã hoá') ? 'text-[11.5px] font-semibold text-red-600' : 'text-[11.5px]'}>{c.auth}</span> },
          { key: 'conf', label: 'Phân loại', nowrap: true, render: c => <StatusChip value={c.confidentiality} /> },
          { key: 'status', label: 'Trạng thái', nowrap: true, render: c => <Chip tone={c.status === 'Đang hoạt động' ? 'g' : c.status === 'Tạm dừng' ? 'o' : 'n'}>{c.status}</Chip> },
          { key: 'approval', label: 'Phê duyệt', nowrap: true, render: c => <StatusChip value={c.approval} /> },
          { key: 'act', label: '', align: 'right', nowrap: true, render: c => <RowActions><IconBtn icon="open" title="Chi tiết" to={`/catalog/channels/${c.id}`} /><IconBtn icon="edit" title="Sửa" to={`/catalog/channels/create?id=${c.id}`} /></RowActions> },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Note tone="bad" title="Rủi ro phát hiện được nhờ khai kênh">
          <b>KENH-05</b> gửi báo cáo doanh số cho đối tác B qua FTP <b>user/password không mã hoá</b>.
          Nếu không quản lý kênh như một đối tượng metadata thì không ai rà soát ra điều này —
          Cửa nạp dữ liệu (menu 4.2) chỉ quản lý chiều <i>nhận về</i>, không quản lý chiều <i>gửi đi</i>.
        </Note>
        <Note tone="info" title="Khai ở đây, dùng ở đâu">
          Kênh nhận về sinh ra quan hệ luồng dữ liệu ở menu <b>2.3</b> (nguồn → bảng thô) ·
          Kênh gửi đi được kiểm tra mức phân loại trước khi xuất dữ liệu ở menu <b>5.2</b> ·
          Thoả thuận chia sẻ bên thứ ba ở menu <b>6.2</b> tham chiếu trực tiếp mã kênh.
        </Note>
      </div>
    </>
  )
}

export function ChannelDetail() {
  const { id = '' } = useParams()
  const c = channels.find(x => x.id === id)
  if (!c) return <EmptyState text="Không tìm thấy kênh trao đổi" action={<ActionButton to="/catalog/channels">Về danh sách</ActionButton>} />

  const from = systemById(c.fromSystem)
  const to = systemById(c.toSystem)

  return (
    <>
      <PageHeader
        code="1.2"
        title={c.name}
        desc={`${c.id} · ${c.purpose}`}
        crumbs={[{ label: 'Data Catalog' }, { label: 'Kênh trao đổi dữ liệu', href: '/catalog/channels' }, { label: c.id }]}
        actions={
          <>
            <Chip tone="t">{c.kind}</Chip>
            <Chip tone={dirTone(c.direction)}>{c.direction}</Chip>
            <StatusChip value={c.approval} />
            <ActionButton variant="ghost" icon="edit" to={`/catalog/channels/create?id=${c.id}`}>Sửa</ActionButton>
          </>
        }
      />

      <Panel title="Đường đi của dữ liệu" className="mb-4">
        <FlowDiagram
          height={110}
          width={860}
          nodes={[
            { id: 'from', x: 20, y: 25, w: 220, h: 60, title: from?.name ?? c.fromSystem, sub: `${c.fromSystem} · ${from?.tech ?? ''}`, tone: 'source', to: `/catalog/systems/${c.fromSystem}` },
            { id: 'ch', x: 320, y: 25, w: 200, h: 60, title: c.id, sub: `${c.kind} · ${c.format}`, tone: 'active', badge: { text: c.confidentiality, tone: c.confidentiality === 'Hạn chế truy cập' ? 'r' : c.confidentiality === 'Mật' ? 'o' : 'b' } },
            { id: 'to', x: 600, y: 25, w: 220, h: 60, title: to?.name ?? c.toSystem, sub: `${c.toSystem} · ${to?.tech ?? ''}`, tone: 'target', to: `/catalog/systems/${c.toSystem}` },
          ]}
          edges={[
            { from: 'from', to: 'ch', label: c.frequency },
            { from: 'ch', to: 'to' },
          ]}
        />
      </Panel>

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title="Thông tin mô tả — theo bộ tiêu chuẩn GĐ2 mục 5.4">
          <InfoGrid
            items={[
              { label: 'Mã kênh', value: <span className="mono">{c.id}</span> },
              { label: 'Tên kênh', value: c.name },
              { label: 'Mục đích sử dụng', value: c.purpose, full: true },
              { label: 'Loại kết nối', value: c.kind },
              { label: 'Chiều dữ liệu', value: c.direction },
              { label: 'Hệ thống gửi', value: from ? <EntityLink to={`/catalog/systems/${from.id}`} mono={false}>{from.name}</EntityLink> : c.fromSystem },
              { label: 'Hệ thống nhận', value: to ? <EntityLink to={`/catalog/systems/${to.id}`} mono={false}>{to.name}</EntityLink> : c.toSystem },
              { label: 'Dữ liệu / file được trao đổi', value: c.payload, full: true },
              { label: 'Định dạng', value: c.format },
              { label: 'Tần suất', value: c.frequency },
              { label: 'Phương thức xác thực', value: <span className={c.auth.includes('chưa mã hoá') ? 'font-semibold text-red-600' : ''}>{c.auth}</span> },
              { label: 'Người phụ trách kênh', value: c.owner },
              { label: 'Mức phân loại', value: <StatusChip value={c.confidentiality} /> },
              { label: 'Khối lượng', value: c.volumeDay },
              { label: 'Trạng thái', value: c.status },
              { label: 'Cập nhật lần cuối', value: c.updatedAt },
            ]}
          />
        </Panel>

        <div className="space-y-4">
          <Panel title="Bảng dữ liệu liên quan">
            {c.linkedTables.length ? (
              <div className="space-y-1.5">
                {c.linkedTables.map(t => (
                  <div key={t} className="rounded-lg border border-slate-200 px-3 py-2">
                    <EntityLink to={`/catalog/tables/${encodeURIComponent(t)}`}>{t}</EntityLink>
                  </div>
                ))}
              </div>
            ) : <span className="text-[12px] text-slate-400">Chưa gắn bảng nào</span>}
          </Panel>

          {c.auth.includes('chưa mã hoá') && (
            <Note tone="bad" title="Phát hiện rủi ro bảo mật">
              Kênh này gửi dữ liệu ra ngoài tổ chức bằng FTP với tài khoản/mật khẩu <b>không mã hoá đường truyền</b>.
              Đã bị người duyệt trả về trạng thái <b>Yêu cầu chỉnh sửa</b> (hồ sơ PD-0078).
              Đề xuất: chuyển sang SFTP hoặc API có mTLS trước khi phê duyệt.
            </Note>
          )}

          {(c.confidentiality === 'Mật' || c.confidentiality === 'Hạn chế truy cập') && (
            <Note tone="warn" title="Kênh mang dữ liệu nhạy cảm">
              Mọi lượt trao đổi qua kênh này phải được ghi nhật ký tại menu <b>5.4</b>.
              Nếu là kênh gửi ra bên thứ ba thì bắt buộc có thoả thuận chia sẻ tại menu <b>6.2</b>.
            </Note>
          )}
        </div>
      </div>
    </>
  )
}

export function ChannelCreate() {
  const save = useDemoSave('/catalog/channels')
  const [step, setStep] = useState(0)
  const [f, setF] = useState({
    name: '', purpose: '', kind: 'API', direction: 'Nhận về', fromSystem: '', toSystem: '',
    payload: '', format: 'JSON', frequency: '', auth: '', owner: '', conf: 'Nội bộ',
  })
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }))
  const ok = f.name && f.purpose && f.fromSystem && f.toSystem && f.payload && f.frequency && f.auth && f.owner
  const weak = f.auth.toLowerCase().includes('password') && !f.auth.toLowerCase().includes('tls')

  return (
    <>
      <PageHeader
        code="1.2"
        title="Thêm kênh trao đổi dữ liệu"
        desc="Bộ trường theo tiêu chuẩn thông tin mô tả GĐ2 mục 5.4"
        crumbs={[{ label: 'Data Catalog' }, { label: 'Kênh trao đổi dữ liệu', href: '/catalog/channels' }, { label: 'Thêm mới' }]}
      />
      <Steps items={['Thông tin chung', 'Hai đầu kết nối', 'Bảo mật & Xem lại']} current={step} onJump={setStep} />

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title={['Thông tin chung', 'Hệ thống gửi và nhận', 'Bảo mật và xem lại'][step]}>
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tên kênh" required full><TextInput value={f.name} onChange={set('name')} placeholder="Kênh gửi dữ liệu giao dịch sang hệ thống kế toán" /></Field>
              <Field label="Mục đích sử dụng" required full><TextArea rows={2} value={f.purpose} onChange={set('purpose')} /></Field>
              <Field label="Loại kết nối" info="channel.kind" required>
                <SelectInput value={f.kind} onChange={set('kind')}>{CHANNEL_KINDS.map(k => <option key={k}>{k}</option>)}</SelectInput>
              </Field>
              <Field label="Chiều dữ liệu" info="channel.direction" required>
                <SelectInput value={f.direction} onChange={set('direction')}>{CHANNEL_DIRECTIONS.map(k => <option key={k}>{k}</option>)}</SelectInput>
              </Field>
              <Field label="Định dạng" required>
                <SelectInput value={f.format} onChange={set('format')}>{DATA_FORMATS.map(k => <option key={k}>{k}</option>)}</SelectInput>
              </Field>
              <Field label="Tần suất" required hint="Ví dụ: thời gian thực · hằng ngày 05:30 · mỗi 4 giờ">
                <TextInput value={f.frequency} onChange={set('frequency')} />
              </Field>
            </div>
          )}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Hệ thống gửi" info="channel.fromSystem" required>
                <SelectInput value={f.fromSystem} onChange={set('fromSystem')}>
                  <option value="">— Chọn —</option>{systems.map(s => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
                </SelectInput>
              </Field>
              <Field label="Hệ thống nhận" required>
                <SelectInput value={f.toSystem} onChange={set('toSystem')}>
                  <option value="">— Chọn —</option>{systems.map(s => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
                </SelectInput>
              </Field>
              <Field label="Dữ liệu / file được trao đổi" required full hint="Mô tả nội dung và cấu trúc dữ liệu đi qua kênh">
                <TextArea rows={2} value={f.payload} onChange={set('payload')} placeholder="File CSV đối soát giao dịch — 18 cột, có 2 cột chứa dữ liệu cá nhân" />
              </Field>
              <Field label="Người phụ trách kênh" required>
                <SelectInput value={f.owner} onChange={set('owner')}>
                  <option value="">— Chọn —</option>
                  {usersByRole().map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </SelectInput>
              </Field>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phương thức xác thực" info="channel.auth" required full hint="Ví dụ: OAuth2 · mTLS + HMAC · SSH key + IP allowlist · SASL/SCRAM + TLS">
                  <TextInput value={f.auth} onChange={set('auth')} />
                </Field>
                <Field label="Mức phân loại dữ liệu đi qua kênh" required>
                  <SelectInput value={f.conf} onChange={set('conf')}>{CONFIDENTIALITY_NAMES.map(k => <option key={k}>{k}</option>)}</SelectInput>
                </Field>
              </div>
              {weak && (
                <Note tone="bad" title="Cảnh báo phương thức xác thực yếu">
                  Phương thức bạn khai dùng mật khẩu mà không có lớp mã hoá đường truyền. Với dữ liệu mức Mật trở lên,
                  người duyệt sẽ trả về <b>Yêu cầu chỉnh sửa</b>.
                </Note>
              )}
              {(f.conf === 'Mật' || f.conf === 'Hạn chế truy cập') && f.direction !== 'Nhận về' && (
                <Note tone="warn" title="Kênh gửi dữ liệu nhạy cảm ra ngoài">
                  Cần có thoả thuận chia sẻ bên thứ ba tại menu <b>6.2</b> và áp che dữ liệu trước khi gửi.
                </Note>
              )}
              <InfoGrid
                items={[
                  { label: 'Tên kênh', value: f.name || '—' },
                  { label: 'Loại · Chiều', value: `${f.kind} · ${f.direction}` },
                  { label: 'Gửi → Nhận', value: `${f.fromSystem || '—'} → ${f.toSystem || '—'}` },
                  { label: 'Tần suất', value: f.frequency || '—' },
                  { label: 'Xác thực', value: f.auth || '—' },
                  { label: 'Mức phân loại', value: f.conf },
                ]}
              />
            </div>
          )}
        </Panel>

        <Panel title="Bảy nhóm đối tượng bắt buộc — GĐ2 mục 3">
          <ol className="ml-4 list-decimal space-y-1 text-[12px] text-slate-600">
            <li>Hệ thống và nơi lưu trữ dữ liệu</li>
            <li>Bảng và cột dữ liệu</li>
            <li>Job và tiến trình xử lý dữ liệu</li>
            <li className="font-bold text-blue-700">Kênh trao đổi dữ liệu ← đang khai</li>
            <li>Thông tin nghiệp vụ (báo cáo, chỉ tiêu)</li>
            <li>Thuật ngữ nghiệp vụ</li>
            <li>Quan hệ luồng dữ liệu (lineage)</li>
          </ol>
        </Panel>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/catalog/channels">Huỷ</ActionButton>
        <div className="flex gap-2">
          {step > 0 && <ActionButton variant="ghost" onClick={() => setStep(s => s - 1)}>Quay lại</ActionButton>}
          {step < 2
            ? <ActionButton onClick={() => setStep(s => s + 1)}>Tiếp tục</ActionButton>
            : <ActionButton disabled={!ok} onClick={() => save('Đã gửi phê duyệt kênh trao đổi mới')}>Gửi phê duyệt</ActionButton>}
        </div>
      </div>
    </>
  )
}
