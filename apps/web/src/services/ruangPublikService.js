import { api } from '../config/api';

/**
 * Ambil daftar ruang publik dari backend.
 * @param {Object} params
 * @param {number} [params.lat]       - Latitude user (untuk sort terdekat)
 * @param {number} [params.lng]       - Longitude user (untuk sort terdekat)
 * @param {number} [params.radius]    - Radius pencarian dalam meter (default 5000)
 * @param {number} [params.limit]     - Jumlah hasil (default 3 untuk peta)
 * @param {number} [params.skip]      - Offset pagination
 * @param {string} [params.kategori]  - Filter kategori
 * @param {string} [params.wilayah]   - Filter wilayah
 */
export const getPublicSpaces = (params = {}) => {
  const { lat, lng, radius = 5000, limit, skip, kategori, wilayah } = params;

  return api.get('/api/v1/public-spaces', {
    lat,
    long: lng, // backend pakai param "long" bukan "lng"
    radius: lat && lng ? radius : undefined,
    limit,
    skip,
    kategori: kategori && kategori !== 'semua' ? kategori : undefined,
    wilayah: wilayah && wilayah !== 'Semua Wilayah' ? wilayah : undefined,
  });
};

/**
 * Ambil detail satu ruang publik berdasarkan ID.
 * @param {string|number} id
 */
export const getPublicSpaceDetail = (id) => {
  return api.get(`/api/v1/public-spaces/${id}`);
};

/**
 * Ambil laporan untuk ruang publik tertentu.
 * @param {string|number} id
 * @param {Object} [params]
 * @param {number} [params.limit]
 * @param {number} [params.skip]
 */
export const getPublicSpaceReports = (id, params = {}) => {
  return api.get(`/api/v1/public-spaces/${id}/reports`, params);
};
