import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const contaSchema = z.object({
  nome: z.string().min(1, "Informe o nome da conta"),
  grupoId: z.string().min(1, "Selecione o grupo"),
});

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = contaSchema.parse(await req.json());
    const maiorOrdem = await prisma.contaContabil.aggregate({
      _max: { ordem: true },
      where: { grupoId: body.grupoId },
    });
    const conta = await prisma.contaContabil.create({
      data: { ...body, ordem: (maiorOrdem._max.ordem ?? 0) + 1 },
    });
    return NextResponse.json(conta, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
