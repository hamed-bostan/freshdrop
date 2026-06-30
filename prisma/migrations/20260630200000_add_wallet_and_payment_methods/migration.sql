-- CreateTable
CREATE TABLE "wallet_accounts" (
    "user_id" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_accounts_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallet_transactions_user_id_idx" ON "wallet_transactions"("user_id");

-- CreateTable
CREATE TABLE "wallet_cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "holder_name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "expiry" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallet_cards_user_id_idx" ON "wallet_cards"("user_id");

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- Seed the payment-option catalog the storefront offers, carrying over the ids the
-- in-memory mock used so the presentation layer's icon mapping keeps matching as
-- the feature moves to PostgreSQL. `position` fixes the display order.
INSERT INTO "payment_methods" ("id", "label", "group", "position", "updated_at") VALUES
  ('cash-on-delivery', 'Cash On Delivery', 'cash',    1, CURRENT_TIMESTAMP),
  ('wallet',           'Wallet',           'wallet',  2, CURRENT_TIMESTAMP),
  ('paypal',           'PayPal',           'options', 3, CURRENT_TIMESTAMP),
  ('apple-pay',        'Apple Pay',        'options', 4, CURRENT_TIMESTAMP),
  ('google-pay',       'Google Pay',       'options', 5, CURRENT_TIMESTAMP);

-- Seed the demo wallet the in-memory mock shipped, owned by the sentinel `demo`
-- user (the same sentinel the order/cart seeds use) so it stays invisible to real
-- users — they start with a $0 balance, no cards and no transactions, and fill the
-- wallet via "Add Money" / "Add Card".
INSERT INTO "wallet_accounts" ("user_id", "balance", "updated_at") VALUES
  ('demo', 560.32, CURRENT_TIMESTAMP);

INSERT INTO "wallet_cards" ("id", "user_id", "brand", "holder_name", "number", "expiry", "updated_at") VALUES
  ('demo-card-1', 'demo', 'Visa', 'Ben solo', '5896 5896 4581 4581', '05/25', CURRENT_TIMESTAMP),
  ('demo-card-2', 'demo', 'Visa', 'Ben solo', '5896 5896 4581 4581', '05/25', CURRENT_TIMESTAMP);

INSERT INTO "wallet_transactions" ("id", "user_id", "description", "amount", "type", "date") VALUES
  ('demo-txn-1', 'demo', 'Apples',          12.4,  'debit',  '2025-07-17T21:00:00Z'),
  ('demo-txn-2', 'demo', 'Added to Wallet', 100,   'credit', '2025-06-25T01:03:00Z'),
  ('demo-txn-3', 'demo', 'Red Meat',        24.9,  'debit',  '2025-06-03T16:50:00Z'),
  ('demo-txn-4', 'demo', 'Added to Wallet', 50,    'credit', '2025-06-10T10:10:00Z'),
  ('demo-txn-5', 'demo', 'salmon fish',     18.75, 'debit',  '2025-06-25T12:00:00Z');
