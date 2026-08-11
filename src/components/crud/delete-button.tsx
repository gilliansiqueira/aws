"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  apiUrl,
  redirectTo,
  confirmMessage = "Tem certeza que deseja excluir este registro?",
}: {
  apiUrl: string;
  redirectTo: string;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(confirmMessage)) return;
    setLoading(true);
    const res = await fetch(apiUrl, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Não foi possível excluir.");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="danger"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 size={16} /> Excluir
    </Button>
  );
}
