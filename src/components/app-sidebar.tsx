'use client';

import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { CircleUser, Activity, LogIn } from 'lucide-react';
import { SidebarNav } from './sidebar-nav';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import placeholderImages from '@/lib/placeholder-images.json';
import { useUser } from '@/firebase/auth/use-user';
import { SignOutButton } from './auth/sign-out-button';

export function AppSidebar() {
  const { user, isUserLoading } = useUser();
  const { user_avatar } = placeholderImages;

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Activity className="size-8 text-accent" />
          <span className="text-xl font-semibold">FinWise AI</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {isUserLoading ? (
            <SidebarMenuItem>
              <SidebarMenuButton>
                <CircleUser />
                <span>Loading...</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : user ? (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={{
                    children: (
                      <div className="p-2">
                        <div className="font-semibold">{user.displayName}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    ),
                    className: 'w-max',
                  }}
                >
                  <Link href="/settings">
                    <Avatar className="size-7">
                      <AvatarImage
                        src={user.photoURL || user_avatar.src}
                        alt={user.displayName || 'User Avatar'}
                        width={user_avatar.width}
                        height={user_avatar.height}
                        data-ai-hint={user_avatar.hint}
                      />
                      <AvatarFallback>
                        <CircleUser />
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.displayName || 'Account'}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SignOutButton />
              </SidebarMenuItem>
            </>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Sign In">
                <Link href="/login">
                  <LogIn />
                  <span>Sign In</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
