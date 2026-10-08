const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    headers,
    ...options,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    console.error(`Gagal menghubungi server pada ${url}:`, networkError);
    const err = new Error(
      `Gagal terhubung ke server backend (${networkError.message}). Periksa apakah backend aktif di port 8000.`
    );
    err.originalError = networkError;
    throw err;
  }

  if (!response.ok) {
    const error = new Error(`HTTP error! status: ${response.status}`);
    error.status = response.status;
    // FastAPI menjelaskan penyebab lewat { detail }; tanpa ini yang terbaca di UI
    // hanya "status 409", bukan larangan yang sebenarnya.
    try {
      const body = await response.json();
      error.detail = body?.detail;
    } catch (e) {
      // body bukan JSON (mis. halaman error reverse proxy), biarkan apa adanya
    }
    throw error;
  }

  return response.json();
};

export const assetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = BASE_URL || '';
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const api = {
  get: (endpoint, params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return request(url, { method: 'GET' });
  },
  post: (endpoint, body) =>
    request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  upload: async (endpoint, formData, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    const token = localStorage.getItem('access_token');
    const headers = { ...options.headers };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    let response;
    try {
      response = await fetch(url, {
        ...options,
        method: 'POST',
        // Tanpa Content-Type manual: browser harus menambahkan boundary multipart.
        headers,
        body: formData,
      });
    } catch (networkError) {
      console.error(`Gagal mengunggah berkas ke ${url}:`, networkError);
      const err = new Error(
        `Gagal mengunggah berkas (${networkError.message}). Periksa apakah backend aktif di port 8000.`
      );
      err.originalError = networkError;
      throw err;
    }
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      try {
        const body = await response.json();
        error.detail = body?.detail;
      } catch (e) {}
      throw error;
    }
    return response.json();
  },
  put: (endpoint, body) =>
    request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) =>
    request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) =>
    request(endpoint, { method: 'DELETE' }),
};

export default api;
