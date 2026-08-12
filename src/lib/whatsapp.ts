// Envio do espelho por WhatsApp via link wa.me (sem API paga do WhatsApp Business)

export const DEFAULT_WHATSAPP_MESSAGE_TEMPLATE =
  "Segue pedido do cliente {cliente} — Pedido #{pedido}.";

export function buildWhatsAppMessage(
  template: string,
  params: { cliente: string; pedido: number | string },
): string {
  return template
    .replaceAll("{cliente}", params.cliente)
    .replaceAll("{pedido}", String(params.pedido));
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
