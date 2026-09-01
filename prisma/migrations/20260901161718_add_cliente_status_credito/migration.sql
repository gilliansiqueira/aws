-- CreateEnum
CREATE TYPE "StatusCredito" AS ENUM ('ATIVO', 'BLOQUEADO', 'PROTESTADO');

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "statusCredito" "StatusCredito" NOT NULL DEFAULT 'ATIVO';
