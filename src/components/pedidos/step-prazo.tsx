import { Card } from "@/components/ui/page-header";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { calcularParcelas } from "@/lib/pedido-calc";
import type { FormaPagamentoOption, TransportadoraOption } from "./types";

export function StepPrazo({
  transportadoras,
  formasPagamento,
  transportadoraId,
  compradorNome,
  formaPagamentoId,
  observacoes,
  subtotal,
  descontoPercentual,
  valorTotal,
  onChangeTransportadora,
  onChangeComprador,
  onChangeFormaPagamento,
  onChangeObservacoes,
  onChangeDesconto,
}: {
  transportadoras: TransportadoraOption[];
  formasPagamento: FormaPagamentoOption[];
  transportadoraId: string;
  compradorNome: string;
  formaPagamentoId: string;
  observacoes: string;
  subtotal: number;
  descontoPercentual: number;
  valorTotal: number;
  onChangeTransportadora: (id: string) => void;
  onChangeComprador: (value: string) => void;
  onChangeFormaPagamento: (id: string) => void;
  onChangeObservacoes: (value: string) => void;
  onChangeDesconto: (value: number) => void;
}) {
  const formaSelecionada = formasPagamento.find((f) => f.id === formaPagamentoId);
  const parcelas = formaSelecionada
    ? calcularParcelas(
        valorTotal,
        formaSelecionada,
        new Date(),
      )
    : [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label required>Comprador</Label>
            <Input
              required
              value={compradorNome}
              onChange={(e) => onChangeComprador(e.target.value)}
              placeholder="Nome de quem está comprando/assinando"
            />
          </div>
          <div>
            <Label>Transportadora</Label>
            <Select
              value={transportadoraId}
              onChange={(e) => onChangeTransportadora(e.target.value)}
            >
              <option value="">Nenhuma</option>
              {transportadoras.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label required>Forma de pagamento</Label>
            <Select
              required
              value={formaPagamentoId}
              onChange={(e) => onChangeFormaPagamento(e.target.value)}
            >
              <option value="">Selecione...</option>
              {formasPagamento.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} ({f.numeroParcelas}x)
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Observações</Label>
            <Textarea
              rows={3}
              value={observacoes}
              onChange={(e) => onChangeObservacoes(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-3 md:items-end">
          <div>
            <Label>Desconto (%)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={descontoPercentual || ""}
              onChange={(e) => onChangeDesconto(Number(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1 text-sm md:col-span-2 md:items-end">
            <div className="flex w-full max-w-[220px] justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatCurrencyBRL(subtotal)}</span>
            </div>
            {descontoPercentual > 0 && (
              <div className="flex w-full max-w-[220px] justify-between text-danger">
                <span>Desconto ({descontoPercentual}%)</span>
                <span>-{formatCurrencyBRL(subtotal - valorTotal)}</span>
              </div>
            )}
            <div className="flex w-full max-w-[220px] justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrencyBRL(valorTotal)}</span>
            </div>
          </div>
        </div>
      </Card>

      {formaSelecionada && parcelas.length > 0 && (
        <Card className="p-0">
          <p className="border-b border-border px-4 py-3 text-sm font-semibold">
            Parcelas — {formaSelecionada.nome}
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
                {parcelas.map((p) => (
                  <tr key={p.numero} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      {p.numero} / {p.totalParcelas}
                    </td>
                    <td className="px-4 py-2">{formatDateBR(p.vencimento)}</td>
                    <td className="px-4 py-2">{formatCurrencyBRL(p.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
