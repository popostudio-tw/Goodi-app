
import React, { useState } from 'react';
import { useUserData } from '../UserContext';

const OnboardingModal: React.FC = () => {
    const { updateUserData, addToast } = useUserData();
    const [nickname, setNickname] = useState('');
    const [age, setAge] = useState<string>('');
    const [referralCode, setReferralCode] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (nickname.trim()) {
            let trialEndDate: string | null = null;
            if (referralCode.trim()) {
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 7);
                trialEndDate = endDate.toISOString();
                addToast(`推薦碼已使用！您獲得一週進階方案試用！`, 'celebrate');
            }
            updateUserData({ 
                userProfile: { nickname: nickname.trim(), age: age ? parseInt(age, 10) : null, onboardingComplete: true },
                planTrialEndDate: trialEndDate,
             });
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-cover bg-center bg-no-repeat overflow-y-auto"
            style={{ backgroundImage: "url('https://static.wixstatic.com/media/ec806c_888344691b094d4f9138c087a346357b~mv2.jpg')" }}
        >
            <div className="mt-8 sm:mt-12 bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center animate-fade-in transform transition-transform">
                <img src="https://static.wixstatic.com/media/ec806c_e706428e2f4d41c1b58f889f8d0efbe8~mv2.png" alt="Goodi Mascot" className="w-32 h-32 mx-auto mb-4 drop-shadow-xl filter brightness-110"/>
                <h1 className="text-2xl font-black text-slate-800 mb-2 drop-shadow-md">歡迎來到 Goodi！</h1>
                <p className="text-slate-900 font-bold mb-6 drop-shadow-sm">在開始之前，請先告訴我你的名字吧！</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="nickname" className="block text-center text-sm font-black text-slate-800 mb-1 drop-shadow-sm">我該怎麼稱呼你呢?</label>
                        <input type="text" id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-400 transition-colors placeholder-slate-500 font-bold text-slate-900 text-center" placeholder="例如：小明" required />
                    </div>
                    <div>
                        <label htmlFor="age" className="block text-center text-sm font-black text-slate-800 mb-1 drop-shadow-sm">你的年齡 (必填)，為了最佳體驗</label>
                        <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-400 transition-colors placeholder-slate-500 font-bold text-slate-900 text-center" placeholder="例如：8" min="1" max="18" required />
                    </div>
                     <div>
                        <label htmlFor="referral" className="block text-center text-sm font-black text-slate-800 mb-1 drop-shadow-sm">推薦碼 (選填)</label>
                        <input type="text" id="referral" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-400 transition-colors placeholder-slate-500 font-bold text-slate-900 text-center" placeholder="朋友的推薦碼" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600/90 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg ring-2 ring-white/30 backdrop-blur-sm mt-4">
                        歡迎一起進入 Goodi 學園!
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnboardingModal;
