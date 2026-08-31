import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const vendedorSchema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  ativo: z.boolean().optional(),
  marcaIds: z.array(z.string()).min(1, "Selecione ao menos uma marca"),
});

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const vendedores = await prisma.vendedor.findMany({
    include: { marcas: { include: { marca: true } } },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(vendedores);
}

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = vendedorSchema.parse(await req.json());
    const vendedor = await prisma.vendedor.create({
      data: {
        nome: body.nome,
        ativo: body.ativo ?? true,
        marcas: { create: body.marcaIds.map((marcaId) => ({ marcaId })) },
      },
      include: { marcas: { include: { marca: true } } },
    });
    return NextResponse.json(vendedor, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
