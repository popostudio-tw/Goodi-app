/**
 * 簡化版整合腳本 - 僅添加 exports
 * 不需要在 index.ts 中添加 imports（V2 函式自己 import）
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'src', 'index.ts');
const backupPath = path.join(__dirname, 'src', 'index.ts.backup');

console.log('🔄 開始整合 V2 函式 exports 到 index.ts...\n');

try {
    // 讀取原始檔案
    const content = fs.readFileSync(indexPath, 'utf8');

    // 備份
    fs.copyFileSync(indexPath, backupPath);
    console.log('✅ 已備份原始檔案');

    // 檢查是否已經整合過
    if (content.includes('generateSafeResponseV2') && content.includes('scheduledWeeklyReportsV2')) {
        console.log('⚠️  V2 exports 已存在，無需修改');
        process.exit(0);
    }

    // 在檔案末尾添加 exports
    const newExports = `

// === AI 架構優化 V2 函式 (2025-12-29) ===
export { generateSafeResponseV2 } from "./generateSafeResponseV2";
export { scheduledWeeklyReportsV2 } from "./scheduledWeeklyReportsV2";
export { scheduledDailySummariesV2 } from "./scheduledDailySummariesV2";
`;

    const newContent = content + newExports;

    // 保持 UTF-8 with BOM
    const bom = '\uFEFF';
    const contentWithBom = newContent.startsWith(bom) ? newContent : bom + newContent;

    fs.writeFileSync(indexPath, contentWithBom, 'utf8');
    console.log('✅ 已添加 V2 exports');

    // 測試編譯
    console.log('\n🔨 測試編譯...');
    const { execSync } = require('child_process');
    execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });

    console.log('\n✅ 整合完成且編譯成功！');
    console.log('📄 備份檔案:', backupPath);
    console.log('\n下一步: firebase deploy --only functions');

} catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    process.exit(1);
}
