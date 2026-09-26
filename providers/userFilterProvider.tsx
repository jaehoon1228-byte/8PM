// src/providers/counter-store-provider.tsx
"use client";

import { type ReactNode, createContext, useState, useContext } from "react";
import { useStore } from "zustand";

import {
    type UserFilterStore,
    createUserFilterStore,
} from "@/stores/userFilterStore";

export type UserFilterStoreApi = ReturnType<typeof createUserFilterStore>;

export const UserFilterStoreContext = createContext<
    UserFilterStoreApi | undefined
>(undefined);

export interface UserFilterStoreProviderProps {
    children: ReactNode;
}

export const UserFilterStoreProvider = ({
    children,
}: UserFilterStoreProviderProps) => {
    const [store] = useState(() => createUserFilterStore());
    return (
        <UserFilterStoreContext.Provider value={store}>
            {children}
        </UserFilterStoreContext.Provider>
    );
};

export const useUserFilterStore = <T,>(
    selector: (store: UserFilterStore) => T,
): T => {
    const counterStoreContext = useContext(UserFilterStoreContext);
    if (!counterStoreContext) {
        throw new Error(
            `useUserFilterStore must be used within UserFilterStoreProvider`,
        );
    }

    return useStore(counterStoreContext, selector);
};
