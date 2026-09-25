'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  CalendarCheck,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCheck2,
} from 'lucide-react';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { auditFinancialDataQuality } from '@/lib/finance/data-quality';
import { logAuditEvent } from '@/lib/finance/audit-trail';
import { useToast } from '@/hooks/use-toast';

export function DataQualityAndMonthlyCloseCard() {
  const finwise = useFinwiseData();
  const { toast } = useToast();

  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [isMonthClosed, setIsMonthClosed] = useState(false);
  const [reviewedTimestamp, setReviewedTimestamp] = useState<string | null>(null);

  const report = auditFinancialDataQuality({
    transactions: finwise.transactions,
    budgets: finwise.budgets,
    goals: finwise.goals,
    investments: finwise.investments,
    debts: finwise.debts,
  });

  const handleMonthlyClose = () => {
    const timestamp = new Date().toISOString();
    setIsMonthClosed(true);
    setReviewedTimestamp(timestamp);

    logAuditEvent('MONTH_REVIEWED', 'MonthlyClose', '2026-09', {
      transactionsCount: finwise.transactions.length,
      totalIncome: finwise.totals.currentMonthIncome,
      totalExpenses: finwise.totals.currentMonthExpenses,
      qualityScore: report.qualityScore,
    });

    toast({
      title: 'Month Successfully Closed',
      description: `September 2026 financial records marked as reviewed at ${new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
    });
  };

  const getSeverityBadge = (severity: 'CRITICAL' | 'WARNING' | 'INFO') => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="destructive" className="text-[9px] py-0 px-1 font-mono">CRITICAL</Badge>;
      case 'WARNING':
        return <Badge variant="outline" className="text-amber-400 border-amber-500/40 bg-amber-500/10 text-[9px] py-0 px-1 font-mono">WARNING</Badge>;
      case 'INFO':
        return <Badge variant="secondary" className="text-muted-foreground text-[9px] py-0 px-1 font-mono">INFO</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Financial Data Quality Engine */}
      <Card className="shadow-sm border border-border/70">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400" />
                <CardTitle className="text-base font-semibold">Financial Data Quality</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Deterministic validation: {report.totalTransactionsAnalyzed} transactions & records audited.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Score: {report.qualityScore}/100</span>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  report.qualityScore >= 90
                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                    : report.qualityScore >= 75
                    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                    : 'text-destructive border-destructive/30'
                }`}
              >
                {report.qualityScore >= 90 ? 'Healthy Data' : 'Review Advised'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <Progress
            value={report.qualityScore}
            className="h-1.5 bg-muted [&>*]:bg-emerald-400"
          />

          <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b pb-2">
            <span>Critical Errors: <strong className="text-foreground">{report.criticalCount}</strong></span>
            <span>Warnings: <strong className="text-amber-400">{report.warningCount}</strong></span>
            <span>Observations: <strong className="text-foreground">{report.infoCount}</strong></span>
          </div>

          <div className="space-y-2">
            {report.issues.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Zero integrity defects detected. All dates, amounts, and ledger categorizations are consistent.</span>
              </div>
            ) : (
              report.issues.slice(0, 4).map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-lg border border-border/60 bg-card p-2.5 text-xs space-y-1.5 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium">
                      {getSeverityBadge(issue.severity)}
                      <span className="text-foreground">{issue.issue}</span>
                      <span className="text-muted-foreground font-mono text-[10px]">({issue.affectedRecords})</span>
                    </div>
                    {expandedIssue === issue.id ? (
                      <ChevronUp className="size-3 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-3 text-muted-foreground" />
                    )}
                  </div>

                  {expandedIssue === issue.id && (
                    <div className="pt-2 border-t border-border/40 text-[11px] space-y-1 text-muted-foreground">
                      <p><strong className="text-foreground">Explanation:</strong> {issue.explanation}</p>
                      <p><strong className="text-accent">Suggested Fix:</strong> {issue.suggestedFix}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Monthly Close Workflow */}
      <Card className="shadow-sm border border-border/70">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CalendarCheck className="size-4 text-accent" />
                <CardTitle className="text-base font-semibold">Monthly Close & Review</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Formal end-of-month reconciliation statement for September 2026.
              </CardDescription>
            </div>
            {isMonthClosed ? (
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/40 bg-emerald-500/10 gap-1">
                <FileCheck2 className="size-3" /> Month Reviewed
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/40 bg-amber-500/10">
                Pending Review
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase block">Inflow</span>
              <span className="font-bold text-emerald-400 text-sm">₹{finwise.totals.currentMonthIncome.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase block">Outflow</span>
              <span className="font-bold text-foreground text-sm">₹{finwise.totals.currentMonthExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase block">Surplus</span>
              <span className="font-bold text-accent text-sm">₹{finwise.totals.netSavings.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase block">Savings Rate</span>
              <span className="font-bold text-foreground text-sm">{finwise.totals.savingsRate.toFixed(1)}%</span>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-lg p-3 space-y-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Transactions Reviewed:</span>
              <strong className="text-foreground font-mono">{finwise.transactions.length} records</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Budgets Respected:</span>
              <strong className="text-foreground font-mono">
                {finwise.budgetStatuses.filter((b) => !b.isOverBudget).length} / {finwise.budgetStatuses.length}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Active Recurring Subscriptions:</span>
              <strong className="text-foreground font-mono">
                {finwise.subscriptionIntelligence.subscriptions.length} mandates
              </strong>
            </div>
            {reviewedTimestamp && (
              <div className="flex items-center justify-between pt-1 border-t text-[10px] text-accent">
                <span>Audit Lock:</span>
                <span>{new Date(reviewedTimestamp).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground">
              {isMonthClosed ? 'Month closed. Records are preserved and auditable.' : 'Audit entries and lock September 2026 ledger.'}
            </span>
            <Button
              size="sm"
              disabled={isMonthClosed}
              onClick={handleMonthlyClose}
              className="h-8 text-xs gap-1.5 bg-accent text-accent-foreground font-semibold"
            >
              <CalendarCheck className="size-3.5" />
              {isMonthClosed ? 'Month Locked' : 'Mark Month Reviewed'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
