import { http } from '../config/api';

const postLogin = async (endpoint, email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  return await http.post(endpoint, formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

/**
 * Login warga. Backend menolak akun petugas di endpoint ini.
 */
export const loginWarga = async (email, password) =>
  postLogin('/api/v1/auth/login', email, password);

/**
 * Login petugas. Backend memeriksa role sebelum menerbitkan token.
 */
export const loginAdmin = async (email, password) =>
  postLogin('/api/v1/auth/admin/login', email, password);

/**
 * Registrasi akun warga.
 * Backend (app/schemas/user.py: UserCreate) hanya menerima name, email,
 * password (+ role opsional yang default-nya warga).
 */
export const registerWarga = async ({ name, email, password }) => {
  return await http.post('/api/v1/auth/register', {
    name,
    email,
    password,
    role: 'warga',
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
