-- Editable copy for order-lifecycle push notifications and admin-alert
-- emails, plus a stored default for the ad hoc customer-message form. Seeded
-- from the exact hardcoded strings in messages.ts / NotifyAdmins.ts
-- (converted to {{VAR}} form), so shipping this table changes no send until
-- an admin edits a row.

-- CreateTable
CREATE TABLE "notification_templates" (
    "kind" TEXT NOT NULL,
    "title" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("kind")
);

-- Seed: 7 lifecycle kinds (title + body). order_confirmed's {{WINDOW}} is
-- the whole " for delivery {window}" clause (or "" with no window), not the
-- raw window value — see NotificationTemplate's doc comment.
INSERT INTO "notification_templates" ("kind", "title", "body") VALUES
('order_confirmed', 'Order confirmed', 'Your FreshDrop order #{{ORDER}} is confirmed and being prepared{{WINDOW}}.'),
('order_out_for_delivery', 'Out for delivery', 'Your FreshDrop order #{{ORDER}} is out for delivery and on its way to you.'),
('order_delivered', 'Order delivered', 'Your FreshDrop order #{{ORDER}} has been delivered. Enjoy!'),
('return_approved', 'Return approved', 'Your return for FreshDrop order #{{ORDER}} was approved and refunded to your wallet.'),
('item_substituted', 'Item substituted', '{{ITEM}} was out of stock in your FreshDrop order #{{ORDER}}, so we swapped in {{REPLACEMENT}} as you approved. Any price difference was refunded to your wallet.'),
('item_refunded', 'Item refunded', '{{ITEM}} was out of stock in your FreshDrop order #{{ORDER}}, so we removed it and refunded it to your wallet.'),
('order_cancelled_out_of_stock', 'Order cancelled and refunded', 'Every item in your FreshDrop order #{{ORDER}} was out of stock, so we cancelled it and refunded it in full — including the delivery fee — to your wallet.');

-- Seed: 4 admin-alert kinds (subject + body).
INSERT INTO "notification_templates" ("kind", "subject", "body") VALUES
('order.placed', 'New order placed', 'A new order was placed: {{LABEL}}.

Open it from the dashboard''s Orders list.'),
('order.returnRequested', 'Return requested', 'A customer requested a return on order {{LABEL}}.

Approve or reject it from the dashboard''s Orders list.'),
('review.submitted', 'New review awaiting moderation', 'A new review was submitted and is awaiting moderation.

Review it from the dashboard''s Reviews queue.'),
('product.stockDepleted', 'Product out of stock', '{{LABEL}} just ran out of stock.

Restock it from the dashboard''s Products list.');

-- Seed: the ad hoc customer-message form's first-time default (subject +
-- empty body — the feature's stated first-time value, see phase 4).
INSERT INTO "notification_templates" ("kind", "subject", "body") VALUES
('message_default', 'Update on your order', '');
