import { PageHeader } from '@/components/page-header';
import { FinancialSimulator } from '@/components/simulator/financial-simulator';

export default function SimulatorPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="What-If Financial Decision Simulator"
        description="Model the multi-year impact of cutting expenses, boosting SIPs, taking loans, or making large purchases."
      />
      <FinancialSimulator />
    </div>
  );
}
