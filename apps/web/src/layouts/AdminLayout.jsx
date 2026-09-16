import React from 'react';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
    return (
        <div style={{ display: 'flex' }}>
            <aside>Sidebar Placeholder</aside>
            <main style={{ flex: 1 }}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
