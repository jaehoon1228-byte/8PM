import { AlertCircle } from "lucide-react";

export default function BadRequest({ message }: { message?: string }) {
    return (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-500/20 flex items-center justify-center gap-2 mb-5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
                {message ??
                    "입력한 정보가 일치하지 않습니다."}
            </span>
        </div>
    );
}
