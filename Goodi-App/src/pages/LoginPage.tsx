
import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase';

const googleProvider = new GoogleAuthProvider();

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('[LoginPage] email auth error:', err);
      const message =
        err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
          ? '登入失敗：電子郵件或密碼錯誤。'
          : '發生未知錯誤，請稍後再試。';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('[LoginPage] Google login error:', err);
      setError(`Google 登入失敗: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#E7F9E9] flex items-center justify-center px-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden">
        
        <div className="w-full md:w-1/2 px-10 py-10">
          
          <div className="flex items-center mb-8">
            <div className="relative w-10 h-10 mr-3 flex items-center justify-center">
              <img
                src="https://static.wixstatic.com/shapes/ec806c_c40de356f37b4dd6a49afac9e18b3bf5.svg"
                alt=""
                className="absolute inset-0 w-full h-full"
              />
              <img
                src="https://static.wixstatic.com/media/ec806c_e706428e2f4d41c1b58f889f8d0efbe8~mv2.png"
                alt="Goodi"
                className="relative w-8 h-8 object-contain"
              />
            </div>
            <span className="text-3xl font-bold text-[#0F8A3C]">Goodi</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSignUp ? '註冊新帳戶' : '登入 Goodi'}
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            {isSignUp ? '已經有帳戶了嗎？' : '還沒有帳戶嗎？'}{' '}
            <button
              type="button"
              onClick={handleToggleSignUp}
              className="text-[#2563EB] hover:underline font-semibold"
            >
              {isSignUp ? '馬上登入' : '註冊一個'}
            </button>
          </p>

          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">電子郵件</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                placeholder="請輸入密碼"
                required
              />
            </div>

            {error && <p className="text-sm text-red-500 text-center pt-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:bg-blue-300"
            >
              {loading ? '處理中...' : isSignUp ? '註冊' : '登入'}
            </button>
          </form>

          <div className="mt-6">
            <div className="flex items-center mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-3 text-xs text-gray-400">或</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-sm font-medium hover:bg-gray-50"
            >
              <img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_24dp.png" alt="Google Logo" className="w-5 h-5" />
              <span>使用 Google 帳戶登入</span>
            </button>
          </div>
        </div>
        
        <div className="hidden md:flex w-1/2 bg-[#FFF9E6] items-center justify-center flex-col px-10">
          <div className="w-48 h-48 flex items-center justify-center mb-6">
            <img
              src="https://static.wixstatic.com/shapes/ec806c_8c38f20492494671b8e7f75ca5e0b214.svg"
              alt="親子安全標誌"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl font-bold text-[#0F8A3C] mb-2">
            開啟孩子的成長之旅
          </h2>
          <p className="text-sm text-gray-700 text-center leading-relaxed max-w-sm">
            透過遊戲化的任務，建立好習慣，讓每一次進步都充滿樂趣！
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
