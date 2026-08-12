import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const schema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  cnpj: z.string().optional().nullable(),
  contatoNome: z.string().optional().nullable(),
  contatoTelefone: z.string().optional().nullable(),
  whatsapp: z
    .string()
    .min(8, "Informe o WhatsApp da indústria (necessário para envio do pedido)"),
  transportadoraPadraoId: z.string().optional().nullable(),
  mensagemPadraoEnvio: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const q = req.nextUrl.searchParams.get("q");

  const industrias = await prisma.industria.findMany({
    where: q
      ? { nome: { contains: q, mode: "insensitive" } }
      : undefined,
    include: { transportadoraPadrao: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(industrias);
}

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = schema.parse(await req.json());
    const industria = await prisma.industria.create({ data: body });
    return NextResponse.json(industria, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
