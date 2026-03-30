import axios from 'axios';

export const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Trỏ thẳng vào Backend của chúng ta
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động đính kèm Token vào Header trước khi gửi đi
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);