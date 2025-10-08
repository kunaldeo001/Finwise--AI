
import { PageHeader } from "@/components/page-header";
import { Chatbot } from "@/components/assistant/chatbot";

export default function AssistantPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="AI Financial Chatbot"
        description="Ask me anything about your finances or market trends."
      />
      <Chatbot />
    </div>
  );
}
