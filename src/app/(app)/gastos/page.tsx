"use client";

import { SimpleCrudManager } from "@/components/crud/simple-crud-manager";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";

type Gasto = {
  id: string;
  categoria: string;
  descricao: string;
  valor: string;
  data: string;
  observacoes: string | null;
};

export default function GastosPage() {
  return (
    <SimpleCrudManager<Gasto>
      title="Gastos da AWS"
      description="Controle de despesas gerais da distribuidora (aluguel, combustível, salário etc.)."
      apiBase="/api/gastos"
      newLabel="Novo Gasto"
      emptyTitle="Nenhum gasto cadastrado"
      fields={[
        { name: "categoria", label: "Categoria", required: true, placeholder: "Ex: Aluguel, Combustível, Comissão..." },
        { name: "descricao", label: "Descrição", required: true },
        { name: "valor", label: "Valor (R$)", type: "number", step: "0.01", required: true },
        { name: "data", label: "Data", type: "date", required: true },
        { name: "observacoes", label: "Observações" },
      ]}
      columns={[
        { key: "data", label: "Data", render: (item) => formatDateBR(item.data) },
        { key: "categoria", label: "Categoria" },
        { key: "descricao", label: "Descrição" },
        { key: "valor", label: "Valor", render: (item) => formatCurrencyBRL(item.valor) },
      ]}
    />
  );
}
