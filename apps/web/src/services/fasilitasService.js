import { api, http } from '../config/api';
import { IS_DEV } from '../config/constants';

export const STATUS_FASILITAS = [
  { value: 'baik', label: 'Baik' },
  { value: 'perlu_perhatian', label: 'Perlu Perhatian' },
  { value: 'rusak', label: 'Rusak' },
];

const keTampilan = (row) => ({
  id: row.id,
  ruangPublikId: row.ruang_publik_id,
  ruangPublikNama: row.ruang_publik_nama,
  wilayah: row.wilayah,
  nama: row.nama,
  kategori: row.kategori,
  status: row.status,
  deskripsi: row.deskripsi,
  createdAt: row.created_at,
});

const pesanKesalahan = (error) => error.detail || error.message;

const BATAS_BATCH = 50;
const PER_BATCH = 500;

/**
 * Seluruh baris fasilitas untuk tabel Kelola Fasilitas.
 *
 * Backend membatasi `limit` maksimal 500, jadi baris ditarik bertahap;
 * filter dan pencarian disaring di sisi klien supaya mengetik tidak
 * memicu unduhan ulang.
 */
export const getAllFacilities = async () => {
  const semua = [];

  for (let batch = 0; batch < BATAS_BATCH; batch++) {
    const data = await api.get('/api/v1/admin/facilities', {
      skip: semua.length,
      limit: PER_BATCH,
    });
    if (!Array.isArray(data) || data.length === 0) break;

    // Backend yang mengabaikan `skip` akan mengulang baris pertama terus.
    if (semua.length > 0 && data[0]?.id === semua[0]?.id) break;

    semua.push(...data.map(keTampilan));
    if (data.length < PER_BATCH) break;
  }

  return semua;
};

/**
 * Seluruh baris fasilitas dikelompokkan per ruang publik.
 * Endpoint admin tunggal; hasil dipakai layar daftar & detail fasilitas.
 */
export const getAllFacilitiesGrouped = async () => {
  const data = await api.get('/api/v1/admin/facilities/by-ruang');
  const groups = {};
  Object.entries(data || {}).forEach(([ruangId, rows]) => {
    groups[ruangId] = rows.map((row) => ({
      id: row.id,
      ruangPublikId: row.ruang_publik_id,
      nama: row.nama,
      kategori: row.kategori,
      status: row.status,
      deskripsi: row.deskripsi,
      createdAt: row.created_at,
    }));
  });
  return groups;
};

export const createFacility = async (payload) => {
  try {
    const data = await api.post('/api/v1/admin/facilities', {
      ruang_publik_id: payload.ruangPublikId,
      nama: payload.nama,
      kategori: payload.kategori || null,
      status: payload.status,
      deskripsi: payload.deskripsi || null,
    });
    return keTampilan(data);
  } catch (error) {
    throw new Error(pesanKesalahan(error));
  }
};

export const updateFacility = async (id, payload) => {
  try {
    const data = await api.patch(`/api/v1/admin/facilities/${id}`, {
      nama: payload.nama,
      kategori: payload.kategori || null,
      status: payload.status,
      deskripsi: payload.deskripsi || null,
    });
    return keTampilan(data);
  } catch (error) {
    throw new Error(pesanKesalahan(error));
  }
};

export const deleteFacility = async (id) => {
  try {
    await api.delete(`/api/v1/admin/facilities/${id}`);
  } catch (error) {
    throw new Error(pesanKesalahan(error));
  }
};

/** Opsi nama/kategori unik untuk datalist kategori di form. */
export const getFacilityOptions = async () => {
  const data = await api.get('/api/v1/facilities');
  return Array.isArray(data) ? data : [];
};

/**
 * Impor massal dari CSV. Endpoint ini menerima multipart (FormData).
 * Axios otomatis menggunakan multipart + boundary tanpa Content-Type manual,
 * dan request interceptor memasang token Bearer dari localStorage.
 */
export const importFacilitiesCsv = async (file) => {
  const form = new FormData();
  form.append('file', file);

  // Response interceptor mengembalikan body langsung & menormalisasi error
  // (termasuk pesan 422) menjadi Error dengan .detail / .message.
  return await http.post('/api/v1/admin/facilities/import', form);
};

export const cariRuangPublik = async (q, limit = 10) => {
  try {
    const data = await api.get('/api/v1/public-spaces', { q, limit });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (IS_DEV) return [];
    throw error;
  }
};
