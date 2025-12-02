import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
    toast: ToastMessage | null;
}

const toastConfig = {
    success: {
        icon: '👍',
        bg: 'bg-green-500',
    },
    celebrate: {
        icon: '🎉',
        bg: 'bg-yellow-500',
    }
}

const Toast: React.FC<ToastProps> = ({ toast }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (toast) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, 2500); // Animation out duration is 0.5s, so this gives 2.5s visible time
            return () => clearTimeout(timer);
        }
    }, [toast]);

    if (!toast) return null;
    
    const { type, message } = toast;
    const { icon, bg } = toastConfig[type];

    return (
        <div 
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center p-4 rounded-lg text-white shadow-lg ${bg} ${visible ? 'toast-in' : 'toast-out'}`}
            role="alert"
        >
            <div className="text-xl mr-3">{icon}</div>
            <span className="font-semibold">{message}</span>
        </div>
    );
};

export default Toast;
