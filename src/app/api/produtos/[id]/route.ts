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

const precoSchema = z.object({
  preco: z.coerce.number().min(0, "Preço deve ser maior ou igual a zero"),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const produto = await prisma.produto.findUnique({
    where: { id },
    include: {
      marca: true,
      industria: true,
      faixasPreco: { orderBy: { quantidadeMinima: "asc" } },
    },
  });
  if (!produto) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  return NextResponse.json(produto);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { id } = await params;
    const json = await req.json();

    // Edição rápida de preço envia apenas { preco }
    const isPriceOnly = Object.keys(json).length === 1 && "preco" in json;

    if (isPriceOnly) {
      const body = precoSchema.parse(json);
      const produto = await prisma.produto.update({ where: { id }, data: body });
      return NextResponse.json(produto);
    }

    const { faixas, ...body } = schema.parse(json);
    const produto = await prisma.produto.update({
      where: { id },
      data: {
        ...body,
        // substitui todas as faixas pela lista enviada (form de cadastro
        // sempre manda a lista completa e atualizada)
        faixasPreco: {
          deleteMany: {},
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
    return NextResponse.json(produto);
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
    const emUso = await prisma.itemPedido.findFirst({ where: { produtoId: id } });
    if (emUso) {
      return NextResponse.json(
        { error: "Não é possível excluir: existem pedidos vinculados a este produto." },
        { status: 409 },
      );
    }
    await prisma.produto.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
