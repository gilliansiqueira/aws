import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const marcaSchema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal (#RRGGBB)"),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { id } = await params;
    const body = marcaSchema.parse(await req.json());
    const marca = await prisma.marca.update({ where: { id }, data: body });
    return NextResponse.json(marca);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { id } = await params;
    const emUso = await prisma.produto.findFirst({ where: { marcaId: id } });
    if (emUso) {
      return NextResponse.json(
        { error: "Não é possível excluir: existem produtos vinculados a esta marca." },
        { status: 409 },
      );
    }
    await prisma.marca.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
