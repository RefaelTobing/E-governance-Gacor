import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

/**
 * Stepper alur laporan: timeline horizontal dengan node lingkaran + garis penghubung,
 * mengikuti desain Figma (Screen 07 & 12).
 *
 * @param {Array<{key:string,label:string,status?:string}>} langkah - daftar tahap (urut)
 * @param {string} aktif - key tahap yang sedang berjalan
 * @param {boolean} selesaiSemua - true bila seluruh alur sudah tuntas
 */
export const StepperAlur = ({ langkah = [], aktif, selesaiSemua = false }) => {
  const indexAktif = langkah.findIndex((s) => s.key === aktif);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', overflowX: 'auto' }}>
      {langkah.map((step, idx) => {
        const selesai = selesaiSemua || idx < indexAktif;
        const berjalan = !selesai && idx === indexAktif;
        const warna = selesai ? 'var(--color-success)' : berjalan ? 'var(--color-warning)' : 'var(--color-border)';
        const pillLabel = selesai ? 'SELESAI' : berjalan ? 'BERJALAN' : idx === langkah.length - 1 ? 'TAHAP AKHIR' : 'MENUNGGU';

        return (
          <div key={step.key} style={{ flex: '1 0 auto', minWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {/* garis penghubung ke node berikutnya */}
            {idx < langkah.length - 1 && (
              <div style={{ position: 'absolute', top: '20px', left: '50%', width: '100%', height: '3px', backgroundColor: idx < indexAktif || selesaiSemua ? 'var(--color-success)' : 'var(--color-border)', zIndex: 0 }} />
            )}

            {/* node */}
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', zIndex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: selesai ? 'var(--color-success)' : berjalan ? 'var(--color-warning)' : 'var(--color-surface)',
              border: `3px solid ${warna}`,
              color: selesai || berjalan ? 'white' : 'var(--color-text-muted)',
            }}>
              {selesai ? <CheckCircle2 size={18} /> : berjalan ? <Loader2 size={18} /> : <span style={{ fontWeight: 700 }}>{idx + 1}</span>}
            </div>

            {/* teks */}
            <div style={{ textAlign: 'center', marginTop: '10px', padding: '0 4px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-main)' }}>{step.label}</div>
              <span
                className={`badge badge-${selesai ? 'success' : berjalan ? 'warning' : 'neutral'}`}
                style={{ marginTop: '6px', fontSize: '10px' }}
              >
                {pillLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepperAlur;
