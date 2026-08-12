import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { Topbar } from "@/components/topbar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1">
      <SidebarNav />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          userName={session.user?.name ?? ""}
          userRole={session.user?.role ?? "VENDEDOR"}
        />
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
