/**
 * Shared marker/dot color scales for the delivery-zone coverage card (map and
 * list views alike). Both scales are derived from real per-zone figures — never
 * fabricated — bucketed into three qualitative tiers for a legible legend.
 */

export function onTimeColor(rate: number): string {
  if (rate >= 0.9) return "var(--color-primary)";
  if (rate >= 0.75) return "var(--color-warning-foreground)";
  return "var(--color-destructive)";
}

/** `share` is a zone's order count relative to the busiest zone in the period (0–1). */
export function demandColor(share: number): string {
  if (share >= 0.66) return "var(--color-primary)";
  if (share >= 0.33) return "var(--color-warning-foreground)";
  return "var(--color-info-foreground)";
}
