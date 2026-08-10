import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  PageHeader, KpiRow, FilterBar, DataTable, Panel, Note, Chip, StatusChip, DimensionChip,
  ActionButton, IconBtn, RowActions, EntityLink, InfoGrid, EmptyState, StatusFlow, Timeline,
  Modal, useToast, Field, TextArea, SelectInput, SectionTitle, MiniBars, ProgressBar, InlineTabs,
} from '@/components/common'
import { incidents, incidentById, CLOSE_REASONS, ruleInstances, tableById, fmt, users } from '@/data'
import { useUser } from '@/app/UserContext'
import { match } from '@/lib/demo'

const STATUS_STEPS = [
  { label: 'Mới', tone: 'b' as const },
  { label: 'Đã gán', tone: 'b' as const },
  { label: 'Đang xử lý', tone: 'o' as const },
  { label: 'Chờ kiểm tra lại', tone: 'p' as const },
  { label: 'Đã giải quyết', tone: 'g' as const },
  { label: 'Chờ duyệt đóng', tone: 'o' as const },
  { label: 'Đã đóng', tone: 'n' as const },
]

export function IncidentList() {
  const [q, setQ] = useState('')
  const [sev, setSev] = useState('')
  const [status, setStatus] = useState('')

  const rows = useMemo(
    () => incidents.filter(i =>
      (!sev || i.severity === sev) && (!status || i.status === status) &&
      match(`${i.id} ${i.title} ${i.objectId} ${i.ruleName} ${i.assignee ?? ''}`, q)),
    [q, sev, status]
  )

  const open = incidents.filter(i => i.status !== 'Đã đóng')
  const overdue = open.filter(i => i.openedDays >= 3)

  return (
    <>
      <PageHeader
        code="3.3"
        title="Sự cố chất lượng"
        desc="Biến cảnh báo thành việc có người chịu trách nhiệm và có hạn — vòng đời 7 trạng thái, có kiểm tra lại tự động và nguyên tắc 4 mắt"
        crumbs={[{ label: 'Data Quality' }, { label: 'Sự cố chất lượng' }]}
        actions={<ActionButton variant="ghost" icon="export">Xuất báo cáo sự cố</ActionButton>}
      />

      <StatusFlow
        steps={STATUS_STEPS.map(s => ({ ...s, count: incidents.filter(i => i.status === s.label).length }))}
        active={status}
        onPick={l => setStatus(status === l ? '' : l)}
      />

      <KpiRow
        items={[
          { label: 'Sự cố đang mở', value: open.length, sub: `${incidents.length} sự cố trong kỳ`, tone: 'warn' },
          { label: 'Chưa có người xử lý', value: incidents.filter(i => !i.assignee && i.status !== 'Đã đóng').length, sub: 'bảng chưa gán đầu mối', tone: 'bad' },
          { label: 'Quá hạn', value: overdue.length, sub: 'mở quá 3 ngày', tone: 'bad' },
          { label: 'Lỗi lặp lại nhiều nhất', value: Math.max(...incidents.map(i => i.recurrence)), sub: 'lần — nguyên nhân gốc chưa xử lý', tone: 'bad' },
          { label: 'Thời gian xử lý trung bình', value: '18 giờ', sub: 'cam kết 24 giờ với mức Nghiêm trọng', tone: 'ok' },
        ]}
      />

      <div className="mt-4">
        <FilterBar
          placeholder="Tìm theo mã sự cố, bảng, luật, người xử lý…"
          value={q}
          onChange={setQ}
          filters={[
            { label: 'Mức độ', options: ['Nghiêm trọng', 'Cao', 'Trung bình', 'Thấp'], value: sev, onChange: setSev },
            { label: 'Trạng thái', options: STATUS_STEPS.map(s => s.label), value: status, onChange: setStatus },
          ]}
          right={<span className="text-[12px] text-slate-400">{rows.length} sự cố</span>}
        />
      </div>

      <DataTable
        stt
        rows={rows}
        rowKey={i => i.id}
        highlightRow={i => (i.severity === 'Nghiêm trọng' && i.status !== 'Đã đóng' ? 'bad' : !i.assignee && i.status !== 'Đã đóng' ? 'warn' : undefined)}
        columns={[
          { key: 'id', label: 'Mã sự cố', nowrap: true, render: i => <EntityLink to={`/quality/incidents/${i.id}`}>{i.id}</EntityLink> },
          { key: 'title', label: 'Tiêu đề', width: '22%', render: i => <div><div className="font-semibold text-slate-800">{i.title}</div><div className="mono text-[11px] text-slate-400">{i.objectId}{i.column ? `.${i.column}` : ''}</div></div> },
          { key: 'rule', label: 'Luật hỏng', width: '14%', render: i => <div><div className="text-[12px]">{i.ruleName}</div><div className="mono text-[10.5px] text-slate-400">{i.ruleId}</div></div> },
          { key: 'dimension', label: 'Chiều', nowrap: true, render: i => <DimensionChip id={i.dimension} /> },
          { key: 'severity', label: 'Mức ưu tiên', nowrap: true, render: i => <StatusChip value={i.severity} /> },
          { key: 'assignee', label: 'Người xử lý', nowrap: true, render: i => i.assignee ?? <span className="font-semibold text-red-600">— chưa gán</span> },
          { key: 'dueAt', label: 'Hạn xử lý', nowrap: true, render: i => <span className="mono text-[11.5px]">{i.dueAt}</span> },
          { key: 'failedRows', label: 'Dòng lỗi', align: 'right', nowrap: true, render: i => (i.failedRows ? fmt(i.failedRows) : '—') },
          { key: 'recurrence', label: 'Lặp lại', align: 'center', nowrap: true, render: i => (i.recurrence > 3 ? <Chip tone="r">{i.recurrence} lần</Chip> : <span>{i.recurrence} lần</span>) },
          { key: 'openedDays', label: 'Đã mở', align: 'right', nowrap: true, render: i => (i.openedDays >= 3 ? <span className="font-bold text-red-600">{i.openedDays} ngày</span> : `${i.openedDays} ngày`) },
          { key: 'status', label: 'Trạng thái', nowrap: true, render: i => <StatusChip value={i.status} /> },
          { key: 'act', label: '', align: 'right', nowrap: true, render: i => <RowActions><IconBtn icon="open" title="Mở chi tiết" to={`/quality/incidents/${i.id}`} /></RowActions> },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Note tone="bad" title="Sự cố SC-0229 chưa ai nhận">
          Bảng <span className="mono">rr.diem_rui_ro_kh</span> chưa gán đầu mối nghiệp vụ nên hệ thống <b>không tự gán được người xử lý</b>.
          Đây là hệ quả trực tiếp của việc {fmt(7578)} bảng chưa có người phụ trách ở menu 1.1.
        </Note>
        <Note tone="warn" title="Bổ sung sau review: trạng thái “Chờ kiểm tra lại”">
          GĐ3 · FR-04 yêu cầu <i>"kiểm tra lại dữ liệu sau khi xử lý để xác nhận lỗi đã được khắc phục trước khi đóng"</i>.
          Thiết kế ban đầu chỉ có <i>Chờ duyệt</i> (4 mắt của người) — thiếu bước <b>máy chạy lại luật</b>.
          Nay có đủ hai bước: máy kiểm lại → người duyệt đóng.
        </Note>
      </div>
    </>
  )
}

export function IncidentDetail() {
  const { id = '' } = useParams()
  const inc = incidentById(id)
  const { user } = useUser()
  const toast = useToast()
  const [closeOpen, setCloseOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [comment, setComment] = useState('')

  if (!inc) return <EmptyState text="Không tìm thấy sự cố" action={<ActionButton to="/quality/incidents">Về danh sách</ActionButton>} />

  const rule = ruleInstances.find(r => r.id === inc.ruleId)
  const table = tableById(inc.objectId)
  const isAssignee = inc.assignee === user.name
  const canClose = inc.status === 'Chờ duyệt đóng' && !isAssignee

  return (
    <>
      <PageHeader
        code="3.3"
        title={inc.title}
        desc={`${inc.id} · ${inc.objectId}${inc.column ? `.${inc.column}` : ''} · luật ${inc.ruleId}`}
        crumbs={[{ label: 'Data Quality' }, { label: 'Sự cố chất lượng', href: '/quality/incidents' }, { label: inc.id }]}
        actions={
          <>
            <StatusChip value={inc.severity} />
            <StatusChip value={inc.status} />
            {inc.status !== 'Đã đóng' && <ActionButton variant="ghost" onClick={() => setAssignOpen(true)}>Gán người xử lý</ActionButton>}
            {inc.status !== 'Đã đóng' && (
              <ActionButton
                variant={canClose ? 'primary' : 'ghost'}
                disabled={!canClose}
                title={isAssignee ? 'Nguyên tắc 4 mắt — người xử lý không được tự đóng' : inc.status !== 'Chờ duyệt đóng' ? 'Sự cố phải ở trạng thái Chờ duyệt đóng' : undefined}
                onClick={() => setCloseOpen(true)}
              >
                Đóng sự cố
              </ActionButton>
            )}
          </>
        }
      />

      <StatusFlow
        steps={STATUS_STEPS.map(s => ({ ...s, count: undefined }))}
        active={inc.status}
      />

      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4">
          <Panel title="Thông tin sự cố">
            <InfoGrid
              items={[
                { label: 'Mã sự cố', value: <span className="mono">{inc.id}</span> },
                { label: 'Đối tượng', value: table ? <EntityLink to={`/catalog/tables/${encodeURIComponent(inc.objectId)}`}>{inc.objectId}</EntityLink> : inc.objectId },
                { label: 'Cột', value: inc.column ?? '(mức bảng)' },
                { label: 'Luật hỏng', value: `${inc.ruleName} (${inc.ruleId})` },
                { label: 'Chiều chất lượng', value: <DimensionChip id={inc.dimension} /> },
                { label: 'Mức ưu tiên', value: <StatusChip value={inc.severity} /> },
                { label: 'Phát hiện lúc', value: inc.openedAt },
                { label: 'Hạn xử lý', value: inc.dueAt },
                { label: 'Số dòng lỗi', value: fmt(inc.failedRows) },
                { label: 'Số lần lặp lại', value: `${inc.recurrence} lần` },
                { label: 'Nguyên nhân gốc', value: inc.rootCause ?? '— chưa xác định', full: true },
                { label: 'Lý do đóng', value: inc.closeReason ?? '— chưa đóng', full: true },
              ]}
            />
          </Panel>

          {!!inc.sampleRows.length && (
            <Panel title={`Dòng dữ liệu lỗi mẫu (${inc.sampleRows.length} / ${fmt(inc.failedRows)} dòng)`}>
              <DataTable
                dense
                rows={inc.sampleRows}
                columns={Object.keys(inc.sampleRows[0]).map(k => ({
                  key: k,
                  label: <span className="mono">{k}</span>,
                  render: (row: any) => <span className={k === inc.column || k === 'loi' ? 'mono font-semibold text-red-600' : 'mono text-[11.5px]'}>{row[k] || '(rỗng)'}</span>,
                }))}
              />
              <Note tone="info" className="mt-3">
                Hệ thống lưu tối đa <b>10.000 dòng lỗi</b> cho mỗi lần kiểm tra để người xử lý tra cứu — cấu hình ở menu 8.2.
              </Note>
            </Panel>
          )}

          <Panel title="Diễn biến xử lý">
            <Timeline items={inc.timeline} />
            <div className="mt-4 border-t border-slate-200 pt-3">
              <Field label="Thêm bình luận">
                <TextArea rows={2} value={comment} onChange={e => setComment(e.target.value)} placeholder="Ghi nhận tiến độ, nguyên nhân, cách khắc phục…" />
              </Field>
              <div className="mt-2 flex justify-end">
                <ActionButton
                  disabled={!comment.trim()}
                  onClick={() => { toast.success('Đã thêm bình luận', 'Người xử lý và người sở hữu dữ liệu nhận được thông báo.'); setComment('') }}
                >
                  Gửi bình luận
                </ActionButton>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Người xử lý và thời hạn">
            <InfoGrid
              cols={1}
              items={[
                { label: 'Người xử lý', value: inc.assignee ?? <span className="font-semibold text-red-600">— chưa gán</span> },
                { label: 'Người phát hiện', value: inc.reporter },
                { label: 'Hạn xử lý', value: inc.dueAt },
                { label: 'Đã mở', value: `${inc.openedDays} ngày` },
              ]}
            />
            {!inc.assignee && (
              <Note tone="bad" title="Không tự gán được người xử lý" className="mt-3">
                Bảng <span className="mono">{inc.objectId}</span> chưa có đầu mối nghiệp vụ.
                Hãy gán người phụ trách cho bảng tại menu 1.1 để lần sau hệ thống tự gán.
              </Note>
            )}
          </Panel>

          <Panel title="Kiểm tra lại tự động" tone={inc.recheck?.result === 'Đạt' ? 'ok' : inc.recheck ? 'bad' : 'default'}>
            {inc.recheck ? (
              <>
                <InfoGrid
                  cols={1}
                  items={[
                    { label: 'Thời điểm kiểm tra lại', value: inc.recheck.at },
                    { label: 'Kết quả', value: <StatusChip value={inc.recheck.result} /> },
                    { label: 'Điểm đạt được', value: `${inc.recheck.score}%` },
                  ]}
                />
                {inc.recheck.result === 'Không đạt' && (
                  <Note tone="bad" title="Kiểm tra lại chưa đạt" className="mt-3">
                    Dữ liệu vẫn chưa đạt sau khi xử lý — phiếu <b>quay lại trạng thái phân công</b> theo quy trình GĐ3 mục 6.
                  </Note>
                )}
              </>
            ) : (
              <div className="text-[12px] text-slate-500">
                Chưa chạy kiểm tra lại. Sau khi người xử lý đánh dấu <b>Đã xử lý</b>, hệ thống tự chạy lại luật <span className="mono">{inc.ruleId}</span> để xác nhận.
              </div>
            )}
            {inc.status !== 'Đã đóng' && (
              <ActionButton
                variant="soft"
                className="mt-3"
                icon="run"
                onClick={() => toast.info('Đang chạy kiểm tra lại', `Chạy lại luật ${inc.ruleId} trên ${inc.objectId} — minh hoạ.`)}
              >
                Chạy kiểm tra lại ngay
              </ActionButton>
            )}
          </Panel>

          <Panel title="Nguyên tắc bốn mắt" tone={isAssignee ? 'warn' : 'default'}>
            <div className="space-y-2 text-[12px] text-slate-600">
              <div className="flex items-center justify-between">
                <span>Người xử lý</span>
                <Chip tone="b">{inc.assignee ?? '—'}</Chip>
              </div>
              <div className="flex items-center justify-between">
                <span>Người được phép đóng</span>
                <Chip tone="g">Người khác người xử lý</Chip>
              </div>
              <div className="flex items-center justify-between">
                <span>Bạn đang là</span>
                <Chip tone={isAssignee ? 'r' : 'g'}>{user.name}</Chip>
              </div>
            </div>
            {isAssignee && (
              <Note tone="warn" title="Bạn không được tự đóng sự cố này" className="mt-3">
                Bạn là người xử lý. Hãy chuyển phiếu sang <b>Chờ duyệt đóng</b> để người khác kiểm chứng và đóng.
                Đổi vai ở góc trên bên phải để xem trải nghiệm của người duyệt.
              </Note>
            )}
          </Panel>

          {rule && (
            <Panel title="Xu hướng luật 7 ngày">
              <MiniBars values={rule.trend} threshold={rule.crit} height={44} />
              <div className="mt-2 text-[11.5px] text-slate-500">
                Ngưỡng cảnh báo {rule.warn}% · nghiêm trọng {rule.crit}% · điểm gần nhất <b>{rule.lastScore}%</b>
              </div>
            </Panel>
          )}
        </div>
      </div>

      {/* Modal đóng sự cố */}
      <Modal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        title="Đóng sự cố"
        desc={`${inc.id} — ${inc.title}`}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setCloseOpen(false)}>Huỷ</ActionButton>
            <ActionButton
              disabled={!reason}
              onClick={() => { setCloseOpen(false); toast.success('Đã đóng sự cố', `${inc.id} — lý do: ${reason}`) }}
            >
              Xác nhận đóng
            </ActionButton>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Lý do đóng" required hint="Bắt buộc chọn một trong sáu lý do — dùng để phân tích nguyên nhân gốc về sau">
            <div className="space-y-1.5">
              {CLOSE_REASONS.map(r => (
                <label key={r} className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition ${reason === r ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" className="mt-1" checked={reason === r} onChange={() => setReason(r)} />
                  <span className="text-[12.5px] text-slate-700">{r}</span>
                </label>
              ))}
            </div>
          </Field>
          {reason === 'Cảnh báo sai — luật đặt chưa đúng' && (
            <Note tone="warn" title="Đóng vì cảnh báo sai sẽ được thống kê riêng">
              Tỷ lệ báo động giả hiện là <b>18%</b> — ngưỡng đỏ là 25%. Vượt ngưỡng thì người dùng sẽ bắt đầu bỏ qua cảnh báo thật.
              Hãy sửa lại ngưỡng hoặc tham số của luật <span className="mono">{inc.ruleId}</span> thay vì chỉ đóng phiếu.
            </Note>
          )}
          <Field label="Ghi chú thêm">
            <TextArea rows={2} value={note} onChange={e => setNote(e.target.value)} />
          </Field>
        </div>
      </Modal>

      {/* Modal gán người */}
      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Gán người xử lý"
        desc={inc.id}
        size="sm"
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setAssignOpen(false)}>Huỷ</ActionButton>
            <ActionButton onClick={() => { setAssignOpen(false); toast.success('Đã gán người xử lý', 'Người được gán nhận thông báo qua email và Telegram.') }}>Gán</ActionButton>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Người xử lý" required hint="Mặc định gợi ý đầu mối nghiệp vụ và kỹ thuật của bảng">
            <SelectInput defaultValue={inc.assignee ?? ''}>
              <option value="">— Chọn —</option>
              {users.filter(u => u.employed).map(u => <option key={u.id} value={u.name}>{u.name} — {u.role}</option>)}
            </SelectInput>
          </Field>
          <Field label="Hạn xử lý" hint="Mức Nghiêm trọng mặc định 24 giờ">
            <SelectInput defaultValue="24h">
              <option value="24h">24 giờ</option><option value="72h">72 giờ</option><option value="7d">7 ngày</option>
            </SelectInput>
          </Field>
        </div>
      </Modal>
    </>
  )
}
