const fieldName = (loc) => {
  if (!Array.isArray(loc) || loc.length === 0) return null;
  return loc[loc.length - 1];
};

/** Terjemahkan pesan validasi pydantic yang paling sering muncul ke bahasa user. */
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

export const parseApiError = async (res, fallback = 'Terjadi kesalahan. Silakan coba lagi.') => {
  let body = null;

  try {
    const text = await res.text();
    body = text ? JSON.parse(text) : null;
  } catch {
    // Body bukan JSON (mis. "Internal Server Error" dari uvicorn) atau JSON rusak.
    return res.status >= 500
      ? 'Terjadi kesalahan di server. Coba lagi beberapa saat lagi.'
      : fallback;
  }

  const detail = body?.detail;

  // 422: array of object -> jangan pernah dibiarkan jadi "[object Object]".
  if (Array.isArray(detail)) {
    return detail.map(translateFieldError).join(' ') || fallback;
  }

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  return res.status >= 500
    ? 'Terjadi kesalahan di server. Coba lagi beberapa saat lagi.'
    : fallback;
};

/** Bungkus pemanggilan fetch agar error selalu berupa Error dengan pesan terbaca. */
export const requestWithError = async (url, options, fallback) => {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.');
  }

  if (!res.ok) {
    throw new Error(await parseApiError(res, fallback));
  }

  return res;
};
