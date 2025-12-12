# JaGrow Development Server Script
# 개발 서버 시작 (Docker + Backend + Frontend)

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$SkipDocker
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path -replace "\\scripts$", "" }

Write-Host "🚀 Starting JaGrow Development Environment" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start Docker services
if (-not $SkipDocker) {
    Write-Host "🐳 Starting Docker services..." -ForegroundColor Yellow
    Set-Location $ProjectRoot
    
    # Check if Docker is running
    try {
        docker info 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ⚠️ Docker is not running. Please start Docker Desktop." -ForegroundColor Yellow
        }
        else {
            docker-compose up -d
            Write-Host "  ✅ Docker services started (PostgreSQL: 5432, Redis: 6379)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  ⚠️ Docker is not available. Skipping..." -ForegroundColor Yellow
    }
    Write-Host ""
}

# Wait a moment for services to be ready
Start-Sleep -Seconds 2

# 2. Start Backend
if (-not $FrontendOnly) {
    Write-Host "🔧 Starting Backend (NestJS) on port 4000..." -ForegroundColor Yellow
    
    $backendJob = Start-Job -ScriptBlock {
        param($ProjectRoot)
        Set-Location "$ProjectRoot\apps\backend"
        
        # Generate Prisma client if needed
        if (-not (Test-Path "node_modules\.prisma")) {
            npx prisma generate 2>$null
        }
        
        # Start the development server
        pnpm run start:dev 2>&1
    } -ArgumentList $ProjectRoot
    
    Write-Host "  ✅ Backend starting in background (Job ID: $($backendJob.Id))" -ForegroundColor Green
    Write-Host ""
}

# 3. Start Frontend
if (-not $BackendOnly) {
    Write-Host "🎨 Starting Frontend (Next.js) on port 3000..." -ForegroundColor Yellow
    
    $frontendJob = Start-Job -ScriptBlock {
        param($ProjectRoot)
        Set-Location "$ProjectRoot\apps\frontend"
        pnpm run dev 2>&1
    } -ArgumentList $ProjectRoot
    
    Write-Host "  ✅ Frontend starting in background (Job ID: $($frontendJob.Id))" -ForegroundColor Green
    Write-Host ""
}

# 4. Display info
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "🌐 Development servers are starting:" -ForegroundColor Green
if (-not $FrontendOnly) {
    Write-Host "   Backend API:  http://localhost:4000" -ForegroundColor Cyan
}
if (-not $BackendOnly) {
    Write-Host "   Frontend:     http://localhost:3000" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "📋 To view logs:" -ForegroundColor Yellow
Write-Host "   Backend:  Receive-Job $($backendJob.Id) -Keep" -ForegroundColor White
Write-Host "   Frontend: Receive-Job $($frontendJob.Id) -Keep" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop all servers:" -ForegroundColor Yellow
Write-Host "   pnpm run stop" -ForegroundColor White
Write-Host "   or: .\scripts\stop.ps1" -ForegroundColor White
Write-Host ""

# 5. Wait and stream output
Write-Host "📺 Streaming logs (Ctrl+C to stop)..." -ForegroundColor Yellow
Write-Host ""

try {
    while ($true) {
        if (-not $FrontendOnly) {
            $backendOutput = Receive-Job $backendJob -ErrorAction SilentlyContinue
            if ($backendOutput) {
                $backendOutput | ForEach-Object { Write-Host "[Backend] $_" -ForegroundColor Blue }
            }
        }
        
        if (-not $BackendOnly) {
            $frontendOutput = Receive-Job $frontendJob -ErrorAction SilentlyContinue
            if ($frontendOutput) {
                $frontendOutput | ForEach-Object { Write-Host "[Frontend] $_" -ForegroundColor Magenta }
            }
        }
        
        Start-Sleep -Milliseconds 500
    }
}
finally {
    Write-Host ""
    Write-Host "Stopping jobs..." -ForegroundColor Yellow
    Get-Job | Stop-Job
    Get-Job | Remove-Job
}
