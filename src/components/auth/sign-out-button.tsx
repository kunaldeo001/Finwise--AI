'use client';

import { Button } from '@/components/ui/button';
import { handleSignOut } from '@/firebase/auth/client';
import { LogOut } from 'lucide-react';
import { SidebarMenuButton } from '../ui/sidebar';

export function SignOutButton() {
  return (
    <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
      <LogOut />
      <span>Sign Out</span>
    </SidebarMenuButton>
  );
}
