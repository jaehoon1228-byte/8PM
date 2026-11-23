import { readFileSync } from "node:fs";
import path from "node:path";

const REGISTER_PATH = path.join(
    process.cwd(),
    "node_modules/react-devtools-cdt-mcp/dist/register.js",
);

/**
 * 개발 서버 전용: react-devtools-cdt-mcp의 register 코드를 인라인 classic script 본문으로 반환한다.
 */
export function getReactDevtoolsRegisterScript(): string {
    const source = readFileSync(REGISTER_PATH, "utf8");
    // ESM export 구문을 제거하고 IIFE로 감싸 전역 변수 충돌을 막는다.
    const body = source.replace(/^export \{[^}]*\};?\s*$/m, "");

    return `;(() => {\n${body}\n})();`;
}
