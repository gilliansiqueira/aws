import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { formatCNPJ, formatPhone } from "@/lib/format";

export default async function IndustriasPage() {
  const industrias = await prisma.industria.findMany({
    include: { transportadoraPadrao: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Indústrias"
        description="Fornecedores que fabricam os produtos revendidos pela AWS."
        actions={
          <ButtonLink href="/industrias/novo">
            <Plus size={16} /> Nova Indústria
          </ButtonLink>
        }
      />

      <Card className="p-0">
        {industrias.length === 0 ? (
          <EmptyState title="Nenhuma indústria cadastrada" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">CNPJ</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Transportadora padrão</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {industrias.map((ind) => (
                  <tr
                    key={ind.id}
                    className="border-b border-border last:border-0 hover:bg-black/[0.02]"
                  >
                    <td className="px-4 py-3 font-medium">{ind.nome}</td>
                    <td className="px-4 py-3">{formatCNPJ(ind.cnpj)}</td>
                    <td className="px-4 py-3">{formatPhone(ind.whatsapp)}</td>
                    <td className="px-4 py-3">
                      {ind.transportadoraPadrao?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/industrias/${ind.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground"
                        aria-label="Editar"
                      >
                        <Pencil size={15} />
                      </Link>
                    </td>
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
