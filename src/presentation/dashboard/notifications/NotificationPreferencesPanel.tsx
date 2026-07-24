"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";
import type { AdminNotificationAction } from "@/src/domain/entities/AdminNotification";
import {
  Button,
  Icon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  Switch,
} from "@/src/presentation/design-system";
import { notificationPreferencesApi } from "./notification-preferences-api";
import type { NotificationPreference } from "./notification-preferences-response-schema";

/** Message key per category — the checkbox label, not the timeline sentence (see `dashActivity.action.*`). */
const CATEGORY_LABEL_KEYS = {
  "order.placed": "categoryOrderPlaced",
  "order.returnRequested": "categoryOrderReturnRequested",
  "review.submitted": "categoryReviewSubmitted",
  "product.stockDepleted": "categoryProductStockDepleted",
} as const satisfies Record<AdminNotificationAction, string>;

/**
 * Where the bell's inbound feed and the app's outbound `IEmailSender` meet
 * (Track B3): a small nested popover, opened from a gear icon in the bell's
 * own header, offering one switch per category the viewer could ever receive
 * (see `GetNotificationPreferences` — a role that can't receive a category
 * isn't offered a toggle for it). Each switch saves itself immediately; there
 * is no separate save action to forget.
 */
export function NotificationPreferencesPanel(): React.ReactElement {
  const t = useTranslations("dashboard.notifications");
  const [open, setOpen] = React.useState(false);
  const [preferences, setPreferences] = React.useState<NotificationPreference[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoading(true);
    notificationPreferencesApi
      .list()
      .then((list) => {
        if (!cancelled) setPreferences(list);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  function toggle(category: AdminNotificationAction, emailEnabled: boolean): void {
    if (!preferences) return;
    // Optimistic — the switch flips immediately; the request confirms it in
    // the background, the same standing every other toggle in this app has.
    const next = preferences.map((preference) =>
      preference.category === category ? { ...preference, emailEnabled } : preference,
    );
    setPreferences(next);
    void notificationPreferencesApi.set(
      next.filter((preference) => preference.emailEnabled).map((preference) => preference.category),
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" iconOnly size="sm" aria-label={t("preferencesTrigger")}>
          <Icon icon={Settings} size="xs" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72">
        <p className="px-2 py-1.5 text-label-l2 text-muted-foreground">{t("preferencesHeading")}</p>

        {isLoading && !preferences ? (
          <div className="flex items-center justify-center py-6">
            <Spinner size="sm" label={t("loading")} />
          </div>
        ) : null}

        {preferences?.map((preference) => (
          <label
            key={preference.category}
            className="flex items-center justify-between gap-3 rounded-input px-2 py-2"
          >
            <span className="text-body-b7 text-foreground">{t(CATEGORY_LABEL_KEYS[preference.category])}</span>
            <Switch
              checked={preference.emailEnabled}
              onCheckedChange={(checked) => toggle(preference.category, checked)}
            />
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}
