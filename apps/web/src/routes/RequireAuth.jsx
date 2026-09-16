import React from 'react';

// Skeleton guard, logic auth belum diisi
const RequireAuth = ({ children }) => {
    // TODO: implement logic cek user dari AuthContext
    return <>{children}</>;
};

export default RequireAuth;
