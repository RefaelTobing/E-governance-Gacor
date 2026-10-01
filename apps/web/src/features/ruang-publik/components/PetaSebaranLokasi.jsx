import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, AlertCircle, Loader } from 'lucide-react';
import L from 'leaflet';
import { getPublicSpaces } from '../../../services/ruangPublikService';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const createCustomIcon = (color = '#10b981') =>
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

// Koordinat center Jakarta sebagai fallback
const JAKARTA_CENTER = [-6.2088, 106.8456];
const DEFAULT_ZOOM = 13;
const RADIUS_OPTIONS = [
  { value: 1000, label: '1 km' },
  { value: 3000, label: '3 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
];

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
  const [selectedRadius, setSelectedRadius] = useState(5000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetchLocations = async (lat, lng, radius) => {
      try {
        const data = await getPublicSpaces({
          lat: lat || JAKARTA_CENTER[0],
          lng: lng || JAKARTA_CENTER[1],
          radius: radius,
          kategori: selectedKategori,
          wilayah: selectedWilayah,
        });

        const items = Array.isArray(data) ? data : data?.items ?? [];
        
        let filtered = items.map(item => {
          const itemLat = parseFloat(item.latitude || item?.koordinat?.lat);
          const itemLng = parseFloat(item.longitude || item?.koordinat?.lng || item?.koordinat?.long);
          let distance = null;
          if (lat && lng && itemLat && itemLng && !isNaN(itemLat) && !isNaN(itemLng)) {
            distance = calculateDistance(lat, lng, itemLat, itemLng);
          }
          return { ...item, computedLat: itemLat, computedLng: itemLng, distance };
        }).filter(item => item.computedLat && item.computedLng && !isNaN(item.computedLat) && !isNaN(item.computedLng));

        if (lat && lng) {
          filtered = filtered.filter(item => item.distance !== null && item.distance <= (radius / 1000));
          filtered.sort((a, b) => a.distance - b.distance);
        }

        setLocations(filtered);

        if (filtered.length > 0 && filtered[0]?.computedLat) {
          setMapCenter([filtered[0].computedLat, filtered[0].computedLng]);
        } else if (lat && lng) {
          setMapCenter([lat, lng]);
        }
      } catch (err) {
        setError('Layanan peta tidak tersedia. Pastikan backend sudah berjalan.');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations(JAKARTA_CENTER[0], JAKARTA_CENTER[1], selectedRadius);
  }, [selectedKategori, selectedWilayah, selectedRadius]);

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
        <Loader size={28} style={{ animation: 'spin 1s linear infinite' }} color="#10b981" />
        <span className="text-small">Memuat peta sebaran lokasi...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Radius Pencarian:</span>
        <div style={{ 
          display: 'inline-flex', 
          gap: 'var(--space-xs)',
          backgroundColor: 'var(--color-bg-main)',
          padding: 'var(--space-xs)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-dark)'
        }}>
          {RADIUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedRadius(option.value)}
              style={{
                 padding: '8px 14px',
                 borderRadius: 'var(--radius-sm)',
                 border: 'none',
                 backgroundColor: selectedRadius === option.value ? 'var(--color-primary)' : 'transparent',
                 color: selectedRadius === option.value ? 'var(--color-surface)' : 'var(--color-text-muted)',
                fontSize: '13px',
                fontWeight: selectedRadius === option.value ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                 boxShadow: selectedRadius === option.value ? '0 2px 6px rgba(15, 118, 110, 0.25)' : 'none',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', height: '320px', width: '100%' }}>
        {(error || (!loading && locations.length === 0)) && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 1000,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '10px 14px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              maxWidth: '85%',
              pointerEvents: 'none'
            }}
          >
            {error ? (
              <>
                <AlertCircle size={16} color="#EF4444" />
                <span style={{ fontSize: '12px', color: '#B91C1C', fontWeight: 500 }}>
                  {error}
                </span>
              </>
            ) : (
              <>
                <MapPin size={16} color="#64748B" />
                <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                  Tidak ada lokasi dalam radius {selectedRadius / 1000} km
                </span>
              </>
            )}
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%', zIndex: 0, filter: 'grayscale(70%) contrast(1.2) brightness(1.05)' }}
          scrollWheelZoom={false}
        >
          <RecenterMap center={mapCenter} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

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

          {locations.map((item, index) => {
            const lat = item?.computedLat;
            const lng = item?.computedLng;
            if (!lat || !lng) return null;

            return (
              <Marker
                key={item.id ?? index}
                position={[lat, lng]}
                icon={createCustomIcon('#10b981')}
              >
                <Popup minWidth={200}>
                  <div style={{ padding: '4px 0' }}>
                    <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', color: '#0F172A' }}>
                      {item.nama}
                    </p>
                    <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>
                      {item.alamat}
                    </p>
                    {item.distance !== null && (
                      <p style={{ fontSize: '10px', color: '#10b981', fontWeight: 600, marginBottom: '8px' }}>
                        {item.distance.toFixed(1)} km dari lokasi Anda
                      </p>
                    )}
                    {item.kategori_id && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700,
                        backgroundColor: '#d1fae5', color: '#10b981',
                        padding: '2px 8px', borderRadius: '999px',
                        display: 'inline-block', marginBottom: '8px'
                      }}>
                        {item.kategori_id}
                      </span>
                    )}
                    <br />
                    <button
                      onClick={() => navigate(`/ruang-publik/${item.id}`)}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        width: '100%',
                        marginTop: '8px',
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
      </div>
    </div>
  );
};

export default PetaSebaranLokasi;
