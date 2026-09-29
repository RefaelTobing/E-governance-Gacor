import { api } from '../config/api';
import { MOCK_RUANG_PUBLIK, MOCK_RUANG_PUBLIK_METRICS } from '../data/mockData';

/**
 * Helper to check if backend API should fallback in development
 */
const IS_DEV = import.meta.env.DEV;

/**
 * Ambil daftar ruang publik dari backend FastAPI.
 * Fallback otomatis ke mockData jika backend belum berjalan saat mode development.
 * 
 * @param {Object} params
 * @param {number} [params.lat]       - Latitude user (untuk sort terdekat)
 * @param {number} [params.lng]       - Longitude user (untuk sort terdekat)
 * @param {number} [params.radius]    - Radius pencarian dalam meter (default 5000)
 * @param {number} [params.limit]     - Jumlah hasil
 * @param {number} [params.skip]      - Offset pagination
 * @param {string} [params.kategori]  - Filter kategori
 * @param {string} [params.wilayah]   - Filter wilayah
 * @param {string} [params.q]         - Search query nama/alamat
 */
export const getPublicSpaces = async (params = {}) => {
  const { lat, lng, radius = 5000, limit, skip, kategori, wilayah, q } = params;

  try {
    const data = await api.get('/api/v1/public-spaces', {
      lat,
      long: lng, // backend FastAPI memakai param "long"
      radius: lat && lng ? radius : undefined,
      limit,
      skip,
      kategori: kategori && kategori !== 'semua' ? kategori : undefined,
      wilayah: wilayah && wilayah !== 'Semua Wilayah' ? wilayah : undefined,
      q: q || undefined
    });

    const items = Array.isArray(data) ? data : data?.items ?? [];
    return items;
  } catch (error) {
    if (IS_DEV) {
      console.info('[ruangPublikService] FastAPI belum terhubung, menggunakan fallback mockData.');
      let results = [...MOCK_RUANG_PUBLIK];

      if (kategori && kategori !== 'semua') {
        const kat = kategori.toLowerCase();
        results = results.filter((item) => {
          const itemKat = item.kategori.toLowerCase();
          if (kat === 'rth') return itemKat.includes('rth') || itemKat.includes('konservasi');
          if (kat === 'taman-kota') return itemKat.includes('taman');
          if (kat === 'lapangan-olahraga') return itemKat.includes('olahraga');
          if (kat === 'hutan-kota') return itemKat.includes('hutan');
          return itemKat.replace(/ /g, '-').includes(kat);
        });
      }

      if (wilayah && wilayah !== 'Semua Wilayah') {
        results = results.filter((item) => item.wilayah === wilayah);
      }

      if (q) {
        const query = q.toLowerCase();
        results = results.filter(
          (item) =>
            item.nama.toLowerCase().includes(query) ||
            item.alamat.toLowerCase().includes(query)
        );
      }

      if (limit) {
        results = results.slice(0, limit);
      }

      return results;
    }
    throw error;
  }
};

/**
 * Ambil detail satu ruang publik berdasarkan ID/slug.
 * @param {string|number} id
 */
export const getPublicSpaceDetail = async (id) => {
  try {
    const data = await api.get(`/api/v1/public-spaces/${id}`);
    return data;
  } catch (error) {
    if (IS_DEV) {
      console.info(`[ruangPublikService] Fallback mock data untuk ID: ${id}`);
      const found = MOCK_RUANG_PUBLIK.find((item) => item.id === id) || MOCK_RUANG_PUBLIK[0];
      return found;
    }
    throw error;
  }
};

/**
 * Ambil statistik ringkasan ruang publik (total terdata, kondisi prima, dll).
 */
export const getPublicSpacesStats = async () => {
  try {
    const data = await api.get('/api/v1/public-spaces/stats');
    return data;
  } catch (error) {
    if (IS_DEV) {
      return MOCK_RUANG_PUBLIK_METRICS;
    }
    throw error;
  }
};

/**
 * Ambil laporan untuk ruang publik tertentu.
 * @param {string|number} id
 * @param {Object} [params]
 */
export const getPublicSpaceReports = async (id, params = {}) => {
  try {
    return await api.get(`/api/v1/public-spaces/${id}/reports`, params);
  } catch (error) {
    if (IS_DEV) {
      return [];
    }
    throw error;
  }
};
