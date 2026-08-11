import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { ClienteForm } from "@/components/crud/cliente-form";
import { DeleteButton } from "@/components/crud/delete-button";

export default async function EditarClientePage({
  params,
}: PageProps<"/clientes/[id]">) {
  const { id } = await params;

  const [cliente, formasPagamento] = await Promise.all([
    prisma.cliente.findUnique({ where: { id } }),
    prisma.formaPagamento.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  if (!cliente) notFound();

  return (
    <div>
      <PageHeader
        title={cliente.nome}
        actions={
          <DeleteButton apiUrl={`/api/clientes/${id}`} redirectTo="/clientes" />
        }
      />
      <ClienteForm
        initial={{
          id: cliente.id,
          nome: cliente.nome,
          cnpj: cliente.cnpj ?? "",
          endereco: cliente.endereco ?? "",
          bairro: cliente.bairro ?? "",
          cidade: cliente.cidade ?? "",
          uf: cliente.uf ?? "",
          cep: cliente.cep ?? "",
          contatoNome: cliente.contatoNome ?? "",
          telefone: cliente.telefone ?? "",
          whatsapp: cliente.whatsapp ?? "",
          latitude: cliente.latitude?.toString() ?? "",
          longitude: cliente.longitude?.toString() ?? "",
          formaPagamentoPadraoId: cliente.formaPagamentoPadraoId ?? "",
          compradorPadrao: cliente.compradorPadrao ?? "",
        }}
        formasPagamento={formasPagamento}
      />
    </div>
  );
}
