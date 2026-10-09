import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Button, Input, Card, CardBody, Logo } from '../../../components';
import { loginPemerintah, getMe } from '../../../services/authService';
import { redirectAman } from '../../../utils/redirectAman';

export const LoginPemerintahPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTujuan = redirectAman(searchParams.get('redirect'));
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const tokenData = await loginPemerintah(email, password);
      const userData = await getMe(tokenData.access_token);
      
      if (userData.role !== 'admin' && userData.role !== 'dinas') {
          throw new Error('Hanya akun pengelola (admin/dinas) yang diizinkan masuk.');
      }
      
      login(userData, tokenData.access_token);
      navigate(redirectTujuan || '/dashboard');
    } catch (err) {
      setError(err.message || 'Gagal login, periksa kembali kredensial Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-4xl)', display: 'flex', justifyContent: 'center' }}>
      <Card style={{ maxWidth: '440px', width: '100%', boxShadow: 'var(--shadow-lg)' }}>
        <CardBody style={{ padding: 'var(--space-3xl)', textAlign: 'center' }}>
          <Logo size="lg" asLink={false} showSubtitle={false} style={{ justifyContent: 'center', marginBottom: 'var(--space-sm)' }} />

          <h2 className="h2" style={{ color: 'var(--color-text-main)', marginBottom: '8px' }}>
            Masuk Pengelola Ruang Publik
          </h2>
          <p className="text-small" style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2xl)' }}>
            Akses verifikasi laporan kondisi fasilitas ruang terbuka DKI Jakarta.
          </p>

          {error && (
            <div style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <Input
              label="Email Dinas / Akun Pengelola"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Kata Sandi"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" fullWidth size="lg" style={{ marginTop: 'var(--space-md)' }} disabled={isLoading}>
              {isLoading ? 'Memproses...' : 'Masuk ke Dashboard Admin →'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default LoginPemerintahPage;
