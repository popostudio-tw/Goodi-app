# 檢查 Firestore 內容的 PowerShell 腳本
Write-Host "檢查生成的內容..." -ForegroundColor Green
Write-Host ""

$dates = @(
    "2025-12-21",
    "2025-12-22",
    "2025-12-23",
    "2025-12-24",
    "2025-12-25",
    "2025-12-26"
)

foreach ($date in $dates) {
    Write-Host "📅 $date" -ForegroundColor Cyan
    
    # 使用 Firebase CLI 查詢（如果可用）
    # 或者直接到 Firebase Console 手動檢查
    Write-Host "  請到 Firebase Console 檢查: dailyContent/$date" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Gray
Write-Host "請打開 Firebase Console 檢查:" -ForegroundColor Yellow
Write-Host "https://console.firebase.google.com/project/goodi-app-78ad7/firestore/databases/-default-/data/~2FdailyContent" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Gray
