import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Khởi tạo trạng thái: Nếu có token trong máy thì coi như đã đăng nhập
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: (token: string) => {
    localStorage.setItem('token', token);
    set({ isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ isAuthenticated: false });
  },
}));