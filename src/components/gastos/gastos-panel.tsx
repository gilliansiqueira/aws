"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wallet, Calendar, Repeat, Ban } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
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
  serieId: string | null;
  numeroParcela: number | null;
};

type Serie = {
  id: string;
  descricao: string;
  tipo: "RECORRENTE" | "PARCELADO";
  contaContabilId: string;
  contaNome: string;
  quantidadeParcelas: number;
  valorParcela: number;
  observacoes: string | null;
  cancelada: boolean;
  parcelasRestantes: number;
};

type Grupo = { id: string; nome: string; contas: { id: string; nome: string }[] };

type FormState = {
  contaContabilId: string;
  descricao: string;
  valor: string;
  data: string;
  observacoes: string;
};

type SerieFormState = {
  tipo: "RECORRENTE" | "PARCELADO";
  contaContabilId: string;
  descricao: string;
  valor: string;
  quantidadeParcelas: string;
  dataInicio: string;
  observacoes: string;
};

const FORM_VAZIO: FormState = { contaContabilId: "", descricao: "", valor: "", data: dateInputValue(new Date()), observacoes: "" };
const SERIE_FORM_VAZIO: SerieFormState = {
  tipo: "RECORRENTE",
  contaContabilId: "",
  descricao: "",
  valor: "",
  quantidadeParcelas: "",
  dataInicio: dateInputValue(new Date()),
  observacoes: "",
};

export function GastosPanel({
  gastosIniciais,
  grupos,
  seriesIniciais,
}: {
  gastosIniciais: Gasto[];
  grupos: Grupo[];
  seriesIniciais: Serie[];
}) {
  const router = useRouter();
  const gastos = gastosIniciais;
  const series = seriesIniciais;

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Gasto | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [excluirId, setExcluirId] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const [serieModalOpen, setSerieModalOpen] = useState(false);
  const [serieForm, setSerieForm] = useState<SerieFormState>(SERIE_FORM_VAZIO);
  const [salvandoSerie, setSalvandoSerie] = useState(false);
  const [erroSerie, setErroSerie] = useState<string | null>(null);

  const [editandoSerie, setEditandoSerie] = useState<Serie | null>(null);
  const [editSerieDescricao, setEditSerieDescricao] = useState("");
  const [editSerieContaId, setEditSerieContaId] = useState("");
  const [editSerieValor, setEditSerieValor] = useState("");
  const [editSerieObs, setEditSerieObs] = useState("");

  const [cancelarSerieId, setCancelarSerieId] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);

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

  function abrirNovaSerie() {
    setSerieForm({ ...SERIE_FORM_VAZIO, contaContabilId: grupos[0]?.contas[0]?.id ?? "" });
    setErroSerie(null);
    setSerieModalOpen(true);
  }

  const valorParcelaPreview =
    serieForm.tipo === "PARCELADO" && Number(serieForm.valor) > 0 && Number(serieForm.quantidadeParcelas) > 0
      ? Number(serieForm.valor) / Number(serieForm.quantidadeParcelas)
      : null;

  async function handleCriarSerie() {
    setSalvandoSerie(true);
    setErroSerie(null);
    const res = await fetch("/api/gastos/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serieForm),
    });
    setSalvandoSerie(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErroSerie(data.error ?? "Não foi possível criar o lançamento.");
      return;
    }
    toast.success(
      serieForm.tipo === "RECORRENTE"
        ? "Lançamento recorrente criado."
        : "Compra parcelada lançada.",
    );
    setSerieModalOpen(false);
    router.refresh();
  }

  function abrirEditSerie(s: Serie) {
    setEditandoSerie(s);
    setEditSerieDescricao(s.descricao);
    setEditSerieContaId(s.contaContabilId);
    setEditSerieValor(String(s.valorParcela));
    setEditSerieObs(s.observacoes ?? "");
    setErroSerie(null);
  }

  async function handleSalvarEditSerie() {
    if (!editandoSerie) return;
    setSalvandoSerie(true);
    setErroSerie(null);
    const res = await fetch(`/api/gastos/series/${editandoSerie.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao: editSerieDescricao,
        contaContabilId: editSerieContaId,
        observacoes: editSerieObs,
        valorParcela: editSerieValor,
      }),
    });
    setSalvandoSerie(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErroSerie(data.error ?? "Não foi possível salvar.");
      return;
    }
    toast.success("Lançamento recorrente atualizado. As parcelas futuras foram ajustadas.");
    setEditandoSerie(null);
    router.refresh();
  }

  async function handleCancelarSerie() {
    if (!cancelarSerieId) return;
    setCancelando(true);
    const res = await fetch(`/api/gastos/series/${cancelarSerieId}`, { method: "DELETE" });
    setCancelando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Não foi possível cancelar.");
      return;
    }
    setCancelarSerieId(null);
    toast.success("Parcelas futuras canceladas.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Calendar} label="Gastos no mês" value={formatCurrencyBRL(totalNoMes)} tone="warning" />
        <StatCard icon={Wallet} label="Total lançado" value={formatCurrencyBRL(totalGeral)} tone="brand" />
        <StatCard icon={Wallet} label="Lançamentos" value={String(gastos.length)} tone="success" />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={abrirNovaSerie}>
          <Repeat size={16} /> Recorrente / Parcelado
        </Button>
        <Button type="button" onClick={abrirNovo}>
          <Plus size={16} /> Novo Gasto
        </Button>
      </div>

      {series.some((s) => !s.cancelada) && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Recorrências e parcelamentos ativos</h2>
          <div className="flex flex-col gap-2">
            {series
              .filter((s) => !s.cancelada)
              .map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.descricao}</span>
                      <Badge color={s.tipo === "RECORRENTE" ? "blue" : "yellow"}>
                        {s.tipo === "RECORRENTE" ? "Recorrente" : "Parcelado"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted">
                      {s.contaNome} · {formatCurrencyBRL(s.valorParcela)}/mês · {s.parcelasRestantes} de{" "}
                      {s.quantidadeParcelas} parcela(s) restante(s)
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => abrirEditSerie(s)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                      aria-label="Editar recorrência"
                      title="Editar recorrência (aplica às parcelas futuras)"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancelarSerieId(s.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-danger dark:hover:bg-red-500/10"
                      aria-label="Cancelar parcelas futuras"
                      title="Cancelar parcelas futuras"
                    >
                      <Ban size={15} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {g.descricao}
                        {g.serieId && (
                          <span title="Parte de uma recorrência/parcelamento">
                            <Repeat size={12} className="text-muted" />
                          </span>
                        )}
                      </div>
                    </td>
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

      <Modal open={serieModalOpen} onClose={() => setSerieModalOpen(false)} title="Novo lançamento recorrente ou parcelado">
        <div className="flex flex-col gap-4">
          <div>
            <Label required>Tipo</Label>
            <Select
              value={serieForm.tipo}
              onChange={(e) => setSerieForm({ ...serieForm, tipo: e.target.value as "RECORRENTE" | "PARCELADO" })}
            >
              <option value="RECORRENTE">Recorrente — mesmo valor todo mês (ex: aluguel)</option>
              <option value="PARCELADO">Parcelado — valor total dividido (ex: compra em 3x)</option>
            </Select>
          </div>
          <div>
            <Label required>Conta</Label>
            <Select value={serieForm.contaContabilId} onChange={(e) => setSerieForm({ ...serieForm, contaContabilId: e.target.value })}>
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
            <Input
              value={serieForm.descricao}
              onChange={(e) => setSerieForm({ ...serieForm, descricao: e.target.value })}
              placeholder={serieForm.tipo === "RECORRENTE" ? "Ex: Aluguel do galpão" : "Ex: Compra de empilhadeira"}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label required>{serieForm.tipo === "RECORRENTE" ? "Valor mensal (R$)" : "Valor total (R$)"}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={serieForm.valor}
                onChange={(e) => setSerieForm({ ...serieForm, valor: e.target.value })}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label required>{serieForm.tipo === "RECORRENTE" ? "Quantidade de meses" : "Número de parcelas"}</Label>
              <Input
                type="number"
                step="1"
                min="2"
                max="120"
                value={serieForm.quantidadeParcelas}
                onChange={(e) => setSerieForm({ ...serieForm, quantidadeParcelas: e.target.value })}
              />
            </div>
          </div>
          {valorParcelaPreview !== null && (
            <p className="text-xs text-muted">
              {serieForm.quantidadeParcelas}x de {formatCurrencyBRL(valorParcelaPreview)}
            </p>
          )}
          <div>
            <Label required>Data da 1ª parcela</Label>
            <Input
              type="date"
              value={serieForm.dataInicio}
              onChange={(e) => setSerieForm({ ...serieForm, dataInicio: e.target.value })}
            />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={serieForm.observacoes} onChange={(e) => setSerieForm({ ...serieForm, observacoes: e.target.value })} rows={2} />
          </div>
          {erroSerie && <p className="text-sm text-danger">{erroSerie}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setSerieModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCriarSerie}
              disabled={
                !serieForm.contaContabilId ||
                !serieForm.descricao ||
                !serieForm.valor ||
                !serieForm.quantidadeParcelas ||
                !serieForm.dataInicio ||
                salvandoSerie
              }
            >
              {salvandoSerie ? "Gerando..." : "Gerar lançamentos"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={editandoSerie !== null}
        onClose={() => setEditandoSerie(null)}
        title={`Editar recorrência — ${editandoSerie?.descricao ?? ""}`}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted">
            As alterações valem só para as parcelas ainda não vencidas. As que já ocorreram ficam como estão.
          </p>
          <div>
            <Label required>Conta</Label>
            <Select value={editSerieContaId} onChange={(e) => setEditSerieContaId(e.target.value)}>
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
            <Input value={editSerieDescricao} onChange={(e) => setEditSerieDescricao(e.target.value)} />
          </div>
          <div>
            <Label required>Valor da parcela (R$)</Label>
            <Input type="number" step="0.01" min="0" value={editSerieValor} onChange={(e) => setEditSerieValor(e.target.value)} />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={editSerieObs} onChange={(e) => setEditSerieObs(e.target.value)} rows={2} />
          </div>
          {erroSerie && <p className="text-sm text-danger">{erroSerie}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditandoSerie(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSalvarEditSerie}
              disabled={!editSerieContaId || !editSerieDescricao || !editSerieValor || salvandoSerie}
            >
              {salvandoSerie ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={cancelarSerieId !== null} onClose={() => setCancelarSerieId(null)} title="Cancelar parcelas futuras">
        <p className="text-sm text-muted">
          As parcelas ainda não vencidas serão removidas. As que já ocorreram continuam no histórico normalmente.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setCancelarSerieId(null)}>
            Voltar
          </Button>
          <Button type="button" variant="danger" onClick={handleCancelarSerie} disabled={cancelando}>
            {cancelando ? "Cancelando..." : "Cancelar parcelas"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
