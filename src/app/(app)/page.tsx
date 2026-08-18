import Link from "next/link";
import { DollarSign, ClipboardList, Users, Package, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { VendasChart } from "@/components/dashboard/vendas-chart";
import { RankingBars } from "@/components/dashboard/ranking-bars";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { STATUS_PEDIDO_COLORS, STATUS_PEDIDO_EM_ABERTO, STATUS_PEDIDO_LABELS } from "@/lib/pedido-status";

const MESES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default async function HomePage() {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioJanela = new Date(agora.getFullYear(), agora.getMonth() - 5, 1);

  const [
    faturamentoMes,
    pedidosNoMes,
    pedidosEmAberto,
    clientesAtivos,
    ultimosPedidos,
    itensJanela,
    pedidosJanela,
  ] = await Promise.all([
    prisma.pedido.aggregate({
      _sum: { valorTotal: true },
      where: { dataPedido: { gte: inicioMes }, status: { not: "CANCELADO" } },
    }),
    prisma.pedido.count({
      where: { dataPedido: { gte: inicioMes }, status: { not: "CANCELADO" } },
    }),
    prisma.pedido.count({ where: { status: { in: [...STATUS_PEDIDO_EM_ABERTO] } } }),
    prisma.cliente.count({ where: { ativo: true } }),
    prisma.pedido.findMany({ orderBy: { numero: "desc" }, take: 5 }),
    prisma.itemPedido.findMany({
      where: { pedido: { dataPedido: { gte: inicioJanela }, status: { not: "CANCELADO" } } },
      select: { descricaoSnapshot: true, valorTotal: true },
    }),
    prisma.pedido.findMany({
      where: { dataPedido: { gte: inicioJanela }, status: { not: "CANCELADO" } },
      select: { dataPedido: true, valorTotal: true },
    }),
  ]);

  // Ranking de produtos: agrupa por descrição (nome do produto no momento do
  // pedido) somando o valor faturado — feito em memória porque o volume de
  // itens de pedido é pequeno o suficiente pra não valer a pena um groupBy SQL.
  const porProduto = new Map<string, number>();
  for (const item of itensJanela) {
    porProduto.set(
      item.descricaoSnapshot,
      (porProduto.get(item.descricaoSnapshot) ?? 0) + Number(item.valorTotal),
    );
  }
  const rankingProdutos = [...porProduto.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, valor]) => ({ nome, valor }));

  // Evolução de vendas: soma por mês nos últimos 6 meses (incluindo meses sem
  // pedido, pra o gráfico não "pular").
  const porMes = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    porMes.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const p of pedidosJanela) {
    const d = new Date(p.dataPedido);
    const chave = `${d.getFullYear()}-${d.getMonth()}`;
    if (porMes.has(chave)) {
      porMes.set(chave, (porMes.get(chave) ?? 0) + Number(p.valorTotal));
    }
  }
  const evolucaoVendas = [...porMes.entries()].map(([chave, valor]) => {
    const [, mesIdx] = chave.split("-").map(Number);
    return { mes: MESES_CURTO[mesIdx], valor };
  });

  const temAlgumPedido = pedidosJanela.length > 0 || ultimosPedidos.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Início"
        description="Visão geral do desempenho comercial da AWS."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Faturamento do mês"
          value={formatCurrencyBRL(Number(faturamentoMes._sum.valorTotal ?? 0))}
          tone="success"
        />
        <StatCard
          icon={ClipboardList}
          label="Pedidos no mês"
          value={String(pedidosNoMes)}
          tone="brand"
        />
        <StatCard
          icon={TrendingUp}
          label="Pedidos em aberto"
          value={String(pedidosEmAberto)}
          hint="Rascunho até em andamento"
          tone="warning"
        />
        <StatCard
          icon={Users}
          label="Clientes ativos"
          value={String(clientesAtivos)}
          tone="brand"
        />
      </div>

      {!temAlgumPedido ? (
        <EmptyState
          title="Nenhum pedido registrado ainda"
          description="Assim que os primeiros pedidos forem criados, os indicadores e gráficos aparecem aqui."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Evolução de vendas</h2>
              <span className="text-xs text-muted">Últimos 6 meses</span>
            </div>
            <VendasChart data={evolucaoVendas} />
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Package size={16} className="text-muted" />
              <h2 className="text-sm font-semibold">Produtos mais vendidos</h2>
            </div>
            {rankingProdutos.length === 0 ? (
              <p className="text-sm text-muted">Sem vendas nos últimos 6 meses.</p>
            ) : (
              <RankingBars itens={rankingProdutos} />
            )}
          </Card>
        </div>
      )}

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
          <h2 className="text-sm font-semibold">Últimos pedidos</h2>
          <Link href="/pedidos" className="text-sm font-medium text-brand hover:underline">
            Ver todos
          </Link>
        </div>
        {ultimosPedidos.length === 0 ? (
          <EmptyState title="Nenhum pedido ainda" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium md:px-6">Nº</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {ultimosPedidos.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3 md:px-6">
                      <Link href={`/pedidos/${p.id}`} className="font-semibold text-brand hover:underline">
                        #{p.numero}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{p.clienteNomeSnapshot}</td>
                    <td className="px-4 py-3">{formatDateBR(p.dataPedido)}</td>
                    <td className="px-4 py-3">
                      <Badge color={STATUS_PEDIDO_COLORS[p.status]}>{STATUS_PEDIDO_LABELS[p.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrencyBRL(p.valorTotal.toString())}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
