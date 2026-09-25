'use client';

import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Activity, UserCheck, LogIn, LogOut, Database, Sparkles } from 'lucide-react';
import { SidebarNav } from './sidebar-nav';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { seedUserDemoData, clearUserData } from '@/lib/finance/firestore-service';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function AppSidebar() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [seeding, setSeeding] = useState(false);

  const handleSeedDemo = async () => {
    if (!user || !firestore) {
      toast({
        title: 'Action required',
        description: 'Please sign in or start a guest session first to seed demo data.',
      });
      return;
    }
    try {
      setSeeding(true);
      await seedUserDemoData(firestore, user.uid);
      toast({
        title: 'Demo Data Loaded',
        description: 'Loaded realistic transactions, budgets, goals, investments, and debts.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load demo data',
        description: err.message || 'Unknown error occurred.',
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleSignOut = () => {
    if (auth) {
      signOut(auth);
      toast({ title: 'Signed Out', description: 'You have been switched to guest session.' });
    }
  };

  const handleGuestLogin = () => {
    if (auth) {
      initiateAnonymousSignIn(auth);
      toast({ title: 'Guest Session Active', description: 'Signed in anonymously for instant testing.' });
    }
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
            <Activity className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-sidebar-foreground">FinWise AI</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Personal Finance Copilot</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarNav />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 flex flex-col gap-2">
        {user ? (
          <div className="flex flex-col gap-2 bg-sidebar-accent/30 rounded-lg p-2.5 border border-sidebar-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="size-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-bold">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'G'}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-medium truncate text-sidebar-foreground">
                    {user.email || 'Guest User'}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {user.isAnonymous ? 'Demo Session' : 'Verified'}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title="Sign Out"
                className="size-7 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDemo}
              disabled={seeding}
              className="w-full text-xs h-7 border-dashed border-accent/40 hover:bg-accent/10 text-accent gap-1"
            >
              <Database className="size-3" />
              {seeding ? 'Loading...' : 'Load Sample Data'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleGuestLogin}
              className="w-full text-xs h-8 gap-1.5 bg-accent text-accent-foreground font-semibold"
            >
              <Sparkles className="size-3.5" />
              Explore FinWise Demo
            </Button>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
              <span>Ready-to-use sample fintech sandbox</span>
              <Badge variant="outline" className="text-[9px] py-0 px-1 border-accent/40 text-accent font-mono">
                DEMO DATA
              </Badge>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
