import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RequireAuth = ({ children }) => {
    const { user, token } = useAuth();
    const location = useLocation();

    if (!user || !token) {
        const isDashboard = location.pathname.startsWith('/dashboard');
        return <Navigate to={isDashboard ? '/login-pemerintah' : '/login'} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default RequireAuth;
