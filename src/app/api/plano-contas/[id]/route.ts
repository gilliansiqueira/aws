import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const grupoSchema = z.object({
  nome: z.string().min(1, "Informe o nome do grupo"),
  tipo: z.enum(["RECEITA", "DESPESA"]),
  ativo: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { id } = await params;
    const body = grupoSchema.parse(await req.json());
    const grupo = await prisma.grupoConta.update({ where: { id }, data: body });
    return NextResponse.json(grupo);
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
    const contaVinculada = await prisma.contaContabil.findFirst({ where: { grupoId: id } });
    if (contaVinculada) {
      return NextResponse.json(
        { error: "Não é possível excluir: existem contas cadastradas neste grupo." },
        { status: 409 },
      );
    }
    await prisma.grupoConta.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
