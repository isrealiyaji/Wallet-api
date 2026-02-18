-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'NGN';

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "reference" TEXT NOT NULL,
    "balance" DECIMAL(19,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ledger_transactionId_idx" ON "Ledger"("transactionId");

-- CreateIndex
CREATE INDEX "Ledger_accountId_idx" ON "Ledger"("accountId");

-- CreateIndex
CREATE INDEX "Ledger_reference_idx" ON "Ledger"("reference");

-- CreateIndex
CREATE INDEX "Ledger_createdAt_idx" ON "Ledger"("createdAt");
