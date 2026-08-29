"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  // null até montar no client — evita aplicar o ícone errado antes de saber
  // o tema real (que o script inline em layout.tsx já define no <html>).
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    // Lê o tema já aplicado no <html> pelo script inline (roda antes da
    // hidratação) — não há como saber isso durante o render no servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage indisponível (modo privado etc.) — tema só não persiste
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar tema claro/escuro"
      title="Alternar tema"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
    >
      {theme === null ? null : theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
