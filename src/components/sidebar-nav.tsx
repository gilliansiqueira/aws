"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  FlaskConical,
  Map,
  Users,
  Package,
  Tag,
  Factory,
  Truck,
  CreditCard,
  BarChart3,
  Settings,
  Menu,
  X,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ElementType };
type NavGroup = { title: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    title: "Principal",
    items: [
      { href: "/", label: "Início", icon: LayoutDashboard },
      { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
      { href: "/pedidos/novo", label: "Novo Pedido", icon: PlusCircle },
      { href: "/amostras", label: "Amostras", icon: FlaskConical },
      { href: "/mapa", label: "Mapa de Vendas", icon: Map },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/produtos", label: "Produtos", icon: Package },
      { href: "/precos", label: "Preços", icon: Tag },
      { href: "/industrias", label: "Indústrias", icon: Factory },
      { href: "/marcas", label: "Marcas", icon: Tag },
      { href: "/transportadoras", label: "Transportadoras", icon: Truck },
      {
        href: "/formas-pagamento",
        label: "Formas de Pagamento",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
      { href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SidebarNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const content = (
    <nav className="flex flex-col gap-6 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
            {group.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-brand text-white"
                      : "text-foreground/80 hover:bg-black/5"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="no-print fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface shadow-sm md:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      <aside className="no-print hidden w-64 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
        {content}
      </aside>

      {open && (
        <div className="no-print fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-semibold">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Fechar menu">
                <X size={20} />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
