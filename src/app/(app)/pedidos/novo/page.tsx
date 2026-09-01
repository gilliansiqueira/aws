import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { PedidoWizardLoader } from "@/components/pedidos/wizard-loader";
import type { WizardCatalogs, WizardInitialData } from "@/components/pedidos/types";

export default async function NovoPedidoPage({
  searchParams,
}: PageProps<"/pedidos/novo">) {
  const params = await searchParams;
  const duplicarId = typeof params.duplicar === "string" ? params.duplicar : null;

  const [clientes, industrias, transportadoras, formasPagamento, produtos, pedidoOrigem] =
    await Promise.all([
      prisma.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
      prisma.industria.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
      prisma.transportadora.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
      prisma.formaPagamento.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
      prisma.produto.findMany({
        where: { ativo: true },
        include: {
          marca: true,
          faixasPreco: { orderBy: { quantidadeMinima: "asc" } },
        },
        orderBy: { nome: "asc" },
      }),
      duplicarId
        ? prisma.pedido.findUnique({
            where: { id: duplicarId },
            include: { itens: { orderBy: { ordem: "asc" } } },
          })
        : Promise.resolve(null),
    ]);

  const catalogos: WizardCatalogs = {
    clientes: clientes.map((c) => ({
      id: c.id,
      nome: c.nome,
      statusCredito: c.statusCredito,
      cnpj: c.cnpj,
      cidade: c.cidade,
      uf: c.uf,
      compradorPadrao: c.compradorPadrao,
      formaPagamentoPadraoId: c.formaPagamentoPadraoId,
    })),
    industrias: industrias.map((i) => ({
      id: i.id,
      nome: i.nome,
      whatsapp: i.whatsapp,
      transportadoraPadraoId: i.transportadoraPadraoId,
    })),
    transportadoras: transportadoras.map((t) => ({ id: t.id, nome: t.nome })),
    formasPagamento: formasPagamento.map((f) => ({
      id: f.id,
      nome: f.nome,
      numeroParcelas: f.numeroParcelas,
      primeiraParcelaDias: f.primeiraParcelaDias,
      intervaloDias: f.intervaloDias,
    })),
    produtos: produtos.map((p) => ({
      id: p.id,
      nome: p.nome,
      codigo: p.codigo,
      referencia: p.referencia,
      industriaId: p.industriaId,
      marcaNome: p.marca.nome,
      unidade: p.unidade,
      pesoLiquido: Number(p.pesoLiquido),
      preco: Number(p.preco),
      faixas: p.faixasPreco.map((f) => ({
        id: f.id,
        quantidadeMinima: Number(f.quantidadeMinima),
        quantidadeMaxima: f.quantidadeMaxima === null ? null : Number(f.quantidadeMaxima),
        preco: Number(f.preco),
      })),
    })),
  };

  let initial: WizardInitialData | undefined;

  if (pedidoOrigem) {
    const produtosPorId = new Map(catalogos.produtos.map((p) => [p.id, p]));
    initial = {
      clienteId: pedidoOrigem.clienteId,
      industriaId: pedidoOrigem.industriaId,
      transportadoraId: pedidoOrigem.transportadoraId ?? "",
      compradorNome: pedidoOrigem.compradorNome,
      formaPagamentoId: pedidoOrigem.formaPagamentoId ?? "",
      observacoes: pedidoOrigem.observacoes ?? "",
      itens: pedidoOrigem.itens
        .filter((item) => item.produtoId && produtosPorId.has(item.produtoId))
        .map((item) => {
          const produto = produtosPorId.get(item.produtoId!)!;
          return {
            produtoId: produto.id,
            codigo: produto.codigo,
            referencia: produto.referencia,
            descricao: produto.nome,
            marcaNome: produto.marcaNome,
            unidade: produto.unidade,
            pesoLiquidoUnit: produto.pesoLiquido,
            valorUnitario: Number(item.valorUnitarioSnapshot),
            quantidade: Number(item.quantidade),
            // preserva o preço histórico do pedido original; não recalcula
            // por faixa automaticamente ao duplicar (o vendedor pode ajustar
            // manualmente se quiser um preço novo).
            precoManual: true,
          };
        }),
    };
  }

  return (
    <div>
      <PageHeader
        title="Novo Pedido"
        description={
          pedidoOrigem
            ? `Duplicado a partir do pedido #${pedidoOrigem.numero}. Revise os dados antes de finalizar.`
            : undefined
        }
      />
      <Suspense fallback={null}>
        <PedidoWizardLoader catalogos={catalogos} initialFromServer={initial} />
      </Suspense>
    </div>
  );
}
