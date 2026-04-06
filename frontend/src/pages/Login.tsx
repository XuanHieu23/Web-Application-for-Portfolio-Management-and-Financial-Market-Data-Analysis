import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Zap, AlertCircle } from 'lucide-react';
import { axiosClient } from '../services/axiosClient'; // Đảm bảo import có ngoặc nhọn

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  // State lưu dữ liệu form
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  
  // State lưu lỗi của từng ô input
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  // Hàm kiểm tra lỗi trước khi gửi
  const validateForm = () => {
    const newErrors: any = {};
    if (!isLogin && !formData.name.trim()) newErrors.name = 'Full name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format (e.g., name@domain.com)';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Trả về true nếu không có lỗi nào
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return; // Dừng lại nếu form có lỗi

    setLoading(true);
    setErrors({}); // Xóa lỗi cũ

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email: formData.email, password: formData.password } : formData;

      const response = await axiosClient.post(endpoint, payload);

      if (response.data.success) {
        // Lưu token vào localStorage (Kiểm tra lại backend của bạn trả token ở trường nào nhé)
        const token = response.data.token || response.data.data?.token;
        if (token) localStorage.setItem('token', token);
        
        navigate('/home'); // Đăng nhập xong đá thẳng vào Dashboard
      }
    } catch (error: any) {
      // Bắt lỗi từ Backend (Sai pass, email đã tồn tại...) và hiển thị lỗi chung
      const message = error.response?.data?.message || 'Authentication failed. Please try again.';
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-cyan/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-[#151924]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-neon-cyan to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] mb-4">
            <Zap size={32} className="text-white" fill="white" />
          </div>
          <h2 className="text-2xl font-bold tracking-wider">KINETIC<span className="text-neon-cyan">.OBSIDIAN</span></h2>
          <p className="text-gray-500 text-sm mt-1">{isLogin ? 'Access your terminal' : 'Initialize your node'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Lỗi chung từ Backend (ví dụ: Sai mật khẩu) */}
          {errors.general && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-neon-red/50 text-neon-red text-sm font-medium">
              <AlertCircle size={16} />
              <p>{errors.general}</p>
            </div>
          )}

          {/* Input Name (Chỉ hiện khi Đăng ký) */}
          {!isLogin && (
            <div>
              <label className="block text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full bg-gray-900/50 border text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none transition-colors ${errors.name ? 'border-neon-red focus:border-neon-red' : 'border-gray-700 focus:border-neon-cyan'}`}
                  placeholder="John Doe"
                />
              </div>
              {/* Lỗi Inline cho Name */}
              {errors.name && <p className="text-neon-red text-xs mt-1.5 ml-1">{errors.name}</p>}
            </div>
          )}

          {/* Input Email */}
          <div>
            <label className="block text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full bg-gray-900/50 border text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none transition-colors font-mono text-sm ${errors.email ? 'border-neon-red focus:border-neon-red' : 'border-gray-700 focus:border-neon-cyan'}`}
                placeholder="commander@kinetic.com"
              />
            </div>
            {/* Lỗi Inline cho Email */}
            {errors.email && <p className="text-neon-red text-xs mt-1.5 ml-1">{errors.email}</p>}
          </div>

          {/* Input Password */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-400 text-xs font-bold tracking-widest uppercase">Password</label>
              {isLogin && <a href="#" className="text-neon-cyan text-xs hover:underline">Forgot?</a>}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full bg-gray-900/50 border text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none transition-colors font-mono text-sm ${errors.password ? 'border-neon-red focus:border-neon-red' : 'border-gray-700 focus:border-neon-cyan'}`}
                placeholder="••••••••"
              />
            </div>
            {/* Lỗi Inline cho Password */}
            {errors.password && <p className="text-neon-red text-xs mt-1.5 ml-1">{errors.password}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-neon-cyan text-black rounded-xl text-sm font-bold tracking-wide hover:bg-[#00d0e0] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : (isLogin ? 'CONNECT WALLET' : 'INITIALIZE NODE')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an access key? " : "Already initialized? "}
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({}); // Xóa lỗi khi lật trang
            }} 
            className="text-neon-cyan font-bold hover:underline"
          >
            {isLogin ? 'Request Access' : 'Sign In'}
          </button>
        </div>

      </div>
    </div>
  );
};