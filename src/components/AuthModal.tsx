import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Mail, User as UserIcon, ShieldAlert } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    showAuthModal, 
    setShowAuthModal, 
    authModalMode, 
    setAuthModalMode, 
    login, 
    register, 
    showToast 
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  if (!showAuthModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authModalMode === 'login') {
      if (!email) {
        showToast('Please enter an email address.', 'error');
        return;
      }
      login(email);
    } else if (authModalMode === 'signup') {
      if (!fullName || !email) {
        showToast('Please enter your name and email.', 'error');
        return;
      }
      register(fullName, email);
    } else {
      showToast(`Password reset link sent to ${email}`, 'info');
      setShowAuthModal(false);
    }
  };

  const handleQuickLogin = (role: 'user' | 'admin') => {
    if (role === 'admin') {
      login('admin@pdfgenius.com', 'admin');
    } else {
      login('demo@pdfgenius.com', 'user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              {authModalMode === 'login'
                ? 'Welcome to PDFGenius'
                : authModalMode === 'signup'
                ? 'Create Your Free Account'
                : 'Reset Your Password'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {authModalMode === 'login'
                ? 'Sign in to access your saved files and documents'
                : authModalMode === 'signup'
                ? 'Get 5 free operations per day with zero setup'
                : 'Enter your email to receive a recovery link'}
            </p>
          </div>
          <button
            onClick={() => setShowAuthModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {authModalMode === 'signup' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {authModalMode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Password</label>
                {authModalMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setAuthModalMode('forgot')}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors text-xs"
          >
            {authModalMode === 'login'
              ? 'Sign In to Workspace'
              : authModalMode === 'signup'
              ? 'Create Account'
              : 'Send Recovery Email'}
          </button>

          {/* Quick Demo Credentials for Fast Evaluation */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
              Instant 1-Click Evaluation Logins
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('user')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-center transition-colors text-[11px]"
              >
                Log In as Demo User
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-semibold text-center transition-colors text-[11px] flex items-center justify-center gap-1"
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Log In as Admin</span>
              </button>
            </div>
          </div>

          {/* Toggle modes */}
          <div className="pt-2 text-center text-[11px] text-slate-500">
            {authModalMode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalMode('signup')}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Sign up free
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalMode('login')}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Log in
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
