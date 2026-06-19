import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Portfolio } from './pages/Portfolio';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentCancelled } from './pages/PaymentCancelled';

import { Markets } from './pages/Market';
import { TransactionHistory } from './pages/TransactionHistory';
import { Settings } from './pages/Settings';

import { MainLayout } from './component/layout/MainLayout';
import { ProtectedRoute } from './route/ProtectedRoute';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
                <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

                <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
        }>
          <Route path="/home" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/markets" element={<Markets />} />
          <Route path="/history" element={<TransactionHistory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancelled" element={<PaymentCancelled />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
