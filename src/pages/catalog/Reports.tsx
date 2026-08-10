import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  PageHeader, KpiRow, FilterBar, DataTable, CellTitle, Panel, Note, Chip, StatusChip,
  ActionButton, IconBtn, RowActions, EntityLink, InfoGrid, EmptyState, InlineTabs,
  Field, TextInput, TextArea, SelectInput, Steps, SectionTitle, CodeBlock, FlowDiagram,
  Modal, useToast, ProgressBar,
} from '@/components/common'
import { reports, metrics, reportById, metricById, tableById, glossaryById, STATS, fmt, lineageEdges, rulesOf } from '@/data'
import { match, useDemoSave } from '@/lib/demo'
import { glossary as glossaryTerms } from '@/data'
import { ORG_UNITS, BI_TOOLS, REPORT_OUTPUTS, REPORT_FREQUENCIES, CONFIDENTIALITY_NAMES, usersByRole } from '@/data/enums'

/* ═════════ Danh sách Báo cáo & Chỉ tiêu ═════════ */

export function ReportList() {
  const [tab, setTab] = useState('reports')
  const [q, setQ] = useState('')
  const [tool, setTool] = useState('')
  const nav = useNavigate()

  const repRows = useMemo(
    () => reports.filter(r => (!tool || r.tool === tool) && match(`${r.id} ${r.name} ${r.description} ${r.ownerUnit}`, q)),
    [q, tool]
  )
  const metRows = useMemo(() => metrics.filter(m => match(`${m.id} ${m.name} ${m.definition} ${m.formula}`, q)), [q])

  const notTraceable = reports.filter(r => !r.traceable).length

  return (
    <>
      <PageHeader
        code="1.3"
        title="Báo cáo & Chỉ tiêu"
        desc="Thông tin nghiệp vụ — đích cuối của mọi luồng dữ liệu. Đây là nhóm đối tượng số 5 trong 7 nhóm bắt buộc của GĐ2"
        crumbs={[{ label: 'Data Catalog' }, { label: 'Báo cáo & Chỉ tiêu' }]}
        actions={
          <>
            <ActionButton variant="ghost" icon="import">Nạp từ file</ActionButton>
            <ActionButton icon="plus" to={tab === 'reports' ? '/catalog/reports/create' : '/catalog/reports/metrics/create'}>
              {tab === 'reports' ? 'Thêm báo cáo' : 'Thêm chỉ tiêu'}
            </ActionButton>
          </>
        }
      />

      <KpiRow
        items={[
          { label: 'Tổng số báo cáo', value: STATS.totalReports, sub: `${reports.length} báo cáo đã khai chi tiết` },
          { label: 'Tổng số chỉ tiêu', value: STATS.totalMetrics, sub: `${metrics.length} chỉ tiêu đã khai chi tiết` },
          { label: 'Truy vết được tới nguồn', value: `${STATS.reportsTraceable}/${STATS.totalReports}`, sub: '31% — mục tiêu 80%', tone: 'bad' },
          { label: 'Chưa truy vết được', value: notTraceable, sub: 'trong số đã khai chi tiết', tone: 'warn' },
          { label: 'Chờ phê duyệt', value: reports.filter(r => r.approval !== 'Đã phê duyệt').length + metrics.filter(m => m.approval !== 'Đã phê duyệt').length, sub: 'báo cáo và chỉ tiêu', tone: 'warn' },
        ]}
      />

      <div className="mt-4">
        <InlineTabs
          items={[
            { id: 'reports', label: 'Báo cáo', badge: reports.length },
            { id: 'metrics', label: 'Chỉ tiêu', badge: metrics.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <FilterBar
        placeholder={tab === 'reports' ? 'Tìm theo tên báo cáo, đơn vị sở hữu…' : 'Tìm theo tên chỉ tiêu, công thức…'}
        value={q}
        onChange={setQ}
        filters={tab === 'reports' ? [{ label: 'Công cụ', options: ['Power BI', 'Excel', 'SQLWF Dashboard', 'Superset'], value: tool, onChange: setTool }] : []}
        right={<span className="text-[12px] text-slate-400">{tab === 'reports' ? repRows.length : metRows.length} bản ghi</span>}
      />

      {tab === 'reports' ? (
        <DataTable
          stt
          rows={repRows}
          rowKey={r => r.id}
          highlightRow={r => (!r.traceable ? 'bad' : r.approval !== 'Đã phê duyệt' ? 'warn' : undefined)}
          columns={[
            { key: 'id', label: 'Mã', nowrap: true, render: r => <EntityLink to={`/catalog/reports/${r.id}`}>{r.id}</EntityLink> },
            { key: 'name', label: 'Tên báo cáo', width: '22%', render: r => <CellTitle title={r.name} sub={r.description} /> },
            { key: 'unit', label: 'Đơn vị sở hữu', nowrap: true },
            { key: 'owner', label: 'Người phụ trách', nowrap: true },
            { key: 'metrics', label: 'Chỉ tiêu', align: 'center', nowrap: true, render: r => <Chip tone="p">{r.metricIds.length}</Chip> },
            { key: 'sources', label: 'Bảng nguồn', align: 'center', nowrap: true, render: r => <Chip tone="b">{r.sourceTables.length}</Chip> },
            { key: 'tool', label: 'Công cụ', nowrap: true, render: r => <Chip tone="t">{r.tool}</Chip> },
            { key: 'output', label: 'Đầu ra', nowrap: true },
            { key: 'freq', label: 'Tần suất', nowrap: true, render: r => <div><div>{r.frequency}</div><div className="text-[10.5px] text-slate-400">{r.readyBy}</div></div> },
            { key: 'trace', label: 'Truy vết', align: 'center', nowrap: true, render: r => (r.traceable ? <Chip tone="g">Được</Chip> : <Chip tone="r">Không</Chip>) },
            { key: 'q', label: 'Chất lượng', align: 'right', nowrap: true, render: r => (r.qualityScore ? <span className={r.qualityScore >= 85 ? 'font-bold text-emerald-600' : 'font-bold text-amber-600'}>{r.qualityScore}</span> : '—') },
            { key: 'conf', label: 'Phân loại', nowrap: true, render: r => <StatusChip value={r.confidentiality} /> },
            { key: 'approval', label: 'Phê duyệt', nowrap: true, render: r => <StatusChip value={r.approval} /> },
            { key: 'act', label: '', align: 'right', nowrap: true, render: r => <RowActions><IconBtn icon="open" title="Chi tiết" to={`/catalog/reports/${r.id}`} /><IconBtn icon="edit" title="Sửa" to={`/catalog/reports/create?id=${r.id}`} /></RowActions> },
          ]}
        />
      ) : (
        <DataTable
          stt
          rows={metRows}
          rowKey={m => m.id}
          highlightRow={m => (!m.traceable ? 'bad' : m.approval !== 'Đã phê duyệt' ? 'warn' : undefined)}
          columns={[
            { key: 'id', label: 'Mã', nowrap: true, render: m => <EntityLink to={`/catalog/reports/metrics/${m.id}`}>{m.id}</EntityLink> },
            { key: 'name', label: 'Tên chỉ tiêu', width: '18%', render: m => <CellTitle title={m.name} sub={m.definition} /> },
            { key: 'unit', label: 'Đơn vị tính', nowrap: true, render: m => <Chip tone="n">{m.unit}</Chip> },
            { key: 'formula', label: 'Công thức tính', width: '24%', render: m => <span className="mono text-[11px] text-slate-600">{m.formula}</span> },
            { key: 'gl', label: 'Thuật ngữ', nowrap: true, render: m => (m.glossaryId ? <EntityLink to={`/governance/glossary/${m.glossaryId}`} mono={false}>{glossaryById(m.glossaryId)?.name}</EntityLink> : <span className="text-red-500">— chưa gắn</span>) },
            { key: 'reports', label: 'Báo cáo dùng', align: 'center', nowrap: true, render: m => <Chip tone="b">{m.reportIds.length}</Chip> },
            { key: 'src', label: 'Bảng nguồn', align: 'center', nowrap: true, render: m => <Chip tone="b">{m.sourceTables.length}</Chip> },
            { key: 'rules', label: 'Luật CL', align: 'center', nowrap: true, render: m => (m.ruleCount ? <Chip tone="g">{m.ruleCount}</Chip> : <Chip tone="r">0</Chip>) },
            { key: 'owner', label: 'Người phụ trách', nowrap: true },
            { key: 'approval', label: 'Phê duyệt', nowrap: true, render: m => <StatusChip value={m.approval} /> },
            { key: 'act', label: '', align: 'right', nowrap: true, render: m => <RowActions><IconBtn icon="open" title="Chi tiết" to={`/catalog/reports/metrics/${m.id}`} /></RowActions> },
          ]}
        />
      )}

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Note tone="bad" title="Đây là gap nghiêm trọng nhất phát hiện khi review">
          Thiết kế DMP ban đầu <b>không có thực thể Báo cáo và Chỉ tiêu</b> — chỉ lưu tên báo cáo dưới dạng chuỗi chữ trong trường <span className="mono">consumers[]</span> của bảng.
          Hệ quả: lineage dừng ở bảng, phân tích ảnh hưởng thành phỏng đoán, và không tính được chỉ số nghiệm thu
          <i> "tỷ lệ báo cáo/chỉ tiêu truy vết được đến nguồn"</i> mà GĐ2 mục 10 yêu cầu.
        </Note>
        <Note tone="info" title="Tám nhóm trường theo GĐ2 mục 5.5">
          Thông tin chung · danh sách chỉ tiêu · dữ liệu và nguồn dữ liệu · định nghĩa và công thức từng chỉ tiêu ·
          điều kiện lấy dữ liệu và quy tắc tổng hợp · tần suất và thời gian sẵn sàng · hình thức đầu ra · đối tượng sử dụng.
          Tất cả đều có mặt trong màn chi tiết.
        </Note>
      </div>
    </>
  )
}

/* ═════════ Chi tiết Báo cáo ═════════ */

export function ReportDetail() {
  const { id = '' } = useParams()
  const r = reportById(id)
  const [impact, setImpact] = useState(false)
  const toast = useToast()

  if (!r) return <EmptyState text="Không tìm thấy báo cáo" action={<ActionButton to="/catalog/reports">Về danh sách</ActionButton>} />

  const mets = r.metricIds.map(m => metricById(m)).filter(Boolean) as any[]

  const nodes = [
    ...r.sourceTables.map((t, i) => ({
      id: t, x: 20, y: 20 + i * 76, w: 200, title: t, sub: tableById(t)?.name ?? 'Bảng nguồn',
      tone: 'source' as const, to: `/catalog/tables/${encodeURIComponent(t)}`,
      badge: tableById(t)?.qualityScore ? { text: `CL ${tableById(t)!.qualityScore}`, tone: (tableById(t)!.qualityScore! >= 85 ? 'g' : 'o') as any } : undefined,
    })),
    ...mets.map((m, i) => ({ id: m.id, x: 320, y: 20 + i * 76, w: 190, title: m.name, sub: `${m.id} · ${m.unit}`, tone: 'neutral' as const, to: `/catalog/reports/metrics/${m.id}` })),
    { id: 'RPT', x: 620, y: 20 + Math.max(0, (Math.max(r.sourceTables.length, mets.length) - 1) * 38), w: 210, h: 64, title: r.name, sub: `${r.id} · ${r.tool}`, tone: 'active' as const },
  ]
  const edges = [
    ...r.sourceTables.flatMap(t => mets.map(m => (m.sourceTables.includes(t) ? { from: t, to: m.id } : null)).filter(Boolean) as any[]),
    ...mets.map(m => ({ from: m.id, to: 'RPT' })),
  ]

  return (
    <>
      <PageHeader
        code="1.3"
        title={r.name}
        desc={`${r.id} · ${r.description}`}
        crumbs={[{ label: 'Data Catalog' }, { label: 'Báo cáo & Chỉ tiêu', href: '/catalog/reports' }, { label: r.id }]}
        actions={
          <>
            <Chip tone="t">{r.tool}</Chip>
            <StatusChip value={r.confidentiality} />
            <StatusChip value={r.approval} />
            <ActionButton variant="ghost" onClick={() => setImpact(true)}>Phân tích ảnh hưởng</ActionButton>
            <ActionButton variant="ghost" icon="edit" to={`/catalog/reports/create?id=${r.id}`}>Sửa</ActionButton>
          </>
        }
      />

      <KpiRow
        items={[
          { label: 'Số chỉ tiêu', value: r.metricIds.length, sub: 'thể hiện trong báo cáo' },
          { label: 'Bảng nguồn', value: r.sourceTables.length, sub: 'phục vụ tính toán' },
          { label: 'Điểm chất lượng', value: r.qualityScore ?? '—', sub: 'trung bình từ bảng nguồn', tone: (r.qualityScore ?? 0) >= 85 ? 'ok' : 'warn' },
          { label: 'Lượt xem / tháng', value: fmt(r.viewsMonth), sub: `${r.audience.length} nhóm đối tượng` },
          { label: 'Truy vết tới nguồn', value: r.traceable ? 'Được' : 'Không', sub: r.traceable ? 'đủ chuỗi tới bảng gốc' : 'thiếu mắt xích', tone: r.traceable ? 'ok' : 'bad' },
        ]}
      />

      <Panel title="Chuỗi hình thành số liệu: bảng nguồn → chỉ tiêu → báo cáo" className="mt-4 mb-4">
        <FlowDiagram nodes={nodes} edges={edges} height={Math.max(200, 60 + Math.max(r.sourceTables.length, mets.length) * 76)} width={880} />
      </Panel>

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4">
          <Panel title="Thông tin chung — GĐ2 mục 5.5">
            <InfoGrid
              items={[
                { label: 'Mã báo cáo', value: <span className="mono">{r.id}</span> },
                { label: 'Tên báo cáo', value: r.name },
                { label: 'Mô tả', value: r.description, full: true },
                { label: 'Mục đích sử dụng', value: r.purpose, full: true },
                { label: 'Đơn vị sở hữu', value: r.ownerUnit },
                { label: 'Người phụ trách', value: r.owner },
                { label: 'Đầu mối nghiệp vụ', value: r.bda },
                { label: 'Công cụ dựng báo cáo', value: r.tool },
                { label: 'Hình thức đầu ra', value: r.output },
                { label: 'Tần suất cập nhật', value: r.frequency },
                { label: 'Thời gian dữ liệu sẵn sàng', value: r.readyBy },
                { label: 'Mức phân loại', value: <StatusChip value={r.confidentiality} /> },
                { label: 'Vòng đời', value: <StatusChip value={r.lifecycle} /> },
                { label: 'Cập nhật lần cuối', value: r.updatedAt },
                { label: 'Đối tượng / đơn vị sử dụng', value: <div className="flex flex-wrap gap-1">{r.audience.map(a => <Chip key={a} tone="n">{a}</Chip>)}</div>, full: true },
              ]}
            />
          </Panel>

          <Panel title={`Danh sách chỉ tiêu trong báo cáo (${mets.length})`}>
            <DataTable
              dense
              rows={mets}
              rowKey={m => m.id}
              columns={[
                { key: 'id', label: 'Mã', nowrap: true, render: m => <EntityLink to={`/catalog/reports/metrics/${m.id}`}>{m.id}</EntityLink> },
                { key: 'name', label: 'Tên chỉ tiêu', render: m => <div><div className="font-semibold">{m.name}</div><div className="text-[11px] text-slate-400">{m.definition}</div></div> },
                { key: 'unit', label: 'ĐVT', nowrap: true },
                { key: 'formula', label: 'Công thức', render: m => <span className="mono text-[11px]">{m.formula}</span> },
                { key: 'agg', label: 'Cách tổng hợp', render: m => <span className="text-[11.5px]">{m.aggregation}</span> },
                { key: 'approval', label: 'Phê duyệt', nowrap: true, render: m => <StatusChip value={m.approval} /> },
              ]}
            />
          </Panel>

          <Panel
            title="Bảng kết quả đầu ra"
            desc="Bảng chứa sẵn số liệu đã tổng hợp mà báo cáo đọc trực tiếp — khác với bảng nguồn dùng để tính"
          >
            {r.backingTables.length ? (
              <>
                <DataTable
                  dense
                  rows={r.backingTables.map(t => tableById(t)).filter(Boolean) as any[]}
                  rowKey={t => t.id}
                  columns={[
                    { key: 'id', label: 'Bảng kết quả', min: 240, render: t => <EntityLink to={`/catalog/tables/${encodeURIComponent(t.id)}`}>{t.id}</EntityLink> },
                    { key: 'name', label: 'Tên nghiệp vụ', min: 190 },
                    { key: 'zone', label: 'Vùng', nowrap: true, render: t => <Chip tone="n">{t.zone}</Chip> },
                    { key: 'sync', label: 'Chu kỳ cập nhật', nowrap: true, render: t => t.syncFrequency },
                    { key: 'q', label: 'Chất lượng', align: 'right', nowrap: true, render: t => t.qualityScore ?? '—' },
                  ]}
                />
                <Note tone="info" title="Về bản chất, báo cáo có phải chỉ là một bảng đầu ra không" className="mt-3">
                  <b>Đúng một nửa.</b> Số liệu của báo cáo này nằm sẵn trong bảng <span className="mono">{r.backingTables[0]}</span> —
                  nên bảng đó được đánh dấu <b>Bảng phục vụ báo cáo</b> ở menu 1.1 và được ưu tiên gán luật chất lượng.
                  <div className="mt-1.5">
                    <b>Nhưng không đủ.</b> Báo cáo có <b>8 nhóm thông tin mà bảng không có chỗ để lưu</b>: mục đích sử dụng ·
                    đơn vị sở hữu · danh sách chỉ tiêu và công thức từng chỉ tiêu · điều kiện lọc và quy tắc tổng hợp ·
                    hình thức đầu ra · thời gian cam kết sẵn sàng · đối tượng sử dụng · lượt xem thực tế.
                    Đó là lý do GĐ2 mục 5.5 tách báo cáo thành <b>nhóm đối tượng riêng</b>, không gộp vào bảng.
                  </div>
                </Note>
              </>
            ) : (
              <Note tone="warn" title="Báo cáo này không có bảng kết quả đầu ra">
                Công cụ <b>{r.tool}</b> tự truy vấn thẳng từ {r.sourceTables.length} bảng nguồn và tính toán tại chỗ,
                không ghi kết quả ra bảng trung gian.
                <div className="mt-1.5">
                  <b>Hệ quả:</b> không gán được luật chất lượng lên kết quả cuối, và quan hệ luồng dữ liệu tới báo cáo
                  phải <b>khai báo thủ công</b> tại menu 2.3 vì công cụ BI không xuất được lineage.
                </div>
              </Note>
            )}
          </Panel>

          <Panel title="Dữ liệu và nguồn dữ liệu được sử dụng" desc="Bảng cung cấp dữ liệu để TÍNH ra số liệu — khác với bảng kết quả đầu ra">
            <DataTable
              dense
              rows={r.sourceTables.map(t => tableById(t)).filter(Boolean) as any[]}
              rowKey={t => t.id}
              columns={[
                { key: 'id', label: 'Bảng nguồn', render: t => <EntityLink to={`/catalog/tables/${encodeURIComponent(t.id)}`}>{t.id}</EntityLink> },
                { key: 'name', label: 'Tên nghiệp vụ' },
                { key: 'sync', label: 'Chu kỳ cập nhật', nowrap: true },
                { key: 'fresh', label: 'Độ tươi', nowrap: true, render: t => <span className={t.freshnessOk ? '' : 'font-semibold text-red-600'}>{t.freshness}</span> },
                { key: 'q', label: 'Chất lượng', align: 'right', nowrap: true, render: t => t.qualityScore ?? '—' },
                { key: 'rules', label: 'Số luật', align: 'right', nowrap: true, render: t => t.ruleCount },
              ]}
            />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Điều kiện lấy dữ liệu và quy tắc tổng hợp">
            <div className="space-y-2">
              {mets.map(m => (
                <div key={m.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="text-[12px] font-semibold text-slate-700">{m.name}</div>
                  <div className="mt-1 text-[11.5px] text-slate-500"><b>Điều kiện lọc:</b> {m.filterRule}</div>
                  <div className="mt-0.5 text-[11.5px] text-slate-500"><b>Tổng hợp:</b> {m.aggregation}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Kiểm soát chất lượng báo cáo">
            {r.qualityScore ? (
              <>
                <ProgressBar pct={r.qualityScore} target={90} label="Điểm chất lượng tổng hợp" note={`${r.qualityScore}/100`} />
                <div className="mt-3 space-y-1.5 text-[12px]">
                  {r.sourceTables.map(t => {
                    const tb = tableById(t)
                    return (
                      <div key={t} className="flex items-center justify-between">
                        <span className="mono truncate text-[11px] text-slate-600">{t}</span>
                        <Chip tone={(tb?.qualityScore ?? 0) >= 85 ? 'g' : (tb?.qualityScore ?? 0) >= 70 ? 'o' : 'r'}>{tb?.qualityScore ?? 'chưa kiểm'}</Chip>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : <span className="text-[12px] text-slate-400">Chưa có luật chất lượng nào gán cho báo cáo này</span>}
            <ActionButton variant="soft" className="mt-3" to={`/quality/assign?object=${r.id}`}>Gán luật cho báo cáo</ActionButton>
          </Panel>

          {!r.traceable && (
            <Note tone="bad" title="Chưa truy vết được tới nguồn">
              Báo cáo này chưa có đủ chuỗi quan hệ từ bảng gốc. Cần khai báo quan hệ thủ công tại menu <b>2.3</b> để tính vào
              chỉ số nghiệm thu <i>"tỷ lệ báo cáo truy vết được đến nguồn"</i>.
            </Note>
          )}
        </div>
      </div>

      <Modal
        open={impact}
        onClose={() => setImpact(false)}
        size="lg"
        title={`Phân tích ảnh hưởng ngược — ${r.id}`}
        desc="Nếu bảng nguồn nào hỏng thì báo cáo này sai ở chỉ tiêu nào"
        footer={<ActionButton variant="ghost" onClick={() => setImpact(false)}>Đóng</ActionButton>}
      >
        <DataTable
          rows={r.sourceTables.map(t => {
            const tb = tableById(t)
            const affected = mets.filter(m => m.sourceTables.includes(t))
            return {
              id: t, name: tb?.name ?? t, q: tb?.qualityScore ?? null,
              incidents: rulesOf(t).filter(x => x.lastResult !== 'Đạt').length,
              metrics: affected.map(m => m.name).join(', ') || '—',
            }
          })}
          rowKey={x => x.id}
          highlightRow={x => (x.incidents ? 'bad' : undefined)}
          columns={[
            { key: 'id', label: 'Bảng nguồn', render: x => <EntityLink to={`/catalog/tables/${encodeURIComponent(x.id)}`}>{x.id}</EntityLink> },
            { key: 'q', label: 'Điểm chất lượng', align: 'right', nowrap: true, render: x => x.q ?? '—' },
            { key: 'incidents', label: 'Luật đang lỗi', align: 'center', nowrap: true, render: x => (x.incidents ? <Chip tone="r">{x.incidents}</Chip> : <Chip tone="g">0</Chip>) },
            { key: 'metrics', label: 'Chỉ tiêu bị ảnh hưởng nếu bảng này sai' },
          ]}
        />
        <Note tone="warn" title="Người cần được thông báo" className="mt-3">
          {r.audience.join(' · ')} — tổng cộng khoảng <b>{fmt(r.viewsMonth)}</b> lượt xem mỗi tháng.
        </Note>
      </Modal>
    </>
  )
}

/* ═════════ Chi tiết Chỉ tiêu ═════════ */

export function MetricDetail() {
  const { id = '' } = useParams()
  const m = metricById(id)
  if (!m) return <EmptyState text="Không tìm thấy chỉ tiêu" action={<ActionButton to="/catalog/reports">Về danh sách</ActionButton>} />

  const gl = glossaryById(m.glossaryId)
  const edges = lineageEdges.filter(e => e.to === m.id || e.from === m.id)

  return (
    <>
      <PageHeader
        code="1.3"
        title={m.name}
        desc={`${m.id} · ${m.definition}`}
        crumbs={[{ label: 'Data Catalog' }, { label: 'Báo cáo & Chỉ tiêu', href: '/catalog/reports' }, { label: m.id }]}
        actions={
          <>
            <Chip tone="p">Chỉ tiêu</Chip>
            <Chip tone="n">{m.unit}</Chip>
            <StatusChip value={m.approval} />
          </>
        }
      />

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4">
          <Panel title="Định nghĩa và công thức tính">
            <InfoGrid
              items={[
                { label: 'Mã chỉ tiêu', value: <span className="mono">{m.id}</span> },
                { label: 'Đơn vị tính', value: m.unit },
                { label: 'Định nghĩa', value: m.definition, full: true },
                { label: 'Người phụ trách', value: m.owner },
                { label: 'Thuật ngữ nghiệp vụ liên kết', value: gl ? <EntityLink to={`/governance/glossary/${gl.id}`} mono={false}>{gl.name}</EntityLink> : <span className="text-red-600">— chưa gắn thuật ngữ</span> },
              ]}
            />
            <div className="mt-3">
              <SectionTitle>Công thức tính</SectionTitle>
              <CodeBlock dark>{m.formula}</CodeBlock>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase text-slate-400">Điều kiện lấy dữ liệu</div>
                <div className="text-[12.5px] text-slate-700">{m.filterRule}</div>
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase text-slate-400">Quy tắc tổng hợp</div>
                <div className="text-[12.5px] text-slate-700">{m.aggregation}</div>
              </div>
            </div>
          </Panel>

          <Panel title="Nguồn dữ liệu">
            <DataTable
              dense
              rows={m.sourceTables.map(t => tableById(t)).filter(Boolean) as any[]}
              rowKey={t => t.id}
              columns={[
                { key: 'id', label: 'Bảng nguồn', render: t => <EntityLink to={`/catalog/tables/${encodeURIComponent(t.id)}`}>{t.id}</EntityLink> },
                { key: 'name', label: 'Tên nghiệp vụ' },
                { key: 'domain', label: 'Miền', nowrap: true, render: t => t.domain ?? '—' },
                { key: 'q', label: 'Chất lượng', align: 'right', nowrap: true, render: t => t.qualityScore ?? '—' },
              ]}
            />
          </Panel>

          <Panel title="Quan hệ luồng dữ liệu mức nghiệp vụ">
            <DataTable
              dense
              rows={edges}
              rowKey={e => e.id}
              empty="Chưa khai báo quan hệ luồng dữ liệu cho chỉ tiêu này"
              columns={[
                { key: 'id', label: 'Mã', nowrap: true, render: e => <span className="mono text-[11.5px]">{e.id}</span> },
                { key: 'from', label: 'Nguồn', render: e => <span className="mono text-[11.5px]">{e.from}</span> },
                { key: 'to', label: 'Đích', render: e => <span className="mono text-[11.5px]">{e.to}</span> },
                { key: 'transform', label: 'Bước biến đổi' },
                { key: 'source', label: 'Nguồn thu thập', nowrap: true, render: e => <Chip tone={e.source === 'Khai báo thủ công' ? 'o' : 'g'}>{e.source}</Chip> },
                { key: 'approval', label: 'Phê duyệt', nowrap: true, render: e => <StatusChip value={e.approval} /> },
              ]}
            />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title={`Báo cáo đang dùng chỉ tiêu này (${m.reportIds.length})`}>
            <div className="space-y-1.5">
              {m.reportIds.map(r => {
                const rep = reportById(r)
                return (
                  <div key={r} className="rounded-lg border border-slate-200 px-3 py-2">
                    <EntityLink to={`/catalog/reports/${r}`} mono={false}>{rep?.name ?? r}</EntityLink>
                    <div className="mt-0.5 text-[11px] text-slate-400">{rep?.ownerUnit} · {rep?.frequency}</div>
                  </div>
                )
              })}
              {!m.reportIds.length && <span className="text-[12px] text-slate-400">Chưa báo cáo nào sử dụng</span>}
            </div>
          </Panel>

          <Panel title="Kiểm soát chất lượng chỉ tiêu">
            {m.ruleCount ? (
              <>
                <ProgressBar pct={m.qualityScore ?? 0} target={90} label="Điểm chất lượng" note={`${m.qualityScore}/100`} />
                <div className="mt-2 text-[12px] text-slate-600">Có <b>{m.ruleCount}</b> luật đang gán — dùng loại kiểm tra <i>Biến động chỉ tiêu</i> và <i>Chỉ tiêu cha bằng tổng con</i>.</div>
              </>
            ) : (
              <Note tone="warn" title="Chưa có luật chất lượng">
                GĐ3 mục 3 yêu cầu áp luật chất lượng cho cả <b>báo cáo và chỉ tiêu</b>, không chỉ bảng và cột.
              </Note>
            )}
            <ActionButton variant="soft" className="mt-3" to={`/quality/assign?object=${m.id}`}>Gán luật cho chỉ tiêu</ActionButton>
          </Panel>

          <Note tone="info" title="Vì sao chỉ tiêu tách khỏi thuật ngữ">
            <b>Thuật ngữ</b> (menu 2.1) trả lời <i>"khái niệm này nghĩa là gì"</i> — dùng chung toàn công ty.
            <b> Chỉ tiêu</b> trả lời <i>"con số này tính thế nào trong báo cáo cụ thể nào"</i> — có công thức, điều kiện lọc, bảng nguồn.
            Một thuật ngữ có thể sinh ra nhiều chỉ tiêu khác nhau tuỳ phạm vi.
          </Note>
        </div>
      </div>
    </>
  )
}

/* ═════════ Form tạo báo cáo / chỉ tiêu ═════════ */

export function ReportCreate() {
  const save = useDemoSave('/catalog/reports')
  const [step, setStep] = useState(0)
  const [f, setF] = useState({ name: '', desc: '', purpose: '', unit: '', owner: '', tool: 'Power BI', output: 'Màn hình', freq: 'Hằng ngày', ready: '', conf: 'Nội bộ' })
  const [picked, setPicked] = useState<string[]>([])
  const [srcs, setSrcs] = useState<string[]>([])
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }))
  const ok = f.name && f.desc && f.purpose && f.unit && f.owner && picked.length && srcs.length

  return (
    <>
      <PageHeader
        code="1.3"
        title="Thêm báo cáo"
        desc="Bộ 8 nhóm trường theo tiêu chuẩn GĐ2 mục 5.5"
        crumbs={[{ label: 'Data Catalog' }, { label: 'Báo cáo & Chỉ tiêu', href: '/catalog/reports' }, { label: 'Thêm báo cáo' }]}
      />
      <Steps items={['Thông tin chung', 'Chỉ tiêu thể hiện', 'Nguồn dữ liệu', 'Phát hành & Xem lại']} current={step} onJump={setStep} />

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title={['Thông tin chung', 'Chọn chỉ tiêu thể hiện trong báo cáo', 'Bảng nguồn phục vụ tính toán', 'Phát hành và xem lại'][step]}>
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tên báo cáo" required full><TextInput value={f.name} onChange={set('name')} placeholder="Báo cáo doanh thu ngày" /></Field>
              <Field label="Mô tả" required full><TextArea rows={2} value={f.desc} onChange={set('desc')} /></Field>
              <Field label="Mục đích sử dụng" required full><TextArea rows={2} value={f.purpose} onChange={set('purpose')} placeholder="Theo dõi kết quả kinh doanh hằng ngày phục vụ điều hành" /></Field>
              <Field label="Đơn vị sở hữu" required>
                <SelectInput value={f.unit} onChange={set('unit')}>
                  <option value="">— Chọn —</option>
                  {ORG_UNITS.map(u => <option key={u}>{u}</option>)}
                </SelectInput>
              </Field>
              <Field label="Người phụ trách" required>
                <SelectInput value={f.owner} onChange={set('owner')}>
                  <option value="">— Chọn —</option>
                  {usersByRole().map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </SelectInput>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div>
              <Note tone="info" className="mb-3">Chọn các chỉ tiêu sẽ xuất hiện trong báo cáo. Chỉ tiêu chưa có thì tạo ở màn riêng rồi quay lại.</Note>
              <div className="space-y-1.5">
                {metrics.map(m => (
                  <label key={m.id} className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition ${picked.includes(m.id) ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input
                      type="checkbox"
                      checked={picked.includes(m.id)}
                      onChange={() => setPicked(p => (p.includes(m.id) ? p.filter(x => x !== m.id) : [...p, m.id]))}
                      className="mt-1"
                    />
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-semibold text-slate-800">{m.id} — {m.name}</span>
                      <span className="block text-[11px] text-slate-500">{m.definition}</span>
                      <span className="mono block text-[10.5px] text-slate-400">{m.formula}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <Note tone="warn" className="mb-3">
                Chỉ chọn được bảng <b>đã có trong danh mục</b> (ràng buộc RB2). Bảng chưa khai thì phải khai ở menu 1.1 trước.
              </Note>
              <div className="max-h-[380px] space-y-1.5 overflow-y-auto">
                {[...new Set(picked.flatMap(p => metricById(p)?.sourceTables ?? []))].concat(
                  ['dwh.giao_dich_thanh_toan', 'mart.doanh_thu_ngay', 'bi.doi_soat_giao_dich_A'].filter(t => !picked.length)
                ).map(t => {
                  const tb = tableById(t)
                  return (
                    <label key={t} className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 transition ${srcs.includes(t) ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}>
                      <span className="flex items-center gap-2.5">
                        <input type="checkbox" checked={srcs.includes(t)} onChange={() => setSrcs(p => (p.includes(t) ? p.filter(x => x !== t) : [...p, t]))} />
                        <span>
                          <span className="mono block text-[12px] font-semibold">{t}</span>
                          <span className="block text-[11px] text-slate-500">{tb?.name ?? 'Bảng nguồn'}</span>
                        </span>
                      </span>
                      {tb && <Chip tone={(tb.qualityScore ?? 0) >= 85 ? 'g' : 'o'}>CL {tb.qualityScore ?? '—'}</Chip>}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Công cụ dựng báo cáo" required>
                <SelectInput value={f.tool} onChange={set('tool')}>{BI_TOOLS.map(t => <option key={t}>{t}</option>)}</SelectInput>
              </Field>
              <Field label="Hình thức đầu ra" required>
                <SelectInput value={f.output} onChange={set('output')}>{REPORT_OUTPUTS.map(t => <option key={t}>{t}</option>)}</SelectInput>
              </Field>
              <Field label="Tần suất cập nhật" required>
                <SelectInput value={f.freq} onChange={set('freq')}>{REPORT_FREQUENCIES.map(t => <option key={t}>{t}</option>)}</SelectInput>
              </Field>
              <Field label="Thời gian dữ liệu sẵn sàng" info="report.readyBy" required hint="Dùng để sinh luật kiểm tra kịp thời ở menu 3.2">
                <TextInput value={f.ready} onChange={set('ready')} placeholder="Trước 08:00" />
              </Field>
              <Field label="Mức phân loại" required>
                <SelectInput value={f.conf} onChange={set('conf')}>{CONFIDENTIALITY_NAMES.map(t => <option key={t}>{t}</option>)}</SelectInput>
              </Field>
              <div className="col-span-full">
                <Note tone={ok ? 'ok' : 'warn'} title={ok ? 'Đủ điều kiện gửi duyệt' : 'Còn thiếu thông tin bắt buộc'}>
                  {ok
                    ? `Báo cáo có ${picked.length} chỉ tiêu và ${srcs.length} bảng nguồn — đủ để truy vết tới nguồn.`
                    : 'Phải chọn tối thiểu 1 chỉ tiêu và 1 bảng nguồn, nếu không báo cáo sẽ không truy vết được.'}
                </Note>
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Xem trước hồ sơ báo cáo">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-[13px] font-bold text-slate-800">{f.name || 'chưa đặt tên'}</div>
            <div className="mt-0.5 text-[11.5px] text-slate-500">{f.desc || 'chưa có mô tả'}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              <Chip tone="t">{f.tool}</Chip>
              <Chip tone="n">{f.output}</Chip>
              <Chip tone="b">{f.freq}</Chip>
              <Chip tone={f.conf === 'Hạn chế truy cập' ? 'r' : f.conf === 'Mật' ? 'o' : 'b'}>{f.conf}</Chip>
            </div>
            <div className="mt-3 text-[11px] font-semibold uppercase text-slate-400">Chỉ tiêu ({picked.length})</div>
            <div className="mt-1 flex flex-wrap gap-1">{picked.map(p => <Chip key={p} tone="p">{p}</Chip>)}</div>
            <div className="mt-2 text-[11px] font-semibold uppercase text-slate-400">Bảng nguồn ({srcs.length})</div>
            <div className="mt-1 flex flex-wrap gap-1">{srcs.map(s => <Chip key={s} tone="b">{s}</Chip>)}</div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/catalog/reports">Huỷ</ActionButton>
        <div className="flex gap-2">
          {step > 0 && <ActionButton variant="ghost" onClick={() => setStep(s => s - 1)}>Quay lại</ActionButton>}
          {step < 3
            ? <ActionButton onClick={() => setStep(s => s + 1)}>Tiếp tục</ActionButton>
            : <ActionButton disabled={!ok} onClick={() => save('Đã gửi phê duyệt báo cáo mới')}>Gửi phê duyệt</ActionButton>}
        </div>
      </div>
    </>
  )
}

export function MetricCreate() {
  const save = useDemoSave('/catalog/reports')
  const [f, setF] = useState({ name: '', unit: '', definition: '', formula: '', aggregation: '', filterRule: '', glossaryId: '', owner: '' })
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }))
  const ok = f.name && f.unit && f.definition && f.formula && f.owner

  return (
    <>
      <PageHeader
        code="1.3"
        title="Thêm chỉ tiêu"
        desc="Chỉ tiêu phải có định nghĩa và công thức tính rõ ràng, kiểm tra lại được (GĐ2 mục 5.5)"
        crumbs={[{ label: 'Data Catalog' }, { label: 'Báo cáo & Chỉ tiêu', href: '/catalog/reports' }, { label: 'Thêm chỉ tiêu' }]}
      />

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title="Thông tin chỉ tiêu">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tên chỉ tiêu" required><TextInput value={f.name} onChange={set('name')} placeholder="Doanh thu ghi nhận" /></Field>
            <Field label="Đơn vị tính" required><TextInput value={f.unit} onChange={set('unit')} placeholder="VND / % / khách hàng" /></Field>
            <Field label="Định nghĩa" required full hint="Viết đủ để người khác hiểu và tính lại ra cùng con số">
              <TextArea rows={3} value={f.definition} onChange={set('definition')} />
            </Field>
            <Field label="Công thức tính" info="metric.formula" required full>
              <TextArea rows={3} className="mono" value={f.formula} onChange={set('formula')} placeholder="SUM(mart.doanh_thu_ngay.doanh_thu) WHERE ngay BETWEEN :tu AND :den" />
            </Field>
            <Field label="Điều kiện lấy dữ liệu" info="metric.filterRule" full><TextInput value={f.filterRule} onChange={set('filterRule')} placeholder="Loại trừ giao dịch hoàn tiền và điều chỉnh" /></Field>
            <Field label="Quy tắc tổng hợp" full><TextInput value={f.aggregation} onChange={set('aggregation')} placeholder="Tổng theo ngày → tháng → quý" /></Field>
            <Field label="Thuật ngữ nghiệp vụ liên kết" hint="Gắn để thống nhất cách hiểu giữa các đơn vị">
              <SelectInput value={f.glossaryId} onChange={set('glossaryId')}>
                <option value="">— Chưa gắn —</option>
                {glossaryTerms.filter(g => g.approval === 'Đã phê duyệt').map(g => <option key={g.id} value={g.id}>{g.id} — {g.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="Người phụ trách" required>
              <SelectInput value={f.owner} onChange={set('owner')}>
                <option value="">— Chọn —</option>
                {usersByRole('Đầu mối nghiệp vụ').map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </SelectInput>
            </Field>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Xem trước công thức">
            <CodeBlock dark>{f.formula || '-- chưa nhập công thức'}</CodeBlock>
          </Panel>
          <Note tone="info" title="Chỉ tiêu tốt cần đạt 3 điều">
            <ol className="ml-4 list-decimal space-y-1">
              <li>Người khác đọc định nghĩa là tính ra <b>cùng một con số</b>.</li>
              <li>Có <b>bảng nguồn cụ thể</b>, không nói chung chung "lấy từ kho dữ liệu".</li>
              <li>Nêu rõ <b>cái gì bị loại trừ</b> — đây là chỗ hay lệch số nhất giữa các đơn vị.</li>
            </ol>
          </Note>
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/catalog/reports">Huỷ</ActionButton>
        <ActionButton disabled={!ok} onClick={() => save('Đã gửi phê duyệt chỉ tiêu mới')}>Gửi phê duyệt</ActionButton>
      </div>
    </>
  )
}
