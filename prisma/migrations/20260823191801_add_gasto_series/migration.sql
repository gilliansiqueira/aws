-- CreateEnum
CREATE TYPE "TipoSerieGasto" AS ENUM ('RECORRENTE', 'PARCELADO');

-- AlterTable
ALTER TABLE "gastos_aws" ADD COLUMN     "numeroParcela" INTEGER,
ADD COLUMN     "serieId" TEXT;

-- CreateTable
CREATE TABLE "gastos_series" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "TipoSerieGasto" NOT NULL,
    "contaContabilId" TEXT NOT NULL,
    "quantidadeParcelas" INTEGER NOT NULL,
    "valorParcela" DECIMAL(12,2) NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "canceladoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gastos_series_contaContabilId_idx" ON "gastos_series"("contaContabilId");

-- CreateIndex
CREATE INDEX "gastos_aws_serieId_idx" ON "gastos_aws"("serieId");

-- AddForeignKey
ALTER TABLE "gastos_aws" ADD CONSTRAINT "gastos_aws_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "gastos_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos_series" ADD CONSTRAINT "gastos_series_contaContabilId_fkey" FOREIGN KEY ("contaContabilId") REFERENCES "contas_contabeis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
