"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

export function StatSparkline({ values, positive = true }: { values: number[]; positive?: boolean }) {
  const data = values.map((value, index) => ({ index, value }));
  if (!values.some((value) => value > 0)) return <div className="h-8" aria-hidden />;
  const color = positive ? "var(--color-primary)" : "var(--color-muted-foreground)";
  return <div className="h-9 w-full" aria-hidden><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.08} strokeWidth={1.75} dot={false} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div>;
}
