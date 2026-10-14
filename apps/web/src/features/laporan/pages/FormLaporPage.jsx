import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { MapPin, Camera, CheckCircle2, Send, Info, Lightbulb, Trash2, Tag } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Card, CardBody, StatusBadge, Skeleton } from '../../../components';
import { getPublicSpaceDetail } from '../../../services/ruangPublikService';
import { createReport, uploadFoto } from '../../../services/laporanService';
import { useAuth } from '../../../context/AuthContext';
import { StatusHasilSubmit } from '../components/StatusHasilSubmit';
import { FAKE_GPS_THRESHOLD_M } from '../../../config/constants';

const createPrecisionIcon = () =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        background-color: #0F766E;
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
  });

const PetaKlikHandler = ({ onPick }) => {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
};

const getFacilityCoords = (facility) => {
  const lat = Number.parseFloat(facility?.latitude ?? facility?.koordinat?.lat);
  const lng = Number.parseFloat(facility?.longitude ?? facility?.koordinat?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  return null;
};

export const FormLaporPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const facilityParam = searchParams.get('fasilitas');

  const { token } = useAuth();

  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Hasil submit sukses (response createReport). Bila terisi, form diganti
  // panel status hasil (FE-19): "Laporan tayang" atau "Menunggu tinjauan admin".
  const [submitResult, setSubmitResult] = useState(null);

  // Form State
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [jenisMasalah, setJenisMasalah] = useState('Lampu Mati / Penerangan');
  const [deskripsi, setDeskripsi] = useState('');
  const [modeIdentitas, setModeIdentitas] = useState('anonim');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoError, setFotoError] = useState('');
  const [isDashedFocused, setIsDashedFocused] = useState(false);
  const fileInputRef = useRef(null);

  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSpace = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const data = await getPublicSpaceDetail(id);
        if (isMounted && data) {
          setDetail(data);
          const fasilitas = Array.isArray(data.fasilitas) ? data.fasilitas : [];
          const defaultFac = fasilitas.find((f) => f.id === facilityParam) || fasilitas[0];
          if (defaultFac) {
            setSelectedFacilityId(defaultFac.id);
          }
          setSelectedLocation(getFacilityCoords(defaultFac) || data.koordinat || null);
        } else if (isMounted) {
          setFetchError('Data ruang publik tidak ditemukan.');
        }
      } catch (err) {
        console.error('Error fetching detail for report form:', err);
        if (isMounted) {
          setFetchError('Gagal memuat data ruang publik. Periksa koneksi Anda lalu muat ulang halaman.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (id) {
      fetchSpace();
    }

    return () => {
      isMounted = false;
    };
  }, [id, facilityParam]);

  useEffect(() => {
    return () => {
      if (fotoPreview) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [fotoPreview]);

  // Ganti fasilitas → pin kembali ke koordinat fasilitas tersebut
  // (fallback koordinat ruang publik) supaya titik lokasi tidak tertukar.
  useEffect(() => {
    if (!detail) return;
    const fasilitas = Array.isArray(detail.fasilitas) ? detail.fasilitas : [];
    const facility = fasilitas.find((f) => f.id === selectedFacilityId);
    setSelectedLocation(getFacilityCoords(facility) || detail.koordinat || null);
  }, [selectedFacilityId, detail]);

  const handleFileChange = (e) => {
    setFotoError('');
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    // FE-16: Validasi tipe berkas foto
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const hasValidExt = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!allowedTypes.includes(file.type) && !hasValidExt) {
      setFotoError('Tipe file tidak diizinkan. Hanya file JPEG, PNG, dan WebP yang diperbolehkan.');
      e.target.value = '';
      return;
    }

    // FE-16: Validasi ukuran berkas maksimal 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFotoError('Ukuran file melebihi batas maksimal 5MB.');
      e.target.value = '';
      return;
    }

    if (fotoPreview) {
      URL.revokeObjectURL(fotoPreview);
    }

    setFotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFotoPreview(objectUrl);
  };

  const handleHapusFoto = (e) => {
    e.stopPropagation();
    if (fotoPreview) {
      URL.revokeObjectURL(fotoPreview);
    }
    setFotoFile(null);
    setFotoPreview(null);
    setFotoError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // FE-19: reset form & kembali ke form laporan setelah melihat status hasil.
  const handleLaporLagi = () => {
    if (fotoPreview) {
      URL.revokeObjectURL(fotoPreview);
    }
    setFotoFile(null);
    setFotoPreview(null);
    setFotoError('');
    setErrorMsg('');
    setDeskripsi('');
    setModeIdentitas('anonim');
    setSelectedLocation(getFacilityCoords(detail) || detail?.koordinat || null);
    setSubmitResult(null);
  };

  // FE-19: panel hasil submit menggantikan form.
  const renderStatusHasilSubmit = () => (
    <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
      <nav style={{ marginBottom: 'var(--space-lg)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
        <Link to="/home" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Beranda</Link>
        {' > '}
        <Link to="/ruang-publik" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Ruang Publik</Link>
        {' > '}
        <strong style={{ color: 'var(--color-text-main)' }}>Status Laporan</strong>
      </nav>
      <StatusHasilSubmit
        result={submitResult}
        isAuthenticated={!!token}
        onLaporLagi={handleLaporLagi}
        onLihatDetail={() => navigate(`/laporan-saya/${submitResult?.id}`)}
        onBeranda={() => navigate('/home')}
      />
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setFotoError('');

    // Validasi foto bukti fisik wajib diunggah
    if (!fotoFile) {
      setFotoError('Foto bukti fisik wajib diunggah.');
      return;
    }

    // Jika ruang publik memiliki koordinat, titik lokasi wajib tersedia.
    if (detail?.koordinat && !selectedLocation) {
      setErrorMsg('Titik lokasi fasilitas belum ditentukan pada peta.');
      return;
    }

    if (!['anonim', 'tampilkan_nama'].includes(modeIdentitas)) {
      setErrorMsg('Mode identitas tidak valid. Pilih anonim atau tampilkan nama.');
      return;
    }

    setIsSubmitting(true);

    try {
      // FE-17: Ambil koordinat pengguna via Geolocation API
      let coords = null;
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          coords = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              () => resolve(null),
              { timeout: 5000, enableHighAccuracy: true }
            );
          });
        } catch {
          coords = null;
        }
      }

      // 1. Upload berkas foto (BE-49)
      const fotoUrl = await uploadFoto(fotoFile);

      // 2. Submit laporan ke backend (BE-20)
      const reportPayload = {
        ruang_publik_id: detail?.id,
        fasilitas_id: selectedFacilityId || null,
        jenis_masalah: jenisMasalah,
        deskripsi: deskripsi,
        mode_identitas: modeIdentitas,
        foto_url: fotoUrl,
        ...(coords ? { lat_user: coords.lat, long_user: coords.lng } : {}),
        ...(selectedLocation
          ? {
              lat_lokasi_pilihan: selectedLocation.lat,
              long_lokasi_pilihan: selectedLocation.lng,
            }
          : {}),
      };

      const result = await createReport(reportPayload);
      setSubmitResult(result);
    } catch (err) {
      console.error('Gagal mengirim laporan:', err);
      const detailError = err.detail || err.message;
      setErrorMsg(detailError || 'Gagal mengirim laporan ke server. Periksa kembali isian Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
        <Skeleton height="20px" width="300px" style={{ marginBottom: 'var(--space-md)' }} />
        <div className="grid-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 'var(--space-2xl)' }}>
          <div>
            <Skeleton height="36px" width="70%" style={{ marginBottom: '8px' }} />
            <Skeleton height="18px" width="90%" style={{ marginBottom: 'var(--space-2xl)' }} />
            <Skeleton height="400px" borderRadius="var(--radius-lg)" />
          </div>
          <Card><CardBody><Skeleton height="300px" /></CardBody></Card>
        </div>
      </div>
    );
  }

  if (fetchError || !detail) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <Card>
            <CardBody style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-md)' }}>
                <Info size={40} color="var(--color-danger)" />
              </div>
              <h2 className="h2" style={{ marginBottom: '8px' }}>Gagal Memuat Formulir Lapor</h2>
              <p className="text-small" style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-xl)' }}>
                {fetchError || 'Data ruang publik tidak ditemukan.'}
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                <Button variant="primary" onClick={() => window.location.reload()}>
                  Muat Ulang
                </Button>
                <Button variant="outline" onClick={() => navigate('/ruang-publik')}>
                  Kembali ke Direktori
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (submitResult) {
    return renderStatusHasilSubmit();
  }

  const fasilitasTersedia = Array.isArray(detail.fasilitas) ? detail.fasilitas : [];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
      {/* BREADCRUMB */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: 'var(--space-md)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
        <Link to="/ruang-publik" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Ruang Publik</Link>
        {' / '}
        <Link to={`/ruang-publik/${detail.id}`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>{detail.nama}</Link>
        {' / '}
        <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>Formulir Laporan</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-2xl)', alignItems: 'start' }}>
        {/* MAIN FORM */}
        <div>
          <h1 className="h1" style={{ marginBottom: '8px' }}>Laporkan Masalah Fasilitas</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2xl)' }}>
            Bantu pengelola menjaga fasilitas umum tetap nyaman, aman, dan terawat dengan melaporkan kerusakan secara cepat.
          </p>

          {errorMsg && (
            <div
              role="alert"
              style={{
                backgroundColor: 'var(--color-danger-light, #fee2e2)',
                color: 'var(--color-danger, #b91c1c)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-lg)',
                fontWeight: 600,
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* LOKASI TERPILIH (OTOMATIS) */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Lokasi Terpilih (Otomatis)</label>
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Tersinkron
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md) var(--space-lg)', backgroundColor: 'var(--color-bg-subtle, #f8fafc)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <MapPin size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <div className="text-caption" style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>RUANG PUBLIK</div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{detail.nama}</div>
                    <div className="text-caption" style={{ color: 'var(--color-text-muted)' }}>{detail.alamat || detail.wilayah}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md) var(--space-lg)', backgroundColor: 'var(--color-bg-subtle, #f8fafc)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <Tag size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <div className="text-caption" style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>FASILITAS</div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>
                      {fasilitasTersedia.find((f) => f.id === selectedFacilityId)?.nama || 'Belum dipilih'}
                    </div>
                    <div className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
                      {fasilitasTersedia.find((f) => f.id === selectedFacilityId)?.kategori || detail.wilayah}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PILIH FASILITAS */}
            <div className="form-group">
              <label className="form-label" htmlFor="fasilitas-select">
                Fasilitas Terkait <span style={{ color: 'var(--color-danger)' }}>*Wajib</span>
              </label>
              <select
                id="fasilitas-select"
                className="form-input"
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                required
              >
                {fasilitasTersedia.length > 0 ? (
                  fasilitasTersedia.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nama} ({f.kategori || 'Umum'})
                    </option>
                  ))
                ) : (
                  <option value="">Fasilitas Umum / Area Terbuka</option>
                )}
              </select>
            </div>

            {/* JENIS MASALAH */}
            <div className="form-group">
              <label className="form-label" htmlFor="jenis-masalah-select">
                Jenis Kerusakan / Masalah <span style={{ color: 'var(--color-danger)' }}>*Wajib</span>
              </label>
              <select
                id="jenis-masalah-select"
                className="form-input"
                value={jenisMasalah}
                onChange={(e) => setJenisMasalah(e.target.value)}
                required
              >
                <option value="Lampu Mati / Penerangan">Lampu Mati / Penerangan</option>
                <option value="Fasilitas Rusak / Patah">Fasilitas Rusak / Patah</option>
                <option value="Toilet Tidak Berfungsi / Kotor">Toilet Tidak Berfungsi / Kotor</option>
                <option value="Sampah Menumpuk / Liar">Sampah Menumpuk / Liar</option>
                <option value="Vandalisme / Coretan">Vandalisme / Coretan</option>
                <option value="Pohon Tumbang / Rawan Roboh">Pohon Tumbang / Rawan Roboh</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {/* DESKRIPSI MASALAH */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="deskripsi-input" style={{ marginBottom: 0 }}>
                  Deskripsi Singkat Kendala <span style={{ color: 'var(--color-danger)' }}>*Wajib</span>
                </label>
                <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>{deskripsi.length} / 200</span>
              </div>
              <textarea
                id="deskripsi-input"
                className="form-input"
                rows={4}
                maxLength={200}
                placeholder="Jelaskan detail masalah, perkiraan lokasi spesifik, atau potensi bahaya jika tidak segera diperbaiki..."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* MODE IDENTITAS */}
            <div className="form-group">
              <label className="form-label">Identitas Pelapor</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="radio"
                    name="modeIdentitas"
                    value="anonim"
                    checked={modeIdentitas === 'anonim'}
                    onChange={() => setModeIdentitas('anonim')}
                  />
                  <span>
                    <strong>Anonim</strong> (Data nama dan profil Anda disembunyikan dari publik)
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="radio"
                    name="modeIdentitas"
                    value="tampilkan_nama"
                    checked={modeIdentitas === 'tampilkan_nama'}
                    onChange={() => setModeIdentitas('tampilkan_nama')}
                  />
                  <span>
                    <strong>Tampilkan Nama Akun Saya</strong> (Nama terdaftar akan terlihat pada riwayat publik)
                  </span>
                </label>
              </div>
            </div>

            {/* UNGGAH FOTO BUKTI */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-foto-bukti">
                Foto Bukti Fisik <span style={{ color: 'var(--color-danger)' }}>*Wajib</span>
              </label>

              {fotoError && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: 'var(--color-danger-light, #fee2e2)',
                    color: 'var(--color-danger, #b91c1c)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {fotoError}
                </div>
              )}

              <div
                tabIndex={0}
                role="button"
                aria-label="Ambil atau unggah foto bukti fisik"
                style={{
                  border: isDashedFocused
                    ? '2px dashed var(--color-primary)'
                    : '2px dashed var(--color-border-dark)',
                  outline: isDashedFocused ? '2px solid var(--color-primary)' : 'none',
                  borderRadius: 'var(--radius-lg)',
                  padding: fotoPreview ? 'var(--space-md)' : 'var(--space-2xl)',
                  textAlign: 'center',
                  backgroundColor: 'var(--color-surface)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'border-color 0.2s, outline 0.2s',
                }}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onFocus={() => setIsDashedFocused(true)}
                onBlur={() => setIsDashedFocused(false)}
              >
                <input
                  id="input-foto-bukti"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                    zIndex: fotoPreview ? 1 : 2,
                  }}
                  onChange={handleFileChange}
                />

                {fotoPreview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 5 }}>
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        maxHeight: '220px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        display: 'flex',
                        justifyContent: 'center',
                        backgroundColor: '#f8fafc',
                      }}
                    >
                      <img
                        src={fotoPreview}
                        alt="Preview Foto Bukti"
                        style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain' }}
                      />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '6px 12px',
                        backgroundColor: 'var(--color-bg-subtle, #f1f5f9)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        position: 'relative',
                        zIndex: 10,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          color: 'var(--color-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle2 size={16} /> Foto Terpilih ({fotoFile?.name})
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleHapusFoto}
                        style={{ position: 'relative', zIndex: 20, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={14} /> Hapus
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                      <Camera size={28} color="#0F766E" />
                    </div>
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '14px',
                        color: 'var(--color-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      + Ambil Foto Langsung atau Unggah
                    </div>
                    <p className="text-caption" style={{ marginTop: '4px', color: 'var(--color-text-muted)' }}>
                      Gunakan kamera untuk mengambil foto kondisi saat ini (PNG/JPG, Maks 5MB).
                    </p>
                  </>
                )}
              </div>
            </div>

             {/* TITIK PRESISI FASILITAS (PETA PIN) */}
             <div className="form-group">
               <label className="form-label">Titik Presisi Fasilitas di Peta</label>
               <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                 {selectedLocation ? (
                   <div style={{ height: '260px', width: '100%', position: 'relative', zIndex: 1 }}>
                     <MapContainer
                       center={[selectedLocation.lat, selectedLocation.lng]}
                       zoom={17}
                       style={{ height: '100%', width: '100%' }}
                       scrollWheelZoom
                     >
                       <TileLayer
                         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                       />
                       <PetaKlikHandler onPick={setSelectedLocation} />
                       <Marker
                         position={[selectedLocation.lat, selectedLocation.lng]}
                         icon={createPrecisionIcon()}
                         draggable
                         eventHandlers={{
                           dragend: (event) => {
                             const position = event.target.getLatLng();
                             setSelectedLocation({ lat: position.lat, lng: position.lng });
                           },
                         }}
                       />
                     </MapContainer>
                   </div>
                 ) : (
                   <div style={{ height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'var(--color-bg-main)', color: 'var(--color-text-muted)' }}>
                     <MapPin size={24} />
                     <p className="text-small" style={{ margin: 0 }}>Koordinat lokasi fasilitas belum tersedia.</p>
                   </div>
                 )}
                 <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--color-surface)' }}>
                   <strong className="text-caption">Geser pin atau klik peta untuk memilih lokasi fasilitas.</strong>
                   <span className="text-caption" style={{ color: 'var(--color-text-muted)' }}>
                     Pin ini menunjukkan lokasi fasilitas yang dilaporkan, bukan lokasi HP Anda.
                   </span>
                   {selectedLocation && (
                     <span className="text-caption" style={{ color: 'var(--color-primary)' }}>
                       Koordinat: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                     </span>
                   )}
                 </div>
               </div>
             </div>

            {/* SUBMIT BUTTONS */}
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-2xl)' }}>
              <Button type="submit" variant="primary" size="lg" disabled={isSubmitting} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Send size={16} /> {isSubmitting ? 'Mengirim Laporan…' : 'Kirim Laporan'}
              </Button>
               <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)} disabled={isSubmitting}>
                Batal
              </Button>
            </div>
          </form>
        </div>

        {/* SIDEBAR PANEL */}
        <div>
          <Card style={{ marginBottom: 'var(--space-xl)' }}>
            <CardBody>
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>Jam Operasional:</strong> {detail.jamOperasional}</div>
                <div><strong>Status Penerangan:</strong> <StatusBadge status="perlu_perhatian" customLabel="Sebagian Butuh Pemeliharaan" /></div>
              </div>

              <div style={{ backgroundColor: 'var(--color-info-light)', padding: '12px', borderRadius: 'var(--radius-md)', marginTop: '16px', fontSize: '12px', color: '#075985', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} /> Laporan Anda diteruskan kepada pengelola ruang publik terkait. Terima kasih atas kepedulian Anda!
              </div>

              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                ℹ️ <strong>Info Validasi Lokasi:</strong> Laporan otomatis tayang bila berada dalam radius ±{FAKE_GPS_THRESHOLD_M} meter dari ruang publik (berdasarkan koordinat GPS & EXIF foto).
              </div>
            </CardBody>
          </Card>

          {/* Panduan Laporan Cepat */}
          <Card style={{ marginBottom: 'var(--space-xl)' }}>
            <CardBody>
              <h4 className="h3" style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={18} color="#0F766E" /> Panduan Laporan Cepat
              </h4>
              <ol style={{ paddingLeft: '20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--color-text-muted)' }}>
                <li>Pastikan posisi tiang atau fasilitas sesuai dengan titik pin mini peta.</li>
                <li>Sertakan foto yang jelas agar pengelola dapat memahami kondisi kerusakan.</li>
                <li>Tidak perlu meninggalkan KTP/NIK. Keterbukaan dan partisipasi Anda adalah prioritas.</li>
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FormLaporPage;
