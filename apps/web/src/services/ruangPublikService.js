import { api, assetUrl } from '../config/api';
import { IS_DEV } from '../config/constants';
import { MOCK_RUANG_PUBLIK, MOCK_RUANG_PUBLIK_METRICS } from '../data/mockData';

/**
 * Ubah foto utama ruang publik jadi URL siap-pakai.
 * `image_url` backend relatif (mis. /uploads/ruang-publik/xxx.jpg), jadi harus
 * dilewatkan `assetUrl` agar tidak diresolusi ke origin frontend.
 * `null` berarti belum ada foto, dan UI menampilkan placeholder kategori.
 */
const fotoUtama = (item) => {
  const url = item.image_url || item.image;
  if (url) return assetUrl(url);
  if (Array.isArray(item.foto) && item.foto.length > 0) return assetUrl(item.foto[0]);
  return null;
};

/**
 * Backend memakai snake_case (perlu_perhatian); UI memakai camelCase.
 * Nilai kosong ditekan ke 0 supaya badge tidak pernah menampilkan undefined.
 */
const keStats = (raw) => ({
  baik: raw?.baik ?? 0,
  perluPerhatian: raw?.perlu_perhatian ?? 0,
  rusak: raw?.rusak ?? 0,
});

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
    return items.map((item) => ({
      ...item,
      // Backend mengirim foto utama di `image_url` (relatif); UI memakai `image`.
      image: fotoUtama(item),
      // Endpoint daftar belum mengirim jam operasional; baris jam disembunyikan
      // saat nilainya kosong supaya label tidak menggantung tanpa isi.
      jamOperasional: item.jam_operasional ?? item.jamOperasional ?? null,
      stats: keStats(item.stats),
    }));
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

      const mulai = skip || 0;
      if (limit) {
        results = results.slice(mulai, mulai + limit);
      } else if (mulai) {
        results = results.slice(mulai);
      }

      return results;
    }
    throw error;
  }
};

/**
 * Ambil seluruh ruang publik dengan menarik semua halaman backend.
 *
 * Backend membatasi `limit` maksimal 500 baris, jadi data ribuan baris harus
 * ditarik bertahap. Filter kategori/wilayah/pencarian sengaja tidak dikirim:
 * semuanya disaring di sisi klien supaya mengganti filter tidak memicu
 * unduhan ulang.
 *
 * @param {Object} params
 * @param {number} params.lat - Titik acuan penghitungan jarak
 * @param {number} params.lng - Titik acuan penghitungan jarak
 */
const BATAS_BATCH = 50;

export const getAllPublicSpaces = async ({ lat, lng } = {}) => {
  const PER_BATCH = 500;
  const semua = [];

  for (let batch = 0; batch < BATAS_BATCH; batch++) {
    // radius: null menetralkan default 5000 di getPublicSpaces, supaya tidak
    // ada baris yang tersaring keluar sebelum sempat dimuat.
    const data = await getPublicSpaces({ lat, lng, radius: null, skip: semua.length, limit: PER_BATCH });
    if (!Array.isArray(data) || data.length === 0) break;

    // Backend yang mengabaikan `skip` akan mengulang baris pertama terus;
    // berhenti sebelum datanya jadi dobel.
    if (semua.length > 0 && data[0]?.id === semua[0]?.id) break;

    semua.push(...data);
    if (data.length < PER_BATCH) break;
  }

  return semua;
};

/**
 * Ambil detail satu ruang publik berdasarkan ID/slug.
 * @param {string|number} id
 */
export const getPublicSpaceDetail = async (id) => {
  try {
    const data = await api.get(`/api/v1/public-spaces/${id}`);
    const lat = Number.parseFloat(data.latitude);
    const lng = Number.parseFloat(data.longitude);
    // Galeri publik: backend menggabung foto resmi + foto laporan tayang (gabung_foto).
    // URL dinormalisasi ke absolut di sini supaya halaman tinggal render.
    const foto = (Array.isArray(data.foto) ? data.foto : []).map((u) => assetUrl(u));
    const fasilitas = (Array.isArray(data.fasilitas) ? data.fasilitas : []).map((facility) => {
      const facilityLat = Number.parseFloat(facility.latitude ?? facility.koordinat?.lat);
      const facilityLng = Number.parseFloat(facility.longitude ?? facility.koordinat?.lng);
      return {
        ...facility,
        koordinat: Number.isFinite(facilityLat) && Number.isFinite(facilityLng)
          ? { lat: facilityLat, lng: facilityLng }
          : null,
      };
    });
    return {
      ...data,
      koordinat: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
      foto,
      kategori: typeof data.kategori === 'object' && data.kategori
        ? data.kategori.label || data.kategori_id || 'Umum'
        : (data.kategori || data.kategori_id || 'Umum'),
      image: fotoUtama(data),
      // Galeri: URL backend relatif, jadi dijadikan absolut untuk <img>.
      foto: (Array.isArray(data.foto) ? data.foto : []).map(assetUrl),
      // FE-44 revisi: metadata per foto (sumber + like). URL dinormalisasi
      // dengan helper yang sama seperti `foto` supaya kuncinya cocok persis.
      fotoMeta: (Array.isArray(data.foto_meta) ? data.foto_meta : []).map((item) => ({
        url: assetUrl(item.url),
        sumber: item.sumber ?? 'resmi',
        likeCount: item.like_count ?? 0,
        likedByMe: item.liked_by_me ?? null,
      })),
      fasilitas,
      deskripsi: data.deskripsi || 'Belum ada deskripsi.',
      stats: keStats(data.stats),
      jamOperasional: data.jam_operasional || data.jamOperasional || 'Belum tersedia',
      // Kosong = tidak ada data, bukan "TBA"; UI menyembunyikan penanda yang
      // tidak punya isi (lihat kotak ramah hewan di halaman detail).
      ramahHewan: data.ramah_hewan || data.ramahHewan || null,
      aksesDisabilitas: data.akses_disabilitas || data.aksesDisabilitas || 'Belum tersedia',
      tiketMasuk: data.tiket_masuk || data.tiketMasuk || 'Belum tersedia',
      wilayah: data.wilayah || 'TBA'
    };
  } catch (error) {
    // 404 berarti ID memang tidak ada; jangan diganti mock. Fallback hanya
    // untuk backend yang belum bisa dijangkau (status null).
    if (error.status === 404) return null;
    if (IS_DEV && error.status == null) {
      console.info(`[ruangPublikService] Backend tidak terjangkau, memakai mock untuk ID: ${id}`);
      return MOCK_RUANG_PUBLIK.find((item) => item.id === id) || null;
    }
    throw error;
  }
};

/**
 * Like satu foto galeri ruang publik (BE-58 revisi).
 * Wajib login; satu like per pengguna per foto (409 bila sudah menyukai).
 *
 * @param {string} ruangPublikId
 * @param {string} fotoUrl
 * @returns {Promise<{foto_url: string, like_count: number, liked_by_me: boolean}>}
 */
export const likeFotoGaleri = async (ruangPublikId, fotoUrl) => {
  return await api.post(`/api/v1/public-spaces/${ruangPublikId}/photos/like`, {
    foto_url: fotoUrl,
  });
};

/**
 * Batal like satu foto galeri ruang publik (BE-58 revisi).
 * Belum pernah like -> 404.
 *
 * @param {string} ruangPublikId
 * @param {string} fotoUrl
 * @returns {Promise<{foto_url: string, like_count: number, liked_by_me: boolean}>}
 */
export const unlikeFotoGaleri = async (ruangPublikId, fotoUrl) => {
  return await api.delete(
    `/api/v1/public-spaces/${ruangPublikId}/photos/like?foto_url=${encodeURIComponent(fotoUrl)}`
  );
};

/**
 * Ambil statistik ringkasan ruang publik (total terdata, kondisi prima, dll).
 */
export const getPublicSpacesStats = async (params = {}) => {
  try {
    const raw = await api.get('/api/v1/public-spaces/stats', {
      q: params.q || undefined,
    });
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

// ===========================================================================
// ADMIN — Data Master ruang publik (BE-32/BE-33). Halaman /dashboard/fasilitas
// (sejak FE-56 menyatu dengan kelola fasilitas; /dashboard/data-master redirect).
// Endpoint admin sengaja TIDAK memakai fallback mock: kegagalan harus terlihat
// (bukan diam-diam menampilkan data kosong yang menyesatkan admin).
// ===========================================================================

/**
 * Normalisasi baris `AdminRuangPublikResponse` (snake_case) ke bentuk tabel FE.
 * `fieldSource` = { nama_kolom_snake_case: waktu_edit_iso } penanda edit manual.
 */
const keBarisMaster = (row) => ({
  id: row.id,
  nama: row.nama,
  kategoriId: row.kategori_id,
  kategori: row.kategori?.label || row.kategori_id || 'Umum',
  wilayah: row.wilayah || '',
  kecamatan: row.kecamatan || '',
  kelurahan: row.kelurahan || '',
  alamat: row.alamat || '',
  latitude: row.latitude,
  longitude: row.longitude,
  deskripsi: row.deskripsi || '',
  jamOperasional: row.jam_operasional || '',
  tiketMasuk: row.tiket_masuk || '',
  aksesDisabilitas: row.akses_disabilitas || '',
  ramahHewan: row.ramah_hewan || '',
  verified: !!row.verified,
  statusGeneral: row.status_general || '',
  imageUrl: row.image_url || '',
  jumlahFasilitas: row.jumlah_fasilitas ?? 0,
  stats: keStats(row.stats),
  fieldSource: row.field_source || {},
});

/**
 * Data master ruang publik untuk admin (BE-32).
 * Mengembalikan `field_source` (penanda edit manual) + `jumlah_fasilitas`,
 * yang tidak tersedia di endpoint publik.
 *
 * @param {Object} [params] - { q, category, wilayah, diedit_manual, skip, limit }
 */
export const getAdminPublicSpaces = async (params = {}) => {
  const { q, category, wilayah, diedit_manual, skip, limit } = params;
  const data = await api.get('/api/v1/admin/public-spaces', {
    q: q || undefined,
    category: category || undefined,
    wilayah: wilayah || undefined,
    diedit_manual,
    skip,
    limit,
  });
  const items = Array.isArray(data) ? data : data?.items ?? [];
  return items.map(keBarisMaster);
};

/**
 * Edit manual satu ruang publik (BE-33). Kirim HANYA kolom yang berubah;
 * backend menandai tiap kolom yang terkirim di `field_source` (FEAT-012) agar
 * ETL berikutnya tidak menimpanya.
 *
 * @param {string} id
 * @param {Object} payload - kolom snake_case (mis. { deskripsi, verified })
 * @returns {Promise<Object>} baris master ternormalisasi (hasil edit)
 */
export const updatePublicSpaceManual = async (id, payload) => {
  const raw = await api.patch(`/api/v1/admin/public-spaces/${id}`, payload);
  return keBarisMaster(raw);
};
