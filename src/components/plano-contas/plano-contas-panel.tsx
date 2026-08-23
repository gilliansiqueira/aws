"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Card } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

type Conta = { id: string; nome: string; ativo: boolean };
type Grupo = { id: string; nome: string; tipo: "RECEITA" | "DESPESA"; ativo: boolean; contas: Conta[] };

export function PlanoContasPanel({ gruposIniciais }: { gruposIniciais: Grupo[] }) {
  const router = useRouter();
  const grupos = gruposIniciais;

  const [novoGrupoOpen, setNovoGrupoOpen] = useState(false);
  const [novoGrupoNome, setNovoGrupoNome] = useState("");
  const [novoGrupoTipo, setNovoGrupoTipo] = useState<"RECEITA" | "DESPESA">("DESPESA");
  const [salvandoGrupo, setSalvandoGrupo] = useState(false);

  const [editGrupo, setEditGrupo] = useState<Grupo | null>(null);
  const [editGrupoNome, setEditGrupoNome] = useState("");
  const [editGrupoTipo, setEditGrupoTipo] = useState<"RECEITA" | "DESPESA">("DESPESA");
  const [editGrupoAtivo, setEditGrupoAtivo] = useState(true);

  const [novaContaGrupoId, setNovaContaGrupoId] = useState<string | null>(null);
  const [novaContaNome, setNovaContaNome] = useState("");
  const [salvandoConta, setSalvandoConta] = useState(false);

  const [editConta, setEditConta] = useState<Conta | null>(null);
  const [editContaNome, setEditContaNome] = useState("");
  const [editContaAtivo, setEditContaAtivo] = useState(true);

  const [erro, setErro] = useState<string | null>(null);

  async function handleCriarGrupo() {
    setSalvandoGrupo(true);
    setErro(null);
    const res = await fetch("/api/plano-contas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: novoGrupoNome, tipo: novoGrupoTipo }),
    });
    setSalvandoGrupo(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data.error ?? "Não foi possível criar o grupo.");
      return;
    }
    toast.success("Grupo criado.");
    setNovoGrupoOpen(false);
    setNovoGrupoNome("");
    router.refresh();
  }

  function abrirEditGrupo(g: Grupo) {
    setEditGrupo(g);
    setEditGrupoNome(g.nome);
    setEditGrupoTipo(g.tipo);
    setEditGrupoAtivo(g.ativo);
    setErro(null);
  }

  async function handleSalvarGrupo() {
    if (!editGrupo) return;
    setSalvandoGrupo(true);
    setErro(null);
    const res = await fetch(`/api/plano-contas/${editGrupo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: editGrupoNome, tipo: editGrupoTipo, ativo: editGrupoAtivo }),
    });
    setSalvandoGrupo(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data.error ?? "Não foi possível salvar.");
      return;
    }
    toast.success("Grupo atualizado.");
    setEditGrupo(null);
    router.refresh();
  }

  async function handleCriarConta() {
    if (!novaContaGrupoId) return;
    setSalvandoConta(true);
    setErro(null);
    const res = await fetch("/api/plano-contas/contas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: novaContaNome, grupoId: novaContaGrupoId }),
    });
    setSalvandoConta(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data.error ?? "Não foi possível criar a conta.");
      return;
    }
    toast.success("Conta criada.");
    setNovaContaGrupoId(null);
    setNovaContaNome("");
    router.refresh();
  }

  function abrirEditConta(c: Conta) {
    setEditConta(c);
    setEditContaNome(c.nome);
    setEditContaAtivo(c.ativo);
    setErro(null);
  }

  async function handleSalvarConta() {
    if (!editConta) return;
    setSalvandoConta(true);
    setErro(null);
    const res = await fetch(`/api/plano-contas/contas/${editConta.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: editContaNome, ativo: editContaAtivo }),
    });
    setSalvandoConta(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data.error ?? "Não foi possível salvar.");
      return;
    }
    toast.success("Conta atualizada.");
    setEditConta(null);
    router.refresh();
  }

  const gruposReceita = grupos.filter((g) => g.tipo === "RECEITA");
  const gruposDespesa = grupos.filter((g) => g.tipo === "DESPESA");

  function renderGrupo(g: Grupo) {
    return (
      <Card key={g.id}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{g.nome}</h3>
            {!g.ativo && <Badge color="gray">Inativo</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => abrirEditGrupo(g)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
              aria-label="Editar grupo"
            >
              <Pencil size={15} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {g.contas.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span className={c.ativo ? "" : "text-muted line-through"}>{c.nome}</span>
              <button
                type="button"
                onClick={() => abrirEditConta(c)}
                className="text-muted hover:text-foreground"
                aria-label="Editar conta"
              >
                <Pencil size={13} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setNovaContaGrupoId(g.id);
            setNovaContaNome("");
            setErro(null);
          }}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-brand hover:underline"
        >
          <Plus size={13} /> Nova conta neste grupo
        </button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button type="button" onClick={() => { setNovoGrupoOpen(true); setErro(null); }}>
          <Plus size={16} /> Novo Grupo
        </Button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Receitas</p>
        <div className="grid gap-4 md:grid-cols-2">{gruposReceita.map(renderGrupo)}</div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Despesas</p>
        <div className="grid gap-4 md:grid-cols-2">{gruposDespesa.map(renderGrupo)}</div>
      </div>

      <Modal open={novoGrupoOpen} onClose={() => setNovoGrupoOpen(false)} title="Novo Grupo">
        <div className="flex flex-col gap-4">
          <div>
            <Label required>Nome</Label>
            <Input value={novoGrupoNome} onChange={(e) => setNovoGrupoNome(e.target.value)} placeholder="Ex: Despesas com Veículos" />
          </div>
          <div>
            <Label required>Tipo</Label>
            <Select value={novoGrupoTipo} onChange={(e) => setNovoGrupoTipo(e.target.value as "RECEITA" | "DESPESA")}>
              <option value="DESPESA">Despesa</option>
              <option value="RECEITA">Receita</option>
            </Select>
          </div>
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setNovoGrupoOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCriarGrupo} disabled={!novoGrupoNome || salvandoGrupo}>
              {salvandoGrupo ? "Criando..." : "Criar grupo"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={editGrupo !== null} onClose={() => setEditGrupo(null)} title={`Editar grupo — ${editGrupo?.nome ?? ""}`}>
        <div className="flex flex-col gap-4">
          <div>
            <Label required>Nome</Label>
            <Input value={editGrupoNome} onChange={(e) => setEditGrupoNome(e.target.value)} />
          </div>
          <div>
            <Label required>Tipo</Label>
            <Select value={editGrupoTipo} onChange={(e) => setEditGrupoTipo(e.target.value as "RECEITA" | "DESPESA")}>
              <option value="DESPESA">Despesa</option>
              <option value="RECEITA">Receita</option>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={editGrupoAtivo} onChange={(e) => setEditGrupoAtivo(e.target.checked)} />
            Ativo
          </label>
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditGrupo(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSalvarGrupo} disabled={salvandoGrupo}>
              {salvandoGrupo ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={novaContaGrupoId !== null} onClose={() => setNovaContaGrupoId(null)} title="Nova Conta">
        <div className="flex flex-col gap-4">
          <div>
            <Label required>Nome</Label>
            <Input value={novaContaNome} onChange={(e) => setNovaContaNome(e.target.value)} placeholder="Ex: Manutenção de veículos" />
          </div>
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setNovaContaGrupoId(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCriarConta} disabled={!novaContaNome || salvandoConta}>
              {salvandoConta ? "Criando..." : "Criar conta"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={editConta !== null} onClose={() => setEditConta(null)} title={`Editar conta — ${editConta?.nome ?? ""}`}>
        <div className="flex flex-col gap-4">
          <div>
            <Label required>Nome</Label>
            <Input value={editContaNome} onChange={(e) => setEditContaNome(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={editContaAtivo} onChange={(e) => setEditContaAtivo(e.target.checked)} />
            Ativo
          </label>
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditConta(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSalvarConta} disabled={salvandoConta}>
              {salvandoConta ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
