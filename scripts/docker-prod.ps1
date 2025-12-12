# JaGrow Docker Production Script
# 프로덕션 Docker 빌드 및 실행

param(
    [switch]$Build,
    [switch]$Up,
    [switch]$Down,
    [switch]$Logs,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path -replace "\\scripts$", "" }

Write-Host "🐳 JaGrow Docker Production" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

Set-Location $ProjectRoot

# Default action is Build + Up
if (-not $Build -and -not $Up -and -not $Down -and -not $Logs -and -not $Clean) {
    $Build = $true
    $Up = $true
}

# Clean
if ($Clean) {
    Write-Host "🧹 Cleaning Docker resources..." -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml down --rmi all --volumes 2>$null
    Write-Host "  ✅ Cleaned" -ForegroundColor Green
    Write-Host ""
}

# Build
if ($Build) {
    Write-Host "🏗️ Building Docker images..." -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml build
    Write-Host "  ✅ Images built" -ForegroundColor Green
    Write-Host ""
}

# Up
if ($Up) {
    Write-Host "🚀 Starting production services..." -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml up -d
    Write-Host "  ✅ Services started" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📋 Running services:" -ForegroundColor Gray
    docker-compose -f docker-compose.prod.yml ps
    Write-Host ""
    
    Write-Host "🌐 Access points:" -ForegroundColor Gray
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:4000" -ForegroundColor White
    Write-Host ""
}

# Down
if ($Down) {
    Write-Host "🛑 Stopping production services..." -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml down
    Write-Host "  ✅ Services stopped" -ForegroundColor Green
    Write-Host ""
}

# Logs
if ($Logs) {
    Write-Host "📺 Streaming logs (Ctrl+C to stop)..." -ForegroundColor Yellow
    Write-Host ""
    docker-compose -f docker-compose.prod.yml logs -f
}

Write-Host "============================" -ForegroundColor Cyan
Write-Host "💡 Usage:" -ForegroundColor Gray
Write-Host "   Build & Start: .\scripts\docker-prod.ps1" -ForegroundColor White
Write-Host "   Build only:    .\scripts\docker-prod.ps1 -Build" -ForegroundColor White
Write-Host "   Start only:    .\scripts\docker-prod.ps1 -Up" -ForegroundColor White
Write-Host "   Stop:          .\scripts\docker-prod.ps1 -Down" -ForegroundColor White
Write-Host "   View logs:     .\scripts\docker-prod.ps1 -Logs" -ForegroundColor White
Write-Host "   Full clean:    .\scripts\docker-prod.ps1 -Clean" -ForegroundColor White
Write-Host ""
