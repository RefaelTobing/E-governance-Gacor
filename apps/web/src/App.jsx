import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary, Spinner } from './components';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import AkunLayout from './layouts/AkunLayout';
import RequireAuth from './routes/RequireAuth';
import RequireAdmin from './routes/RequireAdmin';
import { routes } from './routes/route-config';

// Semua halaman di-load otomatis dari route-config (satu sumber kebenaran,
// CONVENTIONS.md §1.1). Vite men-split tiap halaman jadi chunk sendiri.
const pageModules = import.meta.glob('./features/**/pages/*.jsx');

// Cache React.lazy agar komponen tidak dibuat ulang (dan tidak remount) tiap render.
const lazyCache = {};
const getLazyPage = (componentPath) => {
  if (!componentPath) return null;
  if (!lazyCache[componentPath]) {
    const loader = pageModules[`./${componentPath}.jsx`];
    if (!loader) {
      console.error(`[route-config] Halaman tidak ditemukan: ${componentPath}`);
      return null;
    }
    lazyCache[componentPath] = React.lazy(loader);
  }
  return lazyCache[componentPath];
};

// Bungkus komponen sesuai flag proteksi pada config.
const elementForRoute = (route, { layoutHandlesAuth = false } = {}) => {
  const Page = getLazyPage(route.component);
  if (!Page) return null;

  const node = <Page />;

  // Layout admin/akun sudah membungkus auth di level layout; jangan dobel.
  if (layoutHandlesAuth) return node;

  if (route.role === 'admin') {
    return (
      <RequireAuth>
        <RequireAdmin>{node}</RequireAdmin>
      </RequireAuth>
    );
  }
  if (route.protected) {
    return <RequireAuth>{node}</RequireAuth>;
  }
  return node;
};

const renderRoutesForLayout = (layout, options = {}) =>
  routes
    .filter((r) => !r.redirectTo && r.layout === layout)
    .map((route) => (
      <Route key={route.path} path={route.path} element={elementForRoute(route, options)} />
    ));

const PageFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4xl) 0' }}>
    <Spinner size="lg" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Redirect statis (mis. "/" -> "/home") */}
            {routes
              .filter((r) => r.redirectTo)
              .map((r) => (
                <Route key={r.path} path={r.path} element={<Navigate to={r.redirectTo} replace />} />
              ))}

            {/* LAYOUT PUBLIK */}
            <Route element={<PublicLayout />}>
              {renderRoutesForLayout('public')}
            </Route>

            {/* LAYOUT AKUN WARGA (/profil) — auth di level layout */}
            <Route
              element={
                <RequireAuth>
                  <AkunLayout />
                </RequireAuth>
              }
            >
              {renderRoutesForLayout('akun', { layoutHandlesAuth: true })}
            </Route>

            {/* LAYOUT ADMIN (/dashboard) — auth + role di level layout */}
            <Route
              element={
                <RequireAuth>
                  <RequireAdmin>
                    <AdminLayout />
                  </RequireAdmin>
                </RequireAuth>
              }
            >
              {renderRoutesForLayout('admin', { layoutHandlesAuth: true })}
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
