import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddRide from './pages/AddRide';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminSpending from './pages/AdminSpending';
import UserMonthlySpending from './pages/UserMonthlySpending';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="add-ride" element={<AddRide />} />
              <Route path="admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="admin/users" element={
                <ProtectedRoute requireAdmin>
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="admin/spending" element={
                <ProtectedRoute requireAdmin>
                  <AdminSpending />
                </ProtectedRoute>
              } />
              <Route path="admin/spending/:userId/monthly" element={
                <ProtectedRoute requireAdmin>
                  <UserMonthlySpending />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
