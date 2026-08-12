"use client";

import { SimpleCrudManager } from "@/components/crud/simple-crud-manager";

type FormaPagamento = {
  id: string;
  nome: string;
  numeroParcelas: number;
  intervaloDias: number;
  primeiraParcelaDias: number;
};

export default function FormasPagamentoPage() {
  return (
    <SimpleCrudManager<FormaPagamento>
      title="Formas de Pagamento"
      description="Condições de prazo usadas nos pedidos (ex: BOLETO BANCARIO, A VISTA)."
      apiBase="/api/formas-pagamento"
      newLabel="Nova Forma de Pagamento"
      emptyTitle="Nenhuma forma de pagamento cadastrada"
      fields={[
        { name: "nome", label: "Nome (ex: BOLETO BANCARIO)", required: true },
        {
          name: "numeroParcelas",
          label: "Número de parcelas",
          type: "number",
          required: true,
        },
        {
          name: "primeiraParcelaDias",
          label: "Prazo da 1ª parcela (dias)",
          type: "number",
          required: true,
        },
        {
          name: "intervaloDias",
          label: "Intervalo entre parcelas (dias)",
          type: "number",
          required: true,
        },
      ]}
      columns={[
        { key: "nome", label: "Nome" },
        { key: "numeroParcelas", label: "Parcelas" },
        {
          key: "primeiraParcelaDias",
          label: "1ª parcela",
          render: (item) => `${item.primeiraParcelaDias} dias`,
        },
        {
          key: "intervaloDias",
          label: "Intervalo",
          render: (item) => `${item.intervaloDias} dias`,
        },
      ]}
    />
  );
}
