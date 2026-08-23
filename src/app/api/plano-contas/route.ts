import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const grupoSchema = z.object({
  nome: z.string().min(1, "Informe o nome do grupo"),
  tipo: z.enum(["RECEITA", "DESPESA"]),
});

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const grupos = await prisma.grupoConta.findMany({
    include: { contas: { orderBy: { ordem: "asc" } } },
    orderBy: { ordem: "asc" },
  });
  return NextResponse.json(grupos);
}

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = grupoSchema.parse(await req.json());
    const maiorOrdem = await prisma.grupoConta.aggregate({ _max: { ordem: true } });
    const grupo = await prisma.grupoConta.create({
      data: { ...body, ordem: (maiorOrdem._max.ordem ?? 0) + 1 },
    });
    return NextResponse.json(grupo, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
