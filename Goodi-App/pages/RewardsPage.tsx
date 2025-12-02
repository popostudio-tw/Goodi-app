
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { useUserData } from '../UserContext';

const GachaponPage: React.FC = () => {
  const { userData, handlePlayGachapon } = useUserData();
  const { gachaponTickets } = userData;
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState<InventoryItem | null>(null);
  const canPlay = gachaponTickets > 0;

  const handlePlay = () => {
    if (!canPlay || isSpinning) return;
    setIsSpinning(true);
    setPrize(null);
    // Video plays, onEnded calls completion
  };

  const handleVideoEnded = () => {
      const wonPrize = handlePlayGachapon();
      setPrize(wonPrize);
      setIsSpinning(false);
  };
  
  return (
    <div className="animate-fade-in h-full flex flex-col justify-start items-center p-2 pt-2 overflow-hidden">
        <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-4 w-full max-w-4xl flex flex-col md:flex-row gap-4 items-center justify-center border border-white/40 max-h-[calc(100vh-100px)]">
            
            {/* Left: Gachapon Machine */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full relative">
                 <div className="relative w-full max-w-[240px] aspect-square flex items-center justify-center">
                    <div className="absolute inset-0 bg-sky-200 rounded-full blur-3xl opacity-30"></div>
                    {isSpinning ? (
                        <video 
                            src="https://video.wixstatic.com/video/ec806c_0aad9d677de244edbf8c44d351133f58/720p/mp4/file.mp4"
                            className="h-full w-full object-cover rounded-3xl shadow-inner border-4 border-white/50 relative z-10"
                            autoPlay
                            playsInline
                            onEnded={handleVideoEnded}
                        />
                    ) : (
                        <img 
                            src="https://static.wixstatic.com/media/ec806c_e706428e2f4d41c1b58f889f8d0efbe8~mv2.png" 
                            alt="Gachapon Machine" 
                            className="h-full w-auto object-contain transition-transform duration-300 relative z-10 drop-shadow-xl hover:scale-105" 
                        />
                    )}
                 </div>
                 
                 <div className="mt-4 w-full max-w-xs flex items-center gap-2 relative z-10">
                    <button
                        onClick={handlePlay}
                        disabled={!canPlay || isSpinning}
                        className="flex-grow bg-pink-500 text-white font-black py-3 px-4 rounded-2xl hover:bg-pink-600 transition-all duration-300 shadow-lg text-lg disabled:bg-gray-300 disabled:shadow-inner flex items-center justify-center gap-2 active:scale-95 border-b-4 border-pink-700"
                    >
                         {isSpinning ? (
                             <span className="animate-pulse">轉動中...</span>
                         ) : (
                             <>
                                <img src="https://api.iconify.design/twemoji/ticket.svg" className="w-6 h-6" />
                                <span>轉一次</span>
                             </>
                         )}
                    </button>
                    <div className="bg-white/80 px-3 py-2 rounded-2xl font-bold whitespace-nowrap border border-white/60 shadow-md flex flex-col items-center min-w-[80px]">
                        <span className="text-[10px] text-gray-500">持有券</span>
                        <span className="text-pink-600 text-lg leading-none">{gachaponTickets}</span>
                    </div>
                 </div>
            </div>

            {/* Right: Prize Display - Balanced */}
            <div className="flex-1 w-full flex flex-col justify-center h-full min-h-0 max-w-xs mx-auto md:max-w-none">
                <div className="relative flex-grow min-h-[200px] flex flex-col items-center justify-center bg-gradient-to-br from-white/60 to-blue-50/60 rounded-3xl border-4 border-dashed border-sky-200 shadow-inner p-6">
                    {prize ? (
                    <div className="prize-active flex flex-col items-center text-center">
                        <div className="relative mb-3">
                            <div className="absolute inset-0 bg-yellow-300 rounded-full blur-2xl opacity-60 animate-pulse"></div>
                            <img src={prize.description} alt={prize.name} className="w-28 h-28 relative z-10 drop-shadow-lg object-contain animate-bounce" />
                        </div>
                        <p className="font-bold text-lg text-gray-500 mb-0.5">恭喜獲得</p>
                        <p className="font-black text-3xl text-blue-600 break-words leading-tight drop-shadow-sm">{prize.name}</p>
                    </div>
                    ) : (
                    <div className="text-center text-gray-400 flex flex-col items-center opacity-60">
                        <img src="https://api.iconify.design/twemoji/wrapped-gift.svg" alt="獎品區域" className="w-20 h-20 mb-3 opacity-60 grayscale" />
                        <p className="text-lg font-bold">扭蛋會掉出什麼呢？</p>
                        <p className="text-xs">每次都有驚喜！</p>
                    </div>
                    )}
                </div>

                <div className="mt-4 bg-blue-100/50 rounded-2xl p-3 w-full border border-blue-200/50 text-center backdrop-blur-sm">
                    <p className="text-gray-700 font-medium text-sm">
                        沒券了嗎？去 <span className="font-bold text-blue-600 underline cursor-pointer hover:text-blue-800">商店</span> 用代幣買！
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default GachaponPage;
