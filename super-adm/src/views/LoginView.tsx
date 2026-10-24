import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Mail, ArrowRight, Loader2, Lock } from 'lucide-react';
import { adminApi, authStorage } from '../lib/api';
import { AdminUser } from '../types';

interface LoginViewProps {
  onSuccess: (user: AdminUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await adminApi.login(email.trim(), password);
      if (res.require_2fa && res.temp_token) {
        setTempToken(res.temp_token);
        setStep('2fa');
      } else if (res.token && res.user) {
        authStorage.setToken(res.token);
        authStorage.setUser(res.user);
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await adminApi.verify2FA(tempToken, totpCode.trim());
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || '2FA kodi noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">BiznesGo</h1>
            <p className="text-xs text-blue-400 font-mono">Super Admin Tizimi</p>
          </div>
        </div>

        {step === 'credentials' ? (
          <div>
            <div className="mb-6 text-center">
              <h2 className="text-base font-semibold text-slate-100">Tizimga Kirish</h2>
              <p className="text-xs text-slate-400 mt-1">Super Admin akkauntingiz orqali autentifikatsiyadan o'ting</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Login yoki Elektron Pochta
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Parol
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg p-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Tekshirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <span>Tizimga kirish</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="mb-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-base font-semibold text-slate-100">Ikki Bosqichli Himoya (2FA)</h2>
              <p className="text-xs text-slate-400 mt-1">Google Authenticator yoki ilovangizdagi 6 xonali TOTP kodini kiriting</p>
            </div>

            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 text-center">
                  6 Xonali Bir Martalik Kod
                </label>
                <div className="relative max-w-xs mx-auto">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-center text-lg font-mono tracking-widest text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg p-2.5 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || totpCode.length < 6}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Tasdiqlanmoqda...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Kirishni Tasdiqlash</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="w-full text-xs text-slate-400 hover:text-slate-200 py-1"
              >
                &larr; Orqaga qaytish
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-400">
              Demo TOTP kodi: <code className="text-amber-300">123456</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

