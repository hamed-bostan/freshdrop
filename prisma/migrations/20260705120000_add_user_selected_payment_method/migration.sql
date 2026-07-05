-- The payment method a user last selected for checkout. A single per-user
-- preference: the id of a catalog option (Cash, Wallet, PayPal, …) or one of the
-- user's saved cards. Nullable — null until the user picks one; a stale id (e.g. a
-- card later removed) is tolerated and falls back to the first option at read time.
-- Not a foreign key (the id may reference either the payment_methods or wallet_cards
-- table), matching the schema's loose coupling.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "selected_payment_method_id" TEXT;
