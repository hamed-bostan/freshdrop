-- AlterTable
ALTER TABLE "wallet_transactions" ADD COLUMN "reason" TEXT,
ADD COLUMN "reason_item" TEXT;

-- Backfill: rows written before the columns existed carry only the English
-- description snapshot. Derive the machine reason from the exact strings the
-- writers used (the WalletTransactionDescription vocabulary); anything
-- unrecognized stays NULL and keeps rendering from its description.
UPDATE "wallet_transactions" SET "reason" = 'addedToWallet'
WHERE "reason" IS NULL AND "description" = 'Added to Wallet';

UPDATE "wallet_transactions" SET "reason" = 'refundCancelledOrder'
WHERE "reason" IS NULL AND "description" = 'Refund for cancelled order';

UPDATE "wallet_transactions" SET "reason" = 'refundCancelledOrderDelivery'
WHERE "reason" IS NULL AND "description" = 'Refund for cancelled order delivery';

UPDATE "wallet_transactions" SET "reason" = 'refundReturnedOrder'
WHERE "reason" IS NULL AND "description" = 'Refund for returned order';

UPDATE "wallet_transactions"
SET "reason" = 'refundOutOfStock',
    "reason_item" = substring("description" from char_length('Refund for out-of-stock ') + 1)
WHERE "reason" IS NULL AND "description" LIKE 'Refund for out-of-stock %';

UPDATE "wallet_transactions"
SET "reason" = 'substitutionSaving',
    "reason_item" = substring("description" from char_length('Substitution saving for ') + 1)
WHERE "reason" IS NULL AND "description" LIKE 'Substitution saving for %';
