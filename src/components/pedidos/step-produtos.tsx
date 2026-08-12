import { Plus, Trash2 } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/page-header";
import { Combobox } from "@/components/ui/combobox";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/format";
import type { ItemWizard, ProdutoOption } from "./types";

export function StepProdutos({
  produtos,
  industriaId,
  itens,
  onAdd,
  onRemove,
}: {
  produtos: ProdutoOption[];
  industriaId: string;
  itens: ItemWizard[];
  onAdd: (produto: ProdutoOption) => void;
  onRemove: (produtoId: string) => void;
}) {
  const disponiveis = produtos.filter(
    (p) => p.industriaId === industriaId && !itens.some((i) => i.produtoId === p.id),
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Combobox
          placeholder="Buscar produto por nome, código ou referência..."
          value=""
          onChange={(id) => {
            const produto = disponiveis.find((p) => p.id === id);
            if (produto) onAdd(produto);
          }}
          emptyText="Nenhum produto disponível para esta indústria"
          options={disponiveis.map((p) => ({
            id: p.id,
            label: p.nome,
            sublabel: `${p.codigo}${p.referencia ? ` · ${p.referencia}` : ""} · ${formatCurrencyBRL(p.preco)}`,
          }))}
        />
        <p className="mt-2 text-xs text-muted">
          Mostrando apenas produtos da indústria selecionada na etapa anterior.
        </p>
      </Card>

      <Card className="p-0">
        {itens.length === 0 ? (
          <EmptyState title="Nenhum produto adicionado ainda" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Marca</th>
                  <th className="px-4 py-3 font-medium">Peso Líq. Un.</th>
                  <th className="px-4 py-3 font-medium">Preço</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.produtoId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{item.codigo}</td>
                    <td className="px-4 py-3 font-medium">{item.descricao}</td>
                    <td className="px-4 py-3">{item.marcaNome}</td>
                    <td className="px-4 py-3">
                      {formatNumberBR(item.pesoLiquidoUnit, 3)} kg
                    </td>
                    <td className="px-4 py-3">{formatCurrencyBRL(item.valorUnitario)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onRemove(item.produtoId)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-danger"
                        aria-label="Remover"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {itens.length > 0 && (
        <p className="flex items-center gap-1 text-xs text-muted">
          <Plus size={12} /> {itens.length} produto(s) adicionado(s). Ajuste as quantidades e
          preços na próxima etapa.
        </p>
      )}
    </div>
  );
}
