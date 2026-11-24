import { readFile } from "node:fs/promises";
import path from "node:path";

const REGISTER_PATH = path.join(
    process.cwd(),
    "node_modules/react-devtools-cdt-mcp/dist/register.js",
);

/**
 * dev 전용: react-devtools-cdt-mcp의 register 스크립트를 classic script로 제공한다.
 * `<Script strategy="beforeInteractive">`가 React보다 먼저 실행할 수 있도록 한다.
 */
export async function GET() {
    if (process.env.NODE_ENV !== "development") {
        return new Response("Not Found", { status: 404 });
    }

    const source = await readFile(REGISTER_PATH, "utf8");
    // ESM export 구문을 제거하고 IIFE로 감싸 전역 변수 충돌을 막는다.
    const body = source.replace(/^export \{[^}]*\};?\s*$/m, "");
    const script = `;(() => {\n${body}\n})();`;

    return new Response(script, {
        headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-store",
        },
    });
}
