import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { RoleProvider } from '@/context/RoleContext';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppShell } from '@/layout/AppShell';
import { NotFound } from '@/pages/AccessDenied';
import { LandingPage } from '@/pages/LandingPage';
import { OverviewPage } from '@/pages/OverviewPage';
import { BookingsPage } from '@/pages/BookingsPage';
import { NewBookingPage } from '@/pages/NewBookingPage';
import { TruckPlansPage } from '@/pages/TruckPlansPage';
import { ShipmentTrackingPage } from '@/pages/ShipmentTrackingPage';
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
    <ThemeProvider>
      <AuthProvider>
        <RoleProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<LoginPage />} />

                {/* Authenticated Application Shell */}
                <Route element={<AppShell />}>
                  <Route path="admin/dashboard" element={<OverviewPage />} />
                  <Route path="overview" element={<OverviewPage />} />
                  <Route path="customer/dashboard" element={<OverviewPage />} />
                  <Route path="employee/dashboard" element={<OverviewPage />} />
                  <Route path="partner/dashboard" element={<OverviewPage />} />

                  {/* Freight & Logistics (TMS) */}
                  <Route path="bookings" element={<BookingsPage />} />
                  <Route path="bookings/new" element={<NewBookingPage />} />
                  <Route path="truck-plans" element={<TruckPlansPage />} />
                  <Route path="tracking" element={<ShipmentTrackingPage />} />
                  <Route path="tracking/:reference" element={<ShipmentTrackingPage />} />
                  <Route path="tms" element={<TmsPage />} />

                  {/* Workforce & Operations */}
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
      </AuthProvider>
    </ThemeProvider>
  );
}
