import { Card } from "@/components/ui/page-header";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/field";
import { formatCNPJ } from "@/lib/format";
import type { ClienteOption, IndustriaOption } from "./types";

export function StepCliente({
  clientes,
  industrias,
  clienteId,
  industriaId,
  onChangeCliente,
  onChangeIndustria,
}: {
  clientes: ClienteOption[];
  industrias: IndustriaOption[];
  clienteId: string;
  industriaId: string;
  onChangeCliente: (id: string) => void;
  onChangeIndustria: (id: string) => void;
}) {
  const clienteSelecionado = clientes.find((c) => c.id === clienteId);
  const industriaSelecionada = industrias.find((i) => i.id === industriaId);

  return (
    <Card>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label required>Cliente</Label>
          <Combobox
            placeholder="Buscar cliente por nome ou CNPJ..."
            value={clienteId}
            onChange={onChangeCliente}
            options={clientes.map((c) => ({
              id: c.id,
              label: c.nome,
              sublabel: [formatCNPJ(c.cnpj), c.cidade, c.uf].filter(Boolean).join(" — "),
            }))}
          />
          {clienteSelecionado && (
            <p className="mt-2 text-xs text-muted">
              {[
                formatCNPJ(clienteSelecionado.cnpj),
                [clienteSelecionado.cidade, clienteSelecionado.uf].filter(Boolean).join("/"),
              ]
                .filter(Boolean)
                .join(" · ") || "Sem dados adicionais cadastrados"}
            </p>
          )}
        </div>

        <div>
          <Label required>Indústria (fornecedor)</Label>
          <Combobox
            placeholder="Buscar indústria..."
            value={industriaId}
            onChange={onChangeIndustria}
            options={industrias.map((i) => ({ id: i.id, label: i.nome }))}
          />
          {industriaSelecionada && (
            <p className="mt-2 text-xs text-muted">
              WhatsApp para envio: {industriaSelecionada.whatsapp}
            </p>
          )}
        </div>
      </div>

      {clientes.length === 0 && (
        <p className="mt-4 text-sm text-danger">
          Nenhum cliente cadastrado. Cadastre um cliente antes de criar um pedido.
        </p>
      )}
      {industrias.length === 0 && (
        <p className="mt-2 text-sm text-danger">
          Nenhuma indústria cadastrada. Cadastre uma indústria antes de criar um pedido.
        </p>
      )}
    </Card>
  );
}
