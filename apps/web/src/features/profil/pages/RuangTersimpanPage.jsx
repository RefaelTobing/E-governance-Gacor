import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Trash2, MapPin } from 'lucide-react';
import { useProfil } from '../../../context/ProfilContext';
import { getPublicSpaces } from '../../../services/ruangPublikService';
import { Skeleton } from '../../../components';

export const RuangTersimpanPage = () => {
  const navigate = useNavigate();
  const { savedSpaces, toggleSaveSpace } = useProfil();
  const [spaces, setSpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSaved = async () => {
      if (savedSpaces.length === 0) {
        setSpaces([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const all = await getPublicSpaces({ limit: 500 });
        const filtered = (Array.isArray(all) ? all : []).filter((s) =>
          savedSpaces.includes(s.id)
        );
        if (isMounted) {
          setSpaces(filtered);
        }
      } catch {
        if (isMounted) {
          setSpaces([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSaved();

    return () => {
      isMounted = false;
    };
  }, [savedSpaces]);

  return (
    <div className="container" style={{ maxWidth: '1000px', padding: 0 }}>
      <div className="profil-section-head">
        <h2 className="h2">Ruang Publik Disimpan</h2>
        {!isLoading && spaces.length > 0 && (
          <span className="text-caption">{spaces.length} ruang tersimpan</span>
        )}
      </div>

      {isLoading ? (
        <div className="profil-saved-grid">
          {[1, 2, 3].map((n) => (
            <div key={`skeleton-saved-${n}`} className="profil-saved-card">
              <Skeleton height="120px" borderRadius="var(--radius-lg) var(--radius-lg) 0 0" />
              <div style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Skeleton height="16px" width="70%" />
                <Skeleton height="12px" width="45%" />
              </div>
            </div>
          ))}
        </div>
      ) : spaces.length === 0 ? (
        <div className="profil-empty-state">
          <Bookmark size={36} color="var(--color-text-light)" aria-hidden="true" />
          <h3 className="h3">Belum Ada Ruang Disimpan</h3>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Simpan taman atau ruang publik favorit Anda untuk mengaksesnya dengan cepat.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/ruang-publik')}
          >
            Jelajahi Ruang Publik
          </button>
        </div>
      ) : (
        <div className="profil-saved-grid">
          {spaces.map((space) => (
            <div key={space.id} className="profil-saved-card">
              <div className="profil-saved-thumb">
                <MapPin size={20} color="var(--color-primary)" aria-hidden="true" />
              </div>
              <div className="profil-saved-body">
                <h3 className="h3 profil-saved-nama">{space.nama}</h3>
                <span className="text-caption">{space.wilayah || 'Jakarta'}</span>
              </div>
              <div className="profil-saved-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate(`/ruang-publik/${space.id}`)}
                >
                  Lihat Detail
                </button>
                <button
                  type="button"
                  className="profil-remove-button"
                  onClick={() => toggleSaveSpace(space.id)}
                  aria-label={`Hapus ${space.nama} dari simpanan`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RuangTersimpanPage;
