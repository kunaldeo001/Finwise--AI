'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Shield,
  Bell,
  Database,
  Trash2,
  LogIn,
  LogOut,
  Sparkles,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Download,
  FileJson,
  AlertOctagon,
} from 'lucide-react';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { initiateAnonymousSignIn, initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { signOut } from 'firebase/auth';
import { seedUserDemoData, clearUserData } from '@/lib/finance/firestore-service';
import { useToast } from '@/hooks/use-toast';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { exportFullUserDataJSON, exportFinancialSnapshotJSON } from '@/lib/finance/export';
import { logAuditEvent } from '@/lib/finance/audit-trail';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConnectedAccountsManager } from './connected-accounts';

export function SettingsManager() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const finwise = useFinwiseData();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [confirmKeyword, setConfirmKeyword] = useState('');

  // Alert preferences toggles
  const [alertPrefs, setAlertPrefs] = useState({
    budgetExceeded: true,
    unusualSpending: true,
    upcomingEmi: true,
    recurringPayment: true,
  });

  const handleExportFullData = () => {
    try {
      exportFullUserDataJSON({
        userId: user?.uid || 'guest-session',
        transactions: finwise.transactions,
        budgets: finwise.budgets,
        goals: finwise.goals,
        investments: finwise.investments,
        debts: finwise.debts,
        subscriptions: [],
        settings: { alertPreferences: alertPrefs },
      });
      logAuditEvent('DATA_EXPORT', user?.uid || 'guest', 'portfolio', { format: 'JSON' });
      toast({
        title: 'Data Exported Successfully',
        description: 'Complete user financial records exported to structured JSON without credentials.',
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Export Failed', description: err.message });
    }
  };

  const handleExportSnapshot = () => {
    try {
      const expenses = finwise.totals.currentMonthExpenses || 1;
      exportFinancialSnapshotJSON({
        asOfDate: new Date().toISOString().substring(0, 10),
        totals: {
          liquidCash: finwise.totals.totalBalance,
          monthlyIncome: finwise.totals.currentMonthIncome,
          monthlyExpenses: finwise.totals.currentMonthExpenses,
          netSavings: finwise.totals.netSavings,
          savingsRate: finwise.totals.savingsRate,
          netWorth: finwise.totals.netWorth,
          totalInvested: finwise.totals.totalInvested,
          portfolioValue: finwise.totals.currentPortfolioValue,
          totalDebtRemaining: finwise.totals.totalLiabilities,
        },
        healthScore: finwise.healthScore.overallScore,
        cashRunwayMonths: parseFloat((finwise.totals.totalBalance / expenses).toFixed(1)),
        emergencyFundCoverageMonths: parseFloat((finwise.totals.totalBalance / (expenses * 0.7)).toFixed(1)),
        activeBudgetsCount: finwise.budgets.length,
        activeGoalsCount: finwise.goals.length,
      });
      logAuditEvent('DATA_EXPORT', user?.uid || 'guest', 'financial_snapshot', { format: 'JSON' });
      toast({
        title: 'Snapshot Exported',
        description: 'Point-in-time financial statement downloaded as JSON.',
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Export Failed', description: err.message });
    }
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email.trim() || !password.trim()) return;

    if (authMode === 'signin') {
      initiateEmailSignIn(auth, email, password);
      toast({ title: 'Signing in...', description: 'Authenticating your credentials.' });
    } else {
      initiateEmailSignUp(auth, email, password);
      toast({ title: 'Creating account...', description: 'Setting up your secure profile.' });
    }
  };

  const handleGuestSignIn = () => {
    if (auth) {
      initiateAnonymousSignIn(auth);
      toast({ title: 'Guest Session Active', description: 'Signed in anonymously for testing.' });
    }
  };

  const handleSignOut = () => {
    if (auth) {
      signOut(auth);
      toast({ title: 'Signed Out', description: 'Switched to guest mode.' });
    }
  };

  const handleSeedData = async () => {
    if (!user || !firestore) {
      toast({ title: 'Sign in required', description: 'Start a guest session or log in to seed data.' });
      return;
    }
    try {
      setIsProcessing(true);
      await seedUserDemoData(firestore, user.uid);
      toast({ title: 'Demo Data Seeded', description: 'Loaded complete realistic fintech records.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmClearData = async () => {
    if (!user || !firestore) {
      toast({ title: 'Sign in required' });
      return;
    }
    try {
      setIsProcessing(true);
      logAuditEvent('DATA_RESET', user.uid, 'user_data', {
        deletedTransactions: finwise.transactions.length,
        deletedGoals: finwise.goals.length,
        deletedBudgets: finwise.budgets.length,
        deletedInvestments: finwise.investments.length,
        deletedDebts: finwise.debts.length,
      });
      await clearUserData(firestore, user.uid);
      setResetModalOpen(false);
      setConfirmKeyword('');
      toast({ title: 'Records Cleared', description: 'Cleared user financial records.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Profile & Authentication */}
      <Card className="shadow-sm border border-border/70">
        <CardHeader className="p-4 sm:p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                <User className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">User Profile & Access</CardTitle>
                <CardDescription className="text-xs">
                  Manage your credentials, session mode, and cloud sync identity
                </CardDescription>
              </div>
            </div>
            {user && (
              <Badge variant="outline" className="text-xs text-accent border-accent/30">
                {user.isAnonymous ? 'Guest / Demo Mode' : 'Verified Cloud User'}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {user ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/20 border">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-bold">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'G'}
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">
                    {user.email || 'Anonymous Guest Session'}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">UID: {user.uid}</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5 h-8 text-xs">
                <LogOut className="size-3.5" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2 border-b pb-3">
                <Button
                  variant={authMode === 'signin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAuthMode('signin')}
                  className="h-8 text-xs"
                >
                  Sign In
                </Button>
                <Button
                  variant={authMode === 'signup' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAuthMode('signup')}
                  className="h-8 text-xs"
                >
                  Create Account
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGuestSignIn}
                  className="ml-auto h-8 text-xs gap-1.5 border-accent/40 text-accent"
                >
                  <Sparkles className="size-3.5" />
                  Instant Guest Login
                </Button>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3 max-w-md">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Email Address</label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" size="sm" className="h-8 text-xs gap-1.5">
                  <LogIn className="size-3.5" />
                  {authMode === 'signin' ? 'Sign In with Email' : 'Register Account'}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cloud Data Management & Portability */}
      <Card className="shadow-sm border border-border/70">
        <CardHeader className="p-4 sm:p-6 border-b">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Database className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Data Portability & Records Management</CardTitle>
              <CardDescription className="text-xs">
                Export complete user-owned financial ledgers into portable JSON or wipe private collections
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* Data Portability (Export My Data) */}
          <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="size-4 text-accent" />
                <span className="font-semibold text-sm text-foreground">Export My Data (Data Portability)</span>
              </div>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Sanitized JSON • Zero Credentials
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Download your complete financial records (all transactions, active budgets, savings goals, stock holdings, debt schedules, and alert preferences) in deterministic, structured JSON. Strictly audited to exclude API keys and authorization secrets.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportFullData}
                className="h-8 text-xs gap-1.5 border-border/80"
              >
                <Download className="size-3.5" />
                Export Full Ledger (.JSON)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSnapshot}
                className="h-8 text-xs gap-1.5 border-border/80"
              >
                <FileJson className="size-3.5" />
                Export Financial Snapshot (.JSON)
              </Button>
            </div>
          </div>

          {/* Seeder & Reset Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border bg-accent/5 border-accent/20 space-y-2">
              <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <Sparkles className="size-4 text-accent" />
                Seed Fintech Sample Data
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Instantly populate your account with 20+ realistic Indian Rupee transactions, budget caps, active goals, stocks, and loans.
              </p>
              <Button
                size="sm"
                onClick={handleSeedData}
                disabled={isProcessing}
                className="h-8 text-xs gap-1.5 mt-2"
              >
                <Database className="size-3.5" />
                {isProcessing ? 'Writing to Firestore...' : 'Load Complete Sample Data'}
              </Button>
            </div>

            <div className="p-4 rounded-xl border bg-destructive/5 border-destructive/20 space-y-2">
              <span className="font-semibold text-sm text-destructive flex items-center gap-1.5">
                <Trash2 className="size-4" />
                Reset Account Data
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Permanently purge all user-scoped transactions, budgets, goals, investments, and debt schedules from Firestore.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setConfirmKeyword('');
                  setResetModalOpen(true);
                }}
                disabled={isProcessing}
                className="h-8 text-xs gap-1.5 mt-2"
              >
                <Trash2 className="size-3.5" />
                Reset Records...
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Explicit Guarded Reset Records Confirmation Dialog */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertOctagon className="size-5 shrink-0" />
              <DialogTitle className="text-base font-bold">Confirm Account Data Reset</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This action is <span className="font-semibold text-destructive">irreversible</span>. All records associated with your UID will be permanently purged from private cloud Firestore collections.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="bg-muted/40 p-3 rounded-lg border space-y-1.5">
              <div className="font-semibold text-foreground text-xs mb-1">Records to be deleted:</div>
              <div className="flex justify-between text-muted-foreground">
                <span>Transactions:</span>
                <span className="font-mono font-medium text-foreground">{finwise.transactions.length}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Active Budgets:</span>
                <span className="font-mono font-medium text-foreground">{finwise.budgets.length}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Financial Goals:</span>
                <span className="font-mono font-medium text-foreground">{finwise.goals.length}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Investment Holdings:</span>
                <span className="font-mono font-medium text-foreground">{finwise.investments.length}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Debts & Loans:</span>
                <span className="font-mono font-medium text-foreground">{finwise.debts.length}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Type <span className="font-mono font-bold text-destructive">RESET</span> below to confirm deletion:
              </label>
              <Input
                value={confirmKeyword}
                onChange={(e) => setConfirmKeyword(e.target.value)}
                placeholder="RESET"
                className="font-mono text-xs uppercase"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetModalOpen(false)}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmClearData}
              disabled={confirmKeyword.trim() !== 'RESET' || isProcessing}
              className="text-xs h-8 gap-1.5"
            >
              <Trash2 className="size-3.5" />
              {isProcessing ? 'Purging...' : 'Permanently Delete Records'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connected Bank Accounts & Account Aggregator */}
      <ConnectedAccountsManager />

      {/* Smart Alerts & Notifications Toggles (Phase 12) */}
      <Card className="shadow-sm border border-border/70">
        <CardHeader className="p-4 sm:p-6 border-b">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Bell className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Intelligent Alert Categories</CardTitle>
              <CardDescription className="text-xs">
                Configure rule-based monitoring triggers for your cash flow
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="divide-y divide-border/60">
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold text-foreground block">Budget Threshold Warnings</span>
                <span className="text-[11px] text-muted-foreground">Alert when category spending exceeds 80%</span>
              </div>
              <Switch
                checked={alertPrefs.budgetExceeded}
                onCheckedChange={(c) => setAlertPrefs({ ...alertPrefs, budgetExceeded: c })}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold text-foreground block">Unusual Spending Detection</span>
                <span className="text-[11px] text-muted-foreground">Detect transactions 2.5x larger than historical category average</span>
              </div>
              <Switch
                checked={alertPrefs.unusualSpending}
                onCheckedChange={(c) => setAlertPrefs({ ...alertPrefs, unusualSpending: c })}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold text-foreground block">Upcoming EMI Debits</span>
                <span className="text-[11px] text-muted-foreground">Notify 5 days before scheduled loan auto-debits</span>
              </div>
              <Switch
                checked={alertPrefs.upcomingEmi}
                onCheckedChange={(c) => setAlertPrefs({ ...alertPrefs, upcomingEmi: c })}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold text-foreground block">Recurring Subscriptions</span>
                <span className="text-[11px] text-muted-foreground">Track monthly Netflix, Spotify, and SaaS renewals</span>
              </div>
              <Switch
                checked={alertPrefs.recurringPayment}
                onCheckedChange={(c) => setAlertPrefs({ ...alertPrefs, recurringPayment: c })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Regulatory Disclaimers (Phase 17) */}
      <Card className="shadow-sm border border-border/70 bg-card/60">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Shield className="size-3.5 text-accent" />
            Security & Regulatory Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1 space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>
            • <span className="font-semibold text-foreground">Strict Document Ownership:</span> All user transactions, budgets, investments, and debts are segregated under private Firestore user paths (<code className="text-[10px] bg-muted px-1 py-0.5 rounded">/users/&#123;userId&#125;/*</code>) guarded by rules checking <code className="text-[10px] bg-muted px-1 py-0.5 rounded">request.auth.uid == userId</code>.
          </p>
          <p>
            • <span className="font-semibold text-foreground">No Hardcoded Secret Keys:</span> All AI server actions run server-side using server environment variables.
          </p>
          <p>
            • <span className="font-semibold text-foreground">Educational Disclaimer:</span> FinWise AI is designed as a personal finance copilot for educational and informational tracking only. It does not provide certified financial planning, tax advice, or registered SEBI advisory services.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
