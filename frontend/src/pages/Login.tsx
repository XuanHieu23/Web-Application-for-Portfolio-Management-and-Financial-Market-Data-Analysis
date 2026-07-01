import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Zap, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { axiosClient } from '../services/axiosClient';
import { useAuthStore } from '../store/authStore';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').check(z.email({ error: 'Invalid email format' })),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().min(1, 'Email is required').check(z.email({ error: 'Invalid email format' })),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const navigate = useNavigate();
  const loginAction = useAuthStore(state => state.login);
  const [loading, setLoading] = useState(false);
  const [generalMessage, setGeneralMessage] = useState<{ text: string; isSuccess: boolean } | null>(null);

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });

  const handleLogin = async (data: LoginData) => {
    setLoading(true);
    setGeneralMessage(null);
    try {
      const { data: res } = await axiosClient.post('/auth/login', { email: data.email, password: data.password });
      if (res.success && res.token) {
        loginAction(res.token, res.user);
        navigate('/home');
      }
    } catch (error: any) {
      setGeneralMessage({ text: error.response?.data?.message || 'Authentication failed. Please try again.', isSuccess: false });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    setLoading(true);
    setGeneralMessage(null);
    try {
      const { data: res } = await axiosClient.post('/auth/signup', {
        username: data.username,
        email: data.email,
        password: data.password,
      });
      if (res.success) {
        loginForm.setValue('email', data.email);
        registerForm.reset();
        setIsLogin(true);
        setGeneralMessage({ text: 'Registration successful! Please sign in.', isSuccess: true });
      }
    } catch (error: any) {
      setGeneralMessage({ text: error.response?.data?.message || 'Registration failed. Please try again.', isSuccess: false });
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setGeneralMessage(null);
    loginForm.clearErrors();
    registerForm.clearErrors();
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-cyan/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#151924]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-neon-cyan to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] mb-4">
            <Zap size={32} className="text-white" fill="white" />
          </div>
          <h2 className="text-2xl font-bold tracking-wider">POMAFINA</h2>
          <p className="text-gray-500 text-sm mt-1">{isLogin ? 'Access your terminal' : 'Initialize your node'}</p>
        </div>

        {generalMessage && (
          <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium mb-5 ${generalMessage.isSuccess ? 'bg-green-950/40 border-neon-green/50 text-neon-green' : 'bg-red-950/40 border-neon-red/50 text-neon-red'}`}>
            <AlertCircle size={16} />
            <p>{generalMessage.text}</p>
          </div>
        )}

        {isLogin ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  {...loginForm.register('email')}
                  type="text"
                  className={`w-full bg-gray-900/50 border text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none transition-colors font-mono text-sm ${loginForm.formState.errors.email ? 'border-neon-red' : 'border-gray-700 focus:border-neon-cyan'}`}
                  placeholder="commander@pomafina.com"
                />
              </div>
              {loginForm.formState.errors.email && <p className="text-neon-red text-xs mt-1.5 ml-1">{loginForm.formState.errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  {...loginForm.register('password')}
                  type="password"
                  className={`w-full bg-gray-900/50 border text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none transition-colors font-mono text-sm ${loginForm.formState.errors.password ? 'border-neon-red' : 'border-gray-700 focus:border-neon-cyan'}`}
                  placeholder="••••••••"
                />
              </div>
              {loginForm.formState.errors.password && <p className="text-neon-red text-xs mt-1.5 ml-1">{loginForm.formState.errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-neon-cyan text-black rounded-xl text-sm font-bold tracking-wide hover:bg-[#00d0e0] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50"
            >
              {loading ? 'AUTHENTICATING...' : 'CONNECT WALLET'}
            </button>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">UserName</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  {...registerForm.register('username')}
                  type="text"
                  className={`w-full bg-gray-900/50 border text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none transition-colors ${registerForm.formState.errors.username ? 'border-neon-red' : 'border-gray-700 focus:border-neon-cyan'}`}
                  placeholder="John Doe"
                />
              </div>
              {registerForm.formState.errors.username && <p className="text-neon-red text-xs mt-1.5 ml-1">{registerForm.formState.errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  {...registerForm.register('email')}
                  type="text"
                  className={`w-full bg-gray-900/50 border text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none transition-colors font-mono text-sm ${registerForm.formState.errors.email ? 'border-neon-red' : 'border-gray-700 focus:border-neon-cyan'}`}
                  placeholder="commander@pomafina.com"
                />
              </div>
              {registerForm.formState.errors.email && <p className="text-neon-red text-xs mt-1.5 ml-1">{registerForm.formState.errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  {...registerForm.register('password')}
                  type="password"
                  className={`w-full bg-gray-900/50 border text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none transition-colors font-mono text-sm ${registerForm.formState.errors.password ? 'border-neon-red' : 'border-gray-700 focus:border-neon-cyan'}`}
                  placeholder="••••••••"
                />
              </div>
              {registerForm.formState.errors.password && <p className="text-neon-red text-xs mt-1.5 ml-1">{registerForm.formState.errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-neon-cyan text-black rounded-xl text-sm font-bold tracking-wide hover:bg-[#00d0e0] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50"
            >
              {loading ? 'AUTHENTICATING...' : 'INITIALIZE NODE'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an access key? " : "Already initialized? "}
          <button
            type="button"
            onClick={() => switchTab(!isLogin)}
            className="text-neon-cyan font-bold hover:underline"
          >
            {isLogin ? 'Request Access' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
