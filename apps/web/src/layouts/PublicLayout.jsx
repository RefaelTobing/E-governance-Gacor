import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
    return (
        <div>
            <nav>Navbar Placeholder</nav>
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default PublicLayout;
