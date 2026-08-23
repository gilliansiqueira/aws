/*
  Warnings:

  - You are about to drop the column `categoria` on the `gastos_aws` table. All the data in the column will be lost.
  - Added the required column `contaContabilId` to the `gastos_aws` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoConta" AS ENUM ('RECEITA', 'DESPESA');

-- DropIndex
DROP INDEX "gastos_aws_categoria_idx";

-- AlterTable
ALTER TABLE "comissoes" ADD COLUMN     "contaContabilId" TEXT;

-- AlterTable
ALTER TABLE "gastos_aws" DROP COLUMN "categoria",
ADD COLUMN     "contaContabilId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "grupos_conta" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoConta" NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "grupos_conta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_contabeis" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "contas_contabeis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contas_contabeis_grupoId_idx" ON "contas_contabeis"("grupoId");

-- CreateIndex
CREATE INDEX "gastos_aws_contaContabilId_idx" ON "gastos_aws"("contaContabilId");

-- AddForeignKey
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_contaContabilId_fkey" FOREIGN KEY ("contaContabilId") REFERENCES "contas_contabeis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos_aws" ADD CONSTRAINT "gastos_aws_contaContabilId_fkey" FOREIGN KEY ("contaContabilId") REFERENCES "contas_contabeis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_contabeis" ADD CONSTRAINT "contas_contabeis_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos_conta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
