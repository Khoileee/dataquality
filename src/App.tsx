import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/common/Overlay'
import { UserProvider } from '@/app/UserContext'
import { EmptyState, ActionButton, PageHeader } from '@/components/common'

/* ① Data Catalog */
import { CatalogSearch } from '@/pages/catalog/Search'
import { TableList } from '@/pages/catalog/TableList'
import { TableCreate } from '@/pages/catalog/TableCreate'
import { TableDetail } from '@/pages/catalog/TableDetail'
import { SystemsPage, SystemDetail, SystemCreate } from '@/pages/catalog/Systems'
import { ChannelDetail, ChannelCreate } from '@/pages/catalog/Channels'
import { ReportList, ReportDetail, MetricDetail, ReportCreate, MetricCreate } from '@/pages/catalog/Reports'
import { GroupList, GroupCreate, DomainList, DomainCreate, RefdataList, RefdataDetail, RefdataCreate } from '@/pages/catalog/Basics'

/* ② Governance */
import { GlossaryList, GlossaryDetail, GlossaryCreate } from '@/pages/governance/Glossary'
import { Classification, ClassificationCreate } from '@/pages/governance/Classification'
import { LineagePage, LineageCreate } from '@/pages/governance/Lineage'
import { Approvals } from '@/pages/governance/Approvals'

/* ③ Data Quality */
import { RuleLibrary, RuleCreate, QualityBoard, RuleAssign } from '@/pages/quality/Rules'
import { IncidentList, IncidentDetail } from '@/pages/quality/Incidents'
import { AlertList, AlertCreate } from '@/pages/quality/Misc'

/* ④ Nạp & Điều phối */
import { JobList, JobDetail, JobCreate } from '@/pages/orchestration/Jobs'
import { TemplateList, TemplateDetail, TemplateCreate, Quarantine, PipelineMonitor } from '@/pages/orchestration/Ingestion'

/* ⑤ Data Security */
import { UserList } from '@/pages/security/Users'
import { Policies, MaskCreate, RowFilterCreate } from '@/pages/security/Policies'
import { RequestList, RequestCreate, RequestApprove } from '@/pages/security/Requests'
import { AuditLog } from '@/pages/security/Audit'

/* ⑥ Chính sách & Tuân thủ */
import { PolicyList, PolicyDetail, PolicyCreate, Lifecycle, AssessmentList, AssessmentDetail } from '@/pages/compliance/Compliance'

/* ⑦ Dữ liệu chủ */
import { MdmModelList, MdmModelDetail, MdmModelCreate, MdmRecords } from '@/pages/mdm/Mdm'

/* ⑧ Operations */
import { Health, Settings } from '@/pages/operations/Operations'

function NotFound() {
  return (
    <>
      <PageHeader title="Không tìm thấy trang" desc="Đường dẫn bạn truy cập không tồn tại trong bản demo này" />
      <EmptyState text="Trang không tồn tại" action={<ActionButton to="/operations/health">Về bảng điều khiển</ActionButton>} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <ToastProvider>
          <AppShell>
            <Routes>
              <Route path="/" element={<Navigate to="/operations/health" replace />} />

              {/* ① DATA CATALOG */}
              <Route path="/catalog" element={<Navigate to="/catalog/tables" replace />} />
              <Route path="/catalog/search" element={<CatalogSearch />} />
              <Route path="/catalog/tables" element={<TableList />} />
              <Route path="/catalog/tables/create" element={<TableCreate />} />
              <Route path="/catalog/tables/:id" element={<TableDetail />} />
              <Route path="/catalog/tables/:id/:tab" element={<TableDetail />} />
              <Route path="/catalog/systems" element={<SystemsPage />} />
              <Route path="/catalog/systems/channels" element={<SystemsPage />} />
              <Route path="/catalog/systems/create" element={<SystemCreate />} />
              <Route path="/catalog/systems/:id" element={<SystemDetail />} />
              <Route path="/catalog/channels" element={<Navigate to="/catalog/systems/channels" replace />} />
              <Route path="/catalog/channels/create" element={<ChannelCreate />} />
              <Route path="/catalog/channels/:id" element={<ChannelDetail />} />
              <Route path="/catalog/reports" element={<ReportList />} />
              <Route path="/catalog/reports/create" element={<ReportCreate />} />
              <Route path="/catalog/reports/metrics/create" element={<MetricCreate />} />
              <Route path="/catalog/reports/metrics/:id" element={<MetricDetail />} />
              <Route path="/catalog/reports/:id" element={<ReportDetail />} />
              <Route path="/catalog/groups" element={<GroupList />} />
              <Route path="/catalog/groups/create" element={<GroupCreate />} />
              <Route path="/catalog/domains" element={<DomainList />} />
              <Route path="/catalog/domains/create" element={<DomainCreate />} />
              <Route path="/catalog/refdata" element={<RefdataList />} />
              <Route path="/catalog/refdata/create" element={<RefdataCreate />} />
              <Route path="/catalog/refdata/:id" element={<RefdataDetail />} />

              {/* ② GOVERNANCE */}
              <Route path="/governance" element={<Navigate to="/governance/glossary" replace />} />
              <Route path="/governance/glossary" element={<GlossaryList />} />
              <Route path="/governance/glossary/create" element={<GlossaryCreate />} />
              <Route path="/governance/glossary/:id" element={<GlossaryDetail />} />
              <Route path="/governance/classification" element={<Classification />} />
              <Route path="/governance/classification/create" element={<ClassificationCreate />} />
              <Route path="/governance/lineage" element={<LineagePage />} />
              <Route path="/governance/lineage/create" element={<LineageCreate />} />
              <Route path="/governance/approvals" element={<Approvals />} />
              <Route path="/governance/standard" element={<Navigate to="/operations/settings" replace />} />

              {/* ③ DATA QUALITY */}
              <Route path="/quality" element={<Navigate to="/quality/board" replace />} />
              <Route path="/quality/rules" element={<RuleLibrary />} />
              <Route path="/quality/rules/create" element={<RuleCreate />} />
              <Route path="/quality/board" element={<QualityBoard />} />
              <Route path="/quality/assign" element={<RuleAssign />} />
              <Route path="/quality/profiling" element={<Navigate to="/catalog/tables/bi.doi_soat_giao_dich_A/columns" replace />} />
              <Route path="/quality/incidents" element={<IncidentList />} />
              <Route path="/quality/incidents/:id" element={<IncidentDetail />} />
              <Route path="/quality/alerts" element={<AlertList />} />
              <Route path="/quality/alerts/create" element={<AlertCreate />} />

              {/* ④ NẠP & ĐIỀU PHỐI */}
              <Route path="/orchestration" element={<Navigate to="/orchestration/jobs" replace />} />
              <Route path="/orchestration/jobs" element={<JobList />} />
              <Route path="/orchestration/jobs/create" element={<JobCreate />} />
              <Route path="/orchestration/jobs/:id" element={<JobDetail />} />
              <Route path="/orchestration/jobs/:id/:tab" element={<JobDetail />} />
              <Route path="/orchestration/monitor" element={<PipelineMonitor />} />
              <Route path="/ingestion" element={<Navigate to="/ingestion/templates" replace />} />
              <Route path="/ingestion/templates" element={<TemplateList />} />
              <Route path="/ingestion/templates/create" element={<TemplateCreate />} />
              <Route path="/ingestion/quarantine" element={<Quarantine />} />
              <Route path="/ingestion/templates/:id" element={<TemplateDetail />} />

              {/* ⑤ DATA SECURITY */}
              <Route path="/security" element={<Navigate to="/security/users" replace />} />
              <Route path="/security/users" element={<UserList />} />
              <Route path="/security/policies" element={<Navigate to="/security/policies/data" replace />} />
              <Route path="/security/policies/mask/create" element={<MaskCreate />} />
              <Route path="/security/policies/rowfilter/create" element={<RowFilterCreate />} />
              <Route path="/security/policies/:tab" element={<Policies />} />
              <Route path="/security/requests" element={<RequestList />} />
              <Route path="/security/requests/create" element={<RequestCreate />} />
              <Route path="/security/requests/:id" element={<RequestApprove />} />
              <Route path="/security/audit" element={<AuditLog />} />
              <Route path="/security/report" element={<Navigate to="/security/policies/report" replace />} />

              {/* ⑥ CHÍNH SÁCH & TUÂN THỦ */}
              <Route path="/compliance" element={<Navigate to="/compliance/policies" replace />} />
              <Route path="/compliance/policies" element={<PolicyList />} />
              <Route path="/compliance/policies/create" element={<PolicyCreate />} />
              <Route path="/compliance/policies/:id" element={<PolicyDetail />} />
              <Route path="/compliance/lifecycle" element={<Lifecycle />} />
              <Route path="/compliance/assessments" element={<AssessmentList />} />
              <Route path="/compliance/assessments/:id" element={<AssessmentDetail />} />

              {/* ⑦ DỮ LIỆU CHỦ */}
              <Route path="/mdm" element={<Navigate to="/mdm/models" replace />} />
              <Route path="/mdm/models" element={<MdmModelList />} />
              <Route path="/mdm/models/create" element={<MdmModelCreate />} />
              <Route path="/mdm/models/:id" element={<MdmModelDetail />} />
              <Route path="/mdm/records" element={<MdmRecords />} />
              <Route path="/mdm/records/duplicates" element={<MdmRecords />} />
              <Route path="/mdm/records/golden" element={<MdmRecords />} />
              <Route path="/mdm/sources" element={<Navigate to="/mdm/records" replace />} />
              <Route path="/mdm/duplicates" element={<Navigate to="/mdm/records/duplicates" replace />} />
              <Route path="/mdm/golden" element={<Navigate to="/mdm/records/golden" replace />} />
              <Route path="/mdm/golden/:id" element={<Navigate to="/mdm/records/golden" replace />} />

              {/* ⑧ OPERATIONS */}
              <Route path="/operations" element={<Navigate to="/operations/health" replace />} />
              <Route path="/operations/health" element={<Health />} />
              <Route path="/operations/health/by-domain" element={<Health />} />
              <Route path="/operations/health/progress" element={<Health />} />
              <Route path="/operations/settings" element={<Settings />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </ToastProvider>
      </UserProvider>
    </BrowserRouter>
  )
}
