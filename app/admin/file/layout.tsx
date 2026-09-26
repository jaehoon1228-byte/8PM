import { FileFilterStoreProvider } from "@/providers/fileFilterProvider";

export default function FilePageLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return <FileFilterStoreProvider>{children}</FileFilterStoreProvider>;
}
