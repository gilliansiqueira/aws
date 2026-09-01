"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

function paginasVisiveis(page: number, totalPages: number): (number | "...")[] {
  const paginas = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const resultado: (number | "...")[] = [];
  for (let i = 0; i < ordenadas.length; i++) {
    if (i > 0 && ordenadas[i] - ordenadas[i - 1] > 1) resultado.push("...");
    resultado.push(ordenadas[i]);
  }
  return resultado;
}

export function ClientPagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  const inicio = (page - 1) * pageSize + 1;
  const fim = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm md:px-6">
      <p className="text-muted">
        {inicio}–{fim} de {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Página anterior"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/10"
        >
          <ChevronLeft size={16} />
        </button>
        {paginasVisiveis(page, totalPages).map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-1 text-muted">
              …
            </span>
          ) : (
            <button
              type="button"
              key={p}
              onClick={() => onPageChange(p)}
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                p === page
                  ? "bg-brand text-white"
                  : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Próxima página"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/10"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
