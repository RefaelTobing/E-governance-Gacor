import React, { useState, useEffect } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { Button, Card, CardBody, StatusBadge, EmptyState, Skeleton } from '../../../components';
import { getPublicSpaces } from '../../../services/ruangPublikService';

export const KelolaFasilitasPage = () => {
  const [spaces, setSpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchFasilitas = async () => {
      setIsLoading(true);
      try {
        const data = await getPublicSpaces();
        if (isMounted) {
          setSpaces(data);
        }
      } catch (err) {
        console.error('Error fetching facilities data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchFasilitas();

    return () => {
      isMounted = false;
    };
  }, []);

  const allFacilities = spaces.flatMap((rp) =>
    (rp.fasilitas || []).map((fas) => ({
      ...fas,
      ruangPublikNama: rp.nama,
      ruangPublikId: rp.id
    }))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            DATA MASTER • KELOLA FASILITAS
          </span>
          <h1 className="text-display" style={{ marginTop: '2px' }}>Kelola Fasilitas Ruang Publik</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Daftar fasilitas terdata di seluruh lokasi ruang terbuka DKI Jakarta.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => alert('Tambah Fasilitas Baru')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Plus size={16} /> Tambah Fasilitas Baru
        </Button>
      </div>

      <Card>
        <CardBody>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-main)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>FASILITAS</th>
                  <th style={{ padding: '12px' }}>RUANG PUBLIK</th>
                  <th style={{ padding: '12px' }}>KATEGORI</th>
                  <th style={{ padding: '12px' }}>LOKASI SPESIFIK</th>
                  <th style={{ padding: '12px' }}>STATUS KONDISI</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3].map((n) => (
                    <tr key={`skeleton-fas-${n}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="140px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="120px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="20px" width="90px" borderRadius="var(--radius-pill)" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="18px" width="130px" /></td>
                      <td style={{ padding: '12px' }}><Skeleton height="20px" width="80px" borderRadius="var(--radius-pill)" /></td>
                      <td style={{ padding: '12px', textAlign: 'right' }}><Skeleton height="28px" width="60px" borderRadius="var(--radius-md)" /></td>
                    </tr>
                  ))
                ) : allFacilities.length > 0 ? (
                  allFacilities.map((fas) => (
                    <tr key={fas.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{fas.nama}</td>
                      <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="var(--color-text-muted)" /> {fas.ruangPublikNama}
                      </td>
                      <td style={{ padding: '12px' }}><span className="badge badge-info">{fas.kategori}</span></td>
                      <td style={{ padding: '12px' }}>{fas.lokasiSpesifik}</td>
                      <td style={{ padding: '12px' }}><StatusBadge status={fas.status} /></td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <Button variant="outline" size="sm" onClick={() => alert(`Edit fasilitas: ${fas.nama}`)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '32px 12px', textAlign: 'center' }}>
                      <EmptyState
                        title="Belum Ada Fasilitas Terdata"
                        description="Tidak ada fasilitas yang ditemukan dalam sistem."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default KelolaFasilitasPage;
