import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const schema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  numeroParcelas: z.coerce.number().int().min(1),
  intervaloDias: z.coerce.number().int().min(0),
  primeiraParcelaDias: z.coerce.number().int().min(0),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { id } = await params;
    const body = schema.parse(await req.json());
    const item = await prisma.formaPagamento.update({ where: { id }, data: body });
    return NextResponse.json(item);
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
    await prisma.formaPagamento.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
