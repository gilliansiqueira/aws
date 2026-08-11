import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const schema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  cnpj: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  uf: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  contatoNome: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  formaPagamentoPadraoId: z.string().optional().nullable(),
  compradorPadrao: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const q = req.nextUrl.searchParams.get("q");

  const clientes = await prisma.cliente.findMany({
    where: q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { cnpj: { contains: q, mode: "insensitive" } },
            { cidade: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { formaPagamentoPadrao: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = schema.parse(await req.json());
    const cliente = await prisma.cliente.create({ data: body });
    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
