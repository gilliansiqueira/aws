export const STATUS_AMOSTRA_ORDER = [
  "DISPONIBILIZADA",
  "AGUARDANDO_RETORNO",
  "RETORNO_RECEBIDO",
  "CONVERTEU_VENDA",
  "NAO_CONVERTEU",
  "SEM_RETORNO",
] as const;

export const STATUS_AMOSTRA_LABELS: Record<string, string> = {
  DISPONIBILIZADA: "Disponibilizada",
  AGUARDANDO_RETORNO: "Aguardando retorno",
  RETORNO_RECEBIDO: "Retorno recebido",
  CONVERTEU_VENDA: "Converteu venda",
  NAO_CONVERTEU: "Não converteu",
  SEM_RETORNO: "Sem retorno",
};

export const STATUS_AMOSTRA_COLORS: Record<string, "gray" | "blue" | "green" | "yellow" | "red" | "purple"> = {
  DISPONIBILIZADA: "blue",
  AGUARDANDO_RETORNO: "yellow",
  RETORNO_RECEBIDO: "purple",
  CONVERTEU_VENDA: "green",
  NAO_CONVERTEU: "gray",
  SEM_RETORNO: "red",
};

// Máquina de estados da amostra — mesma ideia do pedido: única fonte de
// verdade das transições válidas, usada pela API e pelo seletor de status.
export const TRANSICOES_AMOSTRA_VALIDAS: Record<string, readonly string[]> = {
  DISPONIBILIZADA: ["AGUARDANDO_RETORNO", "SEM_RETORNO"],
  AGUARDANDO_RETORNO: ["RETORNO_RECEBIDO", "SEM_RETORNO"],
  RETORNO_RECEBIDO: ["CONVERTEU_VENDA", "NAO_CONVERTEU"],
  CONVERTEU_VENDA: [],
  NAO_CONVERTEU: [],
  SEM_RETORNO: [],
};

export function podeTransicionarAmostra(atual: string, novo: string): boolean {
  if (atual === novo) return true;
  return TRANSICOES_AMOSTRA_VALIDAS[atual]?.includes(novo) ?? false;
}

export function proximosStatusAmostra(atual: string): string[] {
  return [...(TRANSICOES_AMOSTRA_VALIDAS[atual] ?? [])];
}
