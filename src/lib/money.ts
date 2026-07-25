/**
 * Round a money value to 2 decimal places (cents). The one place this
 * app should ever call `Math.round` on a price — every write boundary that
 * derives a monetary amount (tax, refunds) routes through here so rounding
 * behavior can't drift between call sites.
 */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
