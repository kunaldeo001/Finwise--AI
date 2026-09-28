'use client';

import { PageHeader } from '@/components/page-header';
import { ReceiptsManager } from '@/components/receipts/receipts-manager';

export default function ReceiptsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="AI Receipt & Invoice Intelligence"
        description="Multimodal receipt scanning, automatic line-item OCR, GST breakdown, and transaction synchronization."
      />
      <ReceiptsManager />
    </div>
  );
}
