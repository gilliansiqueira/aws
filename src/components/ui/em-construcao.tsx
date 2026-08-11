import { EmptyState } from "@/components/ui/page-header";

export function EmConstrucao({ modulo }: { modulo: string }) {
  return (
    <EmptyState
      title={`${modulo} — em construção`}
      description="Este módulo será implementado na próxima etapa do projeto."
    />
  );
}
