import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { id } = await params;

    const atual = await prisma.pedido.findUnique({ where: { id }, select: { deletedAt: true } });
    if (!atual || atual.deletedAt) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const pedido = await prisma.pedido.update({
      where: { id },
      data: {
        enviadoWhatsappEm: new Date(),
        status: "ENVIADO_INDUSTRIA",
      },
    });
    return NextResponse.json(pedido);
  } catch (error) {
    return errorResponse(error);
  }
}
