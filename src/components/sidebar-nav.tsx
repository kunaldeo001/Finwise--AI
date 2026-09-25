'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './ui/sidebar';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Target,
  TrendingUp,
  CreditCard,
  Calculator,
  Repeat,
  BarChart3,
  Sparkles,
  FileText,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type SidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const menuItems: SidebarNavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/budgets', label: 'Budgets', icon: Wallet },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/investments', label: 'Investments', icon: TrendingUp },
  { href: '/debts', label: 'Debt & EMI', icon: CreditCard },
  { href: '/simulator', label: 'Simulator', icon: Calculator, badge: 'What-If' },
  { href: '/subscriptions', label: 'Subscriptions', icon: Repeat },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/assistant', label: 'AI Copilot', icon: Sparkles, badge: 'AI' },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/settings', label: 'Profile / Settings', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {menuItems.map(({ href, label, icon: Icon, badge }) => {
        const isActive =
          pathname === href || (href === '/transactions' && pathname === '/expenses');

        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
              <Link href={href} className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0" />
                  <span>{label}</span>
                </div>
                {badge && (
                  <span className="text-[10px] font-semibold bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
