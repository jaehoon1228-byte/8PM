import { isRole, Role } from "@/types/role";
import { createStore } from "zustand";

export type UserFilterState = {
    queryText: string;
    role: Role | "" | undefined;
};
export type UserFilterActions = {
    setQueryText: (value: string) => void;
    setRole: (value: Role | "" | undefined) => void;
};

export type UserFilterStore = UserFilterState & UserFilterActions;

export const defaultInitState: UserFilterState = {
    queryText: "",
    role: "",
};

export function createUserFilterStore(
    initState: UserFilterState = defaultInitState,
) {
    return createStore<UserFilterStore>()((set) => ({
        ...initState,
        setQueryText: (value) => set(() => ({ queryText: value })),
        setRole: (value) =>
            set(() => {
                if (!value || isRole(value)) {
                    return { role: value };
                } else {
                    throw new Error("File Type이 올바르지 않습니다.");
                }
            }),
    }));
}
