import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { RoleProvider } from '@/context/RoleContext';
import { ToastProvider } from '@/context/ToastContext';
import { AppShell } from '@/layout/AppShell';
import { NotFound } from '@/pages/AccessDenied';
import { OverviewPage } from '@/pages/OverviewPage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { TasksPage } from '@/pages/TasksPage';
import { CreateTaskPage } from '@/pages/CreateTaskPage';
import { NearbyPage } from '@/pages/NearbyPage';
import { ChecklistsPage } from '@/pages/ChecklistsPage';
import { EvidencePage } from '@/pages/EvidencePage';
import { ApprovalsPage } from '@/pages/ApprovalsPage';
import { WalletPage } from '@/pages/WalletPage';
import { TmsPage } from '@/pages/TmsPage';
import { LoginPage } from '@/pages/LoginPage';

export default function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="login" element={<LoginPage />} />
              <Route element={<AppShell />}>
                <Route index element={<OverviewPage />} />
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="tasks/new" element={<CreateTaskPage />} />
                <Route path="nearby" element={<NearbyPage />} />
                <Route path="checklists" element={<ChecklistsPage />} />
                <Route path="evidence" element={<EvidencePage />} />
                <Route path="approvals" element={<ApprovalsPage />} />
                <Route path="wallet" element={<WalletPage />} />
                <Route path="tms" element={<TmsPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </RoleProvider>
    </AuthProvider>
  );
}
