import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const schema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  numeroParcelas: z.coerce.number().int().min(1),
  intervaloDias: z.coerce.number().int().min(0),
  primeiraParcelaDias: z.coerce.number().int().min(0),
});

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const items = await prisma.formaPagamento.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = schema.parse(await req.json());
    const item = await prisma.formaPagamento.create({ data: body });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
