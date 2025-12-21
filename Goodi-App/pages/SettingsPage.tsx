
import React from 'react';
import { ZhuyinMode, Plan } from '../types';
import { getPlanDisplayName, isLifetimePlan, hasPremiumAccess } from '../utils/planUtils';
import GeminiApiKeyManager from '../components/GeminiApiKeyManager';

interface SettingsPageProps {
  // Zhuyin mode settings
  currentZhuyinMode: ZhuyinMode;
  onSetZhuyinMode: (mode: ZhuyinMode) => void;

  // Subscription and plan details
  userPlan: Plan;
  purchaseDate?: string; // e.g., "2025-12-03"
  daysLeft?: number; // e.g., 365

  // Gemini API Key settings (for lifetime premium users)
  geminiApiKey?: string;
  onSaveApiKey?: (key: string) => void;
  onValidateApiKey?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  currentZhuyinMode,
  onSetZhuyinMode,
  userPlan,
  purchaseDate,
  daysLeft,
  geminiApiKey,
  onSaveApiKey,
  onValidateApiKey
}) => {
  const zhuyinOptions: { mode: ZhuyinMode; label: string; description: string }[] = [
    { mode: 'auto', label: '自動模式', description: '4-8 歲時會自動顯示注音' },
    { mode: 'on', label: '全開模式', description: '不論年齡，一律顯示注音' },
    { mode: 'off', label: '關閉模式', description: '不論年齡，一律隱藏注音' },
  ];

  const needsApiKey = isLifetimePlan(userPlan) && hasPremiumAccess(userPlan);

  return (
    <div className="space-y-6 p-1">
      {/* 注音顯示設定 */}
      <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-4 border border-white/50">
        <h3 className="font-bold text-lg mb-3 text-gray-700">注音顯示設定</h3>
        <div className="space-y-2">
          {zhuyinOptions.map(({ mode, label, description }) => (
            <button
              key={mode}
              onClick={() => onSetZhuyinMode(mode)}
              className={`w - full text - left p - 3 rounded - lg border - 2 transition - colors ${currentZhuyinMode === mode
                ? 'bg-blue-50/50 border-blue-500 backdrop-blur-sm'
                : 'bg-white/50 border-white/60 hover:bg-blue-50/30 backdrop-blur-sm'
                } `}
            >
              <div className="flex items-center">
                <div className={`w - 5 h - 5 rounded - full border - 2 mr - 3 flex - shrink - 0 flex items - center justify - center ${currentZhuyinMode === mode ? 'border-blue-500 bg-blue-500' : 'border-gray-400'} `}>
                  {currentZhuyinMode === mode && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
                <div>
                  <p className={`font - semibold ${currentZhuyinMode === mode ? 'text-blue-700' : 'text-gray-800'} `}>{label}</p>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 訂閱方案 */}
      <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-4 border border-white/50">
        <h3 className="font-bold text-lg mb-3 text-gray-700">訂閱方案</h3>
        <div className="text-gray-600 space-y-2 text-sm">
          <p><strong>訂閱方案：</strong>{getPlanDisplayName(userPlan)}</p>
          {purchaseDate && <p><strong>購買日期：</strong>{purchaseDate}</p>}
          {daysLeft !== undefined && <p><strong>剩餘天數：</strong>{daysLeft} 天</p>}
        </div>
      </div>

      {/* Gemini API Key 管理 - 僅買斷版高級用戶顯示 */}
      {needsApiKey && onSaveApiKey && (
        <GeminiApiKeyManager
          currentKey={geminiApiKey}
          onSave={onSaveApiKey}
          onValidate={onValidateApiKey}
        />
      )}
    </div>
  );
};

export default SettingsPage;
