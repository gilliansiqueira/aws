"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

export function EnviarWhatsAppButton({
  pedidoId,
  numero,
  clienteNome,
  industriaWhatsapp,
  mensagemTemplate,
  jaEnviado,
}: {
  pedidoId: string;
  numero: number;
  clienteNome: string;
  industriaWhatsapp: string;
  mensagemTemplate: string;
  jaEnviado: boolean;
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  async function handleClick() {
    setSending(true);

    const mensagem = buildWhatsAppMessage(mensagemTemplate, {
      cliente: clienteNome,
      pedido: numero,
    });
    const url = buildWhatsAppUrl(industriaWhatsapp, mensagem);
    window.open(url, "_blank");

    await fetch(`/api/pedidos/${pedidoId}/enviar-whatsapp`, { method: "POST" });

    setSending(false);
    router.refresh();
  }

  return (
    <Button type="button" onClick={handleClick} disabled={sending}>
      <MessageCircle size={16} />
      {jaEnviado ? "Reenviar para indústria pelo WhatsApp" : "Enviar para indústria pelo WhatsApp"}
    </Button>
  );
}
