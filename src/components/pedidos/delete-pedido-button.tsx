"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { STATUS_PEDIDO_LABELS } from "@/lib/pedido-status";

export function DeletePedidoButton({
  pedidoId,
  numero,
  status,
  variant = "icon",
  redirectTo,
}: {
  pedidoId: string;
  numero: number;
  status: string;
  variant?: "icon" | "button";
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const definitivo = status === "RASCUNHO";

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/pedidos/${pedidoId}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Não foi possível excluir o pedido.");
      return;
    }

    setOpen(false);
    toast.success(`Pedido #${numero} excluído.`);
    if (redirectTo) {
      router.push(redirectTo);
    }
    // Sempre revalida (inclusive o layout, pra atualizar o badge da
    // sidebar) — o cache client-side do App Router pode segurar a
    // contagem antiga só com router.push.
    router.refresh();
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-danger dark:hover:bg-red-500/10"
          aria-label="Excluir pedido"
          title="Excluir pedido"
        >
          <Trash2 size={15} />
        </button>
      ) : (
        <Button type="button" variant="danger" onClick={() => setOpen(true)}>
          <Trash2 size={16} /> Excluir
        </Button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`Excluir pedido #${numero}`}>
        {definitivo ? (
          <p className="text-sm text-muted">
            Este pedido está em <strong>rascunho</strong> e nunca foi enviado — a exclusão é{" "}
            <strong>definitiva</strong> e não pode ser desfeita.
          </p>
        ) : (
          <p className="text-sm text-muted">
            Este pedido já tem histórico (status atual: <strong>{STATUS_PEDIDO_LABELS[status]}</strong>). Ele será
            removido das listagens, mas os dados continuam guardados para auditoria — não é uma exclusão
            definitiva.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
