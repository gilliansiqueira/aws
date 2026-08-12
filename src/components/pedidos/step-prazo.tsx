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
  valorTotal,
  onChangeTransportadora,
  onChangeComprador,
  onChangeFormaPagamento,
  onChangeObservacoes,
}: {
  transportadoras: TransportadoraOption[];
  formasPagamento: FormaPagamentoOption[];
  transportadoraId: string;
  compradorNome: string;
  formaPagamentoId: string;
  observacoes: string;
  valorTotal: number;
  onChangeTransportadora: (id: string) => void;
  onChangeComprador: (value: string) => void;
  onChangeFormaPagamento: (id: string) => void;
  onChangeObservacoes: (value: string) => void;
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
