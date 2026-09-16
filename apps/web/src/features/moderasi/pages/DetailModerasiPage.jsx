import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Tag,
  MapPin,
  ExternalLink,
  Wrench,
  CheckCircle2,
  XCircle,
  History
} from 'lucide-react';
import { MOCK_LAPORAN } from '../../../config/mockData';
import { Button, Card, CardBody, StatusBadge } from '../../../components';

export const DetailModerasiPage = () => {
  const { laporanId } = useParams();
  const navigate = useNavigate();

  const laporan = MOCK_LAPORAN.find((item) => item.id === laporanId) || MOCK_LAPORAN[0];
  const [currentStatus, setCurrentStatus] = useState(laporan.status);
  const [catatanPetugas, setCatatanPetugas] = useState('');

  const handleUpdateStatus = (newStatus) => {
    setCurrentStatus(newStatus);
    alert(`Status laporan #${laporan.id} berhasil diperbarui menjadi: ${newStatus.toUpperCase()}`);
  };

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
            Masuk: {laporan.tanggal} • Penanganan Wilayah Dinas Pertamanan
          </p>
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      {/* STEPPER PROGRESS ALUR STATUS */}
      <Card style={{ marginBottom: 'var(--space-2xl)' }}>
        <CardBody style={{ padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>ALUR STATUS PENANGANAN</span>
            <span className="badge badge-info">TAHAP 3 DARI 4</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', position: 'relative' }}>
            <div style={{ backgroundColor: 'var(--color-success-light)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#065F46' }}>1. Menunggu Verifikasi</div>
              <span className="text-caption">Selesai</span>
            </div>
            <div style={{ backgroundColor: 'var(--color-success-light)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#065F46' }}>2. Diverifikasi</div>
              <span className="text-caption">Tervalidasi</span>
            </div>
            <div style={{ backgroundColor: 'var(--color-warning-light)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '2px solid var(--color-warning)' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#92400E' }}>3. Dalam Penanganan</div>
              <span className="text-caption" style={{ color: '#92400E', fontWeight: 700 }}>Aktif Sekarang</span>
            </div>
            <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center', opacity: 0.6 }}>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>4. Selesai</div>
              <span className="text-caption">Menunggu Konfirmasi</span>
            </div>
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
                <span className="text-caption">ID SPESIFIKASI: F-PK-0882</span>
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
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>Sisi Selatan Teuku Umar</div>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <span className="text-caption">PELAPOR</span>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{laporan.namaPelapor}</div>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <span className="text-caption">STATUS DISTRIK</span>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px', color: 'var(--color-primary)' }}>Prioritas Penataan Fasum</div>
                </div>
              </div>

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
                  <div style={{ backgroundColor: '#e2e8f0', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <span className="text-caption" style={{ fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} color="#0F766E" /> Menteng, Jakarta Pusat
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => handleUpdateStatus('dalam_penanganan')}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Wrench size={16} /> Tandai Dalam Penanganan
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => handleUpdateStatus('selesai')}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <CheckCircle2 size={16} /> Tandai Selesai
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => handleUpdateStatus('ditolak')}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: '10px' }}>
                  <strong>Laporan Diterima</strong>
                  <div className="text-caption">8 Sep 2026 • 08:30 WIB</div>
                  <p className="text-caption" style={{ marginTop: '2px' }}>Laporan diterima dari warga via aplikasi dengan bukti foto.</p>
                </div>
                <div style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: '10px' }}>
                  <strong>Diverifikasi Pengawas</strong>
                  <div className="text-caption">8 Sep 2026 • 11:15 WIB</div>
                  <p className="text-caption" style={{ marginTop: '2px' }}>Status dinaikkan ke proses eksekusi lapangan.</p>
                </div>
                <div style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: '10px' }}>
                  <strong>Tindakan Lapangan</strong>
                  <div className="text-caption">9 Sep 2026 • 09:00 WIB</div>
                  <p className="text-caption" style={{ marginTop: '2px' }}>Petugas teknis melakukan penggantian bohlam LED 50W.</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DetailModerasiPage;
