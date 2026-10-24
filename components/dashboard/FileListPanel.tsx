"use client";

// [렌더링 전략] SSR 초기 데이터 + CSR 변경
//  - 내가 올린 파일 목록은 서버에서 미리 조회 → 첫 HTML 에 목록 포함
//  - 업로드/삭제는 사용자 행동이므로 클라이언트에서 API 호출 후 목록만 부분 갱신

import { FileText, FolderOpen, Trash2 } from "lucide-react";
import type { UploadedFile } from "@/types/dashboard";

interface FileListPanelProps {
    uploadedFiles: UploadedFile[];
    isUploading: boolean;
    onRemoveFile: (id: string) => void;
}

export default function FileListPanel({
    uploadedFiles,
    isUploading,
    onRemoveFile,
}: FileListPanelProps) {
    return (
        <aside className="flex-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-5 shadow-lg shadow-slate-900/5 border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden transition-colors">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-slate-900 dark:text-white font-bold text-sm tracking-tight">
                    내가 올린 파일
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {isUploading ? "업로드 중..." : `${uploadedFiles.length}개`}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {uploadedFiles.length === 0 ? (
                    <div className="py-12 px-3 text-center">
                        <FolderOpen className="w-7 h-7 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                        <p className="text-slate-400 dark:text-slate-500 text-xs">
                            업로드된 파일이 없습니다.
                        </p>
                    </div>
                ) : (
                    uploadedFiles.map((file) => (
                        <div
                            key={file.id}
                            className="group bg-slate-50/90 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 transition-all"
                        >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs text-slate-800 dark:text-slate-100 font-semibold truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                        {file.size}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveFile(file.id);
                                }}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                                title="파일 삭제"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
}
