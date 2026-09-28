'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Activity, LogIn, LogOut, Sparkles, ShieldCheck, UserPlus } from 'lucide-react';
import { SidebarNav } from './sidebar-nav';
import { useUser, useAuth } from '@/firebase';
import { logOut } from '@/firebase/auth/auth-service';
import { useDemoMode } from '@/context/demo-mode-context';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AuthDialog } from '@/components/auth/auth-dialog';

export function AppSidebar() {
  const { user } = useUser();
  const auth = useAuth();
  const { isDemoMode, enableDemoMode, disableDemoMode } = useDemoMode();
  const { toast } = useToast();

  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');

  const isAuthenticated = Boolean(user && !user.isAnonymous);

  const handleSignOut = async () => {
    if (auth) {
      await logOut(auth);
      toast({ title: 'Signed Out', description: 'Switched to guest mode.' });
    }
  };

  const handleOpenAuth = (tab: 'signin' | 'signup') => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  return (
    <>
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
          {isAuthenticated ? (
            <div className="flex flex-col gap-2 bg-sidebar-accent/40 rounded-xl p-2.5 border border-sidebar-border/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="size-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-medium truncate text-sidebar-foreground">
                      {user?.displayName || user?.email}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-muted-foreground truncate font-mono">
                        Isolated Account
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
            </div>
          ) : isDemoMode ? (
            <div className="flex flex-col gap-2 bg-amber-500/5 rounded-xl p-2.5 border border-amber-500/25">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-semibold text-amber-400">Demo Sandbox</span>
                </div>
                <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-500/30 text-amber-400 font-mono">
                  DEMO DATA
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                All data is simulated and sandboxed.
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenAuth('signup')}
                  className="h-7 text-[11px] px-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-medium"
                >
                  Sign Up
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={disableDemoMode}
                  className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                >
                  Exit Demo
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleOpenAuth('signup')}
                className="w-full text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
              >
                <UserPlus className="size-3.5" />
                Create Free Account
              </Button>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenAuth('signin')}
                  className="w-full text-xs h-7 gap-1"
                >
                  <LogIn className="size-3" />
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={enableDemoMode}
                  className="w-full text-xs h-7 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-1"
                >
                  <Sparkles className="size-3" />
                  Try Demo
                </Button>
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />
    </>
  );
}
