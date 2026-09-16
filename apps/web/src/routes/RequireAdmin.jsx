import React from 'react';

// Skeleton guard untuk prefix /dashboard
const RequireAdmin = ({ children }) => {
    // TODO: implement logic cek admin role dari AuthContext
    return <>{children}</>;
};

export default RequireAdmin;
