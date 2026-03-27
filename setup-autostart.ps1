# SprintBoard AutoStart Setup
# Right-click this file → "Run as Administrator" (one time only)

$NodePath  = "C:\Program Files\nodejs\node.exe"
$ServerPath = "C:\Users\Neutara\Claude Test\server.js"
$TaskName   = "SprintBoard"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Neutara SprintBoard - AutoStart Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Remove existing task if present
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

# Build the action: run node.exe silently (no window)
$Action  = New-ScheduledTaskAction -Execute $NodePath -Argument "`"$ServerPath`""
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
    -MultipleInstances IgnoreNew `
    -Hidden

$Principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Highest

try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Principal $Principal `
        -Force | Out-Null

    Write-Host "[OK] AutoStart registered!" -ForegroundColor Green
    Write-Host ""
    Write-Host "SprintBoard will now start automatically on every Windows login." -ForegroundColor White
    Write-Host "Server runs at: http://localhost:3000" -ForegroundColor Yellow
    Write-Host ""

    # Start it now if not already running
    $portInUse = netstat -ano 2>$null | Select-String ":3000 "
    if (-not $portInUse) {
        Write-Host "Starting server now..." -ForegroundColor White
        Start-Process -FilePath $NodePath -ArgumentList "`"$ServerPath`"" -WindowStyle Hidden
        Start-Sleep -Seconds 2
        Write-Host "[OK] Server started at http://localhost:3000" -ForegroundColor Green
    } else {
        Write-Host "[OK] Server already running on port 3000" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you right-clicked and chose 'Run as Administrator'" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
