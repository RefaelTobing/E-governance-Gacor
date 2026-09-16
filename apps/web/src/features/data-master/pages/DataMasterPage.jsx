import React from 'react';
import { MOCK_RUANG_PUBLIK } from '../../../config/mockData';
import { Button, Card, CardBody } from '../../../components';

export const DataMasterPage = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="text-caption" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            DATA MASTER • SINKRONISASI SATU DATA
          </span>
          <h1 className="text-display" style={{ marginTop: '2px' }}>Data Master Ruang Publik</h1>
          <p className="text-small" style={{ color: 'var(--color-text-muted)' }}>
            Data resmi lokasi ruang terbuka hijau hasil integrasi Satu Data Jakarta.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => alert('Impor Data Baru dari Satu Data Jakarta')}>
          🔄 Impor Data Satu Data
        </Button>
      </div>

      <Card>
        <CardBody>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-main)', borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>NAMA RUANG PUBLIK</th>
                  <th style={{ padding: '12px' }}>KATEGORI</th>
                  <th style={{ padding: '12px' }}>WILAYAH</th>
                  <th style={{ padding: '12px' }}>JAM OPERASIONAL</th>
                  <th style={{ padding: '12px' }}>FASILITAS</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RUANG_PUBLIK.map((rp) => (
                  <tr key={rp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>📍 {rp.nama}</td>
                    <td style={{ padding: '12px' }}><span className="badge badge-info">{rp.kategori}</span></td>
                    <td style={{ padding: '12px' }}>{rp.wilayah}</td>
                    <td style={{ padding: '12px' }}>{rp.jamOperasional}</td>
                    <td style={{ padding: '12px' }}>{rp.fasilitas.length} Terdata</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <Button variant="outline" size="sm" onClick={() => alert(`Edit Ruang Publik: ${rp.nama}`)}>
                        Edit Master
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

export default DataMasterPage;
