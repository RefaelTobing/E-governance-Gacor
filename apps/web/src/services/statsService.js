import { api } from '../config/api';
import { IS_DEV } from '../config/constants';
import { MOCK_STATISTICS, HERO_SLIDES } from '../data/mockData';

/**
 * Ambil data statistik umum homepage (total ruang publik, laporan selesai, dll).
 */
export const getHomeStatistics = async () => {
  try {
    const raw = await api.get('/api/v1/statistics/summary');
    return {
      totalRuangPublik: raw.total_ruang_publik,
      totalLaporanSelesai: raw.total_laporan_selesai,
      laporanBulanIni: raw.laporan_bulan_ini,
      tingkatPenyelesaianPersen: raw.tingkat_penyelesaian_persen
    };
  } catch (error) {
    if (IS_DEV) {
      return MOCK_STATISTICS;
    }
    throw error;
  }
};

/**
 * Ambil data slider hero image.
 */
export const getHeroSlides = async () => {
  try {
    return await api.get('/api/v1/statistics/hero-slides');
  } catch (error) {
    if (IS_DEV) {
      return HERO_SLIDES;
    }
    throw error;
  }
};
