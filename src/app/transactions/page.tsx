import { PageHeader } from '@/components/page-header';
import { TransactionsManager } from '@/components/transactions/transactions-manager';

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Transactions & Expense Intelligence"
        description="Track, categorize, import CSV bank statements, and detect anomalous spending patterns."
      />
      <TransactionsManager />
    </div>
  );
}
