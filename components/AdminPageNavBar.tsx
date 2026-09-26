import { PageType } from "@/types/pageType";
import Link from "next/link";

/**
 * 관리자 페이지에 공통으로 들어갈 네비게이션 바.
 * @param param0 현재 페이지 props.
 * @returns 네비게이션 바 Element.
 */
export default function AdminPageNavBar({ page }: { page: PageType }) {
    return (
        <nav className="flex flex-row">
            <div
                className="bg-main flex flex-4 items-center justify-center hover:cursor-pointer md:flex-2 xl:flex-1"
                role="navigation"
                tabIndex={0}
            >
                <p className="text-center align-middle text-lg font-bold text-white max-sm:text-sm">
                    8PM-MES
                </p>
            </div>
            <div className="bg-light flex flex-10 flex-row items-center justify-start gap-10 p-3 px-7">
                <Link
                    href="/admin/user"
                    tabIndex={0}
                    className={`hover:cursor-pointer ${page === "user" ? "font-bold" : ""}`}
                >
                    사용자
                </Link>
                <Link
                    href="/admin/file"
                    tabIndex={0}
                    className={`hover:cursor-pointer ${page === "file" ? "font-bold" : ""}`}
                >
                    파일
                </Link>
            </div>
        </nav>
    );
}
