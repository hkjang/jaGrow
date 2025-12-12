# JaGrow Test Coverage Script
# 테스트 커버리지 리포트 생성

param(
    [switch]$Open
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path -replace "\\scripts$", "" }

Write-Host "📊 JaGrow Test Coverage" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

Set-Location "$ProjectRoot\apps\backend"

Write-Host "🔬 Running tests with coverage..." -ForegroundColor Yellow
Write-Host ""

pnpm run test:cov

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "=======================" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "✅ Coverage report generated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📂 Report location: apps/backend/coverage/lcov-report/index.html" -ForegroundColor Gray
    
    if ($Open) {
        $reportPath = "$ProjectRoot\apps\backend\coverage\lcov-report\index.html"
        if (Test-Path $reportPath) {
            Start-Process $reportPath
            Write-Host "🌐 Opening report in browser..." -ForegroundColor Green
        }
    }
    else {
        Write-Host ""
        Write-Host "💡 To view report in browser:" -ForegroundColor Gray
        Write-Host "   .\scripts\test-cov.ps1 -Open" -ForegroundColor White
    }
}
else {
    Write-Host "❌ Coverage generation failed." -ForegroundColor Red
}

Write-Host ""

exit $exitCode
