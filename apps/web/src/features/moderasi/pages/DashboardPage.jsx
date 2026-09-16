import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Download,
  ClipboardList,
  Inbox,
  Wrench,
  CheckCircle2,
  MapPin,
  Lightbulb,
  Droplets,
  Armchair,
  Radio
} from 'lucide-react';
import { MOCK_LAPORAN } from '../../../config/mockData';
import { Button, Card, CardBody, StatusBadge, SearchInput } from '../../../components';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLaporan = MOCK_LAPORAN.filter((item) =>
    item.fasilitasNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ruangPublikNama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* HEADER PAGE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            ● DISTRIK TERPADU • WILAYAH DKI JAKARTA
          </span>
          <h1 className="text-display" style={{ marginTop: '2px' }}>Dashboard Pengelola Ruang Publik</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Ringkasan verifikasi dan status pemeliharaan fasilitas ruang terbuka hijau Jakarta.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Pembaruan: Hari Ini, 10:45 WIB
          </Button>
          <Button variant="primary" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> Unduh Laporan (CSV)
          </Button>
        </div>
      </div>

      {/* 4 SUMMARY STATISTIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="text-caption" style={{ fontWeight: 700 }}>TOTAL LAPORAN</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={18} />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '4px' }}>148</div>
            <span className="text-caption">Laporan Terdata</span>
            <div style={{ marginTop: '12px' }}>
              <span className="badge badge-info">Seluruh RTH Aktif</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-info)' }}>MENUNGGU VERIFIKASI</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-info-light)', color: 'var(--color-info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Inbox size={18} />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-info)', marginBottom: '4px' }}>12</div>
            <span className="text-caption">Laporan Baru</span>
            <div style={{ marginTop: '12px' }}>
              <span className="badge badge-info">Perlu Tinjauan Lapangan</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-warning)' }}>DALAM PENANGANAN</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={18} />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-warning)', marginBottom: '4px' }}>24</div>
            <span className="text-caption">Fasilitas Sedang Dikerjakan</span>
            <div style={{ marginTop: '12px' }}>
              <span className="badge badge-warning">Proses Perbaikan Fisik</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-success)' }}>SELESAI</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-success)', marginBottom: '4px' }}>112</div>
            <span className="text-caption">Fasilitas Normal Kembali</span>
            <div style={{ marginTop: '12px' }}>
              <span className="badge badge-success">Kondisi RTH Terverifikasi</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ROW 1: PETA SEBARAN & RINGKASAN KATEGORI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
        {/* Peta Sebaran Laporan Aktif */}
        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <div>
                <h3 className="h3" style={{ fontSize: '18px' }}>Peta Sebaran Laporan Aktif</h3>
                <p className="text-caption">Sebaran titik perhatian publik di taman dan ruang komunal kota.</p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="badge badge-info">Wilayah Terbuka</span>
                <span className="badge badge-warning">Titik Insiden</span>
              </div>
            </div>

            <div style={{ height: '240px', backgroundColor: '#e2e8f0', borderRadius: 'var(--radius-md)', position: 'relative', overflow: 'hidden', backgroundImage: 'radial-gradient(#CBD5E1 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }}>
              <div style={{ position: 'absolute', top: '30%', left: '35%', textAlign: 'center' }}>
                <span style={{ backgroundColor: 'var(--color-warning)', color: 'white', padding: '4px 8px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} color="#FFFFFF" /> Taman Suropati (Lampu Mati)
                </span>
              </div>
              <div style={{ position: 'absolute', top: '60%', left: '55%', textAlign: 'center' }}>
                <span style={{ backgroundColor: 'var(--color-info)', color: 'white', padding: '4px 8px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} color="#FFFFFF" /> Tebet Eco Park (Kran Bocor)
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Ringkasan Kategori */}
        <Card>
          <CardBody>
            <h3 className="h3" style={{ fontSize: '18px', marginBottom: '4px' }}>Ringkasan Kategori</h3>
            <p className="text-caption" style={{ marginBottom: 'var(--space-md)' }}>Distribusi masalah fasilitas terlapor.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-small" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Wrench size={14} color="#0F766E" /> Fasilitas Rusak
                </span>
                <strong style={{ color: 'var(--color-primary)' }}>54 Kasus</strong>
              </div>
              <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-small" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Lightbulb size={14} color="#0F766E" /> Lampu Mati
                </span>
                <strong style={{ color: 'var(--color-primary)' }}>42 Kasus</strong>
              </div>
              <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-small" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Droplets size={14} color="#0F766E" /> Masalah Kebersihan
                </span>
                <strong style={{ color: 'var(--color-primary)' }}>32 Kasus</strong>
              </div>
              <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-small" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Armchair size={14} color="#0F766E" /> Bangku Rusak
                </span>
                <strong style={{ color: 'var(--color-primary)' }}>20 Kasus</strong>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ROW 2: MONITORING LAPORAN TERKINI TABLE */}
      <Card>
        <CardBody>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <div>
              <h3 className="h3" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Radio size={18} color="#0F766E" /> Monitoring Laporan Terkini
              </h3>
              <p className="text-caption">Hubungan terpadu laporan warga, objek fasilitas, dan status penanganan dinas.</p>
            </div>
            <div style={{ width: '280px' }}>
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari fasilitas / lokasi..."
              />
            </div>
          </div>

          {/* DATA TABLE */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-main)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>LAPORAN</th>
                  <th style={{ padding: '12px' }}>LOKASI</th>
                  <th style={{ padding: '12px' }}>FASILITAS</th>
                  <th style={{ padding: '12px' }}>TANGGAL</th>
                  <th style={{ padding: '12px' }}>STATUS</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredLaporan.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{row.fasilitasNama}</td>
                    <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} color="var(--color-text-muted)" /> {row.ruangPublikNama}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-neutral">{row.jenisMasalah.split('/')[0]}</span>
                    </td>
                    <td style={{ padding: '12px' }}>{row.tanggal}</td>
                    <td style={{ padding: '12px' }}>
                      <StatusBadge status={row.status} />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/dashboard/moderasi/${row.id}`)}
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default DashboardPage;
