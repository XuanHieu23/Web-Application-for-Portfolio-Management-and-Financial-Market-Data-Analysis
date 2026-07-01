import React, { useState, useRef } from 'react';
import { User, KeyRound, CrownIcon, Camera, ShieldOff, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { axiosClient } from '../services/axiosClient';
import { useAuthStore } from '../store/authStore';

const profileSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

const passwordSchema = z.object({
  current: z.string().min(1, 'Current password is required'),
  next: z.string().min(6, 'New password must be at least 6 characters'),
  confirm: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.next === data.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

type Tab = 'profile' | 'password' | 'subscription';

interface Notif { message: string; type: 'success' | 'error'; }

export const Settings: React.FC = () => {
  const { user, updateUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [notif, setNotif] = useState<Notif | null>(null);

  const showNotif = (message: string, type: 'success' | 'error') => {
    setNotif({ message, type });
    setTimeout(() => setNotif(null), 4000);
  };

  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || '');
  const [avatarBase64, setAvatarBase64] = useState<string | undefined>(undefined);
  const [profileLoading, setProfileLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: user?.username || '' },
  });

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current: '', next: '', confirm: '' },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotif('Invalid file type. Please upload a JPG, PNG, or WebP image.', 'error');
      return;
    }

    if (file.size > 500_000) {
      showNotif(`File too large (${(file.size / 1024).toFixed(0)}KB). Maximum allowed size is 500KB.`, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setAvatarBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    setAvatarBase64('');
  };

  const handleProfileSave = async (data: ProfileData) => {
    setProfileLoading(true);
    try {
      const res = await axiosClient.put('/auth/profile', {
        username: data.username,
        ...(avatarBase64 !== undefined && { avatar: avatarBase64 }),
      });
      if (res.data?.success) {
        updateUser({ username: res.data.user.username, avatar: res.data.user.avatar });
        setAvatarBase64(undefined);
        showNotif('Profile updated successfully.', 'success');
      }
    } catch (err: any) {
      showNotif(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const [pwLoading, setPwLoading] = useState(false);

  const handlePasswordChange = async (data: PasswordData) => {
    setPwLoading(true);
    try {
      const res = await axiosClient.put('/auth/change-password', {
        currentPassword: data.current,
        newPassword: data.next,
      });
      if (res.data?.success) {
        passwordForm.reset();
        showNotif('Password changed. Please log in again.', 'success');
        setTimeout(() => logout(), 2000);
      }
    } catch (err: any) {
      showNotif(err.response?.data?.message || 'Failed to change password.', 'error');
    } finally {
      setPwLoading(false);
    }
  };

  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const handleCancelPro = async () => {
    setCancelLoading(true);
    try {
      const res = await axiosClient.put('/auth/cancel-pro');
      if (res.data?.success) {
        updateUser({ tier: 'FREE' });
        setCancelConfirm(false);
        showNotif('PRO subscription cancelled. You are now on the FREE plan.', 'success');
      }
    } catch (err: any) {
      showNotif(err.response?.data?.message || 'Failed to cancel subscription.', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'password', label: 'Password', icon: <KeyRound size={16} /> },
    { id: 'subscription', label: 'Subscription', icon: <CrownIcon size={16} /> },
  ];

  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  const confirmPassword = passwordForm.watch('next');

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {notif && (
        <div className={`fixed top-20 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl border text-sm font-medium shadow-lg animate-in fade-in slide-in-from-right-10 ${
          notif.type === 'success'
            ? 'bg-green-950/80 border-neon-green/40 text-neon-green'
            : 'bg-red-950/80 border-red-500/40 text-red-400'
        }`}>
          {notif.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {notif.message}
        </div>
      )}

      <div>
        <p className="text-gray-500 font-bold tracking-widest text-xs mb-1 uppercase">Account</p>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
      </div>

      <div className="flex gap-2 bg-[#0B0E14] border border-gray-800 rounded-xl p-1.5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-neon-cyan/10 border border-neon-cyan/40 text-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.1)]'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="bg-neon-panel border border-gray-800 rounded-2xl p-8">
          <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-6">Profile Information</h2>
          <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-neon-cyan/50 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-neon-cyan/30 to-blue-600/30 border-2 border-neon-cyan/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                    <span className="text-2xl font-extrabold text-neon-cyan">{initials}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Camera size={22} className="text-white" />
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    title="Remove avatar"
                    className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-600 border-2 border-[#151924] flex items-center justify-center hover:bg-red-500 transition-colors z-10"
                  >
                    <Trash2 size={13} className="text-white" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-neon-cyan text-xs font-bold hover:underline tracking-wider"
              >
                UPLOAD PHOTO
              </button>
              <p className="text-gray-600 text-xs font-mono">JPG, PNG, WebP — max 500KB</p>
            </div>

            <div>
              <label className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-2">Username</label>
              <input
                {...profileForm.register('username')}
                type="text"
                className={`w-full bg-[#0B0E14] border text-white rounded-lg px-4 py-3 focus:outline-none font-mono text-sm transition-colors ${profileForm.formState.errors.username ? 'border-neon-red' : 'border-gray-700 focus:border-neon-cyan'}`}
              />
              {profileForm.formState.errors.username && (
                <p className="text-neon-red text-xs mt-1.5">{profileForm.formState.errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-2">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full bg-[#0B0E14] border border-gray-800 text-gray-500 rounded-lg px-4 py-3 font-mono text-sm cursor-not-allowed"
              />
              <p className="text-gray-600 text-xs mt-1.5 font-mono">Email cannot be changed.</p>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full py-3 bg-neon-cyan text-black rounded-lg text-sm font-bold hover:bg-[#00d0e0] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50"
            >
              {profileLoading ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="bg-neon-panel border border-gray-800 rounded-2xl p-8">
          <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-6">Change Password</h2>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-5">
            <div>
              <label className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-2">Current Password</label>
              <input
                {...passwordForm.register('current')}
                type="password"
                className={`w-full bg-[#0B0E14] border text-white rounded-lg px-4 py-3 focus:outline-none font-mono text-sm transition-colors ${passwordForm.formState.errors.current ? 'border-neon-red' : 'border-gray-700 focus:border-neon-cyan'}`}
                placeholder="••••••••"
              />
              {passwordForm.formState.errors.current && (
                <p className="text-neon-red text-xs mt-1.5">{passwordForm.formState.errors.current.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-2">New Password</label>
              <input
                {...passwordForm.register('next')}
                type="password"
                className={`w-full bg-[#0B0E14] border text-white rounded-lg px-4 py-3 focus:outline-none font-mono text-sm transition-colors ${passwordForm.formState.errors.next ? 'border-neon-red' : 'border-gray-700 focus:border-neon-cyan'}`}
                placeholder="••••••••"
              />
              {passwordForm.formState.errors.next && (
                <p className="text-neon-red text-xs mt-1.5">{passwordForm.formState.errors.next.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-2">Confirm New Password</label>
              <input
                {...passwordForm.register('confirm')}
                type="password"
                className={`w-full bg-[#0B0E14] border text-white rounded-lg px-4 py-3 focus:outline-none font-mono text-sm transition-colors ${passwordForm.formState.errors.confirm ? 'border-red-500/60 focus:border-red-500' : 'border-gray-700 focus:border-neon-cyan'}`}
                placeholder="••••••••"
              />
              {passwordForm.formState.errors.confirm && (
                <p className="text-red-400 text-xs mt-1.5 font-mono">{passwordForm.formState.errors.confirm.message}</p>
              )}
            </div>

            <div className="bg-[#0B0E14] border border-yellow-900/40 rounded-lg px-4 py-3 text-yellow-600 text-xs font-mono">
              After changing your password, you will be logged out automatically.
            </div>

            <button
              type="submit"
              disabled={pwLoading || (!!confirmPassword && confirmPassword !== passwordForm.watch('next'))}
              className="w-full py-3 bg-neon-cyan text-black rounded-lg text-sm font-bold hover:bg-[#00d0e0] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50"
            >
              {pwLoading ? 'UPDATING...' : 'UPDATE PASSWORD'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="space-y-4">
          <div className={`bg-neon-panel border rounded-2xl p-8 ${user?.tier === 'PRO' ? 'border-neon-cyan/30' : 'border-gray-800'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-sm tracking-widest uppercase">Current Plan</h2>
              <span className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${
                user?.tier === 'PRO'
                  ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50'
                  : 'bg-gray-800 text-gray-400 border-gray-700'
              }`}>
                {user?.tier === 'PRO' ? 'PRO TIER' : 'FREE TIER'}
              </span>
            </div>

            {user?.tier === 'PRO' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['AI Oracle — Portfolio Analysis', 'Groq AI Market Sentiment', 'Priority Support'].map(feat => (
                    <div key={feat} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle size={15} className="text-neon-cyan shrink-0" />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm">You are on the <span className="text-white font-bold">FREE</span> plan. Upgrade to unlock AI features.</p>
                <button
                  onClick={() => axiosClient.post('/payment/create-checkout-session').then(r => { if (r.data?.url) window.location.href = r.data.url; })}
                  className="py-3 px-6 bg-neon-cyan text-black rounded-lg text-sm font-bold hover:bg-[#00d0e0] transition-all"
                >
                  UPGRADE TO PRO ($15/mo)
                </button>
              </div>
            )}
          </div>

          {user?.tier === 'PRO' && (
            <div className="bg-neon-panel border border-red-900/40 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <ShieldOff size={20} className="text-red-400" />
                <h2 className="text-white font-bold text-sm tracking-widest uppercase">Cancel Subscription</h2>
              </div>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Cancelling your PRO subscription will immediately downgrade your account to the FREE plan.
                You will lose access to AI Oracle and advanced features.
              </p>

              {!cancelConfirm ? (
                <button
                  onClick={() => setCancelConfirm(true)}
                  className="py-3 px-6 bg-transparent border border-red-500/50 text-red-400 rounded-lg text-sm font-bold hover:bg-red-950/40 hover:border-red-400 transition-all"
                >
                  CANCEL SUBSCRIPTION
                </button>
              ) : (
                <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-5 space-y-4">
                  <p className="text-red-400 text-sm font-bold">Are you sure? This action cannot be undone.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancelPro}
                      disabled={cancelLoading}
                      className="flex-1 py-3 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-500 transition-all disabled:opacity-50"
                    >
                      {cancelLoading ? 'PROCESSING...' : 'YES, CANCEL PRO'}
                    </button>
                    <button
                      onClick={() => setCancelConfirm(false)}
                      className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-700 transition-all"
                    >
                      KEEP PRO
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
