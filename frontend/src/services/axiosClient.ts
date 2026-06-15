import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const axiosClient = axios.create({
  // ĐÃ FIX: Đọc từ file .env, chỉ dùng localhost làm dự phòng
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Vượt rào hoặc Token hết hạn! Đá về Login.');
      useAuthStore.getState().logout(); // logout() đã xử lý redirect về /login
    }
    return Promise.reject(error);
  }
);