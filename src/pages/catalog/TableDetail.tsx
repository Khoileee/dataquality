import { useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import {
  PageHeader, RouteTabs, Panel, KpiRow, DataTable, Chip, StatusChip, TierChip, Note,
  ActionButton, InfoGrid, EntityLink, MiniBars, ProgressBar, Timeline, Modal, Drawer,
  FlowDiagram, SectionTitle, useToast, DimensionChip, IconBtn, RowActions, EmptyState,
} from '@/components/common'
import {
  tableById, columnsOf, domainName, systemById, rulesOf, glossaryById, tagById,
  lineageEdges, reportById, metricById, policies, auditLog, jobById, fmt, profilesOf,
} from '@/data'
import type { FlowNode, FlowEdge } from '@/components/common/Viz'
import { Profiling } from '@/pages/quality/Misc'

export function TableDetail() {
  const { id = '' } = useParams()
  const { pathname } = useLocation()
  const tableId = decodeURIComponent(id)
  const t = tableById(tableId)

  if (!t) {
    return (
      <>
        <PageHeader title="Không tìm thấy bảng" crumbs={[{ label: 'Data Catalog' }, { label: 'Bảng dữ liệu', href: '/catalog/tables' }]} />
        <EmptyState text={`Bảng "${tableId}" chưa có trong danh mục.`} action={<ActionButton to="/catalog/tables">Về danh sách bảng</ActionButton>} />
      </>
    )
  }

  const base = `/catalog/tables/${encodeURIComponent(tableId)}`
  const tab = pathname.replace(base, '').replace('/', '') || 'overview'
  const cols = columnsOf(tableId)
  const rules = rulesOf(tableId)

  return (
    <>
      <PageHeader
        code="1.1"
        title={<span className="mono">{tableId}</span>}
        desc={`${t.name} · Người sở hữu: ${t.dataOwner ?? '— chưa có'} · BDA: ${t.bda ?? '—'} · DE: ${t.de ?? '—'} · Miền: ${domainName(t.domain) ?? '— chưa gán'}`}
        crumbs={[{ label: 'Data Catalog' }, { label: 'Bảng dữ liệu', href: '/catalog/tables' }, { label: tableId }]}
        actions={
          <>
            <Chip tone={t.confidentiality === 'Hạn chế truy cập' ? 'r' : t.confidentiality === 'Mật' ? 'o' : 'b'}>{t.confidentiality}</Chip>
            <TierChip tier={t.tier} />
            <StatusChip value={t.approval} />
            <ActionButton variant="ghost" icon="export">Xuất metadata</ActionButton>
            <ActionButton variant="ghost" icon="edit" to={`/catalog/tables/create?id=${encodeURIComponent(tableId)}`}>Sửa</ActionButton>
          </>
        }
      />

      <RouteTabs
        items={[
          { label: 'Tổng quan', to: base, end: true },
          { label: 'Cột', to: `${base}/columns`, badge: cols.length },
          { label: 'Chất lượng', to: `${base}/quality`, badge: rules.length },
          { label: 'Nguồn gốc', to: `${base}/lineage` },
          { label: 'Quyền', to: `${base}/permissions` },
          { label: 'Lịch sử', to: `${base}/history` },
        ]}
      />

      {tab === 'overview' && <TabOverview t={t} />}
      {tab === 'columns' && <TabColumns t={t} />}
      {tab === 'quality' && <TabQuality t={t} />}
      {tab === 'lineage' && <TabLineage t={t} />}
      {tab === 'permissions' && <TabPerm t={t} />}
      {tab === 'history' && <TabHistory t={t} />}
    </>
  )
}

/* ─────────── Tab Tổng quan ─────────── */

function TabOverview({ t }: { t: any }) {
  const sys = systemById(t.systemId)
  return (
    <>
      <KpiRow
        items={[
          { label: 'Độ tươi', value: t.freshness, sub: t.syncFrequency, tone: t.freshnessOk ? 'ok' : 'bad' },
          { label: 'Số dòng', value: fmt(t.rows), sub: `${t.sizeGb} GB · ${t.format}` },
          { label: 'Luật chất lượng', value: t.ruleCount, sub: t.qualityScore === null ? 'chưa chấm điểm' : `điểm ${t.qualityScore}/100`, tone: t.ruleCount ? 'ok' : 'bad' },
          { label: 'Lượt dùng / tuần', value: fmt(t.usageWeek), sub: `${t.consumerReports.length} báo cáo dùng` },
          { label: 'Cột nhạy cảm', value: t.sensitiveColumnCount, sub: t.sensitiveColumnCount ? 'chưa có chính sách che' : 'không có', tone: t.sensitiveColumnCount ? 'bad' : 'ok' },
        ]}
      />

      <div className="mt-4 grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4">
          <Panel title="Thông tin nghiệp vụ">
            <p className="mb-3 text-[13px] leading-relaxed text-slate-700">{t.description}</p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {t.domain && <Chip tone="t">{domainName(t.domain)}</Chip>}
              <TierChip tier={t.tier} />
              <Chip tone={t.confidentiality === 'Hạn chế truy cập' ? 'r' : t.confidentiality === 'Mật' ? 'o' : 'b'}>{t.confidentiality}</Chip>
              <Chip tone="n">{t.zone}</Chip>
              <Chip tone="n">{t.format}</Chip>
              <StatusChip value={t.lifecycle} />
            </div>
            <SectionTitle>Thông tin kỹ thuật</SectionTitle>
            <InfoGrid
              items={[
                { label: 'Hệ thống lưu trữ', value: sys ? <EntityLink to={`/catalog/systems/${sys.id}`} mono={false}>{sys.name}</EntityLink> : '—' },
                { label: 'Công nghệ', value: sys?.tech },
                { label: 'Chu kỳ cập nhật', value: t.syncFrequency },
                { label: 'Cập nhật lần cuối', value: `${t.updatedAt} · ${t.updatedBy}` },
                { label: 'Sinh ra bởi', value: t.producedByJob ? <EntityLink to={`/orchestration/jobs/${t.producedByJob}`}>{t.producedByJob}</EntityLink> : t.producedByIngest ? <EntityLink to={`/ingestion/templates/${t.producedByIngest}`}>{t.producedByIngest}</EntityLink> : '— không xác định' },
                { label: 'Số cột đã khai', value: `${t.columnCount} cột` },
              ]}
            />
          </Panel>

          <Panel title="Hệ thống và báo cáo đang tiêu thụ dữ liệu này">
            {t.consumerReports.length || t.downstreamTables.length ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase text-slate-400">Báo cáo / Chỉ tiêu</div>
                  <div className="space-y-1.5">
                    {t.consumerReports.map((r: string) => {
                      const rep = reportById(r)
                      return (
                        <div key={r} className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-1.5">
                          <EntityLink to={`/catalog/reports/${r}`} mono={false}>{rep?.name ?? r}</EntityLink>
                          <Chip tone="n">{rep?.frequency ?? '—'}</Chip>
                        </div>
                      )
                    })}
                    {!t.consumerReports.length && <span className="text-[12px] text-slate-400">Không có</span>}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase text-slate-400">Bảng hạ nguồn</div>
                  <div className="space-y-1.5">
                    {t.downstreamTables.map((d: string) => (
                      <div key={d} className="rounded-lg border border-slate-200 px-2.5 py-1.5">
                        <EntityLink to={`/catalog/tables/${encodeURIComponent(d)}`}>{d}</EntityLink>
                      </div>
                    ))}
                    {!t.downstreamTables.length && <span className="text-[12px] text-slate-400">Không có</span>}
                  </div>
                </div>
              </div>
            ) : (
              <Note tone="warn" title="Chưa xác định được nơi tiêu thụ">
                Bảng này chưa có báo cáo hoặc bảng hạ nguồn nào được ghi nhận. Nếu thực tế có dùng, hãy khai báo quan hệ thủ công tại menu 2.3.
              </Note>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Người chịu trách nhiệm">
            <div className="space-y-2">
              {[
                { role: 'Người sở hữu dữ liệu', name: t.dataOwner, note: 'Phê duyệt định nghĩa và cấp quyền' },
                { role: 'Đầu mối nghiệp vụ', name: t.bda, note: 'Cập nhật mô tả, thuật ngữ, quy tắc' },
                { role: 'Đầu mối kỹ thuật', name: t.de, note: 'Cập nhật cấu trúc, nguồn, job' },
              ].map(r => (
                <div key={r.role} className={`rounded-lg border px-3 py-2 ${r.name ? 'border-slate-200' : 'border-red-200 bg-red-50'}`}>
                  <div className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{r.role}</div>
                  <div className={`text-[13px] font-semibold ${r.name ? 'text-slate-800' : 'text-red-600'}`}>{r.name ?? '— chưa gán'}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">{r.note}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Độ hoàn thiện thông tin mô tả">
            <ProgressBar pct={t.metadataScore} target={85} note={`${t.metadataScore}% · mục tiêu 85%`} />
            <div className="mt-3 space-y-1.5 text-[12px]">
              {[
                ['Có mô tả nghiệp vụ', !!t.description],
                ['Đã gán miền dữ liệu', !!t.domain],
                ['Đã gán mức quan trọng', !!t.tier],
                ['Có Người sở hữu dữ liệu', !!t.dataOwner],
                ['Có đủ hai đầu mối', !!t.bda && !!t.de],
                ['Metadata đã được phê duyệt', t.approval === 'Đã phê duyệt'],
                ['Có luật chất lượng', t.ruleCount > 0],
              ].map(([label, ok]) => (
                <div key={label as string} className="flex items-center justify-between">
                  <span className="text-slate-600">{label}</span>
                  <Chip tone={ok ? 'g' : 'r'}>{ok ? 'Đạt' : 'Thiếu'}</Chip>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Hoạt động gần đây">
            <Timeline
              items={[
                { time: t.updatedAt, who: t.updatedBy, title: 'Cập nhật metadata', tone: 'b' },
                { time: '2026-08-09 06:34', who: 'Hệ thống', title: 'Job ghi dữ liệu thành công', text: `${fmt(t.rows)} dòng`, tone: 'g' },
                { time: '2026-08-09 07:15', who: 'Hệ thống', title: 'Chạy 7 luật chất lượng', text: '5 đạt · 2 cảnh báo', tone: 'o' },
              ]}
            />
          </Panel>
        </div>
      </div>
    </>
  )
}

/* ─────────── Tab Cột ─────────── */

function TabColumns({ t }: { t: any }) {
  const cols = columnsOf(t.id)
  const [pick, setPick] = useState<any>(null)

  if (!cols.length) {
    return <EmptyState text="Bảng này chưa khai cột trong dữ liệu minh hoạ." />
  }

  return (
    <>
      <Note tone="info" title="Nguyên tắc NT3 — đo một nơi, hiện nhiều nơi" className="mb-3">
        Các chỉ số <b>% rỗng · số giá trị phân biệt · min/max</b> hiển thị tại đây được đọc lại từ kết quả quét ở menu <b>3.3 Phân tích dữ liệu</b>, không đo lại lần thứ hai.
      </Note>

      <DataTable
        rows={cols}
        rowKey={c => c.name}
        highlightRow={c => (c.tags.some((x: string) => x.startsWith('PII') || x === 'PD_SENSITIVE') ? 'warn' : undefined)}
        columns={[
          { key: 'name', label: 'Tên cột', width: '16%', render: c => <div><div className="mono text-[12.5px] font-semibold text-slate-800">{c.name}</div>{c.isKey && <Chip tone="b" className="mt-0.5">khoá</Chip>}</div> },
          { key: 'type', label: 'Kiểu', nowrap: true, render: c => <span className="mono text-[11.5px] text-slate-500">{c.type}</span> },
          { key: 'desc', label: 'Mô tả', width: '22%', render: c => <span className="text-[12px]">{c.description}</span> },
          {
            key: 'gl', label: 'Thuật ngữ', nowrap: true,
            render: c => c.glossaryId
              ? <EntityLink to={`/governance/glossary/${c.glossaryId}`} mono={false}>{glossaryById(c.glossaryId)?.name}</EntityLink>
              : <span className="text-slate-300">—</span>,
          },
          {
            key: 'tags', label: 'Nhãn', nowrap: true,
            render: c => c.tags.length
              ? <div className="flex gap-1">{c.tags.map((x: string) => (
                  <Link key={x} to={`/governance/classification?tag=${x}`}><Chip tone={x.includes('SENSITIVE') || x === 'PII_PHONE' || x === 'PII_ID' || x === 'PII_ACCOUNT' ? 'r' : 'o'}>{tagById(x)?.name ?? x}</Chip></Link>
                ))}</div>
              : <span className="text-slate-300">—</span>,
          },
          { key: 'conf', label: 'Phân loại', nowrap: true, render: c => <StatusChip value={c.confidentiality} /> },
          { key: 'nullable', label: 'Cho rỗng', align: 'center', nowrap: true, render: c => (c.nullable ? '✓' : '—') },
          { key: 'nullPct', label: '% rỗng', align: 'right', nowrap: true, render: c => <span className={c.nullPct > 10 ? 'font-bold text-red-600' : c.nullPct > 3 ? 'font-semibold text-amber-600' : ''}>{c.nullPct}%</span> },
          { key: 'distinct', label: 'Giá trị phân biệt', align: 'right', nowrap: true, render: c => fmt(c.distinctCount) },
          { key: 'range', label: 'Min / Max', nowrap: true, render: c => <span className="mono text-[11px] text-slate-500">{c.min ?? '—'} / {c.max ?? '—'}</span> },
          { key: 'mask', label: 'Che dữ liệu', nowrap: true, render: c => (c.tags.length ? (c.maskPolicy ? <Chip tone="g">{c.maskPolicy}</Chip> : <Chip tone="r">chưa che</Chip>) : <span className="text-slate-300">—</span>) },
          { key: 'act', label: '', align: 'right', nowrap: true, render: c => <RowActions><IconBtn icon="view" title="Chi tiết cột" onClick={() => setPick(c)} /></RowActions> },
        ]}
      />

      <Drawer open={!!pick} onClose={() => setPick(null)} title={pick && `${t.id}.${pick.name}`} desc={pick?.description}>
        {pick && (
          <div className="space-y-4">
            <InfoGrid
              items={[
                { label: 'Kiểu dữ liệu', value: <span className="mono">{pick.type}</span> },
                { label: 'Cho phép rỗng', value: pick.nullable ? 'Có' : 'Không' },
                { label: 'Là khoá', value: pick.isKey ? 'Có' : 'Không' },
                { label: 'Mức phân loại', value: <StatusChip value={pick.confidentiality} /> },
                { label: 'Thuật ngữ nghiệp vụ', value: pick.glossaryId ? glossaryById(pick.glossaryId)?.name : '— chưa gắn' },
                { label: 'Nhãn dữ liệu nhạy cảm', value: pick.tags.length ? pick.tags.join(', ') : '— không' },
                { label: 'Quy tắc nghiệp vụ', value: pick.businessRule ?? '— chưa khai', full: true },
                { label: 'Tập giá trị hợp lệ', value: pick.valueSet ? pick.valueSet.join(' · ') : '— không giới hạn', full: true },
              ]}
            />
            <SectionTitle>Chỉ số thống kê (từ Profiling)</SectionTitle>
            <InfoGrid
              items={[
                { label: '% rỗng', value: `${pick.nullPct}%` },
                { label: 'Giá trị phân biệt', value: fmt(pick.distinctCount) },
                { label: 'Nhỏ nhất', value: pick.min ?? '—' },
                { label: 'Lớn nhất', value: pick.max ?? '—' },
              ]}
            />
            <div className="flex gap-2">
              <ActionButton variant="soft" to={`/quality/profiling?table=${encodeURIComponent(t.id)}&col=${pick.name}`}>Xem phân tích dữ liệu</ActionButton>
              <ActionButton variant="soft" to={`/quality/assign?table=${encodeURIComponent(t.id)}&col=${pick.name}`}>Gán luật cho cột này</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      <Panel
        title="Phân tích dữ liệu — chỉ số đo của cột"
        desc="Gộp từ menu cũ 3.3. Đây là nơi DUY NHẤT đo; bảng phía trên đọc lại kết quả, không đo lần thứ hai (nguyên tắc NT3)"
      >
        <Profiling embedded tableId={t.id} />
      </Panel>
    </>
  )
}

/* ─────────── Tab Chất lượng ─────────── */

function TabQuality({ t }: { t: any }) {
  const rules = rulesOf(t.id)
  const [pick, setPick] = useState<any>(null)

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] text-slate-500">
          {rules.length ? <>Có <b>{rules.length}</b> luật đang gán cho bảng này · điểm chất lượng <b>{t.qualityScore ?? '—'}</b>/100</> : 'Chưa có luật chất lượng nào'}
        </div>
        <ActionButton icon="plus" to={`/quality/assign?table=${encodeURIComponent(t.id)}`}>Gán luật cho bảng</ActionButton>
      </div>

      {rules.length ? (
        <DataTable
          rows={rules}
          rowKey={r => r.id}
          highlightRow={r => (r.lastResult === 'Không đạt' ? 'bad' : r.lastResult === 'Cảnh báo' ? 'warn' : undefined)}
          columns={[
            { key: 'id', label: 'Mã luật', nowrap: true, render: r => <span className="mono text-[12px] font-semibold">{r.id}</span> },
            { key: 'name', label: 'Loại kiểm tra', width: '20%', render: r => <div><div className="font-semibold text-slate-800">{r.ruleName}</div><div className="text-[11px] text-slate-400">{r.params}</div></div> },
            { key: 'dim', label: 'Chiều', nowrap: true, render: r => <DimensionChip id={r.dimension} /> },
            { key: 'col', label: 'Cột', nowrap: true, render: r => <span className="mono text-[11.5px]">{r.column ?? '(mức bảng)'}</span> },
            { key: 'trig', label: 'Kích hoạt', nowrap: true, render: r => <div><Chip tone={r.trigger === 'Theo sự kiện' ? 'p' : 'n'}>{r.trigger}</Chip><div className="mt-0.5 text-[10.5px] text-slate-400">{r.schedule}</div></div> },
            { key: 'th', label: 'Ngưỡng', nowrap: true, render: r => <div className="text-[11.5px]"><span className="text-amber-600">C {r.warn}%</span> · <span className="text-red-600">NT {r.crit}%</span><div className="text-[10px] text-slate-400">{r.thresholdSource}</div></div> },
            { key: 'score', label: 'Điểm', align: 'right', nowrap: true, render: r => <span className={r.lastScore >= r.warn ? 'font-bold text-emerald-600' : r.lastScore >= r.crit ? 'font-bold text-amber-600' : 'font-bold text-red-600'}>{r.lastScore}</span> },
            { key: 'trend', label: 'Xu hướng 7 ngày', nowrap: true, render: r => <MiniBars values={r.trend} threshold={r.crit} /> },
            { key: 'res', label: 'Kết quả', nowrap: true, render: r => <StatusChip value={r.lastResult} /> },
            { key: 'block', label: 'Chặn hạ nguồn', align: 'center', nowrap: true, render: r => (r.blockDownstream ? <Chip tone="r">có</Chip> : <span className="text-slate-300">—</span>) },
            { key: 'act', label: '', align: 'right', nowrap: true, render: r => <RowActions><IconBtn icon="view" title="Chi tiết" onClick={() => setPick(r)} /></RowActions> },
          ]}
        />
      ) : (
        <EmptyState
          text="Bảng này chưa được kiểm tra chất lượng — nằm trong 99,4% số bảng chưa có luật."
          action={<ActionButton icon="plus" to={`/quality/assign?table=${encodeURIComponent(t.id)}`}>Gán luật ngay</ActionButton>}
        />
      )}

      <Drawer open={!!pick} onClose={() => setPick(null)} title={pick?.ruleName} desc={pick && `${pick.id} · ${pick.objectLabel}${pick.column ? '.' + pick.column : ''}`}>
        {pick && (
          <div className="space-y-4">
            <InfoGrid
              items={[
                { label: 'Chiều chất lượng', value: <DimensionChip id={pick.dimension} /> },
                { label: 'Mức độ nghiêm trọng', value: <StatusChip value={pick.severity} /> },
                { label: 'Tham số', value: <span className="mono text-[12px]">{pick.params}</span>, full: true },
                { label: 'Ngưỡng cảnh báo', value: `${pick.warn}%` },
                { label: 'Ngưỡng nghiêm trọng', value: `${pick.crit}%` },
                { label: 'Nguồn ngưỡng', value: pick.thresholdSource },
                { label: 'Kích hoạt', value: `${pick.trigger} — ${pick.schedule}` },
                { label: 'Lần chạy gần nhất', value: pick.lastRun },
                { label: 'Kết quả', value: <StatusChip value={pick.lastResult} /> },
                { label: 'Số dòng lỗi', value: `${fmt(pick.failedRows)} / ${fmt(pick.totalRows)}` },
                { label: 'Chặn job hạ nguồn', value: pick.blockDownstream ? 'Có' : 'Không' },
              ]}
            />
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase text-slate-400">Xu hướng 7 ngày</div>
              <MiniBars values={pick.trend} threshold={pick.crit} height={40} />
            </div>
          </div>
        )}
      </Drawer>
    </>
  )
}

/* ─────────── Tab Nguồn gốc ─────────── */

function TabLineage({ t }: { t: any }) {
  const [impact, setImpact] = useState(false)
  const toast = useToast()

  const upstream = lineageEdges.filter(e => e.to === t.id)
  const downstream = lineageEdges.filter(e => e.from === t.id)

  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []

  upstream.forEach((e, i) => {
    nodes.push({
      id: e.from, x: 20, y: 30 + i * 84, w: 180, h: 50, title: e.from, sub: e.fromType,
      tone: 'source', to: e.fromType === 'Bảng' ? `/catalog/tables/${encodeURIComponent(e.from)}` : e.fromType === 'Kênh' ? `/catalog/channels/${e.from}` : undefined,
    })
    if (e.viaJob) {
      const jid = `job-${e.viaJob}-${i}`
      nodes.push({ id: jid, x: 240, y: 30 + i * 84, w: 150, h: 50, title: e.viaJob, sub: jobById(e.viaJob)?.name ?? 'Job xử lý', tone: 'neutral', to: `/orchestration/jobs/${e.viaJob}` })
      edges.push({ from: e.from, to: jid })
      edges.push({ from: jid, to: 'CENTER' })
    } else {
      edges.push({ from: e.from, to: 'CENTER', label: e.source === 'Khai báo thủ công' ? 'khai tay' : undefined, dashed: e.source === 'Khai báo thủ công' })
    }
  })

  const centerY = Math.max(30, 20 + Math.max(upstream.length, 1) * 42)
  nodes.push({
    id: 'CENTER', x: 430, y: centerY, w: 210, h: 72,
    title: t.id, sub: `${t.name} · ${fmt(t.rows)} dòng`, tone: 'active',
    badge: { text: t.qualityScore ? `Chất lượng ${t.qualityScore}` : 'Chưa kiểm', tone: t.qualityScore && t.qualityScore >= 85 ? 'g' : t.qualityScore ? 'o' : 'n' },
  })

  const downTargets = [
    ...downstream.map(e => ({ id: e.to, type: e.toType, via: e.viaJob })),
    ...t.consumerReports.filter((r: string) => !downstream.some(e => e.to === r)).map((r: string) => ({ id: r, type: 'Báo cáo' as const, via: null })),
  ]
  downTargets.forEach((d, i) => {
    const to = d.type === 'Bảng' ? `/catalog/tables/${encodeURIComponent(d.id)}`
      : d.type === 'Báo cáo' ? `/catalog/reports/${d.id}`
      : d.type === 'Chỉ tiêu' ? `/catalog/reports/metrics/${d.id}` : undefined
    const label = d.type === 'Báo cáo' ? (reportById(d.id)?.name ?? d.id) : d.type === 'Chỉ tiêu' ? (metricById(d.id)?.name ?? d.id) : d.id
    nodes.push({ id: `d-${d.id}`, x: 700, y: 20 + i * 62, w: 200, h: 50, title: label, sub: d.type, tone: d.type === 'Báo cáo' || d.type === 'Chỉ tiêu' ? 'target' : 'neutral', to })
    edges.push({ from: 'CENTER', to: `d-${d.id}`, tone: 'neutral' })
  })

  const height = Math.max(220, 50 + Math.max(upstream.length * 84, downTargets.length * 62))

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] text-slate-500">
          <b>{upstream.length}</b> nguồn đầu vào · <b>{downTargets.length}</b> đối tượng sử dụng đầu ra
        </div>
        <div className="flex gap-2">
          <ActionButton variant="ghost" to={`/governance/lineage/create?to=${encodeURIComponent(t.id)}`}>Khai báo quan hệ thủ công</ActionButton>
          <ActionButton onClick={() => setImpact(true)}>Phân tích ảnh hưởng</ActionButton>
        </div>
      </div>

      <FlowDiagram nodes={nodes} edges={edges} height={height} width={900} />

      <div className="mt-4 grid grid-cols-2 gap-4 items-start">
        <Panel title="Quan hệ đầu vào (upstream)">
          <DataTable
            dense
            rows={upstream}
            rowKey={e => e.id}
            empty="Không có quan hệ đầu vào được ghi nhận"
            columns={[
              { key: 'from', label: 'Nguồn', render: e => <span className="mono text-[12px]">{e.from}</span> },
              { key: 'via', label: 'Qua job', nowrap: true, render: e => (e.viaJob ? <EntityLink to={`/orchestration/jobs/${e.viaJob}`}>{e.viaJob}</EntityLink> : '—') },
              { key: 'level', label: 'Mức', nowrap: true, render: e => <Chip tone="n">{e.level}</Chip> },
              { key: 'src', label: 'Nguồn thu thập', render: e => <Chip tone={e.source === 'Khai báo thủ công' ? 'o' : 'g'}>{e.source}</Chip> },
            ]}
          />
        </Panel>
        <Panel title="Quan hệ đầu ra (downstream)">
          <DataTable
            dense
            rows={downstream}
            rowKey={e => e.id}
            empty="Không có quan hệ đầu ra được ghi nhận"
            columns={[
              { key: 'to', label: 'Đích', render: e => <span className="mono text-[12px]">{e.to}</span> },
              { key: 'type', label: 'Loại', nowrap: true, render: e => <Chip tone="t">{e.toType}</Chip> },
              { key: 'trans', label: 'Bước biến đổi', render: e => <span className="text-[11.5px]">{e.transform}</span> },
            ]}
          />
        </Panel>
      </div>

      <Modal
        open={impact}
        onClose={() => setImpact(false)}
        size="lg"
        title={`Phân tích ảnh hưởng — ${t.id}`}
        desc="Nếu bảng này hỏng hoặc thay đổi cấu trúc, những đối tượng và người dùng sau sẽ bị ảnh hưởng"
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setImpact(false)}>Đóng</ActionButton>
            <ActionButton icon="export" onClick={() => { setImpact(false); toast.info('Xuất danh sách người cần báo', 'File CSV gồm 184 người dùng — minh hoạ.') }}>
              Xuất danh sách người cần báo
            </ActionButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { l: 'Bảng hạ nguồn', v: t.downstreamTables.length, tone: 'warn' as const },
              { l: 'Báo cáo bị ảnh hưởng', v: t.consumerReports.length, tone: 'bad' as const },
              { l: 'Chỉ tiêu bị ảnh hưởng', v: downstream.filter(e => e.toType === 'Chỉ tiêu').length + 2, tone: 'bad' as const },
              { l: 'Người dùng bị ảnh hưởng', v: 184, tone: 'warn' as const },
            ].map(k => (
              <div key={k.l} className="rounded-lg border border-slate-200 px-3 py-2">
                <div className="text-[10.5px] font-bold uppercase text-slate-400">{k.l}</div>
                <div className={`text-[21px] font-extrabold ${k.tone === 'bad' ? 'text-red-600' : 'text-amber-600'}`}>{k.v}</div>
              </div>
            ))}
          </div>

          <SectionTitle>Báo cáo và chỉ tiêu sẽ sai số liệu</SectionTitle>
          <DataTable
            dense
            rows={t.consumerReports.map((r: string) => {
              const rep = reportById(r)
              return {
                id: r, name: rep?.name ?? r, unit: rep?.ownerUnit ?? '—',
                freq: rep?.frequency ?? '—', ready: rep?.readyBy ?? '—', audience: rep?.audience.join(', ') ?? '—',
              }
            })}
            rowKey={r => r.id}
            columns={[
              { key: 'id', label: 'Mã', nowrap: true, render: r => <EntityLink to={`/catalog/reports/${r.id}`}>{r.id}</EntityLink> },
              { key: 'name', label: 'Tên báo cáo' },
              { key: 'unit', label: 'Đơn vị sở hữu', nowrap: true },
              { key: 'freq', label: 'Tần suất', nowrap: true },
              { key: 'ready', label: 'Giờ cam kết', nowrap: true },
              { key: 'audience', label: 'Đối tượng sử dụng' },
            ]}
          />

          <Note tone="bad" title="Trước khi thay đổi bảng này, phải làm gì">
            Gửi thông báo cho <b>{t.consumerReports.length} đơn vị sở hữu báo cáo</b> và <b>184 người dùng đang có quyền</b> ít nhất 5 ngày làm việc;
            kiểm tra lại toàn bộ <b>{t.ruleCount} luật chất lượng</b> đang gán; và cập nhật quan hệ luồng dữ liệu tại menu 2.3.
          </Note>
        </div>
      </Modal>
    </>
  )
}

/* ─────────── Tab Quyền ─────────── */

function TabPerm({ t }: { t: any }) {
  const rel = policies.filter(p =>
    p.scope === t.id || p.scope.includes(t.id) ||
    (p.scopeLevel === 'Nhóm bảng' && t.id.startsWith('bi.')) ||
    p.scopeLevel === 'Toàn hệ thống'
  )
  const sensitiveCols = columnsOf(t.id).filter(c => c.tags.length)

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] text-slate-500"><b>{rel.length}</b> chính sách đang áp lên bảng này</div>
        <div className="flex gap-2">
          <ActionButton variant="ghost" to="/security/report">Tra quyền theo người dùng</ActionButton>
          <ActionButton icon="plus" to="/security/policies/mask/create">Thêm chính sách che</ActionButton>
        </div>
      </div>

      <DataTable
        rows={rel}
        rowKey={p => p.id}
        columns={[
          { key: 'id', label: 'Mã', nowrap: true, render: p => <span className="mono text-[12px]">{p.id}</span> },
          { key: 'subject', label: 'Đối tượng được cấp', width: '20%' },
          { key: 'kind', label: 'Loại chính sách', nowrap: true, render: p => <Chip tone={p.kind === 'Che dữ liệu' ? 'p' : p.kind === 'Lọc theo dòng' ? 't' : p.kind === 'Hạn chế tải xuống' ? 'o' : 'b'}>{p.kind}</Chip> },
          { key: 'scopeLevel', label: 'Phạm vi', nowrap: true, render: p => <div><Chip tone="n">{p.scopeLevel}</Chip><div className="mt-0.5 text-[11px] text-slate-500">{p.scope}</div></div> },
          { key: 'right', label: 'Quyền', nowrap: true },
          { key: 'mask', label: 'Che dữ liệu', nowrap: true, render: p => (p.maskType ? <Chip tone="p">{p.maskType}</Chip> : <span className="text-slate-300">—</span>) },
          { key: 'expiry', label: 'Thời hạn', nowrap: true, render: p => <span className={p.expiry === 'Vô thời hạn' ? 'font-semibold text-red-600' : ''}>{p.expiry}</span> },
          { key: 'source', label: 'Nguồn chính sách', nowrap: true, render: p => (p.sourceRef ? <EntityLink to={`/security/requests/${p.sourceRef}`}>{p.sourceRef}</EntityLink> : <Chip tone="n">{p.source}</Chip>) },
        ]}
      />

      {!!sensitiveCols.length && (
        <div className="mt-4">
          <Note tone="bad" title={`${sensitiveCols.length} cột nhạy cảm trong bảng này chưa có chính sách che`}>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {sensitiveCols.map(c => (
                <Chip key={c.name} tone="r" title={c.description}>{c.name} · {c.tags.join(', ')}</Chip>
              ))}
            </div>
            <div className="mt-2">Người có quyền đọc bảng đang thấy <b>nguyên giá trị</b> của các cột này.</div>
          </Note>
        </div>
      )}
    </>
  )
}

/* ─────────── Tab Lịch sử ─────────── */

function TabHistory({ t }: { t: any }) {
  const rows = auditLog.filter(a => a.objectId === t.id || a.objectId.startsWith(t.id))
  return (
    <>
      <Panel title="Lịch sử thay đổi thông tin mô tả" className="mb-4">
        <DataTable
          dense
          rows={[
            { at: '2026-08-08 11:20', by: 'Nguyễn Thị Phương', field: 'Mô tả nghiệp vụ', before: 'Bang doi soat giao dich', after: t.description, ip: '10.24.18.44' },
            { at: '2026-05-10 15:44', by: 'Nguyễn Thị Phương', field: 'Mức quan trọng', before: 'Tier 2', after: t.tier ?? '—', ip: '10.24.18.44' },
            { at: '2026-05-10 15:44', by: 'Nguyễn Thị Phương', field: 'Chu kỳ cập nhật', before: 'Hằng ngày', after: t.syncFrequency, ip: '10.24.18.44' },
            { at: '2026-02-18 10:12', by: 'Trần Văn Hùng', field: 'Định dạng lưu trữ', before: 'Parquet', after: t.format, ip: '10.24.11.8' },
            { at: '2025-11-04 09:02', by: 'Trần Văn Hùng', field: 'Đầu mối kỹ thuật', before: '—', after: t.de ?? '—', ip: '10.24.11.8' },
          ]}
          columns={[
            { key: 'at', label: 'Thời điểm', nowrap: true, render: r => <span className="mono text-[11.5px]">{r.at}</span> },
            { key: 'by', label: 'Người thay đổi', nowrap: true },
            { key: 'field', label: 'Trường thông tin', nowrap: true, render: r => <span className="font-semibold">{r.field}</span> },
            { key: 'before', label: 'Giá trị cũ', render: r => <span className="text-red-600 line-through">{r.before}</span> },
            { key: 'after', label: 'Giá trị mới', render: r => <span className="text-emerald-700">{r.after}</span> },
            { key: 'ip', label: 'Địa chỉ IP', nowrap: true, render: r => <span className="mono text-[11px] text-slate-500">{r.ip}</span> },
          ]}
        />
      </Panel>

      <Panel title="Nhật ký truy cập gần đây">
        <DataTable
          dense
          rows={rows}
          rowKey={r => r.id}
          empty="Chưa ghi nhận lượt truy cập nào trong khoảng thời gian hiển thị"
          highlightRow={r => (r.result === 'Từ chối' ? 'bad' : r.result === 'Cảnh báo' ? 'warn' : undefined)}
          columns={[
            { key: 'at', label: 'Thời điểm', nowrap: true, render: r => <span className="mono text-[11.5px]">{r.at}</span> },
            { key: 'user', label: 'Người dùng', nowrap: true },
            { key: 'action', label: 'Hành động', nowrap: true, render: r => <Chip tone="n">{r.action}</Chip> },
            { key: 'detail', label: 'Chi tiết' },
            { key: 'rows', label: 'Số dòng', align: 'right', nowrap: true, render: r => fmt(r.rows) },
            { key: 'decidedBy', label: 'Chính sách quyết định', render: r => <span className="text-[11.5px] text-slate-500">{r.decidedBy}</span> },
            { key: 'result', label: 'Kết quả', nowrap: true, render: r => <StatusChip value={r.result === 'Cho phép' ? 'Đạt' : r.result === 'Từ chối' ? 'Từ chối' : 'Cảnh báo'} /> },
          ]}
        />
      </Panel>
    </>
  )
}
