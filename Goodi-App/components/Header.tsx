
import React from 'react';
import { useUserData } from '../UserContext';

interface HeaderProps {
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
    const { userData, isPointsAnimating } = useUserData();
    const { points, tokens, gachaponTickets, keyEvents } = userData;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const formattedDate = today.toLocaleDateString('sv').replace(/-/g, '/');
    
    const getDayOfWeek = (date: Date) => {
        const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        return days[date.getDay()];
    }
    const dayOfWeek = getDayOfWeek(today);

    const todayEvents = keyEvents.filter(e => e.date === todayStr);
    const tomorrowEvents = keyEvents.filter(e => e.date === tomorrowStr);

  return (
    <div className="flex justify-between items-center w-full gap-2 min-h-[5rem] sm:min-h-[6rem] h-auto py-2 mb-2">
        <button onClick={onLogoClick} className="flex items-center focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg p-1 transition-transform hover:scale-105 flex-shrink-0">
           <img src="https://static.wixstatic.com/media/ec806c_e706428e2f4d41c1b58f889f8d0efbe8~mv2.png" alt="Goodi Logo" className="h-24 sm:h-28 w-auto object-contain"/>
        </button>
        
        <div className="flex-grow text-center px-1 min-w-0">
            <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 py-2 px-2 sm:px-4 rounded-md shadow-sm text-xs sm:text-base animate-fade-in inline-block w-full max-w-lg">
                <div className="font-bold flex flex-col items-center justify-center gap-1">
                   <span className="block mb-0.5">{formattedDate}，{dayOfWeek}</span>
                   
                   {todayEvents.length > 0 && (
                       <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1 flex-wrap justify-center w-fit">
                           <img src="https://api.iconify.design/solar/bell-bold.svg" className="w-3 h-3 animate-bounce" />
                           今日：{todayEvents.map(e => e.text).join('、')}
                       </span>
                   )}

                   {tomorrowEvents.length > 0 && (
                       <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1 flex-wrap justify-center w-fit mt-1">
                           <img src="https://api.iconify.design/solar/calendar-mark-bold.svg" className="w-3 h-3" />
                           明天：{tomorrowEvents.map(e => e.text).join('、')}
                       </span>
                   )}
                </div>
            </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 text-base flex-shrink-0">
            <div className={`flex items-center bg-yellow-400 text-yellow-900 rounded-full px-2 sm:px-4 py-2 font-bold shadow-sm ${isPointsAnimating ? 'points-bounce-animation' : ''}`}>
                <img src="https://api.iconify.design/twemoji/star.svg" alt="積分" className="h-6 w-6" /><span className="ml-1.5 hidden sm:inline">{points} 積分</span><span className="ml-1 sm:hidden">{points}</span>
            </div>
            <div className="flex items-center bg-purple-400 text-white rounded-full px-2 sm:px-4 py-2 font-bold shadow-sm">
                <img src="https://api.iconify.design/twemoji/coin.svg" alt="代幣" className="h-6 w-6" /><span className="ml-1.5 hidden sm:inline">{tokens} 代幣</span><span className="ml-1 sm:hidden">{tokens}</span>
            </div>
            <div className="flex items-center bg-blue-400 text-white rounded-full px-2 sm:px-4 py-2 font-bold shadow-sm">
                <img src="https://api.iconify.design/twemoji/ticket.svg" alt="扭蛋券" className="h-6 w-6" /><span className="ml-1.5 hidden sm:inline">{gachaponTickets} 扭蛋券</span><span className="ml-1 sm:hidden">{gachaponTickets}</span>
            </div>
        </div>
      </div>
  );
};

export default Header;
