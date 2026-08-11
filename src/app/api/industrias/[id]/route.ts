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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const industria = await prisma.industria.findUnique({
    where: { id },
    include: { transportadoraPadrao: true },
  });
  if (!industria) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  return NextResponse.json(industria);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { id } = await params;
    const body = schema.parse(await req.json());
    const industria = await prisma.industria.update({ where: { id }, data: body });
    return NextResponse.json(industria);
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
    const emUso = await prisma.produto.findFirst({ where: { industriaId: id } });
    if (emUso) {
      return NextResponse.json(
        { error: "Não é possível excluir: existem produtos vinculados a esta indústria." },
        { status: 409 },
      );
    }
    await prisma.industria.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
