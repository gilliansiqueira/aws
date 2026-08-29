import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const criarSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["ADMIN", "VENDEDOR"]),
});

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const usuarios = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true },
  });
  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (session!.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Só administradores podem gerenciar usuários." }, { status: 403 });
  }

  try {
    const body = criarSchema.parse(await req.json());
    const passwordHash = await bcrypt.hash(body.password, 10);
    const usuario = await prisma.user.create({
      data: { name: body.name, email: body.email, passwordHash, role: body.role },
      select: { id: true, name: true, email: true, role: true, ativo: true },
    });
    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
