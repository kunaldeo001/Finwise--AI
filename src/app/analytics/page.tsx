import { PageHeader } from '@/components/page-header';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Advanced Analytics & Intelligence"
        description="Deep financial trends, income vs expense ratios, and historical net worth evolution."
      />
      <AnalyticsDashboard />
    </div>
  );
}
