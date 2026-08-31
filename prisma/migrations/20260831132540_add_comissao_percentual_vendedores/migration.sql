-- AlterTable
ALTER TABLE "empresa_config" ADD COLUMN     "percentualImposto" DECIMAL(5,2) NOT NULL DEFAULT 9.7;

-- AlterTable
ALTER TABLE "marcas" ADD COLUMN     "percentualComissao" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "vendedores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendedores_marcas" (
    "id" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "marcaId" TEXT NOT NULL,

    CONSTRAINT "vendedores_marcas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendedores_marcas_marcaId_idx" ON "vendedores_marcas"("marcaId");

-- CreateIndex
CREATE UNIQUE INDEX "vendedores_marcas_vendedorId_marcaId_key" ON "vendedores_marcas"("vendedorId", "marcaId");

-- AddForeignKey
ALTER TABLE "vendedores_marcas" ADD CONSTRAINT "vendedores_marcas_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "vendedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendedores_marcas" ADD CONSTRAINT "vendedores_marcas_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
