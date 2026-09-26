import { redirect } from "next/navigation";

/**
 * /admin 접속 시 /admin/user로 리다이렉트
 */
export default function AdminPage() {
    redirect("/admin/user");
}
