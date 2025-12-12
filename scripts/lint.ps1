# JaGrow Lint Script
# 코드 린트 실행

param(
    [switch]$Fix,
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path -replace "\\scripts$", "" }

Write-Host "🔍 JaGrow Code Lint" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

$hasErrors = $false

# Lint Backend
if (-not $FrontendOnly) {
    Write-Host "🔧 Linting Backend..." -ForegroundColor Yellow
    Set-Location "$ProjectRoot\apps\backend"
    
    if ($Fix) {
        pnpm run lint
    }
    else {
        pnpm run lint 2>&1
    }
    
    if ($LASTEXITCODE -ne 0) {
        $hasErrors = $true
        Write-Host "  ⚠️ Backend has lint issues" -ForegroundColor Yellow
    }
    else {
        Write-Host "  ✅ Backend lint passed" -ForegroundColor Green
    }
    Write-Host ""
}

# Lint Frontend
if (-not $BackendOnly) {
    Write-Host "🎨 Linting Frontend..." -ForegroundColor Yellow
    Set-Location "$ProjectRoot\apps\frontend"
    
    pnpm run lint 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        $hasErrors = $true
        Write-Host "  ⚠️ Frontend has lint issues" -ForegroundColor Yellow
    }
    else {
        Write-Host "  ✅ Frontend lint passed" -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host "===================" -ForegroundColor Cyan

if ($hasErrors) {
    Write-Host "⚠️ Some lint issues found" -ForegroundColor Yellow
    if (-not $Fix) {
        Write-Host ""
        Write-Host "💡 To auto-fix issues:" -ForegroundColor Gray
        Write-Host "   .\scripts\lint.ps1 -Fix" -ForegroundColor White
    }
    exit 1
}
else {
    Write-Host "✅ All lint checks passed!" -ForegroundColor Green
}

Write-Host ""
