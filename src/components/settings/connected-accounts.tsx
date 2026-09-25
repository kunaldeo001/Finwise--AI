'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Landmark,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface MockAccount {
  id: string;
  bankName: string;
  accountType: string;
  maskedNumber: string;
  lastSynced: string;
  status: 'active' | 'disconnected';
  method: 'Manual CSV' | 'Account Aggregator';
}

export function ConnectedAccountsManager() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<MockAccount[]>([
    {
      id: 'acc-1',
      bankName: 'HDFC Bank',
      accountType: 'Salary Account',
      maskedNumber: '•••• •••• 4912',
      lastSynced: '2026-09-20',
      status: 'active',
      method: 'Manual CSV',
    },
  ]);

  const handleDisconnect = (id: string, name: string) => {
    setAccounts(accounts.filter((a) => a.id !== id));
    toast({
      title: 'Account Disconnected',
      description: `Removed ${name} from your local connected accounts.`,
    });
  };

  const handleSyncAttempt = (name: string) => {
    toast({
      title: 'Automatic Sync Not Configured',
      description: `Live Account Aggregator sync for ${name} requires institutional credentials. Please import an updated bank statement CSV.`,
    });
  };

  return (
    <Card className="shadow-sm border border-border/70">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Landmark className="size-4 text-accent" />
              <CardTitle className="text-base font-semibold">Connected Bank Accounts</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Manage bank statement integrations and Account Aggregator (AA) consent framework.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] text-muted-foreground w-fit">
            Zero-Credential Architecture
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Notice on AA framework */}
        <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Zero-Credential Architecture</p>
              <p className="text-muted-foreground text-[11px]">
                FinWise AI does not request or store internet banking passwords. Ingest statements directly via zero-exposure CSV parsing or RBI-regulated Account Aggregators.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" asChild className="h-7 text-xs border-accent/40 text-accent shrink-0">
            <Link href="/transactions">
              <FileSpreadsheet className="size-3 mr-1" /> Import CSV
            </Link>
          </Button>
        </div>

        {/* Existing Accounts Table / List */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Active Accounts
          </span>

          {accounts.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
              No accounts linked. You can import transactions via CSV at any time.
            </div>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-colors gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-accent/15 flex items-center justify-center text-accent shrink-0">
                    <Landmark className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground">{acc.bankName}</span>
                      <Badge variant="outline" className="text-[9px] py-0 px-1 text-emerald-400 border-emerald-500/30">
                        {acc.status}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] py-0 px-1 text-muted-foreground">
                        {acc.method}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{acc.maskedNumber}</span>
                      <span>•</span>
                      <span>{acc.accountType}</span>
                      <span>•</span>
                      <span>Last imported: {acc.lastSynced}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSyncAttempt(acc.bankName)}
                    className="h-7 text-xs gap-1"
                  >
                    <RefreshCw className="size-3" /> Sync
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDisconnect(acc.id, acc.bankName)}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Account Aggregator Providers Section */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              RBI Account Aggregators (India)
            </span>
            <Badge variant="secondary" className="text-[9px] py-0 px-1.5 text-muted-foreground">
              Coming Soon
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {[
              { name: 'Setu AA', type: 'SBM / Axis / ICICI API', status: 'Coming Soon' },
              { name: 'Finvu', type: 'HDFC / Kotak / SBI API', status: 'Coming Soon' },
              { name: 'OneMoney', type: 'Multi-bank AA Gateway', status: 'Coming Soon' },
            ].map((p) => (
              <div
                key={p.name}
                className="p-3 rounded-lg border border-border/50 bg-background/50 flex flex-col justify-between space-y-1.5"
              >
                <div>
                  <div className="font-semibold text-foreground text-xs">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">{p.type}</div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-amber-400 font-medium">Automatic sync not configured</span>
                  <Badge variant="outline" className="text-[9px] py-0 px-1 text-muted-foreground">
                    Roadmap
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
