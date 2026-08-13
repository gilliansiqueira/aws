-- CreateTable
CREATE TABLE "faixas_preco" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidadeMinima" DECIMAL(12,3) NOT NULL,
    "quantidadeMaxima" DECIMAL(12,3),
    "preco" DECIMAL(12,2) NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "faixas_preco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faixas_preco_produtoId_idx" ON "faixas_preco"("produtoId");

-- AddForeignKey
ALTER TABLE "faixas_preco" ADD CONSTRAINT "faixas_preco_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
