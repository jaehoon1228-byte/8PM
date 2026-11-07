<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# MES

## 소개

이 프로젝트는 사용자에게 AI 챗봇을 이용하여 파일 기반 답변 (RAG)을 제공하는 프로젝트다.

### Stacks

- TypeScript
- Next.js
- Zustand
- ky

## 구조

- `/app`: 웹페이지 라우트
- `/components`: React 컴포넌트
- `/utils`: 비-React 컴포넌트 코드
- `/types`: TypeScript 타입 정의

## 규칙

- 코드 컨벤션은 `code-conventions` 스킬을 따른다.
- 기존 코드를 먼저 읽고 변경 목적과 영향 범위를 파악한다.
- 외부 시스템에 실제 요청을 보내거나 데이터를 전송하는 작업은
  실행 전에 대상, 목적, 전송 데이터 및 부작용을 확인하고 승인을 받는다.
    - 비밀 정보, 개인정보 및 프로젝트 소스 코드를 외부로 전송하지 않는다.
    - 빌드 및 테스트에 필요한 네트워크 접근은 기존 프로젝트 설정과
      실행 환경의 권한 정책을 따른다.
    - 외부 API 호출이 필요한 테스트는 기존 테스트 설정과 테스트 대상을
      확인하고, 실제 데이터 변경이나 비용 발생 가능성을 검토한다.
- 파일을 직접 삭제하지 않는다. 삭제가 필요하면 대상 파일과 이유를 사용자에게 알리고, 사용자가 직접 삭제하도록 요청한다.
- 작업 전 비슷한 역할을 하는 코드가 있는지 미리 확인한다.
- 요청한 범위 밖의 코드는 수정하지 않는다.
- 기존 코드의 코딩 스타일을 따른다.

### Git & GitHub

- `git-rules` 스킬을 읽는다.

### TypeScript

- `ts-rules` 스킬을 읽는다.

### React & Next.js

- `react-next-rules` 스킬을 읽는다.

## 검증

- 각 작업이 끝난 후에는 `validating` 스킬을 읽는다.
