// 簡單的 Node.js 腳本直接調用生成函數
const admin = require('firebase-admin');

// 使用應用默認憑證
admin.initializeApp();

const dates = [
    '2025-12-21',
    '2025-12-22',
    '2025-12-23',
    '2025-12-24',
    '2025-12-25',
    '2025-12-26'
];

// 引入生成函數
const { generateAndStoreDailyContent } = require('./lib/index');

async function regenerate() {
    console.log('開始重新生成內容...\n');

    for (const date of dates) {
        try {
            console.log(`正在生成 ${date}...`);
            await generateAndStoreDailyContent(date);
            console.log(`✅ 成功: ${date}`);

            // 等待 3 秒避免速率限制
            await new Promise(r => setTimeout(r, 3000));
        } catch (error) {
            console.error(`❌ 失敗: ${date}`, error.message);
        }
    }

    console.log('\n完成！請檢查 Firebase Console');
    process.exit(0);
}

regenerate().catch(console.error);
