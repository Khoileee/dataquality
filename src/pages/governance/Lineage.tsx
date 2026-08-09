import { useMemo, useState } from 'react'
import {
  PageHeader, KpiRow, Panel, Note, Chip, StatusChip, ActionButton, DataTable, InlineTabs,
  FilterBar, EntityLink, FlowDiagram, Modal, useToast, InfoGrid, SectionTitle, EmptyState,
  Field, TextInput, TextArea, SelectInput, Steps, IconBtn, RowActions, ProgressBar,
} from '@/components/common'
import { lineageEdges, tables, systems, systemById, reports, metrics, reportById, metricById, jobs, jobById, STATS, fmt, tableById } from '@/data'
import { match, useDemoSave } from '@/lib/demo'
import { OBJECT_TYPES } from '@/data/enums'
import type { FlowNode, FlowEdge } from '@/components/common/Viz'

const LEVELS = ['Hệ thống', 'Bảng', 'Cột', 'Nghiệp vụ'] as const

export function LineagePage() {
  const [tab, setTab] = useState('map')
  const [level, setLevel] = useState<string>('Bảng')
  const [q, setQ] = useState('')
  const [src, setSrc] = useState('')
  const [state, setState] = useState('')
  const [impactObj, setImpactObj] = useState<string>('bi.doi_soat_giao_dich_A')
  const [showImpact, setShowImpact] = useState(false)
  const toast = useToast()

  const manual = lineageEdges.filter(e => e.source === 'Khai báo thủ công')
  const pending = lineageEdges.filter(e => e.approval === 'Chờ phê duyệt' || e.approval === 'Yêu cầu chỉnh sửa')

  const declRows = useMemo(
    () => lineageEdges.filter(e =>
      (!src || e.source === src) && (!state || e.approval === state) &&
      match(`${e.id} ${e.from} ${e.to} ${e.transform}`, q)),
    [q, src, state]
  )

  /* ── Bản đồ luồng theo mức ── */
  const { nodes, edges, width, height } = useMemo(() => buildMap(level), [level])

  return (
    <>
      <PageHeader
        code="2.3"
        title="Truy vết luồng dữ liệu"
        desc="Bản đồ luồng · khai báo thủ công · phân tích ảnh hưởng — bổ sung sau review để phủ đủ FR-06 của GĐ2"
        crumbs={[{ label: 'Governance' }, { label: 'Truy vết luồng dữ liệu' }]}
        actions={<ActionButton icon="plus" to="/governance/lineage/create">Khai báo quan hệ thủ công</ActionButton>}
      />

      <KpiRow
        items={[
          { label: 'Quan hệ đã ghi nhận', value: lineageEdges.length, sub: '4 mức truy vết' },
          { label: 'Thu thập tự động', value: lineageEdges.filter(e => e.source !== 'Khai báo thủ công').length, sub: 'từ câu SQL và cấu hình cửa nạp', tone: 'ok' },
          { label: 'Khai báo thủ công', value: manual.length, sub: 'công cụ BI không xuất được lineage', tone: 'warn' },
          { label: 'Chờ phê duyệt', value: pending.length, sub: 'lineage thủ công phải qua duyệt', tone: 'warn' },
          { label: 'Độ phủ lineage', value: '46%', sub: `848/${fmt(STATS.totalJobs)} job đã bật quét`, tone: 'bad' },
        ]}
      />

      <div className="mt-4">
        <InlineTabs
          items={[
            { id: 'map', label: 'Bản đồ luồng dữ liệu' },
            { id: 'declare', label: 'Quan hệ đã khai báo', badge: lineageEdges.length },
            { id: 'impact', label: 'Phân tích ảnh hưởng' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'map' && (
        <>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[12.5px] font-semibold text-slate-600">Mức truy vết:</span>
            {LEVELS.map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition ${
                  level === l ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {l}
              </button>
            ))}
            <span className="ml-auto text-[12px] text-slate-400">Bấm vào nút bất kỳ để mở trang chi tiết đối tượng</span>
          </div>

          <Panel noPad>
            <FlowDiagram nodes={nodes} edges={edges} width={width} height={height} />
          </Panel>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <Note tone="info" title="Mức Hệ thống">
              Trả lời <i>"hệ thống nào cấp dữ liệu cho hệ thống nào"</i> — dùng khi rà soát kiến trúc và khi đánh giá rủi ro phụ thuộc.
              GĐ2 · FR-06 yêu cầu mức này nhưng thiết kế ban đầu chỉ có mức bảng.
            </Note>
            <Note tone="info" title="Mức Bảng và Cột">
              Sinh tự động từ câu SQL của job. Đây là mức chính xác nhất và cũng là mức phổ biến nhất khi xử lý sự cố.
            </Note>
            <Note tone="warn" title="Mức Nghiệp vụ">
              Chuỗi <b>bảng → chỉ tiêu → báo cáo</b>. Công cụ BI không xuất được lineage nên phần lớn phải <b>khai báo thủ công</b> và
              qua phê duyệt — đúng tinh thần GĐ2 mục 8.
            </Note>
          </div>
        </>
      )}

      {tab === 'declare' && (
        <>
          <FilterBar
            placeholder="Tìm theo đối tượng nguồn, đích, bước biến đổi…"
            value={q}
            onChange={setQ}
            filters={[
              { label: 'Nguồn thu thập', options: ['Tự động — phân tích SQL', 'Tự động — cấu hình cửa nạp', 'Khai báo thủ công'], value: src, onChange: setSrc },
              { label: 'Phê duyệt', options: ['Dự thảo', 'Chờ phê duyệt', 'Yêu cầu chỉnh sửa', 'Đã phê duyệt'], value: state, onChange: setState },
            ]}
            right={<span className="text-[12px] text-slate-400">{declRows.length} quan hệ</span>}
          />

          <DataTable
            stt
            rows={declRows}
            rowKey={e => e.id}
            highlightRow={e => (e.approval === 'Yêu cầu chỉnh sửa' ? 'bad' : e.approval === 'Chờ phê duyệt' ? 'warn' : undefined)}
            columns={[
              { key: 'id', label: 'Mã', nowrap: true, render: e => <span className="mono text-[12px] font-semibold">{e.id}</span> },
              { key: 'from', label: 'Đối tượng nguồn', width: '18%', render: e => <div><Chip tone="n">{e.fromType}</Chip><div className="mono mt-0.5 text-[11.5px]">{e.from}</div></div> },
              { key: 'to', label: 'Đối tượng đích', width: '18%', render: e => <div><Chip tone="t">{e.toType}</Chip><div className="mono mt-0.5 text-[11.5px]">{e.to}</div></div> },
              { key: 'viaJob', label: 'Tiến trình trung gian', nowrap: true, render: e => (e.viaJob ? <EntityLink to={`/orchestration/jobs/${e.viaJob}`}>{e.viaJob}</EntityLink> : <span className="text-slate-300">—</span>) },
              { key: 'transform', label: 'Bước biến đổi chính', width: '20%', render: e => <span className="text-[11.5px]">{e.transform}</span> },
              { key: 'level', label: 'Mức truy vết', nowrap: true, render: e => <Chip tone="b">{e.level}</Chip> },
              { key: 'schedule', label: 'Lịch chạy liên quan', nowrap: true },
              { key: 'source', label: 'Nguồn thu thập', nowrap: true, render: e => <Chip tone={e.source === 'Khai báo thủ công' ? 'o' : 'g'}>{e.source.replace('Tự động — ', 'Tự động: ')}</Chip> },
              { key: 'approval', label: 'Phê duyệt', nowrap: true, render: e => <StatusChip value={e.approval} /> },
              { key: 'declaredBy', label: 'Người khai', nowrap: true, render: e => <div><div>{e.declaredBy}</div><div className="text-[10.5px] text-slate-400">{e.declaredAt}</div></div> },
            ]}
          />

          <Note tone="warn" title="Vì sao phải cho khai báo thủ công" className="mt-4">
            Thiết kế ban đầu khẳng định <i>"nguồn gốc dữ liệu không có gì để khai"</i>. Nhưng GĐ2 · FR-06 yêu cầu rõ:
            <b> "cho phép khai báo thủ công khi không thu thập tự động được"</b>.
            Thực tế có {manual.length} quan hệ chỉ tồn tại trong đầu người — Power BI đọc DirectQuery, Excel ghép tay, xử lý ngoài công cụ chuẩn.
            Không cho khai tay thì chuỗi truy vết đứt ngay tại mắt xích quan trọng nhất: <b>từ bảng tới báo cáo</b>.
          </Note>
        </>
      )}

      {tab === 'impact' && (
        <>
          <Panel title="Chọn đối tượng cần phân tích" className="mb-4">
            <div className="flex items-end gap-3">
              <Field label="Đối tượng" className="flex-1">
                <SelectInput value={impactObj} onChange={e => setImpactObj(e.target.value)}>
                  <optgroup label="Bảng dữ liệu">
                    {tables.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
                  </optgroup>
                  <optgroup label="Hệ thống">
                    {systems.map(s => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
                  </optgroup>
                </SelectInput>
              </Field>
              <ActionButton size="md" onClick={() => setShowImpact(true)}>Phân tích ảnh hưởng</ActionButton>
            </div>
          </Panel>

          <ImpactResult objectId={impactObj} />
        </>
      )}

      <Modal
        open={showImpact}
        onClose={() => setShowImpact(false)}
        size="lg"
        title="Danh sách người cần thông báo"
        desc={`Thay đổi ${impactObj} sẽ ảnh hưởng tới các đối tượng và người dùng sau`}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setShowImpact(false)}>Đóng</ActionButton>
            <ActionButton icon="export" onClick={() => { setShowImpact(false); toast.info('Đã xuất danh sách', 'File CSV gồm người phụ trách, đơn vị và kênh liên hệ — minh hoạ.') }}>
              Xuất danh sách
            </ActionButton>
          </>
        }
      >
        <DataTable
          rows={[
            { who: 'Nguyễn Thị Phương', role: 'Đầu mối nghiệp vụ của bảng', unit: 'Ban Kinh doanh', why: 'Phụ trách bảng bị thay đổi', channel: 'Email + Telegram' },
            { who: 'Trần Văn Hùng', role: 'Đầu mối kỹ thuật', unit: 'Đội Dữ liệu', why: 'Phụ trách job JOB-0412', channel: 'Email + Telegram' },
            { who: 'Phạm Thu Hà', role: 'Người sở hữu dữ liệu', unit: 'Ban Tài chính', why: 'Phê duyệt thay đổi', channel: 'Email' },
            { who: 'Ban Điều hành', role: 'Đối tượng sử dụng báo cáo', unit: '—', why: 'Dùng BC-001, BC-004', channel: 'Email' },
            { who: '184 người dùng có quyền', role: 'Người sử dụng dữ liệu', unit: '6 đơn vị', why: 'Đang truy vấn bảng này', channel: 'Thông báo trong hệ thống' },
          ]}
          columns={[
            { key: 'who', label: 'Người / nhóm', render: r => <span className="font-semibold">{r.who}</span> },
            { key: 'role', label: 'Vai trò' },
            { key: 'unit', label: 'Đơn vị', nowrap: true },
            { key: 'why', label: 'Lý do cần báo' },
            { key: 'channel', label: 'Kênh thông báo', nowrap: true, render: r => <Chip tone="b">{r.channel}</Chip> },
          ]}
        />
      </Modal>
    </>
  )
}

/* ─────────── Kết quả phân tích ảnh hưởng ─────────── */

function ImpactResult({ objectId }: { objectId: string }) {
  const t = tableById(objectId)
  const isSystem = objectId.startsWith('HT-')

  if (isSystem) {
    const sys = systemById(objectId)!
    const sysTables = tables.filter(x => x.systemId === objectId)
    return (
      <>
        <KpiRow
          items={[
            { label: 'Bảng thuộc hệ thống', value: fmt(sys.tableCount), sub: `${sysTables.length} bảng đã khai chi tiết`, tone: 'warn' },
            { label: 'Báo cáo bị ảnh hưởng', value: new Set(sysTables.flatMap(x => x.consumerReports)).size, sub: 'qua chuỗi bảng → báo cáo', tone: 'bad' },
            { label: 'Job đọc dữ liệu', value: jobs.filter(j => j.sourceTables.some(s => sysTables.some(x => x.id === s))).length, sub: 'sẽ hỏng nếu hệ thống ngừng' },
            { label: 'Kênh trao đổi liên quan', value: 2, sub: 'gửi đi và nhận về' },
          ]}
        />
        <Panel title="Bảng chịu ảnh hưởng trực tiếp" className="mt-4">
          <DataTable
            rows={sysTables}
            rowKey={x => x.id}
            columns={[
              { key: 'id', label: 'Bảng', render: x => <EntityLink to={`/catalog/tables/${encodeURIComponent(x.id)}`}>{x.id}</EntityLink> },
              { key: 'tier', label: 'Mức QT', nowrap: true, render: x => x.tier ?? '—' },
              { key: 'reports', label: 'Báo cáo dùng', align: 'center', nowrap: true, render: x => x.consumerReports.length },
              { key: 'usage', label: 'Lượt dùng/tuần', align: 'right', nowrap: true, render: x => fmt(x.usageWeek) },
            ]}
          />
        </Panel>
      </>
    )
  }

  if (!t) return <EmptyState text="Chọn một đối tượng để phân tích" />

  const downTables = t.downstreamTables
  const affectedMetrics = metrics.filter(m => m.sourceTables.includes(t.id))
  const affectedReports = reports.filter(r => r.sourceTables.includes(t.id) || t.consumerReports.includes(r.id))

  return (
    <>
      <KpiRow
        items={[
          { label: 'Bảng hạ nguồn', value: downTables.length, sub: 'sẽ sai theo', tone: 'warn' },
          { label: 'Chỉ tiêu bị ảnh hưởng', value: affectedMetrics.length, sub: 'công thức dùng bảng này', tone: 'bad' },
          { label: 'Báo cáo bị ảnh hưởng', value: affectedReports.length, sub: 'hiển thị số sai', tone: 'bad' },
          { label: 'Job liên quan', value: jobs.filter(j => j.sourceTables.includes(t.id) || j.targetTable === t.id).length, sub: 'đọc hoặc ghi bảng này' },
          { label: 'Người dùng có quyền', value: 184, sub: '6 đơn vị', tone: 'warn' },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-4 items-start">
        <Panel title="Chỉ tiêu bị ảnh hưởng">
          <DataTable
            dense
            rows={affectedMetrics}
            rowKey={m => m.id}
            empty="Không có chỉ tiêu nào dùng trực tiếp bảng này"
            columns={[
              { key: 'id', label: 'Mã', nowrap: true, render: m => <EntityLink to={`/catalog/reports/metrics/${m.id}`}>{m.id}</EntityLink> },
              { key: 'name', label: 'Chỉ tiêu' },
              { key: 'formula', label: 'Công thức', render: m => <span className="mono text-[10.5px]">{m.formula}</span> },
              { key: 'owner', label: 'Phụ trách', nowrap: true },
            ]}
          />
        </Panel>

        <Panel title="Báo cáo bị ảnh hưởng">
          <DataTable
            dense
            rows={affectedReports}
            rowKey={r => r.id}
            empty="Không có báo cáo nào dùng bảng này"
            columns={[
              { key: 'id', label: 'Mã', nowrap: true, render: r => <EntityLink to={`/catalog/reports/${r.id}`}>{r.id}</EntityLink> },
              { key: 'name', label: 'Báo cáo' },
              { key: 'ownerUnit', label: 'Đơn vị sở hữu', nowrap: true },
              { key: 'readyBy', label: 'Giờ cam kết', nowrap: true },
            ]}
          />
        </Panel>
      </div>

      <Note tone="bad" title="Trước khi thay đổi bảng này" className="mt-4">
        Thông báo cho <b>{affectedReports.length} đơn vị sở hữu báo cáo</b> trước ít nhất 5 ngày làm việc ·
        kiểm tra lại <b>{t.ruleCount} luật chất lượng</b> đang gán · cập nhật <b>{affectedMetrics.length} công thức chỉ tiêu</b> nếu đổi tên cột ·
        chạy lại <b>{jobs.filter(j => j.sourceTables.includes(t.id)).length} job hạ nguồn</b> sau khi thay đổi.
      </Note>
    </>
  )
}

/* ─────────── Dựng bản đồ theo mức ─────────── */

function buildMap(level: string): { nodes: FlowNode[]; edges: FlowEdge[]; width: number; height: number } {
  if (level === 'Hệ thống') {
    const nodes: FlowNode[] = [
      { id: 'HT-09', x: 20, y: 30, w: 180, title: 'Cổng đối tác A', sub: 'HT-09 · SFTP', tone: 'source', to: '/catalog/systems/HT-09' },
      { id: 'HT-02', x: 20, y: 120, w: 180, title: 'Core thanh toán', sub: 'HT-02 · PostgreSQL', tone: 'source', to: '/catalog/systems/HT-02' },
      { id: 'HT-01', x: 20, y: 210, w: 180, title: 'CRM', sub: 'HT-01 · Oracle', tone: 'source', to: '/catalog/systems/HT-01' },
      { id: 'HT-07', x: 20, y: 300, w: 180, title: 'Hàng đợi sự kiện', sub: 'HT-07 · Kafka', tone: 'source', to: '/catalog/systems/HT-07' },
      { id: 'HT-04', x: 280, y: 165, w: 180, title: 'Vùng dữ liệu thô', sub: 'HT-04 · HDFS', tone: 'neutral', to: '/catalog/systems/HT-04', badge: { text: 'Metadata 31%', tone: 'r' } },
      { id: 'HT-03', x: 540, y: 165, w: 180, title: 'Kho dữ liệu tập trung', sub: 'HT-03 · Iceberg', tone: 'active', to: '/catalog/systems/HT-03' },
      { id: 'HT-05', x: 800, y: 90, w: 180, title: 'Hệ thống kế toán', sub: 'HT-05 · SQL Server', tone: 'target', to: '/catalog/systems/HT-05' },
      { id: 'HT-06', x: 800, y: 180, w: 180, title: 'Nền tảng BI', sub: 'HT-06 · Power BI', tone: 'target', to: '/catalog/systems/HT-06' },
      { id: 'HT-08', x: 800, y: 270, w: 180, title: 'Quản lý rủi ro', sub: 'HT-08 · MongoDB', tone: 'target', to: '/catalog/systems/HT-08' },
    ]
    const edges: FlowEdge[] = [
      { from: 'HT-09', to: 'HT-04', label: 'SFTP' },
      { from: 'HT-02', to: 'HT-04' },
      { from: 'HT-01', to: 'HT-04' },
      { from: 'HT-07', to: 'HT-04', label: 'Kafka' },
      { from: 'HT-04', to: 'HT-03' },
      { from: 'HT-03', to: 'HT-05', label: 'API' },
      { from: 'HT-03', to: 'HT-06', tone: 'warn', dashed: true, label: 'khai tay' },
      { from: 'HT-01', to: 'HT-08', label: 'API' },
    ]
    return { nodes, edges, width: 1010, height: 380 }
  }

  if (level === 'Cột') {
    const nodes: FlowNode[] = [
      { id: 'c1', x: 20, y: 40, w: 210, title: 'raw.doi_soat_A_tho', sub: 'so_tien · so_dien_thoai', tone: 'source', to: '/catalog/tables/raw.doi_soat_A_tho/columns' },
      { id: 'c2', x: 20, y: 140, w: 210, title: 'dwh.giao_dich_thanh_toan', sub: 'so_tien · ma_giao_dich', tone: 'source', to: '/catalog/tables/dwh.giao_dich_thanh_toan/columns' },
      { id: 'j', x: 300, y: 90, w: 150, title: 'JOB-0412 · Bước 4', sub: 'Đối chiếu và tính chênh lệch', tone: 'neutral', to: '/orchestration/jobs/JOB-0412' },
      { id: 'o1', x: 530, y: 30, w: 220, title: 'bi.doi_soat_giao_dich_A', sub: 'so_tien ← dwh.so_tien', tone: 'active', to: '/catalog/tables/bi.doi_soat_giao_dich_A/columns' },
      { id: 'o2', x: 530, y: 110, w: 220, title: 'bi.doi_soat_giao_dich_A', sub: 'so_tien_doi_tac ← raw.so_tien', tone: 'active' },
      { id: 'o3', x: 530, y: 190, w: 220, title: 'bi.doi_soat_giao_dich_A', sub: 'chenh_lech ← so_tien − so_tien_doi_tac', tone: 'active', badge: { text: 'công thức', tone: 'b' } },
      { id: 'm', x: 820, y: 110, w: 170, title: 'CT-004', sub: 'Giá trị chênh lệch đối soát', tone: 'target', to: '/catalog/reports/metrics/CT-004' },
    ]
    const edges: FlowEdge[] = [
      { from: 'c1', to: 'j' }, { from: 'c2', to: 'j' },
      { from: 'j', to: 'o1' }, { from: 'j', to: 'o2' }, { from: 'j', to: 'o3' },
      { from: 'o3', to: 'm', tone: 'warn', dashed: true, label: 'khai tay' },
    ]
    return { nodes, edges, width: 1010, height: 270 }
  }

  if (level === 'Nghiệp vụ') {
    const nodes: FlowNode[] = [
      { id: 't1', x: 20, y: 30, w: 200, title: 'bi.doi_soat_giao_dich_A', sub: 'Bảng đối soát', tone: 'source', to: '/catalog/tables/bi.doi_soat_giao_dich_A' },
      { id: 't2', x: 20, y: 120, w: 200, title: 'mart.doanh_thu_ngay', sub: 'Bảng doanh thu ngày', tone: 'source', to: '/catalog/tables/mart.doanh_thu_ngay' },
      { id: 't3', x: 20, y: 210, w: 200, title: 'crm.khach_hang', sub: 'Bảng khách hàng', tone: 'source', to: '/catalog/tables/crm.khach_hang' },
      { id: 'CT-002', x: 300, y: 20, w: 180, title: 'Tỷ lệ đối soát khớp', sub: 'CT-002 · %', tone: 'neutral', to: '/catalog/reports/metrics/CT-002' },
      { id: 'CT-004', x: 300, y: 95, w: 180, title: 'Giá trị chênh lệch', sub: 'CT-004 · VND', tone: 'neutral', to: '/catalog/reports/metrics/CT-004' },
      { id: 'CT-001', x: 300, y: 170, w: 180, title: 'Doanh thu ghi nhận', sub: 'CT-001 · VND', tone: 'neutral', to: '/catalog/reports/metrics/CT-001' },
      { id: 'CT-003', x: 300, y: 245, w: 180, title: 'Số KH hoạt động', sub: 'CT-003 · khách hàng', tone: 'neutral', to: '/catalog/reports/metrics/CT-003' },
      { id: 'BC-004', x: 580, y: 20, w: 200, title: 'Báo cáo đối soát đối tác', sub: 'BC-004 · hằng ngày 09:00', tone: 'target', to: '/catalog/reports/BC-004' },
      { id: 'BC-001', x: 580, y: 110, w: 200, title: 'Báo cáo doanh thu ngày', sub: 'BC-001 · hằng ngày 08:00', tone: 'target', to: '/catalog/reports/BC-001' },
      { id: 'BC-005', x: 580, y: 200, w: 200, title: 'Báo cáo khách hàng', sub: 'BC-005 · hằng tháng', tone: 'target', to: '/catalog/reports/BC-005' },
      { id: 'BDH', x: 850, y: 110, w: 140, title: 'Ban Điều hành', sub: 'Đối tượng sử dụng', tone: 'neutral' },
    ]
    const edges: FlowEdge[] = [
      { from: 't1', to: 'CT-002' }, { from: 't1', to: 'CT-004' }, { from: 't1', to: 'CT-001' },
      { from: 't2', to: 'CT-001' }, { from: 't3', to: 'CT-003' },
      { from: 'CT-002', to: 'BC-004' }, { from: 'CT-004', to: 'BC-004' },
      { from: 'CT-001', to: 'BC-001' }, { from: 'CT-003', to: 'BC-005', tone: 'warn', dashed: true },
      { from: 'BC-001', to: 'BDH' }, { from: 'BC-004', to: 'BDH' },
    ]
    return { nodes, edges, width: 1010, height: 320 }
  }

  // Mức Bảng
  const nodes: FlowNode[] = [
    { id: 'KENH-01', x: 20, y: 40, w: 170, title: 'KENH-01', sub: 'SFTP đối tác A', tone: 'source', to: '/catalog/channels/KENH-01' },
    { id: 'KENH-02', x: 20, y: 200, w: 170, title: 'KENH-02', sub: 'Kafka sự kiện', tone: 'source', to: '/catalog/channels/KENH-02' },
    { id: 'raw1', x: 240, y: 40, w: 190, title: 'raw.doi_soat_A_tho', sub: '12,5 tr dòng', tone: 'neutral', to: '/catalog/tables/raw.doi_soat_A_tho', badge: { text: 'CL 78', tone: 'o' } },
    { id: 'raw2', x: 240, y: 200, w: 190, title: 'raw.giao_dich_kafka', sub: '942 tr dòng', tone: 'neutral', to: '/catalog/tables/raw.giao_dich_kafka', badge: { text: 'chưa kiểm', tone: 'n' } },
    { id: 'dwh1', x: 480, y: 200, w: 190, title: 'dwh.giao_dich_thanh_toan', sub: 'JOB-0208', tone: 'neutral', to: '/catalog/tables/dwh.giao_dich_thanh_toan', badge: { text: 'CL 94', tone: 'g' } },
    { id: 'bi1', x: 480, y: 40, w: 190, title: 'bi.doi_soat_giao_dich_A', sub: 'JOB-0412 · Tier 1', tone: 'active', to: '/catalog/tables/bi.doi_soat_giao_dich_A', badge: { text: 'CL 91', tone: 'g' } },
    { id: 'mart1', x: 730, y: 120, w: 180, title: 'mart.doanh_thu_ngay', sub: 'JOB-0301', tone: 'neutral', to: '/catalog/tables/mart.doanh_thu_ngay', badge: { text: 'CL 89', tone: 'g' } },
    { id: 'fin1', x: 730, y: 20, w: 180, title: 'fin.so_cai_doi_soat', sub: 'JOB-0455', tone: 'target', to: '/catalog/tables/fin.so_cai_doi_soat', badge: { text: 'CL 92', tone: 'g' } },
    { id: 'mart2', x: 730, y: 220, w: 180, title: 'mart.doi_soat_thang', sub: 'JOB-0412', tone: 'target', to: '/catalog/tables/mart.doi_soat_thang', badge: { text: 'CL 85', tone: 'g' } },
  ]
  const edges: FlowEdge[] = [
    { from: 'KENH-01', to: 'raw1' },
    { from: 'KENH-02', to: 'raw2' },
    { from: 'raw1', to: 'bi1', label: 'JOB-0412' },
    { from: 'raw2', to: 'dwh1', label: 'JOB-0208' },
    { from: 'dwh1', to: 'bi1' },
    { from: 'dwh1', to: 'mart1', label: 'JOB-0301' },
    { from: 'bi1', to: 'fin1', label: 'JOB-0455' },
    { from: 'bi1', to: 'mart2' },
  ]
  return { nodes, edges, width: 940, height: 300 }
}

/* ─────────── Khai báo quan hệ thủ công ─────────── */

export function LineageCreate() {
  const save = useDemoSave('/governance/lineage')
  const [step, setStep] = useState(0)
  const [f, setF] = useState({
    fromType: 'Bảng', from: '', toType: 'Báo cáo', to: '', viaJob: '',
    transform: '', level: 'Nghiệp vụ', schedule: '', note: '',
  })
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }))
  const ok = f.from && f.to && f.transform && f.level

  const optionsFor = (type: string) => {
    if (type === 'Bảng') return tables.map(t => ({ v: t.id, l: t.id }))
    if (type === 'Hệ thống') return systems.map(s => ({ v: s.id, l: `${s.id} — ${s.name}` }))
    if (type === 'Báo cáo') return reports.map(r => ({ v: r.id, l: `${r.id} — ${r.name}` }))
    if (type === 'Chỉ tiêu') return metrics.map(m => ({ v: m.id, l: `${m.id} — ${m.name}` }))
    if (type === 'Kênh') return [{ v: 'KENH-01', l: 'KENH-01 — SFTP đối tác A' }, { v: 'KENH-02', l: 'KENH-02 — Kafka sự kiện' }]
    if (type === 'Cột') return tables.slice(0, 6).map(t => ({ v: `${t.id}.<cột>`, l: `${t.id}.<cột>` }))
    return []
  }

  return (
    <>
      <PageHeader
        code="2.3"
        title="Khai báo quan hệ luồng dữ liệu thủ công"
        desc="Dùng khi hệ thống không tự phát hiện được — ví dụ Power BI đọc DirectQuery, Excel ghép tay, xử lý ngoài công cụ chuẩn"
        crumbs={[{ label: 'Governance' }, { label: 'Truy vết luồng dữ liệu', href: '/governance/lineage' }, { label: 'Khai báo thủ công' }]}
      />
      <Steps items={['Nguồn và đích', 'Cách biến đổi', 'Xem lại và gửi duyệt']} current={step} onJump={setStep} />

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title={['Xác định hai đầu quan hệ', 'Mô tả cách dữ liệu được biến đổi', 'Xem lại và gửi duyệt'][step]}>
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Loại đối tượng nguồn" required>
                <SelectInput value={f.fromType} onChange={set('fromType')}>{OBJECT_TYPES.filter(t => t !== 'Báo cáo' && t !== 'Chỉ tiêu').map(t => <option key={t}>{t}</option>)}</SelectInput>
              </Field>
              <Field label="Đối tượng nguồn (upstream)" required>
                <SelectInput value={f.from} onChange={set('from')}>
                  <option value="">— Chọn —</option>
                  {optionsFor(f.fromType).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </SelectInput>
              </Field>
              <Field label="Loại đối tượng đích" required>
                <SelectInput value={f.toType} onChange={set('toType')}>{OBJECT_TYPES.filter(t => t !== 'File' && t !== 'Kênh').map(t => <option key={t}>{t}</option>)}</SelectInput>
              </Field>
              <Field label="Đối tượng đích (downstream)" required>
                <SelectInput value={f.to} onChange={set('to')}>
                  <option value="">— Chọn —</option>
                  {optionsFor(f.toType).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </SelectInput>
              </Field>
              <Field label="Mức truy vết" info="lineage.level" required hint="Hệ thống · Bảng · Cột · Nghiệp vụ">
                <SelectInput value={f.level} onChange={set('level')}>{LEVELS.map(l => <option key={l}>{l}</option>)}</SelectInput>
              </Field>
              <Field label="Tiến trình / job trung gian" hint="Để trống nếu không đi qua job nào">
                <SelectInput value={f.viaJob} onChange={set('viaJob')}>
                  <option value="">— Không qua job —</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.id} — {j.name}</option>)}
                </SelectInput>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bước biến đổi chính" info="lineage.transform" required full hint="Tóm tắt quy tắc/logic biến đổi dữ liệu — đây là trường người duyệt đọc kỹ nhất">
                <TextArea rows={3} value={f.transform} onChange={set('transform')} placeholder="Power BI đọc trực tiếp qua DirectQuery, lọc trạng thái ACTIVE và tổng hợp theo tháng" />
              </Field>
              <Field label="Lịch chạy liên quan" full hint="Tần suất dữ liệu được cập nhật qua quan hệ này">
                <TextInput value={f.schedule} onChange={set('schedule')} placeholder="Hằng tháng, ngày 03" />
              </Field>
              <Field label="Ghi chú cho người duyệt" full>
                <TextArea rows={2} value={f.note} onChange={set('note')} placeholder="Vì sao phải khai tay — công cụ nào không xuất được lineage" />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <InfoGrid
                items={[
                  { label: 'Đối tượng nguồn', value: <><Chip tone="n">{f.fromType}</Chip> <span className="mono ml-1">{f.from || '—'}</span></> },
                  { label: 'Đối tượng đích', value: <><Chip tone="t">{f.toType}</Chip> <span className="mono ml-1">{f.to || '—'}</span></> },
                  { label: 'Tiến trình trung gian', value: f.viaJob || '— không qua job' },
                  { label: 'Mức truy vết', value: f.level },
                  { label: 'Lịch chạy liên quan', value: f.schedule || '—' },
                  { label: 'Nguồn thu thập', value: <Chip tone="o">Khai báo thủ công</Chip> },
                  { label: 'Bước biến đổi chính', value: f.transform || '—', full: true },
                  { label: 'Ghi chú', value: f.note || '—', full: true },
                ]}
              />
              <Note tone="warn" title="Quan hệ khai thủ công phải qua phê duyệt">
                Theo GĐ2 mục 8, quy trình phê duyệt áp dụng cho <b>cả metadata và quan hệ luồng dữ liệu khai thủ công</b>.
                Bản ghi sẽ ở trạng thái <b>Chờ phê duyệt</b> cho tới khi Người sở hữu dữ liệu của đối tượng đích xác nhận.
              </Note>
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Bảy trường bắt buộc — GĐ2 mục 5.7">
            <ol className="ml-4 list-decimal space-y-1 text-[12px] text-slate-600">
              <li>Đối tượng nguồn (upstream)</li>
              <li>Đối tượng đích (downstream)</li>
              <li>Tiến trình/job trung gian</li>
              <li>Bước biến đổi chính</li>
              <li>Mức truy vết</li>
              <li>Lịch chạy liên quan</li>
              <li>Liên kết với chất lượng và nhãn nhạy cảm <span className="text-slate-400">(hệ thống tự nối)</span></li>
            </ol>
          </Panel>
          <Note tone="info" title="Khai xong thì được gì">
            Quan hệ này sẽ xuất hiện trên <b>bản đồ luồng</b>, trong <b>tab Nguồn gốc</b> của bảng liên quan,
            và được tính vào chỉ số <b>"tỷ lệ báo cáo/chỉ tiêu truy vết được đến nguồn"</b> ở menu 8.1.
          </Note>
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/governance/lineage">Huỷ</ActionButton>
        <div className="flex gap-2">
          {step > 0 && <ActionButton variant="ghost" onClick={() => setStep(s => s - 1)}>Quay lại</ActionButton>}
          {step < 2
            ? <ActionButton onClick={() => setStep(s => s + 1)}>Tiếp tục</ActionButton>
            : <ActionButton disabled={!ok} onClick={() => save('Đã gửi phê duyệt quan hệ luồng dữ liệu')}>Gửi phê duyệt</ActionButton>}
        </div>
      </div>
    </>
  )
}
