# 시스템 아키텍처 문서

> 이 문서는 실제 구현된 시스템의 구조를 기술합니다.
> 설계 지침서는 [ARCHITECTURE.md](../ARCHITECTURE.md)를 참조하세요.

---

## 1. 시스템 개요

### 1.1 프로젝트 목적

수학 교육 플랫폼의 백엔드 엔진으로, 교육과정 관리, 문제 출제/채점, 학습 진도 추적, 게이미피케이션(XP/레벨/업적)을 제공합니다.

### 1.2 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | NestJS | ^10.4.0 |
| 언어 | TypeScript | ^5.7.0 |
| ORM | Prisma | ^5.22.0 |
| 데이터베이스 | MySQL (mysql2) | ^3.16.3 |
| 캐시 | Redis (ioredis) | ^5.4.1 |
| 인증 | Passport + JWT | ^10.0.3 / ^10.2.0 |
| OAuth | passport-google-oauth20 | ^2.0.0 |
| WebSocket | Socket.io | ^4.8.0 |
| 로깅 | Winston | ^3.17.0 |
| API 문서 | Swagger | ^7.4.0 |
| 보안 | Helmet | ^8.0.0 |
| 유효성 검사 | class-validator / class-transformer | ^0.14.1 / ^0.5.1 |
| 암호화 | AES-256-GCM (native crypto) | - |
| 날짜 | dayjs | ^1.11.13 |
| 스케줄링 | @nestjs/schedule | ^4.1.0 |
| 헬스체크 | @nestjs/terminus | ^10.2.3 |

### 1.3 핵심 설계 원칙 (7개 아키텍처 규칙)

| # | 규칙 | 설명 |
|---|------|------|
| 1 | 요청당 최대 3쿼리, 캐시 우선 | DB 조회 전 Redis 캐시 확인. `CACHE_KEYS`/`CACHE_TTL` 상수 사용 |
| 2 | console.log 금지 | 반드시 `LoggerService` 사용 (`logger.info()`, `logger.warn()`, `logger.error()`) |
| 3 | N+1 쿼리 금지 | Prisma `include`/`select` 활용, 루프 내 DB 호출 금지 |
| 4 | TODO 주석/무한 루프 금지 | 구현 완료 또는 명시적 종료 조건 설정 |
| 5 | UTC+0 저장, X-Timezone 헤더 변환 | DB에 UTC 저장, 응답 시 `@Timezone()` 데코레이터로 변환 |
| 6 | Soft Delete만 사용 | `deletedAt` 필드 설정. 물리 삭제 금지. `SOFT_DELETE_MODELS` 등록 |
| 7 | 모든 함수에 JSDoc | `src/user/user.service.ts`의 JSDoc 패턴 참조 |

---

## 2. 시스템 아키텍처 다이어그램

### 2.1 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                         클라이언트                                │
│           (Web Browser / Mobile App / API Consumer)              │
└───────────────┬──────────────────────┬──────────────────────────┘
                │ HTTP/HTTPS           │ WebSocket (Socket.io)
                ▼                      ▼
┌───────────────────────────┐  ┌──────────────────────┐
│      NestJS 서버          │  │   Socket.io 게이트웨이  │
│   (Express 플랫폼)        │  │  (JWT 핸드셰이크 인증)  │
├───────────────────────────┤  ├──────────────────────┤
│  Helmet (보안 헤더)        │  │  SocketAuthAdapter   │
│  CORS                     │  │  RoomManagerService  │
│  RateLimitMiddleware      │  │                      │
│  ValidationPipe (전역)     │  └──────────┬───────────┘
│  API Prefix: /api/v1      │             │
└───────────┬───────────────┘             │
            │                             │
            ▼                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        NestJS IoC 컨테이너                       │
│                                                                  │
│  ┌─────────────────── 전역 모듈 (@Global) ───────────────────┐   │
│  │ ConfigModule │ DatabaseModule │ LoggerModule               │   │
│  │ EncryptionModule │ TimezoneModule │ CacheModule            │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────── 기능 모듈 ─────────────────────────────┐   │
│  │ AuthModule   │ UserModule      │ CurriculumModule         │   │
│  │ ProblemModule│ AttemptModule   │ ProgressModule           │   │
│  │ AchievementModule                                         │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────── 지원 모듈 ─────────────────────────────┐   │
│  │ HealthModule │ SocketModule                                │   │
│  └────────────────────────────────────────────────────────────┘   │
└───────────┬─────────────────────────┬────────────────────────────┘
            │                         │
            ▼                         ▼
┌───────────────────┐     ┌───────────────────┐
│     MySQL          │     │      Redis         │
│  (Prisma ORM)      │     │   (ioredis)        │
│  - 데이터 영속성    │     │   - 세션 캐시      │
│  - Soft Delete     │     │   - Rate Limiting  │
│  - UUID PK         │     │   - 데이터 캐시    │
└───────────────────┘     └───────────────────┘
```

### 2.2 요청 처리 흐름

```
Client Request
  │
  ▼
Helmet (보안 헤더)
  │
  ▼
CORS 정책 확인
  │
  ▼
RateLimitMiddleware (Redis 슬라이딩 윈도우)
  │   - 일반: 100req/min
  │   - Auth: 10req/min
  ▼
ValidationPipe (whitelist + forbidNonWhitelisted + transform)
  │
  ▼
JwtAuthGuard (인증 필요 시)
  │   - JWT 서명 검증
  │   - 페이로드에서 userId/sessionId 추출
  ▼
TokenValidationGuard (로그아웃 등 민감 작업 시)
  │   - Redis에서 세션 유효성 검증
  │   - DB 폴백 검증
  ▼
Controller (@CurrentUser() 데코레이터로 사용자 정보 주입)
  │
  ▼
Service (비즈니스 로직)
  │   - 캐시 조회 → DB 폴백 → 캐시 저장
  │   - 에러 처리 (NotFoundException 등)
  ▼
Repository (Prisma 쿼리)
  │   - Soft Delete 미들웨어 자동 적용
  │   - deletedAt: null 조건 자동 주입
  ▼
Database (MySQL)
  │
  ▼
Response: { success: true, data } 또는 { success: false, error: { code, message } }
```

### 2.3 모듈 의존성 다이어그램

```
                    ┌──────────────────────────┐
                    │      AppModule (루트)      │
                    └─────────┬────────────────┘
                              │ imports
        ┌─────────────────────┼──────────────────────────┐
        │                     │                          │
   전역 모듈 (6개)        기능 모듈 (7개)           지원 모듈 (2개)
   ─────────────         ─────────────           ─────────────
   ConfigModule          AuthModule              HealthModule
   DatabaseModule        UserModule              SocketModule
   LoggerModule          CurriculumModule
   EncryptionModule      ProblemModule
   TimezoneModule        AttemptModule ──┐
   CacheModule           ProgressModule ─┤ forwardRef 순환 참조
                         AchievementModule┘

모듈 간 의존성:
  AttemptModule ──→ ProblemModule (문제 조회/채점)
  AttemptModule ←→ ProgressModule (forwardRef, 진도 갱신)
  AttemptModule ←→ AchievementModule (forwardRef, 통계/업적 갱신)
  AuthModule ──→ EncryptionModule (이메일 암호화)
  AuthModule ──→ DatabaseModule (세션 관리)
```

---

## 3. 모듈 구조

### 3.1 전역 모듈 (6개)

별도 `imports` 없이 어디서든 주입 가능합니다.

| 모듈 | 제공 서비스 | 역할 |
|------|------------|------|
| ConfigModule | ConfigService | 환경 변수 관리 (app, jwt, redis, database 설정) |
| DatabaseModule | PrismaService | Prisma ORM 연결, Soft Delete 미들웨어 적용 |
| LoggerModule | LoggerService | Winston 기반 로깅 (API/Socket/Error 3개 Transport) |
| EncryptionModule | EncryptionService | AES-256-GCM 암복호화 (이메일 등 민감 데이터) |
| TimezoneModule | TimezoneService | UTC 저장/변환, `@Timezone()` 데코레이터 |
| CacheModule | CacheService | Redis 래퍼 (get/set/del/incr/keys/exists) |

### 3.2 기능 모듈 (7개)

#### AuthModule

| 구성 요소 | 파일 | 역할 |
|-----------|------|------|
| AuthController | `auth.controller.ts` | Google OAuth, 토큰 갱신, 로그아웃 엔드포인트 |
| AuthService | `auth.service.ts` | JWT 발급/검증, 세션 관리, 탈취 감지 |
| GoogleStrategy | `strategies/google.strategy.ts` | Google OAuth 2.0 Passport 전략 |
| JwtStrategy | `strategies/jwt.strategy.ts` | JWT Bearer Passport 전략 |
| TokenValidationGuard | `guards/token-validation.guard.ts` | Redis 세션 검증 강화 Guard |

#### UserModule

| 구성 요소 | 파일 | 역할 |
|-----------|------|------|
| UserController | `user.controller.ts` | 프로필 CRUD (me 엔드포인트) |
| UserService | `user.service.ts` | 사용자 프로필 관리, 캐시 전략 적용 |
| UserRepository | `user.repository.ts` | Prisma 쿼리 (참조 구현) |

#### CurriculumModule

| 구성 요소 | 파일 | 역할 |
|-----------|------|------|
| CurriculumController | `curriculum.controller.ts` | 5계층 CRUD (17개 엔드포인트) |
| CurriculumService | `curriculum.service.ts` | 트리 조회, 계층적 캐시 무효화 |
| CurriculumRepository | `curriculum.repository.ts` | 4단계 중첩 include 조회 |

#### ProblemModule

| 구성 요소 | 파일 | 역할 |
|-----------|------|------|
| ProblemController | `problem.controller.ts` | 문제 CRUD + 필터/페이지네이션 |
| ProblemService | `problem.service.ts` | 문제 관리, 통계 업데이트 |
| ProblemRepository | `problem.repository.ts` | 복합 필터 조건 쿼리 |

#### AttemptModule

| 구성 요소 | 파일 | 역할 |
|-----------|------|------|
| AttemptController | `attempt.controller.ts` | 답안 제출, 풀이 이력 조회 |
| AttemptService | `attempt.service.ts` | 자동 채점, 통계/진도/업적 자동 갱신 |
| AttemptRepository | `attempt.repository.ts` | 시도 이력 쿼리, 통계 집계 |

#### ProgressModule

| 구성 요소 | 파일 | 역할 |
|-----------|------|------|
| ProgressController | `progress.controller.ts` | 학습 진도 조회 (me 엔드포인트) |
| ProgressService | `progress.service.ts` | 진도 자동 갱신 (upsert), 숙달도 계산 |
| ProgressRepository | `progress.repository.ts` | UserProgress upsert 쿼리 |

#### AchievementModule

| 구성 요소 | 파일 | 역할 |
|-----------|------|------|
| AchievementController | `achievement.controller.ts` | 업적/통계 조회 및 업적 정의 생성 |
| AchievementService | `achievement.service.ts` | XP/레벨/스트릭 계산, 업적 조건 평가 |
| AchievementRepository | `achievement.repository.ts` | UserStats upsert, UserAchievement 관리 |

### 3.3 지원 모듈 (2개)

| 모듈 | 역할 |
|------|------|
| HealthModule | Database + Redis 상태 확인 (기본/상세 2개 엔드포인트) |
| SocketModule | Socket.io WebSocket 게이트웨이, 룸 관리, 실시간 알림 |

---

## 4. 데이터 모델 (ERD)

### 4.1 전체 관계도

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           사용자 도메인                                   │
│                                                                          │
│  ┌──────────┐     ┌──────────────┐                                      │
│  │   User   │────<│ UserSession  │  1:N (세션 관리)                      │
│  │          │     └──────────────┘                                      │
│  │  - id    │                                                            │
│  │  - email │     ┌──────────────┐                                      │
│  │  - name  │────<│  UserStats   │  1:1 (통계)                           │
│  │  - googleId    └──────────────┘                                      │
│  │          │                                                            │
│  │          │     ┌──────────────────┐     ┌─────────────┐              │
│  │          │────<│ UserAchievement  │>────│ Achievement │  N:M (업적)   │
│  │          │     └──────────────────┘     └─────────────┘              │
│  │          │                                                            │
│  │          │     ┌──────────────────┐                                   │
│  │          │────<│  UserProgress    │  1:N (학습 진도, 토픽별 고유)       │
│  │          │     └───────┬──────────┘                                   │
│  │          │             │                                              │
│  │          │     ┌───────────────────────┐                              │
│  │          │────<│ UserProblemAttempt    │  1:N (풀이 시도)              │
│  └──────────┘     └───────┬──────────────┘                              │
│                           │                                              │
└───────────────────────────┼──────────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────────────┐
│                     문제 도메인                                          │
│                           │                                              │
│  ┌────────────┐           │                                              │
│  │  Problem   │>──────────┘  N:1 (문제 ← 풀이 시도)                      │
│  │            │                                                          │
│  │ - content  │     ┌─────────────────────┐                              │
│  │ - type     │>────│ LearningObjective   │  N:1 (선택적 연결)           │
│  │ - answer   │     └─────────────────────┘                              │
│  │ - solution │                 ▲                                        │
│  │ - difficulty               │                                        │
│  └─────┬──────┘               │                                        │
│        │                      │                                         │
│        ▼                      │                                         │
└────────┼──────────────────────┼─────────────────────────────────────────┘
         │                      │
┌────────┼──────────────────────┼─────────────────────────────────────────┐
│        │           교육과정 도메인                                        │
│        │                      │                                          │
│  ┌─────┴──────┐         ┌─────┴───────────────┐                         │
│  │   Topic    │────────<│ LearningObjective   │  1:N                    │
│  │  (소단원)   │         └─────────────────────┘                         │
│  └─────┬──────┘                                                         │
│        ▲                                                                │
│        │ N:1                                                            │
│  ┌─────┴──────┐                                                         │
│  │  Section   │  (중단원)                                                │
│  └─────┬──────┘                                                         │
│        ▲                                                                │
│        │ N:1                                                            │
│  ┌─────┴──────┐                                                         │
│  │  Chapter   │  (대단원)                                                │
│  └─────┬──────┘                                                         │
│        ▲                                                                │
│        │ N:1                                                            │
│  ┌─────┴──────┐                                                         │
│  │ Curriculum │  (교육과정: 학년+학기)                                    │
│  └────────────┘                                                         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 교육과정 계층 구조

```
Curriculum (교육과정)
  ├── grade: 학년
  ├── semester: 학기
  └── chapters: Chapter[]
        ├── name: 대단원명
        └── sections: Section[]
              ├── name: 중단원명
              └── topics: Topic[]
                    ├── name: 소단원명
                    └── objectives: LearningObjective[]
                          ├── description: 학습목표 설명
                          └── bloomLevel: 블룸 분류 (REMEMBER~CREATE)
```

### 4.3 문제 유형 (Enum)

| ProblemType | 설명 | 자동 채점 |
|-------------|------|-----------|
| MULTIPLE_CHOICE | 객관식 | JSON 일치 비교 |
| SHORT_ANSWER | 단답형 | 문자열 trim+lowercase 비교 |
| TRUE_FALSE | 참/거짓 | JSON 일치 비교 |
| FILL_IN_BLANK | 빈칸 채우기 | 문자열 trim+lowercase 비교 |
| ESSAY | 서술형 | 수동 채점 (null 반환) |

### 4.4 블룸 분류 (Enum)

| BloomLevel | 한글명 |
|------------|--------|
| REMEMBER | 기억 |
| UNDERSTAND | 이해 |
| APPLY | 적용 |
| ANALYZE | 분석 |
| EVALUATE | 평가 |
| CREATE | 창조 |

### 4.5 Soft Delete 적용 모델 (13개)

```
User, UserSession, Curriculum, Chapter, Section, Topic,
LearningObjective, Problem, UserProblemAttempt, UserProgress,
Achievement, UserAchievement, UserStats
```

---

## 5. API 엔드포인트 레퍼런스

모든 엔드포인트의 기본 경로: `/api/v1`

### 5.1 인증 (`/auth`)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/auth/google` | - | Google OAuth 로그인 페이지 리다이렉트 |
| GET | `/auth/google/callback` | - | Google OAuth 콜백 (JWT 토큰 발급) |
| POST | `/auth/refresh` | - | Refresh Token으로 토큰 페어 갱신 |
| POST | `/auth/logout` | JWT + TokenValidation | 단일/전체 세션 로그아웃 |
| POST | `/auth/dev/signup` | - | 개발모드 이메일 회원가입 |
| POST | `/auth/dev/login` | - | 개발모드 이메일 로그인 |

### 5.2 사용자 (`/users`)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/users/me` | JWT | 내 프로필 조회 |
| PATCH | `/users/me` | JWT | 내 프로필 수정 (name, picture) |
| DELETE | `/users/me` | JWT | 내 계정 삭제 (Soft Delete) |
| POST | `/users/restore` | - | 삭제된 계정 복원 |

### 5.3 교육과정 (`/curricula`, `/chapters`, `/sections`, `/topics`, `/objectives`)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/curricula` | JWT | 교육과정 생성 |
| GET | `/curricula` | - | 교육과정 목록 (?grade=&semester=) |
| GET | `/curricula/:id` | - | 교육과정 상세 (트리 구조 포함) |
| PATCH | `/curricula/:id` | JWT | 교육과정 수정 |
| DELETE | `/curricula/:id` | JWT | 교육과정 삭제 |
| POST | `/curricula/:id/chapters` | JWT | 챕터 생성 |
| PATCH | `/chapters/:id` | JWT | 챕터 수정 |
| DELETE | `/chapters/:id` | JWT | 챕터 삭제 |
| POST | `/chapters/:id/sections` | JWT | 섹션 생성 |
| PATCH | `/sections/:id` | JWT | 섹션 수정 |
| DELETE | `/sections/:id` | JWT | 섹션 삭제 |
| POST | `/sections/:id/topics` | JWT | 토픽 생성 |
| PATCH | `/topics/:id` | JWT | 토픽 수정 |
| DELETE | `/topics/:id` | JWT | 토픽 삭제 |
| POST | `/topics/:id/objectives` | JWT | 학습목표 생성 |
| PATCH | `/objectives/:id` | JWT | 학습목표 수정 |
| DELETE | `/objectives/:id` | JWT | 학습목표 삭제 |

### 5.4 문제 (`/problems`)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/problems` | JWT | 문제 생성 |
| GET | `/problems` | - | 문제 목록 (필터 + 페이지네이션) |
| GET | `/problems/:id` | - | 문제 상세 (answer, solution 포함) |
| PATCH | `/problems/:id` | JWT | 문제 수정 |
| DELETE | `/problems/:id` | JWT | 문제 삭제 |

문제 목록 필터 파라미터: `topicId`, `objectiveId`, `difficultyMin`, `difficultyMax`, `type`, `page`, `limit`

### 5.5 풀이 시도 (`/attempts`)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/attempts` | JWT | 답안 제출 (자동 채점) |
| GET | `/attempts/me` | JWT | 내 풀이 이력 (페이지네이션) |
| GET | `/attempts/me/problems/:problemId` | JWT | 특정 문제 내 풀이 이력 |

### 5.6 학습 진도 (`/progress`)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/progress/me` | JWT | 내 전체 학습 진도 |
| GET | `/progress/me/topics/:topicId` | JWT | 특정 토픽 학습 진도 |

### 5.7 업적/통계 (`/achievements`, `/stats`)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/achievements` | JWT | 업적 정의 생성 (관리자) |
| GET | `/achievements` | - | 전체 업적 목록 |
| GET | `/achievements/me` | JWT | 내가 달성한 업적 |
| GET | `/stats/me` | JWT | 내 통계 (XP, 레벨, 스트릭 등) |

### 5.8 헬스체크 (`/health`)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/health` | - | 기본 헬스체크 (Database + Redis) |
| GET | `/health/detailed` | - | TerminusModule 상세 헬스체크 |

---

## 6. 인증 플로우

### 6.1 Google OAuth 2.0 로그인 흐름

```
1. 클라이언트 → GET /auth/google
2. 서버 → Google OAuth 페이지로 리다이렉트
3. 사용자 → Google에서 인증 완료
4. Google → GET /auth/google/callback (인증 코드 전달)
5. GoogleStrategy → 프로필 검증 및 추출
6. AuthService.handleGoogleLogin():
   a. googleId로 기존 유저 검색
   b. 미존재 시 → email 중복 확인 → 유저 생성
   c. 기존 세션 무효화 (동시 접속 제한)
   d. 새 세션 생성
   e. JWT 토큰 페어 발급 (Access + Refresh)
   f. Refresh Token SHA-256 해시 → DB 저장
   g. 유저 정보 → Redis 캐싱
7. 클라이언트 ← { user, tokens, isNewUser }
```

### 6.2 토큰 전략

| 토큰 | 만료 시간 | 용도 |
|------|-----------|------|
| Access Token | 1시간 (3600초) | API 인증 (Bearer) |
| Refresh Token | 30일 (2592000초) | 토큰 페어 갱신 |

### 6.3 Refresh Token Rotation (탈취 감지)

```
1. 클라이언트 → POST /auth/refresh { refreshToken }
2. 서버 → JWT 서명 검증
3. 서버 → sessionId로 DB 세션 조회
4. 서버 → 토큰 SHA-256 해시 ↔ DB 저장 해시 상수 시간 비교
   ├── 일치: 새 토큰 페어 발급, 새 해시로 DB 업데이트
   └── 불일치 (탈취 감지):
       └── 해당 유저의 모든 세션 무효화
       └── UnauthorizedException 반환
```

### 6.4 동시 접속 제한

- `MAX_DEVICES_PER_USER` 설정 (기본값: 1)
- 새 로그인 시 기존 활성 세션을 모두 무효화
- 무효화된 세션은 Redis에 `session_invalid:{sessionId}` 플래그 설정
- 0으로 설정하면 무제한 허용

### 6.5 WebSocket JWT 핸드셰이크 인증

```
1. 클라이언트 → Socket.io 연결 (handshake.auth.token = JWT)
2. SocketAuthAdapter.authenticate():
   a. JWT 서명 검증
   b. 페이로드에서 userId, sessionId 추출
   c. socket.data에 인증 정보 저장
3. 인증 성공 → 기본 룸 자동 참가 (user:{userId}, broadcast:all)
4. 인증 실패 → socket.disconnect()
```

---

## 7. 캐시 전략

### 7.1 캐시 키/TTL 전체 목록

| 키 패턴 | TTL | 용도 |
|---------|-----|------|
| `user_info:{userId}` | 1시간 | 사용자 프로필 정보 |
| `user_session:{userId}` | 1시간 | 사용자 세션 정보 |
| `refresh_token:{tokenHash}` | 30일 | 리프레시 토큰 |
| `rate_limit:{userId}:{endpoint}` | 1분 | Rate Limiting 카운터 |
| `socket_room:{roomId}` | - | Socket.io 룸 정보 |
| `session:{sessionId}` | 30일 | 세션 데이터 |
| `session_invalid:{sessionId}` | 24시간 | 무효화된 세션 플래그 |
| `curriculum:{curriculumId}` | 24시간 | 교육과정 상세 (트리 포함) |
| `curriculum_list:{grade}:{semester}` | 24시간 | 교육과정 목록 |
| `problem:{problemId}` | 1시간 | 문제 상세 |
| `problem_list:{topicId}` | 1시간 | 토픽별 문제 목록 |
| `user_progress:{userId}:{topicId}` | 30분 | 사용자 토픽별 학습 진도 |
| `user_stats:{userId}` | 30분 | 사용자 통계 (XP, 레벨, 스트릭) |
| `user_achievements:{userId}` | 1시간 | 사용자 달성 업적 목록 |

### 7.2 캐시 우선 조회 패턴

```typescript
// 1. 캐시 조회
const cacheKey = CACHE_KEYS.XXX(id);
const cached = await this.cacheService.get<T>(cacheKey);
if (cached) return cached;

// 2. DB 폴백
const data = await this.repository.findById(id);
if (!data) throw new NotFoundException(...);

// 3. 캐시 저장
await this.cacheService.set(cacheKey, data, CACHE_TTL.XXX);
return data;
```

### 7.3 캐시 무효화 전략

**Write-Through**: 데이터 변경(생성/수정/삭제) 시 즉시 해당 캐시 삭제

**계층적 무효화 (교육과정)**:
```
Topic 변경 시:
  → section → chapter → curriculum 경로를 따라 상위 캐시 무효화
  → curriculum_list:* 패턴 매칭으로 목록 캐시도 무효화
```

**통계/업적 무효화**:
```
Attempt 제출 후:
  → user_stats:{userId} 삭제
  → user_achievements:{userId} 삭제
  → user_progress:{userId}:{topicId} 삭제
```

### 7.4 Rate Limiting (슬라이딩 윈도우)

| 대상 | 제한 | 윈도우 |
|------|------|--------|
| 일반 API | 100 요청 | 1분 |
| Auth 엔드포인트 | 10 요청 | 1분 |

Redis의 슬라이딩 윈도우 알고리즘으로 구현되며, `RateLimitMiddleware`가 `app.module.ts`에서 모든 라우트(`*`)에 전역 적용됩니다.

---

## 8. 실시간 통신 (Socket.io)

### 8.1 WebSocket 이벤트 목록

**클라이언트 → 서버 (수신 이벤트)**

| 이벤트 | 페이로드 | 설명 |
|--------|----------|------|
| `room:join` | `{ roomId: string }` | 룸 참가 |
| `room:leave` | `{ roomId: string }` | 룸 퇴장 |
| `chat:send` | `{ roomId: string, content: string }` | 채팅 메시지 전송 |
| `ping` | - | 연결 상태 확인 |

**서버 → 클라이언트 (발신 이벤트)**

| 이벤트 | 페이로드 | 설명 |
|--------|----------|------|
| `connected` | `{ socketId, userId, rooms }` | 연결 성공 알림 |
| `room:user_joined` | `{ roomId, userId, socketId, timestamp }` | 룸 참가 알림 |
| `room:user_left` | `{ roomId, userId, socketId, timestamp }` | 룸 퇴장 알림 |
| `chat:message` | `{ messageId, roomId, userId, content, timestamp }` | 채팅 메시지 수신 |
| `notification` | `{ type, title, message, data?, timestamp }` | 알림 수신 |
| `force_logout` | `{ reason, newDeviceInfo, timestamp }` | 강제 로그아웃 |

### 8.2 룸 관리 전략

| 룸 유형 | 패턴 | 설명 |
|---------|------|------|
| user | `user:{userId}` | 개인 룸 (자동 참가, 퇴장 불가) |
| broadcast | `broadcast:all` | 전체 브로드캐스트 (자동 참가, 퇴장 불가) |
| group | `group:{groupId}` | 그룹 룸 |
| channel | `channel:{channelId}` | 채널 룸 |

룸 ID 형식 검증: `(group|channel|user|broadcast):[a-zA-Z0-9_-]+`

---

## 9. 횡단 관심사

### 9.1 로깅

Winston 기반 3개 Transport로 로그를 분리합니다.

| Transport | 파일 | 대상 |
|-----------|------|------|
| API Transport | `logs/api-*.log` | HTTP 요청/응답 로그 |
| Socket Transport | `logs/socket-*.log` | WebSocket 이벤트 로그 |
| Error Transport | `logs/error-*.log` | 에러 로그 (error 레벨) |

일별 로테이션(`winston-daily-rotate-file`) 적용.

### 9.2 암호화

- **알고리즘**: AES-256-GCM (native crypto)
- **대상**: 이메일 등 민감 데이터
- **저장 형식**: `{iv}:{authTag}:{encrypted}` (Base64)
- **서비스**: `EncryptionService.encrypt()` / `decrypt()`

### 9.3 타임존

- **저장**: 모든 날짜/시간을 UTC+0으로 DB에 저장
- **변환**: 클라이언트의 `X-Timezone` 요청 헤더를 읽어 응답 시 변환
- **데코레이터**: `@Timezone()` 파라미터 데코레이터로 타임존 문자열 주입
- **인터셉터**: `TimezoneInterceptor`가 응답 내 날짜 필드를 자동 변환

### 9.4 에러 처리

`HttpExceptionFilter`가 모든 예외를 표준 응답 형식으로 변환합니다.

```typescript
// 표준 에러 응답 형식
{
  "success": false,
  "error": {
    "code": "AUTH_001",      // 에러 코드
    "message": "설명 메시지"  // 사용자 친화적 메시지
  }
}
```

에러 코드 체계:

| HTTP | 코드 | 의미 |
|------|------|------|
| 400 | REQ_001 | 잘못된 요청 |
| 401 | AUTH_001 | 인증 실패 |
| 403 | PERM_001 | 권한 없음 |
| 404 | NOT_001 | 리소스 없음 |
| 409 | REQ_002 | 충돌 (중복 데이터) |
| 422 | REQ_003 | 처리 불가 엔티티 |
| 429 | RATE_001 | Rate Limit 초과 |
| 500 | SRV_001 | 서버 내부 에러 |

### 9.5 Soft Delete

Prisma 미들웨어(`soft-delete.middleware.ts`)로 전역 적용됩니다.

**조회 시**: `deletedAt: null` 조건 자동 주입 (이미 `deletedAt` 조건이 있으면 유지)
**삭제 시**: `delete` → `update { deletedAt: new Date() }`로 자동 전환

`SOFT_DELETE_MODELS` 배열에 등록된 13개 모델에만 적용됩니다.
미등록 모델은 물리 삭제가 수행되므로, 새 모델 추가 시 반드시 등록해야 합니다.

---

## 10. 핵심 비즈니스 로직

### 10.1 자동 채점 플로우

```
답안 제출 (POST /attempts)
  │
  ▼
1. 문제 조회 (ProblemService.findById)
  │
  ▼
2. 자동 채점 (AttemptService.grade)
  │  - MULTIPLE_CHOICE/TRUE_FALSE: JSON 일치 비교
  │  - SHORT_ANSWER/FILL_IN_BLANK: trim+lowercase 문자열 비교
  │  - ESSAY: null 반환 (수동 채점)
  │
  ▼
3. 시도 횟수 조회 및 저장 (attemptNumber 자동 증가)
  │
  ▼
4. Problem 통계 업데이트
  │  - solveCount: 총 시도 수
  │  - correctRate: 정답률 (correct / total)
  │
  ▼
5. UserProgress 업데이트 (ProgressService.updateProgress)
  │  - problemsSolved++
  │  - 정답이면 correctCount++
  │  - masteryLevel = correctCount / problemsSolved
  │
  ▼
6. UserStats 업데이트 (AchievementService.updateStatsAfterAttempt)
  │  - totalProblemsSolved++
  │  - totalStudyTime += timeTaken
  │  - XP: 정답 +10, 오답 +2
  │  - level = floor(totalXp / 100) + 1
  │  - 스트릭: 일별 첫 풀이 시 currentStreak++ (1일 넘기면 리셋)
  │
  ▼
7. 업적 조건 확인 (AchievementService.checkAchievements)
     - 미달성 업적의 조건 평가
     - 조건 충족 시 업적 부여 + XP 보상 지급
```

### 10.2 게이미피케이션

**XP 시스템**:
- 정답: +10 XP
- 오답: +2 XP
- 업적 달성: 업적별 `xpReward` XP

**레벨 시스템**:
- `level = floor(totalXp / 100) + 1`
- 100 XP마다 1레벨 상승

**스트릭 시스템**:
- 매일 첫 문제 풀이 시 `currentStreak++`
- 1일 이상 간격이 벌어지면 `currentStreak = 1`로 리셋
- `longestStreak`는 최대값 갱신

**업적 조건 평가**:
- Achievement의 `condition` JSON 필드로 조건 정의
- 지원 조건: `totalProblemsSolved`, `currentStreak`, `level`, `totalXp`
- 여러 조건은 AND 로직으로 평가

### 10.3 교육과정 트리 조회

`GET /curricula/:id`는 4단계 중첩 `include`로 전체 트리를 반환합니다.

```typescript
// Prisma 쿼리 구조
{
  include: {
    chapters: {
      include: {
        sections: {
          include: {
            topics: {
              include: {
                objectives: true
              }
            }
          }
        }
      }
    }
  }
}
```

트리 결과는 `curriculum:{id}` 키로 24시간 캐싱됩니다.
하위 엔티티(Chapter, Section, Topic, Objective) 변경 시 상위 Curriculum 캐시가 계층적으로 무효화됩니다.
