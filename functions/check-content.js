// 檢查生成的內容
const admin = require('firebase-admin');

// 使用項目 ID 初始化
admin.initializeApp({
    projectId: 'goodi-app-78ad7'
});
const db = admin.firestore();

const dates = [
    '2025-12-21',
    '2025-12-22',
    '2025-12-23',
    '2025-12-24',
    '2025-12-25',
    '2025-12-26'
];

async function checkContent() {
    console.log('檢查生成的內容...\n');

    for (const date of dates) {
        try {
            const doc = await db.collection('dailyContent').doc(date).get();

            if (doc.exists) {
                const data = doc.data();
                const history = data.todayInHistory || '';
                const animal = data.animalTrivia || '';

                console.log(`📅 ${date}`);
                console.log(`  狀態: ${data.status || 'unknown'}`);
                console.log(`  歷史字數: ${history.length} 字`);
                console.log(`  動物字數: ${animal.length} 字`);
                console.log(`  生成時間: ${data.generatedAt || 'unknown'}`);

                // 檢查內容質量
                const issues = [];
                if (history.length < 70 || history.length > 120) {
                    issues.push(`歷史內容長度不符 (${history.length}字，應為80-100字)`);
                }
                if (animal.length < 70 || animal.length > 120) {
                    issues.push(`動物內容長度不符 (${animal.length}字，應為80-100字)`);
                }
                if (history.includes('Goodi') && history.includes('斷線')) {
                    issues.push('歷史內容是 fallback');
                }
                if (animal.includes('Goodi') && animal.includes('斷線')) {
                    issues.push('動物內容是 fallback');
                }

                if (issues.length > 0) {
                    console.log(`  ⚠️  問題: ${issues.join(', ')}`);
                } else {
                    console.log(`  ✅ 質量檢查通過`);
                }

                // 顯示內容預覽
                console.log(`  歷史預覽: ${history.substring(0, 50)}...`);
                console.log(`  動物預覽: ${animal.substring(0, 50)}...`);

            } else {
                console.log(`📅 ${date}`);
                console.log(`  ❌ 文檔不存在`);
            }
            console.log('');

        } catch (error) {
            console.error(`❌ 檢查 ${date} 失敗:`, error.message);
        }
    }

    process.exit(0);
}

checkContent().catch(console.error);
