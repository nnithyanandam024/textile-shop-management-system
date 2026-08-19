import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { SetupWizard } from './features/auth/SetupWizard';
import { LockScreenModal } from './features/auth/LockScreenModal';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

// Pages
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ProductsPage } from './features/products/ProductsPage';
import { InventoryPage } from './features/inventory/InventoryPage';
import { PosPage } from './features/pos/PosPage';
import { SalesHistoryPage } from './features/sales/SalesHistoryPage';
import { CategoriesPage } from './features/categories/CategoriesPage';
import { CustomersPage } from './features/customers/CustomersPage';
import { SuppliersPage } from './features/suppliers/SuppliersPage';
import { PurchasesPage } from './features/purchases/PurchasesPage';
import { ReturnsPage } from './features/returns/ReturnsPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { UsersPage } from './features/users/UsersPage';
import { BackupPage } from './features/backup/BackupPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { SystemHealthPage } from './features/settings/SystemHealthPage';
import { StaffListPage } from './features/staff/StaffListPage';
import { StaffProfilePage } from './features/staff/StaffProfilePage';
import { DepartmentListPage } from './features/staff/DepartmentListPage';
import { DesignationListPage } from './features/staff/DesignationListPage';
import { RoleListPage } from './features/roles/RoleListPage';
import { AttendancePage } from './features/attendance/AttendancePage';
import { ShiftListPage } from './features/shifts/ShiftListPage';
import { LeaveListPage } from './features/leave/LeaveListPage';
import { PayrollPage } from './features/payroll/PayrollPage';
import { PerformancePage } from './features/performance/PerformancePage';
import { DocumentsPage } from './features/documents/DocumentsPage';

const MainAppRouter: React.FC = () => {
  const { currentUser, isLoading, isLocked, setupRequired } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafc] flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#2818cf] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Initializing Texora Management System...</p>
      </div>
    );
  }

  if (setupRequired) {
    return <SetupWizard />;
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <>
      {isLocked && <LockScreenModal />}
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute permission="dashboard.view"><DashboardPage /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute permission="products.view"><ProductsPage /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute permission="products.manage"><CategoriesPage /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute permission="inventory.view"><InventoryPage /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute permission="billing.create"><PosPage /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute permission="sales.view"><SalesHistoryPage /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute permission="customers.view"><CustomersPage /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute permission="suppliers.view"><SuppliersPage /></ProtectedRoute>} />
          <Route path="/purchases" element={<ProtectedRoute permission="purchases.view"><PurchasesPage /></ProtectedRoute>} />
          <Route path="/returns" element={<ProtectedRoute permission="returns.create"><ReturnsPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute permission="reports.view"><ReportsPage /></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute permission="staff.view"><StaffListPage /></ProtectedRoute>} />
          <Route path="/staff/profile/:id" element={<ProtectedRoute permission="staff.view"><StaffProfilePage /></ProtectedRoute>} />
          <Route path="/staff/departments" element={<ProtectedRoute permission="staff.organization"><DepartmentListPage /></ProtectedRoute>} />
          <Route path="/staff/designations" element={<ProtectedRoute permission="staff.organization"><DesignationListPage /></ProtectedRoute>} />
          <Route path="/staff/attendance" element={<ProtectedRoute permission="attendance.view"><AttendancePage /></ProtectedRoute>} />
          <Route path="/staff/shifts" element={<ProtectedRoute permission="shift.view"><ShiftListPage /></ProtectedRoute>} />
          <Route path="/staff/leave" element={<ProtectedRoute permission="leave.view"><LeaveListPage /></ProtectedRoute>} />
          <Route path="/staff/payroll" element={<ProtectedRoute permission="payroll.view"><PayrollPage /></ProtectedRoute>} />
          <Route path="/staff/performance" element={<ProtectedRoute permission="performance.view"><PerformancePage /></ProtectedRoute>} />
          <Route path="/staff/documents" element={<ProtectedRoute permission="documents.view"><DocumentsPage /></ProtectedRoute>} />
          <Route path="/roles" element={<ProtectedRoute permission="role.view"><RoleListPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute permission="users.view"><UsersPage /></ProtectedRoute>} />
          <Route path="/backup" element={<ProtectedRoute permission="backup.create"><BackupPage /></ProtectedRoute>} />
          <Route path="/health" element={<ProtectedRoute permission="settings.view"><SystemHealthPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute permission="settings.view"><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>
    </>
  );
};

export function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <MainAppRouter />
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
