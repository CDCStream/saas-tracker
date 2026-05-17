"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MrrPoint } from "@/lib/types";

export function MrrChart({ data }: { data: MrrPoint[] }) {
  const formatted = data.map((d) => ({
    date: d.date.slice(5), // MM-DD
    mrr: d.mrrCents / 100,
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formatted}
          margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke="#232732" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            stroke="#9aa3b2"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="#9aa3b2"
            fontSize={11}
            tickLine={false}
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              background: "#14161b",
              border: "1px solid #232732",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number) => [`$${v.toFixed(2)}`, "MRR"]}
          />
          <Line
            type="monotone"
            dataKey="mrr"
            stroke="#1fb182"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
