
import React from 'react';
import { ZhuyinMode } from '../types';

interface SettingsPageProps {
  currentMode: ZhuyinMode;
  onSetMode: (mode: ZhuyinMode) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ currentMode, onSetMode }) => {
  const options: { mode: ZhuyinMode; label: string; description: string }[] = [
    { mode: 'auto', label: '自動模式', description: '4-8 歲時會自動顯示注音' },
    { mode: 'on', label: '全開模式', description: '不論年齡，一律顯示注音' },
    { mode: 'off', label: '關閉模式', description: '不論年齡，一律隱藏注音' },
  ];

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-4 border border-white/50">
      <h3 className="font-bold text-lg mb-3 text-gray-700">注音顯示設定</h3>
      <div className="space-y-2">
        {options.map(({ mode, label, description }) => (
          <button
            key={mode}
            onClick={() => onSetMode(mode)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
              currentMode === mode
                ? 'bg-blue-50/50 border-blue-500 backdrop-blur-sm'
                : 'bg-white/50 border-white/60 hover:bg-blue-50/30 backdrop-blur-sm'
            }`}
          >
            <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 flex items-center justify-center ${currentMode === mode ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
                    {currentMode === mode && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
                <div>
                    <p className={`font-semibold ${currentMode === mode ? 'text-blue-700' : 'text-gray-800'}`}>{label}</p>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
