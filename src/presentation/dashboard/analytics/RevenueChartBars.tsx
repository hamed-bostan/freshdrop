"use client";

import { Bar, BarChart, Cell, Tooltip, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, chartColor } from "@/src/presentation/design-system";

export type RevenueChartBarPoint = {
  bucket: string;
  /** Pre-formatted axis tick — locale/granularity already resolved server-side. */
  label: string;
  revenue: number;
  /** The whole hover string ("Jul 3 — $420, 12 orders"), already translated server-side. */
  tooltipLabel: string;
};

type RevenueChartBarsProps = {
  data: RevenueChartBarPoint[];
  dir: "ltr" | "rtl";
};

/** Floor point size for a non-zero bar, in pixels — so a small day is visible, not invisible. */
const MIN_POINT_SIZE = 2;

/**
 * The bars themselves — split out from `RevenueChart` because Recharts measures
 * the DOM to render, which only Client Components can do. Everything that needs
 * translation or locale formatting is resolved by the server parent and handed
 * down as plain strings/numbers, so this component has no i18n of its own.
 */
export function RevenueChartBars({ data, dir }: RevenueChartBarsProps) {
  return (
    <ChartContainer height={176} dir={dir}>
      <BarChart data={data} barCategoryGap="10%" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          reversed={dir === "rtl"}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
        />
        <Tooltip
          cursor={{ fill: "var(--color-muted)" }}
          content={(props) => (
            <ChartTooltip
              {...props}
              renderContent={() => <p className="text-foreground">{props.payload?.[0]?.payload.tooltipLabel}</p>}
            />
          )}
        />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]} minPointSize={MIN_POINT_SIZE} isAnimationActive={false}>
          {data.map((point) => (
            <Cell key={point.bucket} fill={point.revenue > 0 ? chartColor(0) : "var(--color-border)"} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
