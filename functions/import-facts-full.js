const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// 從您的原始數據複製到這裡
const data = [
    { date: "01-01", history: "2002年1月1日，歐洲的12個國家開始使用共同貨幣——歐元。這意味著人們可以用同樣的錢在不同的歐洲國家購物與交易，促進了歐洲國家之間的經濟聯繫。", animalFact: "藍鯨是世界上最大的動物，目前捕獲到的最大藍鯨長達33.5米，重量約195噸。", source: "維基百科、國家地理" },
    { date: "01-02", history: "1959年1月2日，蘇聯發射了月球1號探測器，這是人類第一個飛近月球的人造探測器。月球1號掠過月球上空，為人類未來的登月和深空探測奠定了基礎。", animalFact: "世界上飛行速度最快的動物是游隼，飛行速度可達每小時390公里。", source: "維基百科、國家地理" },
    // ... 請將您原始代碼中的完整 data 陣列貼到這裡 ...
];

(async () => {
    const batchSize = 500;
    let batch = db.batch();
    let count = 0;

    for (const entry of data) {
        const docId = entry.date.replace(/-/g, ''); // 修正：替換所有 '-'
        const docRef = db.doc(`facts/2026/${docId}`);
        batch.set(docRef, entry);
        count++;

        if (count % batchSize === 0 || count === data.length) {
            await batch.commit();
            console.log(`✅ 已提交 ${count}/${data.length} 筆`);
            batch = db.batch();
        }
    }

    console.log(`🎉 批次匯入完成！共 ${data.length} 筆記錄`);
    process.exit(0);
})().catch(err => {
    console.error('❌ 匯入失敗:', err);
    process.exit(1);
});
