import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RequireAuth = ({ children }) => {
    const { user, token } = useAuth();
    const location = useLocation();

    if (!user || !token) {
        const isDashboard = location.pathname.startsWith('/dashboard');
        const tujuan = isDashboard ? '/login-pemerintah' : '/login';
        const redirect = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`${tujuan}?redirect=${redirect}`} replace />;
    }

    return <>{children}</>;
};

export default RequireAuth;
