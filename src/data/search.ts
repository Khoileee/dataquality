import { tables, systems, channels, reports, metrics, columns, refdata, groups, domains } from './catalog'
import { glossary, tags } from './governance'
import { jobs } from './orchestration'
import { mdmModels } from './mdm'

export type SearchHit = {
  id: string
  kind:
    | 'Bảng dữ liệu' | 'Cột dữ liệu' | 'Hệ thống' | 'Kênh trao đổi' | 'Báo cáo' | 'Chỉ tiêu'
    | 'Thuật ngữ' | 'Nhãn phân loại' | 'Job' | 'Danh mục tham chiếu' | 'Nhóm bảng'
    | 'Miền dữ liệu' | 'Mô hình dữ liệu chủ'
  title: string
  subtitle: string
  domain: string | null
  owner: string | null
  approval: string | null
  confidentiality: string | null
  href: string
  keywords: string
}

const norm = (s: string) =>
  s.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')

export const searchIndex: SearchHit[] = [
  ...tables.map(t => ({
    id: t.id, kind: 'Bảng dữ liệu' as const, title: t.id, subtitle: `${t.name} — ${t.description}`,
    domain: t.domain, owner: t.bda ?? t.de, approval: t.approval, confidentiality: t.confidentiality,
    href: `/catalog/tables/${encodeURIComponent(t.id)}`,
    keywords: norm(`${t.id} ${t.name} ${t.description} ${t.zone} ${t.format}`),
  })),
  ...columns.map(c => ({
    id: `${c.tableId}.${c.name}`, kind: 'Cột dữ liệu' as const, title: `${c.tableId}.${c.name}`,
    subtitle: `${c.description} · ${c.type}`, domain: null, owner: null, approval: null,
    confidentiality: c.confidentiality,
    href: `/catalog/tables/${encodeURIComponent(c.tableId)}/columns`,
    keywords: norm(`${c.tableId} ${c.name} ${c.description} ${c.tags.join(' ')}`),
  })),
  ...systems.map(s => ({
    id: s.id, kind: 'Hệ thống' as const, title: s.name, subtitle: `${s.id} · ${s.tech} — ${s.purpose}`,
    domain: null, owner: s.techOwner, approval: s.approval, confidentiality: null,
    href: `/catalog/systems/${s.id}`, keywords: norm(`${s.id} ${s.name} ${s.purpose} ${s.tech} ${s.unit}`),
  })),
  ...channels.map(c => ({
    id: c.id, kind: 'Kênh trao đổi' as const, title: c.name, subtitle: `${c.id} · ${c.kind} — ${c.purpose}`,
    domain: null, owner: c.owner, approval: c.approval, confidentiality: c.confidentiality,
    href: `/catalog/channels/${c.id}`, keywords: norm(`${c.id} ${c.name} ${c.purpose} ${c.kind} ${c.payload}`),
  })),
  ...reports.map(r => ({
    id: r.id, kind: 'Báo cáo' as const, title: r.name, subtitle: `${r.id} · ${r.tool} — ${r.description}`,
    domain: null, owner: r.owner, approval: r.approval, confidentiality: r.confidentiality,
    href: `/catalog/reports/${r.id}`, keywords: norm(`${r.id} ${r.name} ${r.description} ${r.purpose} ${r.ownerUnit}`),
  })),
  ...metrics.map(m => ({
    id: m.id, kind: 'Chỉ tiêu' as const, title: m.name, subtitle: `${m.id} · ${m.unit} — ${m.definition}`,
    domain: null, owner: m.owner, approval: m.approval, confidentiality: null,
    href: `/catalog/reports/metrics/${m.id}`, keywords: norm(`${m.id} ${m.name} ${m.definition} ${m.formula}`),
  })),
  ...glossary.map(g => ({
    id: g.id, kind: 'Thuật ngữ' as const, title: g.name, subtitle: `${g.id} · ${g.book} — ${g.definition}`,
    domain: null, owner: g.owner, approval: g.approval, confidentiality: null,
    href: `/governance/glossary/${g.id}`, keywords: norm(`${g.id} ${g.name} ${g.aliases.join(' ')} ${g.definition}`),
  })),
  ...tags.map(t => ({
    id: t.id, kind: 'Nhãn phân loại' as const, title: t.name, subtitle: `${t.id} · ${t.columnCount} cột — ${t.description}`,
    domain: null, owner: null, approval: null, confidentiality: t.defaultConfidentiality,
    href: `/governance/classification?tag=${t.id}`, keywords: norm(`${t.id} ${t.name} ${t.description}`),
  })),
  ...jobs.map(j => ({
    id: j.id, kind: 'Job' as const, title: j.id, subtitle: `${j.name} — ghi ${j.targetTable}`,
    domain: null, owner: j.de, approval: j.approval, confidentiality: null,
    href: `/orchestration/jobs/${j.id}`, keywords: norm(`${j.id} ${j.name} ${j.purpose} ${j.targetTable} ${j.group}`),
  })),
  ...refdata.map(r => ({
    id: r.id, kind: 'Danh mục tham chiếu' as const, title: r.name, subtitle: `${r.id} · ${r.recordCount} bản ghi`,
    domain: null, owner: r.owner, approval: r.approval, confidentiality: null,
    href: `/catalog/refdata/${r.id}`, keywords: norm(`${r.id} ${r.name} ${r.description}`),
  })),
  ...groups.map(g => ({
    id: g.id, kind: 'Nhóm bảng' as const, title: g.name, subtitle: `${g.id} · ${g.tableIds.length} bảng`,
    domain: null, owner: g.createdBy, approval: null, confidentiality: null,
    href: `/catalog/groups`, keywords: norm(`${g.id} ${g.name} ${g.description}`),
  })),
  ...domains.map(d => ({
    id: d.id, kind: 'Miền dữ liệu' as const, title: d.name, subtitle: `${d.id} · ${d.tableCount} bảng`,
    domain: d.id, owner: d.owner, approval: null, confidentiality: null,
    href: `/catalog/domains`, keywords: norm(`${d.id} ${d.name} ${d.description}`),
  })),
  ...mdmModels.map(m => ({
    id: m.id, kind: 'Mô hình dữ liệu chủ' as const, title: m.name, subtitle: `${m.id} · ${m.entity}`,
    domain: null, owner: m.owner, approval: m.approval, confidentiality: null,
    href: `/mdm/models/${m.id}`, keywords: norm(`${m.id} ${m.name} ${m.entity} ${m.codeRule}`),
  })),
]

export const SEARCH_KINDS = Array.from(new Set(searchIndex.map(h => h.kind)))

export function runSearch(q: string, kinds: string[] = []): SearchHit[] {
  const nq = norm(q.trim())
  let hits = searchIndex
  if (kinds.length) hits = hits.filter(h => kinds.includes(h.kind))
  if (!nq) return hits.slice(0, 60)
  return hits
    .filter(h => h.keywords.includes(nq))
    .sort((a, b) => {
      const ai = norm(a.title).indexOf(nq)
      const bi = norm(b.title).indexOf(nq)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
    .slice(0, 80)
}
