import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const vendedorSchema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  ativo: z.boolean().optional(),
  marcaIds: z.array(z.string()).min(1, "Selecione ao menos uma marca"),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { id } = await params;
    const body = vendedorSchema.parse(await req.json());

    const vendedor = await prisma.$transaction(async (tx) => {
      await tx.vendedorMarca.deleteMany({ where: { vendedorId: id } });
      return tx.vendedor.update({
        where: { id },
        data: {
          nome: body.nome,
          ativo: body.ativo ?? true,
          marcas: { create: body.marcaIds.map((marcaId) => ({ marcaId })) },
        },
        include: { marcas: { include: { marca: true } } },
      });
    });

    return NextResponse.json(vendedor);
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
    await prisma.vendedor.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
