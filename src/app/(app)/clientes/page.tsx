import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { formatCNPJ } from "@/lib/format";

export default async function ClientesPage({
  searchParams,
}: PageProps<"/clientes">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const clientes = await prisma.cliente.findMany({
    where: q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { cnpj: { contains: q, mode: "insensitive" } },
            { cidade: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { nome: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Carteira de clientes da AWS."
        actions={
          <ButtonLink href="/clientes/novo">
            <Plus size={16} /> Novo Cliente
          </ButtonLink>
        }
      />

      <form className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, CNPJ ou cidade..."
          className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </form>

      <Card className="p-0">
        {clientes.length === 0 ? (
          <EmptyState title="Nenhum cliente encontrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">CNPJ</th>
                  <th className="px-4 py-3 font-medium">Cidade/UF</th>
                  <th className="px-4 py-3 font-medium">Contato</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3 font-medium">{c.nome}</td>
                    <td className="px-4 py-3">{formatCNPJ(c.cnpj)}</td>
                    <td className="px-4 py-3">
                      {[c.cidade, c.uf].filter(Boolean).join("/") || "—"}
                    </td>
                    <td className="px-4 py-3">{c.contatoNome ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
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
