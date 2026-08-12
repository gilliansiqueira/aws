import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { StatusPedido } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

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
    const pedido = await prisma.pedido.update({
      where: { id },
      data: { status: body.status },
    });
    return NextResponse.json(pedido);
  } catch (error) {
    return errorResponse(error);
  }
}
