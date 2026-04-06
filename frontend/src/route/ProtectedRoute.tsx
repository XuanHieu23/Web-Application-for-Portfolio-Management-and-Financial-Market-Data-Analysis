import React from 'react';
import { Navigate } from 'react-router-dom';
// TODO: Import store quản lý Auth của bạn (Zustand) vào đây sau
// import { useAuthStore } from '../store/authStore';

// 1. Khai báo rõ ràng là Component này sẽ nhận vào các component con (children)
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // 2. Tạm thời để true để bạn test giao diện. 
  // Sau này làm logic Login xong, bạn sẽ lấy biến này từ Zustand (ví dụ: const isAuthenticated = useAuthStore(state => state.isAuthenticated))
  const isAuthenticated = true; 

  // Nếu chưa đăng nhập -> Đá văng ra trang /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập -> Hiển thị các Component con (chính là MainLayout)
  return <>{children}</>;
};