"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/page-header";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { formatCNPJ, formatPhone, onlyDigits } from "@/lib/format";

type Transportadora = { id: string; nome: string };

export type IndustriaFormData = {
  id?: string;
  nome: string;
  cnpj: string;
  contatoNome: string;
  contatoTelefone: string;
  whatsapp: string;
  transportadoraPadraoId: string;
  mensagemPadraoEnvio: string;
};

export function IndustriaForm({
  initial,
  transportadoras,
}: {
  initial?: Partial<IndustriaFormData> & { id?: string };
  transportadoras: Transportadora[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<IndustriaFormData>({
    nome: initial?.nome ?? "",
    cnpj: initial?.cnpj ?? "",
    contatoNome: initial?.contatoNome ?? "",
    contatoTelefone: initial?.contatoTelefone ?? "",
    whatsapp: initial?.whatsapp ?? "",
    transportadoraPadraoId: initial?.transportadoraPadraoId ?? "",
    mensagemPadraoEnvio: initial?.mensagemPadraoEnvio ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof IndustriaFormData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      cnpj: form.cnpj ? onlyDigits(form.cnpj) : null,
      contatoTelefone: form.contatoTelefone || null,
      whatsapp: onlyDigits(form.whatsapp),
      transportadoraPadraoId: form.transportadoraPadraoId || null,
      mensagemPadraoEnvio: form.mensagemPadraoEnvio || null,
    };

    const url = initial?.id ? `/api/industrias/${initial.id}` : "/api/industrias";
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

    router.push("/industrias");
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
            <Label>CNPJ</Label>
            <Input
              value={formatCNPJ(form.cnpj)}
              onChange={(e) => set("cnpj", e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div>
            <Label required>WhatsApp (para envio do pedido)</Label>
            <Input
              required
              value={formatPhone(form.whatsapp)}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <Label>Nome do contato</Label>
            <Input
              value={form.contatoNome}
              onChange={(e) => set("contatoNome", e.target.value)}
            />
          </div>
          <div>
            <Label>Telefone do contato</Label>
            <Input
              value={formatPhone(form.contatoTelefone)}
              onChange={(e) => set("contatoTelefone", e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <Label>Transportadora padrão</Label>
            <select
              value={form.transportadoraPadraoId}
              onChange={(e) => set("transportadoraPadraoId", e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="">Nenhuma</option>
              {transportadoras.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Mensagem padrão de envio (WhatsApp)</Label>
            <Textarea
              rows={3}
              value={form.mensagemPadraoEnvio}
              onChange={(e) => set("mensagemPadraoEnvio", e.target.value)}
              placeholder="Segue pedido do cliente {cliente} — Pedido #{pedido}."
            />
            <p className="mt-1 text-xs text-muted">
              Use os campos <code>{"{cliente}"}</code> e <code>{"{pedido}"}</code>.
              Se vazio, será usada a mensagem padrão do sistema.
            </p>
          </div>
        </div>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/industrias")}
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
