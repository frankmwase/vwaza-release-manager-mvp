import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
    children: React.ReactNode;
    role?: 'ARTIST' | 'ADMIN';
}

export default function ProtectedRoute({ children, role }: Props) {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (role && user?.role !== role) {
        // Redirect to their dashboard if wrong role
        return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/artist'} replace />;
    }

    return <>{children}</>;
}
