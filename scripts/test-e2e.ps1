# JaGrow E2E Test Script
# End-to-End 테스트 실행

param(
    [switch]$Watch,
    [switch]$Verbose,
    [string]$Filter
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path -replace "\\scripts$", "" }

Write-Host "🧪 JaGrow E2E Tests" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

# Check Docker services
Write-Host "🐳 Checking Docker services..." -ForegroundColor Yellow
Set-Location $ProjectRoot

try {
    $dockerStatus = docker-compose ps --format json 2>$null | ConvertFrom-Json
    $runningServices = $dockerStatus | Where-Object { $_.State -eq "running" }
    
    if ($runningServices.Count -lt 2) {
        Write-Host "  ⚠️ Docker services not running. Starting..." -ForegroundColor Yellow
        docker-compose up -d
        Start-Sleep -Seconds 3
    }
    Write-Host "  ✅ Docker services ready" -ForegroundColor Green
}
catch {
    Write-Host "  ⚠️ Could not verify Docker status. Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""

Set-Location "$ProjectRoot\apps\backend"

$jestArgs = @()

if ($Watch) {
    $jestArgs += "--watch"
}

if ($Verbose) {
    $jestArgs += "--verbose"
}

if ($Filter) {
    $jestArgs += "--testNamePattern=$Filter"
}

Write-Host "🔬 Running E2E tests..." -ForegroundColor Yellow
Write-Host ""

if ($jestArgs.Count -gt 0) {
    pnpm run test:e2e -- @jestArgs
}
else {
    pnpm run test:e2e
}

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "===================" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "✅ All E2E tests passed!" -ForegroundColor Green
}
else {
    Write-Host "❌ Some E2E tests failed." -ForegroundColor Red
}

Write-Host ""

exit $exitCode
