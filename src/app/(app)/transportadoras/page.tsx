"use client";

import { SimpleCrudManager } from "@/components/crud/simple-crud-manager";
import { formatPhone } from "@/lib/format";

type Transportadora = { id: string; nome: string; telefone: string | null };

export default function TransportadorasPage() {
  return (
    <SimpleCrudManager<Transportadora>
      title="Transportadoras"
      description="Transportadoras usadas nos pedidos e como padrão nas indústrias."
      apiBase="/api/transportadoras"
      newLabel="Nova Transportadora"
      emptyTitle="Nenhuma transportadora cadastrada"
      fields={[
        { name: "nome", label: "Nome", required: true },
        { name: "telefone", label: "Telefone" },
      ]}
      columns={[
        { key: "nome", label: "Nome" },
        {
          key: "telefone",
          label: "Telefone",
          render: (item) => formatPhone(item.telefone),
        },
      ]}
    />
  );
}
