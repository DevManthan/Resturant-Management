import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Key,
  Shield,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AdminLogin({ onLoginSuccess, onBackToHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      // Validate manager / executive credentials
      if (
        (cleanEmail === 'vikram@luxedine.in' && cleanPass === 'admin123') ||
        (cleanEmail === 'admin' && (cleanPass === 'admin123' || cleanPass === '1234')) ||
        (cleanEmail === 'manthan' && (cleanPass === 'admin123' || cleanPass === '1234' || cleanPass === 'manthan'))
      ) {
        sessionStorage.setItem('luxedine_admin_auth', 'true');
        onLoginSuccess();
      } else {
        setError('Invalid credentials. Please verify your manager email and password.');
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center px-4 font-sans select-none relative overflow-hidden">
      {/* Subtle Warm Gastronomy Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#B88E52]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Back to Home Button */}
      <button
        onClick={onBackToHome}
        className="absolute top-6 left-6 text-xs font-semibold text-slate-500 hover:text-slate-950 flex items-center gap-2 transition-colors cursor-pointer bg-white/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#E8E2D5] shadow-2xs"
      >
        <ArrowLeft className="w-4 h-4 text-[#B88E52]" />
        <span>Return to Restaurant Home</span>
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white border border-[#E8E2D5] rounded-3xl p-8 sm:p-9 shadow-[0_12px_40px_rgba(0,0,0,0.06)] relative z-10 text-slate-900">
        {/* Header */}
        <div className="text-center space-y-2.5 mb-7">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF3E8] border border-[#EADBBE] text-[#B88E52] flex items-center justify-center font-serif font-black text-xl mx-auto shadow-sm">
            LD
          </div>
          <span className="inline-block text-[10px] uppercase font-bold tracking-[0.2em] text-[#B88E52] bg-[#FAF3E8] px-3 py-1 rounded-full border border-[#EADBBE]">
            Executive Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-950 tracking-tight">
            Executive BI Suite
          </h2>
          <p className="text-xs text-slate-500">
            Management, Live Kitchen KDS & Floorplan Control
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Manager Email / Username
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                placeholder="Enter email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-3.5 bg-[#FAF7F2] border border-[#E8E2D5] rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-[#B88E52] focus:bg-white transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Security Password / PIN
            </label>
            <div className="relative flex items-center">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="password"
                placeholder="Enter password or PIN"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-3.5 bg-[#FAF7F2] border border-[#E8E2D5] rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-[#B88E52] focus:bg-white transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5 text-[#B88E52]" />
              <span>{isLoading ? 'Verifying...' : 'Sign In to Dashboard'}</span>
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-6 pt-5 border-t border-[#F0ECE1] text-center">
          <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Authorized restaurant personnel only</span>
          </p>
        </div>
      </div>
    </div>
  );
}
