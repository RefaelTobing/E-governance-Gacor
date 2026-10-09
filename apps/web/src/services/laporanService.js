import { api, assetUrl } from '../config/api';
import { IS_DEV } from '../config/constants';
import { MOCK_LAPORAN, MOCK_DASHBOARD_STATS, MOCK_MODERASI_STATS } from '../data/mockData';

// Helper: normalisasi response backend (snake_case) ke bentuk FE (camelCase).
const transformLaporanResponse = (raw) => {
  const createdAt = raw.created_at;
  return {
    id: raw.id,
    status: raw.status,
    user: raw.user,
    createdAt,
    updatedAt: raw.updated_at,
    // Tanggal ringkas siap tampil (fallback aman bila created_at kosong/invalid).
    tanggal: createdAt
      ? new Date(createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '',
    ruang_publik_id: raw.ruang_publik_id,
    ruangPublikId: raw.ruang_publik_id,
    namaPelapor: raw.nama_pelapor,
    modeIdentitas: raw.mode_identitas,
    jenisMasalah: raw.jenis_masalah,
    deskripsi: raw.deskripsi,
    foto: assetUrl(raw.foto_url),
    fotoUrl: raw.foto_url,
    // Alasan penolakan (BE-30) — tampil di daftar/detail moderasi.
    alasanPenolakan: raw.alasan_penolakan,
    // Field turunan dari relasi (disediakan backend pada response laporan)
    ruangPublikNama: raw.ruang_publik_nama,
    fasilitasNama: raw.fasilitas_nama,
    wilayah: raw.wilayah,
    lokasiPilihan: raw.lat_lokasi_pilihan != null && raw.long_lokasi_pilihan != null
      ? { lat: raw.lat_lokasi_pilihan, lng: raw.long_lokasi_pilihan }
      : null,
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
 * Ambil antrian laporan untuk admin (BE-28/BE-52).
 * Berbeda dari `getReports` (hanya laporan tayang), endpoint ini mengembalikan
 * SEMUA status termasuk `menunggu_verifikasi`, sehingga admin melihat antrian
 * tinjauan yang sebenarnya.
 *
 * @param {Object} params
 * @param {string} [params.status]  - Status kanonik atau "semua" (nilai asing -> 422)
 * @param {string} [params.wilayah]
 * @param {string} [params.q]
 * @param {number} [params.skip]
 * @param {number} [params.limit]
 */
export const getAdminReports = async (params = {}) => {
  const { status, wilayah, q, skip, limit } = params;

  const rawData = await api.get('/api/v1/admin/reports', {
    status: status && status !== 'semua' ? status : undefined,
    wilayah: wilayah && wilayah !== 'Semua Wilayah' ? wilayah : undefined,
    q: q || undefined,
    skip,
    limit,
  });

  const rawItems = Array.isArray(rawData) ? rawData : rawData?.items ?? [];
  return rawItems.map((item) => transformLaporanResponse(item));
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
 * Upload berkas foto bukti laporan ke backend (BE-49).
 * @param {File} file
 * @returns {Promise<string>} URL path foto (contoh: /uploads/laporan/<hex>.jpg)
 */
export const uploadFoto = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const data = await api.upload('/api/v1/uploads', formData);
  return data.url;
};

/**
 * Kirim laporan fasilitas baru ke backend.
 * Mengembalikan laporan yang sudah dinormalisasi (camelCase) termasuk `status`
 * hasil validasi lokasi: "diverifikasi" (auto-tayang) atau "menunggu_verifikasi".
 * @param {Object} reportData
 */
export const createReport = async (reportData) => {
  const raw = await api.post('/api/v1/reports', reportData);
  return transformLaporanResponse(raw);
};

/**
 * Update status laporan (untuk admin moderasi).
 * @param {string} id
 * @param {Object} updateData
 */
export const updateReportStatus = async (id, updateData) => {
  const raw = await api.patch(`/api/v1/reports/${id}/status`, updateData);
  return transformLaporanResponse(raw);
};

/**
 * Setujui laporan (BE-29): status -> `diverifikasi` (tayang) + timeline.
 * Guard backend: hanya `menunggu_verifikasi`/`ditolak`; status tayang -> 409.
 *
 * @param {string} id
 * @param {string} [description] - catatan petugas opsional (tanpa catatan -> tanpa body)
 * @returns {Promise<Object>} laporan detail ternormalisasi
 */
export const approveReport = async (id, description) => {
  const catatan = typeof description === 'string' ? description.trim() : '';
  const raw = await api.post(
    `/api/v1/admin/reports/${id}/approve`,
    catatan ? { description: catatan } : undefined
  );
  return transformLaporanResponse(raw);
};

/**
 * Tolak laporan (BE-30): status -> `ditolak` + `alasan_penolakan` tersimpan.
 * Alasan WAJIB (kosong/whitespace -> 422 di backend).
 *
 * @param {string} id
 * @param {string} alasan
 * @returns {Promise<Object>} laporan detail ternormalisasi
 */
export const rejectReport = async (id, alasan) => {
  const raw = await api.post(`/api/v1/admin/reports/${id}/reject`, {
    alasan: typeof alasan === 'string' ? alasan.trim() : '',
  });
  return transformLaporanResponse(raw);
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
