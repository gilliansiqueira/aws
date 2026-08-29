import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const criarSchema = z.object({
  clienteId: z.string().min(1, "Selecione o cliente"),
  produtoId: z.string().min(1, "Selecione o produto"),
  quantidade: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  dataEnvio: z.coerce.date().optional(),
  observacoes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const params = req.nextUrl.searchParams;
  const status = params.get("status");
  const clienteId = params.get("clienteId");
  const industriaId = params.get("industriaId");

  const amostras = await prisma.amostra.findMany({
    where: {
      status: (status as never) || undefined,
      clienteId: clienteId || undefined,
      industriaId: industriaId || undefined,
    },
    include: {
      cliente: { select: { id: true, nome: true } },
      marca: { select: { id: true, nome: true } },
      industria: { select: { id: true, nome: true } },
      pedido: { select: { id: true, numero: true } },
    },
    orderBy: { dataEnvio: "desc" },
  });

  return NextResponse.json(amostras);
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const body = criarSchema.parse(await req.json());

    const produto = await prisma.produto.findUnique({
      where: { id: body.produtoId },
      select: { nome: true, marcaId: true, industriaId: true },
    });
    if (!produto) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const amostra = await prisma.amostra.create({
      data: {
        clienteId: body.clienteId,
        produtoId: body.produtoId,
        produtoNomeSnapshot: produto.nome,
        marcaId: produto.marcaId,
        industriaId: produto.industriaId,
        quantidade: body.quantidade,
        dataEnvio: body.dataEnvio ?? new Date(),
        observacoes: body.observacoes,
        criadoPorId: session!.user.id,
      },
    });
    return NextResponse.json(amostra, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
