# JaGrow Build Script
# 프로덕션 빌드

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path -replace "\\scripts$", "" }

Write-Host "🏗️ JaGrow Production Build" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# Clean previous builds if requested
if ($Clean) {
    Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
    
    if (-not $FrontendOnly) {
        $backendDist = "$ProjectRoot\apps\backend\dist"
        if (Test-Path $backendDist) {
            Remove-Item -Recurse -Force $backendDist
        }
        Write-Host "  ✅ Backend dist cleaned" -ForegroundColor Green
    }
    
    if (-not $BackendOnly) {
        $frontendNext = "$ProjectRoot\apps\frontend\.next"
        if (Test-Path $frontendNext) {
            Remove-Item -Recurse -Force $frontendNext
        }
        Write-Host "  ✅ Frontend .next cleaned" -ForegroundColor Green
    }
    
    Write-Host ""
}

# Build Backend
if (-not $FrontendOnly) {
    Write-Host "🔧 Building Backend (NestJS)..." -ForegroundColor Yellow
    Set-Location "$ProjectRoot\apps\backend"
    
    # Generate Prisma client
    npx prisma generate
    
    # Build
    pnpm run build
    
    Write-Host "  ✅ Backend build complete" -ForegroundColor Green
    Write-Host ""
}

# Build Frontend
if (-not $BackendOnly) {
    Write-Host "🎨 Building Frontend (Next.js)..." -ForegroundColor Yellow
    Set-Location "$ProjectRoot\apps\frontend"
    
    pnpm run build
    
    Write-Host "  ✅ Frontend build complete" -ForegroundColor Green
    Write-Host ""
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "===========================" -ForegroundColor Cyan
Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host "⏱️ Duration: $($duration.TotalSeconds.ToString("0.0"))s" -ForegroundColor Gray
Write-Host ""
Write-Host "📂 Output locations:" -ForegroundColor Gray
if (-not $FrontendOnly) {
    Write-Host "   Backend:  apps/backend/dist/" -ForegroundColor White
}
if (-not $BackendOnly) {
    Write-Host "   Frontend: apps/frontend/.next/" -ForegroundColor White
}
Write-Host ""
Write-Host "💡 To run production:" -ForegroundColor Gray
Write-Host "   Backend:  cd apps/backend && node dist/main" -ForegroundColor White
Write-Host "   Frontend: cd apps/frontend && pnpm start" -ForegroundColor White
Write-Host ""
