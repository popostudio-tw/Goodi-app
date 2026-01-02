/**
 * Home Component Modification Guide
 * 
 * 修改 HomeComponent 以直接從 Firestore 讀取預生成的昨日總結
 * 實現「秒開」效果
 */

import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../UserContext';

// === 在 HomeComponent 中添加以下代碼 ===

export function useYesterdaySummary() {
    const { currentUser } = useAuth();
    const [summary, setSummary] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        // 計算昨日日期
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];

        console.log('[YesterdaySummary] Subscribing to:', yesterdayDate);

        // 使用 Real-time Listener
        const unsubscribe = onSnapshot(
            doc(db, 'users', currentUser.uid, 'dailySummaries', yesterdayDate),
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setSummary(data.summary || '');
                    setLoading(false);
                    console.log('[YesterdaySummary] Loaded:', data.summary);
                } else {
                    // 資料尚未生成
                    setSummary('');
                    setError('正在準備您的昨日總結...');
                    setLoading(false);
                    console.warn('[YesterdaySummary] No summary found for', yesterdayDate);
                }
            },
            (err) => {
                console.error('[YesterdaySummary] Error:', err);
                setError('無法載入昨日總結');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    return { summary, loading, error };
}

// === 在 HomeComponent return 中使用 ===
/*
function HomeComponent() {
  const { summary, loading, error } = useYesterdaySummary();

  return (
    <div>
      {loading ? (
        <div className="loading-skeleton">載入中...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : summary ? (
        <div className="yesterday-summary">
          <h3>昨日總結</h3>
          <p>{summary}</p>
        </div>
      ) : null}
    </div>
  );
}
*/

// === 移除舊的 API 調用方式 ===
/*
// ❌ 刪除以下代碼：
const fetchYesterdaySummary = async () => {
  const result = await callAiFunction('generateYesterdaySummary', {...});
  ...
};
useEffect(() => {
  fetchYesterdaySummary();
}, []);
*/
