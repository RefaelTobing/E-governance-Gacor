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
      category: kategori && kategori !== 'semua' ? kategori : undefined,
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
          const itemKat = (item.kategori || '').toLowerCase();
          if (kat === 'taman') return itemKat.includes('taman');
          if (kat === 'jalur-hijau') return itemKat.includes('jalur');
          if (kat === 'hutan') return itemKat.includes('hutan');
          if (kat === 'kebun-bibit') return itemKat.includes('kebun');
          if (kat === 'taman-margasatwa') return itemKat.includes('margasatwa');
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
    return {
      ...data,
      kategori: typeof data.kategori === 'object' && data.kategori
        ? data.kategori.label || data.kategori_id || 'Umum'
        : (data.kategori || data.kategori_id || 'Umum'),
      image: data.image_url || data.image || (data.foto && data.foto.length > 0 ? data.foto[0] : 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80'),
      fasilitas: data.fasilitas || [],
      deskripsi: data.deskripsi || 'Belum ada deskripsi.',
      stats: data.stats || { baik: 0, perluPerhatian: 0, rusak: 0 },
      jamOperasional: data.jam_operasional || data.jamOperasional || 'TBA',
      ramahHewan: data.ramah_hewan || data.ramahHewan || 'TBA',
      aksesDisabilitas: data.akses_disabilitas || data.aksesDisabilitas || 'TBA',
      tiketMasuk: data.tiket_masuk || data.tiketMasuk || 'TBA',
      wilayah: data.wilayah || 'TBA'
    };
  } catch (error) {
    if (IS_DEV) {
      console.info(`[ruangPublikService] Fallback mock data untuk ID: ${id}`);
      const found = MOCK_RUANG_PUBLIK.find((item) => item.id === id);
      if (found) {
        return found;
      }
      return null;
    }
    throw error;
  }
};

/**
 * Ambil statistik ringkasan ruang publik (total terdata, kondisi prima, dll).
 */
export const getPublicSpacesStats = async () => {
  try {
    const raw = await api.get('/api/v1/public-spaces/stats');
    // Normalisasi ke key yang dibaca UI (DaftarRuangPublikPage).
    return {
      totalTerdata: raw.total_ruang_publik,
      statusPrima: raw.status_prima,
      perluPerhatian: raw.perlu_perhatian
    };
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
