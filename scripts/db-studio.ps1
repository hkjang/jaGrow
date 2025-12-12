# JaGrow Prisma Studio Script
# 브라우저에서 데이터베이스 관리

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path -replace "\\scripts$", "" }

Write-Host "🔍 JaGrow Prisma Studio" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening Prisma Studio in browser..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

Set-Location "$ProjectRoot\apps\backend"
npx prisma studio
