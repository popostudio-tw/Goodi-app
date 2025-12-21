<<<<<<< HEAD
import React, { useState } from "react";
import { auth, googleProvider } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

interface LoginPageProps { }
=======

import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase';
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade

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
    console.log(
      '[LoginPage] starting email auth using projectId =',
      auth.app.options.projectId
    );
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        console.log('[LoginPage] sign up success:', cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        console.log('[LoginPage] sign in success:', cred.user);
      }
    } catch (err: any) {
      console.error('[LoginPage] email auth error:', err);
      setError(err.message.includes('auth/invalid-credential') 
        ? '登入失敗：電子郵件或密碼錯誤。'
        : `發生錯誤： ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    console.log(
      '[LoginPage] starting Google sign-in using projectId =',
      auth.app.options.projectId
    );
    try {
<<<<<<< HEAD
      console.log("[Login] Starting Google popup login...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("[Login] Google login SUCCESS! User:", result.user.uid);
      console.log("[Login] Email:", result.user.email);

      // 📊 追蹤登入事件
      const { trackLogin, trackSignUp } = await import('../utils/analytics');
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      if (isNewUser) {
        trackSignUp('google');
      } else {
        trackLogin('google');
      }

      // AuthContext will detect the user and App.tsx will redirect
    } catch (error: any) {
      console.error("[Login] Google login ERROR:", error);
      console.error("[Login] Error code:", error.code);
      console.error("[Login] Error message:", error.message);

      let errorMessage = error.message;
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "登入視窗被關閉";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "瀏覽器封鎖了彈出視窗，請允許彈出視窗後再試";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "登入已取消";
      }

      alert(`Google 登入失敗: ${errorMessage}`);
      setIsLoading(false);
=======
      const cred = await signInWithPopup(auth, googleProvider);
      console.log('[LoginPage] Google sign in success:', cred.user);
    } catch (err: any) {
      console.error('[LoginPage] Google login error:', err);
      setError(`Google 登入失敗: ${err.message}`);
    } finally {
      setLoading(false);
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] font-sans">
      <div className="w-full max-w-5xl mx-4 bg-white/90 rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden">
        {/* 左側：登入/註冊表單 */}
        <div className="flex-1 px-8 py-10 md:px-10 md:py-12 flex flex-col">
          {/* Logo + 標題 */}
          <div className="flex items-center gap-3 mb-8">
            <img
              src="https://static.wixstatic.com/media/ec806c_e706428e2f4d41c1b58f889f8d0efbe8~mv2.png"
              alt="Goodi"
              className="h-10 w-10 rounded-xl shadow-md object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isSignUp ? '註冊 Goodi 帳戶' : '登入 Goodi'}
              </h1>
              <p className="text-sm text-slate-500">
                {isSignUp ? '已經有帳戶了嗎？' : '還沒有帳戶嗎？'}{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(''); // 切換模式時清除錯誤
                  }}
                >
                  {isSignUp ? '馬上登入' : '註冊一個'}
                </button>
              </p>
            </div>
          </div>

          {/* 表單本體 */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">電子郵件</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
                placeholder="請輸入密碼"
                required
              />
            </div>

            {/* 錯誤訊息 */}
            {error && (
              <p className="text-sm text-red-500">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? '處理中…' : (isSignUp ? '註冊' : '登入')}
            </button>
          </form>

          {/* Google 登入 */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">或</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-slate-300 rounded-xl py-3 bg-white hover:bg-slate-50 transition-colors disabled:bg-slate-100"
            >
              <img src="https://static.wixstatic.com/shapes/ec806c_c40de356f37b4dd6a49afac9e18b3bf5.svg" alt="Google" className="w-5 h-5"/>
              <span className="text-sm font-semibold text-slate-700">
                使用 Google 帳戶登入
              </span>
            </button>
          </div>
        </div>

        {/* 右側：形象區 */}
        <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#FFFDE7] to-[#FFF8E1] p-10">
          <div className="w-48 h-48 rounded-3xl bg-white shadow-lg flex items-center justify-center">
            <img
              src="https://static.wixstatic.com/shapes/ec806c_8c38f20492494671b8e7f75ca5e0b214.svg"
              alt="親子安全標誌"
              className="w-36 h-36 object-contain"
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              開啟孩子的成長之旅
            </h2>
            <p className="text-sm text-slate-600 max-w-xs mx-auto">
              透過遊戲化的任務，建立好習慣，
              讓每一次進步都充滿樂趣！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
