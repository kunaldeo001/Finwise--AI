
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet } from "lucide-react";

export function OverviewCards() {
  const portfolioValue = 55746.75;
  const portfolioChange = 1532.8;
  const budgetSpent = 1350;
  const budgetTotal = 1580;
  const budgetProgress = (budgetSpent / budgetTotal) * 100;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${portfolioValue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {portfolioChange > 0 ? `+${portfolioChange.toLocaleString()}` : portfolioChange.toLocaleString()} since last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly P/L</CardTitle>
          {portfolioChange > 0 ? (
            <ArrowUpRight className="h-4 w-4 text-accent" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${portfolioChange > 0 ? "text-accent" : "text-destructive"}`}>
            {portfolioChange > 0 ? "+" : ""}${portfolioChange.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {((portfolioChange / (portfolioValue - portfolioChange)) * 100).toFixed(2)}%
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Progress</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{budgetProgress.toFixed(0)}%</div>
          <p className="text-xs text-muted-foreground">
            ${budgetSpent.toLocaleString()} of ${budgetTotal.toLocaleString()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Bills</CardTitle>
          <div className="text-sm font-bold text-accent">3</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$450.78</div>
          <p className="text-xs text-muted-foreground">
            Next bill in 5 days (Netflix)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
