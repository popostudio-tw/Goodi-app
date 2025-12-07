
import React, { useState } from 'react';
import { PricingTier } from '../types';

export interface PromoCodeDiscount {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    validUntil: Date;
    maxUses?: number;
    applicablePlans: PricingTier[];
    description: string;
}

interface PromoCodeInputProps {
    onApplyCode: (code: string, discount: PromoCodeDiscount) => void;
    currentPrice: number;
}

const PromoCodeInput: React.FC<PromoCodeInputProps> = ({ onApplyCode, currentPrice }) => {
    const [promoCode, setPromoCode] = useState('');
    const [error, setError] = useState('');

    const handleApplyCode = () => {
        // In a real application, you would validate the promo code against a backend service.
        // For this example, we'll use a mock validation.
        if (promoCode.toUpperCase() === 'WELCOME30') {
            const discount: PromoCodeDiscount = {
                code: 'WELCOME30',
                discountType: 'percentage',
                discountValue: 30,
                validUntil: new Date('2025-12-31'),
                applicablePlans: ['advanced', 'premium'],
                description: '首次購買享 30% 折扣，僅限新用戶'
            };
            onApplyCode(promoCode, discount);
            setError('');
        } else {
            setError('無效的促銷碼');
        }
    };

    return (
        <div className="my-4">
            <div className="flex gap-2">
                <input 
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="輸入促銷碼"
                    className="flex-grow p-2 border rounded-lg"
                />
                <button 
                    onClick={handleApplyCode}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    套用
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
};

export default PromoCodeInput;
