import { PageHeader } from '@/components/page-header';
import { TransactionsManager } from '@/components/transactions/transactions-manager';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Receipt } from 'lucide-react';

export default function ExpensesPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Expense Tracker"
        description="Comprehensive expense management, bill scanning, and AI spending intelligence."
      />
      <TransactionsManager />
    </div>
  );
}
