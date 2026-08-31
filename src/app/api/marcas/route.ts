import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const marcaSchema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal (#RRGGBB)"),
  percentualComissao: z.coerce.number().min(0, "Não pode ser negativo").max(100, "Não pode passar de 100%"),
});

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const marcas = await prisma.marca.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(marcas);
}

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = marcaSchema.parse(await req.json());
    const marca = await prisma.marca.create({ data: body });
    return NextResponse.json(marca, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
