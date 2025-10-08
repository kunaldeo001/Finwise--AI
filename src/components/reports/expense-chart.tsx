
'use client';

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Cell,
  CartesianGrid,
} from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

type ExpenseChartProps = {
  type: 'bar' | 'pie' | 'line';
  data: any[];
};

const chartConfig: ChartConfig = {
  expenses: {
    label: 'Expenses',
  },
  value: {
    label: 'Value',
  },
};

monthlyExpenses.forEach((item) => {
    chartConfig[item.name] = {
        label: item.name,
        color: item.fill,
    }
});

function monthlyExpenses(data: any[]): any[] {
    throw new Error('Function not implemented.');
}


export function ExpenseChart({ type, data }: ExpenseChartProps) {
  if (type === 'bar') {
    return (
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              width={80}
            />
            <XAxis dataKey="value" type="number" hide />
            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={5}>
                {data.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  }

  if (type === 'pie') {
    return (
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <ResponsiveContainer>
          <PieChart>
            <Tooltip content={<ChartTooltipContent />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} label>
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
             <Legend
              content={({ payload }) => {
                return (
                  <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4">
                    {payload?.map((entry, index) => (
                      <li key={`item-${index}`} className="flex items-center gap-2 text-sm">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.value}
                      </li>
                    ))}
                  </ul>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  }

  if (type === 'line') {
    return (
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `$${value}`} tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
            <Tooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="expenses" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  }

  return null;
}
