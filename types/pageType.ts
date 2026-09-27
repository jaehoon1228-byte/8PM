/**
 * 페이지 구분을 정의합니다.
 */
const avaliablePageTypes = ["user", "file"] as const;
export type PageType = (typeof avaliablePageTypes)[number];
export function isPageType(value: string): value is PageType {
    return avaliablePageTypes.includes(value as PageType);
}
