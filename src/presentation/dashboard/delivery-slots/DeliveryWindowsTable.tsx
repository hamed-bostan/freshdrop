import { Pencil } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { formatWindowRange, type DeliveryWindow } from "@/src/domain/entities/DeliveryWindow";
import { Link } from "@/src/i18n/navigation";
import { formatNumber } from "@/src/lib/formatNumber";
import {
  Button,
  DataTable,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/presentation/design-system";

import { DeleteDeliveryWindowButton } from "./DeleteDeliveryWindowButton";

type DeliveryWindowsTableProps = {
  windows: DeliveryWindow[];
};

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

  return (
    <DataTable>
      <Table>
        <TableHeader>
          <tr>
            <TableHead>{t("colLabel")}</TableHead>
            <TableHead>{t("colTime")}</TableHead>
            <TableHead className="text-end">{t("colCapacity")}</TableHead>
            <TableHead className="text-end">{t("colPosition")}</TableHead>
            <TableHead className="text-end">{t("colActions")}</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {windows.map((window) => (
            <TableRow key={window.id}>
              <TableCell>
                <span className="block text-body-b7 text-foreground">{window.label}</span>
                {/* The slug is what bookings and orders reference — worth showing,
                    since it's the one field the edit form can't change. */}
                <span className="block text-body-b10 text-muted-foreground" dir="ltr">
                  {window.id}
                </span>
              </TableCell>
              <TableCell className="text-body-b6 text-muted-foreground" dir="ltr">
                {formatWindowRange(window.startMinutes, window.endMinutes)}
              </TableCell>
              <TableCell className="text-end text-body-b6 text-muted-foreground">
                {t("capacityValue", { count: window.capacity })}
              </TableCell>
              <TableCell className="text-end text-body-b6 text-muted-foreground">
                {formatNumber(window.position, locale)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/delivery-slots/${window.id}/edit`}>
                      <Icon icon={Pencil} size="sm" className="me-1.5" />
                      {t("edit")}
                    </Link>
                  </Button>
                  <DeleteDeliveryWindowButton id={window.id} label={window.label} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  );
}
