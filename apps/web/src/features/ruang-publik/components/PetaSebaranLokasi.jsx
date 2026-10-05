import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Loader } from 'lucide-react';
import L from 'leaflet';
import { JAKARTA_CENTER } from '../../../config/constants';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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

const DEFAULT_ZOOM = 13;

/**
 * PetaSebaranLokasi
 * Menampilkan peta OpenStreetMap untuk ruang publik yang sudah disaring oleh
 * halaman induk, supaya marker dan kartu daftar selalu menampilkan hasil yang sama.
 *
 * @param {Array} items - Hasil filter halaman induk (pencarian, kategori, wilayah, radius)
 * @param {boolean} loading - Daftar masih dimuat
 * @param {{lat: number|null, lng: number|null}} userLocation - Lokasi hasil geolokasi user
 */
const PetaSebaranLokasi = ({ items = [], loading = false, userLocation = { lat: null, lng: null } }) => {
  const navigate = useNavigate();
  const hasUserLocation = Number.isFinite(userLocation?.lat) && Number.isFinite(userLocation?.lng);
  const pusatLat = hasUserLocation ? userLocation.lat : JAKARTA_CENTER.lat;
  const pusatLng = hasUserLocation ? userLocation.lng : JAKARTA_CENTER.lng;
  const userCoords = hasUserLocation ? [userLocation.lat, userLocation.lng] : null;
  const [mapCenter, setMapCenter] = useState([pusatLat, pusatLng]);

  useEffect(() => {
    setMapCenter((prev) => (prev[0] === pusatLat && prev[1] === pusatLng ? prev : [pusatLat, pusatLng]));
  }, [pusatLat, pusatLng]);

  // Jaraknya sudah dihitung backend (item.jarak_km) dari titik acuan yang sama
  // dengan yang dipakai daftar, jadi angka di popup dan badge kartu identik.
  // Marker dibatasi supaya radius 1000 km tidak memaksa peta me-render ribuan
  // titik sekaligus dan membuat halaman macet.
  const BATAS_MARKER = 200;
  const lokasiTampil = useMemo(() => {
    const valid = items
      .map((item) => ({
        ...item,
        computedLat: Number.parseFloat(item.latitude),
        computedLng: Number.parseFloat(item.longitude),
      }))
      .filter((item) => Number.isFinite(item.computedLat) && Number.isFinite(item.computedLng))
      .sort((a, b) => (a.jarak_km ?? Infinity) - (b.jarak_km ?? Infinity));
    return valid.slice(0, BATAS_MARKER);
  }, [items]);

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
      <div style={{ position: 'relative', height: '320px', width: '100%' }}>
        {lokasiTampil.length === 0 && (
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
            <MapPin size={16} color="#64748B" />
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
              Tidak ada lokasi untuk ditampilkan di peta
            </span>
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

          {lokasiTampil.map((item) => (
            <Marker
              key={item.id}
              position={[item.computedLat, item.computedLng]}
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
                  {item.jarak_km != null && (
                    <p style={{ fontSize: '10px', color: '#047857', fontWeight: 600, marginBottom: '8px' }}>
                      {Number(item.jarak_km).toFixed(1)} km {hasUserLocation ? 'dari lokasi Anda' : 'dari pusat Jakarta'}
                    </p>
                  )}
                  {item.kategori_id && (
                    <span style={{
                      fontSize: '10px', fontWeight: 700,
                      backgroundColor: '#d1fae5', color: '#047857',
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
                      backgroundColor: '#047857',
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
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default PetaSebaranLokasi;
