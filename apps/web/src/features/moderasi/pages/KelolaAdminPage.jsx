import React, { useState, useEffect } from 'react';
import { Button, Card, CardBody, EmptyState, Skeleton, Input } from '../../../components';
import api from '../../../config/api';

export const KelolaAdminPage = () => {
  const [adminList, setAdminList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', password: '' });

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/api/v1/users', { include_inactive: true });
      setAdminList(data);
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/api/v1/users', formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (err) {
      setErrorMsg('Gagal menambahkan admin. Pastikan email belum terdaftar.');
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!confirm('Yakin ingin menonaktifkan admin ini?')) return;
    try {
      await api.delete(`/api/v1/users/${id}`);
      fetchAdmins();
    } catch (err) {
      alert('Gagal menonaktifkan admin.');
    }
  };

  const handleActivateAdmin = async (id) => {
    try {
      await api.post(`/api/v1/users/${id}/activate`);
      fetchAdmins();
    } catch (err) {
      alert('Gagal mengaktifkan admin.');
    }
  };

  const handleOpenEdit = (admin) => {
    setEditingAdmin(admin);
    setEditFormData({ name: admin.name, password: '' });
    setIsEditModalOpen(true);
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (editFormData.password && editFormData.password.length < 8) {
      setErrorMsg('Kata sandi minimal 8 karakter.');
      return;
    }

    try {
      const payload = {};
      if (editFormData.name && editFormData.name !== editingAdmin.name) {
        payload.name = editFormData.name;
      }
      if (editFormData.password) {
        payload.password = editFormData.password;
      }

      if (Object.keys(payload).length === 0) {
        setIsEditModalOpen(false);
        return;
      }

      await api.patch(`/api/v1/users/${editingAdmin.id}`, payload);
      setIsEditModalOpen(false);
      setEditFormData({ name: '', password: '' });
      fetchAdmins();
    } catch (err) {
      setErrorMsg('Gagal mengubah data admin.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            MANAJEMEN PENGGUNA • SISTEM ADMIN
          </span>
          <h1 className="text-display" style={{ marginTop: '2px' }}>Kelola Akun Admin</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Tambah, ubah, atau nonaktifkan akun petugas dan administrator sistem.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          + Tambah Admin Baru
        </Button>
      </div>

      <Card>
        <CardBody>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-main)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>NAMA</th>
                  <th style={{ padding: '12px' }}>EMAIL</th>
                  <th style={{ padding: '12px' }}>PERAN</th>
                  <th style={{ padding: '12px' }}>STATUS</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3].map((n) => (
                    <tr key={`skeleton-admin-${n}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="160px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="180px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="20px" width="90px" borderRadius="var(--radius-pill)" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="70px" /></td>
                      <td style={{ padding: '12px', textAlign: 'right' }}><Skeleton height="28px" width="80px" borderRadius="var(--radius-md)" /></td>
                    </tr>
                  ))
                ) : adminList.length > 0 ? (
                  adminList.map((admin) => (
                    <tr key={admin.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>👤 {admin.name}</td>
                      <td style={{ padding: '12px' }}>{admin.email}</td>
                      <td style={{ padding: '12px' }}><span className="badge badge-info">{admin.role}</span></td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge ${admin.is_active !== false ? 'badge-success' : 'badge-danger'}`}>
                          {admin.is_active !== false ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <Button variant="outline" size="sm" onClick={() => handleOpenEdit(admin)}>
                            Edit
                          </Button>
                          {admin.is_active !== false ? (
                            <Button variant="outline" size="sm" onClick={() => handleDeleteAdmin(admin.id)}>
                              Nonaktifkan
                            </Button>
                          ) : (
                            <Button variant="primary" size="sm" onClick={() => handleActivateAdmin(admin.id)}>
                              Aktifkan
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '32px 12px', textAlign: 'center' }}>
                      <EmptyState
                        title="Belum Ada Admin"
                        description="Belum ada akun admin terdaftar di sistem."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Modal Tambah Admin */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 'var(--radius-lg)', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '16px' }}>Tambah Admin Baru</h3>
            {errorMsg && <div style={{ color: 'red', marginBottom: '12px', fontSize: '13px' }}>{errorMsg}</div>}
            <form onSubmit={handleCreateAdmin}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Kata Sandi</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" variant="primary" size="sm">Simpan</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Admin */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: 'var(--radius-lg)', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '8px' }}>Edit Admin</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              {editingAdmin?.email}
            </p>
            {errorMsg && <div style={{ color: 'red', marginBottom: '12px', fontSize: '13px' }}>{errorMsg}</div>}
            <form onSubmit={handleEditAdmin}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Nama Lengkap</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Kata Sandi Baru (opsional)</label>
                <input
                  type="password"
                  placeholder="Kosongkan jika tidak diubah"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
                <Button type="submit" variant="primary" size="sm">Simpan</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaAdminPage;
