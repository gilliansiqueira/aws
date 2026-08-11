import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { IndustriaForm } from "@/components/crud/industria-form";
import { DeleteButton } from "@/components/crud/delete-button";

export default async function EditarIndustriaPage({
  params,
}: PageProps<"/industrias/[id]">) {
  const { id } = await params;

  const [industria, transportadoras] = await Promise.all([
    prisma.industria.findUnique({ where: { id } }),
    prisma.transportadora.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  if (!industria) notFound();

  return (
    <div>
      <PageHeader
        title={industria.nome}
        actions={
          <DeleteButton
            apiUrl={`/api/industrias/${id}`}
            redirectTo="/industrias"
          />
        }
      />
      <IndustriaForm
        initial={{
          id: industria.id,
          nome: industria.nome,
          cnpj: industria.cnpj ?? "",
          contatoNome: industria.contatoNome ?? "",
          contatoTelefone: industria.contatoTelefone ?? "",
          whatsapp: industria.whatsapp,
          transportadoraPadraoId: industria.transportadoraPadraoId ?? "",
          mensagemPadraoEnvio: industria.mensagemPadraoEnvio ?? "",
        }}
        transportadoras={transportadoras}
      />
    </div>
  );
}
