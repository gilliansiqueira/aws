import { Card } from "@/components/ui/page-header";
import { formatCNPJ, formatCurrencyBRL, formatNumberBR } from "@/lib/format";
import type {
  ClienteOption,
  FormaPagamentoOption,
  IndustriaOption,
  ItemWizard,
  TransportadoraOption,
} from "./types";

export function StepRevisao({
  cliente,
  industria,
  transportadora,
  formaPagamento,
  compradorNome,
  observacoes,
  itens,
  subtotal,
  descontoPercentual,
  valorTotal,
}: {
  cliente: ClienteOption | undefined;
  industria: IndustriaOption | undefined;
  transportadora: TransportadoraOption | undefined;
  formaPagamento: FormaPagamentoOption | undefined;
  compradorNome: string;
  observacoes: string;
  itens: ItemWizard[];
  subtotal: number;
  descontoPercentual: number;
  valorTotal: number;
}) {
  const pesoTotal = itens.reduce((acc, i) => acc + i.pesoLiquidoUnit * i.quantidade, 0);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted">Cliente</p>
            <p className="font-medium">{cliente?.nome ?? "—"}</p>
            {cliente?.cnpj && <p className="text-xs text-muted">{formatCNPJ(cliente.cnpj)}</p>}
          </div>
          <div>
            <p className="text-xs uppercase text-muted">Indústria (fornecedor)</p>
            <p className="font-medium">{industria?.nome ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted">Transportadora</p>
            <p className="font-medium">{transportadora?.nome ?? "Não informada"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted">Comprador</p>
            <p className="font-medium">{compradorNome || "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted">Forma de pagamento</p>
            <p className="font-medium">{formaPagamento?.nome ?? "—"}</p>
          </div>
          {observacoes && (
            <div className="md:col-span-2">
              <p className="text-xs uppercase text-muted">Observações</p>
              <p>{observacoes}</p>
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
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Peso Liq.</th>
                <th className="px-4 py-3 font-medium">Quant.</th>
                <th className="px-4 py-3 font-medium">Vr.Unit</th>
                <th className="px-4 py-3 font-medium">Vr.Total</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.produtoId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{item.codigo}</td>
                  <td className="px-4 py-3">{item.descricao}</td>
                  <td className="px-4 py-3">
                    {formatNumberBR(item.pesoLiquidoUnit * item.quantidade, 3)}
                  </td>
                  <td className="px-4 py-3">{formatNumberBR(item.quantidade, 3)}</td>
                  <td className="px-4 py-3">{formatCurrencyBRL(item.valorUnitario)}</td>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrencyBRL(item.valorUnitario * item.quantidade)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-semibold">
                <td className="px-4 py-3" colSpan={2}>
                  Totais
                </td>
                <td className="px-4 py-3">{formatNumberBR(pesoTotal, 3)}</td>
                <td className="px-4 py-3" colSpan={2} />
                <td className="px-4 py-3">{formatCurrencyBRL(subtotal)}</td>
              </tr>
              {descontoPercentual > 0 && (
                <tr className="text-danger">
                  <td className="px-4 py-2" colSpan={5}>
                    Desconto ({descontoPercentual}%)
                  </td>
                  <td className="px-4 py-2">-{formatCurrencyBRL(subtotal - valorTotal)}</td>
                </tr>
              )}
              {descontoPercentual > 0 && (
                <tr className="border-t border-border text-base font-bold">
                  <td className="px-4 py-3" colSpan={5}>
                    Total com desconto
                  </td>
                  <td className="px-4 py-3">{formatCurrencyBRL(valorTotal)}</td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
