import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import các trang
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Portfolio } from './pages/Portfolio';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentCancelled } from './pages/PaymentCancelled';
// 1. IMPORT TRANG MARKET VÀO ĐÂY (Lưu ý tên export là Markets)
import { Markets } from './pages/Market'; 
import { TransactionHistory } from './pages/TransactionHistory';

import { MainLayout } from './component/layout/MainLayout';
import { ProtectedRoute } from './route/ProtectedRoute'; 

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* VÙNG CÔNG CỘNG */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        {/* VÙNG KÍN (Được bọc trong MainLayout) */}
        <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
        }>
          <Route path="/home" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          {/* 2. THÊM ROUTE CHO MARKET VÀO ĐÂY */}
          <Route path="/markets" element={<Markets />} />
          <Route path="/history" element={<TransactionHistory />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancelled" element={<PaymentCancelled />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;