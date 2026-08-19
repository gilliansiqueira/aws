"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Select } from "@/components/ui/field";
import { STATUS_PEDIDO_LABELS, proximosStatus } from "@/lib/pedido-status";

export function StatusUpdater({ pedidoId, status }: { pedidoId: string; status: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const opcoes = [status, ...proximosStatus(status)];
  const semTransicao = proximosStatus(status).length === 0;

  async function handleChange(newStatus: string) {
    setSaving(true);
    const res = await fetch(`/api/pedidos/${pedidoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(`Status atualizado para "${STATUS_PEDIDO_LABELS[newStatus]}".`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Não foi possível atualizar o status.");
    }
  }

  return (
    <Select
      value={status}
      disabled={saving || semTransicao}
      onChange={(e) => handleChange(e.target.value)}
      className="w-auto"
      title={semTransicao ? "Este status é final — não há próxima etapa." : undefined}
    >
      {opcoes.map((s) => (
        <option key={s} value={s}>
          {STATUS_PEDIDO_LABELS[s]}
        </option>
      ))}
    </Select>
  );
}
