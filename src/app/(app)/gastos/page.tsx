import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { GastosPanel } from "@/components/gastos/gastos-panel";

export default async function GastosPage() {
  const [gastos, grupos] = await Promise.all([
    prisma.gastoAws.findMany({
      include: { contaContabil: { include: { grupo: true } } },
      orderBy: { data: "desc" },
    }),
    prisma.grupoConta.findMany({
      where: { tipo: "DESPESA", ativo: true },
      include: { contas: { where: { ativo: true }, orderBy: { ordem: "asc" } } },
      orderBy: { ordem: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Gastos da AWS"
        description="Controle de despesas gerais da distribuidora, classificadas pelo plano de contas."
      />
      <GastosPanel
        gastosIniciais={gastos.map((g) => ({
          id: g.id,
          descricao: g.descricao,
          valor: Number(g.valor),
          data: g.data.toISOString(),
          observacoes: g.observacoes,
          contaContabilId: g.contaContabilId,
          contaNome: g.contaContabil.nome,
          grupoNome: g.contaContabil.grupo.nome,
        }))}
        grupos={grupos.map((gr) => ({
          id: gr.id,
          nome: gr.nome,
          contas: gr.contas.map((c) => ({ id: c.id, nome: c.nome })),
        }))}
      />
    </div>
  );
}
