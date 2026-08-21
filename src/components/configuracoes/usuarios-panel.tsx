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

type Usuario = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "VENDEDOR";
  ativo: boolean;
};

export function UsuariosPanel({
  usuariosIniciais,
  usuarioLogadoId,
}: {
  usuariosIniciais: Usuario[];
  usuarioLogadoId: string;
}) {
  const router = useRouter();
  const usuarios = usuariosIniciais;

  const [novoOpen, setNovoOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoRole, setNovoRole] = useState<"ADMIN" | "VENDEDOR">("VENDEDOR");
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [erroNovo, setErroNovo] = useState<string | null>(null);

  const [editando, setEditando] = useState<Usuario | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN" | "VENDEDOR">("VENDEDOR");
  const [editAtivo, setEditAtivo] = useState(true);
  const [editSenha, setEditSenha] = useState("");
  const [salvandoEdit, setSalvandoEdit] = useState(false);
  const [erroEdit, setErroEdit] = useState<string | null>(null);

  function abrirNovo() {
    setNovoNome("");
    setNovoEmail("");
    setNovaSenha("");
    setNovoRole("VENDEDOR");
    setErroNovo(null);
    setNovoOpen(true);
  }

  async function handleCriar() {
    setSalvandoNovo(true);
    setErroNovo(null);
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: novoNome, email: novoEmail, password: novaSenha, role: novoRole }),
    });
    setSalvandoNovo(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErroNovo(data.error ?? "Não foi possível criar o usuário.");
      return;
    }

    toast.success("Usuário criado.");
    setNovoOpen(false);
    router.refresh();
  }

  function abrirEdicao(usuario: Usuario) {
    setEditando(usuario);
    setEditNome(usuario.name);
    setEditEmail(usuario.email);
    setEditRole(usuario.role);
    setEditAtivo(usuario.ativo);
    setEditSenha("");
    setErroEdit(null);
  }

  async function handleSalvarEdicao() {
    if (!editando) return;
    setSalvandoEdit(true);
    setErroEdit(null);
    const res = await fetch(`/api/usuarios/${editando.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editNome,
        email: editEmail,
        role: editRole,
        ativo: editAtivo,
        password: editSenha || undefined,
      }),
    });
    setSalvandoEdit(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErroEdit(data.error ?? "Não foi possível salvar.");
      return;
    }

    toast.success("Usuário atualizado.");
    setEditando(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Usuários</h2>
        <Button type="button" onClick={abrirNovo}>
          <Plus size={16} /> Novo Usuário
        </Button>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {u.name}
                    {u.id === usuarioLogadoId && <span className="ml-2 text-xs text-muted">(você)</span>}
                  </td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge color={u.role === "ADMIN" ? "purple" : "blue"}>
                      {u.role === "ADMIN" ? "Administrador" : "Vendedor"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={u.ativo ? "green" : "gray"}>{u.ativo ? "Ativo" : "Inativo"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => abrirEdicao(u)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                      aria-label="Editar usuário"
                    >
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={novoOpen} onClose={() => setNovoOpen(false)} title="Novo Usuário">
        <div className="flex flex-col gap-4">
          <div>
            <Label required>Nome</Label>
            <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
          </div>
          <div>
            <Label required>E-mail</Label>
            <Input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} />
          </div>
          <div>
            <Label required>Senha</Label>
            <Input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <Label required>Papel</Label>
            <Select value={novoRole} onChange={(e) => setNovoRole(e.target.value as "ADMIN" | "VENDEDOR")}>
              <option value="VENDEDOR">Vendedor</option>
              <option value="ADMIN">Administrador</option>
            </Select>
          </div>
          {erroNovo && <p className="text-sm text-danger">{erroNovo}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setNovoOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCriar}
              disabled={!novoNome || !novoEmail || novaSenha.length < 6 || salvandoNovo}
            >
              {salvandoNovo ? "Criando..." : "Criar usuário"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={editando !== null} onClose={() => setEditando(null)} title={`Editar — ${editando?.name ?? ""}`}>
        {editando && (
          <div className="flex flex-col gap-4">
            <div>
              <Label required>Nome</Label>
              <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
            </div>
            <div>
              <Label required>E-mail</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div>
              <Label required>Papel</Label>
              <Select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as "ADMIN" | "VENDEDOR")}
                disabled={editando.id === usuarioLogadoId}
              >
                <option value="VENDEDOR">Vendedor</option>
                <option value="ADMIN">Administrador</option>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={editAtivo}
                disabled={editando.id === usuarioLogadoId}
                onChange={(e) => setEditAtivo(e.target.checked)}
              />
              Ativo
            </label>
            <div>
              <Label>Nova senha</Label>
              <Input
                type="password"
                value={editSenha}
                onChange={(e) => setEditSenha(e.target.value)}
                placeholder="Deixe em branco para manter a senha atual"
              />
            </div>
            {erroEdit && <p className="text-sm text-danger">{erroEdit}</p>}
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
    </div>
  );
}
