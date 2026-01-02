const fs = require('fs');

// 讀取原始資料
const rawData = JSON.parse(fs.readFileSync('./26Q1.txt', 'utf8'));

// 清除 contentReference 標記的函數
function cleanText(text) {
    return text.replace(/:contentReference\[oaicite:\d+\]\{index=\d+\}/g, '');
}

// 轉換格式
const convertedData = rawData.map(item => {
    const date = new Date(item.generatedAt);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return {
        date: `${month}-${day}`,
        history: cleanText(item.historyEvent),
        animalFact: cleanText(item.animalTrivia),
        source: "AI生成"
    };
});

// 生成 JavaScript 程式碼
const jsCode = `const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const data = ${JSON.stringify(convertedData, null, 2)};

(async () => {
    const batchSize = 500;
    let batch = db.batch();
    let count = 0;

    for (const entry of data) {
        const docId = entry.date.replace(/-/g, '');
        const docRef = db.doc(\`facts/2026/\${docId}\`);
        batch.set(docRef, entry);
        count++;

        if (count % batchSize === 0 || count === data.length) {
            await batch.commit();
            console.log(\`✅ 已提交 \${count}/\${data.length} 筆\`);
            batch = db.batch();
        }
    }

    console.log(\`🎉 批次匯入完成！共 \${data.length} 筆記錄\`);
    process.exit(0);
})().catch(err => {
    console.error('❌ 匯入失敗:', err);
    process.exit(1);
});
`;

// 寫入檔案
fs.writeFileSync('./import-facts.js', jsCode, 'utf8');
console.log(`✅ 已成功轉換 ${convertedData.length} 筆資料並寫入 import-facts.js`);
console.log(`📝 已加入 source 欄位並清除引用標記`);
