import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './component/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route không cần đăng nhập */}
        <Route path="/login" element={<Login />} />
        
        {/* Route chính (Được bọc trong Layout có Sidebar/Header) */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          {/* Tuần sau chúng ta sẽ thêm các route khác vào đây */}
          <Route path="portfolio" element={<div className="text-white p-4">Portfolio Page (Coming Soon)</div>} />
          <Route path="news" element={<div className="text-white p-4">AI News Page (Coming Soon)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;