import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SidebarNav } from "@/components/sidebar-nav";
import { Topbar } from "@/components/topbar";
import { STATUS_PEDIDO_EM_ABERTO } from "@/lib/pedido-status";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const pedidosEmAberto = await prisma.pedido.count({
    where: { status: { in: [...STATUS_PEDIDO_EM_ABERTO] }, deletedAt: null },
  });

  return (
    <div className="flex min-h-screen flex-1">
      <SidebarNav pedidosEmAberto={pedidosEmAberto} />
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
