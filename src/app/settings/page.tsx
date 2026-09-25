import { PageHeader } from '@/components/page-header';
import { SettingsManager } from '@/components/settings/settings-manager';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Profile & Settings"
        description="Manage your authentication session, cloud data sync, smart alert preferences, and security."
      />
      <SettingsManager />
    </div>
  );
}
