const admin = require('firebase-admin');

// 使用預設認證（從環境變數或 gcloud）
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// 請將您原始代碼的完整 data 陣列貼到下面
const data = [
    // ... 在這裡貼上您的數據 ...
];

(async () => {
    const batchSize = 500;
    let batch = db.batch();
    let count = 0;

    for (const entry of data) {
        const docId = entry.date.replace(/-/g, '');
        const docRef = db.doc(`facts/2026/${docId}`);
        batch.set(docRef, entry);
        count++;

        if (count % batchSize === 0 || count === data.length) {
            await batch.commit();
            console.log(`✅ 已提交 ${count}/${data.length} 筆`);
            batch = db.batch();
        }
    }

    console.log(`🎉 完成！共 ${data.length} 筆`);
    process.exit(0);
})().catch(err => {
    console.error('❌ 錯誤:', err);
    process.exit(1);
});
