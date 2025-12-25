# 批量重新生成 12/21-26 內容
# 執行方式：在 PowerShell 中運行此腳本
# 專案：goodi-5ec49 (default)

Write-Host "開始重新生成 12/21-26 的每日內容..." -ForegroundColor Green
Write-Host "目標專案: goodi-5ec49" -ForegroundColor Yellow
Write-Host ""

$dates = @(
    "2025-12-21",
    "2025-12-22",
    "2025-12-23",
    "2025-12-24",
    "2025-12-25",
    "2025-12-26"
)

$successCount = 0
$failCount = 0

foreach ($date in $dates) {
    Write-Host "正在生成 $date 的內容..." -ForegroundColor Cyan
    
    try {
        # 呼叫 Firebase Cloud Function
        $result = firebase functions:call manualGenerateDailyContent --data "{`"date`":`"$date`",`"force`":true}"
        
        Write-Host "  ✅ 成功生成 $date" -ForegroundColor Green
        $successCount++
        
        # 等待 3 秒，避免速率限制
        Write-Host "  ⏳ 等待 3 秒..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        
    }
    catch {
        Write-Host "  ❌ 生成 $date 失敗: $_" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Gray
Write-Host "完成！" -ForegroundColor Green
Write-Host "  成功: $successCount 個日期" -ForegroundColor Green
Write-Host "  失敗: $failCount 個日期" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Gray
Write-Host ""
Write-Host "請前往 Firebase Console 確認內容：" -ForegroundColor Yellow
Write-Host "  Firestore > dailyContent collection" -ForegroundColor Yellow
