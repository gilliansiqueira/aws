export const STATUS_PEDIDO_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  REALIZADO: "Realizado",
  ENVIADO_INDUSTRIA: "Enviado para indústria",
  EM_ANDAMENTO: "Em andamento",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const STATUS_PEDIDO_COLORS: Record<string, "gray" | "blue" | "green" | "yellow" | "red" | "purple"> = {
  RASCUNHO: "gray",
  REALIZADO: "blue",
  ENVIADO_INDUSTRIA: "purple",
  EM_ANDAMENTO: "yellow",
  ENTREGUE: "green",
  CANCELADO: "red",
};

export const STATUS_PEDIDO_ORDER = [
  "RASCUNHO",
  "REALIZADO",
  "ENVIADO_INDUSTRIA",
  "EM_ANDAMENTO",
  "ENTREGUE",
  "CANCELADO",
] as const;

// Estados que ainda não chegaram ao fim do fluxo (usado no dashboard e no
// contador de "pedidos em aberto" da sidebar).
export const STATUS_PEDIDO_EM_ABERTO = [
  "RASCUNHO",
  "REALIZADO",
  "ENVIADO_INDUSTRIA",
  "EM_ANDAMENTO",
] as const;

// Máquina de estados do pedido — única fonte de verdade sobre quais
// transições são permitidas. Usada pela API (bloqueia qualquer troca fora
// daqui) e pela interface (o seletor de status só oferece os próximos
// estados válidos, em vez da lista inteira).
//
//   RASCUNHO -> REALIZADO -> ENVIADO_INDUSTRIA -> EM_ANDAMENTO -> ENTREGUE
//      \___________\_____________\________________/
//                          -> CANCELADO (de qualquer estado em aberto)
//
// ENVIADO_INDUSTRIA já é setado automaticamente pelo envio via WhatsApp
// (ver /api/pedidos/[id]/enviar-whatsapp) — continua disponível aqui pra
// quando o vendedor precisar corrigir manualmente. ENTREGUE e CANCELADO
// são estados finais, sem saída.
export const TRANSICOES_VALIDAS: Record<string, readonly string[]> = {
  RASCUNHO: ["REALIZADO", "CANCELADO"],
  REALIZADO: ["ENVIADO_INDUSTRIA", "CANCELADO"],
  ENVIADO_INDUSTRIA: ["EM_ANDAMENTO", "CANCELADO"],
  EM_ANDAMENTO: ["ENTREGUE", "CANCELADO"],
  ENTREGUE: [],
  CANCELADO: [],
};

export function podeTransicionar(atual: string, novo: string): boolean {
  if (atual === novo) return true;
  return TRANSICOES_VALIDAS[atual]?.includes(novo) ?? false;
}

export function proximosStatus(atual: string): string[] {
  return [...(TRANSICOES_VALIDAS[atual] ?? [])];
}
