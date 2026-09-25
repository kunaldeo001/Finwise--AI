import { PageHeader } from '@/components/page-header';
import { GoalsManager } from '@/components/goals/goals-manager';

export default function GoalsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Financial Goals & Life Milestones"
        description="Set targets, track progress velocity, and simulate AI-driven savings roadmaps."
      />
      <GoalsManager />
    </div>
  );
}
