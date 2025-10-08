
import { PageHeader } from "@/components/page-header";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { Portfolio } from "@/components/dashboard/portfolio";
import { MarketTrends } from "@/components/dashboard/market-trends";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" description="Welcome back, Kunal Deo! Here's your financial overview." />
      <OverviewCards />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Portfolio />
        </div>
        <div className="lg:col-span-1">
          <MarketTrends />
        </div>
      </div>
    </div>
  );
}
