import React from 'react';
import { ActiveParentChildTimeSession } from '../types';

interface ParentChildTimePageProps {
  session: ActiveParentChildTimeSession | null;
  timeLeft: number;
  isActive: boolean;
  onToggle: () => void;
  onReset: () => void;
  onComplete: () => void;
  onExit: () => void;
}

const ParentChildTimePage: React.FC<ParentChildTimePageProps> = ({ session, timeLeft, isActive, onToggle, onReset, onComplete, onExit }) => {
  if (!session) {
    return <div className="text-center p-8"><p>沒有進行中的親子時光。</p><button onClick={onExit} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">返回背包</button></div>;
  }

  const { itemName, itemIcon, totalDurationSeconds } = session;
  const progress = totalDurationSeconds > 0 ? ((totalDurationSeconds - timeLeft) / totalDurationSeconds) * 100 : 0;
  const isCompleted = timeLeft === 0;
  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto text-center">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-10">
        <div className="flex flex-col items-center">
          <img src={itemIcon} alt={itemName} className="w-24 h-24 mb-4" />
          <h2 className="text-3xl font-bold text-gray-800">{itemName}</h2>
          <p className="text-gray-500 mt-1">親子專屬時光</p>
        </div>
        <div className="relative w-80 h-80 my-8 mx-auto flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle className="text-gray-200" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
            <circle className="text-pink-500" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (progress / 100) * 283} strokeLinecap="round" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
          </svg>
          <div className="absolute">{isCompleted ? <img src="https://api.iconify.design/twemoji/party-popper.svg" alt="完成！" className="w-24 h-24" /> : <span className="text-6xl font-bold">{formatTime(timeLeft)}</span>}</div>
        </div>
        {isCompleted ? (
          <div className="space-y-4">
            <h3 className="text-3xl font-bold text-green-600">太棒了！完成了！</h3>
            <button onClick={onComplete} className="w-full bg-green-500 text-white font-bold py-4 rounded-xl text-xl shadow-lg">完成並領取獎勵</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <button onClick={onToggle} className={`w-40 py-4 rounded-xl font-bold text-white text-xl shadow-lg ${isActive ? 'bg-orange-500' : 'bg-teal-500'}`}>{isActive ? '暫停' : '開始'}</button>
              <button onClick={onReset} className="py-4 px-6 rounded-xl font-bold bg-gray-200">重置</button>
            </div>
            <button onClick={onExit} className="w-full bg-transparent text-gray-500 font-medium py-3">返回背包</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentChildTimePage;
