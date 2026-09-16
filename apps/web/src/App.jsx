import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import RequireAuth from './routes/RequireAuth';
import RequireAdmin from './routes/RequireAdmin';

// Feature Pages Imports - Public
import { HomePage, DaftarRuangPublikPage, DetailRuangPublikPage } from './features/ruang-publik';
import { FormLaporPage, RiwayatLaporanPage, DetailStatusLaporanPage } from './features/laporan';
import { LoginPage, LoginPemerintahPage } from './features/auth';

// Feature Pages Imports - Admin
import { DashboardPage, AntrianModerasiPage, DetailModerasiPage, PetugasLapanganPage } from './features/moderasi';
import { DataMasterPage, KelolaFasilitasPage } from './features/data-master';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect / ke /home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* LAYOUT PUBLIK (Phase 5 - 12) */}
        <Route element={<PublicLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/ruang-publik" element={<DaftarRuangPublikPage />} />
          <Route path="/ruang-publik/:id" element={<DetailRuangPublikPage />} />
          <Route path="/ruang-publik/:id/lapor" element={<FormLaporPage />} />
          
          <Route
            path="/laporan-saya"
            element={
              <RequireAuth>
                <RiwayatLaporanPage />
              </RequireAuth>
            }
          />
          <Route
            path="/laporan-saya/:id"
            element={
              <RequireAuth>
                <DetailStatusLaporanPage />
              </RequireAuth>
            }
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/login-pemerintah" element={<LoginPemerintahPage />} />
        </Route>

        {/* LAYOUT ADMIN / DASHBOARD (Phase 13 - 17) */}
        <Route
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/moderasi" element={<AntrianModerasiPage />} />
          <Route path="/dashboard/moderasi/:laporanId" element={<DetailModerasiPage />} />
          <Route path="/dashboard/data-master" element={<DataMasterPage />} />
          <Route path="/dashboard/fasilitas" element={<KelolaFasilitasPage />} />
          <Route path="/dashboard/petugas" element={<PetugasLapanganPage />} />
        </Route>

        {/* Fallback 404 */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
