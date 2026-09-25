'use client';

import { PageHeader } from '@/components/page-header';
import { MonthlyAIReport } from '@/components/reports/monthly-ai-report';
import { ExpenseChart } from '@/components/reports/expense-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { monthlyExpenses, yearlyExpenses } from '@/lib/placeholder-data';
import { BarChart, PieChart, Sparkles, LineChart } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Financial Reports & AI Executive Audits"
        description="Comprehensive monthly and yearly performance statements, visual breakdown charts, and archived reports."
      />

      <Tabs defaultValue="ai-report" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="ai-report" className="gap-1.5 text-xs">
            <Sparkles className="size-3.5 text-accent" />
            AI Monthly Audit
          </TabsTrigger>
          <TabsTrigger value="category-charts" className="gap-1.5 text-xs">
            <PieChart className="size-3.5" />
            Category Chart
          </TabsTrigger>
          <TabsTrigger value="yearly-trend" className="gap-1.5 text-xs">
            <LineChart className="size-3.5" />
            Yearly Trend
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: AI Monthly Audit */}
        <TabsContent value="ai-report" className="pt-4">
          <MonthlyAIReport />
        </TabsContent>

        {/* Tab 2: Category Breakdown */}
        <TabsContent value="category-charts" className="pt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3 shadow-sm border border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <BarChart className="size-4 text-accent" />
                  Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseChart type="bar" data={monthlyExpenses} dataKey="value" categoryKey="name" />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-sm border border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <PieChart className="size-4 text-accent" />
                  Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseChart type="pie" data={monthlyExpenses} dataKey="value" categoryKey="name" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Yearly Trend */}
        <TabsContent value="yearly-trend" className="pt-4">
          <Card className="shadow-sm border border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <BarChart className="size-4 text-accent" />
                Yearly Expense Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseChart type="line" data={yearlyExpenses} dataKey="expenses" categoryKey="month" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
