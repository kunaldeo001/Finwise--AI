import { PageHeader } from '@/components/page-header';
import { SubscriptionsManager } from '@/components/subscriptions/subscriptions-manager';

export default function SubscriptionsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Subscription Intelligence & Recurring Mandates"
        description="Audit automatic recurring payments, calculate total annual commitment load, and manage renewal alerts."
      />
      <SubscriptionsManager />
    </div>
  );
}
