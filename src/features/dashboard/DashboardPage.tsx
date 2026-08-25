import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { AiSalesAnalyticsModal } from '../../components/ai/AiSalesAnalyticsModal';
import { ExecutiveDashboardView } from './views/ExecutiveDashboardView';
import { ManagementDashboardView } from './views/ManagementDashboardView';
import { OperationsDashboardView } from './views/OperationsDashboardView';
import { BillingDashboardView } from './views/BillingDashboardView';
import { Navigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [kpis, setKpis] = useState<any>(null);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.dashboard) {
        const [kpiData, trendData, bestData, lowData, recentData] = await Promise.all([
          window.api.dashboard.getKPIs(),
          window.api.dashboard.getSalesTrend(7),
          window.api.dashboard.getBestSellers(5),
          window.api.dashboard.getLowStockAlerts(5),
          window.api.dashboard.getRecentTransactions(5),
        ]);

        setKpis(kpiData);
        setSalesTrend(trendData || []);
        setBestSellers(bestData || []);
        setLowStockAlerts(lowData || []);
        setRecentTx(recentData || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const role = (currentUser?.roleName || '').toLowerCase().trim();
  const isOwnerOrAdmin =
    currentUser?.roleId === 1 ||
    role.includes('owner') ||
    role.includes('admin') ||
    role.includes('super');

  const isManager = role.includes('manager');
  const isSupervisor = role.includes('supervisor') || role.includes('lead') || role.includes('floor');
  const isCashier = role.includes('cashier') || role.includes('billing');

  // If role is standard Staff, redirect to their Personal Work & Task Dashboard
  if (!isOwnerOrAdmin && !isManager && !isSupervisor && !isCashier) {
    return <Navigate to="/self-service/dashboard" replace />;
  }

  return (
    <>
      {/* 1. Admin / Owner -> Executive Business Dashboard */}
      {isOwnerOrAdmin && (
        <ExecutiveDashboardView
          kpis={kpis}
          salesTrend={salesTrend}
          bestSellers={bestSellers}
          lowStockAlerts={lowStockAlerts}
          recentTx={recentTx}
          loading={loading}
          onRefresh={fetchDashboardData}
          onOpenAnalytics={() => setShowAnalyticsModal(true)}
        />
      )}

      {/* 2. Manager -> Store Management Dashboard */}
      {!isOwnerOrAdmin && isManager && (
        <ManagementDashboardView
          kpis={kpis}
          salesTrend={salesTrend}
          bestSellers={bestSellers}
          lowStockAlerts={lowStockAlerts}
          recentTx={recentTx}
          loading={loading}
          onRefresh={fetchDashboardData}
          onOpenAnalytics={() => setShowAnalyticsModal(true)}
        />
      )}

      {/* 3. Supervisor -> Floor Operations Dashboard */}
      {!isOwnerOrAdmin && !isManager && isSupervisor && (
        <OperationsDashboardView
          kpis={kpis}
          lowStockAlerts={lowStockAlerts}
          recentTx={recentTx}
          loading={loading}
          onRefresh={fetchDashboardData}
        />
      )}

      {/* 4. Cashier -> Billing Register Dashboard */}
      {!isOwnerOrAdmin && !isManager && !isSupervisor && isCashier && (
        <BillingDashboardView
          kpis={kpis}
          recentTx={recentTx}
          loading={loading}
          onRefresh={fetchDashboardData}
        />
      )}

      {/* AI Deep Dive Sales Analytics Modal */}
      {showAnalyticsModal && (
        <AiSalesAnalyticsModal
          isOpen={showAnalyticsModal}
          onClose={() => setShowAnalyticsModal(false)}
        />
      )}
    </>
  );
};
