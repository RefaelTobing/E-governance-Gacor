import React from 'react';
import { Button, Card, CardBody } from '../../../components';

export const PetugasLapanganPage = () => {
  const MOCK_PETUGAS = [
    { id: 1, nama: 'Regu 01 - Taman Suropati', anggota: 4, wilayah: 'Jakarta Pusat', status: 'Aktif di Lapangan', tugas: 'Perbaikan Lampu Jalur Selatan' },
    { id: 2, nama: 'Regu 02 - Tebet Eco Park', anggota: 3, wilayah: 'Jakarta Selatan', status: 'Standby Pos', tugas: 'Pemeliharaan Wastafel' },
    { id: 3, nama: 'Regu 03 - Kalijodo', anggota: 5, wilayah: 'Jakarta Barat', status: 'Inspeksi Rutin', tugas: 'Pembersihan Vandalisme' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            OPERASIONAL LAPANGAN
          </span>
          <h1 className="text-display" style={{ marginTop: '2px' }}>Daftar Petugas Lapangan</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Tim teknis dan regu pemeliharaan fasilitas ruang terbuka hijau.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => alert('Tambah Tim Petugas')}>
          + Tambah Regu Petugas
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
        {MOCK_PETUGAS.map((p) => (
          <Card key={p.id}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 className="h3" style={{ fontSize: '16px' }}>{p.nama}</h3>
                  <span className="text-caption">📍 Wilayah: {p.wilayah}</span>
                </div>
                <span className="badge badge-success">● {p.status}</span>
              </div>
              <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
                <div><strong>Jumlah Anggota:</strong> {p.anggota} Orang</div>
                <div style={{ marginTop: '4px' }}><strong>Tugas Saat Ini:</strong> {p.tugas}</div>
              </div>
              <Button variant="outline" size="sm" fullWidth onClick={() => alert(`Kontak regu: ${p.nama}`)}>
                📞 Hubungi Regu
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PetugasLapanganPage;
