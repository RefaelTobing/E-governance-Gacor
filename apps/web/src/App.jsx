import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { routes } from './routes/route-config';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import RequireAuth from './routes/RequireAuth';
import RequireAdmin from './routes/RequireAdmin';

// Karena komponen halamannya belum ada, kita kasih fallback sementara
const Fallback = () => <div>Not Found / Placeholder</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<PublicLayout />}>
           {routes.filter(r => r.layout === 'public').map((route, i) => (
             <Route key={i} path={route.path} element={<Fallback />} />
           ))}
           {/* Fallback utama jika routes kosong */}
           <Route path="*" element={<Fallback />} />
        </Route>
        
        <Route element={<RequireAuth><RequireAdmin><AdminLayout /></RequireAdmin></RequireAuth>}>
           {routes.filter(r => r.layout === 'admin').map((route, i) => (
             <Route key={i} path={route.path} element={<Fallback />} />
           ))}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
