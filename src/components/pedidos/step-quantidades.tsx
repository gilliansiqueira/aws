import { AlertTriangle } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/page-header";
import { Input } from "@/components/ui/field";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/format";
import { encontrarFaixaPreco } from "@/lib/pedido-calc";
import type { ItemWizard, ProdutoOption } from "./types";

export function StepQuantidades({
  itens,
  produtos,
  onChange,
}: {
  itens: ItemWizard[];
  produtos: ProdutoOption[];
  onChange: (produtoId: string, patch: Partial<Pick<ItemWizard, "quantidade" | "valorUnitario">>) => void;
}) {
  const pesoTotal = itens.reduce((acc, i) => acc + i.pesoLiquidoUnit * i.quantidade, 0);
  const quantidadeTotal = itens.reduce((acc, i) => acc + i.quantidade, 0);
  const valorTotal = itens.reduce((acc, i) => acc + i.valorUnitario * i.quantidade, 0);

  if (itens.length === 0) {
    return (
      <Card className="p-0">
        <EmptyState
          title="Nenhum produto adicionado"
          description="Volte para a etapa anterior e adicione ao menos um produto."
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Quant.</th>
                <th className="px-4 py-3 font-medium">Vr. Unit.</th>
                <th className="px-4 py-3 font-medium">Peso Total</th>
                <th className="px-4 py-3 font-medium">Vr. Total</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => {
                const produto = produtos.find((p) => p.id === item.produtoId);
                const faixas = produto?.faixas ?? [];
                const faixaAplicada = encontrarFaixaPreco(faixas, item.quantidade);
                const semFaixaCorrespondente = faixas.length > 0 && !faixaAplicada;

                return (
                  <tr key={item.produtoId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.descricao}</p>
                      <p className="text-xs text-muted">{item.codigo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0.001"
                        step="0.001"
                        className="w-24"
                        value={item.quantidade}
                        onChange={(e) =>
                          onChange(item.produtoId, { quantidade: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-28"
                        value={item.valorUnitario}
                        onChange={(e) =>
                          onChange(item.produtoId, { valorUnitario: Number(e.target.value) })
                        }
                      />
                      {faixaAplicada && !item.precoManual && (
                        <p className="mt-1 text-xs text-success">
                          Faixa {formatNumberBR(faixaAplicada.quantidadeMinima, 0)}
                          {faixaAplicada.quantidadeMaxima !== null
                            ? `–${formatNumberBR(faixaAplicada.quantidadeMaxima, 0)}`
                            : "+"}
                          : {formatCurrencyBRL(faixaAplicada.preco)}
                        </p>
                      )}
                      {semFaixaCorrespondente && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-warning">
                          <AlertTriangle size={12} /> Sem faixa para esta quantidade — confira o preço
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatNumberBR(item.pesoLiquidoUnit * item.quantidade, 3)} kg
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {formatCurrencyBRL(item.valorUnitario * item.quantidade)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs uppercase text-muted">Peso Total</p>
            <p className="text-lg font-semibold">{formatNumberBR(pesoTotal, 3)} kg</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted">Quantidade Total</p>
            <p className="text-lg font-semibold">{formatNumberBR(quantidadeTotal, 3)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted">Valor Total</p>
            <p className="text-lg font-semibold text-brand">{formatCurrencyBRL(valorTotal)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
