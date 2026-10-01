const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = new Error(`HTTP error! status: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
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
  put: (endpoint, body) =>
    request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) =>
    request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) =>
    request(endpoint, { method: 'DELETE' }),
};

export default api;
