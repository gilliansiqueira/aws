"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wallet, Calendar } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrencyBRL, formatDateBR, dateInputValue } from "@/lib/format";

type Gasto = {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  observacoes: string | null;
  contaContabilId: string;
  contaNome: string;
  grupoNome: string;
};

type Grupo = { id: string; nome: string; contas: { id: string; nome: string }[] };

type FormState = {
  contaContabilId: string;
  descricao: string;
  valor: string;
  data: string;
  observacoes: string;
};

const FORM_VAZIO: FormState = { contaContabilId: "", descricao: "", valor: "", data: dateInputValue(new Date()), observacoes: "" };

export function GastosPanel({ gastosIniciais, grupos }: { gastosIniciais: Gasto[]; grupos: Grupo[] }) {
  const router = useRouter();
  const gastos = gastosIniciais;

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Gasto | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [excluirId, setExcluirId] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const hoje = new Date();
  const totalNoMes = gastos
    .filter((g) => {
      const d = new Date(g.data);
      return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
    })
    .reduce((acc, g) => acc + g.valor, 0);
  const totalGeral = gastos.reduce((acc, g) => acc + g.valor, 0);

  function abrirNovo() {
    setEditando(null);
    setForm({ ...FORM_VAZIO, contaContabilId: grupos[0]?.contas[0]?.id ?? "" });
    setErro(null);
    setModalOpen(true);
  }

  function abrirEdicao(g: Gasto) {
    setEditando(g);
    setForm({
      contaContabilId: g.contaContabilId,
      descricao: g.descricao,
      valor: String(g.valor),
      data: dateInputValue(g.data),
      observacoes: g.observacoes ?? "",
    });
    setErro(null);
    setModalOpen(true);
  }

  async function handleSalvar() {
    setSalvando(true);
    setErro(null);
    const url = editando ? `/api/gastos/${editando.id}` : "/api/gastos";
    const res = await fetch(url, {
      method: editando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSalvando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data.error ?? "Não foi possível salvar o gasto.");
      return;
    }
    toast.success(editando ? "Gasto atualizado." : "Gasto lançado.");
    setModalOpen(false);
    router.refresh();
  }

  async function handleExcluir() {
    if (!excluirId) return;
    setExcluindo(true);
    const res = await fetch(`/api/gastos/${excluirId}`, { method: "DELETE" });
    setExcluindo(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Não foi possível excluir.");
      return;
    }
    setExcluirId(null);
    toast.success("Gasto excluído.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Calendar} label="Gastos no mês" value={formatCurrencyBRL(totalNoMes)} tone="warning" />
        <StatCard icon={Wallet} label="Total lançado" value={formatCurrencyBRL(totalGeral)} tone="brand" />
        <StatCard icon={Wallet} label="Lançamentos" value={String(gastos.length)} tone="success" />
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={abrirNovo}>
          <Plus size={16} /> Novo Gasto
        </Button>
      </div>

      <Card className="p-0">
        {gastos.length === 0 ? (
          <EmptyState title="Nenhum gasto cadastrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium md:px-6">Data</th>
                  <th className="px-4 py-3 font-medium">Conta</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {gastos.map((g) => (
                  <tr key={g.id} className="border-b border-border last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-3 md:px-6">{formatDateBR(g.data)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{g.contaNome}</p>
                      <p className="text-xs text-muted">{g.grupoNome}</p>
                    </td>
                    <td className="px-4 py-3">{g.descricao}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrencyBRL(g.valor)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => abrirEdicao(g)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                          aria-label="Editar gasto"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setExcluirId(g.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-danger dark:hover:bg-red-500/10"
                          aria-label="Excluir gasto"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando ? "Editar gasto" : "Novo gasto"}>
        <div className="flex flex-col gap-4">
          <div>
            <Label required>Conta</Label>
            <Select value={form.contaContabilId} onChange={(e) => setForm({ ...form, contaContabilId: e.target.value })}>
              <option value="">Selecione...</option>
              {grupos.map((gr) => (
                <optgroup key={gr.id} label={gr.nome}>
                  {gr.contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </div>
          <div>
            <Label required>Descrição</Label>
            <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label required>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label required>Data</Label>
              <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
          </div>
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSalvar}
              disabled={!form.contaContabilId || !form.descricao || !form.valor || !form.data || salvando}
            >
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={excluirId !== null} onClose={() => setExcluirId(null)} title="Excluir gasto">
        <p className="text-sm text-muted">Tem certeza que deseja excluir este lançamento de gasto?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setExcluirId(null)}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={handleExcluir} disabled={excluindo}>
            {excluindo ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
