import type { StatusCredito } from "@/generated/prisma/client";

export const STATUS_CREDITO_ORDER: StatusCredito[] = ["ATIVO", "BLOQUEADO", "PROTESTADO"];

export const STATUS_CREDITO_LABELS: Record<StatusCredito, string> = {
  ATIVO: "Ativo",
  BLOQUEADO: "Bloqueado",
  PROTESTADO: "Protestado",
};

export const STATUS_CREDITO_COLORS: Record<StatusCredito, "green" | "red" | "yellow"> = {
  ATIVO: "green",
  BLOQUEADO: "red",
  PROTESTADO: "yellow",
};
