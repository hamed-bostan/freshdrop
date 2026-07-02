/**
 * Demo aid: seed the delivery-slot booking ledger so the checkout picker actually
 * shows every availability state (Full / "Only N left" / open) instead of a fresh,
 * all-open board. Run it, then open checkout.
 *
 *   npm run db:seed:slots
 *
 * Dates are computed relative to *today* (UTC) so the seeded slots always fall
 * inside the live booking horizon — a hardcoded-date seed in a migration would go
 * stale the next day. Non-destructive: it upserts only the specific (date, window)
 * cells below, leaving every other slot untouched. Idempotent — re-running just
 * re-asserts these exact counts. Intended for dev/demo databases.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Which (day-from-today, window) cells to stage, and how many units to leave — so
 * the picker renders a mix: 0 → "Full", 1…3 (≤ LOW_SLOT_THRESHOLD) → "Only N left",
 * and every unlisted window stays open (no badge). `dayOffset` 1 = tomorrow.
 */
const DEMO_SLOTS: { dayOffset: number; windowId: string; remaining: number }[] = [
  { dayOffset: 1, windowId: "morning", remaining: 0 }, // Full
  { dayOffset: 1, windowId: "midday", remaining: 2 }, // Only 2 left
  { dayOffset: 1, windowId: "evening", remaining: 1 }, // Only 1 left
  { dayOffset: 2, windowId: "afternoon", remaining: 0 }, // Full
  { dayOffset: 2, windowId: "morning", remaining: 3 }, // Only 3 left
];

/** `YYYY-MM-DD` for a whole-day offset from today, in UTC (matches GetDeliverySlots). */
function dateFromToday(dayOffset: number): string {
  const now = new Date();
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(startOfToday + dayOffset * DAY_MS).toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  const windows = await prisma.deliveryWindow.findMany();
  const capacityById = new Map(windows.map((w) => [w.id, w.capacity]));

  for (const { dayOffset, windowId, remaining } of DEMO_SLOTS) {
    const capacity = capacityById.get(windowId);
    if (capacity === undefined) {
      console.warn(`  ! unknown window "${windowId}" — skipped (did the seed migration run?)`);
      continue;
    }

    const date = dateFromToday(dayOffset);
    const booked = Math.max(0, capacity - remaining);

    await prisma.deliverySlotBooking.upsert({
      where: { date_windowId: { date, windowId } },
      create: { date, windowId, booked },
      update: { booked },
    });

    const state = remaining <= 0 ? "Full" : `Only ${remaining} left`;
    console.log(`  ${date}  ${windowId.padEnd(9)} booked ${booked}/${capacity}  → ${state}`);
  }

  console.log("\nDone. Open checkout and browse the day pills to see the states.");
}

main()
  .catch((error) => {
    console.error("Failed to seed delivery slots:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
