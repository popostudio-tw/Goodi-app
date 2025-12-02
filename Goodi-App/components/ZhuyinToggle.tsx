import React from 'react';

interface ZhuyinToggleProps {
    isZhuyinVisible: boolean;
    onToggle: () => void;
}

const ZhuyinToggle: React.FC<ZhuyinToggleProps> = ({ isZhuyinVisible, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            className="absolute top-0 right-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label={isZhuyinVisible ? "隱藏注音" : "顯示注音"}
        >
            <span className="font-bold text-lg">{isZhuyinVisible ? '文' : 'ㄅ'}</span>
        </button>
    );
};

export default ZhuyinToggle;