import { UserFilterStoreProvider } from "@/providers/userFilterProvider";

export default function UserPageLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return <UserFilterStoreProvider>{children}</UserFilterStoreProvider>;
}
