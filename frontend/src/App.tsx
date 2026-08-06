import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { MonitoringSourcesPage } from "@/features/monitoring-sources/components/MonitoringSourcesPage";
import { ApplicationsPage } from "@/features/applications/components/ApplicationsPage";
import { ApplicationDetailsPage } from "@/features/applications/components/ApplicationDetailsPage";
import { ComingSoonPage } from "@/pages/ComingSoonPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { IncidentDetailPage } from "@/pages/IncidentDetailPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="monitoring-sources" element={<MonitoringSourcesPage />} />
        <Route path="incidents/:incidentId" element={<IncidentDetailPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="applications/:id" element={<ApplicationDetailsPage />} />
        <Route path="components" element={<ComingSoonPage />} />
        <Route path="mappings" element={<ComingSoonPage />} />
        <Route path="alerts" element={<ComingSoonPage />} />
        <Route path="incidents" element={<ComingSoonPage />} />
        <Route path="correlation-groups" element={<ComingSoonPage />} />
        <Route path="search" element={<ComingSoonPage />} />
        <Route path="saved-views" element={<ComingSoonPage />} />
        <Route path="settings" element={<ComingSoonPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
