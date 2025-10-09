
import { PageHeader } from "@/components/page-header";
import { ExpenseChart } from "@/components/reports/expense-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recentExpenses } from "@/lib/placeholder-data";
import { BarChart } from "lucide-react";
import { ScanBill } from "@/components/expenses/scan-bill";

export default function ExpensesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Expenses"
        description="Track and analyze your spending."
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ScanBill />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="size-5" />
              Recent Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseChart type="bar" data={recentExpenses} dataKey="value" categoryKey="name" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
