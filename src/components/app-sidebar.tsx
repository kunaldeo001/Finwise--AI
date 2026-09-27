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
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xs group-hover:bg-emerald-500/25 transition-all">
            <Activity className="size-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-sidebar-foreground group-hover:text-emerald-400 transition-colors">
              FinWise AI
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Financial Intelligence
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarNav />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 flex flex-col gap-2">
        {user ? (
          <div className="flex flex-col gap-2 bg-sidebar-accent/40 rounded-xl p-2.5 border border-sidebar-border/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="size-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'G'}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-medium truncate text-sidebar-foreground">
                    {user.email || 'Guest User'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-muted-foreground truncate font-mono">
                      {user.isAnonymous ? 'Demo Mode' : 'Verified'}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title="Sign Out"
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDemo}
              disabled={seeding}
              className="w-full text-xs h-7 border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 gap-1 font-medium"
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
              className="w-full text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
            >
              <Sparkles className="size-3.5" />
              Explore FinWise Demo
            </Button>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
              <span>Sample fintech sandbox</span>
              <Badge variant="outline" className="text-[9px] py-0 px-1 border-emerald-500/30 text-emerald-400 font-mono">
                DEMO DATA
              </Badge>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
