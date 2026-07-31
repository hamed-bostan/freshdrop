"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

export function StatSparkline({ values, positive = true, color, heightClassName = "h-9" }: { values: number[]; positive?: boolean; color?: string; heightClassName?: string }) {
  const data = values.map((value, index) => ({ index, value }));
  if (!values.some((value) => value > 0)) return <div className={heightClassName} aria-hidden />;
  const stroke = color ?? (positive ? "var(--color-primary)" : "var(--color-muted-foreground)");
  return <div className={`${heightClassName} w-full`} aria-hidden><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><Area type="monotone" dataKey="value" stroke={stroke} fill={stroke} fillOpacity={0.08} strokeWidth={1.75} dot={false} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div>;
}
