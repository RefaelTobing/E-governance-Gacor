import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ClipboardList,
  ShieldCheck,
  Search,
  ChevronDown,
  Mail,
  Phone,
  CheckCircle2,
  Gamepad2,
  Lightbulb,
  Droplets,
  Armchair,
  Sparkles,
  ArrowRight,
  Trees,
  Check
} from 'lucide-react';

const STEPS = [
  {
    num: '01',
    title: 'Eksplorasi Lokasi',
    body: 'Cari taman kota, RPTRA, RTH, atau lapangan olahraga di seluruh wilayah DKI Jakarta melalui direktori lengkap dengan foto dan alamat.',
    icon: MapPin,
    accent: '#0F766E'
  },
  {
    num: '02',
    title: 'Pantau Fasilitas',
    body: 'Lihat status terkini setiap fasilitas: toilet, penerangan, playground, dan bangku taman sebelum berkunjung.',
    icon: Search,
    accent: '#0F766E'
  },
  {
    num: '03',
    title: 'Laporkan Kerusakan',
    body: 'Temukan fasilitas yang rusak? Kirim laporan dengan foto dan deskripsi singkat. Laporan dapat dikirim anonim.',
    icon: ClipboardList,
    accent: '#F59E0B'
  },
  {
    num: '04',
    title: 'Tindak Lanjut Petugas',
    body: 'Petugas Dinas Pertamanan atau RPTRA memverifikasi dan menindaklanjuti perbaikan secara akuntabel.',
    icon: ShieldCheck,
    accent: '#0F766E'
  }
];

const FACILITIES = [
  {
    title: 'Arena Bermain',
    description: 'Ayunan, perosotan, dan lantai peredam benturan anak.',
    icon: Gamepad2,
    status: 'Kondisi Baik',
    statusColor: '#10B981',
    statusBg: '#ECFDF5'
  },
  {
    title: 'Penerangan Jalur',
    description: 'Lampu pedestrian solar cell dan tiang penerangan utama.',
    icon: Lightbulb,
    status: 'Sebagian Rusak',
    statusColor: '#EF4444',
    statusBg: '#FEF2F2'
  },
  {
    title: 'Sanitasi & Toilet',
    description: 'Kebersihan toilet umum, kran air, dan wastafel cuci tangan.',
    icon: Droplets,
    status: 'Kondisi Baik',
    statusColor: '#10B981',
    statusBg: '#ECFDF5'
  },
  {
    title: 'Bangku Taman',
    description: 'Kenyamanan bangku taman kayu dan gazebo kanopi warga.',
    icon: Armchair,
    status: 'Perlu Perhatian',
    statusColor: '#D97706',
    statusBg: '#FFFBEB'
  }
];

const FAQ_ITEMS = [
  {
    q: 'Apakah saya harus daftar akun untuk melaporkan kerusakan fasilitas?',
    a: 'Tidak wajib. Laporan bisa dikirim sebagai anonim tanpa membuat akun. Namun jika Anda mendaftar, Anda dapat memantau status tindak lanjut laporan Anda secara langsung.'
  },
  {
    q: 'Berapa lama biasanya laporan saya ditindaklanjuti?',
    a: 'Setiap laporan akan diverifikasi oleh admin pengelola dalam 1 x 24 jam kerja. Penanganan fisik di lapangan bergantung pada jenis kerusakan dan unit pelaksana terkait.'
  },
  {
    q: 'Bagaimana saya tahu laporan saya sudah diproses?',
    a: 'Jika Anda memiliki akun, status laporan akan diperbarui secara otomatis di halaman "Laporan Saya". Anda bisa melihat apakah laporan sedang diverifikasi, dalam penanganan, atau sudah selesai.'
  },
  {
    q: 'Apakah platform ini resmi milik Pemprov DKI Jakarta?',
    a: 'RuangTerbuka adalah platform kolaboratif yang dibangun untuk mendukung keterbukaan informasi pengelolaan fasilitas publik DKI Jakarta dengan rujukan data resmi Dinas Pertamanan dan RPTRA.'
  }
];

const FaqItem = ({ item }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid #E2E8F0',
      transition: 'all 0.2s ease'
    }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '16px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: open ? '#0F766E' : '#0F172A',
            lineHeight: 1.45,
            transition: 'color 0.2s ease'
          }}
        >
          {item.q}
        </span>
        <ChevronDown
          size={18}
          color="#0F766E"
          style={{
            flexShrink: 0,
            transition: 'transform 0.25s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </button>
      {open && (
        <p
          style={{
            fontSize: '14px',
            color: '#475569',
            lineHeight: 1.65,
            paddingBottom: '16px',
            marginTop: '0',
            marginBottom: 0
          }}
        >
          {item.a}
        </p>
      )}
    </div>
  );
};

export const TentangPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      {/* 1. HERO SECTION: LIGHT GRADIENT — PUTIH → MINT → AMBER CREAM */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDFB 45%, #FFFBEB 100%)',
        padding: '88px 24px 80px',
        textAlign: 'center'
      }}>
        {/* Subtle top border accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #0F766E 0%, #14B8A6 50%, #F59E0B 100%)',
          pointerEvents: 'none'
        }} />

        {/* Content Wrapper */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '760px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: 'clamp(2.1rem, 4.5vw, 3.2rem)',
            fontWeight: 800,
            color: '#0F172A',
            lineHeight: 1.22,
            margin: '0 0 20px',
            letterSpacing: '-0.025em'
          }}>
            Platform <span style={{ color: '#0F766E' }}>Keterbukaan</span> Fasilitas Publik Jakarta
          </h1>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '52px' }}>
            <button
              type="button"
              onClick={() => navigate('/ruang-publik')}
              style={{
                backgroundColor: '#0F766E',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '13px 26px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(15, 118, 110, 0.25)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <MapPin size={17} />
              Jelajahi Ruang Publik
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('cara-kerja');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                backgroundColor: 'transparent',
                color: '#0F766E',
                border: '1.5px solid #0F766E',
                borderRadius: '12px',
                padding: '13px 26px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <ChevronDown size={17} />
              Cara Kerja Platform
            </button>
          </div>

          {/* Stat Row */}
          <div style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(15, 23, 42, 0.06)',
            overflow: 'hidden'
          }}>
            {/* Stat 1 */}
            <div style={{
              padding: '18px 32px',
              textAlign: 'center',
              borderRight: '1px solid #E2E8F0'
            }}>
              <div style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#0F766E',
                lineHeight: 1,
                marginBottom: '5px'
              }}>-</div>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>Ruang Publik</div>
            </div>

            {/* Stat 2 */}
            <div style={{
              padding: '18px 32px',
              textAlign: 'center',
              borderRight: '1px solid #E2E8F0'
            }}>
              <div style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#10B981',
                lineHeight: 1,
                marginBottom: '5px'
              }}>-</div>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>Kondisi Prima</div>
            </div>

            {/* Stat 3 */}
            <div style={{
              padding: '18px 32px',
              textAlign: 'center',
              borderRight: '1px solid #E2E8F0'
            }}>
              <div style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#F59E0B',
                lineHeight: 1,
                marginBottom: '5px'
              }}>-</div>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>Wilayah Kota</div>
            </div>

            {/* Stat 4 */}
            <div style={{
              padding: '18px 32px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#0F766E',
                lineHeight: 1,
                marginBottom: '5px'
              }}>-</div>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>Respons Laporan</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEKSI: EMPAT LANGKAH PARTISIPASI WARGA (HORIZONTAL PROCESS TIMELINE) */}
      <section id="cara-kerja" style={{ padding: '96px 0 88px', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 60px' }}>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 3.2vw, 2.3rem)',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 16px',
              letterSpacing: '-0.01em'
            }}>
              Empat Langkah Partisipasi Warga
            </h2>
          </div>

          {/* Horizontal Timeline Container */}
          <div className="timeline-wrapper" style={{ position: 'relative' }}>
            {/* Connecting Line (Desktop) */}
            <div
              className="timeline-track-line"
              style={{
                position: 'absolute',
                top: '28px',
                left: '60px',
                right: '60px',
                height: '2px',
                backgroundColor: '#CCFBF1',
                zIndex: 1
              }}
            />

            <div className="timeline-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              position: 'relative',
              zIndex: 2
            }}>
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.num}
                    className="timeline-item-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      backgroundColor: '#FFFFFF',
                      padding: '8px 12px'
                    }}
                  >
                    {/* Number Badge with Teal Accent */}
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: '#F0FDFA',
                      border: '2px solid #0F766E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '17px',
                      fontWeight: 800,
                      color: '#0F766E',
                      boxShadow: '0 4px 12px rgba(15, 118, 110, 0.12)',
                      marginBottom: '18px'
                    }}>
                      {step.num}
                    </div>

                    {/* Step Icon Container */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: step.accent === '#F59E0B' ? '#FFFBEB' : '#F0FDFA',
                      border: `1px solid ${step.accent}33`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '14px'
                    }}>
                      <Icon size={20} color={step.accent} />
                    </div>

                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#0F172A',
                      margin: '0 0 8px',
                      lineHeight: 1.35
                    }}>
                      {step.title}
                    </h3>

                    <p style={{
                      fontSize: '13.5px',
                      color: '#64748B',
                      lineHeight: 1.6,
                      margin: 0
                    }}>
                      {step.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. SEKSI: FASILITAS YANG DIPANTAU (SPLIT LAYOUT 2 KOLOM) */}
      <section style={{ padding: '96px 0', backgroundColor: '#F8FAFC' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div className="split-facility-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.35fr',
            gap: '56px',
            alignItems: 'stretch'
          }}>
            {/* Kolom Kiri: Header & Banner Visual Keterbukaan RTH */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.2rem)',
                fontWeight: 800,
                color: '#0F172A',
                margin: '0 0 16px',
                lineHeight: 1.25,
                letterSpacing: '-0.01em'
              }}>
                Fasilitas yang Dipantau Secara Berkala
              </h2>
              {/* Banner Card RTH */}
              <div style={{
                flex: 1,
                borderRadius: '18px',
                overflow: 'hidden',
                backgroundColor: '#F0FDFA',
                border: '1px solid rgba(15, 118, 110, 0.2)',
                boxShadow: '0 4px 16px rgba(15, 118, 110, 0.06)',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0F766E', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                  <Trees size={18} color="#0F766E" />
                  <span>Ruang Terbuka Hijau DKI Jakarta</span>
                </div>
                <div style={{ color: '#0F172A', fontWeight: 800, fontSize: '18px', lineHeight: 1.4, marginBottom: '8px' }}>
                  Pengawasan Terpadu Bersama Dinas Pertamanan &amp; RPTRA
                </div>
                <p style={{ color: '#475569', fontSize: '13.5px', lineHeight: 1.6, margin: 0 }}>
                  Setiap fasilitas di taman dan RPTRA tercatat secara digital demi percepatan respon perbaikan teknis lapangan.
                </p>
              </div>
            </div>

            {/* Kolom Kanan: Compact 2x2 Grid Fasilitas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '18px'
            }}>
              {FACILITIES.map((facility, idx) => {
                const Icon = facility.icon;
                return (
                  <div
                    key={idx}
                    className="facility-compact-card"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '22px 20px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px'
                    }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: '#F0FDFA',
                        border: '1px solid rgba(15, 118, 110, 0.18)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={22} color="#0F766E" />
                      </div>

                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: facility.statusColor,
                        backgroundColor: facility.statusBg,
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        border: `1px solid ${facility.statusColor}33`
                      }}>
                        {facility.status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                      {facility.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                      {facility.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEKSI: FITUR UTAMA PLATFORM (BENTO GRID / ASYMMETRICAL) */}
      <section style={{ padding: '96px 0', backgroundColor: '#F0FDFB' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 56px' }}>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 3.2vw, 2.3rem)',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 16px',
              letterSpacing: '-0.01em'
            }}>
              Fitur Utama Platform
            </h2>
            <p style={{
              fontSize: '15px',
              color: '#64748B',
              lineHeight: 1.6,
              margin: 0
            }}>
              Pilar utama dalam mewujudkan ekosistem pengelolaan ruang terbuka yang responsif dan transparan.
            </p>
          </div>

          {/* Bento Asymmetrical Grid */}
          <div className="bento-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1.25fr 1fr',
            gap: '24px',
            alignItems: 'stretch'
          }}>
            {/* Kartu Besar Kiri: Direktori Ruang Publik */}
            <div
              className="bento-card-large"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid rgba(15, 118, 110, 0.16)',
                padding: '36px 32px',
                boxShadow: '0 10px 30px rgba(15, 118, 110, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease'
              }}
            >
              <div>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  backgroundColor: '#F0FDFA',
                  border: '1.5px solid rgba(15, 118, 110, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '22px'
                }}>
                  <MapPin size={28} color="#0F766E" />
                </div>

                <div style={{
                  display: 'inline-block',
                  backgroundColor: 'rgba(15, 118, 110, 0.08)',
                  color: '#0F766E',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '6px',
                  marginBottom: '12px'
                }}>
                  Fitur Utama Unggulan
                </div>

                <h3 style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: '0 0 14px',
                  lineHeight: 1.3
                }}>
                  Direktori Ruang Publik Jakarta
                </h3>

                <p style={{
                  fontSize: '15px',
                  color: '#475569',
                  lineHeight: 1.7,
                  margin: '0 0 24px'
                }}>
                  Jelajahi ratusan taman kota, RPTRA, hutan kota, dan lapangan olahraga di 5 wilayah kota administratif DKI Jakarta lengkap dengan titik presisi, foto kondisi, jam buka, dan fasilitas.
                </p>

                {/* Highlight Points */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#334155' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={13} color="#10B981" />
                    </div>
                    <span>Data Koordinat Presisi</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#334155' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={13} color="#10B981" />
                    </div>
                    <span>Galeri Foto Kondisi</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#334155' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={13} color="#10B981" />
                    </div>
                    <span>Filter per Wilayah</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#334155' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={13} color="#10B981" />
                    </div>
                    <span>Akses Cepat Laporan</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/ruang-publik')}
                style={{
                  backgroundColor: '#0F766E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 22px',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: 'fit-content',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <span>Buka Direktori Ruang Publik</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* 2 Kartu Bertumpuk di Kanan */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Kartu 1: Status Kondisi Terbuka */}
              <div
                className="bento-card-small"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid rgba(15, 118, 110, 0.16)',
                  padding: '28px 26px',
                  boxShadow: '0 8px 24px rgba(15, 118, 110, 0.04)',
                  flex: 1,
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  backgroundColor: '#F0FDFA',
                  border: '1px solid rgba(15, 118, 110, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <CheckCircle2 size={24} color="#0F766E" />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                  Status Kondisi Terbuka
                </h3>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  Setiap fasilitas memiliki indikator kondisi terkini yang diperbarui secara transparan setelah penanganan oleh petugas lapangan.
                </p>
              </div>

              {/* Kartu 2: Moderasi Petugas */}
              <div
                className="bento-card-small"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid rgba(245, 158, 11, 0.22)',
                  padding: '28px 26px',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
                  flex: 1,
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <ShieldCheck size={24} color="#F59E0B" />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                  Moderasi oleh Petugas Resmi
                </h3>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  Setiap laporan diverifikasi oleh petugas Dinas Pertamanan atau RPTRA untuk memastikan keabsahan dan penanganan yang tepat sasaran.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEKSI: FAQ & HUBUNGI KAMI */}
      <section style={{ padding: '96px 0', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div className="faq-contact-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '56px',
            alignItems: 'start'
          }}>
            {/* FAQ Kolom Kiri */}
            <div>
              <h2 style={{
                fontSize: 'clamp(1.6rem, 2.8vw, 2rem)',
                fontWeight: 800,
                color: '#0F172A',
                margin: '0 0 24px',
                letterSpacing: '-0.01em'
              }}>
                Yang Sering Ditanyakan Warga
              </h2>
              <div>
                {FAQ_ITEMS.map((item, i) => (
                  <FaqItem key={i} item={item} />
                ))}
              </div>
            </div>

            {/* Hubungi Kami Kolom Kanan */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '20px',
              padding: '36px 32px',
              boxShadow: '0 12px 32px rgba(15, 23, 42, 0.04)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#FFFBEB',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Sparkles size={22} color="#F59E0B" />
              </div>

              <h3 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#0F172A',
                margin: '0 0 8px'
              }}>
                Hubungi Kami
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#64748B',
                lineHeight: 1.65,
                margin: '0 0 24px'
              }}>
                Untuk kendala teknis, pertanyaan pelaporan, atau informasi lebih lanjut mengenai pengelolaan fasilitas publik DKI Jakarta.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <a
                  href="mailto:pengaduan@jakarta.go.id"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 18px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#F0FDFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Mail size={20} color="#0F766E" />
                  </div>
                  <div>
                    <span style={{
                      display: 'block',
                      fontSize: '11px',
                      color: '#94A3B8',
                      fontWeight: 600,
                      marginBottom: '2px'
                    }}>
                      Surel Pengaduan
                    </span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#0F766E'
                    }}>
                      pengaduan@jakarta.go.id
                    </span>
                  </div>
                </a>

                <a
                  href="tel:1500164"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 18px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#FFFBEB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Phone size={20} color="#F59E0B" />
                  </div>
                  <div>
                    <span style={{
                      display: 'block',
                      fontSize: '11px',
                      color: '#94A3B8',
                      fontWeight: 600,
                      marginBottom: '2px'
                    }}>
                      Hotline Jakarta
                    </span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#0F172A'
                    }}>
                      1500-164
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Styles */}
      <style>{`
        .facility-compact-card:hover, .bento-card-large:hover, .bento-card-small:hover {
          transform: translateY(-4px);
          border-color: rgba(15, 118, 110, 0.35) !important;
          box-shadow: 0 12px 28px -4px rgba(15, 118, 110, 0.12) !important;
        }
        @media (max-width: 992px) {
          .split-facility-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .bento-grid {
            grid-template-columns: 1fr !important;
          }
          .faq-contact-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
        @media (max-width: 768px) {
          .timeline-track-line {
            display: none !important;
          }
          .timeline-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TentangPage;
