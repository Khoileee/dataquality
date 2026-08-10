import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PageHeader, Panel, Note, Steps, Field, TextInput, TextArea, SelectInput, Toggle,
  ActionButton, Chip, InfoGrid, SectionTitle,
} from '@/components/common'
import { domains, systems, tierDefinitions, namingRules } from '@/data'
import { STORAGE_ZONES, TABLE_FORMATS, SYNC_FREQUENCIES, CONFIDENTIALITY_NAMES, usersByRole } from '@/data/enums'
import { useDemoSave } from '@/lib/demo'

const STEP_LABELS = ['Thông tin chung', 'Trách nhiệm & Phân loại', 'Kỹ thuật & Chu kỳ', 'Xem lại và gửi duyệt']
const NAME_RE = /^[a-z][a-z0-9_.]{2,62}$/

export function TableCreate() {
  const [sp] = useSearchParams()
  const editing = sp.get('id')
  const save = useDemoSave('/catalog/tables')

  const [step, setStep] = useState(0)
  const [name, setName] = useState(editing ?? '')
  const [desc, setDesc] = useState('')
  const [systemId, setSystemId] = useState('HT-03')
  const [domain, setDomain] = useState('')
  const [tier, setTier] = useState('')
  const [owner, setOwner] = useState('')
  const [bda, setBda] = useState('')
  const [de, setDe] = useState('')
  const [conf, setConf] = useState('Nội bộ')
  const [zone, setZone] = useState('dwh')
  const [format, setFormat] = useState('Iceberg')
  const [freq, setFreq] = useState('Hằng ngày')
  const [sla, setSla] = useState('')
  const [lineage, setLineage] = useState(true)

  const nameInvalid = name.length > 0 && !NAME_RE.test(name)
  const tierDef = tierDefinitions.find(t => t.tier === tier)
  const requiredOk = !!name && !nameInvalid && !!desc && !!domain && !!tier && !!owner && !!bda && !!de

  return (
    <>
      <PageHeader
        code="1.1"
        title={editing ? `Sửa bảng ${editing}` : 'Thêm bảng dữ liệu mới'}
        desc="Bảng chưa có trong danh mục thì không gán được luật, không phân quyền được và job không ghi vào được (ràng buộc RB1, RB2)"
        crumbs={[{ label: 'Data Catalog' }, { label: 'Bảng dữ liệu', href: '/catalog/tables' }, { label: editing ? 'Sửa' : 'Thêm mới' }]}
      />

      <Steps items={STEP_LABELS} current={step} onJump={setStep} />

      <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-4 items-start">
        <Panel title={STEP_LABELS[step]}>
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Tên bảng"
                info="table.id"
                required
                full
                hint="Chữ thường, không dấu, phân cách bằng gạch dưới, có tiền tố vùng lưu trữ"
                error={nameInvalid ? 'Tên không đúng chuẩn CT-01: ^[a-z][a-z0-9_.]{2,62}$ — ví dụ đúng: bi.doi_soat_giao_dich_a' : undefined}
              >
                <TextInput mono invalid={nameInvalid} value={name} onChange={e => setName(e.target.value)} placeholder="bi.doi_soat_giao_dich_a" />
              </Field>
              <Field label="Mô tả nghiệp vụ" info="table.description" required full hint="Viết cho người nghiệp vụ đọc hiểu, không chép tên kỹ thuật">
                <TextArea rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Bảng đối soát giao dịch hằng ngày giữa hệ thống nội bộ và đối tác…" />
              </Field>
              <Field label="Hệ thống lưu trữ" info="table.systemId" required>
                <SelectInput value={systemId} onChange={e => setSystemId(e.target.value)}>
                  {systems.filter(s => s.status === 'Đang sử dụng').map(s => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
                </SelectInput>
              </Field>
              <Field label="Miền dữ liệu" info="table.domain" required hint="Bắt buộc — ràng buộc RB1">
                <SelectInput value={domain} onChange={e => setDomain(e.target.value)}>
                  <option value="">— Chọn miền —</option>
                  {domains.map(d => <option key={d.id} value={d.id}>{d.parentId ? '  ↳ ' : ''}{d.name}</option>)}
                </SelectInput>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Mức quan trọng (Tier)" info="table.tier" required full hint="Quyết định điều kiện bắt buộc, ngưỡng chất lượng và thời hạn xử lý sự cố">
                <SelectInput value={tier} onChange={e => setTier(e.target.value)}>
                  <option value="">— Chọn mức —</option>
                  {tierDefinitions.map(t => <option key={t.tier} value={t.tier}>{t.tier} — {t.name}</option>)}
                </SelectInput>
              </Field>
              {tierDef && (
                <div className="col-span-full">
                  <Note tone={tier === 'Tier 1' ? 'bad' : 'warn'} title={`Điều kiện bắt buộc của ${tier}`}>
                    <ul className="ml-4 list-disc space-y-0.5">
                      {tierDef.required.map(r => <li key={r}>{r}</li>)}
                    </ul>
                    <div className="mt-1.5 font-semibold">Cam kết xử lý: {tierDef.sla}</div>
                  </Note>
                </div>
              )}
              <Field label="Người sở hữu dữ liệu" info="table.dataOwner" required hint="Người phê duyệt định nghĩa và yêu cầu cấp quyền (GĐ1 mục 2.3)">
                <SelectInput value={owner} onChange={e => setOwner(e.target.value)}>
                  <option value="">— Chọn —</option>
                  {usersByRole('Người sở hữu dữ liệu').map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </SelectInput>
              </Field>
              <Field label="Mức phân loại" info="table.confidentiality" required hint="Trục bảo mật — độc lập với nhãn dữ liệu nhạy cảm">
                <SelectInput value={conf} onChange={e => setConf(e.target.value)}>
                  {CONFIDENTIALITY_NAMES.map(c => <option key={c}>{c}</option>)}
                </SelectInput>
              </Field>
              <Field label="Đầu mối nghiệp vụ (BDA)" info="table.bda" required>
                <SelectInput value={bda} onChange={e => setBda(e.target.value)}>
                  <option value="">— Chọn —</option>
                  {usersByRole('Đầu mối nghiệp vụ').map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </SelectInput>
              </Field>
              <Field label="Đầu mối kỹ thuật (DE)" info="table.de" required>
                <SelectInput value={de} onChange={e => setDe(e.target.value)}>
                  <option value="">— Chọn —</option>
                  {usersByRole('Đầu mối kỹ thuật').map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </SelectInput>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vùng lưu trữ" info="table.zone" required>
                <SelectInput value={zone} onChange={e => setZone(e.target.value)}>
                  {STORAGE_ZONES.map(z => <option key={z}>{z}</option>)}
                </SelectInput>
              </Field>
              <Field label="Định dạng lưu trữ" info="table.format" required>
                <SelectInput value={format} onChange={e => setFormat(e.target.value)}>
                  {TABLE_FORMATS.map(f => <option key={f}>{f}</option>)}
                </SelectInput>
              </Field>
              <Field label="Chu kỳ cập nhật" info="table.syncFrequency" required hint="Dùng để cảnh báo dữ liệu về trễ ở menu 3.2">
                <SelectInput value={freq} onChange={e => setFreq(e.target.value)}>
                  {SYNC_FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                </SelectInput>
              </Field>
              <Field label="Giờ cam kết dữ liệu sẵn sàng" hint="Để trống nếu không có cam kết cụ thể">
                <TextInput value={sla} onChange={e => setSla(e.target.value)} placeholder="07:00" />
              </Field>
              <div className="col-span-full">
                <Toggle
                  checked={lineage}
                  onChange={setLineage}
                  label="Cho phép quét quan hệ luồng dữ liệu tự động từ câu SQL của job"
                  disabled={tier === 'Tier 1'}
                  hint={tier === 'Tier 1' ? 'Bảng Tier 1 bắt buộc bật — không tắt được' : 'Mặc định bật để độ phủ lineage không bị thủng'}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <InfoGrid
                items={[
                  { label: 'Tên bảng', value: <span className="mono">{name || '—'}</span> },
                  { label: 'Hệ thống', value: systems.find(s => s.id === systemId)?.name },
                  { label: 'Miền dữ liệu', value: domains.find(d => d.id === domain)?.name },
                  { label: 'Mức quan trọng', value: tier || '—' },
                  { label: 'Mức phân loại', value: conf },
                  { label: 'Người sở hữu dữ liệu', value: owner || '—' },
                  { label: 'Đầu mối nghiệp vụ', value: bda || '—' },
                  { label: 'Đầu mối kỹ thuật', value: de || '—' },
                  { label: 'Chu kỳ cập nhật', value: `${freq}${sla ? ` — trước ${sla}` : ''}` },
                  { label: 'Vùng · Định dạng', value: `${zone} · ${format}` },
                  { label: 'Mô tả nghiệp vụ', value: desc || '—', full: true },
                ]}
              />
              <Note tone={requiredOk ? 'ok' : 'warn'} title={requiredOk ? 'Đủ điều kiện gửi duyệt' : 'Còn thiếu thông tin bắt buộc'}>
                {requiredOk
                  ? 'Sau khi gửi, bản ghi chuyển sang trạng thái Chờ phê duyệt và xuất hiện trong hàng đợi của Người sở hữu dữ liệu tại menu 2.4.'
                  : 'Nút gửi duyệt chỉ mở khi đã điền đủ tên hợp chuẩn, mô tả, miền, mức quan trọng và ba vai trò phụ trách.'}
              </Note>
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Chuẩn đặt tên đang áp dụng">
            <div className="space-y-2">
              {namingRules.slice(0, 3).map(r => (
                <div key={r.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-[11.5px] font-semibold text-slate-700">{r.object}</div>
                  <div className="mono mt-0.5 text-[11px] text-blue-700">{r.pattern}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">Ví dụ: <span className="mono">{r.example}</span></div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Ba ràng buộc cứng">
            <div className="space-y-2 text-[12px] leading-relaxed text-slate-600">
              <div><Chip tone="r">RB1</Chip> <span className="ml-1">Không khai được bảng nếu chưa chọn miền và mức quan trọng.</span></div>
              <div><Chip tone="r">RB2</Chip> <span className="ml-1">Bảng chưa có trong danh mục thì không gán luật, không phân quyền, job không ghi vào được.</span></div>
              <div><Chip tone="r">RB3</Chip> <span className="ml-1">Không áp được che dữ liệu nếu cột chưa gắn nhãn.</span></div>
            </div>
          </Panel>

          <Panel title="Xem trước hồ sơ">
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mono text-[12.5px] font-bold text-slate-800">{name || 'chưa đặt tên'}</div>
              <div className="mt-0.5 text-[11.5px] text-slate-500">{desc || 'chưa có mô tả'}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {domain && <Chip tone="t">{domains.find(d => d.id === domain)?.name}</Chip>}
                {tier && <Chip tone={tier === 'Tier 1' ? 'r' : tier === 'Tier 2' ? 'o' : 'n'}>{tier}</Chip>}
                <Chip tone={conf === 'Hạn chế truy cập' ? 'r' : conf === 'Mật' ? 'o' : conf === 'Nội bộ' ? 'b' : 'g'}>{conf}</Chip>
                <Chip tone="n">{zone}</Chip>
                <Chip tone="n">{format}</Chip>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <ActionButton variant="ghost" to="/catalog/tables">Huỷ</ActionButton>
        <div className="flex gap-2">
          {step > 0 && <ActionButton variant="ghost" onClick={() => setStep(s => s - 1)}>Quay lại</ActionButton>}
          {step < 3
            ? <ActionButton onClick={() => setStep(s => s + 1)}>Tiếp tục</ActionButton>
            : <ActionButton disabled={!requiredOk} onClick={() => save('Đã gửi phê duyệt', 'Bản ghi chuyển sang trạng thái Chờ phê duyệt.')}>Gửi phê duyệt</ActionButton>}
        </div>
      </div>
    </>
  )
}
