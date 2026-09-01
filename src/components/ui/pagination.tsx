import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

function buildHref(basePath: string, params: Record<string, string>, page: number) {
  const search = new URLSearchParams({ ...params, page: String(page) });
  return `${basePath}?${search.toString()}`;
}

// Janela de páginas ao redor da atual (ex: 1 ... 4 5 [6] 7 8 ... 20).
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

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  basePath,
  searchParams = {},
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  basePath: string;
  searchParams?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const inicio = (page - 1) * pageSize + 1;
  const fim = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm md:px-6">
      <p className="text-muted">
        {inicio}–{fim} de {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(basePath, searchParams, Math.max(1, page - 1))}
          aria-label="Página anterior"
          aria-disabled={page <= 1}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10 ${
            page <= 1 ? "pointer-events-none opacity-40" : ""
          }`}
        >
          <ChevronLeft size={16} />
        </Link>
        {paginasVisiveis(page, totalPages).map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-1 text-muted">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(basePath, searchParams, p)}
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                p === page
                  ? "bg-brand text-white"
                  : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {p}
            </Link>
          ),
        )}
        <Link
          href={buildHref(basePath, searchParams, Math.min(totalPages, page + 1))}
          aria-label="Próxima página"
          aria-disabled={page >= totalPages}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10 ${
            page >= totalPages ? "pointer-events-none opacity-40" : ""
          }`}
        >
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
