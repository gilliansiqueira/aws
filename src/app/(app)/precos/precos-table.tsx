"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/page-header";
import { Input } from "@/components/ui/field";
import { ClientPagination } from "@/components/ui/client-pagination";

const PAGE_SIZE = 30;

type Item = {
  id: string;
  nome: string;
  codigo: string;
  marcaNome: string;
  marcaCor: string;
  industriaNome: string;
  preco: string;
  numFaixas: number;
};

export function PrecosTable({ items }: { items: Item[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(items.map((i) => [i.id, i.preco])),
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = items.filter(
    (i) =>
      i.nome.toLowerCase().includes(search.toLowerCase()) ||
      i.codigo.toLowerCase().includes(search.toLowerCase()),
  );

  // Volta pra página 1 sempre que a busca muda o resultado — ajuste de
  // estado durante o render (padrão do projeto), sem useEffect.
  const [searchProcessada, setSearchProcessada] = useState(search);
  if (search !== searchProcessada) {
    setSearchProcessada(search);
    setPage(1);
  }

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleSave(id: string) {
    setSaving((s) => ({ ...s, [id]: true }));
    setSaved((s) => ({ ...s, [id]: false }));

    const res = await fetch(`/api/produtos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preco: Number(values[id]) }),
    });

    setSaving((s) => ({ ...s, [id]: false }));

    if (res.ok) {
      setSaved((s) => ({ ...s, [id]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [id]: false })), 1500);
    }
  }

  return (
    <>
      <input
        type="text"
        placeholder="Buscar por nome ou código..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />

      <Card className="p-0">
        {filtered.length === 0 ? (
          <EmptyState title="Nenhum produto encontrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Marca</th>
                  <th className="px-4 py-3 font-medium">Indústria</th>
                  <th className="px-4 py-3 font-medium">Preço (R$)</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paged.map((item) => {
                  const changed = values[item.id] !== item.preco;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        {item.codigo}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {item.nome}
                        {item.numFaixas > 0 && (
                          <span className="ml-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                            {item.numFaixas} faixa{item.numFaixas > 1 ? "s" : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: item.marcaCor }}
                          />
                          {item.marcaNome}
                        </span>
                      </td>
                      <td className="px-4 py-3">{item.industriaNome}</td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-32"
                          value={values[item.id]}
                          onChange={(e) =>
                            setValues((v) => ({
                              ...v,
                              [item.id]: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        {changed && (
                          <button
                            onClick={() => handleSave(item.id)}
                            disabled={saving[item.id]}
                            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
                          >
                            {saving[item.id] ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              "Salvar"
                            )}
                          </button>
                        )}
                        {saved[item.id] && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                            <Check size={14} /> Salvo
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <ClientPagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </Card>
    </>
  );
}
