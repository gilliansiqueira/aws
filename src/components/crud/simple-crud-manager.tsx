"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { Card, EmptyState, PageHeader } from "@/components/ui/page-header";

export type CrudField = {
  name: string;
  label: string;
  type?: "text" | "number" | "color" | "checkbox";
  required?: boolean;
  placeholder?: string;
  step?: string;
};

export type CrudColumn<T> = {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
};

type Props<T extends { id: string }> = {
  title: string;
  description?: string;
  apiBase: string;
  fields: CrudField[];
  columns: CrudColumn<T>[];
  newLabel?: string;
  emptyTitle?: string;
};

export function SimpleCrudManager<T extends { id: string }>({
  title,
  description,
  apiBase,
  fields,
  columns,
  newLabel = "Novo",
  emptyTitle = "Nenhum registro cadastrado",
}: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(apiBase);
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openNew() {
    setEditing(null);
    const initial: Record<string, string | boolean> = {};
    fields.forEach((f) => {
      initial[f.name] = f.type === "checkbox" ? true : "";
    });
    setForm(initial);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(item: T) {
    setEditing(item);
    const initial: Record<string, string | boolean> = {};
    fields.forEach((f) => {
      const value = (item as unknown as Record<string, unknown>)[f.name];
      initial[f.name] =
        f.type === "checkbox" ? Boolean(value) : String(value ?? "");
    });
    setForm(initial);
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const url = editing ? `${apiBase}/${editing.id}` : apiBase;
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar.");
      return;
    }

    setModalOpen(false);
    load();
  }

  async function handleDelete(item: T) {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    const res = await fetch(`${apiBase}/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Não foi possível excluir.");
      return;
    }
    load();
  }

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={openNew}>
            <Plus size={16} /> {newLabel}
          </Button>
        }
      />

      <Card className="p-0">
        {loading ? (
          <p className="p-6 text-sm text-muted">Carregando...</p>
        ) : items.length === 0 ? (
          <EmptyState title={emptyTitle} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className="px-4 py-3 font-medium">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-black/[0.02]"
                  >
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3">
                        {c.render
                          ? c.render(item)
                          : String(
                              (item as unknown as Record<string, unknown>)[
                                c.key
                              ] ?? "",
                            )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-foreground"
                          aria-label="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-danger"
                          aria-label="Excluir"
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar" : newLabel}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {fields.map((f) => (
            <div key={f.name}>
              {f.type === "checkbox" ? (
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={Boolean(form[f.name])}
                    onChange={(e) =>
                      setForm({ ...form, [f.name]: e.target.checked })
                    }
                  />
                  {f.label}
                </label>
              ) : (
                <>
                  <Label required={f.required}>{f.label}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type={f.type ?? "text"}
                      step={f.step}
                      required={f.required}
                      placeholder={f.placeholder}
                      value={String(form[f.name] ?? "")}
                      onChange={(e) =>
                        setForm({ ...form, [f.name]: e.target.value })
                      }
                      className={f.type === "color" ? "h-10 w-20 p-1" : ""}
                    />
                    {f.type === "color" && (
                      <span
                        className="inline-block h-8 w-8 shrink-0 rounded-full border border-border"
                        style={{ background: String(form[f.name] ?? "#ccc") }}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
