import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg-main)',
          padding: '20px'
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '600px',
            backgroundColor: 'var(--color-surface)',
            padding: '40px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <AlertCircle size={48} color="var(--color-danger)" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-main)' }}>
              Terjadi Kesalahan
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
              Aplikasi mengalami kesalahan. Silakan refresh halaman atau hubungi tim support.
            </p>
            <details style={{ textAlign: 'left', backgroundColor: 'var(--color-neutral-light)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Detail Error (untuk debugging)
              </summary>
              <pre style={{
                marginTop: '12px',
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                padding: '10px 24px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              Refresh Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
