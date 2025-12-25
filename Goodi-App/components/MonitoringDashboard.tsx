import React, { useState, useEffect } from 'react';
import { getSystemStatus } from '../src/services/apiClient';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface MonitoringData {
    circuitBreaker: {
        isOpen: boolean;
        consecutiveFailures: number;
    };
    dailyUsage: {
        date: string;
        totalCalls: number;
        limit: number;
        callsPerSource: Record<string, number>;
    };
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const MonitoringDashboard: React.FC = () => {
    const [data, setData] = useState<MonitoringData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
        // 每 30 秒自動更新
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        const result = await getSystemStatus();

        if (result.success && result.data) {
            setData({
                circuitBreaker: result.data.circuitBreaker,
                dailyUsage: result.data.dailyUsage,
            });
            setError(null);
        } else {
            setError(result.error?.message || '無法載入數據');
        }

        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="p-8 bg-white/50 rounded-3xl">
                <p className="text-slate-500 text-center">載入中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-red-50 rounded-3xl border border-red-200">
                <p className="text-red-600 text-center">{error}</p>
                <button
                    onClick={loadData}
                    className="mt-4 mx-auto block px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                    重試
                </button>
            </div>
        );
    }

    if (!data) return null;

    const usagePercent = Math.round((data.dailyUsage.totalCalls / data.dailyUsage.limit) * 100);

    // 準備圖表數據
    const sourceData = Object.entries(data.dailyUsage.callsPerSource).map(([name, value]) => ({
        name: translateSource(name),
        value,
    }));

    return (
        <div className="space-y-6">
            {/* 標題 */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">API 使用監controls控</h2>
                    <p className="text-sm text-slate-500">即時系統狀態與使用趨勢</p>
                </div>
                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-bold"
                >
                    🔄 重新整理
                </button>
            </div>

            {/* 概覽卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 總使用量 */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">📊</span>
                        <h3 className="font-bold text-slate-700">今日總量</h3>
                    </div>
                    <p className="text-4xl font-black text-blue-600">{data.dailyUsage.totalCalls}</p>
                    <p className="text-sm text-slate-500 mt-1">/ {data.dailyUsage.limit} 次</p>
                    <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                    </div>
                </div>

                {/* 熔斷器狀態 */}
                <div className={`p-6 rounded-2xl border ${data.circuitBreaker.isOpen
                        ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                    }`}>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{data.circuitBreaker.isOpen ? '🔴' : '🟢'}</span>
                        <h3 className="font-bold text-slate-700">熔斷器</h3>
                    </div>
                    <p className={`text-2xl font-black ${data.circuitBreaker.isOpen ? 'text-red-600' : 'text-green-600'}`}>
                        {data.circuitBreaker.isOpen ? '已啟動' : '正常'}
                    </p>
                    {data.circuitBreaker.consecutiveFailures > 0 && (
                        <p className="text-sm text-slate-500 mt-1">
                            連續失敗：{data.circuitBreaker.consecutiveFailures} 次
                        </p>
                    )}
                </div>

                {/* 使用率 */}
                <div className={`p-6 rounded-2xl border ${usagePercent >= 90 ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200' :
                        usagePercent >= 70 ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' :
                            'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                    }`}>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">📈</span>
                        <h3 className="font-bold text-slate-700">使用率</h3>
                    </div>
                    <p className={`text-4xl font-black ${usagePercent >= 90 ? 'text-red-600' :
                            usagePercent >= 70 ? 'text-yellow-600' :
                                'text-green-600'
                        }`}>
                        {usagePercent}%
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                        {usagePercent >= 90 ? '⚠️ 接近上限' :
                            usagePercent >= 70 ? '注意使用量' :
                                '健康'}
                    </p>
                </div>
            </div>

            {/* 按功能分布圖表 */}
            {sourceData.length > 0 && (
                <div className="bg-white/80 p-6 rounded-2xl border border-white/60">
                    <h3 className="text-lg font-bold text-slate-700 mb-4">📊 API 調用分布</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={sourceData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {sourceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* 詳細列表 */}
                    <div className="mt-6 space-y-2">
                        {sourceData.map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="font-medium text-slate-700">{item.name}</span>
                                </div>
                                <span className="font-mono font-bold text-slate-800">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 系統資訊 */}
            <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 text-center">
                最後更新：{new Date().toLocaleString('zh-TW')} | 數據日期：{data.dailyUsage.date}
            </div>
        </div>
    );
};

// 翻譯來源名稱
function translateSource(source: string): string {
    const translations: Record<string, string> = {
        'daily': '每日內容',
        'weekly': '週報生成',
        'summary': '昨日總結',
        'manual': '手動觸發',
        'treehouse': '悄悄話',
        'growth': '成長報告',
        'task': '任務建議',
    };
    return translations[source] || source;
}

export default MonitoringDashboard;
