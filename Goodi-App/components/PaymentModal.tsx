
import React, { useState } from 'react';
import { Plan } from '../types';

interface PaymentModalProps {
    plan: Plan;
    onConfirm: () => void;
    onCancel: () => void;
}

const planDetails = {
    paid199: { name: '小幫手版', price: 'NT$ 199 (一次性)' },
    paid499: { name: '全功能版', price: 'NT$ 499 (一次性)' },
    free: { name: '', price: '' }
};

const PaymentModal: React.FC<PaymentModalProps> = ({ plan, onConfirm, onCancel }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const details = planDetails[plan];

    const handleConfirm = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
            setTimeout(() => {
                onConfirm();
            }, 1500);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-2xl p-6 max-w-sm w-full transform transition-all animate-fade-in scale-95 border border-white/50">
                {isSuccess ? (
                    <div className="text-center py-8">
                         <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-gray-800 mt-4">升級成功！</h2>
                        <p className="text-gray-600 mt-2">已為你解鎖新功能！</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl font-bold text-gray-800 text-center mb-2">確認購買</h2>
                        <div className="bg-gray-50/50 rounded-lg p-4 my-4 text-center border border-gray-100">
                            <p className="text-gray-600">你選擇的方案</p>
                            <p className="text-2xl font-bold text-blue-600">{details.name}</p>
                            <p className="font-semibold text-gray-700">{details.price}</p>
                        </div>
                        <p className="text-xs text-gray-500 text-center mb-4">
                            這是一個模擬的付款流程，點擊確認後將直接為您升級方案。
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={handleConfirm}
                                disabled={isProcessing}
                                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center disabled:bg-blue-400"
                            >
                                {isProcessing && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                {isProcessing ? '處理中...' : '確認付款'}
                            </button>
                            <button
                                onClick={onCancel}
                                disabled={isProcessing}
                                className="w-full bg-transparent text-gray-600 font-bold py-2 px-4 rounded-lg hover:bg-gray-100/50 transition-colors"
                            >
                                取消
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentModal;
