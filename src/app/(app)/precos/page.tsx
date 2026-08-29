import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { PrecosTable } from "./precos-table";

export default async function PrecosPage() {
  const produtos = await prisma.produto.findMany({
    include: { marca: true, industria: true, _count: { select: { faixasPreco: true } } },
    orderBy: { nome: "asc" },
  });

  const items = produtos.map((p) => ({
    id: p.id,
    nome: p.nome,
    codigo: p.codigo,
    marcaNome: p.marca.nome,
    marcaCor: p.marca.cor,
    industriaNome: p.industria.nome,
    preco: p.preco.toString(),
    numFaixas: p._count.faixasPreco,
  }));

  return (
    <div>
      <PageHeader
        title="Preços"
        description="Edição rápida do preço padrão por produto. Faixas de preço por quantidade são editadas no cadastro do produto. Pedidos já criados não são afetados."
      />
      <PrecosTable items={items} />
    </div>
  );
}
