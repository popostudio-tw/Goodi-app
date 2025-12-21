import { getFirestore, collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { HighlightData } from '../components/HighlightCard';

// ==========================================
// 亮點數據服務
// ==========================================

/**
 * 獲取用戶最近的亮點（最多3個）
 */
export async function getRecentHighlights(
    userId: string,
    maxCount: number = 3
): Promise<HighlightData[]> {
    try {
        const db = getFirestore();
        const highlightsRef = collection(db, 'users', userId, 'highlights');

        // 查詢最近的亮點，按日期降序
        const q = query(
            highlightsRef,
            orderBy('date', 'desc'),
            limit(maxCount)
        );

        const querySnapshot = await getDocs(q);
        const highlights: HighlightData[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            highlights.push({
                date: data.date,
                action: data.action,
                meaning: data.meaning,
                improvement: data.improvement,
                category: data.category,
                metrics: data.metrics
            });
        });

        return highlights;
    } catch (error) {
        console.error('[Highlights] Failed to fetch highlights:', error);
        return [];
    }
}

/**
 * 獲取今天的亮點
 */
export async function getTodayHighlight(userId: string): Promise<HighlightData | null> {
    try {
        const db = getFirestore();
        const today = new Date().toISOString().split('T')[0];
        const highlightsRef = collection(db, 'users', userId, 'highlights');

        const q = query(highlightsRef, where('date', '==', today));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const data = querySnapshot.docs[0].data();
        return {
            date: data.date,
            action: data.action,
            meaning: data.meaning,
            improvement: data.improvement,
            category: data.category,
            metrics: data.metrics
        };
    } catch (error) {
        console.error('[Highlights] Failed to fetch today highlight:', error);
        return null;
    }
}

/**
 * 獲取過去 N 天內錯過的瞬間數量
 */
export async function getMissedMomentsCount(
    userId: string,
    days: number = 7
): Promise<number> {
    try {
        const db = getFirestore();
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - days);
        const pastDateStr = pastDate.toISOString().split('T')[0];

        const highlightsRef = collection(db, 'users', userId, 'highlights');
        const q = query(
            highlightsRef,
            where('date', '>=', pastDateStr),
            orderBy('date', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    } catch (error) {
        console.error('[Highlights] Failed to count missed moments:', error);
        return 0;
    }
}

/**
 * 創建測試用的亮點數據（僅開發環境）
 */
export async function createTestHighlights(userId: string): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Test highlights creation is not allowed in production');
    }

    const { setDoc, doc } = await import('firebase/firestore');
    const db = getFirestore();

    const testHighlights: HighlightData[] = [
        {
            date: new Date().toISOString().split('T')[0],
            action: '自己完成了 20 分鐘數學作業',
            meaning: '他開始不害怕困難了',
            improvement: '專注時長 +34%',
            category: 'learning',
            metrics: {
                courage: 12,
                focus: 20,
                discipline: 3
            }
        },
        {
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // 昨天
            action: '主動整理了書包',
            meaning: '責任感正在養成',
            improvement: '連續 5 天自律',
            category: 'habit',
            metrics: {
                discipline: 5,
                focus: 10
            }
        },
        {
            date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], // 前天
            action: '跟 Goodi 分享了心情',
            meaning: '他開始學會表達情緒',
            improvement: '願意傾訴次數 +3',
            category: 'emotion',
            metrics: {
                courage: 8
            }
        }
    ];

    for (const highlight of testHighlights) {
        const highlightRef = doc(db, 'users', userId, 'highlights', highlight.date);
        await setDoc(highlightRef, highlight);
    }

    console.log('[Highlights] Test highlights created for user:', userId);
}
