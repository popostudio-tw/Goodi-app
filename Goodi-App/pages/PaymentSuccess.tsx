import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';

export const PaymentSuccess = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            navigate('/');
            return;
        }

        // 實時監聽 membership 狀態
        const membershipRef = doc(db, `users/${currentUser.uid}/membership/current`);

        const unsubscribe = onSnapshot(membershipRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data.plan === 'premium') {
                    setIsPremium(true);
                    setChecking(false);
                    // 3 秒後跳轉到 Premium 頁面
                    setTimeout(() => navigate('/premium?welcome=true'), 3000);
                }
            }
        }, (error) => {
            console.error('Error listening to membership:', error);
            setChecking(false);
        });

        // 超時處理：10 秒後仍未更新則顯示提示
        const timeout = setTimeout(() => {
            if (checking) {
                setChecking(false);
            }
        }, 10000);

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, [currentUser, navigate, checking]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-lime-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
                {checking ? (
                    <>
                        <div className="text-6xl mb-4 animate-pulse">⏳</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">處理中...</h2>
                        <p className="text-gray-600 mb-4">
                            正在確認您的付款，請稍候
                        </p>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-500 to-lime-500 animate-progress"></div>
                        </div>
                    </>
                ) : isPremium ? (
                    <>
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-green-600 mb-2">升級成功！</h2>
                        <p className="text-gray-600 mb-4">
                            恭喜您成為 Premium 會員
                        </p>
                        <p className="text-sm text-gray-500">即將跳轉...</p>
                    </>
                ) : (
                    <>
                        <div className="text-6xl mb-4">⏱️</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">處理需要一點時間</h2>
                        <p className="text-gray-600 mb-4">
                            您的付款正在處理中，通常需要 1-2 分鐘
                        </p>
                        <button
                            onClick={() => navigate('/premium')}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
                        >
                            前往 Premium 頁面
                        </button>
                    </>
                )}
            </div>

            <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default PaymentSuccess;
