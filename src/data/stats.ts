/**
 * Số liệu chủ chốt — mọi màn phải đọc từ đây, không gõ thẳng trong trang.
 * Giữ đúng bảng số liệu tại DMP-Plan-Dung-Demo-FE.md mục 9.
 */
export const STATS = {
  // Danh mục
  totalTables: 11482,
  totalColumns: 214_836,
  tablesWithQuality: 64,
  tablesNoDomain: 4334,
  tablesNoOwner: 7578,
  tablesWithOwner: 3904,
  totalSystems: 27,
  totalChannels: 34,
  totalReports: 186,
  totalMetrics: 412,
  reportsTraceable: 58,

  // Chất lượng
  qualityScore: 87,
  totalRuleTypes: 28,
  runningRules: 795,
  falseAlarmPct: 18,
  falseAlarmRedLine: 25,

  // Nạp & điều phối
  totalJobs: 1842,
  jobTargetNotInCatalog: 214,
  ingestTemplates: 168,
  ingestWithGate: 0,

  // Bảo mật
  sensitiveColumns: 412,
  sensitiveBasic: 268,
  sensitiveHigh: 144,
  maskedColumns: 0,
  duplicateTablesForBranchAcl: 41,
  totalPolicies: 1847,
  policiesByGroup: 412,
  policiesByUser: 1435,
  policiesNoExpiry: 1612,
  policiesManualSource: 1409,
  leaversNotLocked: 9,
  leaverTableGrants: 132,

  // Quản trị
  glossaryTerms: 218,
  glossaryBound: 142,
  glossaryCde: 38,

  // Tuân thủ
  policyDocs: 12,
  complianceScore: 64,
  openFindings: 9,

  // MDM
  mdmModels: 4,
  mdmGolden: 1_284_500,
  mdmDuplicatesPending: 3182,
  mdmSystemsAdopted: 3,
  mdmSystemsTotal: 9,
}

export const pct = (a: number, b: number) => Math.round((a / b) * 1000) / 10

export const fmt = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : n.toLocaleString('vi-VN')

export const fmtShort = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + ' tr'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + ' N'
  return String(n)
}
