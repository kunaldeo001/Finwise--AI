import { PageHeader } from '@/components/page-header';
import { DebtManager } from '@/components/debts/debt-manager';

export default function DebtsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Debt & EMI Planner"
        description="Track liabilities, manage loan tenures, and simulate interest savings with prepayment strategies."
      />
      <DebtManager />
    </div>
  );
}
