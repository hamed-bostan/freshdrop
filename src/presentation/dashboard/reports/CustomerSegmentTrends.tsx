import { ArrowRight, ExternalLink, UsersRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber } from "@/src/lib/formatNumber";
import { Icon } from "@/src/presentation/design-system";
import type { CustomerSegmentId } from "@/src/domain/entities/CustomerSegmentsReport";
import type { CustomerSegmentsWire } from "./customer-segments-response-schema";

const MAX_CARDS = 4;
/** Segments a move into counts as "higher-value" for the summary line — real recovery/growth, not lateral movement. */
const HIGHER_VALUE_TARGETS = new Set(["high_value_loyal", "reactivated"]);

type Move = CustomerSegmentsWire["transitions"][number] & { fromSegment: CustomerSegmentId };

function isMove(row: CustomerSegmentsWire["transitions"][number]): row is Move {
  return row.fromSegment !== null && row.fromSegment !== row.toSegment && row.customers > 0;
}

export async function CustomerSegmentTrends({ transitions, locale }: { transitions: CustomerSegmentsWire["transitions"]; locale: Locale }) {
  const t = await getTranslations("dashCustomerSegments");
  // Real movement only: same-segment "transitions" (stayed put) and customers with no
  // prior snapshot (not yet tracked) aren't a move to show.
  const moves = transitions.filter(isMove);
  const cards = [...moves].sort((a, b) => b.customers - a.customers).slice(0, MAX_CARDS);
  const higherValueMoved = moves.filter((row) => HIGHER_VALUE_TARGETS.has(row.toSegment)).reduce((sum, row) => sum + row.customers, 0);

  return <section className="rounded-card-lg border border-border bg-background p-4">
    <div className="flex items-center gap-3"><h2 className="text-body-b5">{t("segmentMovement")}</h2><span className="text-body-b10 text-muted-foreground">{t("independentTransitions")}</span></div>
    {cards.length === 0
      ? <p className="mt-3 rounded-card-lg border border-dashed border-border p-4 text-body-b10 text-muted-foreground">{t("movementCollectingData")}</p>
      : <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map((move) => <article key={`${move.fromSegment}-${move.toSegment}`} className="rounded-card-lg border border-border p-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-accent text-primary"><Icon icon={ArrowRight} size="sm" className="rtl:rotate-180" /></span>
          <div>
            <p className="text-body-b10 text-muted-foreground">{t(`segment.${move.fromSegment}`)} <Icon icon={ArrowRight} size="xs" className="inline align-middle rtl:rotate-180" /> {t(`segment.${move.toSegment}`)}</p>
            <p className="text-heading-h3">{formatNumber(move.customers, locale)} <span className="text-body-b10 font-normal">{t("customers")}</span></p>
          </div>
        </div>
      </article>)}</div>}
    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
      <p className="flex items-center gap-2 text-body-b10"><span className="flex size-7 items-center justify-center rounded-full bg-accent text-primary"><Icon icon={UsersRound} size="xs" /></span>{t("higherValueMoved", { count: higherValueMoved })}</p>
      <Link href="/dashboard/customers" className="flex items-center gap-2 text-body-b8 text-primary">{t("viewMovementDetails")}<Icon icon={ExternalLink} size="xs" /></Link>
    </div>
  </section>;
}
