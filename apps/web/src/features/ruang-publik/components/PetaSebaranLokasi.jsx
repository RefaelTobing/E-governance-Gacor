import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, AlertCircle, Loader } from 'lucide-react';
import L from 'leaflet';
import { getPublicSpaces } from '../../../services/ruangPublikService';

// Fix leaflet default marker icon yang hilang saat di-bundle Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom marker icon dengan warna primary
const createCustomIcon = (color = '#0F766E') =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  });

// Komponen helper untuk recenter peta saat koordinat berubah
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

// Koordinat center Jakarta sebagai fallback
const JAKARTA_CENTER = [-6.2088, 106.8456];
const DEFAULT_ZOOM = 13;
const DEFAULT_RADIUS = 5000; // 5km

/**
 * PetaSebaranLokasi
 * Menampilkan peta OpenStreetMap dengan 3 titik ruang publik terdekat dari lokasi user.
 *
 * @param {string} selectedKategori - Filter kategori aktif dari halaman induk
 * @param {string} selectedWilayah  - Filter wilayah aktif dari halaman induk
 */
const PetaSebaranLokasi = ({ selectedKategori = 'semua', selectedWilayah = 'Semua Wilayah' }) => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [mapCenter, setMapCenter] = useState(JAKARTA_CENTER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  // Ambil geolokasi user, lalu fetch data
  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetchLocations = async (lat, lng) => {
      try {
        const data = await getPublicSpaces({
          lat,
          lng,
          radius: DEFAULT_RADIUS,
          limit: 3,
          kategori: selectedKategori,
          wilayah: selectedWilayah,
        });

        // Backend bisa return array langsung atau { items: [...] }
        const items = Array.isArray(data) ? data : data?.items ?? [];
        setLocations(items);

        if (items.length > 0 && items[0]?.koordinat) {
          setMapCenter([items[0].koordinat.lat, items[0].koordinat.lng ?? items[0].koordinat.long]);
        } else if (lat && lng) {
          setMapCenter([lat, lng]);
        }
      } catch (err) {
        setError('Layanan peta tidak tersedia. Pastikan backend sudah berjalan.');
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoords([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          fetchLocations(latitude, longitude);
        },
        () => {
          // User deny atau gagal → fallback center Jakarta tanpa koordinat user
          fetchLocations(null, null);
        },
        { timeout: 5000 }
      );
    } else {
      fetchLocations(null, null);
    }
  }, [selectedKategori, selectedWilayah]);

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div
        style={{
          height: '320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          gap: '12px',
          color: 'var(--color-text-muted)',
        }}
      >
        <Loader size={28} style={{ animation: 'spin 1s linear infinite' }} color="#0F766E" />
        <span className="text-small">Memuat peta sebaran lokasi...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <div
        style={{
          height: '320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fef2f2',
          gap: '12px',
          padding: 'var(--space-xl)',
          textAlign: 'center',
        }}
      >
        <AlertCircle size={32} color="#EF4444" />
        <div>
          <p className="text-small" style={{ fontWeight: 700, color: '#DC2626', marginBottom: '4px' }}>
            Peta Tidak Tersedia
          </p>
          <p className="text-caption" style={{ color: 'var(--color-text-muted)', maxWidth: '360px' }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  // --- EMPTY STATE (API berhasil tapi tidak ada data) ---
  if (!loading && locations.length === 0) {
    return (
      <div
        style={{
          height: '320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          gap: '12px',
          color: 'var(--color-text-muted)',
        }}
      >
        <MapPin size={32} color="#94A3B8" />
        <p className="text-small">Tidak ada lokasi ditemukan dalam filter ini.</p>
      </div>
    );
  }

  // --- MAP STATE ---
  return (
    <MapContainer
      center={mapCenter}
      zoom={DEFAULT_ZOOM}
      style={{ height: '320px', width: '100%', zIndex: 0 }}
      scrollWheelZoom={false}
    >
      <RecenterMap center={mapCenter} />

      {/* Tile layer OpenStreetMap — gratis, no API key */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Marker lokasi user (jika geolokasi diizinkan) */}
      {userCoords && (
        <Marker
          position={userCoords}
          icon={L.divIcon({
            className: '',
            html: `<div style="
              width: 16px; height: 16px;
              background: #3B82F6;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
            "></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })}
        >
          <Popup>
            <span style={{ fontWeight: 700, fontSize: '12px' }}>📍 Lokasi Anda</span>
          </Popup>
        </Marker>
      )}

      {/* Marker tiap ruang publik */}
      {locations.map((item, index) => {
        const lat = item?.koordinat?.lat;
        const lng = item?.koordinat?.lng ?? item?.koordinat?.long;
        if (!lat || !lng) return null;

        return (
          <Marker
            key={item.id ?? index}
            position={[lat, lng]}
            icon={createCustomIcon('#0F766E')}
          >
            <Popup minWidth={200}>
              <div style={{ padding: '4px 0' }}>
                <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', color: '#0F172A' }}>
                  {item.nama}
                </p>
                <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
                  {item.alamat}
                </p>
                {item.kategori && (
                  <span style={{
                    fontSize: '10px', fontWeight: 700,
                    backgroundColor: '#CCFBF1', color: '#0F766E',
                    padding: '2px 8px', borderRadius: '999px',
                    display: 'inline-block', marginBottom: '8px'
                  }}>
                    {item.kategori}
                  </span>
                )}
                <br />
                <button
                  onClick={() => navigate(`/ruang-publik/${item.id}`)}
                  style={{
                    backgroundColor: '#0F766E',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    width: '100%',
                    marginTop: '4px',
                  }}
                >
                  Lihat Detail →
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default PetaSebaranLokasi;
