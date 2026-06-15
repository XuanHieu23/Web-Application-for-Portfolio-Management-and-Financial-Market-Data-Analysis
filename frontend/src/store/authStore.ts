import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
  tier: 'FREE' | 'PRO';
  avatar?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
}

// ĐÃ FIX: Hàm tự bóc tách JWT để kiểm tra thời hạn trên Frontend
const checkTokenValidity = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false; 
    }
    return true;
  } catch (error) {
    return false;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  // ĐÃ FIX: Chạy hàm check thật sự thay vì chỉ !!localStorage
  isAuthenticated: checkTokenValidity(),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  
  login: (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ isAuthenticated: true, token, user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ isAuthenticated: false, token: null, user: null });
    window.location.href = '/login';
  },

  updateUser: (partial: Partial<User>) => {
    set(state => {
      if (!state.user) return state;
      const updated = { ...state.user, ...partial };
      localStorage.setItem('user', JSON.stringify(updated));
      return { user: updated };
    });
  },
}));