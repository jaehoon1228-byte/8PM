import { NextResponse } from "next/server";

// [Mock API] POST /api/v1/logout
export async function POST() {
    console.log("[Mock API] 로그아웃 완료");
    return new NextResponse("로그아웃 성공 (Mock)", { status: 200 });
}
