import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { PlanoContasPanel } from "@/components/plano-contas/plano-contas-panel";

export default async function PlanoContasPage() {
  const grupos = await prisma.grupoConta.findMany({
    include: { contas: { orderBy: { ordem: "asc" } } },
    orderBy: { ordem: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Plano de Contas"
        description="Estrutura usada para classificar gastos e comissões, e para o fechamento mensal em Relatórios."
      />
      <PlanoContasPanel
        gruposIniciais={grupos.map((g) => ({
          id: g.id,
          nome: g.nome,
          tipo: g.tipo,
          ativo: g.ativo,
          contas: g.contas.map((c) => ({ id: c.id, nome: c.nome, ativo: c.ativo })),
        }))}
      />
    </div>
  );
}
