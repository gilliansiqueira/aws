import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Usuários iniciais (2 logins, conforme solicitado)
  const senhaAdmin = await bcrypt.hash("admin123", 10);
  const senhaVendedor = await bcrypt.hash("vendedor123", 10);

  await prisma.user.upsert({
    where: { email: "admin@aws.com.br" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@aws.com.br",
      passwordHash: senhaAdmin,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "vendedor@aws.com.br" },
    update: {},
    create: {
      name: "Vendedor",
      email: "vendedor@aws.com.br",
      passwordHash: senhaVendedor,
      role: "VENDEDOR",
    },
  });

  // Dados da empresa AWS (editável em Configurações)
  const empresaExistente = await prisma.empresaConfig.findFirst();
  if (!empresaExistente) {
    await prisma.empresaConfig.create({
      data: {
        nome: "AWS Distribuidora",
        razaoSocial: "AWS COMERCIO E DISTRIBUICAO LTDA",
        cnpj: "00.000.000/0001-00",
        endereco: "Rua Exemplo, 123",
        bairro: "Centro",
        cidade: "Sua Cidade",
        uf: "SP",
        cep: "00000-000",
        telefone: "(00) 0000-0000",
      },
    });
  }

  // Contador de pedidos
  await prisma.pedidoCounter.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, ultimo: 1000 },
  });

  // Formas de pagamento padrão
  const boleto = await prisma.formaPagamento.upsert({
    where: { id: "seed-boleto" },
    update: {},
    create: {
      id: "seed-boleto",
      nome: "BOLETO BANCARIO",
      numeroParcelas: 4,
      intervaloDias: 30,
      primeiraParcelaDias: 30,
    },
  });

  await prisma.formaPagamento.upsert({
    where: { id: "seed-avista" },
    update: {},
    create: {
      id: "seed-avista",
      nome: "A VISTA",
      numeroParcelas: 1,
      intervaloDias: 0,
      primeiraParcelaDias: 0,
    },
  });

  // Transportadora exemplo
  const transportadora = await prisma.transportadora.upsert({
    where: { id: "seed-transp-1" },
    update: {},
    create: { id: "seed-transp-1", nome: "Transportadora Exemplo", telefone: "(00) 0000-0000" },
  });

  // Marca exemplo
  const marca = await prisma.marca.upsert({
    where: { nome: "Marca Exemplo" },
    update: {},
    create: { nome: "Marca Exemplo", cor: "#2563EB" },
  });

  // Indústria exemplo (com WhatsApp, obrigatório para envio)
  const industria = await prisma.industria.upsert({
    where: { id: "seed-industria-1" },
    update: {},
    create: {
      id: "seed-industria-1",
      nome: "Indústria Exemplo Ltda",
      cnpj: "11.111.111/0001-11",
      whatsapp: "5511999999999",
      transportadoraPadraoId: transportadora.id,
      mensagemPadraoEnvio: "Segue pedido do cliente {cliente} — Pedido #{pedido}.",
    },
  });

  // Cliente exemplo
  await prisma.cliente.upsert({
    where: { id: "seed-cliente-1" },
    update: {},
    create: {
      id: "seed-cliente-1",
      nome: "Cliente Exemplo Ltda",
      cnpj: "22.222.222/0001-22",
      cidade: "São Paulo",
      uf: "SP",
      cep: "01000-000",
      whatsapp: "5511988888888",
      latitude: -23.55052,
      longitude: -46.633308,
      formaPagamentoPadraoId: boleto.id,
      compradorPadrao: "Comprador Exemplo",
    },
  });

  // Produto exemplo
  await prisma.produto.upsert({
    where: { codigo: "PROD-001" },
    update: {},
    create: {
      nome: "Produto Exemplo 5kg",
      codigo: "PROD-001",
      referencia: "REF-001",
      marcaId: marca.id,
      industriaId: industria.id,
      unidade: "CX",
      pesoLiquido: 5,
      preco: 22.79,
    },
  });

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
