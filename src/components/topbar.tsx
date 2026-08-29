"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Topbar({
  userName,
  userRole,
}: {
  userName: string;
  userRole: string;
}) {
  return (
    <header className="no-print sticky top-0 z-20 flex h-14 items-center justify-end gap-4 border-b border-border bg-surface/80 px-4 backdrop-blur-md md:px-6">
      <div className="text-right">
        <p className="text-sm font-medium leading-tight">{userName}</p>
        <p className="text-xs leading-tight text-muted">
          {userRole === "ADMIN" ? "Administrador" : "Vendedor"}
        </p>
      </div>
      <ThemeToggle />
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
        aria-label="Sair"
        title="Sair"
      >
        <LogOut size={16} />
      </button>
    </header>
  );
}
