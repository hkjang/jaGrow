# JaGrow Project Setup Script
# 최초 프로젝트 설정을 위한 스크립트

param(
    [switch]$SkipDocker,
    [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path -replace "\\scripts$", "" }

Write-Host "🚀 JaGrow Project Setup" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# 1. Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check pnpm
try {
    $pnpmVersion = pnpm --version
    Write-Host "  ✅ pnpm: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ pnpm is not installed. Installing..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host "  ✅ pnpm installed" -ForegroundColor Green
}

# Check Docker (optional)
if (-not $SkipDocker) {
    try {
        $dockerVersion = docker --version
        Write-Host "  ✅ Docker: $dockerVersion" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️ Docker is not installed. Use -SkipDocker flag to skip Docker services." -ForegroundColor Yellow
        Write-Host "     You'll need to provide your own PostgreSQL and Redis instances." -ForegroundColor Yellow
    }
}

Write-Host ""

# 2. Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Set-Location $ProjectRoot
pnpm install
Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# 3. Setup environment files
Write-Host "🔧 Setting up environment files..." -ForegroundColor Yellow

$backendEnvExample = "$ProjectRoot\apps\backend\.env.example"
$backendEnv = "$ProjectRoot\apps\backend\.env"

if (Test-Path $backendEnvExample) {
    if (-not (Test-Path $backendEnv)) {
        Copy-Item $backendEnvExample $backendEnv
        Write-Host "  ✅ Created backend .env from .env.example" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Backend .env already exists, skipping" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️ No .env.example found, using existing .env" -ForegroundColor Yellow
}

$frontendEnvExample = "$ProjectRoot\apps\frontend\.env.example"
$frontendEnv = "$ProjectRoot\apps\frontend\.env.local"

if (Test-Path $frontendEnvExample) {
    if (-not (Test-Path $frontendEnv)) {
        Copy-Item $frontendEnvExample $frontendEnv
        Write-Host "  ✅ Created frontend .env.local from .env.example" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Frontend .env.local already exists, skipping" -ForegroundColor Yellow
    }
}

Write-Host ""

# 4. Start Docker services
if (-not $SkipDocker) {
    Write-Host "🐳 Starting Docker services..." -ForegroundColor Yellow
    Set-Location $ProjectRoot
    docker-compose up -d
    
    # Wait for PostgreSQL to be ready
    Write-Host "  ⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    $maxRetries = 30
    $retryCount = 0
    while ($retryCount -lt $maxRetries) {
        try {
            docker exec jagrow-postgres-1 pg_isready -U user -d jagrow 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ PostgreSQL is ready" -ForegroundColor Green
                break
            }
        } catch {}
        $retryCount++
        Start-Sleep -Seconds 1
    }
    
    if ($retryCount -eq $maxRetries) {
        Write-Host "  ⚠️ PostgreSQL may not be fully ready, continuing anyway..." -ForegroundColor Yellow
    }
    
    Write-Host "  ✅ Docker services started" -ForegroundColor Green
    Write-Host ""
}

# 5. Run database migrations
Write-Host "🗄️ Running database migrations..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\apps\backend"
npx prisma generate
npx prisma migrate dev --name init 2>$null
if ($LASTEXITCODE -ne 0) {
    npx prisma migrate deploy
}
Write-Host "  ✅ Database migrations complete" -ForegroundColor Green
Write-Host ""

# 6. Seed database (optional)
if (-not $SkipSeed) {
    Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
    npx prisma db seed
    Write-Host "  ✅ Database seeded" -ForegroundColor Green
    Write-Host ""
}

# Done
Write-Host "========================" -ForegroundColor Cyan
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the development servers, run:" -ForegroundColor White
Write-Host "  pnpm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or manually:" -ForegroundColor White
Write-Host "  Backend:  cd apps/backend && pnpm run start:dev" -ForegroundColor Cyan
Write-Host "  Frontend: cd apps/frontend && pnpm run dev" -ForegroundColor Cyan
Write-Host ""
