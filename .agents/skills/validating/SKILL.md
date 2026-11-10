---
name: validating
description: 코드의 정상 작동을 확인하는 최소한의 가이드. 코드를 작성하고 난 뒤 읽는다.
---

# 검증 지침

## 1단계: 검사

- ESLint와 TypeScript 타입 검사를 실행한다.
    - ESLint: `npm run lint`
    - TypeScript: `npm run typecheck`
- 이번 작업으로 발생한 오류는 수정한 후 검사를 다시 실행한다.
- 기존 코드에서 발생한 오류는 요청 범위 밖에서 임의로 수정하지 않는다.
    - 기존 오류가 작업 결과에 영향을 주면 발생 위치와 영향을 사용자에게 보고한다.
- 검사를 실행할 수 없거나 완료하지 못한 경우 그 이유를 보고한다.
- 실행하지 않은 검사를 통과했다고 보고하지 않는다.

## 2단계: 정리

- Prettier를 실행한다.
    - Prettier: `npm exec prettier <작성한 파일들...> --write`
- 수정하지 않은 기존 코드에는 Prettier를 실행하지 않는다.

