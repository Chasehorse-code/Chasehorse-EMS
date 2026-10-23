import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { RoleProvider } from '@/context/RoleContext';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppShell } from '@/layout/AppShell';
import { NotFound } from '@/pages/AccessDenied';
import { LandingPage } from '@/pages/LandingPage';
import { OverviewPage } from '@/pages/OverviewPage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { TasksPage } from '@/pages/TasksPage';
import { CreateTaskPage } from '@/pages/CreateTaskPage';
import { NearbyPage } from '@/pages/NearbyPage';
import { ChecklistsPage } from '@/pages/ChecklistsPage';
import { EvidencePage } from '@/pages/EvidencePage';
import { ApprovalsPage } from '@/pages/ApprovalsPage';
import { WalletPage } from '@/pages/WalletPage';
import { PendingApprovalPage } from '@/pages/PendingApprovalPage';
import { CustomerDashboardPage } from '@/pages/CustomerDashboardPage';
import { CustomerTrackingPage } from '@/pages/CustomerTrackingPage';
import { CustomerReportsPage } from '@/pages/CustomerReportsPage';
import { CustomerProfilePage } from '@/pages/CustomerProfilePage';
import { CustomerSupportPage } from '@/pages/CustomerSupportPage';
import { EmployeeDashboardPage } from '@/pages/EmployeeDashboardPage';
import { EmployeeProfilePage } from '@/pages/EmployeeProfilePage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RoleProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Public & Auth Routes (Deep links render LandingPage with matching modal open) */}
                <Route path="/" element={<LandingPage />} />
                <Route path="login" element={<LandingPage initialAuthView="login" />} />
                <Route path="register" element={<LandingPage initialAuthView="worker" />} />
                <Route path="register/worker" element={<LandingPage initialAuthView="worker" />} />
                <Route path="register/employee" element={<LandingPage initialAuthView="worker" />} />
                <Route path="register/customer" element={<LandingPage initialAuthView="customer" />} />
                <Route path="pending-approval" element={<PendingApprovalPage />} />

                {/* Authenticated Application Shell */}
                <Route element={<AppShell />}>
                  {/* Operations & Dashboards */}
                  <Route path="admin/dashboard" element={<OverviewPage />} />
                  <Route path="overview" element={<OverviewPage />} />
                  <Route path="customer/dashboard" element={<CustomerDashboardPage />} />
                  <Route path="customer/tracking" element={<CustomerTrackingPage />} />
                  <Route path="customer/reports" element={<CustomerReportsPage />} />
                  <Route path="customer/profile" element={<CustomerProfilePage />} />
                  <Route path="customer/support" element={<CustomerSupportPage />} />
                  <Route path="customer/history" element={<TasksPage />} />
                  <Route path="employee/dashboard" element={<EmployeeDashboardPage />} />
                  <Route path="employee/profile" element={<EmployeeProfilePage />} />

                  {/* Core Field Task Execution Engine */}
                  <Route path="nearby" element={<NearbyPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="tasks/new" element={<CreateTaskPage />} />
                  <Route path="checklists" element={<ChecklistsPage />} />
                  <Route path="evidence" element={<EvidencePage />} />
                  <Route path="approvals" element={<ApprovalsPage />} />
                  <Route path="employees" element={<EmployeesPage />} />
                  <Route path="wallet" element={<WalletPage />} />

                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </RoleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
