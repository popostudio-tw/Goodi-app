$content = Get-Content -Path "pages\ParentModePage.tsx" -Raw -Encoding UTF8
$newContent = $content -replace "  const \{ getReferralProgress, getNextMilestone, canAddReferralCode, getTrialRemainingDays \} = `r`n    require\('\.\./utils/referralUtils'\);`r`n", ""
[System.IO.File]::WriteAllText("pages\ParentModePage.tsx", $newContent, [System.Text.UTF8Encoding]::new($false))
Write-Host "Fixed!"
