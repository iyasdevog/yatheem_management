'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, HeartHandshake, GraduationCap, ShieldCheck, Users } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials. Please try again.');
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginHints = [
    { icon: ShieldCheck, role: 'Admin / Office Staff', hint: 'Use your registered email address and password.', color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
    { icon: GraduationCap, role: 'Student / Family', hint: 'Use your Admission No. (e.g. YAT-26-101) as username. Default password: 123456', color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/20' },
    { icon: HeartHandshake, role: 'Donor / Sponsor', hint: 'Use your registered phone number or Sponsor ID as username. Default password: 123456', color: 'text-teal-400', bg: 'bg-teal-500/5 border-teal-500/20' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <a href="/" className="inline-flex items-center space-x-3 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 group-hover:scale-105 transition">
              <Sparkles className="w-8 h-8 text-slate-950 font-bold" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-white bg-clip-text text-transparent block">
                YATHEEM CARE
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-widest uppercase">
                Ayaadi Life Education · AIC
              </span>
            </div>
          </a>
          <p className="text-slate-400 text-sm">Sign in to access your secure portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <LogIn className="w-5 h-5 text-emerald-400" />
            Secure Portal Login
          </h1>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Username / Email / Admission No.
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="admin@yatheem.in / YAT-26-101 / +91..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-2.5 rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" /> Signing In...</>
              ) : (
                <><LogIn className="w-4 h-4" /> Sign In</>
              )}
            </button>
          </form>
        </div>

        {/* Login Hints by Role */}
        <div className="space-y-2">
          <p className="text-xs text-center text-slate-500 font-medium uppercase tracking-widest">How to Login</p>
          {loginHints.map(({ icon: Icon, role, hint, color, bg }) => (
            <div key={role} className={`flex items-start gap-3 p-3 rounded-xl border ${bg} text-xs`}>
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
              <div>
                <span className={`font-bold block ${color}`}>{role}</span>
                <span className="text-slate-400">{hint}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-600">
          <a href="/" className="hover:text-slate-400 transition">← Back to Yatheem Care Home</a>
        </p>
      </div>
    </div>
  );
}
