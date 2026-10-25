import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Key,
  Shield,
  ArrowLeft,
  Sparkles,
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
      // Validate credentials (accepts default demo credentials or any reasonable input)
      if (
        (email.trim().toLowerCase() === 'vikram@luxedine.in' && password === 'admin123') ||
        (email.trim().toLowerCase() === 'admin' && password === '1234') ||
        (email.trim().length > 3 && password.length >= 4)
      ) {
        sessionStorage.setItem('luxedine_admin_auth', 'true');
        onLoginSuccess();
      } else {
        setError('Invalid credentials. Use Demo Fill below or password of 4+ characters.');
      }
      setIsLoading(false);
    }, 400);
  };

  const handleDemoFill = () => {
    setEmail('vikram@luxedine.in');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0E13] flex flex-col justify-center items-center px-4 font-sans select-none relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Back to Home Button */}
      <button
        onClick={onBackToHome}
        className="absolute top-6 left-6 text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Restaurant Home</span>
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#121820] border border-slate-800 rounded-3xl p-7 sm:p-8 shadow-2xl relative z-10 text-slate-100">
        {/* Header */}
        <div className="text-center space-y-2 mb-7">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-serif font-black text-lg mx-auto shadow-lg shadow-amber-500/20">
            XD
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
            Executive BI Suite
          </h2>
          <p className="text-xs text-slate-400">
            Management, Live Kitchen KDS & Floorplan Control
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Manager Email / Username
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5" />
              <input
                type="text"
                placeholder="vikram@luxedine.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Security Password / PIN
            </label>
            <div className="relative flex items-center">
              <Key className="w-4 h-4 text-slate-500 absolute left-3.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
            </div>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Verifying...' : 'Sign In to Dashboard'}</span>
            </button>

            <button
              type="button"
              onClick={handleDemoFill}
              className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Demo Fill (Owner Credentials)</span>
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Authorized restaurant personnel only</span>
          </p>
        </div>
      </div>
    </div>
  );
}
