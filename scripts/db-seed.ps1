# JaGrow Database Seed Script
# 시드 데이터 삽입

param(
    [switch]$Reset
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path -replace "\\scripts$", "" }

Write-Host "🌱 JaGrow Database Seed" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

Set-Location "$ProjectRoot\apps\backend"

if ($Reset) {
    Write-Host "⚠️ Clearing existing data before seeding..." -ForegroundColor Yellow
    # This will reset and re-seed in one command
    npx prisma migrate reset --force
    Write-Host "  ✅ Database reset and seeded" -ForegroundColor Green
}
else {
    Write-Host "📥 Seeding database..." -ForegroundColor Yellow
    npx prisma db seed
    Write-Host "  ✅ Database seeded" -ForegroundColor Green
}

Write-Host ""
Write-Host "=======================" -ForegroundColor Cyan
Write-Host "✅ Done!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To view data in browser:" -ForegroundColor Gray
Write-Host "   pnpm run db:studio" -ForegroundColor White
Write-Host ""
