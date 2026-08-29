import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";

const serieSchema = z
  .object({
    descricao: z.string().min(1, "Informe a descrição"),
    contaContabilId: z.string().min(1, "Selecione a conta"),
    tipo: z.enum(["RECORRENTE", "PARCELADO"]),
    dataInicio: z.coerce.date(),
    quantidadeParcelas: z.coerce.number().int().min(2, "Informe pelo menos 2 parcelas/meses"),
    observacoes: z.string().optional().nullable(),
    // Recorrente: valor de cada mês. Parcelado: valor total, dividido pela quantidade de parcelas.
    valor: z.coerce.number().positive("Valor deve ser maior que zero"),
  })
  .refine((data) => data.quantidadeParcelas <= 120, {
    message: "Máximo de 120 parcelas/meses",
    path: ["quantidadeParcelas"],
  });

export async function POST(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = serieSchema.parse(await req.json());

    // Parcelado divide o valor total; o arredondamento de centavos fica
    // concentrado na última parcela pra soma bater exatamente com o total.
    const valorParcelaBase =
      body.tipo === "PARCELADO"
        ? Math.round((body.valor / body.quantidadeParcelas) * 100) / 100
        : body.valor;

    const serie = await prisma.gastoSerie.create({
      data: {
        descricao: body.descricao,
        tipo: body.tipo,
        contaContabilId: body.contaContabilId,
        quantidadeParcelas: body.quantidadeParcelas,
        valorParcela: valorParcelaBase,
        dataInicio: body.dataInicio,
        observacoes: body.observacoes,
      },
    });

    const gastos = Array.from({ length: body.quantidadeParcelas }, (_, i) => {
      const numeroParcela = i + 1;
      let valor = valorParcelaBase;
      if (body.tipo === "PARCELADO" && numeroParcela === body.quantidadeParcelas) {
        const somaAnteriores = valorParcelaBase * (body.quantidadeParcelas - 1);
        valor = Math.round((body.valor - somaAnteriores) * 100) / 100;
      }
      return {
        descricao: `${body.descricao} (${numeroParcela}/${body.quantidadeParcelas})`,
        valor,
        data: addMonths(body.dataInicio, i),
        observacoes: body.observacoes ?? null,
        contaContabilId: body.contaContabilId,
        serieId: serie.id,
        numeroParcela,
      };
    });

    await prisma.gastoAws.createMany({ data: gastos });

    return NextResponse.json(serie, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
