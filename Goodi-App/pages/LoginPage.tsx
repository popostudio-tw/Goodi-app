import React, { useState } from "react";
import { auth, googleProvider } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

interface LoginPageProps { }

const SocialButton: React.FC<{
  icon: string;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-center p-3 rounded-lg border border-gray-200 transition-colors bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
  >
    <img src={icon} alt="" className="w-6 h-6 mr-3" />
    <span className="font-semibold">{label}</span>
  </button>
);

const LoginPage: React.FC<LoginPageProps> = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Login] submit", { isSignUp, email });
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          alert("兩次輸入的密碼不一致！");
          return;
        }
        console.log("[Login] try SIGNUP with email:", email);
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log("[Login] SIGNUP success, uid =", cred.user.uid);
      } else {
        console.log("[Login] try SIGNIN with email:", email);
        const cred = await signInWithEmailAndPassword(auth, email, password);
        console.log("[Login] SIGNIN success, uid =", cred.user.uid);
      }
      // 不在這裡跳頁，交給 App.tsx 的 onAuthStateChanged 控制畫面
    } catch (error: any) {
      console.error("[Login] email/password ERROR", error);
      alert(`${isSignUp ? "註冊失敗" : "登入失敗"}: ${error.code || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      console.log("[Login] Starting Google popup login...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("[Login] Google login SUCCESS! User:", result.user.uid);
      console.log("[Login] Email:", result.user.email);
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
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-lime-50 to-green-100">
      <div className="max-w-4xl w-full mx-auto bg-white/60 backdrop-blur-md border border-white/50 rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        {/* Left Side: Form */}
        <div className="p-8 md:p-12">
          <div className="flex items-center mb-6">
            <img
              src="https://static.wixstatic.com/media/ec806c_e706428e2f4d41c1b58f889f8d0efbe8~mv2.png"
              alt="Goodi Logo"
              className="h-10 w-auto mr-2"
            />
            <span className="font-black text-3xl text-green-700">Goodi</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-800">
            {isSignUp ? "建立新帳戶" : "登入 Goodi"}
          </h1>
          <p className="text-gray-500 mt-2 mb-6">
            {isSignUp ? "已經有帳戶了？" : "還沒有帳戶嗎？"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 font-semibold hover:underline ml-1"
            >
              {isSignUp ? "登入" : "註冊一個"}
            </button>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                電子郵件
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                密碼
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入密碼"
                  className="w-full px-4 py-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {passwordVisible ? (
                    <img
                      src="https://api.iconify.design/solar/eye-closed-line-duotone.svg"
                      className="h-6 w-6"
                      alt="Hide password"
                    />
                  ) : (
                    <img
                      src="https://api.iconify.design/solar/eye-line-duotone.svg"
                      className="h-6 w-6"
                      alt="Show password"
                    />
                  )}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  確認密碼
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次輸入密碼"
                  className="w-full px-4 py-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:bg-blue-300 flex items-center justify-center"
            >
              {isLoading && (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {isLoading ? "處理中..." : isSignUp ? "註冊" : "登入"}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300/50"></div>
            <span className="mx-4 text-gray-400 font-semibold">或</span>
            <div className="flex-grow border-t border-gray-300/50"></div>
          </div>

          <SocialButton
            icon="https://api.iconify.design/flat-color-icons/google.svg"
            label="使用 Google 帳戶登入"
            onClick={handleGoogleLogin}
          />

          <div className="mt-8 text-center text-xs text-gray-500">
            <p>點擊上方按鈕，即表示您同意我們的服務條款及隱私權政策。</p>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700"
            >
              服務條款
            </a>
            <span className="mx-1">與</span>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700"
            >
              隱私權政策
            </a>
          </div>
        </div>

        {/* Right Side: Illustration */}
        <div className="hidden md:flex items-center justify-center bg-green-50/50 backdrop-blur-sm p-12">
          <div className="text-center">
            <img
              src="https://api.iconify.design/twemoji/children-crossing.svg"
              alt="Welcome illustration"
              className="w-64 h-64 mx-auto drop-shadow-lg"
            />
            <h2 className="text-2xl font-bold text-green-800 mt-6">
              開啟孩子的成長之旅
            </h2>
            <p className="text-green-700 mt-2">
              透過遊戲化的任務，建立好習慣，
              <br />
              讓每一次進步都充滿樂趣！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
