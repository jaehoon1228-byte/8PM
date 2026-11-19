"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface DuplicateFileModalProps {
    duplicateNames: string[] | null;
    onClose: () => void;
}

/**
 * 이미 업로드된 파일과 동일한 이름의 파일을 업로드하려 할 때 표시되는 경고 모달입니다.
 */
export default function DuplicateFileModal({
    duplicateNames,
    onClose,
}: DuplicateFileModalProps) {
    const isOpen = duplicateNames !== null && duplicateNames.length > 0;

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-file-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6" />
                </div>

                <h3
                    id="duplicate-file-modal-title"
                    className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white"
                >
                    이미 업로드한 파일이 존재합니다.
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    동일한 이름의 파일이 이미 업로드되어 있어 중복 파일은
                    업로드되지 않았습니다.
                </p>

                <div className="mt-3 max-h-28 overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 px-3 py-2 text-left space-y-1">
                    {duplicateNames.map((name) => (
                        <p
                            key={name}
                            className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate"
                            title={name}
                        >
                            • {name}
                        </p>
                    ))}
                </div>

                <div className="mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition cursor-pointer"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}
