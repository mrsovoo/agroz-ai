import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { api } from '../lib/api';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Login va parolni kiritish shart');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await api.login({
        username: username.trim(),
        password: password.trim(),
      });
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login yoki parol xato');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-900 font-sans p-4 flex items-center justify-center">
      {/* Centered Glass Bento Card */}
      <div className="w-full max-w-md bg-[#F6F6F3] rounded-[36px] shadow-2xl p-8 sm:p-10 border border-white/20 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#22C55E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center mb-4 border border-slate-200/60">
            {/* 12-ray sunburst asterisk icon */}
            <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Super Admin Tizimi</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            BiznesGO Nazorat Markazi
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            B2B ekotizimini xavfsiz boshqarish uchun login va parolingizni kiriting
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">
              Login (Username / Telefon)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">
              Maxfiy Parol
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                required
                className="w-full pl-10 pr-11 py-3 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Standart login parol eslatmasi */}
          <div className="p-3 bg-white/70 border border-slate-200/70 rounded-2xl flex items-center justify-between text-[11px] text-slate-600">
            <span>Standart login: <strong className="text-black font-bold">admin</strong></span>
            <span className="text-slate-300">•</span>
            <span>Parol: <strong className="text-black font-bold">admin123</strong></span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-black hover:bg-slate-800 active:scale-[0.99] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition duration-150 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Tekshirilmoqda...</span>
              </div>
            ) : (
              <>
                <span>Tizimga Kirish</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Footer Note */}
        <div className="mt-8 pt-5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>256-bit HMAC Himoya</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">v1.2.0 (2026)</span>
        </div>
      </div>
    </div>
  );
};

