import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const schema = z.object({
  nome: z.string().min(1),
  razaoSocial: z.string().min(1),
  cnpj: z.string().min(1),
  endereco: z.string().min(1),
  bairro: z.string().min(1),
  cidade: z.string().min(1),
  uf: z.string().min(1),
  cep: z.string().min(1),
  telefone: z.string().min(1),
});

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const empresa = await prisma.empresaConfig.findFirst();
  return NextResponse.json(empresa);
}

export async function PUT(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = schema.parse(await req.json());
    const existente = await prisma.empresaConfig.findFirst();

    const empresa = existente
      ? await prisma.empresaConfig.update({ where: { id: existente.id }, data: body })
      : await prisma.empresaConfig.create({ data: body });

    return NextResponse.json(empresa);
  } catch (error) {
    return errorResponse(error);
  }
}
