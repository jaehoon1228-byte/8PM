# MES AI ChatBot FrontEnd

> **제조실행시스템(MES) 데이터 기반 엔터프라이즈 AI 챗봇 웹 플랫폼**  
> 사내 문서 및 MES 데이터를 기반으로 RAG(검색 증강 생성) 기반 AI 답변을 제공하는 웹 애플리케이션 프론트엔드입니다.

---

## 📌 목차
- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [디렉터리 구조](#-디렉터리-구조)
- [환경 변수 설정](#-환경-변수-설정)
- [시작하기](#-시작하기)
- [Docker 실행 가이드](#-docker-실행-가이드)
- [개발 및 아키텍처 특징](#-개발-및-아키텍처-특징)

---

## 💡 프로젝트 소개

**MES AI ChatBot**은 제조 현장의 복잡한 문서와 데이터를 AI 모델과 연동하여 작업자 및 관리자가 신속하게 필요한 정보를 질의하고 조회할 수 있도록 돕는 엔터프라이즈 RAG 기반 챗봇 서비스입니다.

- **안전한 인증 체계**: 사원번호와 회사 코드를 기반으로 한 계정 관리 및 역할 기반 권한 제어(RBAC)
- **효율적인 대화형 UI**: 세션별 대화 관리, 과거 이력 조회, RAG 기반 질의응답
- **문서 관리 및 RAG 연계**: 사내 공용 및 개인별 매뉴얼/데이터 파일 업로드 및 관리
- **관리자 전용 대시보드**: 사원 관리, 사내 전체 공유 파일 관리 지원
- **SSR + CSR 하이브리드 아키텍처**: Next.js App Router를 활용하여 안전한 서버 사이드 사전 인증 검증과 빠른 초기 화면 렌더링을 제공

---

## 🚀 주요 기능

### 1. 사용자 인증 및 계정 관리
- **로그인 & 회원가입**: 사원번호, 회사 식별자(companyId), 이메일, 역할을 포함한 가입 및 JWT 인증
- **토큰 자동 관리**: HttpOnly 쿠키 기반 토큰 저장 및 자동 Refresh 인터셉터(`ky`) 탑재
- **비밀번호 재설정**: 등록된 이메일 기반 비밀번호 초기화 요청 플로우 제공
- **역할 기반 접근 제어 (RBAC)**:
  - `ROLE_USER`: 일반 사용자 (대화방 생성, 챗봇 질의, 개인 파일 업로드)
  - `ROLE_MANAGER`: 중간 관리자 (사원 목록 조회, 사원 관리, 공용 파일 관리)
  - `ROLE_MASTER`: 최고 관리자 (전체 권한)

### 2. 메인 대시보드 (`/`)
- **3-컬럼 반응형 레이아웃**:
  - **좌측 (Chat Sidebar)**: 대화방(Session) 생성, 목록 조회, 세션 삭제
  - **중앙 (Chat Panel)**: 메시지 타임라인, 과거 대화 이력 지연 로딩(On-demand Fetching), 메시지 전송 및 실시간 챗봇 응답 대기 상태
  - **우측 (Profile & File List)**:
    - 사용자 정보 요약 및 관리자 페이지 바로가기
    - 업로드된 문서/파일 목록 조회, 파일 업로드, 파일 삭제
- **사용자 환경설정 모달**:
  - 다크 모드 / 라이트 모드 전환 (Tailwind CSS v4 테마 연동)
  - 알림 설정 관리 (LocalStorage 영속화)

### 3. 관리자 대시보드 (`/admin`)
- **접근 보안**: 중간 관리자(`ROLE_MANAGER`) 이상 권한만 접근 가능 (비인가자 접근 시 SSR 레벨에서 사전 차단)
- **사원 관리 탭**:
  - 소속 회사 사원 목록 조회
  <!-- - 사원 권한(Role) 즉각 변경 -->
  - 퇴사 사원 또는 대상 계정 삭제
- **사내 파일 관리 탭**:
  - 사내 전체 공유 파일 목록 및 사원별 업로드 파일 현황 통합 모니터링 및 삭제

---

## 🛠 기술 스택

### Core & Framework
| 기술 | 설명 |
| :--- | :--- |
| **Next.js 16** | App Router, Server Components(SSR) 기반 하이브리드 렌더링, Standalone 모드 지원 |
| **React 19** | 최신 React 라이브러리 |
| **TypeScript 6** | 엄격한 타입 안정성 보장 |

### State Management & Data Fetching
| 기술 | 설명 |
| :--- | :--- |
| **Zustand 5** | 전역 상태 관리 (채팅 세션, 파일 목록, 환경설정 스토어) |
| **Ky 2** | 가볍고 강력한 Fetch 기반 HTTP 클라이언트 (JWT 리프레시 인터셉터 구성) |

### Styling & UI
| 기술 | 설명 |
| :--- | :--- |
| **Tailwind CSS v4** | 최신 유틸리티 퍼스트 CSS 프레임워크 |
| **Lucide React** | 모던하고 일관된 아이콘 시스템 |
| **Pretendard GOV** | 국문/영문 가독성을 위한 가변 폰트 적용 |

---

## 📁 디렉터리 구조

```text
├── app/
│   ├── layout.tsx              # 공통 루트 레이아웃 (Pretendard 폰트, 테마 스크립트)
│   ├── page.tsx                # 메인 대시보드 페이지 (SSR 데이터 프리페치 및 리다이렉트)
│   ├── admin/                  # 관리자 전용 대시보드 라우트 (/admin)
│   ├── login/                  # 로그인 페이지 (/login)
│   ├── register/               # 사원 회원가입 페이지 (/register)
│   ├── reset-pw/               # 비밀번호 재설정 페이지 (/reset-pw, /reset-pw/success)
│   ├── settings/               # 환경설정 페이지 (/settings)
│   └── api/v1/                 # Next.js Route Handlers (BFF 프록시 & 로컬 Mock API)
│       ├── chat/               # 대화방 및 질의응답 Mock/Proxy
│       ├── files/              # 파일 업로드 및 삭제 Mock/Proxy
│       ├── jwt/                # JWT 토큰 재발급
│       ├── login/ & logout/    # 인증 처리
│       └── users/              # 사용자 정보 및 사원 관리 Mock/Proxy
├── components/
│   ├── dashboard/              # 대시보드 서브 컴포넌트 (ChatPanel, ChatSidebar, FileListPanel 등)
│   ├── admin/                  # 관리자 콘솔 컴포넌트 (AdminDashboard)
│   ├── DashboardForm.tsx       # 대시보드 메인 클라이언트 컨테이너
│   ├── LoginForm.tsx           # 로그인 폼
│   ├── RegisterForm.tsx        # 회원가입 폼
│   ├── PasswordResetForm.tsx   # 비밀번호 재설정 폼
│   └── UserProfile.tsx         # 사용자 프로필 카드
├── types/
│   └── dashboard.ts            # 백엔드 DTO 매핑 및 프론트엔드 UI 데이터 타입 정의
├── utils/
│   ├── api.ts                  # 클라이언트 공용 Ky HTTP 인스턴스 (인터셉터)
│   ├── serverApi.ts            # 서버 컴포넌트 전용 SSR API 호출 유틸
│   ├── dashboardApi.ts         # 대시보드 전용 클라이언트 API 메서드
│   ├── endpoints.ts            # API 경로 및 DTO-UI 변환 함수
│   ├── mockStore.ts            # 백엔드 미연결 시 로컬 개발용 인메모리 Mock 스토어
│   ├── preferences.ts          # 테마 및 사용자 설정 쿠키/스토리지 유틸
│   ├── role.ts                 # 사용자 권한 검증 유틸 (isManagerOrAbove 등)
│   ├── time.ts                 # 날짜/시간 파싱 포맷팅 유틸
│   └── store/                  # Zustand 전역 스토어 모음
│       ├── chatSessionStore.ts # 채팅 세션 및 메시지 상태 관리
│       ├── fileStore.ts        # 파일 목록 상태 관리
│       ├── preferenceStore.ts  # 테마 및 글꼴 크기 설정 스토어
│       └── resetStores.ts      # 로그아웃 시 스토어 일괄 초기화
├── Dockerfile                  # 멀티스테이지 프로덕션 배포용 Dockerfile
└── package.json
```

---

## ⚙️ 환경 변수 설정

프로젝트 루트의 `.env.development` 또는 `.env.local` 파일에서 백엔드 대상을 지정할 수 있습니다.

```env
# 1. 로컬 Mock API 모드로 실행할 경우 (Next.js 내부 Route Handler 활용):
NEXT_PUBLIC_BACKEND_HOST=http://localhost:3000

# 2. 실제 백엔드(Spring Boot) 서버와 연동할 경우:
# NEXT_PUBLIC_BACKEND_HOST=http://localhost:8080
```

> **참고**: `http://localhost:3000`으로 설정 시 `/app/api/v1/*`에 구현된 내장 Mock API와 `mockStore.ts`를 통해 백엔드 서버가 구동되어 있지 않아도 로그인, 대화, 파일 업로드, 사원 관리 등 모든 핵심 시나리오를 직접 테스트할 수 있습니다.

---

## 💻 시작하기

### 요구 사항
- **Node.js**: v26 이상 필수
- **패키지 매니저**: npm (또는 pnpm, yarn)

### 의존성 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 결과를 확인합니다.

### 빌드 및 실행
```bash
# 프로덕션 빌드
npm run build

# 빌드 결과물 실행
npm run start
```

### 코드 품질 및 포맷팅 검사
```bash
# ESLint 정적 분석
npm run lint

# TypeScript 타입 검사
npm run typecheck

# Prettier 코드 자동 포맷팅
npm run fmt
```

---

## 🐳 Docker 실행 가이드

멀티스테이지 빌드를 통해 최적화된 경량 컨테이너 이미지를 빌드하고 실행할 수 있습니다.

### Docker 이미지 빌드
```bash
docker build --build-arg BACKEND_HOST=http://localhost:8080 -t mes-frontend:latest .
```

### Docker 컨테이너 실행
```bash
docker run -d -p 3000:3000 --name mes-frontend mes-frontend:latest
```

---

## 🔍 개발 및 아키텍처 특징

1. **SSR 기반 사전 보안 차단 및 초기 데이터 주입**
   - 메인 대시보드 및 관리자 페이지 접속 시 Next.js Server Component에서 HttpOnly 쿠키의 세션을 검증합니다.
   - 만료된 세션은 즉시 `/login`으로 리다이렉트하며, 관리자 권한이 부족한 사원은 404 페이지로 라우팅하여 클라이언트 렌더링 이전에 접근을 차단합니다.
   - 사용자 정보, 세션 목록, 파일 목록을 서버에서 병렬 페치하여 클라이언트로 주입하므로 깜빡임 없는 초기 렌더링을 보장합니다.

2. **완전 독립형 Mock API 환경 제공**
   - 백엔드 개발 일정과 무관하게 독립적으로 UI/UX 및 기능 검증을 진행할 수 있도록 `/app/api/v1/...`에 인메모리 Mock 데이터 핸들러를 구축하였습니다.

3. **신뢰성 높은 날짜/시간 제어**
   - 최신 ECMAScript 표준 지향에 맞춘 날짜/시간 파싱 유틸(`time.ts`)을 적용하여 안정적인 타임스탬프 처리를 수행합니다.
