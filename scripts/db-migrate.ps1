# JaGrow Database Migration Script
# Prisma 마이그레이션 실행

param(
    [string]$Name,
    [switch]$Deploy,
    [switch]$Reset
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path -replace "\\scripts$", "" }

Write-Host "🗄️ JaGrow Database Migration" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

Set-Location "$ProjectRoot\apps\backend"

# Generate Prisma client first
Write-Host "📦 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "  ✅ Prisma client generated" -ForegroundColor Green
Write-Host ""

if ($Reset) {
    Write-Host "⚠️ Resetting database (this will delete all data)..." -ForegroundColor Red
    npx prisma migrate reset --force
    Write-Host "  ✅ Database reset complete" -ForegroundColor Green
}
elseif ($Deploy) {
    Write-Host "🚀 Deploying migrations to production..." -ForegroundColor Yellow
    npx prisma migrate deploy
    Write-Host "  ✅ Migrations deployed" -ForegroundColor Green
}
else {
    Write-Host "🔄 Running development migrations..." -ForegroundColor Yellow
    
    if ($Name) {
        npx prisma migrate dev --name $Name
    }
    else {
        npx prisma migrate dev
    }
    Write-Host "  ✅ Migrations complete" -ForegroundColor Green
}

Write-Host ""
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "✅ Done!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Usage:" -ForegroundColor Gray
Write-Host "   Create named migration: .\scripts\db-migrate.ps1 -Name 'add_users_table'" -ForegroundColor White
Write-Host "   Deploy to production:   .\scripts\db-migrate.ps1 -Deploy" -ForegroundColor White
Write-Host "   Reset database:         .\scripts\db-migrate.ps1 -Reset" -ForegroundColor White
Write-Host ""
