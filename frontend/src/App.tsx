import { BrowserRouter,Routes, Route } from 'react-router-dom';
import { MainLayout } from './component/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Portfolio } from './pages/Portfolio';
import { ProtectedRoute } from './route/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
      {/* Trang Login thì ai cũng vào được */}
        <Route path="/login" element={<Login />} />

      {/* Những trang bên trong phải đi qua ProtectedRoute */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
          {/* Các route khác sau này cứ nhét vào đây... */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;