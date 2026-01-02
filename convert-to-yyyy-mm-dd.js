const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function convertToYYYYMMDD() {
    console.log('📖 轉換 dailyContent 文檔 ID 為 YYYY-MM-DD 格式...\n');

    const snapshot = await db.collection('dailyContent').get();
    console.log(`找到 ${snapshot.size} 個文檔\n`);

    const batch = db.batch();
    let convertCount = 0;
    let skipCount = 0;

    for (const doc of snapshot.docs) {
        const docId = doc.id;
        const data = doc.data();

        // 檢查是否已經是 YYYY-MM-DD 格式
        if (docId.match(/^\d{4}-\d{2}-\d{2}$/)) {
            console.log(`⏭️  跳過 ${docId} (已經是正確格式)`);
            skipCount++;
            continue;
        }

        // 假設是 MMDD 格式，轉換為 2026-MM-DD (因為大部分是 2026 年資料)
        if (docId.match(/^\d{4}$/)) {
            const month = docId.substring(0, 2);
            const day = docId.substring(2, 4);

            // 12/28-31 使用 2025，其他使用 2026
            let year = '2026';
            if (month === '12' && parseInt(day) >= 28) {
                year = '2025';
            }

            const newDocId = `${year}-${month}-${day}`;

            // 創建新文檔
            const newDocRef = db.collection('dailyContent').doc(newDocId);
            batch.set(newDocRef, data);

            // 刪除舊文檔
            batch.delete(doc.ref);

            console.log(`✓ 轉換: ${docId} → ${newDocId}`);
            convertCount++;
        } else {
            console.log(`⚠️  未知格式: ${docId}`);
        }
    }

    if (convertCount > 0) {
        console.log(`\n📝 提交 ${convertCount} 個轉換...`);
        await batch.commit();
        console.log(`✅ 完成！`);
    } else {
        console.log(`\n✅ 沒有需要轉換的文檔`);
    }

    console.log(`\n統計:`);
    console.log(`  - 已轉換: ${convertCount} 個`);
    console.log(`  - 已跳過: ${skipCount} 個`);

    process.exit(0);
}

convertToYYYYMMDD().catch(err => {
    console.error('❌ 錯誤:', err);
    process.exit(1);
});
