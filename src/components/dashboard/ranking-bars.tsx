import { formatCurrencyBRL } from "@/lib/format";

export function RankingBars({
  itens,
}: {
  itens: { nome: string; valor: number }[];
}) {
  const max = Math.max(...itens.map((i) => i.valor), 1);

  return (
    <div className="flex flex-col gap-3">
      {itens.map((item, i) => (
        <div key={item.nome + i}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-foreground/90">{item.nome}</span>
            <span className="shrink-0 font-medium text-muted">{formatCurrencyBRL(item.valor)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${Math.max((item.valor / max) * 100, 3)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
