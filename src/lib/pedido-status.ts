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
