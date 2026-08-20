import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { ComissoesPanel } from "@/components/comissoes/comissoes-panel";

export default async function ComissoesPage() {
  const [comissoes, pedidosElegiveis, representantes] = await Promise.all([
    prisma.comissao.findMany({
      include: {
        user: { select: { id: true, name: true } },
        pedido: { select: { id: true, numero: true, clienteNomeSnapshot: true, valorTotal: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pedido.findMany({
      where: { status: "ENTREGUE", deletedAt: null, comissao: null },
      select: {
        id: true,
        numero: true,
        clienteNomeSnapshot: true,
        valorTotal: true,
        criadoPorId: true,
      },
      orderBy: { numero: "desc" },
    }),
    prisma.user.findMany({ where: { ativo: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Comissões"
        description="Controle de pagamento de comissão aos representantes — valor combinado por pedido, lançado depois que o pedido é entregue."
      />
      <ComissoesPanel
        comissoesIniciais={comissoes.map((c) => ({
          id: c.id,
          userId: c.userId,
          userNome: c.user.name,
          pedidoId: c.pedidoId,
          pedidoNumero: c.pedido.numero,
          clienteNome: c.pedido.clienteNomeSnapshot,
          valor: Number(c.valor),
          pago: c.pago,
          dataPagamento: c.dataPagamento ? c.dataPagamento.toISOString() : null,
          observacoes: c.observacoes,
        }))}
        pedidosElegiveis={pedidosElegiveis.map((p) => ({
          id: p.id,
          numero: p.numero,
          clienteNome: p.clienteNomeSnapshot,
          valorTotal: Number(p.valorTotal),
          criadoPorId: p.criadoPorId,
        }))}
        representantes={representantes}
      />
    </div>
  );
}
