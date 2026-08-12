import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { ClienteForm } from "@/components/crud/cliente-form";

export default async function NovoClientePage() {
  const formasPagamento = await prisma.formaPagamento.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div>
      <PageHeader title="Novo Cliente" />
      <ClienteForm formasPagamento={formasPagamento} />
    </div>
  );
}
