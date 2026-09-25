import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { FinancialCommandDialog } from '@/components/search/financial-command-dialog';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'FinWise AI — AI-Powered Personal Finance Copilot',
  description: 'Intelligent personal finance copilot for real-time expense intelligence, cash flow forecasting, debt planning, and portfolio tracking.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('dark', inter.variable)} suppressHydrationWarning>
      <body className={cn('font-sans antialiased', 'min-h-screen bg-background text-foreground')}>
        <FirebaseClientProvider>
          <SidebarProvider>
            <div className="relative flex min-h-screen w-full">
              <AppSidebar />
              <SidebarInset className="w-full min-w-0">
                <main className="p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
              </SidebarInset>
            </div>
            <FinancialCommandDialog />
          </SidebarProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
