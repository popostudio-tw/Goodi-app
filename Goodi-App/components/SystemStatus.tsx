import React, { useState, useEffect } from 'react';
import { getSystemStatus } from '../src/services/apiClient';

interface SystemStatusData {
    timestamp: string;
    circuitBreaker: {
        isOpen: boolean;
        opensAt: number | null;
        consecutiveFailures: number;
    };
    dailyUsage: {
        date: string;
        totalCalls: number;
        limit: number;
        callsPerSource: Record<string, number>;
    };
    rateLimit: {
        current: number;
        limit: number;
    };
}

const SystemStatus: React.FC = () => {
    const [status, setStatus] = useState<SystemStatusData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        setIsLoading(true);
        const result = await getSystemStatus();

        if (result.success && result.data) {
            setStatus(result.data);
            setError(null);
        } else {
            setError(result.error?.message || '無法載入系統狀態');
        }

        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="p-4 bg-white/50 rounded-2xl border border-white/60">
                <p className="text-slate-500">載入中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (!status) return null;

    const usagePercent = Math.round((status.dailyUsage.totalCalls / status.dailyUsage.limit) * 100);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-700">系統狀態</h3>
                <button
                    onClick={loadStatus}
                    className="text-sm text-blue-500 hover:text-blue-600"
                >
                    重新整理
                </button>
            </div>

            {/* Circuit Breaker  狀態 */}
            <div className={`p-4 rounded-xl border ${status.circuitBreaker.isOpen
                    ? 'bg-red-50 border-red-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{status.circuitBreaker.isOpen ? '🔴' : '🟢'}</span>
                    <h4 className="font-bold">熔斷器狀態</h4>
                </div>
                <p className={`text-sm ${status.circuitBreaker.isOpen ? 'text-red-700' : 'text-green-700'}`}>
                    {status.circuitBreaker.isOpen ? '已啟動（系統保護中）' : '正常運作'}
                </p>
                {status.circuitBreaker.consecutiveFailures > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                        連續失敗：{status.circuitBreaker.consecutiveFailures} 次
                    </p>
                )}
            </div>

            {/* 每日使用量 */}
            <div className="p-4 bg-white/60 rounded-xl border border-white/60">
                <h4 className="font-bold mb-2">今日API使用量</h4>
                <div className="flex justify-between items-end mb-2">
                    <span className="text-2xl font-black text-slate-800">{status.dailyUsage.totalCalls}</span>
                    <span className="text-sm text-slate-500">/ {status.dailyUsage.limit}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-full ${usagePercent >= 90 ? 'bg-red-500' :
                                usagePercent >= 70 ? 'bg-yellow-500' :
                                    'bg-green-500'
                            }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                </div>
                <p className="text-xs text-slate-500 mt-1">{usagePercent}% 已使用</p>

                {/* 按來源分組 */}
                {Object.keys(status.dailyUsage.callsPerSource).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-600 mb-2">按功能分類：</p>
                        {Object.entries(status.dailyUsage.callsPerSource).map(([source, count]) => (
                            <div key={source} className="flex justify-between text-xs text-slate-600">
                                <span>{source}</span>
                                <span className="font-mono">{count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <p className="text-xs text-slate-400 text-center">
                最後更新：{new Date(status.timestamp).toLocaleTimeString('zh-TW')}
            </p>
        </div>
    );
};

export default SystemStatus;
