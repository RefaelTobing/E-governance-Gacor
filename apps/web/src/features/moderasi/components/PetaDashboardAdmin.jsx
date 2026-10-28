import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { AlertTriangle, MapPin, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import L from 'leaflet';
import { Button, PetaZoomPinch } from '../../../components';
import { getAllPublicSpaces } from '../../../services/ruangPublikService';
import { getAdminReports } from '../../../services/laporanService';
import { JAKARTA_CENTER } from '../../../config/constants';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_ZOOM = 11;

// Identitas objek pusat harus stabil: kalau dibuat ulang tiap render, efek
// RecenterMap jalan terus dan `setView` menendang pan/zoom pengguna.
const PUSAT_JAKARTA = { lat: JAKARTA_CENTER.lat, lng: JAKARTA_CENTER.lng };

// FE-66: status yang dianggap "laporan aktif" untuk pewarnaan pin.
const STATUS_AKTIF = ['menunggu_verifikasi', 'diverifikasi', 'dalam_penanganan'];
const WARNA_PIN_NORMAL = '#16A34A'; // hijau: belum ada laporan aktif
const WARNA_PIN_AKTIF = '#F59E0B'; // kuning: ada laporan aktif

const buatIkonRuang = (adaLaporanAktif) => L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:${adaLaporanAktif ? WARNA_PIN_AKTIF : WARNA_PIN_NORMAL};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 1px 5px rgba(15,23,42,.35)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -20],
});

// Dibuat sekali supaya marker tidak memasang ikon baru tiap render.
const IKON_NORMAL = buatIkonRuang(false);
const IKON_AKTIF = buatIkonRuang(true);

// FE-08: Custom styling bubble cluster (konsisten dengan warna brand primary).
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  let size = 38;
  if (count >= 100) size = 50;
  else if (count >= 10) size = 44;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: #0F766E;
        color: white;
        font-weight: 700;
        font-size: ${size >= 50 ? '14px' : '12px'};
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

const RecenterMap = ({ center }) => {
  const map = useMap();
  const { lat, lng } = center;

  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);

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

// Alat ukur/debug: menuliskan zoom & pusat peta ke atribut data-* kontainer,
// supaya perilaku zoom/pan bisa diperiksa tanpa membongkar instance Leaflet.
const PelaporStatusPeta = () => {
  const map = useMap();

  useEffect(() => {
    const elemen = map.getContainer();

    const tulis = () => {
      elemen.dataset.zoom = String(map.getZoom());
      const pusat = map.getCenter();
      elemen.dataset.center = `${pusat.lat.toFixed(5)},${pusat.lng.toFixed(5)}`;
    };

    tulis();
    map.on('zoomend moveend', tulis);
    return () => map.off('zoomend moveend', tulis);
  }, [map]);

  return null;
};

// FE-66: saat keluar/masuk fullscreen ukuran kontainer berubah, Leaflet perlu
// diberi tahu agar tidak menyisakan area abu-abu.
const SesuaikanUkuranPeta = ({ pemicu }) => {
  const map = useMap();

  useEffect(() => {
    // `map.stop()` dulu: bila peta masih dalam animasi zoom, invalidateSize bisa
    // meninggalkan state animasi yang membuat kontrol zoom berhenti merespons.
    const timer = setTimeout(() => {
      map.stop();
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [pemicu, map]);

  return null;
};

const PetaDashboardAdmin = () => {
  const [spaces, setSpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // FE-66: { ruang_publik_id: jumlah laporan aktif }.
  const [laporanAktif, setLaporanAktif] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  // FE-66: mode penuh berbasis CSS, dipakai bila Fullscreen API ditolak browser
  // (mis. izin permissions-policy atau lingkungan embedded).
  const [modePenuh, setModePenuh] = useState(false);
  const wrapperRef = useRef(null);
  const penuh = isFullscreen || modePenuh;

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

  // FE-66: hitung laporan aktif per ruang publik. Bila gagal, biarkan kosong
  // sehingga semua pin hijau dan peta tetap berfungsi.
  useEffect(() => {
    let aktif = true;

    const muatLaporanAktif = async () => {
      try {
        const daftar = await getAdminReports({ limit: 500 });
        if (!aktif) return;
        const hitung = {};
        (daftar || []).forEach((laporan) => {
          if (!STATUS_AKTIF.includes(laporan.status)) return;
          const idRuang = laporan.ruangPublikId || laporan.ruang_publik_id;
          if (!idRuang) return;
          hitung[idRuang] = (hitung[idRuang] || 0) + 1;
        });
        setLaporanAktif(hitung);
      } catch {
        if (aktif) setLaporanAktif({});
      }
    };

    muatLaporanAktif();
    return () => {
      aktif = false;
    };
  }, []);

  useEffect(() => {
    const saatBerubah = () => setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    document.addEventListener('fullscreenchange', saatBerubah);
    return () => document.removeEventListener('fullscreenchange', saatBerubah);
  }, []);

  // FE-66: keluar dari mode penuh (API atau fallback CSS).
  const keluarPenuh = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        /* diabaikan: state CSS tetap dibersihkan di bawah */
      }
    }
    setModePenuh(false);
  };

  const toggleFullscreen = async () => {
    const elemen = wrapperRef.current;
    if (!elemen) return;

    if (penuh) {
      await keluarPenuh();
      return;
    }

    try {
      await elemen.requestFullscreen();
      // Bila API berhasil, `fullscreenchange` yang menyalakan isFullscreen.
    } catch {
      // API ditolak: tetap beri tampilan penuh lewat CSS supaya tombol tidak diam saja.
      setModePenuh(true);
    }
  };

  // Esc keluar dari mode penuh CSS (pada Fullscreen API, Esc ditangani browser).
  useEffect(() => {
    if (!modePenuh) return undefined;

    const saatTombol = (event) => {
      if (event.key === 'Escape') setModePenuh(false);
    };
    document.addEventListener('keydown', saatTombol);
    return () => document.removeEventListener('keydown', saatTombol);
  }, [modePenuh]);

  // FE-08: Seluruh titik lolos filter dirender; MarkerClusterGroup menangani
  // kepadatan tinggi tanpa perlu membatasi jumlah marker.
  const locations = useMemo(() => spaces
    .map((space) => ({
      ...space,
      latitude: Number.parseFloat(space.latitude),
      longitude: Number.parseFloat(space.longitude),
    }))
    .filter((space) => Number.isFinite(space.latitude) && Number.isFinite(space.longitude)), [spaces]);

  const jumlahAktif = useMemo(
    () => locations.filter((space) => laporanAktif[space.id]).length,
    [locations, laporanAktif]
  );

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
    <div
      ref={wrapperRef}
      style={isFullscreen
        ? { position: 'relative', width: '100%', height: '100vh', backgroundColor: 'var(--color-surface)' }
        : modePenuh
          ? { position: 'fixed', inset: 0, zIndex: 2000, width: '100vw', height: '100vh', backgroundColor: 'var(--color-surface)' }
          : { position: 'relative', aspectRatio: '1 / 1', width: '100%', maxHeight: '520px' }}
    >
      <MapContainer
        center={[JAKARTA_CENTER.lat, JAKARTA_CENTER.lng]}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={false}
      >
        <RecenterMap center={PUSAT_JAKARTA} />
        <PelaporStatusPeta />
        <FitMapBounds locations={locations} />
        <SesuaikanUkuranPeta pemicu={penuh} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* FE-45: pinch trackpad (wheel + ctrlKey) mengezoom peta, bukan halaman. */}
        <PetaZoomPinch />
        {/* FE-08: Clustering marker ruang publik */}
        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          disableClusteringAtZoom={17}
          iconCreateFunction={createClusterCustomIcon}
        >
          {locations.map((space) => {
            const jmlAktif = laporanAktif[space.id] || 0;
            return (
              <Marker
                key={space.id}
                position={[space.latitude, space.longitude]}
                icon={jmlAktif ? IKON_AKTIF : IKON_NORMAL}
              >
                <Popup minWidth={220}>
                  <div style={{ padding: '4px 0' }}>
                    <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-main)' }}>{space.nama}</strong>
                    <span style={{ display: 'block', marginBottom: '4px', color: 'var(--color-text-muted)', fontSize: '12px' }}>{space.alamat || 'Alamat belum tersedia'}</span>
                    <span style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '12px' }}>{space.wilayah || 'Wilayah belum tersedia'}</span>
                    {jmlAktif > 0 ? (
                      <span style={{ display: 'inline-block', marginTop: '8px', color: '#B45309', fontSize: '11px', fontWeight: 700 }}>
                        {jmlAktif} laporan aktif
                      </span>
                    ) : (
                      <span style={{ display: 'inline-block', marginTop: '8px', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                        Tidak ada laporan aktif
                      </span>
                    )}
                    {space.verified && <span style={{ display: 'block', marginTop: '4px', color: 'var(--color-success-text)', fontSize: '11px', fontWeight: 700 }}>Ruang publik terverifikasi</span>}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* FE-66: kontrol fullscreen peta */}
      <div style={{ position: 'absolute', right: '12px', top: '12px', zIndex: 400 }}>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-surface)' }}
        >
          {penuh ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {penuh ? 'Keluar Full' : 'Lihat Full'}
        </Button>
      </div>

      {/* FE-66: legenda status laporan */}
      <div
        style={{
          position: 'absolute',
          left: '12px',
          bottom: '12px',
          zIndex: 400,
          background: 'var(--color-surface)',
          padding: '8px 10px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 2px 8px rgba(15,23,42,.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '12px',
          color: 'var(--color-text-main)'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: WARNA_PIN_NORMAL }} aria-hidden="true" />
          Tanpa laporan aktif ({locations.length - jumlahAktif})
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: WARNA_PIN_AKTIF }} aria-hidden="true" />
          Ada laporan aktif ({jumlahAktif})
        </span>
      </div>
    </div>
  );
};

export default PetaDashboardAdmin;