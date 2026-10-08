import axios from 'axios';
import { API_BASE_URL as BASE_URL } from './constants';

/**
 * Terjemahkan pesan validasi pydantic (422) yang paling sering muncul ke
 * bahasa yang bisa dibaca pengguna. Dipindah dari utils/apiError.js agar
 * berlaku untuk seluruh request, bukan hanya login/register.
 */
const fieldName = (loc) => {
  if (!Array.isArray(loc) || loc.length === 0) return null;
  return loc[loc.length - 1];
};

const translateFieldError = (item) => {
  const field = fieldName(item?.loc);
  const type = item?.type;

  if (type === 'value_error' && /email/i.test(item?.msg || '')) {
    return 'Format email tidak valid. Contoh: nama@email.com';
  }
  if (type === 'missing') {
    return `Kolom "${field}" wajib diisi.`;
  }
  if (type === 'string_too_short' || type === 'too_short') {
    return `Kolom "${field}" terlalu pendek.`;
  }
  return item?.msg || 'Data yang dikirim tidak valid.';
};

/**
 * Ubah `{ detail }` dari FastAPI menjadi pesan string.
 * - `detail` array (422) -> gabungkan pesan per-field.
 * - `detail` string      -> pakai apa adanya.
 * - tanpa detail / 5xx   -> pesan generik.
 */
const bacaPesanError = (body, status) => {
  const detail = body?.detail;

  if (Array.isArray(detail)) {
    return detail.map(translateFieldError).join(' ') || 'Data yang dikirim tidak valid.';
  }
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  return status >= 500
    ? 'Terjadi kesalahan di server. Coba lagi beberapa saat lagi.'
    : 'Terjadi kesalahan. Silakan coba lagi.';
};

// Instance axios tunggal untuk seluruh aplikasi.
// Tanpa timeout (default axios 0) agar endpoint sinkronisasi ETL yang lama
// tidak terputus di tengah jalan.
const instance = axios.create({ baseURL: BASE_URL });

// Request interceptor: pasang token Bearer dari localStorage.
// Hormati header Authorization yang sudah diisi eksplisit (mis. getMe(token)).
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor:
// - sukses : kembalikan body JSON langsung (bukan objek Response).
// - error  : bangun Error dengan .status & .detail agar konsumen lama
//            (error.detail || error.message, typeof err.detail === 'string')
//            tetap berfungsi tanpa perubahan.
instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      // Tidak ada respons: backend mati / koneksi putus / CORS.
      const normalized = new Error(
        'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.'
      );
      normalized.status = null;
      normalized.detail = undefined;
      return Promise.reject(normalized);
    }

    const { status, data } = error.response;
    const normalized = new Error(bacaPesanError(data, status));
    normalized.status = status;
    normalized.detail = data?.detail;
    return Promise.reject(normalized);
  }
);

export const assetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = BASE_URL || '';
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Buang param kosong (undefined/null/'') agar backend FastAPI tidak salah
// memfilter — perilaku ini dipertahankan dari wrapper fetch sebelumnya.
const bersihkanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );

// Instance mentah untuk kebutuhan khusus (form-urlencoded, token eksplisit,
// multipart dengan config tambahan). Tetap satu HTTP client yang sama.
export const http = instance;

export const api = {
  get: (endpoint, params = {}) =>
    instance.get(endpoint, { params: bersihkanParams(params) }),
  post: (endpoint, body) => instance.post(endpoint, body),
  // FormData: axios otomatis memakai multipart + boundary; jangan set
  // Content-Type manual. `options` meneruskan config axios (mis. onUploadProgress).
  upload: (endpoint, formData, options = {}) =>
    instance.post(endpoint, formData, options),
  put: (endpoint, body) => instance.put(endpoint, body),
  patch: (endpoint, body) => instance.patch(endpoint, body),
  delete: (endpoint) => instance.delete(endpoint),
};

export default api;
