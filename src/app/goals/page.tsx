
import { PageHeader } from "@/components/page-header";
import { GoalForm } from "@/components/goals/goal-form";
import { Goal } from "lucide-react";

export default function GoalsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Financial Goals"
        description="Set financial goals and track your progress with AI-driven recommendations."
      />
      <GoalForm />
    </div>
  );
}
