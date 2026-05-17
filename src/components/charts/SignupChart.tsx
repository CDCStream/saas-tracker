"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SignupChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const formatted = data.map((d) => ({
    date: d.date.slice(5),
    signups: d.count,
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
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
          <YAxis stroke="#9aa3b2" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "#14161b",
              border: "1px solid #232732",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="signups" fill="#6b8afd" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
