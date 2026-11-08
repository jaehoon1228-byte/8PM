// =====================================================================
// 시간 유틸리티 (Temporal API 기반)
//  - 타임존은 저장하지 않음. 백엔드 LocalDateTime 값을 PlainDateTime 으로 다룸
//  - 오프셋이 포함된 문자열(mock API 의 UTC 값 등)은 로컬 벽시계 시각으로 변환
// =====================================================================

/** 현재 시각을 epoch 밀리초로 반환 (Date.now 대체) */
export function nowMs(): number {
    return Temporal.Now.instant().epochMilliseconds;
}

/**
 * ISO 문자열을 PlainDateTime 으로 변환
 *  - 오프셋 포함 문자열은 Instant 로 해석 후 로컬 벽시계 시각으로 변환
 *  - 형식이 잘못되면 RangeError 를 그대로 던짐
 */
export function parseDateTime(value: string): Temporal.PlainDateTime {
    try {
        return Temporal.Instant.from(value)
            .toZonedDateTimeISO(Temporal.Now.timeZoneId())
            .toPlainDateTime();
    } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        return Temporal.PlainDateTime.from(value);
    }
}

/** 값이 없거나 형식이 잘못된 경우 undefined 를 반환 */
export function parseOptionalDateTime(
    value?: string | null,
): Temporal.PlainDateTime | undefined {
    if (!value) return undefined;
    try {
        return parseDateTime(value);
    } catch (error) {
        if (error instanceof RangeError) return undefined;
        throw error;
    }
}
