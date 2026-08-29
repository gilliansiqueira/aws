"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/page-header";
import { Input, Label, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Option = { id: string; nome: string };

export type FaixaPrecoFormData = {
  id?: string;
  quantidadeMinima: string;
  quantidadeMaxima: string; // vazio = sem limite superior
  preco: string;
};

export type ProdutoFormData = {
  id?: string;
  nome: string;
  codigo: string;
  referencia: string;
  marcaId: string;
  industriaId: string;
  unidade: string;
  pesoLiquido: string;
  preco: string;
  faixas: FaixaPrecoFormData[];
};

function novaFaixa(): FaixaPrecoFormData {
  return { quantidadeMinima: "", quantidadeMaxima: "", preco: "" };
}

export function ProdutoForm({
  initial,
  marcas,
  industrias,
}: {
  initial?: Partial<ProdutoFormData> & { id?: string };
  marcas: Option[];
  industrias: Option[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProdutoFormData>({
    nome: initial?.nome ?? "",
    codigo: initial?.codigo ?? "",
    referencia: initial?.referencia ?? "",
    marcaId: initial?.marcaId ?? "",
    industriaId: initial?.industriaId ?? "",
    unidade: initial?.unidade ?? "UN",
    pesoLiquido: initial?.pesoLiquido ?? "",
    preco: initial?.preco ?? "",
    faixas: initial?.faixas ?? [],
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ProdutoFormData>(key: K, value: ProdutoFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addFaixa() {
    setForm((f) => ({ ...f, faixas: [...f.faixas, novaFaixa()] }));
  }

  function removeFaixa(index: number) {
    setForm((f) => ({ ...f, faixas: f.faixas.filter((_, i) => i !== index) }));
  }

  function updateFaixa(index: number, patch: Partial<FaixaPrecoFormData>) {
    setForm((f) => ({
      ...f,
      faixas: f.faixas.map((faixa, i) => (i === index ? { ...faixa, ...patch } : faixa)),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      referencia: form.referencia || null,
      faixas: form.faixas.map((f) => ({
        quantidadeMinima: f.quantidadeMinima,
        quantidadeMaxima: f.quantidadeMaxima === "" ? null : f.quantidadeMaxima,
        preco: f.preco,
      })),
    };

    const url = initial?.id ? `/api/produtos/${initial.id}` : "/api/produtos";
    const method = initial?.id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar.");
      return;
    }

    router.push("/produtos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label required>Nome</Label>
            <Input
              required
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
            />
          </div>
          <div>
            <Label required>Código</Label>
            <Input
              required
              value={form.codigo}
              onChange={(e) => set("codigo", e.target.value)}
            />
          </div>
          <div>
            <Label>Referência</Label>
            <Input
              value={form.referencia}
              onChange={(e) => set("referencia", e.target.value)}
            />
          </div>
          <div>
            <Label required>Marca</Label>
            <Select
              required
              value={form.marcaId}
              onChange={(e) => set("marcaId", e.target.value)}
            >
              <option value="">Selecione...</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>Indústria</Label>
            <Select
              required
              value={form.industriaId}
              onChange={(e) => set("industriaId", e.target.value)}
            >
              <option value="">Selecione...</option>
              {industrias.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>Unidade</Label>
            <Input
              required
              value={form.unidade}
              onChange={(e) => set("unidade", e.target.value)}
              placeholder="UN, CX, KG..."
            />
          </div>
          <div>
            <Label required>Peso líquido unitário (kg)</Label>
            <Input
              required
              type="number"
              step="0.001"
              min="0"
              value={form.pesoLiquido}
              onChange={(e) => set("pesoLiquido", e.target.value)}
            />
          </div>
          <div>
            <Label required>Preço padrão (R$)</Label>
            <Input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.preco}
              onChange={(e) => set("preco", e.target.value)}
            />
            <p className="mt-1 text-xs text-muted">
              Usado quando não há faixa de preço cadastrada, ou quando a quantidade do
              pedido não se encaixa em nenhuma faixa abaixo.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Faixas de preço</h3>
            <p className="text-xs text-muted">
              Opcional. Preço sugerido automaticamente no pedido conforme a quantidade
              (na mesma unidade do produto: {form.unidade || "UN"}).
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addFaixa}>
            <Plus size={14} /> Adicionar faixa
          </Button>
        </div>

        {form.faixas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted">
            Nenhuma faixa cadastrada — o preço padrão acima será sempre usado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-2 py-2 font-medium">De</th>
                  <th className="px-2 py-2 font-medium">Até</th>
                  <th className="px-2 py-2 font-medium">Preço (R$)</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {form.faixas.map((faixa, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    <td className="px-2 py-2">
                      <Input
                        required
                        type="number"
                        min="0"
                        step="0.001"
                        className="w-28"
                        value={faixa.quantidadeMinima}
                        onChange={(e) =>
                          updateFaixa(index, { quantidadeMinima: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        className="w-28"
                        placeholder="sem limite"
                        value={faixa.quantidadeMaxima}
                        onChange={(e) =>
                          updateFaixa(index, { quantidadeMaxima: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-28"
                        value={faixa.preco}
                        onChange={(e) => updateFaixa(index, { preco: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeFaixa(index)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-danger"
                        aria-label="Remover faixa"
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

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/produtos")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
