import React, { useState, useEffect } from 'react';
import { MOCK_PETUGAS } from '../../../data/mockData';
import { Button, Card, CardBody, EmptyState, Skeleton } from '../../../components';

export const PetugasLapanganPage = () => {
  const [petugasList, setPetugasList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPetugas = async () => {
      setIsLoading(true);
      try {
        // Placeholder for FastAPI endpoint (e.g. /api/v1/officers)
        // Fallback to MOCK_PETUGAS during development
        if (isMounted) {
          setPetugasList(MOCK_PETUGAS);
        }
      } catch (err) {
        console.error('Error fetching officers:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPetugas();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            OPERASIONAL LAPANGAN
          </span>
          <h1 className="text-display" style={{ marginTop: '2px' }}>Daftar Petugas Lapangan</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Daftar petugas pemeliharaan fasilitas ruang terbuka hijau.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => alert('Tambah Petugas')}>
          + Tambah Petugas
        </Button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
          {[1, 2, 3].map((n) => (
            <Card key={`skeleton-petugas-${n}`}>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <Skeleton height="18px" width="160px" style={{ marginBottom: '4px' }} />
                    <Skeleton height="14px" width="100px" />
                  </div>
                  <Skeleton height="20px" width="80px" borderRadius="var(--radius-pill)" />
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                  <Skeleton height="16px" width="60%" style={{ marginBottom: '6px' }} />
                  <Skeleton height="16px" width="85%" />
                </div>
                <Skeleton height="32px" width="100%" borderRadius="var(--radius-md)" />
              </CardBody>
            </Card>
          ))}
        </div>
      ) : petugasList.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
          {petugasList.map((p) => (
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
                <Button variant="outline" size="sm" fullWidth onClick={() => alert(`Kontak petugas: ${p.nama}`)}>
                  📞 Hubungi Petugas
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Tidak Ada Petugas Terdata"
          description="Daftar petugas lapangan operasional saat ini belum tersedia."
          actionLabel="Tambah Petugas"
          onAction={() => alert('Tambah Petugas')}
        />
      )}
    </div>
  );
};

export default PetugasLapanganPage;
