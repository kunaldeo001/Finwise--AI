'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { logOut } from '@/firebase/auth/auth-service';
import { useDemoMode } from '@/context/demo-mode-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Search,
  Bell,
  LogOut,
  User,
  Shield,
  Download,
  Trash2,
  Sparkles,
  ArrowRight,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { useToast } from '@/hooks/use-toast';

export function TopNavbar() {
  const { user } = useUser();
  const auth = useAuth();
  const { isDemoMode, disableDemoMode } = useDemoMode();
  const { toast } = useToast();
  const router = useRouter();

  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogTab, setAuthDialogTab] = useState<'signin' | 'signup'>('signin');

  const isAuthenticated = Boolean(user && !user.isAnonymous);

  const handleOpenAuth = (tab: 'signin' | 'signup') => {
    setAuthDialogTab(tab);
    setAuthDialogOpen(true);
  };

  const handleSignOut = async () => {
    if (auth) {
      await logOut(auth);
      toast({
        title: 'Signed Out',
        description: 'You have safely signed out of your workspace.',
      });
      router.push('/');
    }
  };

  const handleExitDemo = () => {
    disableDemoMode();
    toast({
      title: 'Exited Demo Mode',
      description: 'You are now on the sign-in portal.',
    });
  };

  const openSearch = () => {
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
    document.dispatchEvent(event);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/70 bg-background/80 backdrop-blur-md px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

          {/* Quick Command Search Trigger */}
          <button
            onClick={openSearch}
            className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground transition-all sm:w-56"
          >
            <Search className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Search finances...</span>
            <span className="sm:hidden">Search</span>
            <kbd className="pointer-events-none ml-auto hidden rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Center / Demo Mode Pill */}
        {isDemoMode && !isAuthenticated && (
          <div className="hidden md:flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs">
            <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold text-amber-400">DEMO MODE ACTIVE</span>
            <span className="text-muted-foreground text-[11px]">— Sandboxed Data</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenAuth('signup')}
              className="h-5 text-[11px] px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-medium ml-1"
            >
              Save Real Finances <ArrowRight className="size-3 ml-0.5" />
            </Button>
          </div>
        )}

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Notifications / Alerts shortcut */}
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="size-8 text-muted-foreground hover:text-foreground"
              >
                <Link href="/reports">
                  <Bell className="size-4" />
                </Link>
              </Button>

              {/* Authenticated User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative size-8 rounded-full border border-border/80 p-0 hover:border-emerald-500/40">
                    <div className="size-8 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center justify-center">
                      {user?.displayName
                        ? user.displayName.charAt(0).toUpperCase()
                        : user?.email
                        ? user.email.charAt(0).toUpperCase()
                        : 'U'}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border/80 shadow-xl">
                  <DropdownMenuLabel className="font-normal p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-semibold leading-none text-foreground truncate">
                        {user?.displayName || 'Financial Workspace'}
                      </p>
                      <p className="text-[11px] leading-none text-muted-foreground truncate font-mono">
                        {user?.email || ''}
                      </p>
                      <div className="pt-1">
                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-emerald-500/30 text-emerald-400 font-mono">
                          Verified User
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer text-xs gap-2">
                      <User className="size-3.5 text-muted-foreground" />
                      Profile & Settings
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer text-xs gap-2">
                      <Shield className="size-3.5 text-muted-foreground" />
                      Security & Password
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer text-xs gap-2">
                      <Download className="size-3.5 text-muted-foreground" />
                      Export Financial Data
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-xs gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="size-3.5" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {isDemoMode ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExitDemo}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  Exit Demo
                </Button>
              ) : null}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenAuth('signin')}
                className="h-8 text-xs gap-1.5 font-medium"
              >
                <LogIn className="size-3.5" />
                Sign In
              </Button>

              <Button
                size="sm"
                onClick={() => handleOpenAuth('signup')}
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
              >
                <UserPlus className="size-3.5" />
                Create Account
              </Button>
            </div>
          )}
        </div>
      </header>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        defaultTab={authDialogTab}
      />
    </>
  );
}
