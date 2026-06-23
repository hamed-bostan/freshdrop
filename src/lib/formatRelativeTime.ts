/** Largest-fitting unit boundaries, smallest → largest. */
const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" });

/**
 * Formats an ISO timestamp as relative time ("2 weeks ago", "3 months ago").
 * `now` is injectable to keep the function pure and testable.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  let duration = (new Date(iso).getTime() - now.getTime()) / 1000;

  for (const { amount, unit } of DIVISIONS) {
    if (Math.abs(duration) < amount) {
      return rtf.format(Math.round(duration), unit);
    }
    duration /= amount;
  }

  return rtf.format(Math.round(duration), "years");
}
