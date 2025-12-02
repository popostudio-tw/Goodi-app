import React, { useState } from 'react';
import { Reward } from '../types';
import { useUserData } from '../UserContext';

const RewardCard: React.FC<{ reward: Reward; onBuy: (reward: Reward) => void; }> = ({ reward, onBuy }) => {
  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-lg p-4 flex flex-col text-center transition-transform hover:-translate-y-1 border border-white/50">
      <div className="h-16 flex justify-center items-center mb-2">
        <img src={reward.icon} alt={reward.name} className="h-14 w-14 object-contain" />
      </div>
      <h4 className="font-bold text-lg flex-grow text-slate-800">{reward.name}</h4>
      <p className="text-sm text-gray-500 mb-3">{reward.description}</p>
      <button 
        onClick={() => onBuy(reward)}
        className="mt-auto w-full bg-green-500 text-white font-bold py-2 px-3 rounded-lg text-base hover:bg-green-600 transition-colors shadow-md active:scale-95"
      >
        購買 {reward.cost} 🪙
      </button>
    </div>
  );
};

const RewardShopPage: React.FC = () => {
  const { userData, handleExchange, handleBuyReward, handleMakeWish } = useUserData();
  const { points, shopRewards } = userData;
  
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [wishText, setWishText] = useState('');

  const handleLocalExchange = () => {
    const pointsToSpend = parseInt(exchangeAmount, 10);
    if (!isNaN(pointsToSpend) && pointsToSpend > 0 && pointsToSpend % 10 === 0) {
        if(handleExchange(pointsToSpend, pointsToSpend / 10)) {
            setExchangeAmount('');
        }
    } else {
        alert('請輸入 10 的倍數！');
    }
  };

  const handleWishSubmit = () => {
      if (wishText.trim()) {
          if (handleMakeWish(wishText.trim())) {
              setWishText('');
          }
      }
  };

  return (
    <div className="animate-fade-in pb-4 h-full flex flex-col overflow-y-auto pr-1 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            
            {/* Left Column: Exchange Center & Wishing Well (~1/3) */}
            <div className="lg:w-1/3 flex flex-col gap-6 shrink-0">
                {/* Exchange Center */}
                <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white/50 flex flex-col items-center text-center">
                    <div className="bg-blue-100 p-3 rounded-full mb-3">
                        <img src="https://api.iconify.design/twemoji/bank.svg" className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-blue-800 mb-2">積分兌換</h3>
                    <p className="text-gray-600 text-sm mb-4">
                        10 積分 = <span className="font-bold text-yellow-600">1 代幣</span>
                    </p>
                    
                    <div className="w-full bg-blue-50 p-4 rounded-2xl mb-4 border border-blue-100">
                         <div className="text-sm text-gray-500 mb-1">目前可用</div>
                         <div className="text-3xl font-black text-blue-600">{points} <span className="text-base font-normal">積分</span></div>
                    </div>

                    <div className="w-full space-y-3">
                        <input
                            type="number"
                            value={exchangeAmount}
                            onChange={(e) => setExchangeAmount(e.target.value)}
                            placeholder="輸入積分 (10的倍數)"
                            className="w-full p-3 border border-gray-300 bg-white rounded-xl text-lg focus:ring-2 focus:ring-blue-400 transition-all text-center shadow-inner"
                            step="10"
                            min="10"
                        />
                        <button
                            onClick={handleLocalExchange}
                            className="w-full bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors text-lg shadow-lg active:scale-95"
                        >
                            立即兌換
                        </button>
                    </div>
                </div>

                {/* Wishing Well - Optimized UI */}
                <div className="bg-gradient-to-br from-purple-100/90 to-indigo-100/90 rounded-3xl shadow-xl p-6 border border-purple-200 flex-grow flex flex-col items-center text-center backdrop-blur-sm">
                     <div className="bg-white/50 p-3 rounded-full mb-3 shadow-sm">
                         <img src="https://api.iconify.design/twemoji/shooting-star.svg" alt="" className="w-8 h-8" />
                     </div>
                     <h3 className="text-xl font-black text-purple-700 mb-2">
                         神奇許願池
                     </h3>
                     <p className="text-purple-800/80 text-sm font-medium mb-4 leading-relaxed">
                         有什麼想要的禮物嗎？<br/>
                         花費 <span className="font-bold text-red-500 bg-white/50 px-1 rounded">50 代幣</span> 許個願，<br/>
                         願望可能成真喔！
                     </p>
                     
                     <div className="w-full flex flex-col gap-3 mt-auto">
                         <textarea
                            value={wishText} 
                            onChange={(e) => setWishText(e.target.value)}
                            placeholder="我想要..." 
                            className="w-full p-3 rounded-xl border border-purple-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-300 resize-none h-24 shadow-inner text-purple-900 placeholder-purple-300"
                         />
                         <button 
                            onClick={handleWishSubmit}
                            disabled={!wishText.trim()}
                            className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-all active:scale-95"
                         >
                             投幣許願 ✨
                         </button>
                     </div>
                </div>
            </div>

            {/* Right Column: Rewards Grid (~2/3) */}
            <div className="lg:w-2/3 bg-white/60 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white/50 flex flex-col h-fit min-h-full">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-green-800 flex items-center gap-2">
                        <img src="https://api.iconify.design/twemoji/convenience-store.svg" className="w-8 h-8"/>
                        獎勵商店
                    </h3>
                    <div className="bg-white/50 px-3 py-1 rounded-lg text-sm font-bold text-green-700 border border-green-200">
                        項目: {shopRewards.length}
                    </div>
                </div>
                
                {/* No internal scrolling, rely on page scroll */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {shopRewards.map(reward => (
                    <RewardCard key={reward.id} reward={reward} onBuy={handleBuyReward} />
                  ))}
                  {shopRewards.length === 0 && (
                      <div className="col-span-full text-center py-10 text-gray-400">
                          目前商店沒有商品喔！
                      </div>
                  )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default RewardShopPage;