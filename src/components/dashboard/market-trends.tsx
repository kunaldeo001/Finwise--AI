
'use client';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { marketTrendsData } from '@/lib/placeholder-data';

const chartConfig = {
  SP500: {
    label: "S&P 500",
    color: "hsl(var(--primary))",
  },
  Nasdaq: {
    label: "Nasdaq",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

export function MarketTrends() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Trends</CardTitle>
        <CardDescription>S&P 500 vs. Nasdaq Composite</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={marketTrendsData}
                margin={{
                  top: 5,
                  right: 10,
                  left: -20,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value/1000}k`}/>
                <Tooltip
                  content={<ChartTooltipContent indicator="dot" />}
                  cursor={{
                      stroke: 'hsl(var(--accent))',
                      strokeWidth: 2,
                      strokeDasharray: '3 3'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="SP500"
                  stroke="var(--color-SP500)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Nasdaq"
                  stroke="var(--color-Nasdaq)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
