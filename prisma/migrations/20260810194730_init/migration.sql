-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('RASCUNHO', 'REALIZADO', 'ENVIADO_INDUSTRIA', 'EM_ANDAMENTO', 'ENTREGUE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusAmostra" AS ENUM ('DISPONIBILIZADA', 'AGUARDANDO_RETORNO', 'RETORNO_RECEBIDO', 'CONVERTEU_VENDA', 'NAO_CONVERTEU', 'SEM_RETORNO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VENDEDOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresa_config" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresa_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industrias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "contatoNome" TEXT,
    "contatoTelefone" TEXT,
    "whatsapp" TEXT NOT NULL,
    "transportadoraPadraoId" TEXT,
    "mensagemPadraoEnvio" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industrias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transportadoras" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transportadoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formas_pagamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "numeroParcelas" INTEGER NOT NULL DEFAULT 1,
    "intervaloDias" INTEGER NOT NULL DEFAULT 30,
    "primeiraParcelaDias" INTEGER NOT NULL DEFAULT 30,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formas_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "endereco" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "cep" TEXT,
    "contatoNome" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "formaPagamentoPadraoId" TEXT,
    "compradorPadrao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "referencia" TEXT,
    "marcaId" TEXT NOT NULL,
    "industriaId" TEXT NOT NULL,
    "unidade" TEXT NOT NULL DEFAULT 'UN',
    "pesoLiquido" DECIMAL(12,3) NOT NULL,
    "preco" DECIMAL(12,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_counter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "ultimo" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "pedido_counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'RASCUNHO',
    "dataPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" TEXT NOT NULL,
    "clienteNomeSnapshot" TEXT NOT NULL,
    "clienteCnpjSnapshot" TEXT,
    "clienteEnderecoSnapshot" TEXT,
    "clienteCidadeSnapshot" TEXT,
    "clienteUfSnapshot" TEXT,
    "industriaId" TEXT NOT NULL,
    "industriaNomeSnapshot" TEXT NOT NULL,
    "industriaWhatsappSnapshot" TEXT NOT NULL,
    "transportadoraId" TEXT,
    "transportadoraNomeSnapshot" TEXT,
    "compradorNome" TEXT NOT NULL,
    "formaPagamentoId" TEXT,
    "formaPagamentoNomeSnapshot" TEXT NOT NULL,
    "observacoes" TEXT,
    "empresaSnapshot" JSONB NOT NULL,
    "pesoTotal" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "quantidadeTotal" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "valorTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "enviadoWhatsappEm" TIMESTAMP(3),
    "pedidoOrigemId" TEXT,
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "produtoId" TEXT,
    "codigoSnapshot" TEXT NOT NULL,
    "referenciaSnapshot" TEXT,
    "descricaoSnapshot" TEXT NOT NULL,
    "marcaNomeSnapshot" TEXT NOT NULL,
    "pesoLiquidoUnitSnapshot" DECIMAL(12,3) NOT NULL,
    "valorUnitarioSnapshot" DECIMAL(12,2) NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "pesoTotal" DECIMAL(14,3) NOT NULL,
    "valorTotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcelas" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "totalParcelas" INTEGER NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "parcelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amostras" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "produtoNomeSnapshot" TEXT NOT NULL,
    "marcaId" TEXT NOT NULL,
    "industriaId" TEXT NOT NULL,
    "dataEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "status" "StatusAmostra" NOT NULL DEFAULT 'DISPONIBILIZADA',
    "dataRetorno" TIMESTAMP(3),
    "observacoes" TEXT,
    "pedidoId" TEXT,
    "valorVendaGerado" DECIMAL(14,2),
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amostras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nome_key" ON "marcas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigo_key" ON "produtos"("codigo");

-- CreateIndex
CREATE INDEX "produtos_marcaId_idx" ON "produtos"("marcaId");

-- CreateIndex
CREATE INDEX "produtos_industriaId_idx" ON "produtos"("industriaId");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_key" ON "pedidos"("numero");

-- CreateIndex
CREATE INDEX "pedidos_clienteId_idx" ON "pedidos"("clienteId");

-- CreateIndex
CREATE INDEX "pedidos_industriaId_idx" ON "pedidos"("industriaId");

-- CreateIndex
CREATE INDEX "pedidos_status_idx" ON "pedidos"("status");

-- CreateIndex
CREATE INDEX "pedidos_dataPedido_idx" ON "pedidos"("dataPedido");

-- CreateIndex
CREATE INDEX "itens_pedido_pedidoId_idx" ON "itens_pedido"("pedidoId");

-- CreateIndex
CREATE INDEX "parcelas_pedidoId_idx" ON "parcelas"("pedidoId");

-- CreateIndex
CREATE INDEX "amostras_clienteId_idx" ON "amostras"("clienteId");

-- CreateIndex
CREATE INDEX "amostras_marcaId_idx" ON "amostras"("marcaId");

-- CreateIndex
CREATE INDEX "amostras_industriaId_idx" ON "amostras"("industriaId");

-- CreateIndex
CREATE INDEX "amostras_status_idx" ON "amostras"("status");

-- AddForeignKey
ALTER TABLE "industrias" ADD CONSTRAINT "industrias_transportadoraPadraoId_fkey" FOREIGN KEY ("transportadoraPadraoId") REFERENCES "transportadoras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_formaPagamentoPadraoId_fkey" FOREIGN KEY ("formaPagamentoPadraoId") REFERENCES "formas_pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_industriaId_fkey" FOREIGN KEY ("industriaId") REFERENCES "industrias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_industriaId_fkey" FOREIGN KEY ("industriaId") REFERENCES "industrias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_transportadoraId_fkey" FOREIGN KEY ("transportadoraId") REFERENCES "transportadoras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_formaPagamentoId_fkey" FOREIGN KEY ("formaPagamentoId") REFERENCES "formas_pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_pedidoOrigemId_fkey" FOREIGN KEY ("pedidoOrigemId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcelas" ADD CONSTRAINT "parcelas_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amostras" ADD CONSTRAINT "amostras_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amostras" ADD CONSTRAINT "amostras_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amostras" ADD CONSTRAINT "amostras_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amostras" ADD CONSTRAINT "amostras_industriaId_fkey" FOREIGN KEY ("industriaId") REFERENCES "industrias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amostras" ADD CONSTRAINT "amostras_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amostras" ADD CONSTRAINT "amostras_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
