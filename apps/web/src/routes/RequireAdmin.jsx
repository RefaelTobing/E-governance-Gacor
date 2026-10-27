import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RequireAdmin = ({ children }) => {
    const { role } = useAuth();
    const location = useLocation();

    if (role !== 'admin' && role !== 'dinas') {
        // Samakan dengan RequireAuth: kirim ke login pengelola sambil menyimpan tujuan,
        // bukan membuang pengguna ke /home tanpa penjelasan (FE-23).
        const redirect = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login-pemerintah?redirect=${redirect}`} replace />;
    }

    return <>{children}</>;
};

export default RequireAdmin;
