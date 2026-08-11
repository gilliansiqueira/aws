import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";

export async function requireSession() {
  const session = await auth();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }
  return { session, response: null };
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: error.flatten() },
      { status: 400 },
    );
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  ) {
    return NextResponse.json(
      { error: "Já existe um registro com esses dados (valor duplicado)." },
      { status: 409 },
    );
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  ) {
    return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
  }
  console.error(error);
  return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
}
