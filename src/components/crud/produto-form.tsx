"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/page-header";
import { Input, Label, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Option = { id: string; nome: string };

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
};

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
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ProdutoFormData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      referencia: form.referencia || null,
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
            <Label required>Preço (R$)</Label>
            <Input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.preco}
              onChange={(e) => set("preco", e.target.value)}
            />
          </div>
        </div>
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
