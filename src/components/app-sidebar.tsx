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
import { Activity, LogIn } from 'lucide-react';
import { SidebarNav } from './sidebar-nav';

export function AppSidebar() {
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
        {/* User section removed */}
      </SidebarFooter>
    </Sidebar>
  );
}
