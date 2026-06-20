import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { OwnerRoute } from './OwnerRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../components/login/LoginPage';

const POSPage = lazy(() => import('../pages/POSPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const InventoryPage = lazy(() => import('../pages/InventoryPage'));
const TransactionsPage = lazy(() => import('../pages/TransactionsPage'));
const RewardsPage = lazy(() => import('../pages/RewardsPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const AuditPage = lazy(() => import('../pages/AuditPage'));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Owner-only routes
          {
            element: <OwnerRoute />,
            children: [
              { index: true, element: <Navigate to="/dashboard" replace /> },
              { path: 'dashboard', element: <DashboardPage /> },
              { path: 'inventory', element: <InventoryPage /> },
              { path: 'transactions', element: <TransactionsPage /> },
              { path: 'reports', element: <ReportsPage /> },
              { path: 'audit', element: <AuditPage /> },
            ],
          },
          // Staff-accessible routes
          { path: 'pos', element: <POSPage /> },
          { path: 'rewards', element: <RewardsPage /> },
          { index: true, element: <Navigate to="/pos" replace /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
