// =====================================================================
// 시간 유틸리티 (Temporal API 기반)
//  - 날짜/시각은 ZonedDateTime 으로 다룸
//  - 오프셋이 포함된 문자열(mock API 의 UTC 값 등)은 현재 타임존의 ZonedDateTime 으로 변환
// =====================================================================
import { Temporal as TemporalPolyfill } from "@js-temporal/polyfill";

if (typeof globalThis.Temporal === "undefined") {
    Object.defineProperty(globalThis, "Temporal", {
        value: TemporalPolyfill,
        configurable: true,
        writable: true,
    });
}

/**
 * 현재 시각을 반환합니다.
 * @returns 현재 시각
 */
export function nowMs(): number {
    return Temporal.Now.instant().epochMilliseconds;
}

/**
 * ISO 문자열을 ZonedDateTime으로 변환합니다.
 * 오프셋 포함 문자열은 Instant로 해석 후 현재 타임존의 ZonedDateTime으로 변환하며, 형식이 잘못되면 RangeError를 던집니다.
 * @param value 변환할 ISO 날짜/시각 문자열
 * @returns 현재 타임존의 ZonedDateTime
 * @throws {RangeError} 형식이 잘못된 경우
 */
export function parseDateTime(value: string): Temporal.ZonedDateTime {
    // value를 ZonedDateTime으로 해석 시도
    try {
        return Temporal.Instant.from(value).toZonedDateTimeISO(
            Temporal.Now.timeZoneId(),
        );
    } catch (e) {
        if (!(e instanceof RangeError)) {
            throw e;
        }
    }

    // 실패하면 PlainDateTime으로 해석 후 현재 시간대 부여
    try {
        return Temporal.PlainDateTime.from(value).toZonedDateTime(
            Temporal.Now.timeZoneId(),
        );
    } catch (error) {
        // 그것조차 실패하면 예외를 던짐
        throw error;
    }
}

/**
 * 선택적 ISO 문자열을 ZonedDateTime으로 변환합니다.
 * 저장소에서 값이 없거나(null, undefined, 빈 문자열) 형식이 잘못된 경우를 예외 없이 처리하기 위해 사용합니다.
 * 형식 오류(RangeError)는 undefined 로 흡수하며, 그 외 예상하지 못한 오류는 그대로 다시 던집니다.
 * @param value 변환할 ISO 날짜/시각 문자열 (없을 수 있음)
 * @returns 변환된 ZonedDateTime. 값이 없거나 형식이 잘못되었으면 undefined
 * @throws {Error} RangeError 가 아닌 예상치 못한 오류가 발생한 경우
 */
export function parseOptionalDateTime(
    value?: string | null,
): Temporal.ZonedDateTime | undefined {
    if (!value) return undefined;
    try {
        return parseDateTime(value);
    } catch (error) {
        if (error instanceof RangeError) return undefined;
        throw error;
    }
}
