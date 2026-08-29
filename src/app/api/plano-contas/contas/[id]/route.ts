import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const contaSchema = z.object({
  nome: z.string().min(1, "Informe o nome da conta"),
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
    const body = contaSchema.parse(await req.json());
    const conta = await prisma.contaContabil.update({ where: { id }, data: body });
    return NextResponse.json(conta);
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
    const [gastoVinculado, comissaoVinculada] = await Promise.all([
      prisma.gastoAws.findFirst({ where: { contaContabilId: id } }),
      prisma.comissao.findFirst({ where: { contaContabilId: id } }),
    ]);
    if (gastoVinculado || comissaoVinculada) {
      return NextResponse.json(
        { error: "Não é possível excluir: existem lançamentos vinculados a esta conta. Desative em vez de excluir." },
        { status: 409 },
      );
    }
    await prisma.contaContabil.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
