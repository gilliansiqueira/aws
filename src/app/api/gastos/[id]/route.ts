import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const gastoSchema = z.object({
  categoria: z.string().min(1, "Informe a categoria"),
  descricao: z.string().min(1, "Informe a descrição"),
  valor: z.coerce.number().positive("Valor deve ser maior que zero"),
  data: z.coerce.date(),
  observacoes: z.string().optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { id } = await params;
    const body = gastoSchema.parse(await req.json());
    const gasto = await prisma.gastoAws.update({ where: { id }, data: body });
    return NextResponse.json(gasto);
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
    await prisma.gastoAws.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
