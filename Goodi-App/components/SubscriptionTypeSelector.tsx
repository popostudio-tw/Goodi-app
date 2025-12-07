
import React from 'react';
import { PricingTier, SubscriptionType } from '../types';

interface SubscriptionTypeSelectorProps {
    plan: PricingTier; // 'advanced' | 'premium'
    monthlyPrice: number;
    lifetimePrice: number;
    onSelect: (type: 'monthly' | 'lifetime') => void;
}

const SubscriptionTypeSelector: React.FC<SubscriptionTypeSelectorProps> = ({ plan, monthlyPrice, lifetimePrice, onSelect }) => {
    return (
        <div className="my-4 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold text-lg mb-2 text-center">選擇您的訂閱方式</h4>
            <div className="flex justify-center gap-4">
                <button 
                    onClick={() => onSelect('monthly')}
                    className="p-4 border rounded-lg w-1/2 text-center transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <p className="text-xl font-bold">月費方案</p>
                    <p className="text-lg">NT$ {monthlyPrice} /月</p>
                </button>
                <button 
                    onClick={() => onSelect('lifetime')}
                    className="p-4 border rounded-lg w-1/2 text-center transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <p className="text-xl font-bold">買斷方案</p>
                    <p className="text-lg">NT$ {lifetimePrice}</p>
                    <p className="text-xs text-gray-500 mt-1">需自備 Gemini API Key</p>
                </button>
            </div>
        </div>
    );
};

export default SubscriptionTypeSelector;
