
import { PageHeader } from "@/components/page-header";
import { NewsFeed } from "@/components/assistant/news-feed";

export default function AssistantPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="AI Assistant"
        description="Get a personalized financial news feed tailored to your interests and investments."
      />
      <NewsFeed />
    </div>
  );
}
