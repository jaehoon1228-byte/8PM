const avaliablePageTypes = ["user", "file"] as const;
export type PageType = (typeof avaliablePageTypes)[number];
export function isPageType(value: string): value is PageType {
    return avaliablePageTypes.includes(value as PageType);
}
