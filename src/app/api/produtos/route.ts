import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const schema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  codigo: z.string().min(1, "Informe o código"),
  referencia: z.string().optional().nullable(),
  marcaId: z.string().min(1, "Selecione a marca"),
  industriaId: z.string().min(1, "Selecione a indústria"),
  unidade: z.string().min(1).default("UN"),
  pesoLiquido: z.coerce.number().min(0, "Peso deve ser maior ou igual a zero"),
  preco: z.coerce.number().min(0, "Preço deve ser maior ou igual a zero"),
});

export async function GET(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const q = req.nextUrl.searchParams.get("q");
  const marcaId = req.nextUrl.searchParams.get("marcaId");
  const industriaId = req.nextUrl.searchParams.get("industriaId");

  const produtos = await prisma.produto.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { nome: { contains: q, mode: "insensitive" } },
                { codigo: { contains: q, mode: "insensitive" } },
                { referencia: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        marcaId ? { marcaId } : {},
        industriaId ? { industriaId } : {},
      ],
    },
    include: { marca: true, industria: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(produtos);
}

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = schema.parse(await req.json());
    const produto = await prisma.produto.create({ data: body });
    return NextResponse.json(produto, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
