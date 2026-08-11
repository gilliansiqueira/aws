import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { IndustriaForm } from "@/components/crud/industria-form";

export default async function NovaIndustriaPage() {
  const transportadoras = await prisma.transportadora.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div>
      <PageHeader title="Nova Indústria" />
      <IndustriaForm transportadoras={transportadoras} />
    </div>
  );
}
