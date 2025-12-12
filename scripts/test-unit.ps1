# JaGrow Unit Test Script
# 백엔드 단위 테스트 실행

param(
    [switch]$Watch,
    [switch]$Verbose,
    [string]$Filter
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path -replace "\\scripts$", "" }

Write-Host "🧪 JaGrow Unit Tests" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
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

Write-Host "🔬 Running unit tests..." -ForegroundColor Yellow
Write-Host ""

if ($jestArgs.Count -gt 0) {
    pnpm run test -- @jestArgs
}
else {
    pnpm run test
}

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "====================" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
}
else {
    Write-Host "❌ Some tests failed." -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 Usage:" -ForegroundColor Gray
Write-Host "   Watch mode:    .\scripts\test-unit.ps1 -Watch" -ForegroundColor White
Write-Host "   Verbose:       .\scripts\test-unit.ps1 -Verbose" -ForegroundColor White
Write-Host "   Filter tests:  .\scripts\test-unit.ps1 -Filter 'UserService'" -ForegroundColor White
Write-Host ""

exit $exitCode
