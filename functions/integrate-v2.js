/**
 * 自動整合 V2 函式到 index.ts
 * Node.js Script - 正確處理 UTF-8 BOM
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'src', 'index.ts');
const backupPath = path.join(__dirname, 'src', 'index.ts.backup');

console.log('🔄 開始自動整合 V2 函式到 index.ts...\n');

try {
    // 讀取原始檔案（自動處理 BOM）
    const content = fs.readFileSync(indexPath, 'utf8');

    // 備份
    fs.copyFileSync(indexPath, backupPath);
    console.log('✅ 已備份原始檔案至:', backupPath);

    let newContent = content;
    let modified = false;

    // === 檢查並添加 imports ===
    if (!content.includes('safetyHelpers') || !content.includes('aiSuggestionsCache')) {
        const newImports = `
import { 
  analyzeSafetyRisk, 
  logSafetyFlag, 
  hasRecentSafetyFlags,
  getTrustModePrompt,
  getEncouragementPrompt 
} from "./safetyHelpers";
import { getCachedSuggestion, setCachedSuggestion } from "./aiSuggestionsCache";`;

        // 在 geminiWrapper import 之後添加
        newContent = newContent.replace(
            /(import \{ callGemini, shouldUseFallback \} from "\.\/geminiWrapper";)/,
            `$1${newImports}`
        );

        console.log('✅ 已添加 imports');
        modified = true;
    } else {
        console.log('⚠️  imports 已存在，跳過');
    }

    // === 檢查並添加 exports ===
    if (!content.includes('generateSafeResponseV2') || !content.includes('scheduledWeeklyReportsV2')) {
        const newExports = `

// === AI 架構優化 V2 函式 ===
export { generateSafeResponseV2 } from "./generateSafeResponseV2";
export { scheduledWeeklyReportsV2 } from "./scheduledWeeklyReportsV2";
export { scheduledDailySummariesV2 } from "./scheduledDailySummariesV2";
`;

        newContent = newContent + newExports;
        console.log('✅ 已添加 exports');
        modified = true;
    } else {
        console.log('⚠️  exports 已存在，跳過');
    }

    // === 寫回檔案（保持 UTF-8 with BOM）===
    if (modified) {
        // 添加 BOM
        const bom = '\uFEFF';
        const contentWithBom = newContent.startsWith(bom) ? newContent : bom + newContent;

        fs.writeFileSync(indexPath, contentWithBom, 'utf8');
        console.log('\n✅ 整合完成！');
        console.log('📄 備份檔案:', backupPath);

        // 測試編譯
        console.log('\n🔨 執行編譯測試...');
        const { execSync } = require('child_process');
        try {
            execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });
            console.log('\n✅ 編譯成功！準備部署');
        } catch (error) {
            console.error('\n❌ 編譯失敗，請檢查錯誤訊息');
            process.exit(1);
        }
    } else {
        console.log('\n✅ 檔案已是最新狀態，無需修改');
    }

} catch (error) {
    console.error('❌ 錯誤:', error.message);
    process.exit(1);
}
