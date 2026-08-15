import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';

import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { BillingPage } from '../features/billing/BillingPage';
import { SalesPage } from '../features/sales/SalesPage';
import { CustomersPage } from '../features/customers/CustomersPage';
import { SuppliersPage } from '../features/suppliers/SuppliersPage';
import { PurchasesPage } from '../features/purchases/PurchasesPage';
import { ReturnsPage } from '../features/returns/ReturnsPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { UsersPage } from '../features/users/UsersPage';
import { BackupPage } from '../features/backup/BackupPage';
import { SettingsPage } from '../features/settings/SettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="returns" element={<ReturnsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="backup" element={<BackupPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
