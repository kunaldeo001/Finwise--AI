import { PageHeader } from '@/components/page-header';
import { BudgetManager } from '@/components/budgets/budget-manager';

export default function BudgetsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Budget Intelligence"
        description="Monitor category spending limits, daily burn velocity, and proactive overspend predictions."
      />
      <BudgetManager />
    </div>
  );
}
