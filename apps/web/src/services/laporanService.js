import { api } from '../config/api';
import { MOCK_LAPORAN, MOCK_DASHBOARD_STATS, MOCK_MODERASI_STATS } from '../data/mockData';

const IS_DEV = import.meta.env.DEV;

// Helper: normalisasi response backend (snake_case) ke bentuk FE (camelCase).
const transformLaporanResponse = (raw) => {
  return {
    id: raw.id,
    status: raw.status,
    user: raw.user,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    ruang_publik_id: raw.ruang_publik_id,
    namaPelapor: raw.nama_pelapor,
    modeIdentitas: raw.mode_identitas,
    jenisMasalah: raw.jenis_masalah,
    deskripsi: raw.deskripsi,
    fotoUrl: raw.foto_url,
    // Field turunan dari relasi (disediakan backend pada response laporan)
    ruangPublikNama: raw.ruang_publik_nama,
    fasilitasNama: raw.fasilitas_nama,
    wilayah: raw.wilayah,
    // statusLabel murni untuk tampilan; status asli tetap dipakai untuk logika/API
    statusLabel: raw.status
      ? raw.status
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ')
      : '',
    // Transform timeline array: snake_case → camelCase + uppercase status
    timeline: (raw.timeline || []).map(entry => ({
      status: (entry.status || '').toUpperCase(),
      title: entry.title,
      date: entry.created_at,
      desc: entry.description,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at
    }))
  };
};

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
    const rawData = await api.get('/api/v1/reports', {
      status: status && status !== 'semua' ? status : undefined,
      wilayah: wilayah && wilayah !== 'Semua Wilayah' ? wilayah : undefined,
      q: q || undefined
    });

    const rawItems = Array.isArray(rawData) ? rawData : rawData?.items ?? [];
    
    // Transform snake_case → camelCase
    return rawItems.map(item => transformLaporanResponse(item));
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
    const raw = await api.get(`/api/v1/reports/${id}`);
    return transformLaporanResponse(raw);
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
    const raw = await api.get('/api/v1/reports/stats/dashboard');
    
    if (raw.total_laporan === undefined) {
      throw new Error('Invalid response: missing total_laporan');
    }
    
    return {
      totalLaporan: raw.total_laporan,
      menungguVerifikasi: raw.menunggu_verifikasi,
      dalamPenanganan: raw.dalam_penanganan,
      selesai: raw.selesai
    };
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
    const raw = await api.get('/api/v1/reports/stats/moderasi');
    
    if (raw.antrian_moderasi === undefined) {
      throw new Error('Invalid response: missing antrian_moderasi');
    }
    
    return {
      perluTindakan: raw.antrian_moderasi,
      selesaiPekanIni: raw.selesai_pekan_ini ?? 0
    };
  } catch (error) {
    if (IS_DEV) {
      return MOCK_MODERASI_STATS;
    }
    throw error;
  }
};
