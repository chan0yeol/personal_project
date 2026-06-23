'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Props {
  data: Record<string, number | string>[];
  keywords: string[];
  title?: string;
}

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e'];

export default function TrendLineChart({ data, keywords, title }: Props) {
  const formattedData = data.map((row) => ({
    ...row,
    dateLabel: format(new Date(row.date as string), 'M/d', { locale: ko }),
  }));

  return (
    <div className="card">
      {title && <h3 className="text-sm font-semibold text-gray-300 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#e5e7eb', fontSize: 12 }}
            itemStyle={{ fontSize: 12 }}
            formatter={(value: number) => [`${value.toFixed(1)}`, '']}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
          />
          {keywords.map((kw, i) => (
            <Line
              key={kw}
              type="monotone"
              dataKey={kw}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
