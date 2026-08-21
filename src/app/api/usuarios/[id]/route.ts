import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const atualizarSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().email("E-mail inválido"),
  role: z.enum(["ADMIN", "VENDEDOR"]),
  ativo: z.boolean(),
  password: z.string().min(6).optional().or(z.literal("")),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (session!.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Só administradores podem gerenciar usuários." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = atualizarSchema.parse(await req.json());

    if (id === session!.user.id && !body.ativo) {
      return NextResponse.json({ error: "Você não pode desativar seu próprio usuário." }, { status: 400 });
    }
    if (id === session!.user.id && body.role !== "ADMIN") {
      return NextResponse.json({ error: "Você não pode remover seu próprio acesso de administrador." }, { status: 400 });
    }

    const data: { name: string; email: string; role: "ADMIN" | "VENDEDOR"; ativo: boolean; passwordHash?: string } = {
      name: body.name,
      email: body.email,
      role: body.role,
      ativo: body.ativo,
    };
    if (body.password) {
      data.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const usuario = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, ativo: true },
    });
    return NextResponse.json(usuario);
  } catch (error) {
    return errorResponse(error);
  }
}
