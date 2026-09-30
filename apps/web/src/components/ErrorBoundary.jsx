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
          backgroundColor: '#f8fafc',
          padding: '20px'
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '600px',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <AlertCircle size={48} color="#ef4444" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>
              Terjadi Kesalahan
            </h1>
            <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>
              Aplikasi mengalami kesalahan. Silakan refresh halaman atau hubungi tim support.
            </p>
            <details style={{ textAlign: 'left', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <summary style={{ cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
                Detail Error (untuk debugging)
              </summary>
              <pre style={{
                marginTop: '12px',
                fontSize: '12px',
                color: '#64748b',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#0f766e',
                color: 'white',
                padding: '10px 24px',
                borderRadius: '6px',
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
