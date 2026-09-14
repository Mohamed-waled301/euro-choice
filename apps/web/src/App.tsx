import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { RecordsListPage } from './features/records/RecordsListPage';
import { PlanningTomorrowPage } from './features/planning/PlanningTomorrowPage';
import { ClientsListPage } from './features/clients/ClientsListPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { GlobalHistoryPage } from './features/history/GlobalHistoryPage';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="planning" element={<PlanningTomorrowPage />} />
        <Route path="records" element={<RecordsListPage />} />
        <Route path="clients" element={<ClientsListPage />} />
        <Route path="departments" element={<Navigate to="/settings?tab=departments" replace />} />
        <Route path="jobs" element={<Navigate to="/settings?tab=jobs" replace />} />
        <Route path="areas" element={<Navigate to="/settings?tab=areas" replace />} />
        <Route path="users" element={<Navigate to="/settings?tab=users" replace />} />
        <Route path="history" element={<GlobalHistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
