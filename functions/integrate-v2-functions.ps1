# 自動整合腳本 - 將 V2 函式加入 index.ts
# PowerShell Script

$indexPath = "c:\Users\88695\Goodi-app\functions\src\index.ts"

Write-Host "🔄 開始自動整合 V2 函式到 index.ts..." -ForegroundColor Cyan

# 讀取檔案（使用 UTF8 with BOM）
$content = Get-Content $indexPath -Raw -Encoding UTF8

# 備份原始檔案
$backupPath = "c:\Users\88695\Goodi-app\functions\src\index.ts.backup"
Copy-Item $indexPath $backupPath -Force
Write-Host "✅ 已備份原始檔案至: $backupPath" -ForegroundColor Green

# 檢查是否已經整合過
if ($content -match "safetyHelpers" -and $content -match "aiSuggestionsCache") {
    Write-Host "⚠️  檢測到已經整合過 imports，跳過..." -ForegroundColor Yellow
} else {
    # 在 geminiWrapper import 之後添加新的 imports
    $newImports = @"

import { 
  analyzeSafetyRisk, 
  logSafetyFlag, 
  hasRecentSafetyFlags,
  getTrustModePrompt,
  getEncouragementPrompt 
} from "./safetyHelpers";
import { getCachedSuggestion, setCachedSuggestion } from "./aiSuggestionsCache";
"@

    $content = $content -replace '(import \{ callGemini, shouldUseFallback \} from "./geminiWrapper";)', "`$1$newImports"
    Write-Host "✅ 已添加 imports" -ForegroundColor Green
}

# 檢查是否已經整合過 exports
if ($content -match "generateSafeResponseV2" -and $content -match "scheduledWeeklyReportsV2") {
    Write-Host "⚠️  檢測到已經整合過 exports，跳過..." -ForegroundColor Yellow
} else {
    # 在檔案末尾添加新的 exports
    $newExports = @"


// === AI 架構優化 V2 函式 ===
export { generateSafeResponseV2 } from "./generateSafeResponseV2";
export { scheduledWeeklyReportsV2 } from "./scheduledWeeklyReportsV2";
export { scheduledDailySummariesV2 } from "./scheduledDailySummariesV2";
"@

    $content = $content + $newExports
    Write-Host "✅ 已添加 exports" -ForegroundColor Green
}

# 寫回檔案（保持 UTF8 with BOM）
[System.IO.File]::WriteAllText($indexPath, $content, [System.Text.UTF8Encoding]::new($true))

Write-Host "`n✅ 整合完成！" -ForegroundColor Green
Write-Host "📄 備份檔案: $backupPath" -ForegroundColor Cyan
Write-Host "`n下一步: 執行 'npm run build' 測試編譯" -ForegroundColor Yellow
