import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Button, Input, Card, CardBody, Logo } from '../../../components';
import { loginPemerintah, getMe, registerWarga } from '../../../services/authService';
import { redirectAman } from '../../../utils/redirectAman';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRegisterParam = searchParams.get('mode') === 'register';
  const redirectTujuan = redirectAman(searchParams.get('redirect'));

  const [isRegister, setIsRegister] = useState(isRegisterParam);
  const { login } = useAuth();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isRegister) {
        await registerWarga({ name: nama, email, password });
        setSuccessMsg('Registrasi berhasil! Silakan masuk dengan akun Anda.');
        setEmail('');
        setPassword('');
        setNama('');
        setIsRegister(false);
        setIsLoading(false);
        return;
      }

      // Login Call
      const tokenData = await loginPemerintah(email, password);
      const token = tokenData.access_token;

      // Fetch current user details
      const userData = await getMe(token);

      login(userData, token);
      navigate(redirectTujuan || '/home');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-4xl)', display: 'flex', justifyContent: 'center' }}>
      <Card style={{ maxWidth: '460px', width: '100%', boxShadow: 'var(--shadow-lg)' }}>
        <CardBody style={{ padding: 'var(--space-3xl)' }}>
          {/* Header Branding */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
            <Logo size="lg" asLink={false} showSubtitle={false} style={{ justifyContent: 'center', marginBottom: 'var(--space-sm)' }} />
            <h2 className="h2" style={{ color: 'var(--color-text-main)' }}>
              {isRegister ? 'Daftar Akun Warga' : 'Masuk Warga Jakarta'}
            </h2>
            <p className="text-small" style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {isRegister
                ? 'Buat akun partisipasi warga untuk memantau & melaporkan kondisi fasilitas.'
                : 'Masuk ke akun Anda untuk memantau status laporan dan partisipasi.'}
            </p>
          </div>

          {/* Tab Mode Switch */}
          <div style={{ display: 'flex', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-md)', padding: '4px', marginBottom: 'var(--space-xl)' }}>
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: !isRegister ? 'var(--color-surface)' : 'transparent',
                color: !isRegister ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: !isRegister ? 'var(--shadow-sm)' : 'none'
              }}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: isRegister ? 'var(--color-surface)' : 'transparent',
                color: isRegister ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: isRegister ? 'var(--shadow-sm)' : 'none'
              }}
            >
              Daftar Baru
            </button>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div style={{ padding: '12px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', fontSize: '14px' }}>
              {successMsg}
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', fontSize: '14px' }}>
              {errorMsg}
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <Input
                  label="Nama Lengkap Sesuai KTP"
                  placeholder="Masukkan nama lengkap Anda"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                />
              </>
            )}

            <Input
              label="Email / Akun Pengguna"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Kata Sandi"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" fullWidth size="lg" style={{ marginTop: 'var(--space-md)' }} disabled={isLoading}>
              {isLoading ? 'Memproses...' : (isRegister ? 'Daftar Sekarang' : 'Masuk ke Platform')}
            </Button>
          </form>

          {/* Link Portal Pemerintah */}
          <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--color-border)' }}>
            <p className="text-caption">
              Petugas Pengelola / Admin Instansi Pemprov DKI?{' '}
              <Link to="/login-pemerintah" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                Masuk Portal Pemerintah
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default LoginPage;
