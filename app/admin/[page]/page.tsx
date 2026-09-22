import AdminPageNavBar from "@/components/AdminPageNavBar";
import { isPageType } from "@/types/pageType";
import { notFound } from "next/navigation";
import Form from "next/form";
import AdminPageUserEntry from "@/components/AdminPageUserEntry";
import AdminPageFileEntry from "@/components/AdminPageFileEntry";

export default async function AdminPage({
    params,
}: {
    params: Promise<{ page: string }>;
}) {
    const { page } = await params;

    if (isPageType(page)) {
        if (page === "user") {
            return (
                <div className="flex flex-col h-dvh font-admin">
                    <AdminPageNavBar page={page} />
                    <div className="flex flex-col justify-center items-center h-full">
                        <div className="flex flex-col bg-lighter h-3/4 rounded-xl">
                            <Form
                                className="bg-light flex flex-row rounded-t-xl p-3 gap-32 w-full justify-start items-center"
                                action={async (formData: FormData) => {
                                    "use server";
                                    console.log(formData);
                                }}
                            >
                                <div className="flex flex-row gap-5 justify-start flex-8">
                                    <input
                                        type="number"
                                        name="employeeId"
                                        className="p-3 border-white border-2 rounded-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="사원번호 입력..."
                                    />
                                    <input
                                        type="text"
                                        name="username"
                                        className="p-3 border-white border-2 rounded-2xl"
                                        placeholder="사용자 이름 입력..."
                                    />
                                    <select
                                        name="role"
                                        id="role"
                                        className="p-3 border-white border-2 rounded-2xl"
                                        defaultValue="ROLE_USER"
                                    >
                                        <option value="ROLE_USER">
                                            사용자
                                        </option>
                                        <option value="ROLE_MANAGER">
                                            담당자
                                        </option>
                                        <option value="ROLE_MASTER">
                                            관리자
                                        </option>
                                    </select>
                                </div>
                                <div className="flex-2">
                                    <button className="p-3 border-2 px-10 border-blue-300 hover:cursor-pointer rounded-2xl">
                                        검색
                                    </button>
                                </div>
                            </Form>
                            <div className="w-full overflow-y-scroll">
                                <AdminPageUserEntry
                                    companyId={0}
                                    companyName="8PM"
                                    employeeId={0}
                                    email="test@example.org"
                                    role="ROLE_MASTER"
                                    username="admin"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="flex flex-col h-dvh font-admin">
                    <AdminPageNavBar page={page} />
                    <div className="flex flex-col justify-center items-center h-full">
                        <div className="flex flex-col bg-lighter h-3/4 rounded-xl">
                            <Form
                                className="bg-light flex flex-row rounded-t-xl p-3 gap-32 w-full justify-start items-center"
                                action={async (formData: FormData) => {
                                    "use server";
                                    console.log(formData);
                                }}
                            >
                                <div className="flex flex-row gap-5 justify-start flex-8">
                                    <input
                                        type="number"
                                        name="employeeId"
                                        className="p-3 border-white border-2 rounded-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="파일 이름 입력..."
                                    />
                                    <select
                                        name="fileType"
                                        id="fileType"
                                        className="p-3 border-white border-2 rounded-2xl"
                                    >
                                        <option>파일 유형 선택...</option>
                                        <option value="docx">DOCX</option>
                                        <option value="xlsx">XLSX</option>
                                        <option value="pptx">PPTX</option>
                                        <option value="CSV">CSV</option>
                                        <option value="pdf">PDF</option>
                                    </select>
                                </div>
                                <div className="flex-2">
                                    <button className="p-3 border-2 px-10 border-blue-300 hover:cursor-pointer rounded-2xl">
                                        검색
                                    </button>
                                </div>
                            </Form>
                            <div className="w-full overflow-y-scroll">
                                <AdminPageFileEntry
                                    fileName="TEST.docx"
                                    username="admin"
                                    uploadedAt={new Date()}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    } else {
        notFound();
    }
}
