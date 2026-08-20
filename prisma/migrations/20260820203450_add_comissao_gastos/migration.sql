-- CreateTable
CREATE TABLE "comissoes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos_aws" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_aws_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comissoes_pedidoId_key" ON "comissoes"("pedidoId");

-- CreateIndex
CREATE INDEX "comissoes_userId_idx" ON "comissoes"("userId");

-- CreateIndex
CREATE INDEX "comissoes_pago_idx" ON "comissoes"("pago");

-- CreateIndex
CREATE INDEX "gastos_aws_data_idx" ON "gastos_aws"("data");

-- CreateIndex
CREATE INDEX "gastos_aws_categoria_idx" ON "gastos_aws"("categoria");

-- AddForeignKey
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
