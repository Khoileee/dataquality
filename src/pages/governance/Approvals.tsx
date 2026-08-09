import { useMemo, useState } from 'react'
import {
  PageHeader, KpiRow, Panel, Note, Chip, StatusChip, ActionButton, DataTable, InlineTabs,
  FilterBar, EntityLink, Modal, useToast, InfoGrid, StatusFlow, Timeline, EmptyState,
  Field, TextArea, IconBtn, RowActions,
} from '@/components/common'
import { pendingApprovals, approvalHistory, glossary, tables, refdata, lineageEdges } from '@/data'
import { useUser } from '@/app/UserContext'
import { match } from '@/lib/demo'
import type { ApprovalItem } from '@/data/types'

const OBJECT_ROUTE: Record<string, (id: string) => string> = {
  'Bảng dữ liệu': id => `/catalog/tables/${encodeURIComponent(id)}`,
  'Thuật ngữ': id => `/governance/glossary/${id}`,
  'Danh mục tham chiếu': id => `/catalog/refdata/${id}`,
  'Kênh trao đổi dữ liệu': id => `/catalog/channels/${id}`,
  'Báo cáo': id => `/catalog/reports/${id}`,
  'Quan hệ luồng dữ liệu': () => `/governance/lineage`,
}

export function Approvals() {
  const [tab, setTab] = useState('pending')
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [pick, setPick] = useState<ApprovalItem | null>(null)
  const [action, setAction] = useState<'approve' | 'reject' | 'revise' | null>(null)
  const [reason, setReason] = useState('')
  const toast = useToast()
  const { user } = useUser()

  const rows = useMemo(() => {
    const src = tab === 'pending' ? pendingApprovals : approvalHistory
    return src.filter(a => (!type || a.objectType === type) && match(`${a.id} ${a.objectId} ${a.objectName} ${a.change} ${a.submittedBy}`, q))
  }, [tab, q, type])

  const mine = pendingApprovals.filter(a => a.approver === user.name)

  const doAction = () => {
    if (!pick || !action) return
    const msg = action === 'approve' ? 'Đã phê duyệt' : action === 'reject' ? 'Đã từ chối' : 'Đã yêu cầu chỉnh sửa'
    const detail = action === 'approve'
      ? `${pick.objectName} chuyển sang trạng thái Đã phê duyệt và có hiệu lực.`
      : `${pick.objectName} chuyển về người gửi kèm ghi chú.`
    toast[action === 'approve' ? 'success' : action === 'reject' ? 'error' : 'warn'](msg, detail)
    setAction(null); setPick(null); setReason('')
  }

  return (
    <>
      <PageHeader
        code="2.4"
        title="Phê duyệt & Phiên bản"
        desc="Hàng đợi phê duyệt dùng chung cho mọi loại đối tượng — áp quy trình 5 trạng thái của GĐ2 mục 8 lên toàn hệ thống"
        crumbs={[{ label: 'Governance' }, { label: 'Phê duyệt & Phiên bản' }]}
        actions={<ActionButton variant="ghost" icon="export">Xuất báo cáo phê duyệt</ActionButton>}
      />

      <StatusFlow
        steps={[
          { label: 'Dự thảo', count: 14, tone: 'n' },
          { label: 'Chờ phê duyệt', count: pendingApprovals.length, tone: 'o' },
          { label: 'Yêu cầu chỉnh sửa', count: approvalHistory.filter(a => a.state === 'Yêu cầu chỉnh sửa').length, tone: 'r' },
          { label: 'Đã phê duyệt', count: 4708, tone: 'g' },
          { label: 'Ngừng sử dụng', count: 186, tone: 'n' },
        ]}
      />

      <KpiRow
        items={[
          { label: 'Chờ tôi duyệt', value: mine.length, sub: `vai trò: ${user.name}`, tone: mine.length ? 'warn' : 'ok' },
          { label: 'Tổng chờ phê duyệt', value: pendingApprovals.length, sub: '6 loại đối tượng khác nhau' },
          { label: 'Quá 3 ngày chưa xử lý', value: pendingApprovals.filter(a => a.waitingDays >= 3).length, sub: 'cần nhắc người duyệt', tone: 'bad' },
          { label: 'Bị yêu cầu chỉnh sửa', value: approvalHistory.filter(a => a.state === 'Yêu cầu chỉnh sửa').length, sub: 'đang chờ người gửi sửa lại', tone: 'warn' },
          { label: 'Tỷ lệ metadata đã duyệt', value: '41%', sub: 'mục tiêu 85%', tone: 'bad' },
        ]}
      />

      <div className="mt-4">
        <InlineTabs
          items={[
            { id: 'pending', label: 'Đang chờ phê duyệt', badge: pendingApprovals.length },
            { id: 'mine', label: 'Chờ tôi duyệt', badge: mine.length },
            { id: 'history', label: 'Lịch sử phê duyệt', badge: approvalHistory.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <FilterBar
        placeholder="Tìm theo mã, tên đối tượng, người gửi…"
        value={q}
        onChange={setQ}
        filters={[{ label: 'Loại đối tượng', options: ['Bảng dữ liệu', 'Thuật ngữ', 'Danh mục tham chiếu', 'Kênh trao đổi dữ liệu', 'Báo cáo', 'Quan hệ luồng dữ liệu'], value: type, onChange: setType }]}
        right={<span className="text-[12px] text-slate-400">{(tab === 'mine' ? mine : rows).length} bản ghi</span>}
      />

      <DataTable
        rows={tab === 'mine' ? mine : rows}
        rowKey={a => a.id}
        highlightRow={a => (a.state === 'Yêu cầu chỉnh sửa' ? 'bad' : a.waitingDays >= 3 ? 'warn' : undefined)}
        empty="Không có bản ghi nào chờ phê duyệt"
        columns={[
          { key: 'id', label: 'Mã', nowrap: true, render: a => <span className="mono text-[12px] font-semibold">{a.id}</span> },
          { key: 'objectType', label: 'Loại đối tượng', nowrap: true, render: a => <Chip tone="t">{a.objectType}</Chip> },
          {
            key: 'objectName', label: 'Đối tượng', width: '20%',
            render: a => (
              <div>
                <div className="font-semibold text-slate-800">{a.objectName}</div>
                <EntityLink to={(OBJECT_ROUTE[a.objectType] ?? (() => '/'))(a.objectId)}>{a.objectId}</EntityLink>
              </div>
            ),
          },
          { key: 'change', label: 'Nội dung thay đổi', width: '24%', render: a => <span className="text-[12px]">{a.change}</span> },
          { key: 'submittedBy', label: 'Người gửi', nowrap: true, render: a => <div><div>{a.submittedBy}</div><div className="text-[10.5px] text-slate-400">{a.submittedAt}</div></div> },
          { key: 'approver', label: 'Người duyệt', nowrap: true },
          { key: 'priority', label: 'Mức ưu tiên', nowrap: true, render: a => <StatusChip value={a.priority} /> },
          { key: 'waitingDays', label: 'Đã chờ', align: 'right', nowrap: true, render: a => (a.waitingDays ? <span className={a.waitingDays >= 3 ? 'font-bold text-red-600' : ''}>{a.waitingDays} ngày</span> : '—') },
          { key: 'state', label: 'Trạng thái', nowrap: true, render: a => <StatusChip value={a.state} /> },
          { key: 'act', label: '', align: 'right', nowrap: true, render: a => <RowActions><ActionButton variant="ghost" onClick={() => setPick(a)}>Xem & quyết định</ActionButton></RowActions> },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Note tone="bad" title="Vì sao cần menu này — gap D2">
          Thiết kế ban đầu chỉ có phê duyệt ở <b>Từ điển nghiệp vụ</b> và <b>Danh mục tham chiếu</b>.
          Nhưng GĐ2 · FR-05 và mục 8 yêu cầu quy trình <b>5 trạng thái áp cho mọi metadata</b> — kể cả bảng, cột, job, kênh, báo cáo và lineage khai thủ công.
          Không có hàng đợi chung thì người duyệt phải mở từng menu để tìm việc của mình.
        </Note>
        <Note tone="info" title="Năm trạng thái theo GĐ2 mục 8.1">
          <b>Dự thảo</b> — đang tạo mới hoặc chỉnh sửa ·
          <b> Chờ phê duyệt</b> — đã gửi để kiểm tra ·
          <b> Yêu cầu chỉnh sửa</b> — chưa đạt, cần cập nhật lại ·
          <b> Đã phê duyệt</b> — đã xác nhận và có hiệu lực ·
          <b> Ngừng sử dụng</b> — không còn được dùng.
        </Note>
      </div>

      {/* ── Chi tiết & quyết định ── */}
      <Modal
        open={!!pick && !action}
        onClose={() => setPick(null)}
        size="lg"
        title={pick && `${pick.id} — ${pick.objectName}`}
        desc={pick?.change}
        footer={
          pick && pick.state === 'Chờ phê duyệt' ? (
            <>
              <ActionButton variant="ghost" onClick={() => setPick(null)}>Đóng</ActionButton>
              <ActionButton variant="danger" onClick={() => setAction('reject')}>Từ chối</ActionButton>
              <ActionButton variant="ghost" onClick={() => setAction('revise')}>Yêu cầu chỉnh sửa</ActionButton>
              <ActionButton onClick={() => setAction('approve')}>Phê duyệt</ActionButton>
            </>
          ) : <ActionButton variant="ghost" onClick={() => setPick(null)}>Đóng</ActionButton>
        }
      >
        {pick && (
          <div className="space-y-4">
            <InfoGrid
              items={[
                { label: 'Mã hồ sơ', value: <span className="mono">{pick.id}</span> },
                { label: 'Loại đối tượng', value: pick.objectType },
                { label: 'Đối tượng', value: <EntityLink to={(OBJECT_ROUTE[pick.objectType] ?? (() => '/'))(pick.objectId)}>{pick.objectId}</EntityLink> },
                { label: 'Trạng thái', value: <StatusChip value={pick.state} /> },
                { label: 'Người gửi', value: `${pick.submittedBy} · ${pick.submittedAt}` },
                { label: 'Người duyệt', value: pick.approver },
                { label: 'Mức ưu tiên', value: <StatusChip value={pick.priority} /> },
                { label: 'Đã chờ', value: pick.waitingDays ? `${pick.waitingDays} ngày` : '—' },
              ]}
            />

            <div>
              <div className="mb-2 text-[12.5px] font-bold text-blue-700">So sánh trước — sau</div>
              <DataTable
                dense
                rows={pick.diff}
                rowKey={d => d.field}
                columns={[
                  { key: 'field', label: 'Trường thông tin', nowrap: true, render: d => <span className="font-semibold">{d.field}</span> },
                  { key: 'before', label: 'Giá trị trước', render: d => <span className="text-red-600 line-through">{d.before}</span> },
                  { key: 'after', label: 'Giá trị sau', render: d => <span className="font-semibold text-emerald-700">{d.after}</span> },
                ]}
              />
            </div>

            {pick.objectType === 'Quan hệ luồng dữ liệu' && (
              <Note tone="warn" title="Lưu ý khi duyệt quan hệ khai thủ công">
                Kiểm tra kỹ trường <b>Bước biến đổi chính</b> — nếu mô tả quá chung chung thì sau này không ai kiểm chứng lại được.
                Hồ sơ PD-0085 tương tự đã từng bị trả về vì thiếu mô tả.
              </Note>
            )}
          </div>
        )}
      </Modal>

      {/* ── Xác nhận hành động ── */}
      <Modal
        open={!!action}
        onClose={() => setAction(null)}
        size="sm"
        title={action === 'approve' ? 'Xác nhận phê duyệt' : action === 'reject' ? 'Từ chối hồ sơ' : 'Yêu cầu chỉnh sửa'}
        desc={pick && `${pick.id} — ${pick.objectName}`}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setAction(null)}>Huỷ</ActionButton>
            <ActionButton
              variant={action === 'reject' ? 'danger' : 'primary'}
              disabled={action !== 'approve' && reason.trim().length < 20}
              onClick={doAction}
            >
              {action === 'approve' ? 'Đồng ý phê duyệt' : action === 'reject' ? 'Từ chối' : 'Gửi yêu cầu chỉnh sửa'}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-3">
          {action === 'approve' ? (
            <Note tone="ok" title="Sau khi phê duyệt">
              Bản ghi chuyển sang trạng thái <b>Đã phê duyệt</b> và có hiệu lực ngay.
              Phiên bản mới được ghi vào lịch sử, người gửi nhận thông báo.
            </Note>
          ) : (
            <Field label="Lý do" required hint={`Tối thiểu 20 ký tự — hiện ${reason.trim().length}`} error={reason.trim().length > 0 && reason.trim().length < 20 ? `Còn thiếu ${20 - reason.trim().length} ký tự` : undefined}>
              <TextArea rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Nêu rõ chỗ chưa đạt để người gửi biết cần sửa gì…" invalid={reason.trim().length > 0 && reason.trim().length < 20} />
            </Field>
          )}
        </div>
      </Modal>
    </>
  )
}
