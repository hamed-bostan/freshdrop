"use client";

import { useEffect } from "react";

import { useRouter } from "@/src/i18n/navigation";

/** How often to re-check while a job is still generating. */
const POLL_INTERVAL_MS = 4000;

type ExportJobsPollerProps = {
  /** Whether any row on this page is still `processing`. */
  active: boolean;
};

/**
 * Keeps the Recent exports table honest while a job is generating, without a
 * client-side data cache: it just re-runs the server render on an interval,
 * same as clicking refresh. Renders nothing — mounted only while `active`, so
 * a page with no processing job never starts a timer at all.
 */
export function ExportJobsPoller({ active }: ExportJobsPollerProps) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [active, router]);

  return null;
}
