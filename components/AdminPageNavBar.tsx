import { PageType } from "@/types/pageType";
import Link from "next/link";

export default function AdminPageNavBar({ page }: { page: PageType }) {
    return (
        <nav className="flex flex-row">
            <div
                role="navigation"
                tabIndex={0}
                className="hover:cursor-pointer flex-1 text-lg max-md:text-sm p-3 px-5 max-w-32 font-bold bg-main text-white text-center"
            >
                8PM-MES
            </div>
            <div className="p-3 px-7 flex flex-row bg-light gap-10 flex-10 justify-start items-center">
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
