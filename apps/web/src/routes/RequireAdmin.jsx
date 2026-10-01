import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RequireAdmin = ({ children }) => {
    const { role } = useAuth();

    if (role !== 'admin' && role !== 'dinas') {
        return <Navigate to="/home" replace />;
    }

    return <>{children}</>;
};

export default RequireAdmin;
