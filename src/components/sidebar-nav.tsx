'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './ui/sidebar';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Receipt,
  ScanLine,
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
  { href: '/receipts', label: 'Receipt Scanner', icon: ScanLine, badge: 'AI' },
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
    <SidebarMenu className="gap-1">
      {menuItems.map(({ href, label, icon: Icon, badge }) => {
        const isActive =
          pathname === href || (href === '/transactions' && pathname === '/expenses');

        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
              <Link
                href={href}
                className={cn(
                  'flex items-center justify-between w-full group transition-all duration-200',
                  isActive ? 'text-emerald-400 font-semibold' : 'text-sidebar-foreground/80 hover:text-sidebar-foreground'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      'size-4 shrink-0 transition-colors duration-200',
                      isActive ? 'text-emerald-400' : 'text-muted-foreground group-hover:text-sidebar-foreground'
                    )}
                  />
                  <span className="truncate">{label}</span>
                </div>
                {badge && (
                  <span
                    className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider',
                      badge === 'AI'
                        ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                        : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                    )}
                  >
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
