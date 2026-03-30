import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationBanner } from '../component/ui/NotificationBanner';
import { authApi } from '../api/authApi';

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // State quản lý Notification
  const [notify, setNotify] = useState<{ message: string; type: 'success' | 'error' | 'warning' }>({ message: '', type: 'success' });
  
  const navigate = useNavigate();

  const showNotification = (message: string, type: 'success' | 'error' | 'warning') => {
    setNotify({ message, type });
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // GỌI API ĐĂNG NHẬP QUA FOLDER API
        const data = await authApi.login({ email, password });
        
        showNotification('Đăng nhập thành công!', 'success');
        localStorage.setItem('token', data.token); // Lưu token
        setTimeout(() => navigate('/'), 1000); // Đẩy về trang chủ
        
      } else {
        // GỌI API ĐĂNG KÝ QUA FOLDER API
        await authApi.signup({ username, email, password });
        
        showNotification('Đăng ký thành công! Vui lòng đăng nhập lại.', 'success');
        setIsLogin(true); // Trượt về form Đăng nhập
        setPassword('');
      }
    } catch (error: any) {
      console.error('Lỗi Auth:', error);
      
      // Axios thông minh hơn fetch, nó tự bóc tách lỗi từ Backend trả về
      // Lấy câu thông báo lỗi từ Backend (nếu có), không thì báo lỗi chung chung
      const errorMsg = error.response?.data?.message || 'Không thể kết nối tới Server. Vui lòng thử lại!';
      showNotification(errorMsg, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-neon-bg flex items-center justify-center p-4 relative">
      {/* Gắn Banner thông báo vào đây */}
      <NotificationBanner 
        message={notify.message} 
        type={notify.type} 
        onClose={() => setNotify({ ...notify, message: '' })} 
      />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-cyan/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* ... (Giữ nguyên toàn bộ phần form UI cực ngầu ở bên dưới) ... */}
      <div className="w-full max-w-md bg-neon-panel backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10 transition-all duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-400 text-sm">
            {isLogin ? 'Sign in to your Neo Exchange account' : 'Join the future of trading'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isLogin ? 'max-h-0 opacity-0 m-0' : 'max-h-24 opacity-100 mb-5'}`}>
            <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
            <input 
              type="text" 
              required={!isLogin}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
              placeholder={isLogin ? "Enter your password" : "Minimum 6 characters"}
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-neon-cyan hover:bg-cyan-400 text-black font-bold py-3 rounded-lg transition-colors duration-200 shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] mt-2"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setNotify({ message: '', type: 'success' }); // Reset thông báo khi chuyển tab
            }} 
            className="text-neon-cyan hover:underline font-medium focus:outline-none"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};