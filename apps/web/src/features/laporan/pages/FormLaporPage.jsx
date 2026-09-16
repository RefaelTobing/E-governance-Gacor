import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { MapPin, Camera, CheckCircle2, Send, Info, Lightbulb } from 'lucide-react';
import { MOCK_RUANG_PUBLIK } from '../../../config/mockData';
import { Button, Input, Card, CardBody, StatusBadge } from '../../../components';

export const FormLaporPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const facilityParam = searchParams.get('fasilitas');

  const detail = MOCK_RUANG_PUBLIK.find((item) => item.id === id) || MOCK_RUANG_PUBLIK[0];
  const defaultFacility = detail.fasilitas.find((f) => f.id === facilityParam) || detail.fasilitas[0];

  // Form State
  const [selectedFacilityId, setSelectedFacilityId] = useState(defaultFacility.id);
  const [jenisMasalah, setJenisMasalah] = useState('Lampu Mati / Penerangan');
  const [deskripsi, setDeskripsi] = useState('');
  const [modeIdentitas, setModeIdentitas] = useState('anonim'); // FEAT-009: anonim vs tampilkan_nama
  const [fotoFile, setFotoFile] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Laporan berhasil dikirim! Laporan Anda telah masuk ke antrian peninjauan pengelola.');
    navigate('/laporan-saya');
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-4xl)' }}>
      {/* BREADCRUMB */}
      <nav style={{ marginBottom: 'var(--space-md)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
        <Link to="/home" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Beranda</Link>
        {' > '}
        <Link to={`/ruang-publik/${detail.id}`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>{detail.nama}</Link>
        {' > '}
        <strong style={{ color: 'var(--color-text-main)' }}>Buat Laporan Fasilitas</strong>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 'var(--space-2xl)' }}>
        {/* MAIN FORM COLUMN */}
        <div>
          <span className="badge badge-info" style={{ marginBottom: 'var(--space-xs)' }}>PARTISIPASI WARGA</span>
          <h1 className="text-display" style={{ marginBottom: '4px' }}>Laporkan Masalah Fasilitas</h1>
          <p className="text-body" style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2xl)' }}>
            Bantu informasikan kondisi fasilitas yang rusak atau membutuhkan perhatian agar dapat segera ditindaklanjuti.
          </p>

          <form onSubmit={handleSubmit}>
            {/* LOKASI & FASILITAS TERPILIH BOX */}
            <div style={{ backgroundColor: 'var(--color-primary-light)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-xl)', border: '1px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} /> LOKASI TERPILIH (OTOMATIS)
                </span>
                <span className="badge badge-success">Tersinkron</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <span className="text-caption" style={{ fontWeight: 700 }}>TAMAN KOTA</span>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{detail.nama} ({detail.wilayah})</div>
                </div>
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <span className="text-caption" style={{ fontWeight: 700 }}>SPESIFIKASI FASILITAS</span>
                  <select
                    className="form-select"
                    value={selectedFacilityId}
                    onChange={(e) => setSelectedFacilityId(e.target.value)}
                    style={{ marginTop: '2px', padding: '4px 8px', fontSize: '13px' }}
                  >
                    {detail.fasilitas.map((f) => (
                      <option key={f.id} value={f.id}>{f.nama}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* JENIS MASALAH */}
            <div className="form-group">
              <label className="form-label">
                Jenis Masalah <span style={{ color: 'var(--color-danger)' }}>*Wajib</span>
              </label>
              <select
                className="form-select"
                value={jenisMasalah}
                onChange={(e) => setJenisMasalah(e.target.value)}
                required
              >
                <option value="Lampu Mati / Penerangan">Lampu Mati / Penerangan</option>
                <option value="Fasilitas Rusak">Fasilitas Physical Rusak</option>
                <option value="Masalah Kebersihan">Masalah Kebersihan / Sampah</option>
                <option value="Bangku Rusak">Bangku / Meja Rusak</option>
                <option value="Vandalisme">Vandalisme / Coretan</option>
                <option value="Lainnya">Kendala Lainnya</option>
              </select>
            </div>

            {/* DESKRIPSI SINGKAT */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">
                  Deskripsi Singkat Kendala <span style={{ color: 'var(--color-danger)' }}>*Wajib</span>
                </label>
                <span className="text-caption">{deskripsi.length}/200</span>
              </div>
              <textarea
                className="form-textarea"
                rows={4}
                maxLength={200}
                placeholder="Jelaskan letak atau kendala secara singkat dan padat agar teknisi dapat membawa alat yang sesuai."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                required
              />
            </div>

            {/* MODE IDENTITAS (PRD FEAT-009) */}
            <div className="form-group" style={{ backgroundColor: 'var(--color-bg-main)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <label className="form-label" style={{ marginBottom: '8px' }}>
                Mode Identitas Pelapor (FEAT-009) <span style={{ color: 'var(--color-danger)' }}>*Wajib</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                    type="radio"
                    name="modeIdentitas"
                    value="anonim"
                    checked={modeIdentitas === 'anonim'}
                    onChange={() => setModeIdentitas('anonim')}
                  />
                  <span>
                    <strong>Kirim sebagai Anonim</strong> (Direkomendasikan — Identitas Anda tidak ditampilkan ke publik)
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
              <label className="form-label">
                Foto Bukti Fisik <span style={{ color: 'var(--color-danger)' }}>*Wajib</span>
              </label>
              <div
                style={{
                  border: '2px dashed var(--color-border-dark)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-2xl)',
                  textAlign: 'center',
                  backgroundColor: 'var(--color-surface)',
                  cursor: 'pointer'
                }}
                onClick={() => setShowCameraModal(true)}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <Camera size={28} color="#0F766E" />
                </div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {fotoFile ? <><CheckCircle2 size={16} /> Foto Terpilih</> : '+ Ambil Foto Langsung atau Unggah'}
                </div>
                <p className="text-caption" style={{ marginTop: '4px' }}>
                  Gunakan kamera untuk mengambil foto kondisi saat ini (PNG/JPG, Maks 5MB).
                </p>
              </div>
            </div>

            {/* TITIK PRESISI FASILITAS (PETA PIN) */}
            <div className="form-group">
              <label className="form-label">Titik Presisi Fasilitas di Peta</label>
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ position: 'relative', height: '160px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <MapPin size={24} color="#0F766E" />
                    </div>
                    <span className="badge badge-info" style={{ marginTop: '4px' }}>Posisi Koordinat Presisi</span>
                  </div>
                </div>
                <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface)' }}>
                  <span className="text-caption">Posisi: Sisi Teuku Umar / Pedestrian Utama</span>
                  <Button variant="outline" size="sm" onClick={() => alert('Geser pin pada peta untuk menyesuaikan lokasi presisi.')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} /> Ubah Posisi Pin
                  </Button>
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTONS */}
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-2xl)' }}>
              <Button type="submit" variant="primary" size="lg" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Send size={16} /> Kirim Laporan
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
                Batal
              </Button>
            </div>
          </form>
        </div>

        {/* SIDEBAR PANEL */}
        <div>
          <Card style={{ marginBottom: 'var(--space-xl)' }}>
            <CardBody>
              <div style={{ position: 'relative', height: '140px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '16px' }}>
                <img src={detail.image} alt={detail.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '12px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <span className="text-caption" style={{ color: 'var(--color-primary-light)', fontWeight: 700 }}>AREA PELAPORAN</span>
                  <strong style={{ fontSize: '16px' }}>{detail.nama}</strong>
                </div>
              </div>

              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>Jam Operasional:</strong> {detail.jamOperasional}</div>
                <div><strong>Status Penerangan:</strong> <StatusBadge status="perlu_perhatian" customLabel="Sebagian Butuh Pemeliharaan" /></div>
              </div>

              <div style={{ backgroundColor: 'var(--color-info-light)', padding: '12px', borderRadius: 'var(--radius-md)', marginTop: '16px', fontSize: '12px', color: '#075985', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} /> Laporan diteruskan langsung ke tim patroli teknis Taman Kota tanpa registrasi berbelit. Terima kasih atas kepedulian Anda!
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
                <li>Sertakan foto jika memungkinkan untuk mempermudah identifikasi kerusakan suku cadang.</li>
                <li>Tidak perlu meninggalkan KTP/NIK. Keterbukaan dan partisipasi Anda adalah prioritas.</li>
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* MODAL KAMERA MOBILE (Screen 06B) */}
      {showCameraModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <Card style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
            <CardBody style={{ padding: '24px' }}>
              <h3 className="h3" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Camera size={20} /> Kamera Mobile
              </h3>
              <div style={{ height: '260px', backgroundColor: '#000', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '16px' }}>
                [ Preview Simulasi Kamera Mobile ]
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" fullWidth onClick={() => setShowCameraModal(false)}>
                  Batal
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    setFotoFile('foto-bukti-fasilitas.jpg');
                    setShowCameraModal(false);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Camera size={16} /> Ambil Foto
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FormLaporPage;
