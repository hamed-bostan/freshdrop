/**
 * A driver's delivery record for a reporting period, ranked by volume. `averageRating`
 * mirrors `Driver.rating` (see the Prisma model doc) — an admin-maintained figure, not
 * a computed average — so it's nullable until an admin sets one.
 */
export type DriverPerformance = {
  driverId: string;
  name: string;
  completedDeliveries: number;
  onTimeRate: number;
  averageRating: number | null;
};
