import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";
import { podeTransicionarAmostra } from "@/lib/amostra-status";

const atualizarSchema = z.object({
  status: z.enum([
    "DISPONIBILIZADA",
    "AGUARDANDO_RETORNO",
    "RETORNO_RECEBIDO",
    "CONVERTEU_VENDA",
    "NAO_CONVERTEU",
    "SEM_RETORNO",
  ]),
  dataRetorno: z.coerce.date().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  pedidoId: z.string().optional().nullable(),
  valorVendaGerado: z.coerce.number().min(0).optional().nullable(),
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

    const atual = await prisma.amostra.findUnique({ where: { id }, select: { status: true } });
    if (!atual) {
      return NextResponse.json({ error: "Amostra não encontrada" }, { status: 404 });
    }
    if (!podeTransicionarAmostra(atual.status, body.status)) {
      return NextResponse.json(
        { error: `Não é possível mudar de "${atual.status}" para "${body.status}".` },
        { status: 400 },
      );
    }

    const amostra = await prisma.amostra.update({
      where: { id },
      data: {
        status: body.status,
        dataRetorno: body.dataRetorno,
        observacoes: body.observacoes,
        pedidoId: body.pedidoId || null,
        valorVendaGerado: body.valorVendaGerado ?? null,
      },
    });
    return NextResponse.json(amostra);
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
    await prisma.amostra.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
