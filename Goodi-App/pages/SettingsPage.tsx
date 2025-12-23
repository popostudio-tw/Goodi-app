
import React, { useState } from 'react';
import { ZhuyinMode, Plan } from '../types';
import { getPlanDisplayName, isLifetimePlan, hasPremiumAccess } from '../utils/planUtils';
import GeminiApiKeyManager from '../components/GeminiApiKeyManager';

interface SettingsPageProps {
  // Zhuyin mode settings
  currentZhuyinMode: ZhuyinMode;
  onSetZhuyinMode: (mode: ZhuyinMode) => void;

  // Subscription and plan details
  userPlan: Plan;
  purchaseDate?: string;
  daysLeft?: number;

  // Gemini API Key settings (for lifetime premium users)
  geminiApiKey?: string;
  onSaveApiKey?: (key: string) => void;
  onValidateApiKey?: () => void;

  // Account deletion
  onDeleteAccount?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  currentZhuyinMode,
  onSetZhuyinMode,
  userPlan,
  purchaseDate,
  daysLeft,
  geminiApiKey,
  onSaveApiKey,
  onValidateApiKey,
  onDeleteAccount,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const zhuyinOptions: { mode: ZhuyinMode; label: string; description: string }[] = [
    { mode: 'auto', label: '自動模式', description: '4-8 歲時會自動顯示注音' },
    { mode: 'on', label: '全開模式', description: '不論年齡，一律顯示注音' },
    { mode: 'off', label: '關閉模式', description: '不論年齡，一律隱藏注音' },
  ];

  const needsApiKey = isLifetimePlan(userPlan) && hasPremiumAccess(userPlan);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (onDeleteAccount) {
      onDeleteAccount();
    }
    setShowDeleteConfirm(false);
  };

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
              className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${currentZhuyinMode === mode
                  ? 'bg-blue-50/50 border-blue-500 backdrop-blur-sm'
                  : 'bg-white/50 border-white/60 hover:bg-blue-50/30 backdrop-blur-sm'
                }`}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 flex items-center justify-center ${currentZhuyinMode === mode ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
                  {currentZhuyinMode === mode && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
                <div>
                  <p className={`font-semibold ${currentZhuyinMode === mode ? 'text-blue-700' : 'text-gray-800'}`}>{label}</p>
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

      {/* 帳號管理 */}
      {onDeleteAccount && (
        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-4 border border-white/50">
          <h3 className="font-bold text-lg mb-3 text-gray-700">帳號管理</h3>
          <button
            onClick={handleDeleteClick}
            className="w-full bg-red-500/80 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            刪除帳號
          </button>
          <p className="text-xs text-gray-500 mt-2">
            ⚠️ 此操作無法復原，將永久刪除您的所有資料
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                確定要刪除帳號嗎？
              </h2>
              <p className="text-gray-600 mb-6">
                刪除帳號後，以下資料將永久移除且無法恢復：
              </p>
              <ul className="text-left text-sm text-gray-600 mb-6 space-y-2 bg-red-50/50 p-4 rounded-lg">
                <li>✗ 所有任務紀錄</li>
                <li>✗ 成績歷史</li>
                <li>✗ AI 成長報告</li>
                <li>✗ 心事樹洞對話</li>
                <li>✗ 每日亮點</li>
                <li>✗ 訂閱方案（如有）</li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  確認刪除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
