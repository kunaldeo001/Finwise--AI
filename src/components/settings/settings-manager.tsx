'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Calendar,
  Lock,
  Mail,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { useUser, useAuth, useFirestore } from '@/firebase';
import {
  signUpWithEmail,
  signInWithEmail,
  changeUserPassword,
  deleteUserAccount,
  resetPassword,
  logOut,
  formatAuthError,
  evaluatePasswordStrength,
} from '@/firebase/auth/auth-service';
import { seedUserDemoData, clearUserData } from '@/lib/finance/firestore-service';
import { useToast } from '@/hooks/use-toast';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { useDemoMode } from '@/context/demo-mode-context';
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
  const { isDemoMode, disableDemoMode } = useDemoMode();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Security: Change Password
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Modals
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [confirmKeyword, setConfirmKeyword] = useState('');
  const [confirmDeleteAccountKeyword, setConfirmDeleteAccountKeyword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Alert preferences state
  const [alertPrefs, setAlertPrefs] = useState({
    budgetAlert: true,
    unusualSpending: true,
    upcomingEmi: true,
    recurringPayment: true,
    weeklyDigest: false,
  });

  const isAuthenticated = Boolean(user && !user.isAnonymous);
  const newPassStrength = evaluatePasswordStrength(newPass);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email.trim() || !password) return;
    setAuthError(null);

    if (authMode === 'signup' && password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    try {
      setAuthLoading(true);
      if (authMode === 'signin') {
        await signInWithEmail(auth, email, password);
        toast({ title: 'Welcome back!', description: 'Authenticated successfully.' });
      } else {
        await signUpWithEmail(auth, email, password);
        toast({ title: 'Account created!', description: 'Your secure profile is ready.' });
      }
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (auth) {
      await logOut(auth);
      toast({ title: 'Signed Out', description: 'Switched to guest session.' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPassError(null);
    setPassSuccess(null);

    if (newPass.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }
    if (newPass !== confirmNewPass) {
      setPassError('New passwords do not match.');
      return;
    }

    try {
      setPassLoading(true);
      await changeUserPassword(user, newPass);
      setPassSuccess('Password updated successfully.');
      setNewPass('');
      setConfirmNewPass('');
      setCurrentPass('');
      toast({ title: 'Password Changed', description: 'Your credentials have been updated.' });
    } catch (err: any) {
      setPassError(formatAuthError(err));
    } finally {
      setPassLoading(false);
    }
  };

  const handleExportFullData = () => {
    try {
      exportFullUserDataJSON({
        userId: user?.uid || 'guest',
        transactions: finwise.transactions,
        budgets: finwise.budgets,
        goals: finwise.goals,
        investments: finwise.investments,
        debts: finwise.debts,
        alerts: finwise.alerts,
        receipts: finwise.receipts,
      });
      logAuditEvent('DATA_EXPORT', user?.uid || 'guest', 'full_database', { format: 'JSON' });
      toast({
        title: 'Full Export Completed',
        description: `Exported ${finwise.transactions.length} transactions, ${finwise.receipts.length} receipts, and complete ledger records.`,
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
          totalDebtRemaining: finwise.totals.totalDebtRemaining,
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

  const handleSeedData = async () => {
    if (!user || !firestore) {
      toast({ title: 'Sign in required', description: 'Log in to seed sample data into your sandbox.' });
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

  const handleConfirmDeleteAccount = async () => {
    if (!user) return;
    try {
      setIsProcessing(true);
      await deleteUserAccount(user, firestore);
      setDeleteAccountModalOpen(false);
      setConfirmDeleteAccountKeyword('');
      toast({ title: 'Account Deleted', description: 'All records and profile permanently erased.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: formatAuthError(err) });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Profile & Authentication */}
      <Card className="shadow-sm border border-border/80">
        <CardHeader className="p-4 sm:p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <User className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">User Profile & Access</CardTitle>
                <CardDescription className="text-xs">
                  Manage your credentials, isolated cloud storage, and session identity
                </CardDescription>
              </div>
            </div>
            {isAuthenticated ? (
              <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30 font-mono">
                Verified Cloud User
              </Badge>
            ) : isDemoMode ? (
              <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30 font-mono">
                DEMO SANDBOX
              </Badge>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {isAuthenticated ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/20 border border-border/80">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  {user?.displayName
                    ? user.displayName.charAt(0).toUpperCase()
                    : user?.email
                    ? user.email.charAt(0).toUpperCase()
                    : 'U'}
                </div>
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm text-foreground">
                    {user?.displayName || user?.email}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate max-w-xs sm:max-w-md">
                    UID: {user?.uid}
                  </div>
                  {user?.metadata?.creationTime && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" />
                      Member since: {new Date(user.metadata.creationTime).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5 h-8 text-xs shrink-0">
                <LogOut className="size-3.5" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {authError && (
                <Alert variant="destructive" className="py-2.5 text-xs bg-destructive/10 border-destructive/30">
                  <AlertCircle className="size-4 shrink-0" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 border-b pb-3">
                <Button
                  variant={authMode === 'signin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => { setAuthMode('signin'); setAuthError(null); }}
                  className="h-8 text-xs"
                >
                  Sign In
                </Button>
                <Button
                  variant={authMode === 'signup' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                  className="h-8 text-xs"
                >
                  Create Account
                </Button>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3 max-w-md">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>

                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Confirm Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                )}

                <Button type="submit" size="sm" disabled={authLoading} className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500">
                  {authLoading ? <Loader2 className="size-3.5 animate-spin" /> : <LogIn className="size-3.5" />}
                  {authMode === 'signin' ? 'Sign In' : 'Create Isolated Account'}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security & Password Change (Authenticated Users) */}
      {isAuthenticated && (
        <Card className="shadow-sm border border-border/80">
          <CardHeader className="p-4 sm:p-6 border-b">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <KeyRound className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Security & Password Management</CardTitle>
                <CardDescription className="text-xs">
                  Update your authentication credentials or request password resets
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-4">
            {passError && (
              <Alert variant="destructive" className="py-2.5 text-xs bg-destructive/10 border-destructive/30">
                <AlertCircle className="size-4 shrink-0" />
                <AlertDescription>{passError}</AlertDescription>
              </Alert>
            )}

            {passSuccess && (
              <Alert className="py-2.5 text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0" />
                <AlertDescription>{passSuccess}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
              <div className="space-y-1">
                <Label className="text-xs font-medium">New Password</Label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
                {newPass.length > 0 && (
                  <div className="pt-1 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Strength:</span>
                      <span className="font-semibold text-foreground">{newPassStrength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            newPassStrength.score >= step ? newPassStrength.color : 'bg-muted/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Confirm New Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmNewPass}
                  onChange={(e) => setConfirmNewPass(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <Button type="submit" size="sm" disabled={passLoading} className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500">
                {passLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Lock className="size-3.5" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Cloud Data Management & Portability */}
      <Card className="shadow-sm border border-border/80">
        <CardHeader className="p-4 sm:p-6 border-b">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
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
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="size-4 text-emerald-400" />
                <span className="font-semibold text-sm text-foreground">Export My Data (Data Portability)</span>
              </div>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Sanitized JSON • Zero Credentials
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Download your complete financial records (transactions, receipts, active budgets, savings goals, stock holdings, debt schedules, and alert preferences) in deterministic, structured JSON. Strictly audited to exclude API keys and authorization secrets.
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
            <div className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/20 space-y-2">
              <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <Sparkles className="size-4 text-emerald-400" />
                Seed Fintech Sample Data
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Populate your private account with realistic Indian fintech records (Swiggy, D-Mart, HDFC loans, SIP investments) to explore advanced charts and simulation models.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedData}
                disabled={isProcessing}
                className="h-8 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
              >
                <Database className="size-3.5" />
                {isProcessing ? 'Writing to Firestore...' : 'Seed Sample Records'}
              </Button>
            </div>

            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-2">
              <span className="font-semibold text-sm text-destructive flex items-center gap-1.5">
                <AlertOctagon className="size-4" />
                Clear Financial Records
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Permanently delete all transactions, budgets, goals, and portfolio records from your Firestore profile. Irreversible action.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setResetModalOpen(true)}
                className="h-8 text-xs gap-1.5"
              >
                <Trash2 className="size-3.5" />
                Wipe All Ledger Data
              </Button>
            </div>
          </div>

          {/* Delete Account Permanently (Phase 12) */}
          {isAuthenticated && (
            <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 space-y-2">
              <span className="font-semibold text-sm text-destructive flex items-center gap-1.5">
                <AlertOctagon className="size-4" />
                Delete Account Permanently
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Delete your entire FinWise AI profile and user document. All data in Firestore across all subcollections will be cascaded and purged forever.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteAccountModalOpen(true)}
                className="h-8 text-xs gap-1.5"
              >
                <Trash2 className="size-3.5" />
                Delete My Account Permanently
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Notification & Alert Settings */}
      <Card className="shadow-sm border border-border/80">
        <CardHeader className="p-4 sm:p-6 border-b">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bell className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Notification Rules & Thresholds</CardTitle>
              <CardDescription className="text-xs">
                Configure rule-based alerts for overspending, upcoming EMIs, and monthly budget limits
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="divide-y divide-border/60">
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold text-foreground block">Budget Velocity Alerts</span>
                <span className="text-[11px] text-muted-foreground">Trigger warnings when category spending crosses 80% threshold</span>
              </div>
              <Switch
                checked={alertPrefs.budgetAlert}
                onCheckedChange={(c) => setAlertPrefs({ ...alertPrefs, budgetAlert: c })}
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

      {/* Modal: Wipe Ledger Data */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="max-w-md p-5 bg-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2 text-base">
              <AlertOctagon className="size-4" />
              Confirm Database Reset
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will permanently delete all {finwise.transactions.length} transactions, {finwise.receipts.length} receipts, budgets, and investments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Please type <code className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">RESET-DATA</code> to confirm:
            </p>
            <Input
              value={confirmKeyword}
              onChange={(e) => setConfirmKeyword(e.target.value)}
              placeholder="RESET-DATA"
              className="h-8 text-xs font-mono"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setResetModalOpen(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={confirmKeyword !== 'RESET-DATA' || isProcessing}
              onClick={handleConfirmClearData}
              className="h-8 text-xs gap-1.5"
            >
              {isProcessing ? 'Purging records...' : 'Permanently Delete Records'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Delete Account Permanently (Phase 12) */}
      <Dialog open={deleteAccountModalOpen} onOpenChange={setDeleteAccountModalOpen}>
        <DialogContent className="max-w-md p-5 bg-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2 text-base">
              <AlertOctagon className="size-4" />
              Delete Account Permanently
            </DialogTitle>
            <DialogDescription className="text-xs">
              All user records across all collections will be permanently deleted and your login credentials will be removed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Please type <code className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">Delete my account permanently</code> to confirm:
            </p>
            <Input
              value={confirmDeleteAccountKeyword}
              onChange={(e) => setConfirmDeleteAccountKeyword(e.target.value)}
              placeholder="Delete my account permanently"
              className="h-8 text-xs"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteAccountModalOpen(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={confirmDeleteAccountKeyword !== 'Delete my account permanently' || isProcessing}
              onClick={handleConfirmDeleteAccount}
              className="h-8 text-xs gap-1.5"
            >
              {isProcessing ? 'Deleting account...' : 'Delete My Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
