import { Card } from "@/components/ui/page-header";
import { formatCurrencyBRL } from "@/lib/format";

export function BlobMetricCard({
  titulo,
  faturado,
  emAberto,
}: {
  titulo: string;
  faturado: number;
  emAberto: number;
}) {
  return (
    <Card className="relative overflow-hidden">
      <h2 className="text-sm font-semibold">{titulo}</h2>

      <div className="relative mt-2 flex h-48 items-center justify-center gap-10">
        {/* Blobs desfocados de fundo — decorativo, sem semântica pra leitor de tela */}
        <div
          aria-hidden
          className="absolute left-[28%] top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/30 blur-2xl dark:bg-brand/40"
        />
        <div
          aria-hidden
          className="absolute left-[68%] top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-warning/40 blur-2xl dark:bg-warning/30"
        />

        <div className="relative flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full bg-foreground text-background shadow-lg">
          <span className="text-[10px] uppercase tracking-wide opacity-70">Faturado</span>
          <span className="px-2 text-center text-sm font-bold leading-tight">
            {formatCurrencyBRL(faturado)}
          </span>
        </div>

        <div className="relative flex flex-col items-center">
          <span className="text-lg font-bold text-foreground">{formatCurrencyBRL(emAberto)}</span>
          <span className="text-xs text-muted">em aberto</span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand" /> Faturado no mês
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning" /> Em aberto
        </span>
      </div>
    </Card>
  );
}
