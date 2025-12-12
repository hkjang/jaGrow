# JaGrow Database Reset Script
# 데이터베이스 초기화 및 재시드

param(
    [switch]$SkipSeed,
    [switch]$Confirm
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path -replace "\\scripts$", "" }

Write-Host "⚠️ JaGrow Database Reset" -ForegroundColor Red
Write-Host "=========================" -ForegroundColor Red
Write-Host ""
Write-Host "This will DELETE ALL DATA in your database!" -ForegroundColor Yellow
Write-Host ""

if (-not $Confirm) {
    $response = Read-Host "Are you sure you want to continue? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Cancelled." -ForegroundColor Gray
        exit 0
    }
}

Set-Location "$ProjectRoot\apps\backend"

Write-Host ""
Write-Host "🗑️ Resetting database..." -ForegroundColor Yellow

if ($SkipSeed) {
    # Reset without seeding
    npx prisma migrate reset --force --skip-seed
    Write-Host "  ✅ Database reset (without seed)" -ForegroundColor Green
}
else {
    # Reset and re-seed
    npx prisma migrate reset --force
    Write-Host "  ✅ Database reset and seeded" -ForegroundColor Green
}

Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "✅ Done!" -ForegroundColor Green
Write-Host ""
