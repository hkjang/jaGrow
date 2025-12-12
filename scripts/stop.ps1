# JaGrow Stop Services Script
# 모든 개발 서비스 중지

param(
    [switch]$IncludeDocker,
    [switch]$Force
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path -replace "\\scripts$", "" }

Write-Host "🛑 Stopping JaGrow Services" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# 1. Stop PowerShell background jobs
Write-Host "📋 Stopping background jobs..." -ForegroundColor Yellow
$jobs = Get-Job
if ($jobs) {
    $jobs | Stop-Job
    $jobs | Remove-Job
    Write-Host "  ✅ Stopped $($jobs.Count) background job(s)" -ForegroundColor Green
}
else {
    Write-Host "  ℹ️ No background jobs running" -ForegroundColor Gray
}
Write-Host ""

# 2. Stop Node.js processes
Write-Host "📋 Stopping Node.js processes..." -ForegroundColor Yellow

# Find and stop nest processes (backend)
$nestProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*nest*" -or $_.CommandLine -like "*backend*"
}

# Find and stop next processes (frontend)
$nextProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*next*" -or $_.CommandLine -like "*frontend*"
}

$stoppedCount = 0

if ($Force) {
    # Force stop all Node processes related to the project
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
        $stoppedCount = $nodeProcesses.Count
    }
}
else {
    # Try to find processes by port
    $ports = @(3000, 4000)
    foreach ($port in $ports) {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process -and $process.ProcessName -eq "node") {
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                $stoppedCount++
            }
        }
    }
}

if ($stoppedCount -gt 0) {
    Write-Host "  ✅ Stopped $stoppedCount Node.js process(es)" -ForegroundColor Green
}
else {
    Write-Host "  ℹ️ No Node.js processes found on ports 3000/4000" -ForegroundColor Gray
}
Write-Host ""

# 3. Stop Docker services (optional)
if ($IncludeDocker) {
    Write-Host "🐳 Stopping Docker services..." -ForegroundColor Yellow
    Set-Location $ProjectRoot
    
    try {
        docker-compose down
        Write-Host "  ✅ Docker services stopped" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠️ Could not stop Docker services" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "===========================" -ForegroundColor Cyan
Write-Host "✅ All services stopped" -ForegroundColor Green
Write-Host ""

if (-not $IncludeDocker) {
    Write-Host "💡 Docker services are still running." -ForegroundColor Gray
    Write-Host "   To stop Docker too, run: .\scripts\stop.ps1 -IncludeDocker" -ForegroundColor Gray
    Write-Host ""
}
