import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const faixaSchema = z
  .object({
    quantidadeMinima: z.coerce.number().min(0, "Quantidade mínima inválida"),
    quantidadeMaxima: z.coerce.number().min(0).nullable().optional(),
    preco: z.coerce.number().min(0, "Preço da faixa inválido"),
  })
  .refine(
    (f) => f.quantidadeMaxima == null || f.quantidadeMaxima >= f.quantidadeMinima,
    { message: "Quantidade máxima deve ser maior ou igual à mínima", path: ["quantidadeMaxima"] },
  );

const schema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  codigo: z.string().min(1, "Informe o código"),
  referencia: z.string().optional().nullable(),
  marcaId: z.string().min(1, "Selecione a marca"),
  industriaId: z.string().min(1, "Selecione a indústria"),
  unidade: z.string().min(1).default("UN"),
  pesoLiquido: z.coerce.number().min(0, "Peso deve ser maior ou igual a zero"),
  preco: z.coerce.number().min(0, "Preço deve ser maior ou igual a zero"),
  faixas: z.array(faixaSchema).optional().default([]),
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
    include: {
      marca: true,
      industria: true,
      faixasPreco: { orderBy: { quantidadeMinima: "asc" } },
    },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(produtos);
}

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { faixas, ...body } = schema.parse(await req.json());
    const produto = await prisma.produto.create({
      data: {
        ...body,
        faixasPreco: {
          create: faixas.map((f, ordem) => ({
            quantidadeMinima: f.quantidadeMinima,
            quantidadeMaxima: f.quantidadeMaxima ?? null,
            preco: f.preco,
            ordem,
          })),
        },
      },
      include: { faixasPreco: true },
    });
    return NextResponse.json(produto, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
