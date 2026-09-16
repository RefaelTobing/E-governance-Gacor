import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Button, Input, Card, CardBody, Logo } from '../../../components';

export const LoginPemerintahPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('petugas@jakarta.go.id');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = (e) => {
    e.preventDefault();
    login({
      name: 'Drs. H. Hendra M. (Pengawas)',
      role: 'admin',
      email: email
    });
    navigate('/dashboard');
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
            <Button type="submit" variant="primary" fullWidth size="lg" style={{ marginTop: 'var(--space-md)' }}>
              Masuk ke Dashboard Admin →
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default LoginPemerintahPage;
