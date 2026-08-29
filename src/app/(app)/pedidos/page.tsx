import Link from "next/link";
import { Plus, Camera, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeletePedidoButton } from "@/components/pedidos/delete-pedido-button";
import { Select } from "@/components/ui/field";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import {
  STATUS_PEDIDO_COLORS,
  STATUS_PEDIDO_LABELS,
  STATUS_PEDIDO_ORDER,
} from "@/lib/pedido-status";
import type { Prisma, StatusPedido } from "@/generated/prisma/client";

export default async function PedidosPage({
  searchParams,
}: PageProps<"/pedidos">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const q = typeof params.q === "string" ? params.q : "";
  const industriaId = typeof params.industriaId === "string" ? params.industriaId : "";

  const where: Prisma.PedidoWhereInput = {
    deletedAt: null,
    AND: [
      status ? { status: status as StatusPedido } : {},
      industriaId ? { industriaId } : {},
      q
        ? {
            OR: [
              { clienteNomeSnapshot: { contains: q, mode: "insensitive" } },
              ...(Number.isNaN(Number(q)) ? [] : [{ numero: Number(q) }]),
            ],
          }
        : {},
    ],
  };

  const [pedidos, industrias] = await Promise.all([
    prisma.pedido.findMany({ where, orderBy: { numero: "desc" }, take: 200 }),
    prisma.industria.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Histórico de pedidos realizados."
        actions={
          <>
            <ButtonLink href="/pedidos/importar-foto" variant="secondary">
              <Camera size={16} /> Novo Pedido por Foto
            </ButtonLink>
            <ButtonLink href="/pedidos/novo">
              <Plus size={16} /> Novo Pedido
            </ButtonLink>
          </>
        }
      />

      <form className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nº ou cliente..."
          className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <Select name="status" defaultValue={status} className="w-auto max-w-[220px]">
          <option value="">Todos os status</option>
          {STATUS_PEDIDO_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_PEDIDO_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select name="industriaId" defaultValue={industriaId} className="w-auto max-w-[220px]">
          <option value="">Todas as indústrias</option>
          {industrias.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nome}
            </option>
          ))}
        </Select>
        <button
          type="submit"
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
        >
          Filtrar
        </button>
      </form>

      <Card className="p-0">
        {pedidos.length === 0 ? (
          <EmptyState title="Nenhum pedido encontrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nº</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Indústria</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <Link href={`/pedidos/${p.id}`} className="font-semibold text-brand hover:underline">
                        #{p.numero}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatDateBR(p.dataPedido)}</td>
                    <td className="px-4 py-3">{p.clienteNomeSnapshot}</td>
                    <td className="px-4 py-3">{p.industriaNomeSnapshot}</td>
                    <td className="px-4 py-3">
                      <Badge color={STATUS_PEDIDO_COLORS[p.status]}>
                        {STATUS_PEDIDO_LABELS[p.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrencyBRL(p.valorTotal.toString())}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/pedidos/${p.id}/espelho`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                          aria-label="Ver espelho do pedido"
                          title="Ver espelho do pedido"
                        >
                          <FileText size={15} />
                        </Link>
                        <DeletePedidoButton pedidoId={p.id} numero={p.numero} status={p.status} />
                      </div>
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
