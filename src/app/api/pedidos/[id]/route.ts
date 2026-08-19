import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { StatusPedido } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";
import { podeTransicionar, STATUS_PEDIDO_LABELS } from "@/lib/pedido-status";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      itens: { orderBy: { ordem: "asc" } },
      parcelas: { orderBy: { numero: "asc" } },
      cliente: true,
      industria: true,
      transportadora: true,
      formaPagamento: true,
    },
  });

  if (!pedido) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  return NextResponse.json(pedido);
}

const statusSchema = z.object({
  status: z.enum([
    StatusPedido.RASCUNHO,
    StatusPedido.REALIZADO,
    StatusPedido.ENVIADO_INDUSTRIA,
    StatusPedido.EM_ANDAMENTO,
    StatusPedido.ENTREGUE,
    StatusPedido.CANCELADO,
  ]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { id } = await params;
    const body = statusSchema.parse(await req.json());

    const atual = await prisma.pedido.findUnique({ where: { id }, select: { status: true } });
    if (!atual) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }
    if (!podeTransicionar(atual.status, body.status)) {
      return NextResponse.json(
        {
          error: `Não é possível mudar de "${STATUS_PEDIDO_LABELS[atual.status]}" para "${STATUS_PEDIDO_LABELS[body.status]}".`,
        },
        { status: 400 },
      );
    }

    const pedido = await prisma.pedido.update({
      where: { id },
      data: { status: body.status },
    });
    return NextResponse.json(pedido);
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

  const { id } = await params;
  const pedido = await prisma.pedido.findUnique({ where: { id }, select: { status: true, deletedAt: true } });

  if (!pedido || pedido.deletedAt) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  if (pedido.status === "RASCUNHO") {
    // Nunca foi enviado — sem valor de auditoria, pode remover de verdade.
    // Amostra.pedidoId é uma FK opcional sem cascade: desvincula antes de
    // apagar pra não falhar por violação de integridade.
    await prisma.$transaction([
      prisma.amostra.updateMany({ where: { pedidoId: id }, data: { pedidoId: null } }),
      prisma.pedido.delete({ where: { id } }),
    ]);
    return NextResponse.json({ excluido: "definitivo" });
  }

  // Qualquer outro status já tem histórico real (foi enviado, faturado
  // etc.) — exclusão lógica, mantém no banco pra auditoria.
  await prisma.pedido.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ excluido: "logico" });
}
