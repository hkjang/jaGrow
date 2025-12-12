# JaGrow 프로젝트 스크립트 가이드

## 빠른 시작

```powershell
# 1. 최초 설정 (의존성 설치, Docker 시작, DB 마이그레이션, 시드)
pnpm run setup

# 2. 개발 서버 시작
pnpm run dev
```

## 사용 가능한 스크립트

### 개발

| 명령어           | 설명                                |
| ---------------- | ----------------------------------- |
| `pnpm run setup` | 최초 프로젝트 설정                  |
| `pnpm run dev`   | 개발 서버 시작 (Backend + Frontend) |
| `pnpm run stop`  | 모든 서비스 중지                    |
| `pnpm run build` | 프로덕션 빌드                       |
| `pnpm run lint`  | 코드 린트 실행                      |

### 데이터베이스

| 명령어                | 설명                     |
| --------------------- | ------------------------ |
| `pnpm run db:migrate` | Prisma 마이그레이션 실행 |
| `pnpm run db:seed`    | 시드 데이터 삽입         |
| `pnpm run db:reset`   | DB 초기화 및 재시드      |
| `pnpm run db:studio`  | Prisma Studio 실행       |

### 테스트

| 명령어               | 설명                   |
| -------------------- | ---------------------- |
| `pnpm run test`      | 단위 테스트 실행       |
| `pnpm run test:unit` | 단위 테스트 실행       |
| `pnpm run test:e2e`  | E2E 테스트 실행        |
| `pnpm run test:cov`  | 테스트 커버리지 리포트 |

### Docker

| 명령어                 | 설명                         |
| ---------------------- | ---------------------------- |
| `pnpm run docker:up`   | Docker 서비스 시작           |
| `pnpm run docker:down` | Docker 서비스 중지           |
| `pnpm run docker:prod` | 프로덕션 Docker 빌드 및 실행 |

## 스크립트 옵션

### setup.ps1

```powershell
.\scripts\setup.ps1 -SkipDocker    # Docker 없이 설정
.\scripts\setup.ps1 -SkipSeed      # 시드 데이터 없이 설정
```

### dev.ps1

```powershell
.\scripts\dev.ps1 -BackendOnly     # 백엔드만 실행
.\scripts\dev.ps1 -FrontendOnly    # 프론트엔드만 실행
.\scripts\dev.ps1 -SkipDocker      # Docker 없이 실행
```

### test-unit.ps1

```powershell
.\scripts\test-unit.ps1 -Watch              # 워치 모드
.\scripts\test-unit.ps1 -Filter "UserService" # 특정 테스트만
```

### build.ps1

```powershell
.\scripts\build.ps1 -Clean         # 클린 빌드
.\scripts\build.ps1 -BackendOnly   # 백엔드만 빌드
```

### docker-prod.ps1

```powershell
.\scripts\docker-prod.ps1 -Build   # 빌드만
.\scripts\docker-prod.ps1 -Up      # 시작만
.\scripts\docker-prod.ps1 -Down    # 중지
.\scripts\docker-prod.ps1 -Logs    # 로그 확인
.\scripts\docker-prod.ps1 -Clean   # 전체 정리
```

## 환경 변수

`.env.example` 파일을 `.env`로 복사하여 환경 변수를 설정하세요:

- `apps/backend/.env` - 백엔드 환경 변수
- `apps/frontend/.env.local` - 프론트엔드 환경 변수

## 접속 URL

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Prisma Studio**: http://localhost:5555
