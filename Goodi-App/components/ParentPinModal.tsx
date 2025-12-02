
import React, { useState, useRef, useEffect } from 'react';
import { useUserData } from '../UserContext';

interface ParentPinModalProps {
    onClose: () => void;
    onCorrectPin: () => void;
}

const ParentPinModal: React.FC<ParentPinModalProps> = ({ onClose, onCorrectPin }) => {
    const { userData, updateUserData } = useUserData();
    const { parentPin } = userData;
    const [pin, setPin] = useState(['', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
    const [isConfirming, setIsConfirming] = useState(false);
    const [error, setError] = useState('');
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    const isSettingMode = !parentPin;
    const title = isSettingMode ? '首次家長設定' : '請輸入家長密碼';
    const currentPinArray = isConfirming ? confirmPin : pin;
    const setCurrentPinArray = isConfirming ? setConfirmPin : setPin;

    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, [isConfirming]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value;
        if (/^[0-9]$/.test(value) || value === '') {
            const newPin = [...currentPinArray];
            newPin[index] = value;
            setCurrentPinArray(newPin);
            if (value !== '' && index < 3) {
                inputsRef.current[index + 1]?.focus();
            }
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const enteredPin = currentPinArray.join('');
        if (enteredPin.length !== 4) { setError('請輸入完整的 4 位數字'); return; }

        if (isSettingMode) {
            if (isConfirming) {
                if (pin.join('') === enteredPin) {
                    updateUserData({ parentPin: enteredPin });
                    onCorrectPin();
                } else {
                    setError('兩次輸入的密碼不一致，請重新設定');
                    setIsConfirming(false);
                    setPin(['', '', '', '']);
                    setConfirmPin(['', '', '', '']);
                }
            } else {
                setIsConfirming(true);
            }
        } else {
            if (enteredPin === parentPin) onCorrectPin(); else {
                setError('密碼錯誤，請再試一次');
                setPin(['', '', '', '']);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-white/50" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-black text-gray-800 text-center mb-2">{title}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-center space-x-3 my-4">
                        {currentPinArray.map((digit, index) => (
                            <input 
                                key={index} 
                                ref={el => { inputsRef.current[index] = el; }} 
                                type="password" 
                                inputMode="numeric" 
                                maxLength={1} 
                                value={digit} 
                                onChange={(e) => handleInputChange(e, index)} 
                                className="w-14 h-16 text-center text-3xl font-bold border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" 
                                required 
                            />
                        ))}
                    </div>
                    {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                    <div className="space-y-3 pt-2">
                        <button type="submit" className="w-full bg-red-500 text-white font-bold py-3.5 rounded-lg shadow-md hover:bg-red-600 transition-colors">{isSettingMode ? (isConfirming ? '設定並登入' : '下一步') : '登入'}</button>
                        <button type="button" onClick={onClose} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg transition-colors">取消</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ParentPinModal;
