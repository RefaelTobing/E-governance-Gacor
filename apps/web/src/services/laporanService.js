import { api } from '../config/api';
import { MOCK_LAPORAN, MOCK_DASHBOARD_STATS, MOCK_MODERASI_STATS } from '../data/mockData';

const IS_DEV = import.meta.env.DEV;

/**
 * Ambil daftar laporan masyarakat dari backend FastAPI.
 * @param {Object} params
 * @param {string} [params.status]   - Filter status (dalam_penanganan, selesai, menunggu_verifikasi)
 * @param {string} [params.wilayah]  - Filter wilayah
 * @param {string} [params.q]        - Filter search query
 */
export const getReports = async (params = {}) => {
  const { status, wilayah, q } = params;

  try {
    const data = await api.get('/api/v1/reports', {
      status: status && status !== 'semua' ? status : undefined,
      wilayah: wilayah && wilayah !== 'Semua Wilayah' ? wilayah : undefined,
      q: q || undefined
    });

    const items = Array.isArray(data) ? data : data?.items ?? [];
    return items;
  } catch (error) {
    if (IS_DEV) {
      console.info('[laporanService] FastAPI belum terhubung, mengembalikan array kosong [].');
      return [];
    }
    throw error;
  }
};

/**
 * Ambil daftar laporan milik pengguna (citizen user reports).
 * @param {Object} [params]
 */
export const getUserReports = async (params = {}) => {
  return await getReports(params);
};

/**
 * Ambil detail satu laporan berdasarkan ID.
 * @param {string} id
 */
export const getReportDetail = async (id) => {
  try {
    const data = await api.get(`/api/v1/reports/${id}`);
    return data;
  } catch (error) {
    if (IS_DEV) {
      console.info(`[laporanService] Fallback mock data laporan ID: ${id}`);
      return MOCK_LAPORAN.find((item) => item.id === id) || MOCK_LAPORAN[0];
    }
    throw error;
  }
};

/**
 * Kirim laporan fasilitas baru ke backend.
 * @param {Object} reportData
 */
export const createReport = async (reportData) => {
  return await api.post('/api/v1/reports', reportData);
};

/**
 * Update status laporan (untuk admin moderasi).
 * @param {string} id
 * @param {Object} updateData
 */
export const updateReportStatus = async (id, updateData) => {
  return await api.patch(`/api/v1/reports/${id}/status`, updateData);
};

/**
 * Ambil data statistik laporan untuk dashboard pengelola.
 */
export const getDashboardStats = async () => {
  try {
    return await api.get('/api/v1/reports/stats/dashboard');
  } catch (error) {
    if (IS_DEV) {
      return MOCK_DASHBOARD_STATS;
    }
    throw error;
  }
};

/**
 * Ambil data statistik antrian moderasi.
 */
export const getModerasiStats = async () => {
  try {
    return await api.get('/api/v1/reports/stats/moderasi');
  } catch (error) {
    if (IS_DEV) {
      return MOCK_MODERASI_STATS;
    }
    throw error;
  }
};
