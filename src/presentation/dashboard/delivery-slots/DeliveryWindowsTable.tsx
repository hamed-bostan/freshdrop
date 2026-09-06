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
      className="rounded-[1.375rem] shadow-none dashboard-phone:rounded-card-lg dashboard-landscape:rounded-card-lg xl:rounded-card-lg"
      toolbar={
        <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 dashboard-phone:min-h-8">
          <h2 className="text-body-b1 text-foreground dashboard-phone:text-body-b4 dashboard-landscape:text-body-b4 xl:text-body-b4">
            {t("tableTitle")}
          </h2>
          <Badge variant="neutral">{t("count", { count: windows.length })}</Badge>
        </div>
      }
    >
      <ul className="divide-y divide-border sm:hidden">
        {windows.map((window) => (
          <li
            key={window.id}
            className="grid grid-cols-[2.5rem_minmax(0,1fr)_2rem] items-center gap-x-3 bg-background px-4 py-5"
          >
            <span className="flex size-10 items-center justify-center rounded-card-md bg-accent text-primary">
              <Icon icon={getWindowIcon(window.startMinutes)} size="md" />
            </span>

            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-5 text-foreground">{window.label}</span>
              <span className="mt-1 block text-sm leading-5 text-foreground/80" dir="ltr">
                {formatWindowRange(window.startMinutes, window.endMinutes)}
              </span>
              <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">
                {t("capacityValue", { count: window.capacity })}
              </span>
            </div>

            <div className="flex justify-end">
              <DeliveryWindowRowActions id={window.id} label={window.label} />
            </div>
          </li>
        ))}
      </ul>

      <Table className="hidden table-fixed sm:table">
        <colgroup>
          <col className="w-[32%]" />
          <col className="w-[29%]" />
          <col className="w-[27%]" />
          <col className="hidden w-[7%] dashboard-landscape:table-column xl:table-column" />
          <col className="w-[12%] dashboard-landscape:w-[5%] xl:w-[5%]" />
        </colgroup>
        <TableHeader className="uppercase tracking-[0.04em]">
          <tr>
            <TableHead>{t("colLabel")}</TableHead>
            <TableHead>{t("colTime")}</TableHead>
            <TableHead className="text-end">{t("colCapacity")}</TableHead>
            <TableHead className="hidden text-end dashboard-landscape:table-cell xl:table-cell">
              {t("colPosition")}
            </TableHead>
            <TableHead className="w-14 text-end">
              <span className="sr-only">{t("colActions")}</span>
            </TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {windows.map((window) => (
            <TableRow key={window.id} className="h-24 dashboard-landscape:h-[5.75rem] xl:h-auto">
              <TableCell className="py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-[3.25rem] shrink-0 items-center justify-center rounded-card-lg bg-accent text-primary xl:size-10 xl:rounded-card-md">
                    <Icon icon={getWindowIcon(window.startMinutes)} size="md" className="xl:size-4" />
                  </span>
                  <span className="truncate text-body-b4 text-foreground dashboard-landscape:text-body-b7 xl:text-body-b7">
                    {window.label}
                  </span>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-body-b6 text-muted-foreground" dir="ltr">
                {formatWindowRange(window.startMinutes, window.endMinutes)}
              </TableCell>
              <TableCell className="text-end">
                <span className="whitespace-nowrap text-body-b6 text-muted-foreground">
                  {t("capacityValue", { count: window.capacity })}
                </span>
                <div
                  role="progressbar"
                  aria-label={t("capacityBarAria", { label: window.label, count: window.capacity })}
                  aria-valuemin={0}
                  aria-valuemax={maxCapacity}
                  aria-valuenow={window.capacity}
                  className="ms-auto mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-muted dashboard-landscape:w-32 xl:w-32"
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(window.capacity / maxCapacity) * 100}%` }}
                  />
                </div>
              </TableCell>
              <TableCell className="hidden text-end text-body-b6 text-muted-foreground dashboard-landscape:table-cell xl:table-cell">
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
