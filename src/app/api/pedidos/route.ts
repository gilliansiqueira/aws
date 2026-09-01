import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, StatusPedido } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession } from "@/lib/api-utils";
import { calcularParcelas, round2 } from "@/lib/pedido-calc";

const itemSchema = z.object({
  produtoId: z.string().min(1),
  quantidade: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  valorUnitario: z.coerce.number().min(0, "Valor unitário inválido"),
});

const createSchema = z.object({
  clienteId: z.string().min(1, "Selecione o cliente"),
  industriaId: z.string().min(1, "Selecione a indústria"),
  transportadoraId: z.string().optional().nullable(),
  compradorNome: z.string().min(1, "Informe o comprador"),
  formaPagamentoId: z.string().min(1, "Selecione a forma de pagamento"),
  observacoes: z.string().optional().nullable(),
  descontoPercentual: z.coerce.number().min(0, "Desconto inválido").max(100, "Desconto não pode passar de 100%").optional().default(0),
  itens: z.array(itemSchema).min(1, "Adicione ao menos um produto"),
});

export async function GET(req: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const params = req.nextUrl.searchParams;
  const status = params.get("status");
  const clienteId = params.get("clienteId");
  const industriaId = params.get("industriaId");
  const de = params.get("de");
  const ate = params.get("ate");
  const q = params.get("q");

  const where: Prisma.PedidoWhereInput = {
    deletedAt: null,
    AND: [
      status ? { status: status as StatusPedido } : {},
      clienteId ? { clienteId } : {},
      industriaId ? { industriaId } : {},
      de ? { dataPedido: { gte: new Date(de) } } : {},
      ate ? { dataPedido: { lte: new Date(`${ate}T23:59:59`) } } : {},
      q
        ? {
            OR: [
              { clienteNomeSnapshot: { contains: q, mode: "insensitive" } },
              { numero: Number.isNaN(Number(q)) ? undefined : Number(q) },
            ],
          }
        : {},
    ],
  };

  const pedidos = await prisma.pedido.findMany({
    where,
    orderBy: { numero: "desc" },
  });

  return NextResponse.json(pedidos);
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const body = createSchema.parse(await req.json());

    const [cliente, industria, transportadora, formaPagamento, empresa] = await Promise.all([
      prisma.cliente.findUnique({ where: { id: body.clienteId } }),
      prisma.industria.findUnique({ where: { id: body.industriaId } }),
      body.transportadoraId
        ? prisma.transportadora.findUnique({ where: { id: body.transportadoraId } })
        : Promise.resolve(null),
      prisma.formaPagamento.findUnique({ where: { id: body.formaPagamentoId } }),
      prisma.empresaConfig.findFirst(),
    ]);

    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 400 });
    }
    if (cliente.statusCredito === "BLOQUEADO") {
      return NextResponse.json(
        { error: "Cliente bloqueado — não é possível lançar pedido para ele." },
        { status: 400 },
      );
    }
    if (!industria) {
      return NextResponse.json({ error: "Indústria não encontrada" }, { status: 400 });
    }
    if (!formaPagamento) {
      return NextResponse.json({ error: "Forma de pagamento não encontrada" }, { status: 400 });
    }
    if (!empresa) {
      return NextResponse.json(
        { error: "Cadastre os dados da empresa em Configurações antes de criar pedidos." },
        { status: 400 },
      );
    }

    const produtos = await prisma.produto.findMany({
      where: { id: { in: body.itens.map((i) => i.produtoId) } },
      include: { marca: true },
    });
    const produtosPorId = new Map(produtos.map((p) => [p.id, p]));

    for (const item of body.itens) {
      if (!produtosPorId.has(item.produtoId)) {
        return NextResponse.json(
          { error: "Um dos produtos selecionados não foi encontrado" },
          { status: 400 },
        );
      }
    }

    const itensData = body.itens.map((item, index) => {
      const produto = produtosPorId.get(item.produtoId)!;
      const pesoLiquidoUnit = Number(produto.pesoLiquido);
      const pesoTotal = round2(pesoLiquidoUnit * item.quantidade);
      const valorTotal = round2(item.valorUnitario * item.quantidade);

      return {
        ordem: index,
        produtoId: produto.id,
        codigoSnapshot: produto.codigo,
        referenciaSnapshot: produto.referencia,
        descricaoSnapshot: produto.nome,
        marcaNomeSnapshot: produto.marca.nome,
        pesoLiquidoUnitSnapshot: pesoLiquidoUnit,
        valorUnitarioSnapshot: item.valorUnitario,
        quantidade: item.quantidade,
        pesoTotal,
        valorTotal,
      };
    });

    const pesoTotal = round2(itensData.reduce((acc, i) => acc + i.pesoTotal, 0));
    const quantidadeTotal = round2(itensData.reduce((acc, i) => acc + i.quantidade, 0));
    const valorBruto = round2(itensData.reduce((acc, i) => acc + i.valorTotal, 0));
    const valorTotal = round2(valorBruto * (1 - body.descontoPercentual / 100));

    const dataPedido = new Date();
    const parcelas = calcularParcelas(
      valorTotal,
      {
        numeroParcelas: formaPagamento.numeroParcelas,
        primeiraParcelaDias: formaPagamento.primeiraParcelaDias,
        intervaloDias: formaPagamento.intervaloDias,
      },
      dataPedido,
    );

    const pedido = await prisma.$transaction(async (tx) => {
      const counter = await tx.pedidoCounter.update({
        where: { id: 1 },
        data: { ultimo: { increment: 1 } },
      });

      return tx.pedido.create({
        data: {
          numero: counter.ultimo,
          status: "REALIZADO",
          dataPedido,
          clienteId: cliente.id,
          clienteNomeSnapshot: cliente.nome,
          clienteCnpjSnapshot: cliente.cnpj,
          clienteEnderecoSnapshot: cliente.endereco,
          clienteCidadeSnapshot: cliente.cidade,
          clienteUfSnapshot: cliente.uf,
          industriaId: industria.id,
          industriaNomeSnapshot: industria.nome,
          industriaWhatsappSnapshot: industria.whatsapp,
          transportadoraId: transportadora?.id ?? null,
          transportadoraNomeSnapshot: transportadora?.nome ?? null,
          compradorNome: body.compradorNome,
          formaPagamentoId: formaPagamento.id,
          formaPagamentoNomeSnapshot: formaPagamento.nome,
          observacoes: body.observacoes || null,
          empresaSnapshot: {
            nome: empresa.nome,
            razaoSocial: empresa.razaoSocial,
            cnpj: empresa.cnpj,
            endereco: empresa.endereco,
            bairro: empresa.bairro,
            cidade: empresa.cidade,
            uf: empresa.uf,
            cep: empresa.cep,
            telefone: empresa.telefone,
          },
          pesoTotal,
          quantidadeTotal,
          descontoPercentual: body.descontoPercentual,
          valorTotal,
          criadoPorId: session!.user.id,
          itens: { create: itensData },
          parcelas: { create: parcelas },
        },
        include: { itens: true, parcelas: true },
      });
    });

    return NextResponse.json(pedido, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
