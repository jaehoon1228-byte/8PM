import { isRole, Role } from "@/types/role";
import { createStore } from "zustand";

export type UserFilterState = {
    queryText: string;
    role: Role | "" | undefined;
    createdAtStart: Temporal.PlainDateTime | undefined;
    createdAtEnd: Temporal.PlainDateTime | undefined;
};
export type UserFilterActions = {
    setQueryText: (value: string) => void;
    setRole: (value: Role | "" | undefined) => void;
    setCreatedAt: (
        start?: Temporal.PlainDateTime,
        end?: Temporal.PlainDateTime,
    ) => void;
};

export type UserFilterStore = UserFilterState & UserFilterActions;

export const defaultInitState: UserFilterState = {
    queryText: "",
    role: "",
    createdAtStart: undefined,
    createdAtEnd: undefined,
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
        setCreatedAt: (start, end) =>
            set(() => {
                if (start && end) {
                    return { createdAtStart: start, createdAtEnd: end };
                } else if (start) {
                    return { createdAtStart: start };
                } else if (end) {
                    return { createdAtEnd: end };
                } else {
                    return {
                        createdAtStart: undefined,
                        createdAtEnd: undefined,
                    };
                }
            }),
    }));
}
