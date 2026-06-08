import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Đảm bảo trỏ đúng port backend của bạn
  headers: {
    'Content-Type': 'application/json',
  },
});

// Trạm kiểm soát chiều ĐI (Gắn Token vào mọi request)
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trạm kiểm soát chiều VỀ (Bắt lỗi 401 Hết hạn Token / Xâm nhập trái phép)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu Backend báo 401 (Không có quyền/Hết hạn)
    if (error.response && error.response.status === 401) {
      console.warn('Vượt rào hoặc Token hết hạn! Đá về Login.');
      // 1. Gọi hàm logout của Zustand để xóa sạch state và localStorage
      useAuthStore.getState().logout();
      // 2. Ép trình duyệt reload và bay về /login
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);