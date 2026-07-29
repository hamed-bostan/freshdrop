"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

export function StatSparkline({ values, positive = true }: { values: number[]; positive?: boolean }) {
  const data = values.map((value, index) => ({ index, value }));
  if (!values.some((value) => value > 0)) return <div className="h-8" aria-hidden />;
  return <div className="h-8 w-full" aria-hidden><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><Line type="monotone" dataKey="value" stroke={positive ? "var(--color-primary)" : "var(--color-muted-foreground)"} strokeWidth={2} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>;
}
