import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { ProdutoForm } from "@/components/crud/produto-form";
import { DeleteButton } from "@/components/crud/delete-button";

export default async function EditarProdutoPage({
  params,
}: PageProps<"/produtos/[id]">) {
  const { id } = await params;

  const [produto, marcas, industrias] = await Promise.all([
    prisma.produto.findUnique({
      where: { id },
      include: { faixasPreco: { orderBy: { quantidadeMinima: "asc" } } },
    }),
    prisma.marca.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.industria.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  if (!produto) notFound();

  return (
    <div>
      <PageHeader
        title={produto.nome}
        actions={
          <DeleteButton apiUrl={`/api/produtos/${id}`} redirectTo="/produtos" />
        }
      />
      <ProdutoForm
        initial={{
          id: produto.id,
          nome: produto.nome,
          codigo: produto.codigo,
          referencia: produto.referencia ?? "",
          marcaId: produto.marcaId,
          industriaId: produto.industriaId,
          unidade: produto.unidade,
          pesoLiquido: produto.pesoLiquido.toString(),
          preco: produto.preco.toString(),
          faixas: produto.faixasPreco.map((f) => ({
            id: f.id,
            quantidadeMinima: f.quantidadeMinima.toString(),
            quantidadeMaxima: f.quantidadeMaxima === null ? "" : f.quantidadeMaxima.toString(),
            preco: f.preco.toString(),
          })),
        }}
        marcas={marcas}
        industrias={industrias}
      />
    </div>
  );
}
