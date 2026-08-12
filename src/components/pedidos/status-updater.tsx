"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select } from "@/components/ui/field";
import { STATUS_PEDIDO_LABELS, STATUS_PEDIDO_ORDER } from "@/lib/pedido-status";

export function StatusUpdater({ pedidoId, status }: { pedidoId: string; status: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleChange(newStatus: string) {
    setSaving(true);
    const res = await fetch(`/api/pedidos/${pedidoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  return (
    <Select
      value={status}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      className="w-auto"
    >
      {STATUS_PEDIDO_ORDER.map((s) => (
        <option key={s} value={s}>
          {STATUS_PEDIDO_LABELS[s]}
        </option>
      ))}
    </Select>
  );
}
