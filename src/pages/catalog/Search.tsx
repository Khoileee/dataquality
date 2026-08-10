import { useMemo, useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  PageHeader, Panel, Chip, StatusChip, DataTable, Note, EmptyState, KpiRow, ActionButton,
} from '@/components/common'
import { runSearch, SEARCH_KINDS, searchIndex, domains } from '@/data'
import { Search as SearchIcon } from 'lucide-react'

const KIND_TONE: Record<string, any> = {
  'Bảng dữ liệu': 'b', 'Cột dữ liệu': 'n', 'Hệ thống': 't', 'Kênh trao đổi': 't',
  'Báo cáo': 'p', 'Chỉ tiêu': 'p', 'Thuật ngữ': 'g', 'Nhãn phân loại': 'r',
  'Job': 'o', 'Danh mục tham chiếu': 'n', 'Nhóm bảng': 'n', 'Miền dữ liệu': 't',
  'Mô hình dữ liệu chủ': 'g',
}

const GOI_Y = ['doanh thu', 'đối soát', 'khách hàng', 'số điện thoại', 'chênh lệch', 'JOB-0412', 'CT-001']

export function CatalogSearch() {
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = useState(sp.get('q') ?? '')
  const [kinds, setKinds] = useState<string[]>([])
  const [domain, setDomain] = useState('')
  const [approval, setApproval] = useState('')

  useEffect(() => { setQ(sp.get('q') ?? '') }, [sp])

  const hits = useMemo(() => {
    let r = runSearch(q, kinds)
    if (domain) r = r.filter(h => h.domain === domain)
    if (approval) r = r.filter(h => h.approval === approval)
    return r
  }, [q, kinds, domain, approval])

  const facetCount = (kind: string) => runSearch(q).filter(h => h.kind === kind).length

  const toggleKind = (k: string) => setKinds(prev => (prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]))

  return (
    <>
      <PageHeader
        
        title="Tìm kiếm toàn hệ thống"
        desc="Một ô tìm cho mọi loại đối tượng — bảng, cột, hệ thống, kênh, báo cáo, chỉ tiêu, thuật ngữ, job, danh mục (yêu cầu GĐ2 · FR-04)"
        crumbs={[{ label: 'Data Catalog' }, { label: 'Tìm kiếm toàn hệ thống' }]}
      />

      <Panel className="mb-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={q}
            onChange={e => { setQ(e.target.value); setSp(e.target.value ? { q: e.target.value } : {}) }}
            placeholder="Gõ tên bảng, cột, chỉ tiêu, thuật ngữ, mã job…"
            className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 text-[15px] outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[12px] text-slate-400">
          Gợi ý:
          {GOI_Y.map(g => (
            <button key={g} onClick={() => { setQ(g); setSp({ q: g }) }} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700">
              {g}
            </button>
          ))}
        </div>
      </Panel>

      <KpiRow
        items={[
          { label: 'Đối tượng trong chỉ mục', value: searchIndex.length.toLocaleString('vi-VN'), sub: `${SEARCH_KINDS.length} loại đối tượng` },
          { label: 'Kết quả khớp', value: hits.length, sub: q ? `từ khoá "${q}"` : 'chưa nhập từ khoá', tone: 'info' },
          { label: 'Loại đang lọc', value: kinds.length || 'Tất cả', sub: kinds.join(', ') || 'không giới hạn' },
          { label: 'Thời gian phản hồi', value: '12 ms', sub: 'tìm kiếm phía trình duyệt' },
        ]}
      />

      <div className="mt-4 grid grid-cols-[240px_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4">
          <Panel title="Loại đối tượng">
            <div className="space-y-0.5">
              {SEARCH_KINDS.map(k => {
                const n = facetCount(k)
                return (
                  <button
                    key={k}
                    onClick={() => toggleKind(k)}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[12.5px] transition ${
                      kinds.includes(k) ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{k}</span>
                    <span className="ml-2 rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500">{n}</span>
                  </button>
                )
              })}
            </div>
            {!!kinds.length && (
              <button onClick={() => setKinds([])} className="mt-2 text-[11.5px] font-semibold text-blue-600 hover:underline">Bỏ lọc loại</button>
            )}
          </Panel>

          <Panel title="Miền dữ liệu">
            <select value={domain} onChange={e => setDomain(e.target.value)} className="h-9 w-full rounded-lg border border-slate-300 px-2 text-[12.5px]">
              <option value="">Tất cả miền</option>
              {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Panel>

          <Panel title="Trạng thái phê duyệt">
            <select value={approval} onChange={e => setApproval(e.target.value)} className="h-9 w-full rounded-lg border border-slate-300 px-2 text-[12.5px]">
              <option value="">Tất cả trạng thái</option>
              {['Dự thảo', 'Chờ phê duyệt', 'Yêu cầu chỉnh sửa', 'Đã phê duyệt', 'Ngừng sử dụng'].map(s => <option key={s}>{s}</option>)}
            </select>
          </Panel>

          <Note tone="info" title="Vì sao cần màn này">
            GĐ2 · FR-04 yêu cầu tìm kiếm theo tên, hệ thống, nhóm lĩnh vực và người phụ trách, lọc theo loại đối tượng, mức quan trọng và trạng thái.
            Không có ô tìm chung thì người dùng phải biết trước dữ liệu nằm ở menu nào.
          </Note>
        </div>

        <div>
          {hits.length ? (
            <div className="space-y-2">
              {hits.map(h => (
                <Link
                  key={`${h.kind}-${h.id}`}
                  to={h.href}
                  className="block rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip tone={KIND_TONE[h.kind] ?? 'n'}>{h.kind}</Chip>
                        <span className="truncate text-[13.5px] font-bold text-slate-800">{h.title}</span>
                      </div>
                      <div className="mt-1 line-clamp-2 text-[12px] text-slate-500">{h.subtitle}</div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {h.approval && <StatusChip value={h.approval} />}
                      {h.confidentiality && <Chip tone={h.confidentiality === 'Hạn chế truy cập' ? 'r' : h.confidentiality === 'Mật' ? 'o' : 'n'}>{h.confidentiality}</Chip>}
                      {h.owner && <span className="text-[11px] text-slate-400">{h.owner}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              text={q ? `Không tìm thấy đối tượng nào khớp "${q}"` : 'Nhập từ khoá để bắt đầu tìm kiếm'}
              action={q ? <ActionButton variant="ghost" onClick={() => { setQ(''); setKinds([]); setSp({}) }}>Xoá bộ lọc</ActionButton> : undefined}
            />
          )}
        </div>
      </div>
    </>
  )
}
