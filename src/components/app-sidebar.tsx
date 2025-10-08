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
import { CircleUser, Activity } from 'lucide-react';
import { SidebarNav } from './sidebar-nav';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import placeholderImages from '@/lib/placeholder-images.json';

export function AppSidebar() {
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
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={{
                children: (
                  <div className="p-2">
                    <div className="font-semibold">Kunal Deo</div>
                    <div className="text-xs text-muted-foreground">kunal.deo@example.com</div>
                  </div>
                ),
                className: 'w-max',
              }}
            >
              <Link href="/settings">
                <Avatar className="size-7">
                  <AvatarImage
                    src={user_avatar.src}
                    alt={user_avatar.alt}
                    width={user_avatar.width}
                    height={user_avatar.height}
                    data-ai-hint={user_avatar.hint}
                  />
                  <AvatarFallback>
                    <CircleUser />
                  </AvatarFallback>
                </Avatar>
                <span>Kunal Deo</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
