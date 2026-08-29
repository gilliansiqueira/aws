"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Circle, Trash2, DollarSign, Clock, Package } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Select, Input, Label } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";

type Comissao = {
  id: string;
  userId: string;
  userNome: string;
  pedidoId: string;
  pedidoNumero: number;
  clienteNome: string;
  valor: number;
  pago: boolean;
  dataPagamento: string | null;
  observacoes: string | null;
};

type PedidoElegivel = {
  id: string;
  numero: number;
  clienteNome: string;
  valorTotal: number;
  criadoPorId: string | null;
};

type Representante = { id: string; name: string };

export function ComissoesPanel({
  comissoesIniciais,
  pedidosElegiveis,
  representantes,
}: {
  comissoesIniciais: Comissao[];
  pedidosElegiveis: PedidoElegivel[];
  representantes: Representante[];
}) {
  const router = useRouter();
  // Sem estado local pra lista — toda mutação (lançar/pagar/excluir) passa
  // pelo servidor e usa router.refresh(), que reenvia esta prop atualizada.
  // Guardar em useState travaria a lista no valor do primeiro carregamento.
  const comissoes = comissoesIniciais;
  const [filtroUser, setFiltroUser] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const [pedidoId, setPedidoId] = useState("");
  const [userId, setUserId] = useState("");
  const [valor, setValor] = useState("");
  const [lancando, setLancando] = useState(false);

  const [excluirId, setExcluirId] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const totalPendente = comissoes.filter((c) => !c.pago).reduce((acc, c) => acc + c.valor, 0);
  const hoje = new Date();
  const totalPagoNoMes = comissoes
    .filter((c) => c.pago && c.dataPagamento && new Date(c.dataPagamento).getMonth() === hoje.getMonth() && new Date(c.dataPagamento).getFullYear() === hoje.getFullYear())
    .reduce((acc, c) => acc + c.valor, 0);

  const comissoesFiltradas = comissoes.filter((c) => {
    if (filtroUser && c.userId !== filtroUser) return false;
    if (filtroStatus === "pago" && !c.pago) return false;
    if (filtroStatus === "pendente" && c.pago) return false;
    return true;
  });

  function handleSelectPedido(id: string) {
    setPedidoId(id);
    const pedido = pedidosElegiveis.find((p) => p.id === id);
    if (pedido?.criadoPorId && !userId) {
      setUserId(pedido.criadoPorId);
    }
  }

  async function handleLancar() {
    if (!pedidoId || !userId || !valor) return;
    setLancando(true);
    const res = await fetch("/api/comissoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedidoId, userId, valor }),
    });
    setLancando(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Não foi possível lançar a comissão.");
      return;
    }

    toast.success("Comissão lançada.");
    setPedidoId("");
    setUserId("");
    setValor("");
    router.refresh();
  }

  async function handleTogglePago(comissao: Comissao) {
    const res = await fetch(`/api/comissoes/${comissao.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pago: !comissao.pago }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Não foi possível atualizar.");
      return;
    }
    toast.success(!comissao.pago ? "Marcada como paga." : "Marcada como pendente.");
    router.refresh();
  }

  async function handleExcluir() {
    if (!excluirId) return;
    setExcluindo(true);
    const res = await fetch(`/api/comissoes/${excluirId}`, { method: "DELETE" });
    setExcluindo(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Não foi possível excluir.");
      return;
    }
    setExcluirId(null);
    toast.success("Comissão excluída.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Clock} label="Pendente" value={formatCurrencyBRL(totalPendente)} tone="warning" />
        <StatCard icon={DollarSign} label="Pago no mês" value={formatCurrencyBRL(totalPagoNoMes)} tone="success" />
        <StatCard icon={Package} label="Pedidos entregues sem comissão" value={String(pedidosElegiveis.length)} tone="brand" />
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold">Lançar comissão</h2>
        {pedidosElegiveis.length === 0 ? (
          <p className="text-sm text-muted">
            Nenhum pedido entregue sem comissão lançada no momento. Comissão só pode ser lançada depois que o pedido
            chega em &quot;Entregue&quot;.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Label required>Pedido entregue</Label>
              <Combobox
                placeholder="Buscar pedido por cliente ou número..."
                value={pedidoId}
                onChange={handleSelectPedido}
                options={pedidosElegiveis.map((p) => ({
                  id: p.id,
                  label: `#${p.numero} — ${p.clienteNome}`,
                  sublabel: formatCurrencyBRL(p.valorTotal),
                }))}
              />
            </div>
            <div>
              <Label required>Representante</Label>
              <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">Selecione...</option>
                {representantes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label required>Valor combinado (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="sm:col-span-4 flex justify-end">
              <Button
                type="button"
                onClick={handleLancar}
                disabled={!pedidoId || !userId || !valor || lancando}
              >
                {lancando ? "Lançando..." : "Lançar comissão"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Select value={filtroUser} onChange={(e) => setFiltroUser(e.target.value)} className="w-auto max-w-[220px]">
          <option value="">Todos os representantes</option>
          {representantes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
        <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="w-auto max-w-[180px]">
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
        </Select>
      </div>

      <Card className="p-0">
        {comissoesFiltradas.length === 0 ? (
          <EmptyState title="Nenhuma comissão encontrada" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium md:px-6">Pedido</th>
                  <th className="px-4 py-3 font-medium">Representante</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Pago em</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {comissoesFiltradas.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-3 md:px-6">
                      <p className="font-medium">#{c.pedidoNumero}</p>
                      <p className="text-xs text-muted">{c.clienteNome}</p>
                    </td>
                    <td className="px-4 py-3">{c.userNome}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrencyBRL(c.valor)}</td>
                    <td className="px-4 py-3">
                      <Badge color={c.pago ? "green" : "yellow"}>{c.pago ? "Pago" : "Pendente"}</Badge>
                    </td>
                    <td className="px-4 py-3">{c.dataPagamento ? formatDateBR(c.dataPagamento) : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePago(c)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                          aria-label={c.pago ? "Marcar como pendente" : "Marcar como pago"}
                          title={c.pago ? "Marcar como pendente" : "Marcar como pago"}
                        >
                          {c.pago ? <CheckCircle2 size={15} className="text-success" /> : <Circle size={15} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setExcluirId(c.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-danger dark:hover:bg-red-500/10"
                          aria-label="Excluir comissão"
                          title="Excluir comissão"
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

      <Modal open={excluirId !== null} onClose={() => setExcluirId(null)} title="Excluir comissão">
        <p className="text-sm text-muted">
          Tem certeza que deseja excluir este lançamento de comissão? O pedido volta a ficar disponível pra lançar de
          novo.
        </p>
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
