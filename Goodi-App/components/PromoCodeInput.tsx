import React, { useState } from 'react';
import { PricingTier, SubscriptionType } from '../types';

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
    onApplyCode: (code: string, finalPrice: number, percentage: number) => void;
    currentPrice: number;
    pricingTier: PricingTier;
    subscriptionType: SubscriptionType;
}

const PromoCodeInput: React.FC<PromoCodeInputProps> = ({ onApplyCode, currentPrice, pricingTier, subscriptionType }) => {
    const [promoCode, setPromoCode] = useState('');
    const [error, setError] = useState('');

    const handleApplyCode = () => {
        // In a real application, you would validate the promo code against a backend service.
        // For this example, we'll use a mock validation.
        if (promoCode.toUpperCase() === 'WELCOME30') {
            const discountPercentage = 30;
            const finalPrice = currentPrice * (1 - discountPercentage / 100);
            onApplyCode(promoCode.toUpperCase(), finalPrice, discountPercentage);
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
