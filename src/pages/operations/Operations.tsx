import { useState } from 'react'
import {
  PageHeader, KpiRow, Panel, Note, Chip, StatusChip, ActionButton, DataTable, InlineTabs,
  EntityLink, InfoGrid, ProgressBar, ScoreRing, Modal, useToast, SectionTitle, IconBtn,
  RowActions, RouteTabs, Field, TextInput, SelectInput, Toggle,
} from '@/components/common'
import {
  healthBars, weakestTables, moduleContribution, phaseProgress, domainHealth,
  connections, tierDefinitions, namingRules, systemParams, STATS, fmt, tableById,
} from '@/data'
import { MENU } from '@/app/menu'
import { useLocation } from 'react-router-dom'
import { MetadataStandard } from '@/pages/governance/Standard'

/* ═════════ 8.1 Sức khoẻ dữ liệu ═════════ */

export function Health() {
  const { pathname } = useLocation()
  const tab = pathname.endsWith('/by-domain') ? 'by-domain' : pathname.endsWith('/progress') ? 'progress' : 'overview'

  return (
    <>
      <PageHeader
        code="8.1"
        title="Sức khoẻ dữ liệu"
        desc="Một màn cho lãnh đạo: dữ liệu công ty đang khoẻ hay yếu, và công tác quản trị dữ liệu tiến tới đâu"
        crumbs={[{ label: 'Operations' }, { label: 'Sức khoẻ dữ liệu' }]}
        actions={<ActionButton variant="ghost" icon="export">Xuất báo cáo lãnh đạo</ActionButton>}
      />

      <RouteTabs
        items={[
          { label: 'Tổng quan', to: '/operations/health', end: true },
          { label: 'Theo miền dữ liệu', to: '/operations/health/by-domain' },
          { label: 'Tiến độ theo giai đoạn', to: '/operations/health/progress' },
        ]}
      />

      {tab === 'overview' && <HealthOverview />}
      {tab === 'by-domain' && <HealthByDomain />}
      {tab === 'progress' && <HealthProgress />}
    </>
  )
}

function HealthOverview() {
  return (
    <>
      <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,2.2fr)] gap-4">
        <Panel tone="dark" className="flex flex-col justify-between">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Điểm chất lượng toàn hệ thống</div>
            <div className="mt-3 flex items-center gap-4">
              <ScoreRing score={STATS.qualityScore} size={104} label="điểm" />
              <div className="text-[12px] leading-relaxed text-slate-300">
                Tính trên <b className="text-white">{STATS.tablesWithQuality}</b> bảng đang có luật chất lượng,
                trung bình 6 chiều theo trọng số mức quan trọng.
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5">
            <div className="text-[12px] font-bold text-red-300">⚠️ Con số này chỉ tính trên 0,6% số bảng</div>
            <div className="mt-1 text-[11.5px] leading-relaxed text-slate-300">
              Còn <b className="text-white">{fmt(STATS.totalTables - STATS.tablesWithQuality)}</b> bảng chưa kiểm tra lần nào —
              không biết tốt hay xấu. Nâng độ phủ là việc quan trọng hơn nâng điểm.
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-3 gap-3">
          {[
            { l: 'Tổng số bảng', v: fmt(STATS.totalTables), s: `${STATS.totalSystems} hệ thống nguồn`, t: 'default' as const },
            { l: 'Bảng chưa có chủ', v: fmt(STATS.tablesNoOwner), s: '66% tổng số bảng', t: 'bad' as const },
            { l: 'Bảng chưa gán miền', v: fmt(STATS.tablesNoDomain), s: '38% tổng số bảng', t: 'bad' as const },
            { l: 'Cột nhạy cảm chưa che', v: `${STATS.sensitiveColumns - STATS.maskedColumns}`, s: `trên ${STATS.sensitiveColumns} cột nhạy cảm`, t: 'bad' as const },
            { l: 'Quyền vô thời hạn', v: fmt(STATS.policiesNoExpiry), s: '87% tổng chính sách', t: 'bad' as const },
            { l: 'Báo cáo truy vết được', v: `${STATS.reportsTraceable}/${STATS.totalReports}`, s: '31% — mục tiêu 80%', t: 'warn' as const },
          ].map(k => (
            <div key={k.l} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{k.l}</div>
              <div className={`mt-1 text-[23px] font-extrabold leading-tight ${k.t === 'bad' ? 'text-red-600' : k.t === 'warn' ? 'text-amber-600' : 'text-slate-900'}`}>{k.v}</div>
              <div className="mt-0.5 text-[11px] text-slate-400">{k.s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4">
          <Panel title="Mười chỉ số quản trị dữ liệu" desc="Vạch đen là mục tiêu đặt ra cho năm 2027">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {healthBars.map(b => (
                <ProgressBar key={b.label} pct={b.pct} target={b.target} label={b.label} note={b.note} />
              ))}
            </div>
          </Panel>

          <Panel title="Bốn bảng yếu nhất đang được dùng nhiều">
            <DataTable
              dense
              rows={weakestTables}
              rowKey={t => t.id}
              highlightRow={() => 'bad'}
              columns={[
                { key: 'id', label: 'Bảng', render: t => <EntityLink to={`/catalog/tables/${encodeURIComponent(t.id)}`}>{t.id}</EntityLink> },
                { key: 'score', label: 'Điểm', align: 'right', nowrap: true, render: t => <span className="font-bold text-red-600">{t.score}</span> },
                { key: 'usageWeek', label: 'Lượt dùng/tuần', align: 'right', nowrap: true, render: t => fmt(t.usageWeek) },
                { key: 'reports', label: 'Báo cáo dùng', align: 'center', nowrap: true },
                { key: 'reason', label: 'Vấn đề chính', width: '40%' },
              ]}
            />
            <Note tone="bad" title="Ưu tiên xử lý theo tích số điểm thấp × lượt dùng cao" className="mt-3">
              <span className="mono">crm.khach_hang</span> điểm 73 nhưng có <b>2.418 lượt dùng/tuần</b> và phục vụ 2 báo cáo —
              đây là bảng cần ưu tiên cải thiện trước, không phải bảng điểm thấp nhất.
            </Note>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Sáu module đóng góp gì cho bức tranh này">
            <DataTable
              dense
              rows={moduleContribution}
              rowKey={m => m.module}
              columns={[
                { key: 'module', label: 'Module', nowrap: true, render: m => <span className="font-semibold">{m.module}</span> },
                { key: 'gives', label: 'Cung cấp dữ liệu gì', render: m => <span className="text-[11px]">{m.gives}</span> },
              ]}
            />
          </Panel>

          <Panel title="Tỷ lệ báo động giả" tone={STATS.falseAlarmPct >= STATS.falseAlarmRedLine ? 'bad' : 'warn'}>
            <ProgressBar
              pct={STATS.falseAlarmPct}
              target={STATS.falseAlarmRedLine}
              label="Cảnh báo bị đóng vì “luật đặt chưa đúng”"
              note={`${STATS.falseAlarmPct}% · ngưỡng đỏ ${STATS.falseAlarmRedLine}%`}
              tone="warn"
            />
            <div className="mt-3 text-[12px] leading-relaxed text-slate-600">
              Vượt ngưỡng đỏ thì người dùng bắt đầu bỏ qua cả cảnh báo thật. Theo dõi chỉ số này quan trọng ngang điểm chất lượng —
              một hệ thống cảnh báo không ai tin thì tương đương không có.
            </div>
          </Panel>

          <Panel title="Điểm tuân thủ">
            <div className="flex items-center gap-4">
              <ScoreRing score={STATS.complianceScore} size={82} label="tuân thủ" />
              <div className="flex-1 text-[12px] leading-relaxed text-slate-600">
                <b>{STATS.openFindings}</b> phát hiện không phù hợp chưa khắc phục từ kỳ đánh giá quý II.
                <ActionButton variant="soft" className="mt-2" to="/compliance/assessments">Xem chi tiết</ActionButton>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

function HealthByDomain() {
  return (
    <>
      <DataTable
        rows={domainHealth}
        rowKey={d => d.domain}
        highlightRow={d => (d.owner === '— không ai' ? 'bad' : d.covered < 50 ? 'warn' : undefined)}
        columns={[
          { key: 'domain', label: 'Miền dữ liệu', width: '18%', render: d => <span className={d.owner === '— không ai' ? 'font-bold text-red-600' : 'font-semibold text-slate-800'}>{d.domain}</span> },
          { key: 'owner', label: 'Người chịu trách nhiệm', nowrap: true, render: d => (d.owner === '— không ai' ? <span className="font-semibold text-red-600">{d.owner}</span> : d.owner) },
          { key: 'tables', label: 'Số bảng', align: 'right', nowrap: true, render: d => fmt(d.tables) },
          { key: 'covered', label: 'Độ phủ metadata', width: '150px', render: d => <ProgressBar pct={d.covered} target={90} height={10} note={`${d.covered}%`} /> },
          { key: 'quality', label: 'Điểm chất lượng', align: 'right', nowrap: true, render: d => (d.quality ? <span className={d.quality >= 85 ? 'font-bold text-emerald-600' : 'font-bold text-amber-600'}>{d.quality}</span> : <span className="text-slate-300">— chưa kiểm</span>) },
          { key: 'sensitive', label: 'Cột nhạy cảm', align: 'right', nowrap: true, render: d => (d.sensitive ? fmt(d.sensitive) : '—') },
          { key: 'masked', label: 'Đã che', align: 'right', nowrap: true, render: d => (d.sensitive ? <span className="font-semibold text-red-600">{d.masked}/{d.sensitive}</span> : '—') },
          { key: 'incidents', label: 'Sự cố đang mở', align: 'right', nowrap: true, render: d => (d.incidents ? <Chip tone="r">{d.incidents}</Chip> : '0') },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Note tone="bad" title="4.334 bảng chưa gán miền — không ai chịu trách nhiệm">
          Đây là dòng cuối trong bảng trên. Nhóm bảng lớn nhất hệ thống (38% tổng số) lại là nhóm <b>không có người chịu trách nhiệm</b>:
          không ai nhận cảnh báo, không ai duyệt phân quyền, không ai cập nhật mô tả.
          Chiến dịch gán miền là việc <b>rẻ nhất và hiệu quả nhất</b> để cải thiện toàn bộ chỉ số.
        </Note>
        <Note tone="warn" title="Miền Rủi ro & Tuân thủ độ phủ chỉ 44%">
          Miền có yêu cầu tuân thủ pháp lý cao nhất lại có độ phủ metadata thấp nhất.
          Khi cơ quan quản lý yêu cầu chứng minh nguồn gốc số liệu báo cáo AML, hiện chưa truy vết được — báo cáo <b>BC-010</b> đang ở trạng thái không truy vết được.
        </Note>
      </div>
    </>
  )
}

function HealthProgress() {
  return (
    <>
      <Panel title="Tiến độ theo 5 giai đoạn của lộ trình BDA" className="mb-4">
        <div className="space-y-4">
          {phaseProgress.map(p => (
            <div key={p.phase}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[13px] font-bold text-slate-800">{p.phase}</span>
                <Chip tone={p.status === 'Hoàn thành' ? 'g' : p.status === 'Mới bắt đầu' ? 'n' : 'b'}>{p.status}</Chip>
              </div>
              <div className="mb-1 text-[11.5px] text-slate-500">{p.desc}</div>
              <ProgressBar pct={p.pct} target={100} note={`${p.pct}%`} tone={p.pct >= 80 ? 'ok' : p.pct >= 40 ? 'warn' : 'bad'} />
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 items-start">
        <Panel title="Bản đồ module theo giai đoạn">
          <DataTable
            dense
            rows={MENU.map(s => ({
              module: `${s.no} ${s.title}`,
              menus: s.items.length,
              isNew: s.items.filter(i => i.isNew).length,
              phases: Array.from(new Set(s.items.map(i => i.phase))).join(' · '),
            }))}
            rowKey={r => r.module}
            columns={[
              { key: 'module', label: 'Module', nowrap: true, render: r => <span className="font-semibold">{r.module}</span> },
              { key: 'menus', label: 'Số menu', align: 'center', nowrap: true, render: r => <Chip tone="b">{r.menus}</Chip> },
              { key: 'isNew', label: 'Bổ sung sau review', align: 'center', nowrap: true, render: r => (r.isNew ? <Chip tone="t">{r.isNew}</Chip> : '—') },
              { key: 'phases', label: 'Phục vụ giai đoạn', nowrap: true, render: r => <span className="text-[11.5px]">{r.phases}</span> },
            ]}
          />
        </Panel>

        <div className="space-y-4">
          <Panel title="Chỉ số nghiệm thu theo yêu cầu BDA">
            <DataTable
              dense
              rows={[
                { g: 'GĐ2 — Danh mục', k: 'Số đối tượng đã đưa vào danh mục', v: `${fmt(STATS.totalTables)} bảng · ${STATS.totalSystems} hệ thống · ${STATS.totalChannels} kênh · ${STATS.totalReports} báo cáo` },
                { g: 'GĐ2 — Danh mục', k: 'Tỷ lệ có mô tả', v: '58%' },
                { g: 'GĐ2 — Danh mục', k: 'Tỷ lệ có người phụ trách', v: '34%' },
                { g: 'GĐ2 — Danh mục', k: 'Tỷ lệ đã được phê duyệt', v: '41%' },
                { g: 'GĐ2 — Lineage', k: 'Tỷ lệ báo cáo/chỉ tiêu truy vết được', v: '31%' },
                { g: 'GĐ3 — Chất lượng', k: 'Tỷ lệ quy tắc kiểm tra đạt', v: '87%' },
                { g: 'GĐ3 — Chất lượng', k: 'Tỷ lệ đối tượng quan trọng có luật', v: '0,6%' },
                { g: 'GĐ4 — Bảo mật', k: 'Tỷ lệ dữ liệu nhạy cảm đã phân loại', v: '78%' },
                { g: 'GĐ4 — Bảo mật', k: 'Số quyền quá hạn chưa thu hồi', v: fmt(STATS.policiesNoExpiry) },
                { g: 'GĐ4 — Tuân thủ', k: 'Số phát hiện chưa khắc phục', v: String(STATS.openFindings) },
                { g: 'GĐ5 — Dữ liệu chủ', k: 'Tỷ lệ hệ thống dùng mã chuẩn', v: `${STATS.mdmSystemsAdopted}/${STATS.mdmSystemsTotal}` },
                { g: 'GĐ5 — Dữ liệu chủ', k: 'Bản ghi nghi ngờ trùng chưa xử lý', v: fmt(STATS.mdmDuplicatesPending) },
              ]}
              columns={[
                { key: 'g', label: 'Giai đoạn', nowrap: true, render: r => <Chip tone="t">{r.g}</Chip> },
                { key: 'k', label: 'Chỉ số theo dõi' },
                { key: 'v', label: 'Giá trị hiện tại', nowrap: true, render: r => <span className="font-semibold text-slate-800">{r.v}</span> },
              ]}
            />
          </Panel>
        </div>
      </div>
    </>
  )
}

/* ═════════ 8.2 Cấu hình hệ thống ═════════ */

export function Settings() {
  const [tab, setTab] = useState('connections')
  const [test, setTest] = useState<any>(null)
  const toast = useToast()

  return (
    <>
      <PageHeader
        code="8.2"
        title="Cấu hình hệ thống"
        desc="Kết nối nguồn · định nghĩa mức quan trọng · chuẩn đặt tên · tham số vận hành toàn hệ thống"
        crumbs={[{ label: 'Operations' }, { label: 'Cấu hình hệ thống' }]}
      />

      <InlineTabs
        items={[
          { id: 'connections', label: 'Kết nối nguồn', badge: connections.length },
          { id: 'tiers', label: 'Định nghĩa mức quan trọng', badge: tierDefinitions.length },
          { id: 'naming', label: 'Chuẩn đặt tên', badge: namingRules.length },
          { id: 'params', label: 'Tham số hệ thống', badge: systemParams.length },
          { id: 'standard', label: 'Tiêu chuẩn thông tin mô tả' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'connections' && (
        <>
          <DataTable
            rows={connections}
            rowKey={c => c.id}
            highlightRow={c => (c.status === 'Lỗi xác thực' ? 'bad' : c.status === 'Cảnh báo' ? 'warn' : undefined)}
            columns={[
              { key: 'id', label: 'Mã', nowrap: true, render: c => <span className="mono text-[12px] font-semibold">{c.id}</span> },
              { key: 'name', label: 'Tên kết nối', nowrap: true, render: c => <span className="mono font-semibold text-slate-800">{c.name}</span> },
              { key: 'kind', label: 'Loại', nowrap: true, render: c => <Chip tone="t">{c.kind}</Chip> },
              { key: 'target', label: 'Địa chỉ', width: '28%', render: c => <span className="mono text-[11px] text-slate-500">{c.target}</span> },
              { key: 'system', label: 'Hệ thống', nowrap: true, render: c => <EntityLink to={`/catalog/systems/${c.system}`}>{c.system}</EntityLink> },
              { key: 'auth', label: 'Xác thực', nowrap: true },
              { key: 'lastCheck', label: 'Kiểm tra lần cuối', nowrap: true, render: c => <span className="mono text-[11.5px]">{c.lastCheck}</span> },
              { key: 'status', label: 'Trạng thái', nowrap: true, render: c => <Chip tone={c.status === 'Hoạt động' ? 'g' : c.status === 'Cảnh báo' ? 'o' : 'r'}>{c.status}</Chip> },
              { key: 'act', label: '', align: 'right', nowrap: true, render: c => <RowActions><IconBtn icon="run" title="Kiểm tra kết nối" onClick={() => setTest(c)} /><IconBtn icon="edit" title="Sửa" /></RowActions> },
            ]}
          />
          <Note tone="bad" title="KN-05 HDFS_PARTNER_B lỗi xác thực" className="mt-4">
            Kết nối SFTP tới đối tác B thất bại. Kênh <b>KENH-05</b> dùng kết nối này để gửi báo cáo doanh số hằng tuần —
            đã 5 ngày không gửi được. Cần kiểm tra SSH key có bị đối tác thay đổi không.
          </Note>
        </>
      )}

      {tab === 'tiers' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {tierDefinitions.map(t => (
              <Panel key={t.tier} title={`${t.tier} — ${t.name}`} tone={t.tier === 'Tier 1' ? 'bad' : t.tier === 'Tier 2' ? 'warn' : 'default'}>
                <div className="text-[12px] leading-relaxed text-slate-700">{t.criteria}</div>
                <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Số bảng</div>
                <div className="text-[21px] font-extrabold text-slate-800">{fmt(t.count)}</div>
                <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Điều kiện bắt buộc</div>
                <ul className="mt-1 ml-4 list-disc space-y-0.5 text-[11.5px] text-slate-600">
                  {t.required.map(r => <li key={r}>{r}</li>)}
                </ul>
                <div className="mt-3 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11.5px]">
                  <b>Cam kết xử lý:</b> {t.sla}
                </div>
              </Panel>
            ))}
          </div>
          <Note tone="info" title="Mức quan trọng quyết định gì" className="mt-4">
            Điều kiện bắt buộc khi khai bảng (menu 1.1) · ngưỡng chất lượng mặc định (menu 3.2) ·
            thời hạn xử lý sự cố (menu 3.3) · có bắt buộc bật quét lineage không (menu 4.1) ·
            thứ tự ưu tiên khi phân bổ nguồn lực cải thiện.
          </Note>
        </>
      )}

      {tab === 'naming' && (
        <>
          <DataTable
            rows={namingRules}
            rowKey={r => r.id}
            columns={[
              { key: 'id', label: 'Mã', nowrap: true, render: r => <span className="mono text-[12px] font-semibold">{r.id}</span> },
              { key: 'object', label: 'Loại đối tượng', nowrap: true, render: r => <Chip tone="t">{r.object}</Chip> },
              { key: 'pattern', label: 'Biểu thức chuẩn', width: '30%', render: r => <span className="mono text-[11.5px] text-blue-700">{r.pattern}</span> },
              { key: 'example', label: 'Ví dụ đúng', nowrap: true, render: r => <span className="mono text-[11.5px]">{r.example}</span> },
              { key: 'note', label: 'Ghi chú' },
              { key: 'act', label: '', align: 'right', nowrap: true, render: () => <RowActions><IconBtn icon="edit" title="Sửa" /></RowActions> },
            ]}
          />
          <Note tone="warn" title="Chuẩn đặt tên là cổng chặn, không phải khuyến nghị" className="mt-4">
            Form khai bảng ở menu 1.1 kiểm tên theo biểu thức <span className="mono">CT-01</span> ngay khi gõ.
            Tên sai chuẩn thì <b>không lưu được</b>. Đây là cách duy nhất giữ được tính nhất quán khi có
            {' '}{fmt(STATS.totalTables)} bảng và nhiều đội cùng khai.
          </Note>
        </>
      )}

      {tab === 'params' && (
        <>
          <DataTable
            rows={systemParams}
            rowKey={p => p.key}
            columns={[
              { key: 'group', label: 'Nhóm', nowrap: true, render: p => <Chip tone="t">{p.group}</Chip> },
              { key: 'key', label: 'Tham số', nowrap: true, render: p => <span className="mono text-[11.5px] font-semibold">{p.key}</span> },
              { key: 'value', label: 'Giá trị', nowrap: true, render: p => <span className="font-bold text-blue-700">{p.value} {p.unit !== '—' ? p.unit : ''}</span> },
              { key: 'note', label: 'Ý nghĩa', width: '46%' },
              { key: 'act', label: '', align: 'right', nowrap: true, render: () => <RowActions><IconBtn icon="edit" title="Sửa" /></RowActions> },
            ]}
          />
          <Note tone="info" title="Tham số quan trọng nhất: bật cổng chặn từ mức nào" className="mt-4">
            Đang đặt ở <b>Tier 1</b>. Bật cổng chặn cho toàn bộ {fmt(STATS.totalTables)} bảng ngay từ đầu sẽ khiến
            người dùng không khai được gì và quay lưng với hệ thống. Mở rộng dần theo mức độ sẵn sàng của từng miền.
          </Note>
        </>
      )}

      {tab === 'standard' && <MetadataStandard embedded />}

      <Modal
        open={!!test}
        onClose={() => setTest(null)}
        title="Kết quả kiểm tra kết nối"
        desc={test && `${test.name} · ${test.target}`}
        footer={<ActionButton variant="ghost" onClick={() => setTest(null)}>Đóng</ActionButton>}
      >
        {test && (
          <div className="space-y-3">
            <DataTable
              dense
              rows={test.status === 'Lỗi xác thực' ? [
                { step: 'Phân giải tên miền', result: 'Thành công', ms: '12 ms' },
                { step: 'Mở kết nối TCP', result: 'Thành công', ms: '48 ms' },
                { step: 'Bắt tay TLS', result: 'Thành công', ms: '112 ms' },
                { step: 'Xác thực SSH key', result: 'Thất bại', ms: 'Permission denied (publickey)' },
              ] : [
                { step: 'Phân giải tên miền', result: 'Thành công', ms: '8 ms' },
                { step: 'Mở kết nối TCP', result: 'Thành công', ms: '22 ms' },
                { step: 'Xác thực', result: 'Thành công', ms: '86 ms' },
                { step: 'Truy vấn thử', result: 'Thành công', ms: '142 ms · trả về 1 dòng' },
              ]}
              columns={[
                { key: 'step', label: 'Bước kiểm tra' },
                { key: 'result', label: 'Kết quả', nowrap: true, render: r => <Chip tone={r.result === 'Thành công' ? 'g' : 'r'}>{r.result}</Chip> },
                { key: 'ms', label: 'Chi tiết', nowrap: true, render: r => <span className="mono text-[11.5px]">{r.ms}</span> },
              ]}
            />
            {test.status === 'Lỗi xác thực' && (
              <Note tone="bad" title="Nguyên nhân và cách xử lý">
                Máy chủ đối tác từ chối khóa SSH hiện tại. Thường do đối tác xoay vòng khóa mà chưa thông báo.
                Liên hệ đầu mối kỹ thuật của đối tác để cập nhật khóa công khai mới.
              </Note>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
