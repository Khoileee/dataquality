import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PageHeader, KpiRow, FilterBar, DataTable, Panel, Note, Chip, StatusChip, DimensionChip,
  ActionButton, IconBtn, RowActions, EntityLink, InfoGrid, EmptyState, InlineTabs, Modal,
  useToast, Field, TextInput, TextArea, SelectInput, Toggle, Steps, SectionTitle, ProgressBar,
  OptionCards, ChipInput,
} from '@/components/common'
import { profiles, tables, columnsOf, alertRules, alertChannels, ruleTypes, fmt, tableById } from '@/data'
import { match, useDemoSave } from '@/lib/demo'

/* ═════════ 3.3 Phân tích dữ liệu (Profiling) ═════════ */

export function Profiling({ embedded, tableId }: { embedded?: boolean; tableId?: string } = {}) {
  const [sp] = useSearchParams()
  const [table, setTable] = useState(tableId ?? sp.get('table') ?? 'bi.doi_soat_giao_dich_A')
  const [tab, setTab] = useState('columns')
  const [q, setQ] = useState('')
  const [suggest, setSuggest] = useState<any>(null)
  const toast = useToast()

  const rows = useMemo(() => profiles.filter(p => p.tableId === table && match(`${p.column} ${p.type}`, q)), [table, q])
  const t = tableById(table)

  return (
    <>
      {!embedded && (
        <PageHeader
          code="1.1"
          title="Phân tích dữ liệu"
          desc="Nơi duy nhất đo chỉ số thống kê của cột — tab Cột ở menu 1.1 đọc lại kết quả từ đây, không đo lần thứ hai (nguyên tắc NT3)"
          crumbs={[{ label: 'Data Quality' }, { label: 'Phân tích dữ liệu' }]}
          actions={
            <>
              <ActionButton variant="ghost" icon="run" onClick={() => toast.info('Đang quét', `Quét lại toàn bộ cột của ${table} — minh hoạ.`)}>Quét lại ngay</ActionButton>
              <ActionButton variant="ghost" icon="export">Xuất kết quả</ActionButton>
            </>
          }
        />
      )}

      <Panel className="mb-4">
        <div className="flex items-end gap-3">
          <Field label="Bảng cần phân tích" className="w-[420px]">
            <SelectInput value={table} onChange={e => setTable(e.target.value)}>
              {tables.map(x => <option key={x.id} value={x.id}>{x.id} — {x.name}</option>)}
            </SelectInput>
          </Field>
          {t && (
            <div className="flex gap-3 pb-1 text-[12px] text-slate-500">
              <span><b className="text-slate-800">{fmt(t.rows)}</b> dòng</span>
              <span><b className="text-slate-800">{t.columnCount}</b> cột</span>
              <span>Lần quét gần nhất: <b className="text-slate-800">{rows[0]?.scannedAt ?? '— chưa quét'}</b></span>
            </div>
          )}
        </div>
      </Panel>

      <KpiRow
        items={[
          { label: 'Cột đã quét', value: rows.length, sub: `trên ${t?.columnCount ?? 0} cột của bảng` },
          { label: 'Cột có tỷ lệ rỗng cao', value: rows.filter(r => r.nullPct > 10).length, sub: 'vượt 10%', tone: 'bad' },
          { label: 'Cột nghi là khoá', value: rows.filter(r => r.distinct > 1_000_000 && r.nullPct === 0).length, sub: 'giá trị phân biệt ≈ số dòng' },
          { label: 'Gợi ý luật', value: rows.reduce((a, r) => a + r.suggestions.length, 0), sub: 'từ kết quả phân tích', tone: 'info' },
          { label: 'Cột đã có luật', value: t?.ruleCount ?? 0, sub: 'đang chạy trên bảng này' },
        ]}
      />

      <div className="mt-4">
        <InlineTabs
          items={[
            { id: 'columns', label: 'Theo cột', badge: rows.length },
            { id: 'distribution', label: 'Phân bố giá trị' },
            { id: 'history', label: 'Lịch sử quét' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'columns' && (
        <>
          <FilterBar placeholder="Tìm theo tên cột…" value={q} onChange={setQ} right={<span className="text-[12px] text-slate-400">{rows.length} cột</span>} />
          <DataTable
            stt
            rows={rows}
            rowKey={p => p.column}
            highlightRow={p => (p.nullPct > 10 ? 'bad' : p.nullPct > 3 ? 'warn' : undefined)}
            empty="Bảng này chưa được quét phân tích dữ liệu"
            columns={[
              { key: 'column', label: 'Cột', nowrap: true, render: p => <span className="mono text-[12px] font-semibold">{p.column}</span> },
              { key: 'type', label: 'Kiểu', nowrap: true, render: p => <Chip tone="n">{p.type}</Chip> },
              { key: 'nullPct', label: '% rỗng', align: 'right', nowrap: true, render: p => <span className={p.nullPct > 10 ? 'font-bold text-red-600' : p.nullPct > 3 ? 'font-semibold text-amber-600' : ''}>{p.nullPct}%</span> },
              { key: 'distinct', label: 'Giá trị phân biệt', align: 'right', nowrap: true, render: p => fmt(p.distinct) },
              { key: 'min', label: 'Nhỏ nhất', nowrap: true, render: p => <span className="mono text-[11px]">{p.min}</span> },
              { key: 'max', label: 'Lớn nhất', nowrap: true, render: p => <span className="mono text-[11px]">{p.max}</span> },
              { key: 'mean', label: 'Trung bình', align: 'right', nowrap: true, render: p => p.mean ?? '—' },
              { key: 'topValue', label: 'Giá trị phổ biến nhất', nowrap: true, render: p => <span className="mono text-[11px]">{p.topValue}</span> },
              { key: 'topPct', label: 'Tỷ lệ', align: 'right', nowrap: true, render: p => `${p.topPct}%` },
              { key: 'duplicates', label: 'Bản trùng', align: 'right', nowrap: true, render: p => fmt(p.duplicates) },
              {
                key: 'act', label: '', align: 'right', nowrap: true,
                render: p => (
                  <RowActions>
                    <ActionButton variant="ghost" onClick={() => setSuggest(p)}>Gợi ý luật ({p.suggestions.length})</ActionButton>
                  </RowActions>
                ),
              },
            ]}
          />
        </>
      )}

      {tab === 'distribution' && (
        <div className="grid grid-cols-2 gap-4">
          {rows.slice(0, 6).map(p => (
            <Panel key={p.column} title={<span className="mono">{p.column}</span>} desc={`${p.type} · ${fmt(p.distinct)} giá trị phân biệt`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-slate-500">Giá trị phổ biến nhất</span>
                  <span className="mono font-semibold">{p.topValue}</span>
                </div>
                <ProgressBar pct={p.topPct} label="Tỷ lệ giá trị phổ biến nhất" note={`${p.topPct}%`} tone={p.topPct > 80 ? 'warn' : 'info'} />
                <ProgressBar pct={p.nullPct} label="Tỷ lệ rỗng" note={`${p.nullPct}%`} tone={p.nullPct > 10 ? 'bad' : p.nullPct > 3 ? 'warn' : 'ok'} />
                <ProgressBar pct={Math.min(100, (p.distinct / (t?.rows ?? 1)) * 100)} label="Độ phân tán" note={`${fmt(p.distinct)} / ${fmt(t?.rows ?? 0)}`} tone="info" />
              </div>
            </Panel>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <DataTable
          rows={[
            { at: '2026-08-09 03:12', cols: rows.length, dur: '4 phút 12 giây', changes: 'Tỷ lệ rỗng so_dien_thoai tăng từ 2,8% lên 3,2%', by: 'Theo lịch' },
            { at: '2026-08-08 03:11', cols: rows.length, dur: '4 phút 02 giây', changes: 'Không có thay đổi đáng kể', by: 'Theo lịch' },
            { at: '2026-08-07 09:20', cols: rows.length, dur: '3 phút 58 giây', changes: 'Giá trị mới xuất hiện ở loai_giao_dich: DIEUCHINH', by: 'Thủ công — Nguyễn Thị Phương' },
            { at: '2026-08-07 03:12', cols: rows.length, dur: '4 phút 08 giây', changes: 'Số dòng giảm 22% so với ngày trước', by: 'Theo lịch' },
            { at: '2026-08-06 03:10', cols: rows.length, dur: '3 phút 51 giây', changes: 'Không có thay đổi đáng kể', by: 'Theo lịch' },
          ]}
          columns={[
            { key: 'at', label: 'Thời điểm quét', nowrap: true, render: r => <span className="mono text-[11.5px]">{r.at}</span> },
            { key: 'cols', label: 'Số cột', align: 'right', nowrap: true },
            { key: 'dur', label: 'Thời gian chạy', nowrap: true },
            { key: 'changes', label: 'Thay đổi so với lần trước' },
            { key: 'by', label: 'Nguồn kích hoạt', nowrap: true, render: r => <Chip tone={r.by === 'Theo lịch' ? 'n' : 'b'}>{r.by}</Chip> },
          ]}
        />
      )}

      <Modal
        open={!!suggest}
        onClose={() => setSuggest(null)}
        title={suggest && `Gợi ý luật cho cột ${suggest.column}`}
        desc="Đề xuất dựa trên chỉ số thống kê thực tế của dữ liệu"
        footer={<ActionButton variant="ghost" onClick={() => setSuggest(null)}>Đóng</ActionButton>}
      >
        {suggest && (
          <div className="space-y-2">
            {suggest.suggestions.map((s: any, i: number) => (
              <div key={i} className="rounded-lg border border-slate-200 px-3.5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <DimensionChip id={s.dimension} />
                    <span className="text-[13px] font-bold text-slate-800">{s.rule}</span>
                  </div>
                  <ActionButton to={`/quality/assign?table=${encodeURIComponent(suggest.tableId)}&col=${suggest.column}`}>Gán luật này</ActionButton>
                </div>
                <div className="mt-1.5 text-[12px] text-slate-600">{s.reason}</div>
              </div>
            ))}
            {!suggest.suggestions.length && <EmptyState text="Không có gợi ý cho cột này" />}
          </div>
        )}
      </Modal>
    </>
  )
}

/* ═════════ 3.5 Cảnh báo ═════════ */

export function AlertList() {
  const [tab, setTab] = useState('rules')
  const [q, setQ] = useState('')
  const [test, setTest] = useState<any>(null)
  const toast = useToast()

  const rules = useMemo(() => alertRules.filter(a => match(`${a.id} ${a.name} ${a.condition} ${a.scope}`, q)), [q])
  const chans = useMemo(() => alertChannels.filter(c => match(`${c.id} ${c.name} ${c.kind} ${c.config}`, q)), [q])

  return (
    <>
      <PageHeader
        code="3.4"
        title="Cảnh báo"
        desc="Cấu hình ai nhận cảnh báo gì, qua kênh nào, gửi ngay hay gom lô — chống trùng để không làm người dùng chai lì"
        crumbs={[{ label: 'Data Quality' }, { label: 'Cảnh báo' }]}
        actions={<ActionButton icon="plus" to="/quality/alerts/create">{tab === 'rules' ? 'Thêm quy tắc cảnh báo' : 'Thêm kênh gửi'}</ActionButton>}
      />

      <KpiRow
        items={[
          { label: 'Quy tắc cảnh báo', value: alertRules.length, sub: `${alertRules.filter(a => a.status === 'Bật').length} đang bật` },
          { label: 'Kênh gửi', value: alertChannels.length, sub: `${alertChannels.filter(c => c.status === 'Hoạt động').length} hoạt động` },
          { label: 'Cảnh báo gửi trong tháng', value: fmt(alertChannels.reduce((a, c) => a + c.sentMonth, 0)), sub: 'qua mọi kênh' },
          { label: 'Kênh có tỷ lệ lỗi cao', value: alertChannels.filter(c => c.failRate > 1).length, sub: 'thất bại trên 1%', tone: 'bad' },
          { label: 'Tỷ lệ báo động giả', value: '18%', sub: 'ngưỡng đỏ 25%', tone: 'warn' },
        ]}
      />

      <div className="mt-4">
        <InlineTabs
          items={[
            { id: 'rules', label: 'Quy tắc cảnh báo', badge: alertRules.length },
            { id: 'channels', label: 'Kênh gửi', badge: alertChannels.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <FilterBar placeholder="Tìm kiếm…" value={q} onChange={setQ} right={<span className="text-[12px] text-slate-400">{tab === 'rules' ? rules.length : chans.length} bản ghi</span>} />

      {tab === 'rules' ? (
        <DataTable
          rows={rules}
          rowKey={a => a.id}
          highlightRow={a => (a.status === 'Tắt' ? 'warn' : undefined)}
          columns={[
            { key: 'id', label: 'Mã', nowrap: true, render: a => <span className="mono text-[12px] font-semibold">{a.id}</span> },
            { key: 'name', label: 'Tên quy tắc', width: '20%', render: a => <span className="font-semibold text-slate-800">{a.name}</span> },
            { key: 'condition', label: 'Điều kiện kích hoạt', width: '18%', render: a => <span className="text-[11.5px]">{a.condition}</span> },
            { key: 'scope', label: 'Phạm vi', nowrap: true, render: a => <Chip tone="t">{a.scope}</Chip> },
            { key: 'mode', label: 'Chế độ gửi', nowrap: true, render: a => <Chip tone={a.mode === 'Gửi ngay' ? 'r' : a.mode.includes('Tổng hợp') ? 'b' : 'o'}>{a.mode}</Chip> },
            { key: 'channels', label: 'Kênh', nowrap: true, render: a => <div className="flex gap-1">{a.channels.map(c => <Chip key={c} tone="n">{alertChannels.find(x => x.id === c)?.kind ?? c}</Chip>)}</div> },
            { key: 'recipients', label: 'Người nhận', width: '16%', render: a => <span className="text-[11.5px]">{a.recipients.join(' · ')}</span> },
            { key: 'dedupe', label: 'Chống trùng', width: '14%', render: a => <span className="text-[11.5px] text-slate-500">{a.dedupe}</span> },
            { key: 'sentMonth', label: 'Đã gửi/tháng', align: 'right', nowrap: true, render: a => fmt(a.sentMonth) },
            { key: 'status', label: 'Trạng thái', nowrap: true, render: a => <Chip tone={a.status === 'Bật' ? 'g' : 'n'}>{a.status}</Chip> },
            { key: 'act', label: '', align: 'right', nowrap: true, render: a => <RowActions><IconBtn icon="edit" title="Sửa" to={`/quality/alerts/create?id=${a.id}`} /><IconBtn icon="run" title="Gửi thử" onClick={() => setTest(a)} /></RowActions> },
          ]}
        />
      ) : (
        <DataTable
          rows={chans}
          rowKey={c => c.id}
          highlightRow={c => (c.failRate > 1 ? 'bad' : c.status === 'Tạm dừng' ? 'warn' : undefined)}
          columns={[
            { key: 'id', label: 'Mã kênh', nowrap: true, render: c => <span className="mono text-[12px] font-semibold">{c.id}</span> },
            { key: 'name', label: 'Tên kênh', width: '22%', render: c => <span className="font-semibold text-slate-800">{c.name}</span> },
            { key: 'kind', label: 'Loại', nowrap: true, render: c => <Chip tone="t">{c.kind}</Chip> },
            { key: 'config', label: 'Cấu hình', width: '26%', render: c => <span className="mono text-[11px] text-slate-500">{c.config}</span> },
            { key: 'sentMonth', label: 'Đã gửi/tháng', align: 'right', nowrap: true, render: c => fmt(c.sentMonth) },
            { key: 'failed', label: 'Thất bại', align: 'right', nowrap: true, render: c => (c.failed ? <span className="font-semibold text-red-600">{c.failed}</span> : '0') },
            { key: 'failRate', label: 'Tỷ lệ lỗi', align: 'right', nowrap: true, render: c => <span className={c.failRate > 1 ? 'font-bold text-red-600' : ''}>{c.failRate}%</span> },
            { key: 'status', label: 'Trạng thái', nowrap: true, render: c => <Chip tone={c.status === 'Hoạt động' ? 'g' : c.status === 'Lỗi' ? 'r' : 'o'}>{c.status}</Chip> },
            { key: 'act', label: '', align: 'right', nowrap: true, render: c => <RowActions><IconBtn icon="run" title="Gửi thử" onClick={() => setTest(c)} /><IconBtn icon="edit" title="Sửa" /></RowActions> },
          ]}
        />
      )}

      {tab === 'channels' && (
        <Note tone="bad" title="Kênh KG-05 đang lỗi 42,9%" className="mt-4">
          Webhook gửi sang hệ thống giám sát thất bại 18/42 lần trong tháng.
          Cảnh báo gửi qua kênh này <b>coi như không tới nơi</b> — cần kiểm tra endpoint và token.
        </Note>
      )}

      <Modal
        open={!!test}
        onClose={() => setTest(null)}
        title="Kết quả gửi thử"
        desc={test?.name}
        footer={<ActionButton variant="ghost" onClick={() => setTest(null)}>Đóng</ActionButton>}
      >
        <div className="space-y-3">
          <DataTable
            dense
            rows={[
              { ch: 'Email — dataops@congty.vn', at: '10:24:02', result: 'Thành công', ms: '412 ms' },
              { ch: 'Telegram — nhóm Đối soát', at: '10:24:02', result: 'Thành công', ms: '286 ms' },
              { ch: 'Webhook — monitor.noibo.vn', at: '10:24:03', result: 'Thất bại', ms: 'hết thời gian chờ (5.000 ms)' },
            ]}
            columns={[
              { key: 'ch', label: 'Kênh' },
              { key: 'at', label: 'Thời điểm', nowrap: true, render: r => <span className="mono">{r.at}</span> },
              { key: 'result', label: 'Kết quả', nowrap: true, render: r => <Chip tone={r.result === 'Thành công' ? 'g' : 'r'}>{r.result}</Chip> },
              { key: 'ms', label: 'Thời gian phản hồi', nowrap: true },
            ]}
          />
          <Note tone="warn" title="Nội dung cảnh báo mẫu">
            <div className="mono mt-1 rounded bg-white p-2.5 text-[11.5px] leading-relaxed">
              [DMP · NGHIÊM TRỌNG] Sự cố SC-0231 — bi.doi_soat_giao_dich_A<br />
              Luật: Đúng định dạng (biểu thức) · cột so_dien_thoai<br />
              Kết quả: 94,2% (ngưỡng cảnh báo 99%) · 723.058 dòng lỗi<br />
              Người xử lý: Trần Văn Hùng · Hạn: 11/08/2026 17:00<br />
              Xem chi tiết: dmp.vds.vn/quality/incidents/SC-0231
            </div>
          </Note>
        </div>
      </Modal>
    </>
  )
}

/* ═════════ 3.5 Tạo quy tắc cảnh báo ═════════ */

export function AlertCreate() {
  const save = useDemoSave('/quality/alerts')
  const [step, setStep] = useState(0)
  const [f, setF] = useState({ name: '', condition: '', scope: 'Toàn hệ thống', mode: 'Gửi ngay', dedupe: '4 giờ' })
  const [chans, setChans] = useState<string[]>(['KG-01'])
  const [recips, setRecips] = useState<string[]>(['Nhóm Quản trị dữ liệu'])
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }))
  const ok = f.name && f.condition && chans.length && recips.length

  return (
    <>
      <PageHeader
        code="3.4"
        title="Thêm quy tắc cảnh báo"
        desc="Cảnh báo gửi quá nhiều thì người dùng bỏ qua — dùng chế độ gom lô và chống trùng để giữ tín hiệu có giá trị"
        crumbs={[{ label: 'Data Quality' }, { label: 'Cảnh báo', href: '/quality/alerts' }, { label: 'Thêm quy tắc' }]}
      />
      <Steps items={['Điều kiện kích hoạt', 'Chế độ gửi', 'Người nhận và kênh']} current={step} onJump={setStep} />

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title={['Điều kiện kích hoạt cảnh báo', 'Chế độ gửi và chống trùng', 'Người nhận và kênh gửi'][step]}>
          {step === 0 && (
            <div className="space-y-4">
              <Field label="Tên quy tắc" required><TextInput value={f.name} onChange={set('name')} placeholder="Sự cố nghiêm trọng trên bảng Tier 1" /></Field>
              <Field label="Điều kiện" required hint="Cảnh báo được gửi khi điều kiện này đúng">
                <TextArea rows={2} value={f.condition} onChange={set('condition')} placeholder="Mức độ = Nghiêm trọng VÀ Tier = 1" />
              </Field>
              <Field label="Phạm vi áp dụng" required>
                <SelectInput value={f.scope} onChange={set('scope')}>
                  {['Toàn hệ thống', 'Bảng có chu kỳ cam kết', 'Miền Kinh doanh', 'Miền Khách hàng', 'Miền Giao dịch', 'Miền Tài chính', 'Miền Rủi ro & Tuân thủ', 'Cửa nạp dữ liệu'].map(s => <option key={s}>{s}</option>)}
                </SelectInput>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field label="Chế độ gửi" required>
                <OptionCards
                  cols={2}
                  value={f.mode}
                  onChange={v => setF(p => ({ ...p, mode: v }))}
                  options={[
                    { id: 'Gửi ngay', label: 'Gửi ngay', desc: 'Dùng cho sự cố nghiêm trọng cần phản ứng tức thì' },
                    { id: 'Gom lô 15 phút', label: 'Gom lô 15 phút', desc: 'Gom các cảnh báo trong 15 phút thành một thông báo' },
                    { id: 'Tổng hợp ngày', label: 'Tổng hợp ngày', desc: 'Một bản tin mỗi ngày — dùng cho theo dõi thường xuyên' },
                    { id: 'Tổng hợp tuần', label: 'Tổng hợp tuần', desc: 'Báo cáo tuần cho cấp quản lý' },
                  ]}
                />
              </Field>
              <Field label="Chống trùng" required hint="Không gửi lại cùng một cảnh báo trong khoảng thời gian này">
                <SelectInput value={f.dedupe} onChange={set('dedupe')}>
                  {['Không chống trùng', '1 giờ', '4 giờ', '12 giờ', '24 giờ', 'Một lần cho mỗi bảng mỗi ngày'].map(d => <option key={d}>{d}</option>)}
                </SelectInput>
              </Field>
              <Note tone="warn" title="Tỷ lệ báo động giả hiện là 18%">
                Ngưỡng đỏ là <b>25%</b>. Vượt ngưỡng thì người dùng bắt đầu bỏ qua cả cảnh báo thật.
                Chế độ <b>gửi ngay</b> chỉ nên dùng cho điều kiện thực sự nghiêm trọng.
              </Note>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Kênh gửi" required>
                <div className="space-y-1.5">
                  {alertChannels.map(c => (
                    <label key={c.id} className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 transition ${chans.includes(c.id) ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}>
                      <span className="flex items-center gap-2.5">
                        <input type="checkbox" checked={chans.includes(c.id)} onChange={() => setChans(p => (p.includes(c.id) ? p.filter(x => x !== c.id) : [...p, c.id]))} />
                        <span>
                          <span className="block text-[12.5px] font-semibold text-slate-800">{c.name}</span>
                          <span className="mono block text-[10.5px] text-slate-400">{c.config}</span>
                        </span>
                      </span>
                      <Chip tone={c.status === 'Hoạt động' ? 'g' : c.status === 'Lỗi' ? 'r' : 'o'}>{c.status}</Chip>
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Người / nhóm nhận" required hint="Gõ rồi nhấn Enter để thêm">
                <ChipInput values={recips} onChange={setRecips} placeholder="Nhóm Đối soát, Trần Văn Hùng…" />
              </Field>
              <Note tone="info" title="Tự động gán theo vai trò">
                Có thể dùng biến động: <span className="mono">Đầu mối nghiệp vụ của bảng</span>, <span className="mono">Đầu mối kỹ thuật của bảng</span>,
                <span className="mono"> Người sở hữu dữ liệu</span> — hệ thống tự tra từ metadata ở menu 1.1.
              </Note>
            </div>
          )}
        </Panel>

        <Panel title="Xem trước cảnh báo">
          <div className="mono rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-200">
            <div className="text-[#FFD479]">[DMP · {f.mode}] {f.name || 'Tên quy tắc'}</div>
            <div className="mt-1 text-slate-400">Điều kiện: {f.condition || '—'}</div>
            <div className="text-slate-400">Phạm vi: {f.scope}</div>
            <div className="mt-1.5 text-[#93B4FF]">Kênh: {chans.map(c => alertChannels.find(x => x.id === c)?.kind).join(' · ') || '—'}</div>
            <div className="text-[#93B4FF]">Người nhận: {recips.join(' · ') || '—'}</div>
            <div className="mt-1.5 text-slate-500">Chống trùng: {f.dedupe}</div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/quality/alerts">Huỷ</ActionButton>
        <div className="flex gap-2">
          {step > 0 && <ActionButton variant="ghost" onClick={() => setStep(s => s - 1)}>Quay lại</ActionButton>}
          {step < 2
            ? <ActionButton onClick={() => setStep(s => s + 1)}>Tiếp tục</ActionButton>
            : <ActionButton disabled={!ok} onClick={() => save('Đã tạo quy tắc cảnh báo')}>Lưu và bật</ActionButton>}
        </div>
      </div>
    </>
  )
}
