"use client";

import { SimpleCrudManager } from "@/components/crud/simple-crud-manager";

type Marca = { id: string; nome: string; cor: string };

export default function MarcasPage() {
  return (
    <SimpleCrudManager<Marca>
      title="Marcas"
      description="Marcas revendidas pela AWS. A cor é usada nos gráficos e no mapa de vendas."
      apiBase="/api/marcas"
      newLabel="Nova Marca"
      emptyTitle="Nenhuma marca cadastrada"
      fields={[
        { name: "nome", label: "Nome", required: true },
        { name: "cor", label: "Cor", type: "color", required: true },
      ]}
      columns={[
        {
          key: "cor",
          label: "Cor",
          render: (item) => (
            <span
              className="inline-block h-5 w-5 rounded-full border border-border align-middle"
              style={{ background: item.cor }}
              title={item.cor}
            />
          ),
        },
        { key: "nome", label: "Nome" },
      ]}
    />
  );
}
