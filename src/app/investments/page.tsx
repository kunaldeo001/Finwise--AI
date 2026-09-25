import { PageHeader } from '@/components/page-header';
import { InvestmentsManager } from '@/components/investments/investments-manager';

export default function InvestmentsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Investment Tracker & Asset Allocation"
        description="Monitor multi-asset portfolio performance across equities, mutual funds, SIPs, and gold."
      />
      <InvestmentsManager />
    </div>
  );
}
