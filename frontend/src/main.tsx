import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './pages/Login';
import ArtistDashboard from './pages/ArtistDashboard';
import ReleaseWizard from './pages/ReleaseWizard';
import ReleaseDetails from './pages/ReleaseDetails';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnalytics from './pages/AdminAnalytics';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/artist',
    element: (
      <ProtectedRoute role="ARTIST">
        <ArtistDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/artist/new',
    element: (
      <ProtectedRoute role="ARTIST">
        <ReleaseWizard />
      </ProtectedRoute>
    )
  },
  {
    path: '/artist/release/:id',
    element: (
      <ProtectedRoute role="ARTIST">
        <ReleaseDetails />
      </ProtectedRoute>
    )
  },
  {
    path: '/artist/release/:id/edit',
    element: (
      <ProtectedRoute role="ARTIST">
        <ReleaseWizard />
      </ProtectedRoute>
    )
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute role="ADMIN">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/analytics',
    element: (
      <ProtectedRoute role="ADMIN">
        <AdminAnalytics />
      </ProtectedRoute>
    ),
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
