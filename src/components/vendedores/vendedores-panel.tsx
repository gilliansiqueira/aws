"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

type Marca = { id: string; nome: string; percentualComissao: number };
type Vendedor = { id: string; nome: string; ativo: boolean; marcas: Marca[] };

export function VendedoresPanel({
  vendedoresIniciais,
  marcas,
}: {
  vendedoresIniciais: Vendedor[];
  marcas: Marca[];
}) {
  const router = useRouter();
  const vendedores = vendedoresIniciais;

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Vendedor | null>(null);
  const [nome, setNome] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [marcaIds, setMarcaIds] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [excluirId, setExcluirId] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  function abrirNovo() {
    setEditando(null);
    setNome("");
    setAtivo(true);
    setMarcaIds([]);
    setErro(null);
    setModalOpen(true);
  }

  function abrirEdicao(v: Vendedor) {
    setEditando(v);
    setNome(v.nome);
    setAtivo(v.ativo);
    setMarcaIds(v.marcas.map((m) => m.id));
    setErro(null);
    setModalOpen(true);
  }

  function toggleMarca(id: string) {
    setMarcaIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  async function handleSalvar() {
    setSalvando(true);
    setErro(null);
    const url = editando ? `/api/vendedores/${editando.id}` : "/api/vendedores";
    const res = await fetch(url, {
      method: editando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, ativo, marcaIds }),
    });
    setSalvando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data.error ?? "Não foi possível salvar o vendedor.");
      return;
    }
    toast.success(editando ? "Vendedor atualizado." : "Vendedor cadastrado.");
    setModalOpen(false);
    router.refresh();
  }

  async function handleExcluir() {
    if (!excluirId) return;
    setExcluindo(true);
    const res = await fetch(`/api/vendedores/${excluirId}`, { method: "DELETE" });
    setExcluindo(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Não foi possível excluir.");
      return;
    }
    setExcluirId(null);
    toast.success("Vendedor excluído.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" onClick={abrirNovo}>
          <Plus size={16} /> Novo Vendedor
        </Button>
      </div>

      <Card className="p-0">
        {vendedores.length === 0 ? (
          <EmptyState title="Nenhum vendedor cadastrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium md:px-6">Nome</th>
                  <th className="px-4 py-3 font-medium">Marcas</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {vendedores.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-medium md:px-6">{v.nome}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {v.marcas.map((m) => (
                          <Badge key={m.id} color="blue">
                            {m.nome} · {m.percentualComissao}%
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={v.ativo ? "green" : "gray"}>{v.ativo ? "Ativo" : "Inativo"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => abrirEdicao(v)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                          aria-label="Editar vendedor"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setExcluirId(v.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-danger dark:hover:bg-red-500/10"
                          aria-label="Excluir vendedor"
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando ? "Editar vendedor" : "Novo vendedor"}>
        <div className="flex flex-col gap-4">
          <div>
            <Label required>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label required>Marcas que atende</Label>
            {marcas.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma marca ativa cadastrada.</p>
            ) : (
              <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
                {marcas.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={marcaIds.includes(m.id)} onChange={() => toggleMarca(m.id)} />
                    {m.nome}
                    <span className="text-xs text-muted">({m.percentualComissao}% de comissão)</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
            Ativo
          </label>
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSalvar} disabled={!nome || marcaIds.length === 0 || salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={excluirId !== null} onClose={() => setExcluirId(null)} title="Excluir vendedor">
        <p className="text-sm text-muted">Tem certeza que deseja excluir este vendedor?</p>
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
