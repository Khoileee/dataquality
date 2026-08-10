import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PageHeader, KpiRow, FilterBar, DataTable, Panel, Note, Chip, StatusChip, DimensionChip,
  ActionButton, IconBtn, RowActions, EntityLink, InfoGrid, EmptyState, InlineTabs, Steps,
  Field, TextInput, TextArea, SelectInput, Toggle, CodeBlock, Drawer, Modal, useToast,
  ProgressBar, MiniBars, DIMENSIONS, SectionTitle, OptionCards,
} from '@/components/common'
import { ruleTypes, ruleTypeById, ruleInstances, tables, columnsOf, refdata, profilesOf, STATS, fmt, tableById, metrics, reports } from '@/data'
import { match, useDemoSave } from '@/lib/demo'
import { RULE_SCHEDULES, SEVERITIES } from '@/data/enums'
import { NextStep } from '@/components/common'

/* ═════════ 3.1 Thư viện luật ═════════ */

export function RuleLibrary() {
  const [q, setQ] = useState('')
  const [dim, setDim] = useState('')
  const [level, setLevel] = useState('')
  const [pick, setPick] = useState<any>(null)

  const rows = useMemo(
    () => ruleTypes.filter(r =>
      (!dim || DIMENSIONS.find(d => d.label === dim)?.id === r.dimension) &&
      (!level || r.level === level) &&
      match(`${r.code} ${r.name} ${r.description} ${r.appliesTo}`, q)),
    [q, dim, level]
  )

  const unused = ruleTypes.filter(r => r.usage === 0)

  return (
    <>
      <PageHeader
        code="3.1"
        title="Thư viện luật"
        desc={`Danh mục ${STATS.totalRuleTypes} loại kiểm tra dùng chung — khai một lần, gán cho mọi bảng, cột, báo cáo, chỉ tiêu và dữ liệu chủ`}
        crumbs={[{ label: 'Data Quality' }, { label: 'Thư viện luật' }]}
        actions={<ActionButton icon="plus" to="/quality/rules/create">Tạo loại kiểm tra</ActionButton>}
      />

      <KpiRow
        items={[
          { label: 'Loại kiểm tra', value: STATS.totalRuleTypes, sub: `${ruleTypes.filter(r => r.level === 'Cột').length} mức cột · ${ruleTypes.filter(r => r.level === 'Bảng').length} mức bảng` },
          { label: 'Luật đang chạy', value: fmt(STATS.runningRules), sub: `trên ${STATS.tablesWithQuality} bảng` },
          { label: 'Loại chưa dùng lần nào', value: unused.length, sub: 'khai rồi để đó', tone: 'bad' },
          { label: 'Bao phủ 6 chiều', value: '6/6', sub: 'đủ chiều chất lượng', tone: 'ok' },
          { label: 'Loại tự tạo', value: ruleTypes.filter(r => !r.builtin).length, sub: 'còn lại là dựng sẵn' },
        ]}
      />

      <div className="mt-4">
        <FilterBar
          placeholder="Tìm theo mã kỹ thuật, tên loại kiểm tra…"
          value={q}
          onChange={setQ}
          filters={[
            { label: 'Chiều', options: DIMENSIONS.map(d => d.label), value: dim, onChange: setDim },
            { label: 'Mức', options: ['Bảng', 'Cột'], value: level, onChange: setLevel },
          ]}
          right={<span className="text-[12px] text-slate-400">{rows.length} / {ruleTypes.length} loại</span>}
        />
      </div>

      <DataTable
        stt
        rows={rows}
        rowKey={r => r.id}
        highlightRow={r => (r.usage === 0 ? 'bad' : undefined)}
        columns={[
          { key: 'id', label: 'Mã', nowrap: true, render: r => <span className="mono text-[12px] font-semibold">{r.id}</span> },
          { key: 'code', label: 'Mã kỹ thuật', nowrap: true, render: r => <span className="mono text-[11.5px] text-blue-700">{r.code}</span> },
          { key: 'name', label: 'Tên loại kiểm tra', width: '20%', render: r => <div><div className="font-semibold text-slate-800">{r.name}</div><div className="text-[11px] text-slate-400">{r.description}</div></div> },
          { key: 'dimension', label: 'Chiều chất lượng', nowrap: true, render: r => <DimensionChip id={r.dimension} /> },
          { key: 'level', label: 'Mức', nowrap: true, render: r => <Chip tone={r.level === 'Cột' ? 'b' : 'p'}>{r.level}</Chip> },
          { key: 'appliesTo', label: 'Áp cho', nowrap: true },
          { key: 'params', label: 'Tham số phải khai', render: r => <span className="mono text-[11px]">{r.params}</span> },
          { key: 'builtin', label: 'Nguồn', nowrap: true, render: r => <Chip tone={r.builtin ? 'n' : 'o'}>{r.builtin ? 'Dựng sẵn' : 'Tự tạo'}</Chip> },
          { key: 'usage', label: 'Lượt dùng', align: 'right', nowrap: true, render: r => (r.usage ? <span className="font-semibold">{r.usage}</span> : <Chip tone="r">0</Chip>) },
          { key: 'act', label: '', align: 'right', nowrap: true, render: r => <RowActions><IconBtn icon="view" title="Chi tiết" onClick={() => setPick(r)} /><IconBtn icon="copy" title="Nhân bản" to="/quality/rules/create" /></RowActions> },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Note tone="bad" title={`${unused.length} loại kiểm tra có lượt dùng bằng 0`}>
          <ul className="ml-4 mt-1 list-disc space-y-1">
            {unused.map(u => (
              <li key={u.id}><span className="mono font-semibold">{u.code}</span> — {u.name}: {u.description.replace('⚠️ ', '')}</li>
            ))}
          </ul>
          Đây là hai loại kiểm tra <b>quan trọng nhất với dữ liệu đối soát</b> nhưng chưa chạy được vì thiếu bước nối sang Danh mục tham chiếu (menu 1.5).
        </Note>
        <Note tone="info" title="Ngưỡng ba cấp">
          Mỗi loại kiểm tra có <b>ngưỡng mặc định</b> khai ở đây. Khi gán cho một bảng có thể <b>đè ngưỡng theo bảng</b>,
          và khi gán cho một cột cụ thể lại có thể <b>đè ngưỡng theo lần gán</b>. Thứ tự ưu tiên: lần gán → bảng → toàn cục.
        </Note>
      </div>

      <Drawer open={!!pick} onClose={() => setPick(null)} title={pick?.name} desc={pick && `${pick.id} · ${pick.code}`} width={620}>
        {pick && (
          <div className="space-y-4">
            <InfoGrid
              items={[
                { label: 'Mã kỹ thuật', value: <span className="mono">{pick.code}</span> },
                { label: 'Chiều chất lượng', value: <DimensionChip id={pick.dimension} /> },
                { label: 'Mức áp dụng', value: pick.level },
                { label: 'Áp cho', value: pick.appliesTo },
                { label: 'Tham số phải khai', value: <span className="mono">{pick.params}</span> },
                { label: 'Nguồn', value: pick.builtin ? 'Dựng sẵn' : 'Tự tạo' },
                { label: 'Ngưỡng cảnh báo mặc định', value: `${pick.defaultWarn}%` },
                { label: 'Ngưỡng nghiêm trọng mặc định', value: `${pick.defaultCrit}%` },
                { label: 'Lượt dùng hiện tại', value: pick.usage },
                { label: 'Mô tả', value: pick.description, full: true },
              ]}
            />
            <div>
              <SectionTitle>Câu SQL mẫu</SectionTitle>
              <CodeBlock dark>{pick.sqlTemplate}</CodeBlock>
              <div className="mt-2 text-[11px] text-slate-400">
                Biến trong ngoặc nhọn được thay bằng giá trị thật khi gán luật cho bảng/cột cụ thể.
              </div>
            </div>
            <ActionButton to={`/quality/assign?ruleType=${pick.id}`}>Gán loại kiểm tra này cho đối tượng</ActionButton>
          </div>
        )}
      </Drawer>
    </>
  )
}

/* ═════════ 3.1 Tạo loại kiểm tra ═════════ */

export function RuleCreate() {
  const save = useDemoSave('/quality/rules')
  const [step, setStep] = useState(0)
  const [f, setF] = useState({ code: '', name: '', dimension: 'validity', level: 'Cột', appliesTo: '', params: '', description: '', sql: '', warn: '99', crit: '95' })
  const set = (k: string) => (e: any) => setF(p => ({ ...p, [k]: e.target.value }))
  const ok = f.code && f.name && f.appliesTo && f.sql

  return (
    <>
      <PageHeader
        code="3.1"
        title="Tạo loại kiểm tra mới"
        desc="Loại kiểm tra là khuôn dùng chung — tạo một lần rồi gán cho nhiều đối tượng với tham số khác nhau"
        crumbs={[{ label: 'Data Quality' }, { label: 'Thư viện luật', href: '/quality/rules' }, { label: 'Tạo loại kiểm tra' }]}
      />
      <Steps items={['Thông tin loại', 'Tham số và câu SQL', 'Ngưỡng mặc định']} current={step} onJump={setStep} />

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title={['Thông tin loại kiểm tra', 'Tham số và câu SQL kiểm tra', 'Ngưỡng mặc định'][step]}>
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Mã kỹ thuật" required hint="Chữ thường, gạch dưới — dùng trong cấu hình và API">
                <TextInput mono value={f.code} onChange={set('code')} placeholder="cross_system_sum_match" />
              </Field>
              <Field label="Tên hiển thị" required><TextInput value={f.name} onChange={set('name')} placeholder="Đối chiếu tổng liên hệ thống" /></Field>
              <Field label="Chiều chất lượng" info="ruleType.dimension" required hint="Một trong 6 chiều theo GĐ3 mục 3">
                <SelectInput value={f.dimension} onChange={set('dimension')}>
                  {DIMENSIONS.map(d => <option key={d.id} value={d.id}>{d.label} ({d.en})</option>)}
                </SelectInput>
              </Field>
              <Field label="Mức áp dụng" required>
                <SelectInput value={f.level} onChange={set('level')}><option>Cột</option><option>Bảng</option></SelectInput>
              </Field>
              <Field label="Áp cho loại đối tượng nào" required full hint="GĐ3 mục 3: bảng · cột · file · báo cáo · chỉ tiêu · dữ liệu chủ">
                <TextInput value={f.appliesTo} onChange={set('appliesTo')} placeholder="Bảng tổng hợp · Báo cáo · Chỉ tiêu" />
              </Field>
              <Field label="Mô tả" required full><TextArea rows={2} value={f.description} onChange={set('description')} /></Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field label="Tham số phải khai khi gán" hint="Ngăn cách bằng dấu · — người gán sẽ phải điền giá trị cho từng tham số">
                <TextInput mono value={f.params} onChange={set('params')} placeholder="bang_nguon · bieu_thuc_tong · sai_so_cho_phep" />
              </Field>
              <Field label="Câu SQL kiểm tra" required hint="Dùng biến trong ngoặc nhọn: {bang} {cot} {bang_nguon} {bang_dich}">
                <TextArea rows={7} className="mono" value={f.sql} onChange={set('sql')} placeholder={'SELECT\n  (SELECT SUM({cot}) FROM {bang_dich}) -\n  (SELECT SUM({cot}) FROM {bang_nguon}) AS chenh_lech'} />
              </Field>
              <div>
                <SectionTitle>Xem trước câu SQL</SectionTitle>
                <CodeBlock dark>{f.sql || '-- chưa nhập câu SQL'}</CodeBlock>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Ngưỡng cảnh báo (%)" required hint="Dưới mức này thì hiện màu vàng">
                  <TextInput type="number" value={f.warn} onChange={set('warn')} />
                </Field>
                <Field label="Ngưỡng nghiêm trọng (%)" required hint="Dưới mức này thì sinh sự cố mức Nghiêm trọng">
                  <TextInput type="number" value={f.crit} onChange={set('crit')} />
                </Field>
              </div>
              <SectionTitle>Ngưỡng ba cấp — thứ tự ưu tiên khi chạy</SectionTitle>
              <DataTable
                dense
                rows={[
                  { level: '① Theo lần gán', who: 'Người gán luật cho một cột cụ thể', when: 'Ưu tiên cao nhất — ghi đè mọi cấp dưới', example: 'so_dien_thoai của bảng đối soát: cảnh báo 99%, nghiêm trọng 97%' },
                  { level: '② Theo bảng', who: 'Đầu mối nghiệp vụ của bảng', when: 'Áp cho mọi luật cùng loại trên bảng đó', example: 'Bảng Tier 1: nâng ngưỡng lên 99,5%' },
                  { level: '③ Toàn cục', who: 'Khai ở màn này', when: 'Dùng khi hai cấp trên không khai', example: `Cảnh báo ${f.warn}% · nghiêm trọng ${f.crit}%` },
                ]}
                columns={[
                  { key: 'level', label: 'Cấp ngưỡng', nowrap: true, render: r => <span className="font-bold text-blue-700">{r.level}</span> },
                  { key: 'who', label: 'Ai khai' },
                  { key: 'when', label: 'Khi nào áp dụng' },
                  { key: 'example', label: 'Ví dụ' },
                ]}
              />
              <Note tone="info" title="Vì sao cần ba cấp">
                Với {fmt(STATS.totalTables)} bảng, không thể khai ngưỡng riêng cho từng luật.
                Ngưỡng toàn cục phủ phần lớn trường hợp; hai cấp trên chỉ dùng khi thực sự cần khác biệt.
              </Note>
            </div>
          )}
        </Panel>

        <Panel title="Xem trước loại kiểm tra">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="mono text-[12px] font-bold text-blue-700">{f.code || 'chua_dat_ma'}</div>
            <div className="mt-0.5 text-[13px] font-semibold text-slate-800">{f.name || 'chưa đặt tên'}</div>
            <div className="mt-1 text-[11.5px] text-slate-500">{f.description || 'chưa có mô tả'}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              <DimensionChip id={f.dimension} />
              <Chip tone={f.level === 'Cột' ? 'b' : 'p'}>{f.level}</Chip>
              <Chip tone="o">Tự tạo</Chip>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Ngưỡng: cảnh báo {f.warn}% · nghiêm trọng {f.crit}%</div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/quality/rules">Huỷ</ActionButton>
        <div className="flex gap-2">
          {step > 0 && <ActionButton variant="ghost" onClick={() => setStep(s => s - 1)}>Quay lại</ActionButton>}
          {step < 2
            ? <ActionButton onClick={() => setStep(s => s + 1)}>Tiếp tục</ActionButton>
            : <ActionButton disabled={!ok} onClick={() => save('Đã tạo loại kiểm tra')}>Lưu vào thư viện</ActionButton>}
        </div>
      </div>
    </>
  )
}

/* ═════════ 3.2 Bảng điều khiển chất lượng ═════════ */

export function QualityBoard() {
  const [q, setQ] = useState('')
  const [dim, setDim] = useState('')
  const [res, setRes] = useState('')
  const [pick, setPick] = useState<any>(null)
  const toast = useToast()

  const rows = useMemo(
    () => ruleInstances.filter(r =>
      (!dim || DIMENSIONS.find(d => d.label === dim)?.id === r.dimension) &&
      (!res || r.lastResult === res) &&
      match(`${r.id} ${r.ruleName} ${r.objectLabel} ${r.column ?? ''}`, q)),
    [q, dim, res]
  )

  const dimScores = DIMENSIONS.map(d => {
    const rs = ruleInstances.filter(r => r.dimension === d.id)
    const avg = rs.length ? Math.round(rs.reduce((a, r) => a + r.lastScore, 0) / rs.length) : 0
    return { ...d, score: avg, count: rs.length }
  })

  return (
    <>
      <PageHeader
        code="3.2"
        title="Luật & Kết quả"
        desc="Bảng điều khiển chất lượng theo 6 chiều — gán luật cho bảng, cột, báo cáo, chỉ tiêu và dữ liệu chủ"
        crumbs={[{ label: 'Data Quality' }, { label: 'Luật & Kết quả' }]}
        actions={
          <>
            <ActionButton variant="ghost" icon="run" onClick={() => toast.info('Đang chạy kiểm tra', 'Chạy lại toàn bộ luật đang bật — minh hoạ.')}>Chạy kiểm tra ngay</ActionButton>
            <ActionButton icon="plus" to="/quality/assign">Gán luật</ActionButton>
          </>
        }
      />

      <KpiRow
        items={[
          { label: 'Điểm chất lượng toàn hệ thống', value: STATS.qualityScore, sub: 'trên thang 100', tone: 'ok' },
          { label: 'Bảng đang được kiểm', value: `${STATS.tablesWithQuality}/${fmt(STATS.totalTables)}`, sub: 'chỉ 0,6% số bảng', tone: 'bad' },
          { label: 'Luật đang chạy', value: fmt(STATS.runningRules), sub: `${ruleInstances.filter(r => r.status === 'Đang chạy').length} luật đã khai chi tiết` },
          { label: 'Luật không đạt', value: ruleInstances.filter(r => r.lastResult === 'Không đạt').length, sub: 'sinh sự cố tự động', tone: 'bad' },
          { label: 'Luật cảnh báo', value: ruleInstances.filter(r => r.lastResult === 'Cảnh báo').length, sub: 'dưới ngưỡng cảnh báo', tone: 'warn' },
        ]}
      />

      <Note tone="warn" title="Con số 87 điểm chỉ tính trên 0,6% số bảng" className="mt-4">
        Điểm chất lượng toàn hệ thống <b>87/100</b> chỉ được tính trên <b>{STATS.tablesWithQuality} bảng</b> đang có luật.
        Còn lại <b>{fmt(STATS.totalTables - STATS.tablesWithQuality)} bảng</b> chưa kiểm tra lần nào — không biết tốt hay xấu.
      </Note>

      <Panel title="Điểm theo 6 chiều chất lượng" className="mt-4">
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          {dimScores.map(d => (
            <ProgressBar
              key={d.id}
              pct={d.score}
              target={90}
              label={<span className="flex items-center gap-1.5">{d.label} <span className="text-[10px] text-slate-400">({d.en})</span></span>}
              note={`${d.score}% · ${d.count} luật`}
            />
          ))}
        </div>
      </Panel>

      <div className="mt-4">
        <FilterBar
          placeholder="Tìm theo mã luật, tên loại kiểm tra, đối tượng…"
          value={q}
          onChange={setQ}
          filters={[
            { label: 'Chiều', options: DIMENSIONS.map(d => d.label), value: dim, onChange: setDim },
            { label: 'Kết quả', options: ['Đạt', 'Cảnh báo', 'Không đạt'], value: res, onChange: setRes },
          ]}
          right={<span className="text-[12px] text-slate-400">{rows.length} luật</span>}
        />
      </div>

      <DataTable
        stt
        rows={rows}
        rowKey={r => r.id}
        highlightRow={r => (r.lastResult === 'Không đạt' ? 'bad' : r.lastResult === 'Cảnh báo' ? 'warn' : undefined)}
        columns={[
          { key: 'id', label: 'Mã luật', nowrap: true, render: r => <span className="mono text-[12px] font-semibold">{r.id}</span> },
          {
            key: 'object', label: 'Đối tượng', width: '20%',
            render: r => (
              <div>
                <Chip tone={r.objectType === 'Bảng' ? 'b' : r.objectType === 'Cột' ? 'n' : r.objectType === 'Báo cáo' ? 'p' : r.objectType === 'Chỉ tiêu' ? 'p' : 't'}>{r.objectType}</Chip>
                <div className="mono mt-0.5 text-[11.5px]">
                  {r.objectType === 'Bảng' || r.objectType === 'Cột'
                    ? <EntityLink to={`/catalog/tables/${encodeURIComponent(r.objectId)}`}>{r.objectId}</EntityLink>
                    : r.objectLabel}
                  {r.column && <span className="text-slate-500">.{r.column}</span>}
                </div>
              </div>
            ),
          },
          { key: 'ruleName', label: 'Loại kiểm tra', width: '16%', render: r => <div><div className="font-semibold">{r.ruleName}</div><div className="mono text-[10.5px] text-slate-400">{r.params}</div></div> },
          { key: 'dimension', label: 'Chiều', nowrap: true, render: r => <DimensionChip id={r.dimension} /> },
          { key: 'trigger', label: 'Kích hoạt', nowrap: true, render: r => <div><Chip tone={r.trigger === 'Theo sự kiện' ? 'p' : r.trigger === 'Thủ công' ? 'n' : 'b'}>{r.trigger}</Chip><div className="mt-0.5 text-[10.5px] text-slate-400">{r.schedule}</div></div> },
          { key: 'threshold', label: 'Ngưỡng', nowrap: true, render: r => <div className="text-[11.5px]"><span className="text-amber-600">{r.warn}%</span> / <span className="text-red-600">{r.crit}%</span><div className="text-[10px] text-slate-400">{r.thresholdSource}</div></div> },
          { key: 'lastScore', label: 'Điểm', align: 'right', nowrap: true, render: r => <span className={r.lastScore >= r.warn ? 'font-bold text-emerald-600' : r.lastScore >= r.crit ? 'font-bold text-amber-600' : 'font-bold text-red-600'}>{r.lastScore}</span> },
          { key: 'trend', label: 'Xu hướng 7 ngày', nowrap: true, render: r => <MiniBars values={r.trend} threshold={r.crit} /> },
          { key: 'failed', label: 'Dòng lỗi', align: 'right', nowrap: true, render: r => (r.failedRows ? <span className="font-semibold text-red-600">{fmt(r.failedRows)}</span> : '—') },
          { key: 'severity', label: 'Mức độ', nowrap: true, render: r => <StatusChip value={r.severity} /> },
          { key: 'block', label: 'Chặn hạ nguồn', align: 'center', nowrap: true, render: r => (r.blockDownstream ? <Chip tone="r">Có</Chip> : <span className="text-slate-300">—</span>) },
          { key: 'lastResult', label: 'Kết quả', nowrap: true, render: r => <StatusChip value={r.lastResult} /> },
          { key: 'status', label: 'Trạng thái', nowrap: true, render: r => <Chip tone={r.status === 'Đang chạy' ? 'g' : r.status === 'Nháp' ? 'n' : 'o'}>{r.status}</Chip> },
          { key: 'act', label: '', align: 'right', nowrap: true, render: r => <RowActions><IconBtn icon="view" title="Chi tiết" onClick={() => setPick(r)} /><IconBtn icon="run" title="Chạy thử" onClick={() => toast.info('Đang chạy thử', `${r.id} — kết quả sẽ hiện sau ít giây (minh hoạ).`)} /></RowActions> },
        ]}
      />

      <Drawer open={!!pick} onClose={() => setPick(null)} title={pick?.ruleName} desc={pick && `${pick.id} · ${pick.objectLabel}${pick.column ? '.' + pick.column : ''}`} width={620}>
        {pick && (
          <div className="space-y-4">
            <InfoGrid
              items={[
                { label: 'Loại kiểm tra', value: `${ruleTypeById(pick.ruleTypeId)?.code ?? '—'}` },
                { label: 'Chiều chất lượng', value: <DimensionChip id={pick.dimension} /> },
                { label: 'Đối tượng áp dụng', value: `${pick.objectType} · ${pick.objectLabel}` },
                { label: 'Cột', value: pick.column ?? '(mức bảng)' },
                { label: 'Tham số', value: <span className="mono">{pick.params}</span>, full: true },
                { label: 'Ngưỡng cảnh báo', value: `${pick.warn}%` },
                { label: 'Ngưỡng nghiêm trọng', value: `${pick.crit}%` },
                { label: 'Nguồn ngưỡng', value: pick.thresholdSource },
                { label: 'Kích hoạt', value: `${pick.trigger} — ${pick.schedule}` },
                { label: 'Người sở hữu luật', value: pick.owner },
                { label: 'Lần chạy gần nhất', value: pick.lastRun },
                { label: 'Kết quả', value: <StatusChip value={pick.lastResult} /> },
                { label: 'Số dòng kiểm tra', value: fmt(pick.totalRows) },
                { label: 'Số dòng lỗi', value: fmt(pick.failedRows) },
                { label: 'Chặn job hạ nguồn', value: pick.blockDownstream ? 'Có — job đọc bảng này sẽ không chạy' : 'Không' },
              ]}
            />
            <div>
              <SectionTitle>Xu hướng 7 ngày</SectionTitle>
              <MiniBars values={pick.trend} threshold={pick.crit} height={48} />
            </div>
            <div className="flex gap-2">
              <ActionButton variant="soft" onClick={() => toast.info('Đang chạy kiểm tra', 'Kết quả sẽ cập nhật sau ít giây (minh hoạ).')}>Chạy lại ngay</ActionButton>
              <ActionButton variant="ghost" to="/quality/incidents">Xem sự cố liên quan</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      <NextStep
        done="gán luật chất lượng"
        steps={[
          { label: 'Xem sự cố đang mở', desc: 'Luật hỏng sinh phiếu tự động — 3.3', to: '/quality/incidents' },
          { label: 'Khai quy tắc cảnh báo', desc: 'Ai nhận thông báo khi luật hỏng — 3.4', to: '/quality/alerts' },
          { label: 'Chặn dữ liệu xấu tại cửa nạp', desc: 'Kiểm trước khi ghi vào bảng — 4.2', to: '/ingestion/templates' },
        ]}
      />
    </>
  )
}

/* ═════════ 3.2 Gán luật ═════════ */

export function RuleAssign() {
  const save = useDemoSave('/quality/board')
  const [sp] = useSearchParams()
  const [step, setStep] = useState(0)
  const [objType, setObjType] = useState<'Bảng' | 'Cột' | 'Báo cáo' | 'Chỉ tiêu' | 'Dữ liệu chủ'>((sp.get('object')?.startsWith('BC') ? 'Báo cáo' : sp.get('object')?.startsWith('CT') ? 'Chỉ tiêu' : 'Bảng'))
  const [objId, setObjId] = useState(sp.get('table') ?? sp.get('object') ?? 'bi.doi_soat_giao_dich_A')
  const [col, setCol] = useState(sp.get('col') ?? '')
  const [ruleTypeId, setRuleTypeId] = useState(sp.get('ruleType') ?? 'RL-05')
  const [params, setParams] = useState('')
  const [warn, setWarn] = useState('')
  const [crit, setCrit] = useState('')
  const [trigger, setTrigger] = useState<'Theo lịch' | 'Theo sự kiện' | 'Thủ công'>('Theo lịch')
  const [schedule, setSchedule] = useState('Hằng ngày 07:15')
  const [severity, setSeverity] = useState('Cao')
  const [actions, setActions] = useState<string[]>(['alert', 'incident'])

  const rt = ruleTypeById(ruleTypeId)
  const table = tableById(objId)
  const cols = table ? columnsOf(objId) : []
  const profiles = table ? profilesOf(objId) : []
  const suggestions = profiles.flatMap(p => p.suggestions.map(s => ({ ...s, column: p.column })))

  const STEP_LABELS = ['Chọn đối tượng', 'Chọn loại kiểm tra', 'Tham số', 'Ngưỡng & lịch', 'Hành động khi hỏng']

  const FAIL_ACTIONS = [
    { id: 'alert', label: 'Gửi cảnh báo', desc: 'Email · Telegram · SMS theo cấu hình ở menu 3.4' },
    { id: 'incident', label: 'Tạo phiếu sự cố', desc: 'Tự gán cho đầu mối nghiệp vụ của bảng, có hạn xử lý' },
    { id: 'block', label: 'Chặn job hạ nguồn', desc: 'Job đọc bảng này sẽ không chạy cho tới khi khắc phục' },
    { id: 'quarantine', label: 'Giữ lô ở vùng chờ', desc: 'Áp dụng khi luật gắn với cửa nạp dữ liệu' },
    { id: 'ticket', label: 'Tạo phiếu Jira', desc: 'Đẩy sang hệ thống quản lý công việc của đơn vị' },
  ]

  return (
    <>
      <PageHeader
        code="3.2"
        title="Gán luật kiểm tra chất lượng"
        desc="Áp một loại kiểm tra từ thư viện lên đối tượng cụ thể, kèm tham số, ngưỡng và hành động khi hỏng"
        crumbs={[{ label: 'Data Quality' }, { label: 'Luật & Kết quả', href: '/quality/board' }, { label: 'Gán luật' }]}
      />
      <Steps items={STEP_LABELS} current={step} onJump={setStep} />

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title={STEP_LABELS[step]}>
          {step === 0 && (
            <div className="space-y-4">
              <Field label="Loại đối tượng áp dụng" required hint="GĐ3 mục 3: bảng · cột · file · báo cáo · chỉ tiêu · dữ liệu chủ">
                <OptionCards
                  cols={3}
                  value={objType}
                  onChange={v => setObjType(v as any)}
                  options={[
                    { id: 'Bảng', label: 'Bảng dữ liệu', desc: 'Kiểm ở mức toàn bảng' },
                    { id: 'Cột', label: 'Cột dữ liệu', desc: 'Kiểm ở mức từng cột' },
                    { id: 'Báo cáo', label: 'Báo cáo', desc: 'Đối chiếu số liệu báo cáo' },
                    { id: 'Chỉ tiêu', label: 'Chỉ tiêu', desc: 'Biến động và tính nhất quán' },
                    { id: 'Dữ liệu chủ', label: 'Dữ liệu chủ', desc: 'Bản ghi chuẩn của MDM' },
                  ]}
                />
              </Field>

              <Field label="Đối tượng cụ thể" required>
                <SelectInput value={objId} onChange={e => setObjId(e.target.value)}>
                  {(objType === 'Báo cáo' ? reports.map(r => ({ v: r.id, l: `${r.id} — ${r.name}` }))
                    : objType === 'Chỉ tiêu' ? metrics.map(m => ({ v: m.id, l: `${m.id} — ${m.name}` }))
                    : objType === 'Dữ liệu chủ' ? [{ v: 'MDM-KH', l: 'MDM-KH — Khách hàng chuẩn' }, { v: 'MDM-SP', l: 'MDM-SP — Sản phẩm chuẩn' }]
                    : tables.map(t => ({ v: t.id, l: t.id }))
                  ).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </SelectInput>
              </Field>

              {objType === 'Cột' && (
                <Field label="Cột" required>
                  <SelectInput value={col} onChange={e => setCol(e.target.value)}>
                    <option value="">— Chọn cột —</option>
                    {cols.map(c => <option key={c.name} value={c.name}>{c.name} — {c.description}</option>)}
                  </SelectInput>
                </Field>
              )}

              {table && (
                <Note tone={table.tier === 'Tier 1' ? 'warn' : 'info'} title={`Hồ sơ bảng: ${table.id}`}>
                  <div className="grid grid-cols-4 gap-3 text-[12px]">
                    <div><b>Mức quan trọng</b><div>{table.tier ?? '— chưa gán'}</div></div>
                    <div><b>Số dòng</b><div>{fmt(table.rows)}</div></div>
                    <div><b>Luật hiện có</b><div>{table.ruleCount}</div></div>
                    <div><b>Báo cáo dùng</b><div>{table.consumerReports.length}</div></div>
                  </div>
                  {table.tier === 'Tier 1' && <div className="mt-2 font-semibold">Bảng Tier 1 bắt buộc có tối thiểu 5 luật phủ đủ 4 chiều chất lượng.</div>}
                </Note>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {!!suggestions.length && (
                <Note tone="info" title="Gợi ý từ kết quả phân tích dữ liệu (Profiling)">
                  <div className="mt-1.5 space-y-1.5">
                    {suggestions.slice(0, 4).map((s, i) => (
                      <div key={i} className="flex items-start gap-2 rounded border border-blue-200 bg-white px-2.5 py-1.5">
                        <DimensionChip id={s.dimension} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-semibold text-slate-700">{s.rule} <span className="mono text-[11px] text-slate-400">· {s.column}</span></div>
                          <div className="text-[11px] text-slate-500">{s.reason}</div>
                        </div>
                        <button
                          onClick={() => { const rtx = ruleTypes.find(r => r.name === s.rule); if (rtx) { setRuleTypeId(rtx.id); setCol(s.column); setObjType('Cột') } }}
                          className="shrink-0 text-[11.5px] font-semibold text-blue-600 hover:underline"
                        >
                          Dùng
                        </button>
                      </div>
                    ))}
                  </div>
                </Note>
              )}

              <Field label="Loại kiểm tra" required>
                <SelectInput value={ruleTypeId} onChange={e => setRuleTypeId(e.target.value)}>
                  {DIMENSIONS.map(d => (
                    <optgroup key={d.id} label={d.label}>
                      {ruleTypes.filter(r => r.dimension === d.id).map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                    </optgroup>
                  ))}
                </SelectInput>
              </Field>

              {rt && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="mono text-[12px] font-bold text-blue-700">{rt.code}</span>
                    <DimensionChip id={rt.dimension} />
                    <Chip tone={rt.level === 'Cột' ? 'b' : 'p'}>{rt.level}</Chip>
                    {rt.usage === 0 && <Chip tone="r">chưa dùng lần nào</Chip>}
                  </div>
                  <div className="mt-1.5 text-[12px] text-slate-600">{rt.description}</div>
                  <div className="mt-2"><CodeBlock dark>{rt.sqlTemplate}</CodeBlock></div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Note tone="info" title="Tham số phải khai cho loại kiểm tra này">
                <span className="mono">{rt?.params}</span>
              </Note>
              {rt?.code === 'format_regex' && (
                <Field label="Biểu thức chính quy" required hint="Ví dụ số điện thoại Việt Nam">
                  <TextInput mono value={params} onChange={e => setParams(e.target.value)} placeholder={'^(84|0)(3|5|7|8|9)[0-9]{8}$'} />
                </Field>
              )}
              {rt?.code === 'allowed_values' && (
                <Field label="Tập giá trị hợp lệ" required hint="Chọn danh mục tham chiếu hoặc gõ danh sách ngăn cách bằng dấu phẩy">
                  <SelectInput value={params} onChange={e => setParams(e.target.value)}>
                    <option value="">— Chọn nguồn giá trị —</option>
                    {refdata.map(r => <option key={r.id} value={r.id}>{r.id} — {r.name} ({r.recordCount} bản ghi)</option>)}
                  </SelectInput>
                </Field>
              )}
              {rt?.code === 'referential_integrity' && (
                <>
                  <Field label="Danh mục tham chiếu" required>
                    <SelectInput value={params} onChange={e => setParams(e.target.value)}>
                      <option value="">— Chọn danh mục —</option>
                      {refdata.map(r => <option key={r.id} value={r.id}>{r.id} — {r.name}</option>)}
                    </SelectInput>
                  </Field>
                  <Note tone="warn" title="Loại kiểm tra này hiện có lượt dùng bằng 0">
                    Cần mở API cho module Chất lượng gọi vào Danh mục tham chiếu (menu 1.5). Đây là việc <b>nối</b>, không phải xây mới.
                  </Note>
                </>
              )}
              {!['format_regex', 'allowed_values', 'referential_integrity'].includes(rt?.code ?? '') && (
                <Field label="Giá trị tham số" required hint={`Khai theo định dạng: ${rt?.params}`}>
                  <TextInput mono value={params} onChange={e => setParams(e.target.value)} placeholder="ví dụ: 1000 – 5000000000" />
                </Field>
              )}

              {!!table && !!col && (
                <Note tone="info" title="Nguồn gợi ý tham số">
                  <div className="mt-1 space-y-1 text-[12px]">
                    <div>• <b>Quy tắc nghiệp vụ</b> đã khai ở cột: {cols.find(c => c.name === col)?.businessRule ?? '— chưa khai'}</div>
                    <div>• <b>Tập giá trị</b> đã khai ở cột: {cols.find(c => c.name === col)?.valueSet?.join(', ') ?? '— chưa khai'}</div>
                    <div>• <b>Kết quả Profiling</b>: {profiles.find(p => p.column === col) ? `${profiles.find(p => p.column === col)!.distinct} giá trị phân biệt · ${profiles.find(p => p.column === col)!.nullPct}% rỗng` : '— chưa quét'}</div>
                  </div>
                </Note>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Ngưỡng cảnh báo (%)" hint={`Để trống sẽ dùng ngưỡng bảng hoặc toàn cục (${rt?.defaultWarn}%)`}>
                  <TextInput type="number" value={warn} onChange={e => setWarn(e.target.value)} placeholder={String(rt?.defaultWarn ?? '')} />
                </Field>
                <Field label="Ngưỡng nghiêm trọng (%)" hint={`Toàn cục: ${rt?.defaultCrit}%`}>
                  <TextInput type="number" value={crit} onChange={e => setCrit(e.target.value)} placeholder={String(rt?.defaultCrit ?? '')} />
                </Field>
              </div>

              <DataTable
                dense
                rows={[
                  { level: '① Theo lần gán', value: warn || crit ? `${warn || '—'}% / ${crit || '—'}%` : '— không khai', active: !!(warn || crit) },
                  { level: '② Theo bảng', value: table?.tier === 'Tier 1' ? '99,5% / 98%' : '— không khai', active: !(warn || crit) && table?.tier === 'Tier 1' },
                  { level: '③ Toàn cục', value: `${rt?.defaultWarn}% / ${rt?.defaultCrit}%`, active: !(warn || crit) && table?.tier !== 'Tier 1' },
                ]}
                columns={[
                  { key: 'level', label: 'Cấp ngưỡng', nowrap: true, render: r => <span className={r.active ? 'font-bold text-blue-700' : 'text-slate-500'}>{r.level}</span> },
                  { key: 'value', label: 'Cảnh báo / Nghiêm trọng', render: r => <span className={r.active ? 'font-semibold' : 'text-slate-400'}>{r.value}</span> },
                  { key: 'active', label: 'Áp dụng', align: 'center', nowrap: true, render: r => (r.active ? <Chip tone="g">Đang dùng</Chip> : <span className="text-slate-300">—</span>) },
                ]}
              />

              <Field label="Cách kích hoạt kiểm tra" info="rule.trigger" required hint="GĐ3 · FR-02: theo lịch · theo sự kiện · thủ công">
                <OptionCards
                  cols={3}
                  value={trigger}
                  onChange={v => setTrigger(v as any)}
                  options={[
                    { id: 'Theo lịch', label: 'Theo lịch', desc: 'Chạy đều đặn theo chu kỳ cố định' },
                    { id: 'Theo sự kiện', label: 'Theo sự kiện', desc: 'Chạy ngay khi job ghi xong bảng đích' },
                    { id: 'Thủ công', label: 'Thủ công', desc: 'Chỉ chạy khi người dùng bấm nút' },
                  ]}
                />
              </Field>

              {trigger === 'Theo lịch' && (
                <Field label="Lịch chạy" required>
                  <SelectInput value={schedule} onChange={e => setSchedule(e.target.value)}>
                    {RULE_SCHEDULES.map(s => <option key={s}>{s}</option>)}
                  </SelectInput>
                </Field>
              )}
              {trigger === 'Theo sự kiện' && (
                <Note tone="ok" title="Kích hoạt theo sự kiện">
                  Luật sẽ chạy <b>ngay sau khi {table?.producedByJob ?? 'job sinh bảng'} kết thúc thành công</b>.
                  Cách này phát hiện lỗi sớm hơn lịch cố định vài giờ — đúng yêu cầu <i>"phát hiện ngay khi phát sinh"</i> của GĐ3.
                </Note>
              )}

              <Field label="Mức độ nghiêm trọng" required>
                <SelectInput value={severity} onChange={e => setSeverity(e.target.value)}>{SEVERITIES.map(s => <option key={s}>{s}</option>)}</SelectInput>
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <Note tone="info" title="Chọn những gì xảy ra khi luật không đạt">
                Có thể chọn nhiều hành động cùng lúc. Đây là điểm khác biệt giữa <i>cảnh báo</i> và <i>cổng chặn</i>.
              </Note>
              {FAIL_ACTIONS.map(a => (
                <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-2.5 transition ${actions.includes(a.id) ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={actions.includes(a.id)}
                    onChange={() => setActions(p => (p.includes(a.id) ? p.filter(x => x !== a.id) : [...p, a.id]))}
                  />
                  <span>
                    <span className="block text-[13px] font-semibold text-slate-800">{a.label}</span>
                    <span className="block text-[11.5px] text-slate-500">{a.desc}</span>
                  </span>
                </label>
              ))}
              {actions.includes('block') && (
                <Note tone="warn" title="Chặn job hạ nguồn là hành động mạnh">
                  Khi luật này hỏng, <b>{jobsReadingTable(objId)} job</b> đọc bảng này sẽ không chạy.
                  Chỉ bật cho luật thực sự nghiêm trọng, và chỉ với bảng Tier 1.
                </Note>
              )}
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Tóm tắt luật sắp tạo">
            <InfoGrid
              cols={1}
              items={[
                { label: 'Đối tượng', value: <span className="mono text-[12px]">{objId}{col ? `.${col}` : ''}</span> },
                { label: 'Loại kiểm tra', value: rt?.name ?? '—' },
                { label: 'Chiều chất lượng', value: rt ? <DimensionChip id={rt.dimension} /> : '—' },
                { label: 'Tham số', value: <span className="mono text-[11.5px]">{params || '— chưa khai'}</span> },
                { label: 'Ngưỡng áp dụng', value: `${warn || rt?.defaultWarn}% / ${crit || rt?.defaultCrit}%` },
                { label: 'Kích hoạt', value: `${trigger}${trigger === 'Theo lịch' ? ` — ${schedule}` : ''}` },
                { label: 'Mức độ', value: <StatusChip value={severity} /> },
                { label: 'Hành động khi hỏng', value: <div className="flex flex-wrap gap-1">{actions.map(a => <Chip key={a} tone="b">{FAIL_ACTIONS.find(x => x.id === a)?.label}</Chip>)}</div> },
              ]}
            />
          </Panel>

          {table && (
            <Panel title="Độ phủ chất lượng của bảng">
              <ProgressBar pct={Math.min(100, (table.ruleCount / 8) * 100)} target={62} label="Số luật hiện có" note={`${table.ruleCount} luật · Tier 1 cần tối thiểu 5`} />
              <div className="mt-3 space-y-1.5">
                {DIMENSIONS.map(d => {
                  const has = ruleInstances.some(r => r.objectId === objId && r.dimension === d.id)
                  return (
                    <div key={d.id} className="flex items-center justify-between text-[12px]">
                      <span className="text-slate-600">{d.label}</span>
                      <Chip tone={has ? 'g' : 'r'}>{has ? 'Đã phủ' : 'Chưa phủ'}</Chip>
                    </div>
                  )
                })}
              </div>
            </Panel>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <ActionButton variant="ghost" to="/quality/board">Huỷ</ActionButton>
        <div className="flex gap-2">
          {step > 0 && <ActionButton variant="ghost" onClick={() => setStep(s => s - 1)}>Quay lại</ActionButton>}
          {step < 4
            ? <ActionButton onClick={() => setStep(s => s + 1)}>Tiếp tục</ActionButton>
            : <ActionButton onClick={() => save('Đã gán luật kiểm tra')}>Lưu và kích hoạt</ActionButton>}
        </div>
      </div>
    </>
  )
}

function jobsReadingTable(id: string) {
  return ['bi.doi_soat_giao_dich_A'].includes(id) ? 3 : 1
}
