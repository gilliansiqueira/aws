import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { RelatoriosPanel } from "@/components/relatorios/relatorios-panel";

function inicioMesAtual() {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
}

function fimMesAtual() {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
}

export default async function RelatoriosPage({
  searchParams,
}: PageProps<"/relatorios">) {
  const params = await searchParams;
  const de = typeof params.de === "string" && params.de ? new Date(`${params.de}T00:00:00`) : inicioMesAtual();
  const ate = typeof params.ate === "string" && params.ate ? new Date(`${params.ate}T23:59:59`) : fimMesAtual();

  const [pedidos, comissoesPagas, gastos, grupos] = await Promise.all([
    prisma.pedido.findMany({
      where: { dataPedido: { gte: de, lte: ate }, status: { not: "CANCELADO" }, deletedAt: null },
      select: {
        id: true,
        numero: true,
        dataPedido: true,
        valorTotal: true,
        status: true,
        clienteNomeSnapshot: true,
        industriaNomeSnapshot: true,
        criadoPorId: true,
        criadoPor: { select: { name: true } },
        itens: { select: { descricaoSnapshot: true, valorTotal: true, marcaNomeSnapshot: true } },
      },
      orderBy: { dataPedido: "asc" },
    }),
    prisma.comissao.findMany({
      where: { pago: true, dataPagamento: { gte: de, lte: ate } },
      select: { valor: true, contaContabilId: true },
    }),
    prisma.gastoAws.findMany({
      where: { data: { gte: de, lte: ate } },
      select: { valor: true, contaContabilId: true, contaContabil: { select: { nome: true } } },
    }),
    prisma.grupoConta.findMany({
      where: { ativo: true },
      include: { contas: { where: { ativo: true }, orderBy: { ordem: "asc" } } },
      orderBy: { ordem: "asc" },
    }),
  ]);

  const totalFaturamento = pedidos.reduce((acc, p) => acc + Number(p.valorTotal), 0);
  const totalComissoes = comissoesPagas.reduce((acc, c) => acc + Number(c.valor), 0);
  const totalGastos = gastos.reduce((acc, g) => acc + Number(g.valor), 0);

  const porIndustria = new Map<string, number>();
  const porVendedor = new Map<string, number>();
  const porProduto = new Map<string, number>();
  for (const p of pedidos) {
    porIndustria.set(p.industriaNomeSnapshot, (porIndustria.get(p.industriaNomeSnapshot) ?? 0) + Number(p.valorTotal));
    const vendedor = p.criadoPor?.name ?? "Não identificado";
    porVendedor.set(vendedor, (porVendedor.get(vendedor) ?? 0) + Number(p.valorTotal));
    for (const item of p.itens) {
      porProduto.set(item.descricaoSnapshot, (porProduto.get(item.descricaoSnapshot) ?? 0) + Number(item.valorTotal));
    }
  }

  const porContaGasto = new Map<string, number>();
  for (const g of gastos) {
    porContaGasto.set(g.contaContabil.nome, (porContaGasto.get(g.contaContabil.nome) ?? 0) + Number(g.valor));
  }

  // Fechamento mensal por plano de contas: soma cada conta contábil a
  // partir das três origens possíveis (receita de pedidos, comissões pagas,
  // gastos lançados) e agrupa por Grupo (Receitas / Despesas...).
  const totalPorConta = new Map<string, number>();
  totalPorConta.set("conta-receita-vendas", totalFaturamento);
  for (const c of comissoesPagas) {
    const contaId = c.contaContabilId ?? "conta-comissoes";
    totalPorConta.set(contaId, (totalPorConta.get(contaId) ?? 0) + Number(c.valor));
  }
  for (const g of gastos) {
    totalPorConta.set(g.contaContabilId, (totalPorConta.get(g.contaContabilId) ?? 0) + Number(g.valor));
  }

  const fechamento = grupos.map((gr) => {
    const contas = gr.contas.map((c) => ({ id: c.id, nome: c.nome, total: totalPorConta.get(c.id) ?? 0 }));
    return {
      id: gr.id,
      nome: gr.nome,
      tipo: gr.tipo,
      contas,
      subtotal: contas.reduce((acc, c) => acc + c.total, 0),
    };
  });
  const totalReceitasContas = fechamento.filter((g) => g.tipo === "RECEITA").reduce((acc, g) => acc + g.subtotal, 0);
  const totalDespesasContas = fechamento.filter((g) => g.tipo === "DESPESA").reduce((acc, g) => acc + g.subtotal, 0);

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Vendas, comissões e gastos consolidados por período — com fechamento mensal pelo plano de contas."
      />
      <RelatoriosPanel
        de={de.toISOString().slice(0, 10)}
        ate={ate.toISOString().slice(0, 10)}
        totalFaturamento={totalFaturamento}
        totalComissoes={totalComissoes}
        totalGastos={totalGastos}
        pedidos={pedidos.map((p) => ({
          numero: p.numero,
          data: p.dataPedido.toISOString(),
          cliente: p.clienteNomeSnapshot,
          industria: p.industriaNomeSnapshot,
          vendedor: p.criadoPor?.name ?? "—",
          valor: Number(p.valorTotal),
        }))}
        porIndustria={[...porIndustria.entries()].sort((a, b) => b[1] - a[1]).map(([nome, valor]) => ({ nome, valor }))}
        porVendedor={[...porVendedor.entries()].sort((a, b) => b[1] - a[1]).map(([nome, valor]) => ({ nome, valor }))}
        porProduto={[...porProduto.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([nome, valor]) => ({ nome, valor }))}
        porContaGasto={[...porContaGasto.entries()].sort((a, b) => b[1] - a[1]).map(([nome, valor]) => ({ nome, valor }))}
        fechamento={fechamento}
        totalReceitasContas={totalReceitasContas}
        totalDespesasContas={totalDespesasContas}
      />
    </div>
  );
}
