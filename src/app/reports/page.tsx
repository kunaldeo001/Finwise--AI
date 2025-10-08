
import { PageHeader } from "@/components/page-header";
import { ExpenseChart } from "@/components/reports/expense-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { monthlyExpenses, yearlyExpenses } from "@/lib/placeholder-data";
import { BarChart, PieChart } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Expense Reports"
        description="Comprehensive monthly and yearly expense reports."
      />
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly">
          <div className="grid grid-cols-1 gap-8 pt-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="size-5" />
                  Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseChart type="bar" data={monthlyExpenses} dataKey="value" categoryKey="name" />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="size-5" />
                  Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseChart type="pie" data={monthlyExpenses} dataKey="value" categoryKey="name" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="yearly">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="size-5" />
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
