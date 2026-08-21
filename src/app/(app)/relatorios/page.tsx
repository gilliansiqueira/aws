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

  const [pedidos, comissoesPagas, gastos] = await Promise.all([
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
      select: { valor: true },
    }),
    prisma.gastoAws.findMany({
      where: { data: { gte: de, lte: ate } },
      select: { valor: true, categoria: true },
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

  const porCategoriaGasto = new Map<string, number>();
  for (const g of gastos) {
    porCategoriaGasto.set(g.categoria, (porCategoriaGasto.get(g.categoria) ?? 0) + Number(g.valor));
  }

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Vendas, comissões e gastos consolidados por período."
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
        porCategoriaGasto={[...porCategoriaGasto.entries()].sort((a, b) => b[1] - a[1]).map(([nome, valor]) => ({ nome, valor }))}
      />
    </div>
  );
}
