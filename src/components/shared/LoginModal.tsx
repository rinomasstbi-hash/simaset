import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { ShieldCheck, X, Mail } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginModal() {
  const { isLoginModalOpen, closeLogin } = useAppContext();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      // Important for iframes as requested by AI Studio guidelines
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
      closeLogin();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Domain belum diizinkan. Mohon tambahkan domain URL ini di Firebase Console (Authentication > Settings > Authorized domains).');
      } else {
        setError(`Gagal login dengan Google: ${err.message || 'Error tidak diketahui'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      closeLogin();
    } catch (err: any) {
      console.error(err);
      setError('Email atau password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-300 relative flex flex-col pt-8 pb-10 px-6 sm:px-8">
        <button 
          onClick={closeLogin}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-200 rotate-3">
            <ShieldCheck className="text-white" size={32} />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center leading-tight">SIMASET-MTsN 4</h1>
          <p className="text-sm text-gray-500 text-center mb-6">Silakan login untuk dapat melakukan reservasi dan melihat notifikasi.</p>

          {error && <div className="w-full mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100">{error}</div>}

          {!isAdminMode ? (
            <div className="w-full flex justify-center flex-col gap-4">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white p-3.5 hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors font-semibold text-gray-700 shadow-sm disabled:opacity-50"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Login dengan Google
              </button>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setIsAdminMode(true)}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Masuk sebagai Admin Pengelola
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAdminLogin} className="w-full space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Email Admin</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="admin@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
              
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm shadow-emerald-200 mt-2"
              >
                {isLoading ? 'Memeriksa...' : 'Login Admin'}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsAdminMode(false)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Kembali ke Login Pengguna
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
