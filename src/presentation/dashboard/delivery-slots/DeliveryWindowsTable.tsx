import { CloudSun, MoonStar, Sun, Sunrise, type LucideIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { formatWindowRange, type DeliveryWindow } from "@/src/domain/entities/DeliveryWindow";
import { formatNumber } from "@/src/lib/formatNumber";
import {
  Badge,
  DataTable,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/presentation/design-system";

import { DeliveryWindowRowActions } from "./DeliveryWindowRowActions";

type DeliveryWindowsTableProps = {
  windows: DeliveryWindow[];
};

/** Give each part of the day a recognizable cue without depending on its label or locale. */
function getWindowIcon(startMinutes: number): LucideIcon {
  if (startMinutes < 10 * 60) return Sunrise;
  if (startMinutes < 15 * 60) return Sun;
  if (startMinutes < 18 * 60) return CloudSun;
  return MoonStar;
}

/**
 * Admin list of delivery windows: when each runs, how many orders it can take per
 * day, and where it sits in the checkout picker.
 *
 * Unsorted and unpaged — the rows arrive in `position` order, which is the thing
 * being edited. A sortable header here would let you rearrange the view of a list
 * whose whole point is the arrangement you saved.
 */
export async function DeliveryWindowsTable({ windows }: DeliveryWindowsTableProps) {
  const t = await getTranslations("dashDeliverySlots");
  const locale = (await getLocale());
  const maxCapacity = Math.max(...windows.map((window) => window.capacity), 1);

  return (
    <DataTable
      minWidthClassName="min-w-[48rem]"
      toolbar={
        <div className="flex items-center gap-2">
          <h2 className="text-body-b4 text-foreground">{t("tableTitle")}</h2>
          <Badge variant="neutral">{t("count", { count: windows.length })}</Badge>
        </div>
      }
    >
      <Table>
        <TableHeader>
          <tr>
            <TableHead>{t("colLabel")}</TableHead>
            <TableHead>{t("colTime")}</TableHead>
            <TableHead className="text-end">{t("colCapacity")}</TableHead>
            <TableHead className="text-end">{t("colPosition")}</TableHead>
            <TableHead className="w-14 text-end">
              <span className="sr-only">{t("colActions")}</span>
            </TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {windows.map((window) => (
            <TableRow key={window.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-card-md bg-accent text-primary">
                    <Icon icon={getWindowIcon(window.startMinutes)} size="sm" />
                  </span>
                  <span className="text-body-b7 text-foreground">{window.label}</span>
                </div>
              </TableCell>
              <TableCell className="text-body-b6 text-muted-foreground" dir="ltr">
                {formatWindowRange(window.startMinutes, window.endMinutes)}
              </TableCell>
              <TableCell className="text-end">
                <span className="text-body-b6 text-muted-foreground">
                  {t("capacityValue", { count: window.capacity })}
                </span>
                <div
                  role="progressbar"
                  aria-label={t("capacityBarAria", { label: window.label, count: window.capacity })}
                  aria-valuemin={0}
                  aria-valuemax={maxCapacity}
                  aria-valuenow={window.capacity}
                  className="ms-auto mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(window.capacity / maxCapacity) * 100}%` }}
                  />
                </div>
              </TableCell>
              <TableCell className="text-end text-body-b6 text-muted-foreground">
                {formatNumber(window.position, locale)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <DeliveryWindowRowActions id={window.id} label={window.label} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  );
}
