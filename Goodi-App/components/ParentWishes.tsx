
import React from 'react';

interface ParentWishesProps {
    wishes: string[];
    onConvert: (wish: string) => void;
}

const ParentWishes: React.FC<ParentWishesProps> = ({ wishes, onConvert }) => {
    return (
        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-4 border border-white/50">
            <h3 className="font-bold text-lg mb-3 text-gray-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                孩子的願望
            </h3>
            {wishes.length > 0 ? (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {wishes.map((wish, index) => (
                        <div key={index} className="bg-yellow-50/60 backdrop-blur-sm p-3 rounded-lg text-yellow-800 border border-yellow-200/60 flex justify-between items-center gap-2">
                            <p className="text-sm flex-grow">"{wish}"</p>
                            <button 
                                onClick={() => onConvert(wish)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap transition-colors flex items-center gap-1"
                                title="將此願望上架到獎勵商店"
                            >
                                <img src="https://api.iconify.design/solar/shop-bold.svg" className="w-3.5 h-3.5 invert" />
                                上架
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500 py-6">
                    <p>孩子還沒有許下任何願望。</p>
                </div>
            )}
        </div>
    );
};

export default ParentWishes;
