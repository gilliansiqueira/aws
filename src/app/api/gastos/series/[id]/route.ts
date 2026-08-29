import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const editSchema = z.object({
  descricao: z.string().min(1, "Informe a descrição"),
  contaContabilId: z.string().min(1, "Selecione a conta"),
  observacoes: z.string().optional().nullable(),
  // Opcional: reajusta o valor das parcelas futuras (ex: aluguel que subiu).
  // As já ocorridas mantêm o valor original.
  valorParcela: z.coerce.number().positive().optional(),
});

// Edita a série e propaga descrição/conta pras parcelas ainda não vencidas
// (data >= hoje) — as que já ocorreram ficam intactas pro histórico.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { id } = await params;
    const body = editSchema.parse(await req.json());

    const serieAtual = await prisma.gastoSerie.findUnique({ where: { id } });
    if (!serieAtual) {
      return NextResponse.json({ error: "Série não encontrada" }, { status: 404 });
    }
    if (serieAtual.canceladoEm) {
      return NextResponse.json({ error: "Esta série já foi cancelada." }, { status: 409 });
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [serie] = await prisma.$transaction([
      prisma.gastoSerie.update({
        where: { id },
        data: {
          descricao: body.descricao,
          contaContabilId: body.contaContabilId,
          observacoes: body.observacoes,
          valorParcela: body.valorParcela,
        },
      }),
      prisma.gastoAws.updateMany({
        where: { serieId: id, data: { gte: hoje } },
        data: {
          contaContabilId: body.contaContabilId,
          observacoes: body.observacoes ?? null,
          valor: body.valorParcela,
        },
      }),
    ]);

    // Descrição de cada parcela leva o número — precisa ser reescrita
    // individualmente, não dá pra fazer num updateMany.
    const parcelasFuturas = await prisma.gastoAws.findMany({
      where: { serieId: id, data: { gte: hoje } },
      select: { id: true, numeroParcela: true },
    });
    await Promise.all(
      parcelasFuturas.map((p) =>
        prisma.gastoAws.update({
          where: { id: p.id },
          data: { descricao: `${body.descricao} (${p.numeroParcela}/${serieAtual.quantidadeParcelas})` },
        }),
      ),
    );

    return NextResponse.json(serie);
  } catch (error) {
    return errorResponse(error);
  }
}

// Cancela a série: remove as parcelas ainda não vencidas (data >= hoje) e
// marca a série como cancelada. As parcelas já ocorridas permanecem.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { id } = await params;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    await prisma.$transaction([
      prisma.gastoAws.deleteMany({ where: { serieId: id, data: { gte: hoje } } }),
      prisma.gastoSerie.update({ where: { id }, data: { canceladoEm: new Date() } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
