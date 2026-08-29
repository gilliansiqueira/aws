import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/format";

export default async function ProdutosPage({
  searchParams,
}: PageProps<"/produtos">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const produtos = await prisma.produto.findMany({
    where: q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { codigo: { contains: q, mode: "insensitive" } },
            { referencia: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { marca: true, industria: true, _count: { select: { faixasPreco: true } } },
    orderBy: { nome: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Catálogo de produtos das indústrias revendidas."
        actions={
          <ButtonLink href="/produtos/novo">
            <Plus size={16} /> Novo Produto
          </ButtonLink>
        }
      />

      <form className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, código ou referência..."
          className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </form>

      <Card className="p-0">
        {produtos.length === 0 ? (
          <EmptyState title="Nenhum produto encontrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Marca</th>
                  <th className="px-4 py-3 font-medium">Indústria</th>
                  <th className="px-4 py-3 font-medium">Peso Líq.</th>
                  <th className="px-4 py-3 font-medium">Preço</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{p.codigo}</td>
                    <td className="px-4 py-3 font-medium">{p.nome}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ background: p.marca.cor }}
                        />
                        {p.marca.nome}
                      </span>
                    </td>
                    <td className="px-4 py-3">{p.industria.nome}</td>
                    <td className="px-4 py-3">
                      {formatNumberBR(p.pesoLiquido.toString(), 3)} kg
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrencyBRL(p.preco.toString())}
                      {p._count.faixasPreco > 0 && (
                        <span className="ml-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                          {p._count.faixasPreco} faixa{p._count.faixasPreco > 1 ? "s" : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/produtos/${p.id}`}
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
