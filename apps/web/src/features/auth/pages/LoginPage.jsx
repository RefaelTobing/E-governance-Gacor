import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Button, Input, Card, CardBody, Logo } from '../../../components';
import { requestWithError } from '../../../utils/apiError';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRegisterParam = searchParams.get('mode') === 'register';

  const [isRegister, setIsRegister] = useState(isRegisterParam);
  const { login } = useAuth();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isRegister) {
        await requestWithError(
          'http://localhost:8000/api/v1/auth/register',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nama, email, password, role: 'warga' })
          },
          'Gagal mendaftar'
        );
      }

      // Login Call
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const loginRes = await requestWithError(
        'http://localhost:8000/api/v1/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        },
        'Email atau sandi salah'
      );

      const tokenData = await loginRes.json();
      const token = tokenData.access_token;
      
      // Fetch current user details
      let meRes;
      try {
        meRes = await fetch('http://localhost:8000/api/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch {
        throw new Error('Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.');
      }
      
      if (!meRes.ok) {
         throw new Error('Gagal mengambil data pengguna');
      }
      
      const userData = await meRes.json();
      
      login(userData, token);
      navigate('/home');
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
              onClick={() => { setIsRegister(false); setErrorMsg(''); }}
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
              onClick={() => { setIsRegister(true); setErrorMsg(''); }}
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
                <Input
                  label="Nomor WhatsApp / HP"
                  placeholder="0812xxxxxxxx"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
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
