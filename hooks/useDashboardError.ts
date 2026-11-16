"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { isHTTPError } from "ky";
import { extractErrorMessage, isSessionExpired } from "@/utils/dashboardApi";

/**
 * 대시보드 API 호출 실패 시 세션 만료 리다이렉트(1회) 및 에러 메시지 처리를 담당하는 훅입니다.
 */
export function useDashboardError() {
    const router = useRouter();
    const isRedirectingRef = useRef(false);

    const handleApiError = useCallback(
        async (
            error: unknown,
            fallbackMessage: string,
            notify = false,
        ): Promise<boolean> => {
            if (isSessionExpired(error)) {
                if (!isRedirectingRef.current) {
                    isRedirectingRef.current = true;
                    router.push("/login");
                }
                return true;
            }

            const detailMessage = await extractErrorMessage(
                error,
                fallbackMessage,
            );
            if (isHTTPError(error)) {
                console.error(
                    fallbackMessage,
                    error.response.status,
                    detailMessage,
                );
            } else {
                console.error(fallbackMessage, error);
            }
            if (notify) alert(detailMessage);
            return false;
        },
        [router],
    );

    return { handleApiError };
}
