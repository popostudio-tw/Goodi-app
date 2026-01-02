/**
 * 檢查最近的 Firebase Functions 日誌
 */

const { execSync } = require('child_process');

console.log('🔍 檢查最近的 Firebase Functions 日誌...\n');
console.log('查找關於 generateYesterdaySummary 的調用...\n');

try {
    // 獲取最近的日誌
    const logs = execSync('firebase functions:log --limit 50', {
        encoding: 'utf-8',
        cwd: 'c:\\Users\\88695\\Goodi-app'
    });

    const lines = logs.split('\n');

    // 過濾相關日誌
    const relevantLogs = lines.filter(line =>
        line.includes('generateYesterdaySummary') ||
        line.includes('YesterdaySummary') ||
        line.includes('summary')
    );

    if (relevantLogs.length > 0) {
        console.log('找到相關日誌:\n');
        relevantLogs.forEach(log => console.log(log));
    } else {
        console.log('❌ 沒有找到 generateYesterdaySummary 的調用記錄');
        console.log('這表示前端可能沒有調用 Cloud Function\n');
        console.log('最近 10 筆日誌:');
        lines.slice(0, 10).forEach(log => console.log(log));
    }

} catch (error) {
    console.error('❌ 無法獲取日誌:', error.message);
}
