-- Phase 9 (money precision): convert every money-valued column from Float
-- (float8, binary IEEE-754) to Decimal(12,2) (exact, base-10) so arithmetic
-- on prices, totals, refunds and wallet balances can't drift by a fraction of
-- a cent the way float8 addition/subtraction occasionally does.
--
-- `USING column::numeric(12,2)` reinterprets the existing float8 value as a
-- numeric with the same rounding float8 already implied — this migration
-- does not change any stored amount, only the column's storage/arithmetic
-- type going forward. Columns that are genuinely continuous (percentages,
-- coordinates, ratings) are untouched; see the schema comments next to each.

-- AlterTable: orders
ALTER TABLE "orders"
  ALTER COLUMN "subtotal" TYPE DECIMAL(12,2) USING "subtotal"::numeric(12,2),
  ALTER COLUMN "shipping" TYPE DECIMAL(12,2) USING "shipping"::numeric(12,2),
  ALTER COLUMN "discount" TYPE DECIMAL(12,2) USING "discount"::numeric(12,2),
  ALTER COLUMN "total" TYPE DECIMAL(12,2) USING "total"::numeric(12,2),
  ALTER COLUMN "tax_amount" TYPE DECIMAL(12,2) USING "tax_amount"::numeric(12,2),
  ALTER COLUMN "wallet_applied" TYPE DECIMAL(12,2) USING "wallet_applied"::numeric(12,2);

-- AlterTable: order_items
ALTER TABLE "order_items"
  ALTER COLUMN "price" TYPE DECIMAL(12,2) USING "price"::numeric(12,2),
  ALTER COLUMN "substitution_refund_amount" TYPE DECIMAL(12,2) USING "substitution_refund_amount"::numeric(12,2),
  ALTER COLUMN "tax_amount" TYPE DECIMAL(12,2) USING "tax_amount"::numeric(12,2);

-- AlterTable: refunds
ALTER TABLE "refunds"
  ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING "amount"::numeric(12,2),
  ALTER COLUMN "tax_amount" TYPE DECIMAL(12,2) USING "tax_amount"::numeric(12,2);

-- AlterTable: refund_lines
ALTER TABLE "refund_lines"
  ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING "amount"::numeric(12,2),
  ALTER COLUMN "tax_amount" TYPE DECIMAL(12,2) USING "tax_amount"::numeric(12,2);

-- AlterTable: return_items
ALTER TABLE "return_items"
  ALTER COLUMN "refund_amount" TYPE DECIMAL(12,2) USING "refund_amount"::numeric(12,2),
  ALTER COLUMN "tax_amount" TYPE DECIMAL(12,2) USING "tax_amount"::numeric(12,2);

-- AlterTable: products
ALTER TABLE "products"
  ALTER COLUMN "price" TYPE DECIMAL(12,2) USING "price"::numeric(12,2),
  ALTER COLUMN "original_price" TYPE DECIMAL(12,2) USING "original_price"::numeric(12,2);

-- AlterTable: wallet_accounts
ALTER TABLE "wallet_accounts"
  ALTER COLUMN "balance" TYPE DECIMAL(12,2) USING "balance"::numeric(12,2);

-- AlterTable: wallet_transactions
ALTER TABLE "wallet_transactions"
  ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING "amount"::numeric(12,2);
