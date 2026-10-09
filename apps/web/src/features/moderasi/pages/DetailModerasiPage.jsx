import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Tag,
  MapPin,
  ExternalLink,
  Wrench,
  CheckCircle2,
  XCircle,
  History,
  AlertTriangle
} from 'lucide-react';
import { Button, Card, CardBody, StatusBadge, EmptyState, Skeleton, Modal } from '../../../components';
import {
  getReportDetail,
  updateReportStatus,
  approveReport,
  rejectReport
} from '../../../services/laporanService';

// Urutan tahap siklus laporan untuk stepper progres.
const STATUS_STEPS = [
  { key: 'menunggu_verifikasi', label: '1. Menunggu Verifikasi' },
  { key: 'diverifikasi', label: '2. Diverifikasi' },
  { key: 'dalam_penanganan', label: '3. Dalam Penanganan' },
  { key: 'selesai', label: '4. Selesai' }
];

// Format waktu ISO -> "8 Sep 2026 • 08:30 WIB" (fallback '' bila kosong/invalid).
const formatWaktu = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const tanggal = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `${tanggal} • ${jam} WIB`;
};

// Warna garis timeline mengikuti status tiap entri.
const warnaTimeline = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'SELESAI' || s === 'DIVERIFIKASI') return 'var(--color-success)';
  if (s === 'DALAM_PENANGANAN') return 'var(--color-warning)';
  if (s === 'DITOLAK') return 'var(--color-danger)';
  return 'var(--color-primary)';
};

export const DetailModerasiPage = () => {
  const { laporanId } = useParams();
  const navigate = useNavigate();

  const [laporan, setLaporan] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('menunggu_verifikasi');
  const [catatanPetugas, setCatatanPetugas] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Status aksi (approve / PATCH status).
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Dialog tolak (FE-25B).
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [alasanTolak, setAlasanTolak] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const data = await getReportDetail(laporanId);
        if (isMounted && data) {
          setLaporan(data);
          setCurrentStatus(data.status);
        }
      } catch (err) {
        console.error('Error fetching moderasi report detail:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (laporanId) {
      fetchReport();
    }

    return () => {
      isMounted = false;
    };
  }, [laporanId]);

  // Perbarui state halaman dari response backend (LaporanDetailResponse).
  const terapkanHasil = (hasil) => {
    if (!hasil) return;
    setLaporan((prev) => ({ ...prev, ...hasil }));
    if (hasil.status) setCurrentStatus(hasil.status);
  };

  // Transisi status biasa (dalam_penanganan / selesai) via PATCH /reports/{id}/status.
  const handleUpdateStatus = async (newStatus) => {
    setActionError('');
    setIsSubmitting(true);
    try {
      const hasil = await updateReportStatus(laporan.id, {
        status: newStatus,
        description: catatanPetugas || undefined
      });
      terapkanHasil(hasil);
    } catch (err) {
      setActionError(err.message || 'Gagal memperbarui status laporan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Setujui laporan (FE-25A) via POST /admin/reports/{id}/approve.
  const handleApprove = async () => {
    setActionError('');
    setIsSubmitting(true);
    try {
      const hasil = await approveReport(laporan.id, catatanPetugas);
      terapkanHasil(hasil);
      navigate('/dashboard/moderasi');
    } catch (err) {
      // 409 = status sudah di luar menunggu_verifikasi/ditolak; muat ulang detail.
      setActionError(err.message || 'Gagal menyetujui laporan.');
      try {
        const fresh = await getReportDetail(laporan.id);
        terapkanHasil(fresh);
      } catch {
        /* biarkan pesan error utama tampil */
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const bukaDialogTolak = () => {
    setAlasanTolak('');
    setRejectError('');
    setIsRejectOpen(true);
  };

  const tutupDialogTolak = () => {
    if (isRejecting) return;
    setIsRejectOpen(false);
  };

  // Tolak laporan (FE-25B) via POST /admin/reports/{id}/reject (alasan wajib).
  const handleReject = async () => {
    if (!alasanTolak.trim()) {
      setRejectError('Alasan penolakan wajib diisi.');
      return;
    }
    setRejectError('');
    setIsRejecting(true);
    try {
      const hasil = await rejectReport(laporan.id, alasanTolak);
      terapkanHasil(hasil);
      setIsRejectOpen(false);
    } catch (err) {
      // 409 = laporan sudah ditolak; muat ulang detail.
      setRejectError(err.message || 'Gagal menolak laporan.');
      try {
        const fresh = await getReportDetail(laporan.id);
        terapkanHasil(fresh);
      } catch {
        /* biarkan pesan error utama tampil */
      }
    } finally {
      setIsRejecting(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton height="20px" width="200px" style={{ marginBottom: 'var(--space-md)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2xl)' }}>
          <div style={{ width: '60%' }}>
            <Skeleton height="36px" width="100%" style={{ marginBottom: '8px' }} />
            <Skeleton height="18px" width="50%" />
          </div>
          <Skeleton height="28px" width="120px" borderRadius="var(--radius-pill)" />
        </div>
        <Card style={{ marginBottom: 'var(--space-2xl)' }}>
          <CardBody style={{ padding: 'var(--space-xl)' }}>
            <Skeleton height="100px" />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!laporan) {
    return (
      <div>
        <EmptyState
          title="Laporan Tidak Ditemukan"
          description="Data laporan untuk moderasi tidak tersedia atau ID tidak valid."
          actionLabel="Kembali ke Daftar Laporan"
          onAction={() => navigate('/dashboard/moderasi')}
        />
      </div>
    );
  }

  const isDitolak = currentStatus === 'ditolak';
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  const tahapLabel = isDitolak
    ? 'DITOLAK'
    : `TAHAP ${Math.max(currentIndex + 1, 1)} DARI ${STATUS_STEPS.length}`;

  return (
    <div>
      {/* TOP NAVIGATION BACK LINK */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <Link to="/dashboard/moderasi" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ArrowLeft size={16} /> Kembali ke Daftar Laporan
        </Link>
        <span className="text-caption" style={{ fontWeight: 700 }}>ID LAPORAN: #{laporan.id}</span>
      </div>

      {/* HEADER TITLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <h1 className="text-display">Verifikasi & Pembaruan Laporan Fasilitas</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Masuk: {laporan.tanggal || '—'} • {laporan.wilayah || 'Wilayah belum tersedia'}
          </p>
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      {/* STEPPER PROGRESS ALUR STATUS */}
      <Card style={{ marginBottom: 'var(--space-2xl)' }}>
        <CardBody style={{ padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>ALUR STATUS PENANGANAN</span>
            <span className={`badge ${isDitolak ? 'badge-danger' : 'badge-info'}`}>{tahapLabel}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', position: 'relative' }}>
            {STATUS_STEPS.map((step, i) => {
              const selesai = !isDitolak && currentIndex > i;
              const aktif = !isDitolak && currentIndex === i;
              const gaya = selesai
                ? { backgroundColor: 'var(--color-success-light)' }
                : aktif
                  ? { backgroundColor: 'var(--color-warning-light)', border: '2px solid var(--color-warning)' }
                  : { backgroundColor: 'var(--color-bg-main)', opacity: 0.6 };
              const warnaTeks = selesai ? '#065F46' : aktif ? '#92400E' : 'var(--color-text-main)';
              const keterangan = selesai ? 'Selesai' : aktif ? 'Aktif Sekarang' : 'Menunggu';
              return (
                <div key={step.key} style={{ padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center', ...gaya }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: warnaTeks }}>{step.label}</div>
                  <span className="text-caption" style={{ color: aktif ? '#92400E' : undefined, fontWeight: aktif ? 700 : undefined }}>{keterangan}</span>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* MAIN TWO COLUMN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--space-2xl)' }}>
        {/* LEFT COLUMN: REPORT DETAILS */}
        <div>
          <Card style={{ marginBottom: 'var(--space-xl)' }}>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Tag size={12} /> {laporan.jenisMasalah}
                </span>
                <StatusBadge status={currentStatus} />
              </div>

              <h2 className="h2" style={{ marginBottom: '4px' }}>{laporan.fasilitasNama}</h2>
              <p className="text-small" style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} color="var(--color-text-muted)" /> {laporan.ruangPublikNama} ({laporan.wilayah})
              </p>

              {/* GRID INFO BOXES */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <span className="text-caption">FASILITAS TERKAIT</span>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{laporan.fasilitasNama}</div>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <span className="text-caption">TITIK PRESISI</span>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>
                    {laporan.lokasiPilihan &&
                    Number.isFinite(Number(laporan.lokasiPilihan.lat)) &&
                    Number.isFinite(Number(laporan.lokasiPilihan.lng))
                      ? `${Number(laporan.lokasiPilihan.lat).toFixed(5)}, ${Number(laporan.lokasiPilihan.lng).toFixed(5)}`
                      : 'Belum ditentukan'}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <span className="text-caption">PELAPOR</span>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>
                    {laporan.modeIdentitas === 'anonim'
                      ? 'Anonim'
                      : (laporan.namaPelapor || 'Nama tidak tersedia')}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <span className="text-caption">WILAYAH</span>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px', color: 'var(--color-primary)' }}>{laporan.wilayah || '—'}</div>
                </div>
              </div>

              {/* ALASAN PENOLAKAN (BE-30) */}
              {laporan.alasanPenolakan && (
                <div style={{ backgroundColor: 'var(--color-danger-light)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-xl)', color: '#991B1B' }}>
                  <span className="text-caption" style={{ fontWeight: 700, color: '#991B1B', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} /> ALASAN PENOLAKAN
                  </span>
                  <p className="text-body" style={{ marginTop: '6px' }}>{laporan.alasanPenolakan}</p>
                </div>
              )}

              {/* CITIZEN DESCRIPTION */}
              <div style={{ backgroundColor: 'var(--color-bg-main)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-xl)' }}>
                <span className="text-caption" style={{ fontWeight: 700 }}>DESKRIPSI LAPORAN WARGA</span>
                <p className="text-body" style={{ fontStyle: 'italic', marginTop: '6px' }}>
                  "{laporan.deskripsi}"
                </p>
              </div>

              {/* BUKTI FOTO */}
              <div>
                <span className="text-caption" style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>BUKTI FOTO WARGA & POSISI TERDATA</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <div style={{ height: '160px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <img src={laporan.foto} alt="Bukti Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <span className="text-caption" style={{ fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
                      <MapPin size={12} color="#0F766E" /> {laporan.wilayah || 'Wilayah belum tersedia'}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(laporan.ruangPublikNama)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <Button variant="outline" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Buka Peta <ExternalLink size={12} />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* RIGHT COLUMN: ACTION PANEL & TIMELINE */}
        <div>
          {/* Action Box Petugas */}
          <Card style={{ marginBottom: 'var(--space-xl)' }}>
            <CardBody>
              <h3 className="h3" style={{ fontSize: '18px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wrench size={18} color="#0F766E" /> Tindakan Petugas
              </h3>
              <p className="text-caption" style={{ marginBottom: '16px' }}>Perbarui status siklus laporan berdasarkan kondisi riil di lapangan.</p>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="catatan-petugas">Catatan Petugas (opsional)</label>
                <textarea
                  id="catatan-petugas"
                  className="form-textarea"
                  rows={2}
                  value={catatanPetugas}
                  onChange={(e) => setCatatanPetugas(e.target.value)}
                  placeholder="Tambahkan catatan untuk perubahan status..."
                />
              </div>

              {actionError && (
                <div role="alert" style={{ backgroundColor: 'var(--color-danger-light)', color: '#991B1B', padding: '10px 12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>{actionError}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button
                  variant="primary"
                  fullWidth
                  disabled={isSubmitting || isRejecting}
                  onClick={handleApprove}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <CheckCircle2 size={16} /> Setujui Laporan
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={isSubmitting || isRejecting}
                  onClick={() => handleUpdateStatus('dalam_penanganan')}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Wrench size={16} /> Tandai Dalam Penanganan
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  disabled={isSubmitting || isRejecting}
                  onClick={() => handleUpdateStatus('selesai')}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <CheckCircle2 size={16} /> Tandai Selesai
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  disabled={isSubmitting || isRejecting}
                  onClick={bukaDialogTolak}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <XCircle size={16} /> Tolak Laporan (Spam / Tidak Sesuai)
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Audit Log Pembaruan */}
          <Card>
            <CardBody>
              <h4 className="h3" style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={16} color="#0F766E" /> Catatan Pembaruan Timeline
              </h4>
              {laporan.timeline && laporan.timeline.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  {laporan.timeline.map((entry, idx) => (
                    <div key={idx} style={{ borderLeft: `3px solid ${warnaTimeline(entry.status)}`, paddingLeft: '10px' }}>
                      <strong>{entry.title}</strong>
                      {formatWaktu(entry.date) && (
                        <div className="text-caption">{formatWaktu(entry.date)}</div>
                      )}
                      {entry.desc && (
                        <p className="text-caption" style={{ marginTop: '2px' }}>{entry.desc}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-caption">Belum ada catatan pembaruan untuk laporan ini.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* DIALOG TOLAK (FE-25B) */}
      <Modal
        open={isRejectOpen}
        onClose={tutupDialogTolak}
        title="Tolak Laporan"
        labelledBy="dialog-tolak-title"
      >
        <p className="text-small" style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
          Berikan alasan penolakan. Alasan ini tersimpan dan tampil di riwayat laporan.
        </p>
        <div className="form-group">
          <label className="form-label" htmlFor="alasan-tolak">Alasan Penolakan <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <textarea
            id="alasan-tolak"
            className="form-textarea"
            rows={3}
            value={alasanTolak}
            onChange={(e) => {
              setAlasanTolak(e.target.value);
              if (rejectError) setRejectError('');
            }}
            placeholder="Contoh: Foto tidak jelas dan lokasi tidak sesuai."
            required
          />
        </div>
        {rejectError && (
          <div role="alert" style={{ color: 'var(--color-danger)', fontSize: '13px', marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{rejectError}</span>
          </div>
        )}
        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" onClick={tutupDialogTolak} disabled={isRejecting}>Batal</Button>
          <Button variant="danger" onClick={handleReject} disabled={isRejecting || !alasanTolak.trim()}>
            {isRejecting ? 'Menolak…' : 'Tolak Laporan'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default DetailModerasiPage;
