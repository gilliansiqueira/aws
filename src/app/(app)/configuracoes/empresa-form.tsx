"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/page-header";
import { Input, Label, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { formatCEP, formatCNPJ, formatPhone, onlyDigits } from "@/lib/format";
import { ESTADOS_BR } from "@/lib/estados-br";

export type EmpresaData = {
  nome: string;
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
};

export function EmpresaForm({ initial }: { initial: EmpresaData }) {
  const router = useRouter();
  const [form, setForm] = useState<EmpresaData>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof EmpresaData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const payload = {
      ...form,
      cnpj: onlyDigits(form.cnpj),
      cep: onlyDigits(form.cep),
      telefone: onlyDigits(form.telefone),
    };

    const res = await fetch("/api/empresa", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar.");
      return;
    }

    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-muted">
          Dados da AWS (usados no cabeçalho do espelho)
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label required>Nome fantasia</Label>
            <Input
              required
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
            />
          </div>
          <div>
            <Label required>Razão social</Label>
            <Input
              required
              value={form.razaoSocial}
              onChange={(e) => set("razaoSocial", e.target.value)}
            />
          </div>
          <div>
            <Label required>CNPJ</Label>
            <Input
              required
              value={formatCNPJ(form.cnpj)}
              onChange={(e) => set("cnpj", e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div>
            <Label required>Telefone</Label>
            <Input
              required
              value={formatPhone(form.telefone)}
              onChange={(e) => set("telefone", e.target.value)}
              placeholder="(00) 0000-0000"
            />
          </div>
          <div className="md:col-span-2">
            <Label required>Endereço</Label>
            <Input
              required
              value={form.endereco}
              onChange={(e) => set("endereco", e.target.value)}
            />
          </div>
          <div>
            <Label required>Bairro</Label>
            <Input
              required
              value={form.bairro}
              onChange={(e) => set("bairro", e.target.value)}
            />
          </div>
          <div>
            <Label required>Cidade</Label>
            <Input
              required
              value={form.cidade}
              onChange={(e) => set("cidade", e.target.value)}
            />
          </div>
          <div>
            <Label required>UF</Label>
            <Select required value={form.uf} onChange={(e) => set("uf", e.target.value)}>
              <option value="">—</option>
              {ESTADOS_BR.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>CEP</Label>
            <Input
              required
              value={formatCEP(form.cep)}
              onChange={(e) => set("cep", e.target.value)}
              placeholder="00000-000"
            />
          </div>
        </div>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-success">Salvo com sucesso!</span>}
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
