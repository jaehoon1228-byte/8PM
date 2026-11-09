import { useChatSessionStore } from "@/utils/store/chatSessionStore";
import { useFileStore } from "@/utils/store/fileStore";
import { applyThemeClass } from "@/utils/preferences";
import { usePreferenceStore } from "@/utils/store/preferenceStore";

/**
 * 모든 Zustand 스토어를 초기 상태로 되돌리고 persist 저장소(localStorage)를 비웁니다.
 * 초기화 후 html의 dark 클래스를 초기 테마에 맞춰 동기화합니다.
 */
export function resetStores(): void {
    usePreferenceStore.setState(usePreferenceStore.getInitialState(), true);
    useFileStore.setState(useFileStore.getInitialState(), true);
    useChatSessionStore.setState(useChatSessionStore.getInitialState(), true);

    usePreferenceStore.persist.clearStorage();
    useFileStore.persist.clearStorage();
    useChatSessionStore.persist.clearStorage();

    // html 의 dark 클래스는 store 밖에 있으므로 초기화된 테마에 맞춰 동기화
    applyThemeClass(usePreferenceStore.getState().theme);
}
