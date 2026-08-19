import { notFound } from "next/navigation";
import { Copy, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { StatusUpdater } from "@/components/pedidos/status-updater";
import { DeletePedidoButton } from "@/components/pedidos/delete-pedido-button";
import {
  formatCNPJ,
  formatCurrencyBRL,
  formatDateBR,
  formatDateTimeBR,
  formatNumberBR,
} from "@/lib/format";

export default async function DetalhePedidoPage({
  params,
}: PageProps<"/pedidos/[id]">) {
  const { id } = await params;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      itens: { orderBy: { ordem: "asc" } },
      parcelas: { orderBy: { numero: "asc" } },
    },
  });

  if (!pedido) notFound();

  const excluido = pedido.deletedAt !== null;

  return (
    <div>
      <PageHeader
        title={`Pedido #${pedido.numero}`}
        description={`Criado em ${formatDateTimeBR(pedido.createdAt)}`}
        actions={
          <>
            <ButtonLink href={`/pedidos/${pedido.id}/espelho`} variant="secondary">
              <FileText size={16} /> Ver Espelho
            </ButtonLink>
            {!excluido && (
              <>
                <ButtonLink href={`/pedidos/novo?duplicar=${pedido.id}`} variant="secondary">
                  <Copy size={16} /> Duplicar
                </ButtonLink>
                <StatusUpdater pedidoId={pedido.id} status={pedido.status} />
                <DeletePedidoButton
                  pedidoId={pedido.id}
                  numero={pedido.numero}
                  status={pedido.status}
                  variant="button"
                  redirectTo="/pedidos"
                />
              </>
            )}
          </>
        }
      />

      {excluido && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger dark:bg-red-500/10">
          Este pedido foi excluído em {formatDateTimeBR(pedido.deletedAt!)} — fica visível aqui só para consulta e
          auditoria.
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Card>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted">Cliente</p>
              <p className="font-medium">{pedido.clienteNomeSnapshot}</p>
              {pedido.clienteCnpjSnapshot && (
                <p className="text-xs text-muted">{formatCNPJ(pedido.clienteCnpjSnapshot)}</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase text-muted">Indústria (fornecedor)</p>
              <p className="font-medium">{pedido.industriaNomeSnapshot}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted">Transportadora</p>
              <p className="font-medium">{pedido.transportadoraNomeSnapshot ?? "Não informada"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted">Comprador</p>
              <p className="font-medium">{pedido.compradorNome}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted">Data do pedido</p>
              <p className="font-medium">{formatDateBR(pedido.dataPedido)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted">Forma de pagamento</p>
              <p className="font-medium">{pedido.formaPagamentoNomeSnapshot}</p>
            </div>
            {pedido.observacoes && (
              <div className="md:col-span-2">
                <p className="text-xs uppercase text-muted">Observações</p>
                <p>{pedido.observacoes}</p>
              </div>
            )}
            {pedido.enviadoWhatsappEm && (
              <div className="md:col-span-2">
                <p className="text-xs uppercase text-muted">Enviado para indústria em</p>
                <p className="font-medium">{formatDateTimeBR(pedido.enviadoWhatsappEm)}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Referência</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Peso Liq.</th>
                  <th className="px-4 py-3 font-medium">Quant.</th>
                  <th className="px-4 py-3 font-medium">Vr.Unit</th>
                  <th className="px-4 py-3 font-medium">Vr.Total</th>
                </tr>
              </thead>
              <tbody>
                {pedido.itens.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{item.codigoSnapshot}</td>
                    <td className="px-4 py-3">{item.referenciaSnapshot ?? "—"}</td>
                    <td className="px-4 py-3">{item.descricaoSnapshot}</td>
                    <td className="px-4 py-3">{formatNumberBR(item.pesoTotal.toString(), 3)}</td>
                    <td className="px-4 py-3">{formatNumberBR(item.quantidade.toString(), 3)}</td>
                    <td className="px-4 py-3">{formatCurrencyBRL(item.valorUnitarioSnapshot.toString())}</td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrencyBRL(item.valorTotal.toString())}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-semibold">
                  <td className="px-4 py-3" colSpan={3}>
                    Totais
                  </td>
                  <td className="px-4 py-3">{formatNumberBR(pedido.pesoTotal.toString(), 3)}</td>
                  <td className="px-4 py-3">{formatNumberBR(pedido.quantidadeTotal.toString(), 3)}</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3">{formatCurrencyBRL(pedido.valorTotal.toString())}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <Card className="p-0">
          <p className="border-b border-border px-4 py-3 text-sm font-semibold">
            Parcelas — {pedido.formaPagamentoNomeSnapshot}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Parcela</th>
                  <th className="px-4 py-2 font-medium">Vencimento</th>
                  <th className="px-4 py-2 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {pedido.parcelas.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      {p.numero} / {p.totalParcelas}
                    </td>
                    <td className="px-4 py-2">{formatDateBR(p.vencimento)}</td>
                    <td className="px-4 py-2">{formatCurrencyBRL(p.valor.toString())}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
