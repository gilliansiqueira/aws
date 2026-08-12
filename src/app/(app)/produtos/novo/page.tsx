import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { ProdutoForm } from "@/components/crud/produto-form";

export default async function NovoProdutoPage() {
  const [marcas, industrias] = await Promise.all([
    prisma.marca.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.industria.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Novo Produto" />
      <ProdutoForm marcas={marcas} industrias={industrias} />
    </div>
  );
}
