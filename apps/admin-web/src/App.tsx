import { BrowserRouter, Route, Routes } from 'react-router-dom';
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

export default function App() {
  return (
    <RoleProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
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
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </RoleProvider>
  );
}
