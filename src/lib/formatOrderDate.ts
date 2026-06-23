// Fixed UTC formatters → deterministic output (identical on server and client,
// so server-rendered order dates don't trigger a hydration mismatch).
const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" });
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" });
const dayFormatter = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" });
const yearFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "UTC" });
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

/** "03:22 PM" */
export function formatOrderTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

/** "Monday - October 9,2023" */
export function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  return `${weekdayFormatter.format(date)} - ${monthFormatter.format(date)} ${dayFormatter.format(date)},${yearFormatter.format(date)}`;
}
