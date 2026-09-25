'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Receipt,
  Wallet,
  Target,
  TrendingUp,
  CreditCard,
  Sparkles,
  ArrowRight,
  Command,
} from 'lucide-react';
import { useFinwiseData } from '@/hooks/use-finwise-data';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Transaction' | 'Budget' | 'Goal' | 'Investment' | 'Debt' | 'Page';
  url: string;
  badge?: string;
}

export function FinancialCommandDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const finwise = useFinwiseData();

  // Keyboard shortcut listener: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults: SearchResultItem[] = [];
  const q = query.toLowerCase().trim();

  // Always include navigation pages if query is empty or matches
  const pages: SearchResultItem[] = [
    { id: 'p-dash', title: 'Dashboard', subtitle: 'Financial command center & overview', category: 'Page', url: '/' },
    { id: 'p-tx', title: 'Transactions', subtitle: 'Ledger, categories & CSV import', category: 'Page', url: '/transactions' },
    { id: 'p-bud', title: 'Budgets', subtitle: 'Category spending caps & pace alerts', category: 'Page', url: '/budgets' },
    { id: 'p-goals', title: 'Goals', subtitle: 'Financial goal optimizer & timelines', category: 'Page', url: '/goals' },
    { id: 'p-inv', title: 'Investments', subtitle: 'Portfolio tracking & allocation', category: 'Page', url: '/investments' },
    { id: 'p-debts', title: 'Debt & EMI', subtitle: 'Loan prepayment simulator', category: 'Page', url: '/debts' },
    { id: 'p-sim', title: 'Financial Simulator', subtitle: 'What-If scenario projection engine', category: 'Page', url: '/simulator' },
    { id: 'p-subs', title: 'Subscriptions', subtitle: 'Recurring bill & SaaS detector', category: 'Page', url: '/subscriptions' },
    { id: 'p-ai', title: 'AI Copilot', subtitle: 'Ask financial questions with real data', category: 'Page', url: '/assistant' },
    { id: 'p-rep', title: 'Reports', subtitle: 'Monthly AI Executive Summary', category: 'Page', url: '/reports' },
    { id: 'p-ana', title: 'Analytics', subtitle: 'Deep financial trends & MoM variance', category: 'Page', url: '/analytics' },
    { id: 'p-set', title: 'Settings', subtitle: 'Profile, demo seeder, alerts', category: 'Page', url: '/settings' },
  ];

  if (!q) {
    searchResults.push(...pages.slice(0, 6));
  } else {
    // 1. Pages
    pages.forEach((p) => {
      if (p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)) {
        searchResults.push(p);
      }
    });

    // 2. Transactions & Merchants
    finwise.transactions.forEach((tx) => {
      if (
        tx.merchant.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        tx.amount.toString().includes(q) ||
        `₹${tx.amount}`.includes(q)
      ) {
        searchResults.push({
          id: `tx-${tx.id}`,
          title: tx.merchant,
          subtitle: `${tx.date} • ${tx.category} • ₹${tx.amount.toLocaleString('en-IN')}`,
          category: 'Transaction',
          url: '/transactions',
          badge: tx.type === 'income' ? '+₹' + tx.amount : '-₹' + tx.amount,
        });
      }
    });

    // 3. Budgets
    finwise.budgets.forEach((b) => {
      if (b.category.toLowerCase().includes(q) || b.limit.toString().includes(q)) {
        searchResults.push({
          id: `bud-${b.id}`,
          title: `${b.category} Budget`,
          subtitle: `Monthly cap: ₹${b.limit.toLocaleString('en-IN')}`,
          category: 'Budget',
          url: '/budgets',
        });
      }
    });

    // 4. Goals
    finwise.goals.forEach((g) => {
      if (g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q)) {
        searchResults.push({
          id: `g-${g.id}`,
          title: g.name,
          subtitle: `Target: ₹${g.targetAmount.toLocaleString('en-IN')} by ${g.targetDate}`,
          category: 'Goal',
          url: '/goals',
        });
      }
    });

    // 5. Investments
    finwise.investments.forEach((inv) => {
      if (inv.name.toLowerCase().includes(q) || inv.symbol.toLowerCase().includes(q)) {
        searchResults.push({
          id: `inv-${inv.id}`,
          title: `${inv.name} (${inv.symbol})`,
          subtitle: `${inv.quantity} units • Current Val: ₹${inv.currentValue.toLocaleString('en-IN')}`,
          category: 'Investment',
          url: '/investments',
        });
      }
    });

    // 6. Debts
    finwise.debts.forEach((d) => {
      if (d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)) {
        searchResults.push({
          id: `d-${d.id}`,
          title: d.name,
          subtitle: `Balance: ₹${d.remainingBalance.toLocaleString('en-IN')} • EMI: ₹${d.emi.toLocaleString('en-IN')}/mo`,
          category: 'Debt',
          url: '/debts',
        });
      }
    });
  }

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery('');
    router.push(url);
  };

  const getCategoryIcon = (category: SearchResultItem['category']) => {
    switch (category) {
      case 'Transaction':
        return <Receipt className="size-4 text-emerald-400" />;
      case 'Budget':
        return <Wallet className="size-4 text-amber-400" />;
      case 'Goal':
        return <Target className="size-4 text-accent" />;
      case 'Investment':
        return <TrendingUp className="size-4 text-sky-400" />;
      case 'Debt':
        return <CreditCard className="size-4 text-rose-400" />;
      default:
        return <Command className="size-4 text-muted-foreground" />;
    }
  };

  return (
    <>
      {/* Invisible anchor or trigger if needed */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden shadow-2xl border-border">
          <DialogHeader className="p-3 border-b flex flex-row items-center gap-2">
            <Search className="size-4 text-muted-foreground ml-1" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transactions, merchants, loans, goals, budgets (e.g. Amazon, ₹5000)..."
              className="border-0 focus-visible:ring-0 shadow-none text-sm h-9 bg-transparent"
              autoFocus
            />
            <Badge variant="outline" className="text-[10px] uppercase font-mono text-muted-foreground shrink-0">
              ESC to exit
            </Badge>
          </DialogHeader>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/40 p-1">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No matching financial records found for &quot;{query}&quot;.
              </div>
            ) : (
              searchResults.slice(0, 12).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.url)}
                  className="w-full text-left p-2.5 hover:bg-muted/40 rounded-lg flex items-center justify-between gap-3 transition-colors group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="size-7 rounded-md bg-muted/60 flex items-center justify-center shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[9px] py-0">
                      {item.category}
                    </Badge>
                    <ArrowRight className="size-3 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-2 border-t bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground px-4">
            <span className="flex items-center gap-1">
              <Command className="size-3" /> + K to open anytime
            </span>
            <span>{searchResults.length} results</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
