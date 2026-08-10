import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PageHeader, KpiRow, FilterBar, DataTable, CellTitle, CellStack, Panel, Note, Chip, StatusChip,
  TierChip, ActionButton, IconBtn, RowActions, EntityLink, InlineTabs, Drawer, InfoGrid,
  useToast, Modal, ProgressBar,
} from '@/components/common'
import { tables, domainName, systemById, STATS, fmt, columnsOf, reportsBackedBy } from '@/data'
import { match } from '@/lib/demo'
import { cn } from '@/lib/utils'
import type { TableRow } from '@/data/types'
import { NextStep } from '@/components/common'

const TABS = [
  { id: 'all', label: 'Tất cả bảng' },
  { id: 'mine', label: 'Bảng tôi phụ trách' },
  { id: 'incomplete', label: 'Chưa hoàn thiện hồ sơ' },
  { id: 'pending', label: 'Chờ duyệt' },
  { id: 'retired', label: 'Đã ngừng dùng' },
]

export function TableList() {
  const nav = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [domain, setDomain] = useState('')
  const [tier, setTier] = useState('')
  const [preview, setPreview] = useState<TableRow | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const rows = useMemo(() => {
    let r = tables
    if (tab === 'mine') r = r.filter(t => t.bda === 'Nguyễn Thị Phương' || t.de === 'Nguyễn Thị Phương')
    if (tab === 'incomplete') r = r.filter(t => !t.bda || !t.tier || !t.domain || !t.dataOwner)
    if (tab === 'pending') r = r.filter(t => t.approval === 'Chờ phê duyệt' || t.approval === 'Dự thảo' || t.approval === 'Yêu cầu chỉnh sửa')
    if (tab === 'retired') r = r.filter(t => t.lifecycle === 'Đã ngừng' || t.lifecycle === 'Sắp ngừng')
    if (domain) r = r.filter(t => domainName(t.domain) === domain)
    if (tier) r = r.filter(t => t.tier === tier)
    return r.filter(t => match(`${t.id} ${t.name} ${t.description}`, q))
  }, [tab, q, domain, tier])

  const incomplete = tables.filter(t => !t.bda || !t.tier || !t.domain || !t.dataOwner).length

  return (
    <>
      <PageHeader
        code="1.1"
        title="Bảng dữ liệu"
        desc="Nguồn sự thật duy nhất về bảng và cột. Mọi module khác tham chiếu mã bảng từ đây."
        crumbs={[{ label: 'Data Catalog' }, { label: 'Bảng dữ liệu' }]}
        actions={
          <>
            <ActionButton variant="ghost" icon="import" onClick={() => setImportOpen(true)}>Nạp từ file</ActionButton>
            <ActionButton variant="ghost" icon="export" onClick={() => toast.info('Xuất danh mục', 'Chức năng xuất Excel — minh hoạ.')}>Xuất</ActionButton>
            <ActionButton variant="ghost" icon="plus" to="/catalog/groups">Tạo nhóm bảng</ActionButton>
            <ActionButton icon="plus" to="/catalog/tables/create">Thêm bảng mới</ActionButton>
          </>
        }
      />

      <KpiRow
        items={[
          { label: 'Tổng số bảng', value: fmt(STATS.totalTables), sub: `${STATS.totalSystems} hệ thống nguồn` },
          { label: 'Chưa gán miền', value: fmt(STATS.tablesNoDomain), sub: '38% tổng số bảng', tone: 'bad' },
          { label: 'Chưa có người phụ trách', value: fmt(STATS.tablesNoOwner), sub: 'chỉ 34% đã có chủ', tone: 'bad' },
          { label: 'Đang kiểm chất lượng', value: `${STATS.tablesWithQuality}`, sub: '0,6% số bảng', tone: 'warn' },
          { label: 'Cột nhạy cảm', value: fmt(STATS.sensitiveColumns), sub: `${STATS.sensitiveHigh} mức cao`, tone: 'warn' },
        ]}
      />

      <div className="mt-4">
        <InlineTabs
          items={TABS.map(t => ({ ...t, badge: t.id === 'incomplete' ? incomplete : undefined }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      <FilterBar
        placeholder="Tìm theo tên bảng, mô tả nghiệp vụ…"
        value={q}
        onChange={setQ}
        filters={[
          { label: 'Miền', options: ['Kinh doanh', 'Doanh số', 'Khách hàng', 'Hồ sơ khách hàng', 'Giao dịch', 'Đối soát', 'Tài chính', 'Rủi ro & Tuân thủ'], value: domain, onChange: setDomain },
          { label: 'Mức QT', options: ['Tier 1', 'Tier 2', 'Tier 3'], value: tier, onChange: setTier },
        ]}
        right={<span className="text-[12px] text-slate-400">{rows.length} bảng</span>}
      />

      <DataTable
        stt
        rows={rows}
        rowKey={r => r.id}
        highlightRow={r => (!r.bda || !r.tier ? 'warn' : undefined)}
        columns={[
          {
            key: 'id', label: 'Tên bảng', width: '25%', min: 290, info: 'table.id',
            render: r => {
              const backs = reportsBackedBy(r.id)
              return (
                <CellTitle
                  title={
                    <span className="flex flex-wrap items-center gap-1.5">
                      <EntityLink to={`/catalog/tables/${encodeURIComponent(r.id)}`}>{r.id}</EntityLink>
                      {!!backs.length && <Chip tone="p" title={`Là bảng kết quả đầu ra của: ${backs.map(b => b.name).join(' · ')}`}>bảng báo cáo</Chip>}
                    </span>
                  }
                  sub={r.description}
                  warn={!r.dataOwner ? 'Chưa có Người sở hữu dữ liệu' : undefined}
                />
              )
            },
          },
          {
            key: 'system', label: 'Hệ thống · Miền', width: '15%', min: 180, info: 'table.systemId',
            render: r => (
              <CellStack
                top={systemById(r.systemId)?.name ?? '—'}
                bottom={r.domain ? <Chip tone="t">{domainName(r.domain)}</Chip> : <Chip tone="r">chưa gán miền</Chip>}
              />
            ),
          },
          { key: 'tier', label: 'Mức QT', min: 100, nowrap: true, info: 'table.tier', render: r => <TierChip tier={r.tier} /> },
          {
            key: 'owner', label: 'Người phụ trách', width: '15%', min: 175, info: 'table.bda',
            render: r => (
              <CellStack
                top={r.bda ?? <span className="font-semibold text-red-600">— chưa có BDA</span>}
                bottom={r.de ? <>DE: {r.de}</> : <span className="text-red-500">chưa có DE</span>}
                tone={r.bda ? undefined : 'danger'}
              />
            ),
          },
          {
            key: 'rows', label: 'Số dòng · Độ tươi', align: 'right', min: 130, nowrap: true, info: 'table.rows',
            render: r => (
              <div className="leading-snug">
                <div className="font-semibold text-slate-700">{fmt(r.rows)}</div>
                <div className={cn('text-[10.5px]', r.freshnessOk ? 'text-slate-400' : 'font-semibold text-red-600')}>{r.freshness}</div>
              </div>
            ),
          },
          {
            key: 'q', label: 'Chất lượng', align: 'center', min: 110, nowrap: true, info: 'table.qualityScore',
            render: r => r.qualityScore === null
              ? <CellStack top={<Chip tone="n">chưa kiểm</Chip>} bottom="0 luật" />
              : (
                <div className="leading-snug">
                  <div className={cn('text-[14px] font-extrabold', r.qualityScore >= 85 ? 'text-emerald-600' : r.qualityScore >= 70 ? 'text-amber-600' : 'text-red-600')}>{r.qualityScore}</div>
                  <div className="text-[10.5px] text-slate-400">{r.ruleCount} luật</div>
                </div>
              ),
          },
          {
            key: 'approval', label: 'Trạng thái', width: '12%', min: 135,
            render: r => <CellStack top={<StatusChip value={r.approval} />} bottom={<StatusChip value={r.lifecycle} />} />,
          },
          {
            key: 'act', label: '', align: 'right', min: 100, nowrap: true,
            render: r => (
              <RowActions>
                <IconBtn icon="view" title="Xem nhanh" onClick={() => setPreview(r)} />
                <IconBtn icon="edit" title="Sửa" to={`/catalog/tables/create?id=${encodeURIComponent(r.id)}`} />
                <IconBtn icon="open" title="Mở chi tiết" to={`/catalog/tables/${encodeURIComponent(r.id)}`} />
              </RowActions>
            ),
          },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Note tone="bad" title="Vấn đề lớn nhất: khai rồi để đó">
          {fmt(STATS.tablesNoOwner)} bảng không có người phụ trách. Khi dữ liệu hỏng, hệ thống <b>không biết gán sự cố cho ai</b> —
          đây chính là lý do sự cố <EntityLink to="/quality/incidents/SC-0229" mono={false}>SC-0229</EntityLink> đang ở trạng thái <i>Mới</i> mà chưa ai nhận.
        </Note>
        <Note tone="info" title="Khai ở đây, dùng ở đâu">
          Người phụ trách → tự gán sự cố ở <b>3.4</b> · Chu kỳ cập nhật → tự cảnh báo trễ ở <b>3.2</b> ·
          Nhãn cột → tự áp chính sách che ở <b>5.2</b> · Mức quan trọng → quyết định ngưỡng và SLA ở <b>8.2</b>.
        </Note>
      </div>

      <Drawer open={!!preview} onClose={() => setPreview(null)} title={preview?.id} desc={preview?.name}>
        {preview && (
          <div className="space-y-4">
            <InfoGrid
              items={[
                { label: 'Mô tả nghiệp vụ', value: preview.description, full: true },
                { label: 'Hệ thống', value: systemById(preview.systemId)?.name },
                { label: 'Miền dữ liệu', value: domainName(preview.domain) },
                { label: 'Mức quan trọng', value: <TierChip tier={preview.tier} /> },
                { label: 'Mức phân loại', value: <StatusChip value={preview.confidentiality} /> },
                { label: 'Người sở hữu dữ liệu', value: preview.dataOwner },
                { label: 'Đầu mối nghiệp vụ', value: preview.bda },
                { label: 'Đầu mối kỹ thuật', value: preview.de },
                { label: 'Chu kỳ cập nhật', value: preview.syncFrequency },
                { label: 'Số dòng', value: fmt(preview.rows) },
                { label: 'Dung lượng', value: `${preview.sizeGb} GB` },
                { label: 'Định dạng', value: preview.format },
                { label: 'Vòng đời', value: <StatusChip value={preview.lifecycle} /> },
              ]}
            />
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase text-slate-400">Độ hoàn thiện thông tin mô tả</div>
              <ProgressBar pct={preview.metadataScore} target={85} note={`${preview.metadataScore}% · mục tiêu 85%`} />
            </div>
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase text-slate-400">Cột ({columnsOf(preview.id).length} cột đã khai)</div>
              <div className="flex flex-wrap gap-1">
                {columnsOf(preview.id).map(c => (
                  <Chip key={c.name} tone={c.tags.length ? 'r' : 'n'} title={c.description}>{c.name}</Chip>
                ))}
                {!columnsOf(preview.id).length && <span className="text-[12px] text-slate-400">Chưa khai cột trong demo này</span>}
              </div>
            </div>
            <ActionButton to={`/catalog/tables/${encodeURIComponent(preview.id)}`}>Mở trang chi tiết đầy đủ</ActionButton>
          </div>
        )}
      </Drawer>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Nạp danh mục bảng từ file"
        desc="Đáp ứng yêu cầu GĐ2 mục 7 — tải lên bằng file để khởi tạo hoặc cập nhật hàng loạt"
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setImportOpen(false)}>Huỷ</ActionButton>
            <ActionButton onClick={() => { setImportOpen(false); toast.success('Đã tiếp nhận file', '18 dòng hợp lệ · 2 dòng lỗi — bản demo không ghi dữ liệu.') }}>
              Đối chiếu và nạp
            </ActionButton>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-8 text-center">
            <div className="text-[13px] font-semibold text-slate-600">Kéo thả file Excel/CSV vào đây</div>
            <div className="mt-1 text-[11.5px] text-slate-400">Hoặc bấm để chọn — tối đa 5.000 dòng mỗi lần</div>
          </div>
          <Note tone="info" title="Mẫu file chuẩn">
            Cột bắt buộc: <span className="mono">ten_bang · mo_ta · he_thong · mien · muc_quan_trong · nguoi_so_huu · dau_moi_nghiep_vu · dau_moi_ky_thuat · chu_ky_cap_nhat</span>.
            Hệ thống đối chiếu trước, hiện danh sách dòng lỗi rồi mới cho nạp.
          </Note>
          <DataTable
            dense
            rows={[
              { row: 3, col: 'mien', err: 'Giá trị "Kinh doanh - Bán lẻ" không có trong danh mục miền' },
              { row: 11, col: 'ten_bang', err: 'Tên bảng "BI_DoiSoat" không đúng chuẩn đặt tên CT-01' },
            ]}
            columns={[
              { key: 'row', label: 'Dòng', width: '70px' },
              { key: 'col', label: 'Cột', width: '140px', render: r => <span className="mono text-[12px]">{r.col}</span> },
              { key: 'err', label: 'Lỗi' },
            ]}
          />
        </div>
      </Modal>

      <NextStep
        done="khai bảng dữ liệu"
        steps={[
          { label: 'Gán luật chất lượng', desc: 'Bảng mới chưa có luật nào — 3.2', to: '/quality/board' },
          { label: 'Gắn nhãn cột nhạy cảm', desc: 'Để chính sách che tự áp — 2.2', to: '/governance/classification' },
          { label: 'Khai job sinh ra bảng', desc: 'Để có sơ đồ nguồn gốc — 4.1', to: '/orchestration/jobs' },
        ]}
      />
    </>
  )
}
