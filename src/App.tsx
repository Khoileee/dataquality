import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Dashboard } from '@/pages/Dashboard'
import { DataCatalog } from '@/pages/DataCatalog'
import { DataSourceDetail } from '@/pages/DataCatalog/DataSourceDetail'
import { Profiling } from '@/pages/Profiling'
import { ProfilingDetail } from '@/pages/Profiling/ProfilingDetail'
import { Rules } from '@/pages/Rules'
import { Schedules } from '@/pages/Schedules'
import { Thresholds } from '@/pages/Thresholds'
import { Issues } from '@/pages/Issues'
import { IssueDetail } from '@/pages/Issues/IssueDetail'
import { Reports } from '@/pages/Reports'
import { Notifications } from '@/pages/Notifications'
import { PipelinePage } from '@/pages/Pipeline'
import { DefaultRules } from '@/pages/Settings/DefaultRules'
import { DefaultSchedules } from '@/pages/Settings/DefaultSchedules'
import { UserManagement } from '@/pages/Settings/UserManagement'

function App() {
  return (
    <HashRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/data-catalog" element={<DataCatalog />} />
          <Route path="/data-catalog/:id" element={<DataSourceDetail />} />
          <Route path="/profiling" element={<Profiling />} />
          <Route path="/profiling/:id" element={<ProfilingDetail />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/thresholds" element={<Thresholds />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/issues/:id" element={<IssueDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/settings" element={<Navigate to="/settings/default-rules" replace />} />
          <Route path="/settings/default-rules" element={<DefaultRules />} />
          <Route path="/settings/default-schedules" element={<DefaultSchedules />} />
          <Route path="/settings/users" element={<UserManagement />} />
        </Routes>
      </MainLayout>
    </HashRouter>
  )
}

export default App
