import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './pages/Login';
import DemoDashboard from './pages/DemoDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/demo" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/demo',
    element: (
      <ProtectedRoute>
        <DemoDashboard />
      </ProtectedRoute>
    ),
  },
  // Fallback for old routes to redirect to demo for now
  {
    path: '/artist/*',
    element: <Navigate to="/demo" replace />,
  },
  {
    path: '/admin/*',
    element: <Navigate to="/demo" replace />,
  }
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
