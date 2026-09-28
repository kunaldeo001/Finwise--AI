'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  resetPassword,
  evaluatePasswordStrength,
  formatAuthError,
  PasswordStrength,
} from '@/firebase/auth/auth-service';
import { useDemoMode } from '@/context/demo-mode-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Mail, User, ShieldCheck, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'signin' | 'signup';
}

export function AuthDialog({ open, onOpenChange, defaultTab = 'signin' }: AuthDialogProps) {
  const auth = useAuth();
  const { toast } = useToast();
  const { enableDemoMode } = useDemoMode();

  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab);
  const [isForgotPass, setIsForgotPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const strength: PasswordStrength = evaluatePasswordStrength(password);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsForgotPass(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmail(auth, email, password);
      toast({
        title: 'Welcome back!',
        description: 'Successfully authenticated to your private workspace.',
      });
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your confirm password.');
      return;
    }

    try {
      setLoading(true);
      await signUpWithEmail(auth, email, password, displayName);
      toast({
        title: 'Account Created',
        description: 'Your secure, isolated financial account is ready.',
      });
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      setGoogleLoading(true);
      await signInWithGoogle(auth);
      toast({
        title: 'Signed in with Google',
        description: 'Welcome to your FinWise AI workspace.',
      });
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your account email address.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(auth, email);
      setSuccessMsg(`Password reset instructions have been sent to ${email}. Check your inbox.`);
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleTryDemo = () => {
    enableDemoMode();
    toast({
      title: 'Demo Mode Activated',
      description: 'Exploring FinWise AI with realistic simulated fintech data.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent className="sm:max-w-[440px] p-6 bg-card border-border/80 shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2 text-center sm:text-left">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="size-4.5" />
            </div>
            <span className="font-bold text-base tracking-tight">FinWise AI Authentication</span>
          </div>
          <DialogTitle className="text-xl font-bold">
            {isForgotPass
              ? 'Reset Your Password'
              : tab === 'signin'
              ? 'Access Your Private Ledger'
              : 'Create Your Secure Account'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isForgotPass
              ? 'Enter your email to receive a password reset link.'
              : tab === 'signin'
              ? 'Your financial data is completely encrypted and isolated to your profile.'
              : 'Sign up to isolate your personal finances, track net worth, and scan receipts.'}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive" className="py-2.5 px-3 text-xs bg-destructive/10 border-destructive/30 text-destructive-foreground">
            <AlertCircle className="size-4 shrink-0" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {successMsg && (
          <Alert className="py-2.5 px-3 text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <AlertDescription>{successMsg}</AlertDescription>
          </Alert>
        )}

        {isForgotPass ? (
          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Account Email</Label>
              <div className="relative">
                <Mail className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-9 text-xs"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500">
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'Send Reset Link'}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsForgotPass(false)}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setErrorMsg(null); setSuccessMsg(null); }} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-4 h-9">
              <TabsTrigger value="signin" className="text-xs font-semibold">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs font-semibold">Create Account</TabsTrigger>
            </TabsList>

            {/* SIGN IN TAB */}
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-9 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Password</Label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPass(true)}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 h-9 text-xs"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 shadow-sm mt-2">
                  {loading ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
                  Sign In to Workspace
                </Button>
              </form>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="h-8 text-xs font-medium gap-1.5"
                >
                  {googleLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <svg className="size-3.5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTryDemo}
                  className="h-8 text-xs font-medium border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                >
                  <Sparkles className="size-3.5" />
                  Try Demo
                </Button>
              </div>
            </TabsContent>

            {/* CREATE ACCOUNT TAB */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Your Name (Optional)</Label>
                  <div className="relative">
                    <User className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="e.g. Alex Morgan"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-9 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 h-9 text-xs"
                      required
                    />
                  </div>

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="pt-1.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Strength:</span>
                        <span className="font-semibold text-foreground">{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full flex-1 rounded-full transition-all duration-300 ${
                              strength.score >= step ? strength.color : 'bg-muted/40'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 h-9 text-xs"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 shadow-sm mt-3">
                  {loading ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
                  Create Isolated Workspace
                </Button>
              </form>

              <div className="text-center pt-1 text-[11px] text-muted-foreground">
                Want to explore first without signing up?{' '}
                <button
                  type="button"
                  onClick={handleTryDemo}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  Continue with Demo
                </button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
