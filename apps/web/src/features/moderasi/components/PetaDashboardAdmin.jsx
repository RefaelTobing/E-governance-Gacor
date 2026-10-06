import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { AlertTriangle, MapPin, RotateCcw } from 'lucide-react';
import L from 'leaflet';
import { Button } from '../../../components';
import { getAllPublicSpaces } from '../../../services/ruangPublikService';
import { JAKARTA_CENTER } from '../../../config/constants';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_ZOOM = 11;
const MAX_MARKERS = 500;

const createSpaceIcon = () => L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;background:#0F766E;border:3px solid white;border-radius:50%;box-shadow:0 1px 5px rgba(15,23,42,.35)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

const RecenterMap = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
};

const FitMapBounds = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;
    const bounds = L.latLngBounds(locations.map((item) => [item.latitude, item.longitude]));
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 13 });
  }, [locations, map]);

  return null;
};

const PetaDashboardAdmin = () => {
  const [spaces, setSpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const muatRuangPublik = async () => {
    setIsLoading(true);
    setError('');
    try {
      setSpaces(await getAllPublicSpaces());
    } catch (err) {
      setError(err.message || 'Data ruang publik gagal dimuat.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    muatRuangPublik();
  }, []);

  const locations = useMemo(() => spaces
    .map((space) => ({
      ...space,
      latitude: Number.parseFloat(space.latitude),
      longitude: Number.parseFloat(space.longitude),
    }))
    .filter((space) => Number.isFinite(space.latitude) && Number.isFinite(space.longitude))
    .slice(0, MAX_MARKERS), [spaces]);

  if (isLoading) {
    return (
      <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        Memuat peta ruang publik...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        <AlertTriangle size={24} color="var(--color-warning)" />
        <p className="text-small" style={{ margin: 0 }}>{error}</p>
        <Button variant="outline" size="sm" onClick={muatRuangPublik} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <RotateCcw size={14} /> Coba lagi
        </Button>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div style={{ height: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        <MapPin size={24} />
        <p className="text-small" style={{ margin: 0 }}>Belum ada ruang publik dengan koordinat yang dapat ditampilkan.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '320px', width: '100%' }}>
      <MapContainer
        center={[JAKARTA_CENTER.lat, JAKARTA_CENTER.lng]}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={false}
      >
        <RecenterMap center={[JAKARTA_CENTER.lat, JAKARTA_CENTER.lng]} />
        <FitMapBounds locations={locations} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((space) => (
          <Marker key={space.id} position={[space.latitude, space.longitude]} icon={createSpaceIcon()}>
            <Popup minWidth={220}>
              <div style={{ padding: '4px 0' }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: '#0F172A' }}>{space.nama}</strong>
                <span style={{ display: 'block', marginBottom: '4px', color: '#475569', fontSize: '12px' }}>{space.alamat || 'Alamat belum tersedia'}</span>
                <span style={{ display: 'block', color: '#64748B', fontSize: '12px' }}>{space.wilayah || 'Wilayah belum tersedia'}</span>
                {space.verified && <span style={{ display: 'inline-block', marginTop: '8px', color: '#047857', fontSize: '11px', fontWeight: 700 }}>Ruang publik terverifikasi</span>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div style={{ position: 'absolute', left: '12px', bottom: '12px', zIndex: 400, background: 'rgba(255,255,255,.95)', padding: '8px 10px', borderRadius: 'var(--radius-md)', boxShadow: '0 2px 8px rgba(15,23,42,.15)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155' }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0F766E' }} aria-hidden="true" />
        Semua ruang publik ({locations.length})
      </div>
    </div>
  );
};

export default PetaDashboardAdmin;
