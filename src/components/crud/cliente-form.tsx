"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/page-header";
import { Input, Label, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { formatCEP, formatCNPJ, formatPhone, onlyDigits } from "@/lib/format";
import { ESTADOS_BR } from "@/lib/estados-br";

type FormaPagamento = { id: string; nome: string };

export type ClienteFormData = {
  id?: string;
  nome: string;
  cnpj: string;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  contatoNome: string;
  telefone: string;
  whatsapp: string;
  latitude: string;
  longitude: string;
  formaPagamentoPadraoId: string;
  compradorPadrao: string;
};

export function ClienteForm({
  initial,
  formasPagamento,
}: {
  initial?: Partial<ClienteFormData> & { id?: string };
  formasPagamento: FormaPagamento[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<ClienteFormData>({
    nome: initial?.nome ?? "",
    cnpj: initial?.cnpj ?? "",
    endereco: initial?.endereco ?? "",
    bairro: initial?.bairro ?? "",
    cidade: initial?.cidade ?? "",
    uf: initial?.uf ?? "",
    cep: initial?.cep ?? "",
    contatoNome: initial?.contatoNome ?? "",
    telefone: initial?.telefone ?? "",
    whatsapp: initial?.whatsapp ?? "",
    latitude: initial?.latitude ?? "",
    longitude: initial?.longitude ?? "",
    formaPagamentoPadraoId: initial?.formaPagamentoPadraoId ?? "",
    compradorPadrao: initial?.compradorPadrao ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ClienteFormData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      cnpj: form.cnpj ? onlyDigits(form.cnpj) : null,
      cep: form.cep ? onlyDigits(form.cep) : null,
      telefone: form.telefone || null,
      whatsapp: form.whatsapp || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      formaPagamentoPadraoId: form.formaPagamentoPadraoId || null,
      compradorPadrao: form.compradorPadrao || null,
    };

    const url = initial?.id ? `/api/clientes/${initial.id}` : "/api/clientes";
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

    router.push("/clientes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-muted">
          Dados gerais
        </h3>
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
            <Label>Comprador padrão</Label>
            <Input
              value={form.compradorPadrao}
              onChange={(e) => set("compradorPadrao", e.target.value)}
              placeholder="Nome de quem costuma comprar/assinar"
            />
          </div>
          <div>
            <Label>Contato</Label>
            <Input
              value={form.contatoNome}
              onChange={(e) => set("contatoNome", e.target.value)}
            />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input
              value={formatPhone(form.telefone)}
              onChange={(e) => set("telefone", e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input
              value={formatPhone(form.whatsapp)}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <Label>Forma de pagamento padrão</Label>
            <Select
              value={form.formaPagamentoPadraoId}
              onChange={(e) => set("formaPagamentoPadraoId", e.target.value)}
            >
              <option value="">Nenhuma</option>
              {formasPagamento.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-muted">
          Endereço
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Label>Endereço</Label>
            <Input
              value={form.endereco}
              onChange={(e) => set("endereco", e.target.value)}
            />
          </div>
          <div>
            <Label>Bairro</Label>
            <Input
              value={form.bairro}
              onChange={(e) => set("bairro", e.target.value)}
            />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input
              value={form.cidade}
              onChange={(e) => set("cidade", e.target.value)}
            />
          </div>
          <div>
            <Label>UF</Label>
            <Select value={form.uf} onChange={(e) => set("uf", e.target.value)}>
              <option value="">—</option>
              {ESTADOS_BR.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>CEP</Label>
            <Input
              value={formatCEP(form.cep)}
              onChange={(e) => set("cep", e.target.value)}
              placeholder="00000-000"
            />
          </div>
          <div>
            <Label>Latitude</Label>
            <Input
              value={form.latitude}
              onChange={(e) => set("latitude", e.target.value)}
              placeholder="-23.550520"
            />
          </div>
          <div>
            <Label>Longitude</Label>
            <Input
              value={form.longitude}
              onChange={(e) => set("longitude", e.target.value)}
              placeholder="-46.633308"
            />
          </div>
          <p className="text-xs text-muted md:col-span-3">
            Latitude/longitude são usadas no Mapa de Vendas. Preencha manualmente
            (ex: copiando do Google Maps) — a geocodificação automática pode ser
            adicionada depois.
          </p>
        </div>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/clientes")}
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
