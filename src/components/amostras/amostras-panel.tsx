"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FlaskConical, RotateCcw, TrendingUp, Trash2, Pencil, Plus } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Select, Input, Label, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrencyBRL, formatDateBR, formatNumberBR, dateInputValue } from "@/lib/format";
import {
  STATUS_AMOSTRA_COLORS,
  STATUS_AMOSTRA_LABELS,
  STATUS_AMOSTRA_ORDER,
  proximosStatusAmostra,
} from "@/lib/amostra-status";

type Amostra = {
  id: string;
  clienteId: string;
  clienteNome: string;
  produtoNome: string;
  marcaNome: string;
  industriaNome: string;
  dataEnvio: string;
  quantidade: number;
  status: string;
  dataRetorno: string | null;
  observacoes: string | null;
  pedidoId: string | null;
  pedidoNumero: number | null;
  valorVendaGerado: number | null;
};

type Cliente = { id: string; nome: string; cnpj: string | null };
type Produto = { id: string; nome: string; codigo: string; marcaNome: string; industriaNome: string; unidade: string };
type PedidoOpcao = { id: string; numero: number };

const STATUS_FINAIS = ["CONVERTEU_VENDA", "NAO_CONVERTEU", "SEM_RETORNO"];

export function AmostrasPanel({
  amostrasIniciais,
  clientes,
  produtos,
}: {
  amostrasIniciais: Amostra[];
  clientes: Cliente[];
  produtos: Produto[];
}) {
  const router = useRouter();
  const amostras = amostrasIniciais;

  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");

  const [novaOpen, setNovaOpen] = useState(false);
  const [novoClienteId, setNovoClienteId] = useState("");
  const [novoProdutoId, setNovoProdutoId] = useState("");
  const [novaQuantidade, setNovaQuantidade] = useState("");
  const [novaObs, setNovaObs] = useState("");
  const [salvandoNova, setSalvandoNova] = useState(false);

  const [editando, setEditando] = useState<Amostra | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editDataRetorno, setEditDataRetorno] = useState("");
  const [editObs, setEditObs] = useState("");
  const [editPedidoId, setEditPedidoId] = useState("");
  const [editValorVenda, setEditValorVenda] = useState("");
  const [pedidosDoCliente, setPedidosDoCliente] = useState<PedidoOpcao[]>([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(false);
  const [salvandoEdit, setSalvandoEdit] = useState(false);

  const [excluirId, setExcluirId] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const amostrasFiltradas = amostras.filter((a) => {
    if (filtroStatus && a.status !== filtroStatus) return false;
    if (filtroCliente && a.clienteId !== filtroCliente) return false;
    return true;
  });

  const emAndamento = amostras.filter((a) => !STATUS_FINAIS.includes(a.status)).length;
  const convertidas = amostras.filter((a) => a.status === "CONVERTEU_VENDA").length;
  const finalizadas = amostras.filter((a) => STATUS_FINAIS.includes(a.status)).length;
  const taxaConversao = finalizadas > 0 ? (convertidas / finalizadas) * 100 : 0;
  const valorGerado = amostras.reduce((acc, a) => acc + (a.valorVendaGerado ?? 0), 0);

  async function handleCriarAmostra() {
    if (!novoClienteId || !novoProdutoId || !novaQuantidade) return;
    setSalvandoNova(true);
    const res = await fetch("/api/amostras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId: novoClienteId,
        produtoId: novoProdutoId,
        quantidade: novaQuantidade,
        observacoes: novaObs || null,
      }),
    });
    setSalvandoNova(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Não foi possível registrar a amostra.");
      return;
    }

    toast.success("Amostra registrada.");
    setNovaOpen(false);
    setNovoClienteId("");
    setNovoProdutoId("");
    setNovaQuantidade("");
    setNovaObs("");
    router.refresh();
  }

  async function abrirEdicao(amostra: Amostra) {
    setEditando(amostra);
    setEditStatus(amostra.status);
    setEditDataRetorno(amostra.dataRetorno ? dateInputValue(amostra.dataRetorno) : "");
    setEditObs(amostra.observacoes ?? "");
    setEditPedidoId(amostra.pedidoId ?? "");
    setEditValorVenda(amostra.valorVendaGerado ? String(amostra.valorVendaGerado) : "");
    setPedidosDoCliente([]);

    setCarregandoPedidos(true);
    const res = await fetch(`/api/pedidos?clienteId=${amostra.clienteId}`);
    setCarregandoPedidos(false);
    if (res.ok) {
      const data = await res.json();
      setPedidosDoCliente(data.map((p: { id: string; numero: number }) => ({ id: p.id, numero: p.numero })));
    }
  }

  async function handleSalvarEdicao() {
    if (!editando) return;
    setSalvandoEdit(true);
    const res = await fetch(`/api/amostras/${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: editStatus,
        dataRetorno: editDataRetorno || null,
        observacoes: editObs || null,
        pedidoId: editStatus === "CONVERTEU_VENDA" ? editPedidoId || null : null,
        valorVendaGerado: editStatus === "CONVERTEU_VENDA" && editValorVenda ? editValorVenda : null,
      }),
    });
    setSalvandoEdit(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Não foi possível atualizar a amostra.");
      return;
    }

    toast.success("Amostra atualizada.");
    setEditando(null);
    router.refresh();
  }

  async function handleExcluir() {
    if (!excluirId) return;
    setExcluindo(true);
    const res = await fetch(`/api/amostras/${excluirId}`, { method: "DELETE" });
    setExcluindo(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Não foi possível excluir.");
      return;
    }
    setExcluirId(null);
    toast.success("Amostra excluída.");
    router.refresh();
  }

  const opcoesStatusEdicao = editando ? [editando.status, ...proximosStatusAmostra(editando.status)] : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={FlaskConical} label="Em andamento" value={String(emAndamento)} tone="brand" />
        <StatCard icon={TrendingUp} label="Convertidas em venda" value={String(convertidas)} tone="success" />
        <StatCard icon={RotateCcw} label="Taxa de conversão" value={`${formatNumberBR(taxaConversao, 0)}%`} hint={`${convertidas} de ${finalizadas} finalizadas`} tone="warning" />
        <StatCard icon={TrendingUp} label="Valor gerado em vendas" value={formatCurrencyBRL(valorGerado)} tone="success" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="w-auto max-w-[200px]">
            <option value="">Todos os status</option>
            {STATUS_AMOSTRA_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_AMOSTRA_LABELS[s]}
              </option>
            ))}
          </Select>
          <Select value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} className="w-auto max-w-[220px]">
            <option value="">Todos os clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </div>
        <Button type="button" onClick={() => setNovaOpen(true)}>
          <Plus size={16} /> Nova Amostra
        </Button>
      </div>

      <Card className="p-0">
        {amostrasFiltradas.length === 0 ? (
          <EmptyState title="Nenhuma amostra encontrada" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium md:px-6">Cliente</th>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Envio</th>
                  <th className="px-4 py-3 font-medium">Qtd.</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Venda gerada</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {amostrasFiltradas.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-3 md:px-6">{a.clienteNome}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{a.produtoNome}</p>
                      <p className="text-xs text-muted">{a.marcaNome} · {a.industriaNome}</p>
                    </td>
                    <td className="px-4 py-3">{formatDateBR(a.dataEnvio)}</td>
                    <td className="px-4 py-3">{formatNumberBR(a.quantidade, 3)}</td>
                    <td className="px-4 py-3">
                      <Badge color={STATUS_AMOSTRA_COLORS[a.status]}>{STATUS_AMOSTRA_LABELS[a.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {a.valorVendaGerado
                        ? `${formatCurrencyBRL(a.valorVendaGerado)}${a.pedidoNumero ? ` (#${a.pedidoNumero})` : ""}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => abrirEdicao(a)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                          aria-label="Atualizar amostra"
                          title="Atualizar status"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setExcluirId(a.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-danger dark:hover:bg-red-500/10"
                          aria-label="Excluir amostra"
                          title="Excluir"
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

      <Modal open={novaOpen} onClose={() => setNovaOpen(false)} title="Nova Amostra">
        <div className="flex flex-col gap-4">
          <div>
            <Label required>Cliente</Label>
            <Combobox
              placeholder="Buscar cliente..."
              value={novoClienteId}
              onChange={setNovoClienteId}
              options={clientes.map((c) => ({ id: c.id, label: c.nome, sublabel: c.cnpj ?? undefined }))}
            />
          </div>
          <div>
            <Label required>Produto</Label>
            <Combobox
              placeholder="Buscar produto..."
              value={novoProdutoId}
              onChange={setNovoProdutoId}
              options={produtos.map((p) => ({
                id: p.id,
                label: p.nome,
                sublabel: `${p.codigo} · ${p.marcaNome} · ${p.industriaNome}`,
              }))}
            />
          </div>
          <div>
            <Label required>Quantidade</Label>
            <Input
              type="number"
              step="0.001"
              min="0"
              value={novaQuantidade}
              onChange={(e) => setNovaQuantidade(e.target.value)}
            />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea rows={3} value={novaObs} onChange={(e) => setNovaObs(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setNovaOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCriarAmostra}
              disabled={!novoClienteId || !novoProdutoId || !novaQuantidade || salvandoNova}
            >
              {salvandoNova ? "Salvando..." : "Registrar amostra"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={editando !== null} onClose={() => setEditando(null)} title={`Atualizar amostra — ${editando?.produtoNome ?? ""}`}>
        {editando && (
          <div className="flex flex-col gap-4">
            <div>
              <Label>Status</Label>
              <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                {opcoesStatusEdicao.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_AMOSTRA_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Data de retorno</Label>
              <Input type="date" value={editDataRetorno} onChange={(e) => setEditDataRetorno(e.target.value)} />
            </div>
            {editStatus === "CONVERTEU_VENDA" && (
              <>
                <div>
                  <Label>Pedido gerado (opcional)</Label>
                  <Select value={editPedidoId} onChange={(e) => setEditPedidoId(e.target.value)} disabled={carregandoPedidos}>
                    <option value="">
                      {carregandoPedidos ? "Carregando pedidos..." : "Nenhum pedido específico"}
                    </option>
                    {pedidosDoCliente.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.numero}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Valor da venda gerada (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editValorVenda}
                    onChange={(e) => setEditValorVenda(e.target.value)}
                  />
                </div>
              </>
            )}
            <div>
              <Label>Observações</Label>
              <Textarea rows={3} value={editObs} onChange={(e) => setEditObs(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditando(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSalvarEdicao} disabled={salvandoEdit}>
                {salvandoEdit ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={excluirId !== null} onClose={() => setExcluirId(null)} title="Excluir amostra">
        <p className="text-sm text-muted">Tem certeza que deseja excluir este registro de amostra?</p>
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
