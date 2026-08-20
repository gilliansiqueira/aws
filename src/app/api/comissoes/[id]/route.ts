import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const atualizarSchema = z.object({
  valor: z.coerce.number().positive("Valor deve ser maior que zero").optional(),
  pago: z.boolean().optional(),
  observacoes: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { id } = await params;
    const body = atualizarSchema.parse(await req.json());

    const data: {
      valor?: number;
      observacoes?: string | null;
      pago?: boolean;
      dataPagamento?: Date | null;
    } = { valor: body.valor, observacoes: body.observacoes };

    if (body.pago !== undefined) {
      data.pago = body.pago;
      data.dataPagamento = body.pago ? new Date() : null;
    }

    const comissao = await prisma.comissao.update({ where: { id }, data });
    return NextResponse.json(comissao);
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
    await prisma.comissao.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
