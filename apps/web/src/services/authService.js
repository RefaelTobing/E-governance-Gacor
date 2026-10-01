import { api } from '../config/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const loginPemerintah = async (email, password) => {
  const url = `${BASE_URL}/api/v1/auth/login`;
  
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString()
  });

  if (!response.ok) {
    let errorDetail = 'Login failed';
    try {
      const data = await response.json();
      errorDetail = data.detail || errorDetail;
    } catch (e) {}
    throw new Error(errorDetail);
  }

  return response.json();
};

export const getMe = async (token) => {
  const url = `${BASE_URL}/api/v1/auth/me`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }

  return response.json();
};
