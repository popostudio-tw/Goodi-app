/**
 * 任務範本匯入工具
 * 用於將種子資料匯入到 Firestore
 */

import React, { useState } from 'react';
import { SEED_TEMPLATES, convertSeedData, SeedTemplate } from '../data/taskTemplateSeedData';
import { addTemplate } from '../services/taskTemplateService';

interface ImportResult {
    keyword: string;
    ageRange: string;
    success: boolean;
    error?: string;
}

const TaskTemplateImporter: React.FC = () => {
    const [isImporting, setIsImporting] = useState(false);
    const [results, setResults] = useState<ImportResult[]>([]);
    const [customJson, setCustomJson] = useState('');
    const [customResults, setCustomResults] = useState<ImportResult[]>([]);

    // 匯入種子資料
    const handleImportSeedData = async () => {
        setIsImporting(true);
        const importResults: ImportResult[] = [];

        for (const seed of SEED_TEMPLATES) {
            try {
                const converted = convertSeedData(seed);
                const id = await addTemplate(
                    converted.ageMin,
                    converted.ageMax,
                    converted.keyword,
                    converted.tasks
                );

                importResults.push({
                    keyword: seed.keyword,
                    ageRange: `${seed.ageRange[0]}-${seed.ageRange[1]}歲`,
                    success: !!id,
                    error: id ? undefined : '儲存失敗',
                });
            } catch (error: any) {
                importResults.push({
                    keyword: seed.keyword,
                    ageRange: `${seed.ageRange[0]}-${seed.ageRange[1]}歲`,
                    success: false,
                    error: error.message,
                });
            }
        }

        setResults(importResults);
        setIsImporting(false);
    };

    // 匯入自訂 JSON
    const handleImportCustomJson = async () => {
        if (!customJson.trim()) {
            alert('請輸入 JSON 資料');
            return;
        }

        setIsImporting(true);
        const importResults: ImportResult[] = [];

        try {
            const parsed: SeedTemplate | SeedTemplate[] = JSON.parse(customJson);
            const templates = Array.isArray(parsed) ? parsed : [parsed];

            for (const seed of templates) {
                try {
                    const converted = convertSeedData(seed);
                    const id = await addTemplate(
                        converted.ageMin,
                        converted.ageMax,
                        converted.keyword,
                        converted.tasks
                    );

                    importResults.push({
                        keyword: seed.keyword,
                        ageRange: `${seed.ageRange[0]}-${seed.ageRange[1]}歲`,
                        success: !!id,
                        error: id ? undefined : '儲存失敗',
                    });
                } catch (error: any) {
                    importResults.push({
                        keyword: seed.keyword || '未知',
                        ageRange: seed.ageRange ? `${seed.ageRange[0]}-${seed.ageRange[1]}歲` : '未知',
                        success: false,
                        error: error.message,
                    });
                }
            }
        } catch (error: any) {
            importResults.push({
                keyword: 'JSON 解析錯誤',
                ageRange: '',
                success: false,
                error: error.message,
            });
        }

        setCustomResults(importResults);
        setIsImporting(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">任務範本匯入工具</h1>

            {/* 種子資料匯入 */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">匯入種子資料</h2>
                <p className="text-gray-600 mb-4">
                    目前有 {SEED_TEMPLATES.length} 筆種子資料準備匯入
                </p>
                <button
                    onClick={handleImportSeedData}
                    disabled={isImporting}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 disabled:bg-gray-300"
                >
                    {isImporting ? '匯入中...' : '開始匯入種子資料'}
                </button>

                {results.length > 0 && (
                    <div className="mt-4">
                        <h3 className="font-semibold mb-2">匯入結果：</h3>
                        <ul className="space-y-1">
                            {results.map((r, i) => (
                                <li key={i} className={r.success ? 'text-green-600' : 'text-red-600'}>
                                    {r.success ? '✅' : '❌'} {r.ageRange} - {r.keyword}
                                    {r.error && `: ${r.error}`}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* 自訂 JSON 匯入 */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">匯入自訂 JSON</h2>
                <p className="text-gray-600 mb-4">
                    貼上 AI 生成的 JSON 資料，可以單筆或多筆（陣列格式）
                </p>
                <textarea
                    value={customJson}
                    onChange={(e) => setCustomJson(e.target.value)}
                    placeholder='{"ageRange": [7, 8], "keyword": "時間管理", "tasks": [...]}'
                    className="w-full h-48 p-3 border rounded-lg font-mono text-sm"
                />
                <button
                    onClick={handleImportCustomJson}
                    disabled={isImporting}
                    className="mt-4 px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 disabled:bg-gray-300"
                >
                    {isImporting ? '匯入中...' : '匯入自訂 JSON'}
                </button>

                {customResults.length > 0 && (
                    <div className="mt-4">
                        <h3 className="font-semibold mb-2">匯入結果：</h3>
                        <ul className="space-y-1">
                            {customResults.map((r, i) => (
                                <li key={i} className={r.success ? 'text-green-600' : 'text-red-600'}>
                                    {r.success ? '✅' : '❌'} {r.ageRange} - {r.keyword}
                                    {r.error && `: ${r.error}`}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskTemplateImporter;
