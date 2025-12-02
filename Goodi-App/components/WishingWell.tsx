import React, { useState } from 'react';

interface WishingWellProps {
    onMakeWish: (wish: string) => boolean;
    userPoints: number;
}

const WISHING_COST = 100;

const WishingWell: React.FC<WishingWellProps> = ({ onMakeWish, userPoints }) => {
    const [wish, setWish] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const canAfford = userPoints >= WISHING_COST;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (wish.trim() === '' || !canAfford) return;
        
        if(onMakeWish(wish.trim())) {
            setSubmitted(true);
            setWish('');
            setTimeout(() => {
                setSubmitted(false);
            }, 2500);
        }
    };

    return (
        <div className="bg-gradient-to-br from-cyan-100 to-blue-200 rounded-2xl shadow-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-cyan-800 mb-2 flex items-center justify-center">
                <span>神奇許願池</span>
                <img src="https://api.iconify.design/twemoji/sparkles.svg" alt="sparkles" className="w-6 h-6 ml-2" />
            </h3>
            <div className="text-gray-600 mb-4">
                <span>有什麼特別想要的獎勵嗎？</span>
                <br/>
                <span>在這裡許個願，爸爸媽媽可能會看到喔！</span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={wish}
                    onChange={(e) => setWish(e.target.value)}
                    placeholder="我想許願..."
                    className="w-full h-24 p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-cyan-400 resize-none bg-white/70"
                    required
                />
                <button
                    type="submit"
                    disabled={submitted || !wish.trim() || !canAfford}
                    className="w-full bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-600 transition-all duration-300 shadow-md disabled:bg-gray-400 disabled:shadow-inner"
                >
                    {submitted ? '願望已送出！' : `花費 ${WISHING_COST} 🌟 送出願望`}
                </button>
            </form>
        </div>
    );
};

export default WishingWell;