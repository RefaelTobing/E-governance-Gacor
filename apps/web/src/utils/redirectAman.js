/**
 * Validasi tujuan redirect pasca-login yang datang dari query `?redirect=`.
 *
 * Hanya menerima path internal aplikasi (diawali "/") untuk mencegah
 * open redirect ke domain eksternal. Nilai seperti "//evil.com" atau
 * "https://evil.com" ditolak → kembalikan null.
 *
 * @param {string|null|undefined} nilai - nilai mentah dari query string
 * @returns {string|null} path aman, atau null bila tidak valid
 */
export const redirectAman = (nilai) => {
  if (typeof nilai !== 'string') return null;
  if (!nilai.startsWith('/')) return null;
  // "//host" adalah protocol-relative URL → bisa keluar dari aplikasi.
  if (nilai.startsWith('//')) return null;
  // Backslash dipakai sebagian browser sebagai pemisah path/authority.
  if (nilai.includes('\\')) return null;
  return nilai;
};

export default redirectAman;
