import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const gastoSchema = z.object({
  categoria: z.string().min(1, "Informe a categoria"),
  descricao: z.string().min(1, "Informe a descrição"),
  valor: z.coerce.number().positive("Valor deve ser maior que zero"),
  data: z.coerce.date(),
  observacoes: z.string().optional().nullable(),
});

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const gastos = await prisma.gastoAws.findMany({ orderBy: { data: "desc" } });
  return NextResponse.json(gastos);
}

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = gastoSchema.parse(await req.json());
    const gasto = await prisma.gastoAws.create({ data: body });
    return NextResponse.json(gasto, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
