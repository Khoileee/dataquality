import { useMemo, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import {
  PageHeader, KpiRow, FilterBar, DataTable, CellTitle, CellStack, Panel, Note, Chip, StatusChip,
  ActionButton, IconBtn, RowActions, EntityLink, InfoGrid, EmptyState, RouteTabs, Steps,
  Field, TextInput, TextArea, SelectInput, Toggle, CodeBlock, FlowDiagram, Modal, useToast,
  Timeline, SectionTitle, ProgressBar,
} from '@/components/common'
import { jobs, jobById, stepsOf, runsOf, versionsOf, tables, tableById, STATS, fmt, domainName } from '@/data'
import { match, useDemoSave } from '@/lib/demo'
import { JOB_GROUPS, usersByRole } from '@/data/enums'
import type { FlowNode, FlowEdge } from '@/components/common/Viz'
import { NextStep } from '@/components/common'

export function JobList() {
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('')
  const [result, setResult] = useState('')

  const rows = useMemo(
    () => jobs.filter(j => (!group || j.group === group) && (!result || j.lastResult === result) && match(`${j.id} ${j.name} ${j.purpose} ${j.targetTable}`, q)),
    [q, group, result]
  )

  return (
    <>
      <PageHeader
        code="4.1"
        title="Luồng xử lý (Job)"
        desc="Chuỗi bước SQL có phụ thuộc, ghi ra bảng đích đã khai trong danh mục — nguồn sinh ra quan hệ luồng dữ liệu tự động"
        crumbs={[{ label: 'Nạp & Điều phối' }, { label: 'Luồng xử lý (Job)' }]}
        actions={<ActionButton icon="plus" to="/orchestration/jobs/create">Tạo job mới</ActionButton>}
      />

      <KpiRow
        items={[
          { label: 'Tổng số job', value: fmt(STATS.totalJobs), sub: `${jobs.length} job đã khai chi tiết` },
          { label: 'Bảng đích chưa khai danh mục', value: STATS.jobTargetNotInCatalog, sub: 'vi phạm ràng buộc RB2', tone: 'bad' },
          { label: 'Bật quét nguồn gốc', value: '46%', sub: '848 / 1.842 job', tone: 'warn' },
          { label: 'Chạy lỗi hôm qua', value: jobs.filter(j => j.lastResult === 'Thất bại' || j.lastResult === 'Bị chặn').length, sub: 'trong số job đã khai', tone: 'bad' },
          { label: 'Chờ phê duyệt', value: jobs.filter(j => j.approval !== 'Đã phê duyệt').length, sub: 'chưa được chạy chính thức', tone: 'warn' },
        ]}
      />

      <div className="mt-4">
        <FilterBar
          placeholder="Tìm theo mã job, tên, bảng đích…"
          value={q}
          onChange={setQ}
          filters={[
            { label: 'Nhóm', options: ['Đối soát', 'Giao dịch', 'Kinh doanh', 'Khách hàng', 'Tài chính', 'Rủi ro', 'Vận hành'], value: group, onChange: setGroup },
            { label: 'Kết quả', options: ['Thành công', 'Thất bại', 'Bị chặn'], value: result, onChange: setResult },
          ]}
          right={<span className="text-[12px] text-slate-400">{rows.length} job</span>}
        />
      </div>

      <DataTable
        stt
        rows={rows}
        rowKey={j => j.id}
        highlightRow={j => (!j.targetInCatalog ? 'bad' : j.lastResult === 'Thất bại' || j.lastResult === 'Bị chặn' ? 'warn' : undefined)}
        columns={[
          {
            key: 'name', label: 'Job', width: '24%', min: 280,
            render: j => (
              <CellTitle
                title={<EntityLink to={`/orchestration/jobs/${j.id}`} mono={false}>{j.name}</EntityLink>}
                sub={<><span className="mono">{j.id}</span> · {j.purpose}</>}
              />
            ),
          },
          { key: 'group', label: 'Nhóm', min: 110, nowrap: true, render: j => <Chip tone="t">{j.group}</Chip> },
          {
            key: 'targetTable', label: 'Bảng đích', width: '18%', min: 210, info: 'job.targetTable',
            render: j => (
              <CellTitle
                mono
                title={j.targetInCatalog ? <EntityLink to={`/catalog/tables/${encodeURIComponent(j.targetTable)}`}>{j.targetTable}</EntityLink> : <span className="mono">{j.targetTable}</span>}
                warn={!j.targetInCatalog ? 'Chưa có trong danh mục — vi phạm RB2' : undefined}
              />
            ),
          },
          {
            key: 'schedule', label: 'Lịch chạy · Cam kết', width: '15%', min: 175, info: 'job.slaTime',
            render: j => <CellStack top={j.scheduleText} bottom={<><span className="mono">{j.schedule}</span> · cam kết {j.slaTime}</>} />,
          },
          {
            key: 'lastRun', label: 'Lần chạy gần nhất', width: '15%', min: 170,
            render: j => (
              <CellStack
                top={<span className="flex items-center gap-1.5"><StatusChip value={j.lastResult} /><span className="text-[11px] text-slate-500">{j.durationMin} phút</span></span>}
                bottom={<span className="mono">{j.lastRun}</span>}
              />
            ),
          },
          {
            key: 'steps', label: 'Bước · Lineage', align: 'center', min: 125, nowrap: true, info: 'job.lineageScan',
            render: j => (
              <CellStack
                top={<Chip tone="n">{j.steps} bước</Chip>}
                bottom={j.lineageScan ? <Chip tone="g">quét lineage</Chip> : <Chip tone="r">tắt lineage</Chip>}
              />
            ),
          },
          { key: 'approval', label: 'Duyệt', min: 120, nowrap: true, render: j => <StatusChip value={j.approval} /> },
          { key: 'act', label: '', align: 'right', min: 96, nowrap: true, render: j => <RowActions><IconBtn icon="open" title="Chi tiết" to={`/orchestration/jobs/${j.id}`} /><IconBtn icon="edit" title="Sửa" to={`/orchestration/jobs/create?id=${j.id}`} /></RowActions> },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Note tone="bad" title={`${STATS.jobTargetNotInCatalog} job ghi vào bảng chưa khai trong danh mục`}>
          Đây là chỗ <b>thủng nguyên tắc NT1</b>: job tạo ra bảng mà danh mục không biết đến.
          Hệ quả: bảng đó không có người phụ trách, không gán được luật, không phân quyền được, và không xuất hiện trong lineage.
          <b> Cách xử lý</b>: bật cổng chặn — job không lưu được nếu bảng đích chưa có trong danh mục.
        </Note>
        <Note tone="warn" title="Chỉ 46% job bật quét nguồn gốc">
          Trước đây <span className="mono">enableDataLineage</span> mặc định <b>tắt</b>, phải tick tay từng job.
          Đã đổi mặc định thành <b>bật</b> cho job tạo mới; còn 994 job cũ cần rà bật lại.
          Bảng đích Tier 1 thì <b>không tắt được</b>.
        </Note>
      </div>

      <NextStep
        done="khai job"
        steps={[
          { label: 'Xem sơ đồ pipeline', desc: 'Job đã sinh quan hệ nguồn gốc — 4.3', to: '/orchestration/monitor' },
          { label: 'Gán luật cho bảng đích', desc: 'Chạy ngay sau khi job ghi xong — 3.2', to: '/quality/board' },
          { label: 'Khai giờ cam kết', desc: 'Để đo job có chạy đúng giờ không — 8.2', to: '/operations/settings' },
        ]}
      />
    </>
  )
}

export function JobDetail() {
  const { id = '' } = useParams()
  const { pathname } = useLocation()
  const j = jobById(id)
  const toast = useToast()
  const [pickStep, setPickStep] = useState(4)

  if (!j) return <EmptyState text="Không tìm thấy job" action={<ActionButton to="/orchestration/jobs">Về danh sách</ActionButton>} />

  const base = `/orchestration/jobs/${j.id}`
  const tab = pathname.replace(base, '').replace('/', '') || 'steps'
  const steps = stepsOf(j.id)
  const runs = runsOf(j.id)
  const versions = versionsOf(j.id)
  const target = tableById(j.targetTable)

  return (
    <>
      <PageHeader
        code="4.1"
        title={<span className="mono">{j.id}</span>}
        desc={`${j.name} · ghi vào ${j.targetTable} · ${j.scheduleText} · cam kết ${j.slaTime}`}
        crumbs={[{ label: 'Nạp & Điều phối' }, { label: 'Luồng xử lý (Job)', href: '/orchestration/jobs' }, { label: j.id }]}
        actions={
          <>
            <Chip tone="t">{j.group}</Chip>
            <Chip tone="b">{j.version}</Chip>
            <StatusChip value={j.lastResult} />
            <ActionButton variant="ghost" icon="run" onClick={() => toast.info('Đang chạy thử', `${j.id} chạy ở chế độ thử — không ghi dữ liệu thật.`)}>Chạy thử</ActionButton>
            <ActionButton variant="ghost" icon="edit" to={`/orchestration/jobs/create?id=${j.id}`}>Sửa</ActionButton>
          </>
        }
      />

      <RouteTabs
        items={[
          { label: 'Bước xử lý', to: base, end: true, badge: steps.length },
          { label: 'Lần chạy & Lịch', to: `${base}/runs`, badge: runs.length },
          { label: 'Phiên bản', to: `${base}/versions`, badge: versions.length },
        ]}
      />

      {tab === 'steps' && (
        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 items-start">
          <div className="space-y-4">
            <Panel title="Sơ đồ bước xử lý" desc="Bước 2 và 3 chạy song song rồi hội tụ ở bước 4 — bấm vào một bước để xem câu SQL bên dưới">
              <FlowDiagram
                width={980}
                height={236}
                onNodeClick={n => setPickStep(Number(n.id.replace('s', '')))}
                nodes={steps.map(s => {
                  const col = s.ord === 1 ? 0 : s.ord === 2 || s.ord === 3 ? 1 : s.ord === 4 ? 2 : 3
                  const y = s.ord === 2 ? 22 : s.ord === 3 ? 130 : 76
                  const last = s.ord === steps.length
                  return {
                    id: `s${s.ord}`,
                    x: 20 + col * 240,
                    y,
                    w: 200,
                    h: 76,
                    title: s.name,
                    sub: `Bước ${s.ord} · ${s.type} · ${s.durationSec}s`,
                    tone: pickStep === s.ord ? 'active' : last ? 'target' : 'neutral',
                    badge: last ? { text: 'GHI BẢNG ĐÍCH', tone: 'g' } : undefined,
                  }
                }) as FlowNode[]}
                edges={steps.flatMap(s => s.dependsOn.map(d => ({ from: `s${d}`, to: `s${s.ord}` }))) as FlowEdge[]}
              />
            </Panel>

            <Panel title="Danh sách bước">
              <DataTable
                dense
                rows={steps}
                rowKey={s => String(s.ord)}
                onRowClick={s => setPickStep(s.ord)}
                highlightRow={s => (s.ord === pickStep ? 'ok' : undefined)}
                columns={[
                  { key: 'ord', label: '#', align: 'center', nowrap: true, render: s => <span className="font-bold">{s.ord}</span> },
                  { key: 'name', label: 'Tên bước', render: s => <span className="font-semibold">{s.name}</span> },
                  { key: 'type', label: 'Loại', nowrap: true, render: s => <Chip tone={s.type === 'Ghi bảng' ? 'g' : s.type === 'Đọc nguồn' ? 'b' : 'n'}>{s.type}</Chip> },
                  { key: 'dependsOn', label: 'Phụ thuộc bước', nowrap: true, render: s => (s.dependsOn.length ? s.dependsOn.join(', ') : '—') },
                  { key: 'durationSec', label: 'Thời gian', align: 'right', nowrap: true, render: s => `${s.durationSec}s` },
                  { key: 'status', label: 'Kết quả', nowrap: true, render: s => <StatusChip value={s.status} /> },
                ]}
              />
            </Panel>

            <Panel title={`Câu SQL — Bước ${pickStep}: ${steps.find(s => s.ord === pickStep)?.name ?? ''}`}>
              <CodeBlock dark>{steps.find(s => s.ord === pickStep)?.sql ?? '-- chọn một bước ở sơ đồ hoặc bảng trên'}</CodeBlock>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel title="Bảng đích">
              {target ? (
                <>
                  <InfoGrid
                    cols={1}
                    items={[
                      { label: 'Bảng', value: <EntityLink to={`/catalog/tables/${encodeURIComponent(target.id)}`}>{target.id}</EntityLink> },
                      { label: 'Tên nghiệp vụ', value: target.name },
                      { label: 'Mức quan trọng', value: target.tier ?? '— chưa gán' },
                      { label: 'Miền dữ liệu', value: domainName(target.domain) ?? '— chưa gán' },
                      { label: 'Đầu mối nghiệp vụ', value: target.bda ?? '— chưa gán' },
                      { label: 'Luật chất lượng', value: `${target.ruleCount} luật` },
                      { label: 'Báo cáo sử dụng', value: `${target.consumerReports.length} báo cáo` },
                    ]}
                  />
                </>
              ) : (
                <Note tone="bad" title="Bảng đích chưa có trong danh mục">
                  Job ghi vào <span className="mono">{j.targetTable}</span> nhưng bảng này chưa được khai ở menu 1.1.
                  Không gán được luật chất lượng, không phân quyền được, không xuất hiện trong lineage.
                </Note>
              )}
            </Panel>

            <Panel title="Bảng nguồn dò được từ câu SQL">
              <div className="space-y-1.5">
                {j.sourceTables.map(s => (
                  <div key={s} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-1.5">
                    <EntityLink to={`/catalog/tables/${encodeURIComponent(s)}`}>{s}</EntityLink>
                    <Chip tone="g">dò được</Chip>
                  </div>
                ))}
                {j.id === 'JOB-0412' && (
                  <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                    <span className="mono text-[11.5px] text-red-700">tmp_doi_soat_tho</span>
                    <Chip tone="r">Viết thẳng tên — BỎ SÓT</Chip>
                  </div>
                )}
              </div>
              <Note tone="warn" title="Vì sao có dòng bỏ sót" className="mt-3">
                Bộ phân tích SQL không nhận ra bảng tạm khai bằng <span className="mono">CREATE TEMP VIEW</span>.
                Trường hợp này phải <b>khai báo quan hệ thủ công</b> tại menu 2.3.
              </Note>
            </Panel>

            <Panel title="Quét quan hệ luồng dữ liệu">
              <Toggle
                checked={j.lineageScan}
                onChange={() => {}}
                label="Bật quét nguồn gốc từ câu SQL"
                disabled={target?.tier === 'Tier 1'}
                hint={target?.tier === 'Tier 1' ? 'Bảng đích Tier 1 — bắt buộc bật, không tắt được' : 'Tắt sẽ làm thủng độ phủ lineage của toàn hệ thống'}
              />
              <div className="mt-3 space-y-1.5 text-[12px] text-slate-600">
                <div className="flex justify-between"><span>Quan hệ sinh ra từ job này</span><Chip tone="b">{j.sourceTables.length + 1}</Chip></div>
                <div className="flex justify-between"><span>Người phụ trách kỹ thuật</span><span className="font-semibold">{j.de}</span></div>
                <div className="flex justify-between"><span>Người nhận cảnh báo</span><span className="font-semibold">{j.alertTo.join(', ') || '—'}</span></div>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'runs' && (
        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 items-start">
          <div className="space-y-4">
            <Panel title="Lịch sử các lần chạy">
              <DataTable
                rows={runs}
                rowKey={r => r.runId}
                highlightRow={r => (r.result === 'Thất bại' ? 'bad' : undefined)}
                columns={[
                  { key: 'runId', label: 'Mã lần chạy', nowrap: true, render: r => <span className="mono text-[11.5px] font-semibold">{r.runId}</span> },
                  { key: 'startedAt', label: 'Bắt đầu', nowrap: true, render: r => <span className="mono text-[11.5px]">{r.startedAt}</span> },
                  { key: 'durationMin', label: 'Thời gian', align: 'right', nowrap: true, render: r => `${r.durationMin} phút` },
                  { key: 'result', label: 'Kết quả', nowrap: true, render: r => <StatusChip value={r.result} /> },
                  { key: 'rowsWritten', label: 'Dòng ghi', align: 'right', nowrap: true, render: r => fmt(r.rowsWritten) },
                  { key: 'failedStep', label: 'Hỏng ở bước', align: 'center', nowrap: true, render: r => (r.failedStep ? <Chip tone="r">Bước {r.failedStep}</Chip> : '—') },
                  { key: 'note', label: 'Ghi chú' },
                ]}
              />
            </Panel>

            <Panel title="Dòng thời gian các bước — lần chạy gần nhất">
              <div className="space-y-2">
                {runs[0]?.steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-10 shrink-0 text-[11.5px] font-semibold text-slate-500">{s.name}</span>
                    <div className="relative h-5 flex-1 rounded bg-slate-100">
                      <div
                        className={`absolute h-full rounded ${s.ok ? 'bg-blue-500' : 'bg-red-500'}`}
                        style={{ left: `${s.startPct}%`, width: `${s.widthPct}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-[11px] text-slate-400">{Math.round((s.widthPct / 100) * (runs[0]?.durationMin ?? 0))} phút</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[11.5px] text-slate-400">
                Bước 2 và bước 3 chạy song song — tổng thời gian bằng nhánh dài nhất, không phải tổng các bước.
              </div>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel title="Cấu hình lịch chạy">
              <InfoGrid
                cols={1}
                items={[
                  { label: 'Biểu thức lịch', value: <span className="mono">{j.schedule}</span> },
                  { label: 'Diễn giải', value: j.scheduleText },
                  { label: 'Giờ cam kết dữ liệu sẵn sàng', value: j.slaTime },
                  { label: 'Thời gian chạy trung bình', value: `${j.durationMin} phút` },
                  { label: 'Lần chạy kế tiếp', value: '2026-08-10 06:00' },
                ]}
              />
            </Panel>

            <Panel title="Cam kết thời gian">
              <ProgressBar
                pct={Math.min(100, (j.durationMin / 60) * 100)}
                target={100}
                label="Thời gian chạy so với cửa sổ cam kết"
                note={`${j.durationMin} phút / 60 phút`}
                tone={j.durationMin > 50 ? 'warn' : 'ok'}
              />
              <div className="mt-3 text-[12px] text-slate-600">
                Job bắt đầu {j.scheduleText.replace('Hằng ngày ', '')} và phải xong trước <b>{j.slaTime}</b>.
                Nếu trễ, luật <i>Dữ liệu về đúng giờ cam kết</i> trên bảng đích sẽ sinh sự cố.
              </div>
            </Panel>

            <Panel title="Người nhận cảnh báo">
              <div className="flex flex-wrap gap-1.5">
                {j.alertTo.map(a => <Chip key={a} tone="b">{a}</Chip>)}
                {!j.alertTo.length && <span className="text-[12px] text-slate-400">Chưa cấu hình người nhận</span>}
              </div>
              <ActionButton variant="soft" className="mt-3" to="/quality/alerts">Cấu hình cảnh báo</ActionButton>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'versions' && (
        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 items-start">
          <div className="space-y-4">
            <Panel title={`Lịch sử phiên bản (${versions.length})`}>
              <DataTable
                rows={versions}
                rowKey={v => v.version}
                highlightRow={v => (v.current ? 'ok' : undefined)}
                columns={[
                  { key: 'version', label: 'Phiên bản', nowrap: true, render: v => <Chip tone={v.current ? 'g' : 'n'}>{v.version}{v.current ? ' · hiện hành' : ''}</Chip> },
                  { key: 'date', label: 'Thời điểm', nowrap: true, render: v => <span className="mono text-[11.5px]">{v.date}</span> },
                  { key: 'by', label: 'Người sửa', nowrap: true },
                  { key: 'note', label: 'Nội dung thay đổi' },
                  { key: 'approvedBy', label: 'Người duyệt', nowrap: true, render: v => v.approvedBy ?? '—' },
                  { key: 'act', label: '', align: 'right', nowrap: true, render: v => <RowActions>{!v.current && <IconBtn icon="revert" title="Quay lại phiên bản này" />}</RowActions> },
                ]}
              />
            </Panel>

            <Panel title="So sánh v11 → v12">
              <CodeBlock dark title="Bước 2 — Chuẩn hoá kiểu dữ liệu">
                <span className="block text-slate-400">  SELECT</span>
                <span className="block text-slate-400">    ma_giao_dich,</span>
                <span className="block text-slate-400">    CAST(ngay_giao_dich AS DATE) AS ngay_giao_dich,</span>
                <span className="block bg-[#3D1D1D] text-[#FDA29B]">-   so_dien_thoai,</span>
                <span className="block bg-[#123522] text-[#75E0A7]">+   regexp_replace(so_dien_thoai, '\\D', '')        AS so_dien_thoai,</span>
                <span className="block bg-[#123522] text-[#75E0A7]">+   CASE WHEN so_dien_thoai LIKE '+84%'</span>
                <span className="block bg-[#123522] text-[#75E0A7]">+        THEN CONCAT('84', SUBSTR(so_dien_thoai, 4))</span>
                <span className="block bg-[#123522] text-[#75E0A7]">+        ELSE so_dien_thoai END                       AS so_dien_thoai_chuan,</span>
                <span className="block text-slate-400">    CAST(so_tien AS DECIMAL(18,2)) AS so_tien</span>
                <span className="block text-slate-400">  FROM tmp_doi_soat_tho</span>
              </CodeBlock>
              <Note tone="info" title="Vì sao có thay đổi này" className="mt-3">
                Sửa để khắc phục sự cố <EntityLink to="/quality/incidents/SC-0231" mono={false}>SC-0231</EntityLink> —
                đối tác A đổi định dạng số điện thoại từ bản phát hành 05/08.
              </Note>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel title="Đang mở cùng job này" tone="warn">
              <div className="space-y-2">
                {[
                  { who: 'Trần Văn Hùng', at: 'từ 10:12 hôm nay', edit: true },
                  { who: 'Nguyễn Thị Phương', at: 'từ 10:28 hôm nay', edit: false },
                ].map(u => (
                  <div key={u.who} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <div>
                      <div className="text-[12.5px] font-semibold text-slate-800">{u.who}</div>
                      <div className="text-[11px] text-slate-400">{u.at}</div>
                    </div>
                    <Chip tone={u.edit ? 'r' : 'n'}>{u.edit ? 'Đang sửa' : 'Chỉ xem'}</Chip>
                  </div>
                ))}
              </div>
              <Note tone="warn" title="Khoá phiên chỉnh sửa" className="mt-3">
                Chỉ một người được sửa job tại một thời điểm. Người thứ hai mở sẽ ở chế độ <b>chỉ xem</b> cho tới khi người đầu lưu hoặc thoát.
              </Note>
            </Panel>

            <Note tone="info" title="Quay lại phiên bản cũ">
              Bấm nút quay lại ở dòng phiên bản sẽ tạo <b>một phiên bản mới</b> có nội dung giống phiên bản cũ,
              không xoá lịch sử. Phiên bản mới vẫn phải qua phê duyệt trước khi chạy chính thức.
            </Note>
          </div>
        </div>
      )}
    </>
  )
}

export function JobCreate() {
  const save = useDemoSave('/orchestration/jobs')
  const [step, setStep] = useState(2)
  const [f, setF] = useState({ name: '', group: 'Đối soát', purpose: '', target: 'bi.doi_soat_giao_dich_A', schedule: '0 0 6 * * ?', sla: '07:00' })
  const [lineage, setLineage] = useState(true)
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }))
  const target = tableById(f.target)
  const ok = f.name && f.purpose && f.target

  const STEP_LABELS = ['Thông tin job', 'Bảng nguồn', 'Bảng đích', 'Các bước xử lý', 'Lịch chạy & Cảnh báo']

  return (
    <>
      <PageHeader
        code="4.1"
        title="Tạo job xử lý dữ liệu"
        desc="Bảng đích bắt buộc chọn từ danh mục — job không lưu được nếu bảng chưa khai (ràng buộc RB2)"
        crumbs={[{ label: 'Nạp & Điều phối' }, { label: 'Luồng xử lý (Job)', href: '/orchestration/jobs' }, { label: 'Tạo job' }]}
      />
      <Steps items={STEP_LABELS} current={step} onJump={setStep} />

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title={STEP_LABELS[step]}>
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tên job" required full><TextInput value={f.name} onChange={set('name')} placeholder="Đối soát giao dịch đối tác A" /></Field>
              <Field label="Mục đích xử lý" required full hint="Trường metadata bắt buộc theo GĐ2 mục 5.3">
                <TextArea rows={2} value={f.purpose} onChange={set('purpose')} />
              </Field>
              <Field label="Nhóm job" required>
                <SelectInput value={f.group} onChange={set('group')}>{JOB_GROUPS.map(g => <option key={g}>{g}</option>)}</SelectInput>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <Note tone="info">Bảng nguồn được hệ thống tự dò từ câu SQL ở bước sau. Có thể khai trước để kiểm tra quyền đọc.</Note>
              <div className="max-h-[360px] space-y-1.5 overflow-y-auto">
                {tables.slice(0, 10).map(t => (
                  <label key={t.id} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 hover:border-slate-300">
                    <span className="flex items-center gap-2.5">
                      <input type="checkbox" />
                      <span>
                        <span className="mono block text-[12px] font-semibold">{t.id}</span>
                        <span className="block text-[11px] text-slate-400">{t.name}</span>
                      </span>
                    </span>
                    <Chip tone={t.qualityScore && t.qualityScore >= 85 ? 'g' : 'o'}>CL {t.qualityScore ?? '—'}</Chip>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Bảng đích" info="job.targetTable" required hint="Chỉ chọn được bảng đã có trong danh mục dữ liệu">
                <SelectInput value={f.target} onChange={set('target')}>
                  {tables.map(t => <option key={t.id} value={t.id}>{t.id} — {t.name}</option>)}
                </SelectInput>
              </Field>

              {target && (
                <Note tone={target.tier === 'Tier 1' ? 'warn' : 'ok'} title={`Hồ sơ bảng đích: ${target.id}`}>
                  <div className="mt-1 grid grid-cols-4 gap-3 text-[12px]">
                    <div><b>Mức quan trọng</b><div>{target.tier ?? '— chưa gán'}</div></div>
                    <div><b>Đầu mối nghiệp vụ</b><div>{target.bda ?? '— chưa gán'}</div></div>
                    <div><b>Luật chất lượng</b><div>{target.ruleCount} luật</div></div>
                    <div><b>Báo cáo sử dụng</b><div>{target.consumerReports.length} báo cáo</div></div>
                  </div>
                </Note>
              )}

              <Toggle
                checked={lineage}
                onChange={setLineage}
                label="Bật quét quan hệ luồng dữ liệu từ câu SQL"
                disabled={target?.tier === 'Tier 1'}
                hint={target?.tier === 'Tier 1'
                  ? 'Bảng đích là Tier 1 — bắt buộc bật quét nguồn gốc, không tắt được'
                  : 'Mặc định bật. Tắt sẽ làm thủng độ phủ lineage.'}
              />
              {target?.tier === 'Tier 1' && (
                <Note tone="bad" title="Không tắt được với bảng Tier 1">
                  Bảng Tier 1 phục vụ báo cáo cho Ban Điều hành. Không có lineage thì khi số liệu sai
                  không ai truy được nguyên nhân từ đâu.
                </Note>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <Note tone="info">Khai các bước xử lý theo thứ tự. Bước có thể phụ thuộc nhiều bước trước để chạy song song.</Note>
              <DataTable
                dense
                rows={[
                  { ord: 1, name: 'Đọc dữ liệu nguồn', type: 'Đọc nguồn', dep: '—' },
                  { ord: 2, name: 'Chuẩn hoá kiểu dữ liệu', type: 'SparkSQL', dep: '1' },
                  { ord: 3, name: 'Lấy dữ liệu đối chiếu', type: 'SparkSQL', dep: '1' },
                  { ord: 4, name: 'Đối chiếu và tính chênh lệch', type: 'SparkSQL', dep: '2, 3' },
                  { ord: 5, name: 'Ghi bảng đích', type: 'Ghi bảng', dep: '4' },
                ]}
                columns={[
                  { key: 'ord', label: '#', align: 'center', nowrap: true },
                  { key: 'name', label: 'Tên bước' },
                  { key: 'type', label: 'Loại', nowrap: true, render: r => <Chip tone="n">{r.type}</Chip> },
                  { key: 'dep', label: 'Phụ thuộc', nowrap: true },
                  { key: 'act', label: '', align: 'right', nowrap: true, render: () => <RowActions><IconBtn icon="edit" title="Sửa SQL" /><IconBtn icon="delete" title="Xoá" tone="danger" /></RowActions> },
                ]}
              />
              <ActionButton variant="ghost" icon="plus">Thêm bước</ActionButton>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Biểu thức lịch chạy" required hint="Định dạng Quartz cron">
                <TextInput mono value={f.schedule} onChange={set('schedule')} />
              </Field>
              <Field label="Giờ cam kết dữ liệu sẵn sàng" info="job.slaTime" hint="Dùng để sinh luật kiểm tra tính kịp thời trên bảng đích">
                <TextInput value={f.sla} onChange={set('sla')} placeholder="07:00" />
              </Field>
              <Field label="Người nhận cảnh báo" full>
                <SelectInput>
                  <option>Đầu mối kỹ thuật của bảng đích</option>
                  <option>Đầu mối nghiệp vụ của bảng đích</option>
                  {usersByRole('Đầu mối kỹ thuật').map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </SelectInput>
              </Field>
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Tóm tắt job">
            <InfoGrid
              cols={1}
              items={[
                { label: 'Tên job', value: f.name || '—' },
                { label: 'Nhóm', value: f.group },
                { label: 'Bảng đích', value: <span className="mono">{f.target}</span> },
                { label: 'Lịch chạy', value: <span className="mono">{f.schedule}</span> },
                { label: 'Giờ cam kết', value: f.sla || '—' },
                { label: 'Quét nguồn gốc', value: lineage ? <Chip tone="g">Bật</Chip> : <Chip tone="r">Tắt</Chip> },
              ]}
            />
          </Panel>
          <Note tone="info" title="Job này sinh ra gì">
            Sau khi chạy, job tự sinh <b>quan hệ luồng dữ liệu</b> ở menu 2.3 (bảng nguồn → job → bảng đích),
            cập nhật <b>độ tươi</b> của bảng đích ở menu 1.1, và kích hoạt <b>luật chất lượng theo sự kiện</b> nếu có.
          </Note>
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/orchestration/jobs">Huỷ</ActionButton>
        <div className="flex gap-2">
          {step > 0 && <ActionButton variant="ghost" onClick={() => setStep(s => s - 1)}>Quay lại</ActionButton>}
          {step < 4
            ? <ActionButton onClick={() => setStep(s => s + 1)}>Tiếp tục</ActionButton>
            : <ActionButton disabled={!ok} onClick={() => save('Đã gửi phê duyệt job')}>Gửi phê duyệt</ActionButton>}
        </div>
      </div>
    </>
  )
}
