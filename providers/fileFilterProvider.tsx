// src/providers/counter-store-provider.tsx
"use client";

import { type ReactNode, createContext, useState, useContext } from "react";
import { useStore } from "zustand";

import {
    type FileFilterStore,
    createFileFilterStore,
} from "@/stores/fileFilterStore";

export type FileFilterStoreApi = ReturnType<typeof createFileFilterStore>;

export const FileFilterStoreContext = createContext<
    FileFilterStoreApi | undefined
>(undefined);

export interface FileFilterStoreProviderProps {
    children: ReactNode;
}

export const FileFilterStoreProvider = ({
    children,
}: FileFilterStoreProviderProps) => {
    const [store] = useState(() => createFileFilterStore());
    return (
        <FileFilterStoreContext.Provider value={store}>
            {children}
        </FileFilterStoreContext.Provider>
    );
};

export const useFileFilterStore = <T,>(
    selector: (store: FileFilterStore) => T,
): T => {
    const counterStoreContext = useContext(FileFilterStoreContext);
    if (!counterStoreContext) {
        throw new Error(
            `useFileFilterStore must be used within FileFilterStoreProvider`,
        );
    }

    return useStore(counterStoreContext, selector);
};
