import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const criarSchema = z.object({
  pedidoId: z.string().min(1, "Selecione o pedido"),
  userId: z.string().min(1, "Selecione o representante"),
  valor: z.coerce.number().positive("Valor deve ser maior que zero"),
  observacoes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const params = req.nextUrl.searchParams;
  const userId = params.get("userId");
  const pago = params.get("pago");

  const comissoes = await prisma.comissao.findMany({
    where: {
      userId: userId || undefined,
      pago: pago === "true" ? true : pago === "false" ? false : undefined,
    },
    include: {
      user: { select: { id: true, name: true } },
      pedido: { select: { id: true, numero: true, clienteNomeSnapshot: true, valorTotal: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comissoes);
}

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = criarSchema.parse(await req.json());

    const pedido = await prisma.pedido.findUnique({
      where: { id: body.pedidoId },
      select: { status: true, deletedAt: true },
    });
    if (!pedido || pedido.deletedAt) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }
    if (pedido.status !== "ENTREGUE") {
      return NextResponse.json(
        { error: "Só é possível lançar comissão para pedidos já entregues." },
        { status: 400 },
      );
    }

    const comissao = await prisma.comissao.create({
      data: {
        pedidoId: body.pedidoId,
        userId: body.userId,
        valor: body.valor,
        observacoes: body.observacoes,
      },
    });
    return NextResponse.json(comissao, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
