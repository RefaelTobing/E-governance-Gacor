import { http } from '../config/api';

/**
 * Login pengelola (admin/dinas).
 * FastAPI OAuth2 password flow memakai application/x-www-form-urlencoded.
 * Response body sudah dibuka oleh response interceptor.
 */
export const loginPemerintah = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  return await http.post('/api/v1/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

/**
 * Ambil data user yang sedang login.
 * Token diisi eksplisit; request interceptor menghormati header yang sudah ada.
 */
export const getMe = async (token) => {
  return await http.get('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
};
