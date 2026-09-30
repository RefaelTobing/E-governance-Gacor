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

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoords([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          fetchLocations(latitude, longitude, selectedRadius);
        },
        () => {
          fetchLocations(null, null, selectedRadius);
        },
        { timeout: 5000 }
      );
    } else {
      fetchLocations(null, null, selectedRadius);
    }
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
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {RADIUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedRadius(option.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: selectedRadius === option.value ? '2px solid #10b981' : '1px solid #e2e8f0',
              backgroundColor: selectedRadius === option.value ? '#d1fae5' : 'white',
              color: selectedRadius === option.value ? '#10b981' : '#64748b',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', height: '320px', width: '100%' }}>
        {(error || (!loading && locations.length === 0)) && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 1000,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '8px 12px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              maxWidth: '80%',
              pointerEvents: 'none'
            }}
          >
            {error ? (
              <>
                <AlertCircle size={16} color="#EF4444" />
                <span style={{ fontSize: '11px', color: '#B91C1C', fontWeight: 500 }}>
                  {error} (Menampilkan peta dasar)
                </span>
              </>
            ) : (
              <>
                <MapPin size={16} color="#64748B" />
                <span style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>
                  Tidak ada lokasi ditemukan dalam radius {selectedRadius / 1000} km dengan filter ini.
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
