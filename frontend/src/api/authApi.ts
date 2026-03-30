import { axiosClient } from '../services/axiosClient';
import { API_ENDPOINTS } from './endpoints';

export const authApi = {
  // Hàm Đăng nhập
  login: async (data: { email: string; password: string }) => {
    // Gọi axios (Anh bồi bàn) mang data tới đúng địa chỉ trong Danh bạ
    const response = await axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
  },

  // Hàm Đăng ký
  signup: async (data: { username: string; email: string; password: string }) => {
    const response = await axiosClient.post(API_ENDPOINTS.AUTH.SIGNUP, data);
    return response.data;
  }
};