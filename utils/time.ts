// =====================================================================
// 시간 유틸리티 (Temporal API 기반)
//  - 타임존은 저장하지 않음. 백엔드 LocalDateTime 값을 PlainDateTime 으로 다룸
//  - 오프셋이 포함된 문자열(mock API 의 UTC 값 등)은 로컬 벽시계 시각으로 변환
// =====================================================================

/**
 * 현재 시각을 반환합니다.
 * @returns 현재 시각
 */
export function nowMs(): number {
    return Temporal.Now.instant().epochMilliseconds;
}

/**
 * ISO 문자열을 PlainDateTime으로 변환합니다.
 * 오프셋 포함 문자열은 Instant로 해석 후 LocalDateTime으로 변환하며, 형식이 잘못되면 RangeError를 던집니다.
 * @param value 변환할 ISO 날짜/시각 문자열
 * @returns 타임존이 없는 PlainDateTime
 * @throws {RangeError} 형식이 잘못된 경우
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

/**
 * 선택적 ISO 문자열을 PlainDateTime으로 변환합니다.
 * 저장소에서 값이 없거나(null, undefined, 빈 문자열) 형식이 잘못된 경우를 예외 없이 처리하기 위해 사용합니다.
 * 형식 오류(RangeError)는 undefined 로 흡수하며, 그 외 예상하지 못한 오류는 그대로 다시 던집니다.
 * @param value 변환할 ISO 날짜/시각 문자열 (없을 수 있음)
 * @returns 변환된 PlainDateTime. 값이 없거나 형식이 잘못되었으면 undefined
 * @throws {Error} RangeError 가 아닌 예상치 못한 오류가 발생한 경우
 */
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
