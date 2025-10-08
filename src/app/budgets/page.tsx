
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { budgets } from "@/lib/placeholder-data";
import { cn } from "@/lib/utils";
import { PlusCircle, ShoppingBag, Utensils, Bus, Film } from "lucide-react";

const categoryIcons = {
  food: <Utensils className="h-6 w-6" />,
  transport: <Bus className="h-6 w-6" />,
  fun: <Film className="h-6 w-6" />,
  bills: <ShoppingBag className="h-6 w-6" />,
  shopping: <ShoppingBag className="h-6 w-6" />,
};

export default function BudgetsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Budgets" description="Create and manage your monthly budgets.">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Budget
        </Button>
      </PageHeader>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const progress = (budget.spent / budget.limit) * 100;
          const remaining = budget.limit - budget.spent;
          return (
            <Card key={budget.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">{budget.name}</CardTitle>
                <div className="text-muted-foreground">{categoryIcons[budget.category as keyof typeof categoryIcons]}</div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">₹{budget.spent.toLocaleString('en-IN')}</span>
                    <span className="text-sm text-muted-foreground">/ ₹{budget.limit.toLocaleString('en-IN')}</span>
                </div>
                <Progress
                  value={progress}
                  className={cn("mt-2 h-2", progress > 100 ? "bg-red-400/20 [&>*]:bg-red-400" : progress > 80 ? "bg-amber-400/20 [&>*]:bg-amber-400" : "")}
                />
              </CardContent>
              <CardFooter>
                <p className={cn("text-sm", remaining < 0 ? "text-destructive" : "text-muted-foreground")}>
                  {remaining >= 0 ? `₹${remaining.toLocaleString('en-IN')} remaining` : `₹${Math.abs(remaining).toLocaleString('en-IN')} over budget`}
                </p>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
