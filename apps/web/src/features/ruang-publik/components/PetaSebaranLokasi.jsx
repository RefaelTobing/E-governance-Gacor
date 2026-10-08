import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { MapPin, Loader } from 'lucide-react';
import L from 'leaflet';
import { JAKARTA_CENTER } from '../../../config/constants';

import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

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

// FE-07: Handler klik peta untuk menandai lokasi manual (fallback GPS).
const PetaKlikHandler = ({ onPilih }) => {
  useMapEvents({
    click: (e) => onPilih && onPilih(e.latlng.lat, e.latlng.lng),
  });
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

// FE-08: Custom styling untuk bubble cluster marker agar konsisten dengan warna brand.
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  let size = 36;
  if (count >= 100) size = 48;
  else if (count >= 10) size = 42;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: #0F766E;
        color: white;
        font-weight: 700;
        font-size: ${size >= 48 ? '14px' : '12px'};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(15, 118, 110, 0.4);
      ">
        ${count}
      </div>
    `,
    className: 'custom-marker-cluster',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const DEFAULT_ZOOM = 13;

/**
 * PetaSebaranLokasi
 * Menampilkan peta OpenStreetMap untuk ruang publik yang sudah disaring oleh
 * halaman induk, supaya marker dan kartu daftar selalu menampilkan hasil yang sama.
 *
 * @param {Array} items - Hasil filter halaman induk (pencarian, kategori, wilayah, radius)
 * @param {boolean} loading - Daftar masih dimuat
 * @param {{lat: number|null, lng: number|null}} userLocation - Lokasi hasil geolokasi user
 * @param {Function} [onSetManualLocation] - Callback saat pengguna menandai lokasi manual di peta (FE-07)
 */
const PetaSebaranLokasi = ({
  items = [],
  loading = false,
  userLocation = { lat: null, lng: null },
  onSetManualLocation,
}) => {
  const navigate = useNavigate();
  const hasUserLocation = Number.isFinite(userLocation?.lat) && Number.isFinite(userLocation?.lng);
  const pusatLat = hasUserLocation ? userLocation.lat : JAKARTA_CENTER.lat;
  const pusatLng = hasUserLocation ? userLocation.lng : JAKARTA_CENTER.lng;
  const userCoords = hasUserLocation ? [userLocation.lat, userLocation.lng] : null;
  const [mapCenter, setMapCenter] = useState([pusatLat, pusatLng]);

  useEffect(() => {
    setMapCenter((prev) => (prev[0] === pusatLat && prev[1] === pusatLng ? prev : [pusatLat, pusatLng]));
  }, [pusatLat, pusatLng]);

  // FE-08: Dengan clustering (react-leaflet-cluster), seluruh titik yang lolos filter
  // dapat dirender tanpa pembatasan slice buatan.
  const lokasiTampil = useMemo(() => {
    return items
      .map((item) => ({
        ...item,
        computedLat: Number.parseFloat(item.latitude),
        computedLng: Number.parseFloat(item.longitude),
      }))
      .filter((item) => Number.isFinite(item.computedLat) && Number.isFinite(item.computedLng))
      .sort((a, b) => (a.jarak_km ?? Infinity) - (b.jarak_km ?? Infinity));
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
        {onSetManualLocation && (
          <div
            style={{
              position: 'absolute',
              left: '12px',
              bottom: '12px',
              zIndex: 400,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 2px 8px rgba(15,23,42,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#334155',
              pointerEvents: 'none',
            }}
          >
            <MapPin size={12} color="var(--color-primary)" />
            <span>
              {hasUserLocation
                ? 'Geser pin biru atau klik peta untuk ubah lokasi Anda.'
                : 'Klik di peta untuk menandai lokasi Anda secara manual.'}
            </span>
          </div>
        )}

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
          {onSetManualLocation && <PetaKlikHandler onPilih={onSetManualLocation} />}

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {userCoords && (
            <Marker
              position={userCoords}
              draggable={Boolean(onSetManualLocation)}
              eventHandlers={{
                dragend: (e) => {
                  if (!onSetManualLocation) return;
                  const pos = e.target.getLatLng();
                  onSetManualLocation(pos.lat, pos.lng);
                },
              }}
              icon={L.divIcon({
                className: '',
                html: `<div style="
                  width: 16px; height: 16px;
                  background: #3B82F6;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
                  cursor: ${onSetManualLocation ? 'grab' : 'default'};
                "></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
            >
              <Popup>
                <div style={{ fontSize: '12px' }}>
                  <strong>📍 Lokasi Anda</strong>
                  {onSetManualLocation && (
                    <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '11px' }}>
                      Geser pin atau klik peta untuk memindahkan lokasi acuan.
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* FE-08: MarkerClusterGroup membungkus seluruh marker ruang publik */}
          <MarkerClusterGroup
            chunkedLoading
            showCoverageOnHover={false}
            disableClusteringAtZoom={17}
            iconCreateFunction={createClusterCustomIcon}
          >
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
                      className="ruang-publik-detail-button"
                      style={{
                        backgroundColor: 'var(--color-accent, #F59E0B)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-pill)',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        width: '100%',
                        marginTop: '8px',
                      }}
                    >
                      Lihat Detail Ruang →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
};

export default PetaSebaranLokasi;
