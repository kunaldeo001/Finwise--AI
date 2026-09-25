'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Wallet } from 'lucide-react';

export function SmartOnboardingDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  const [income, setIncome] = useState('85000');
  const [expenses, setExpenses] = useState('48000');
  const [liquidSavings, setLiquidSavings] = useState('120000');
  const [primaryGoal, setPrimaryGoal] = useState('Emergency Fund');

  useEffect(() => {
    const hasSeen = localStorage.getItem('finwise_onboarding_seen');
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleFinish = () => {
    localStorage.setItem('finwise_onboarding_seen', 'true');
    localStorage.setItem(
      'finwise_user_profile_quick',
      JSON.stringify({ income, expenses, liquidSavings, primaryGoal })
    );
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem('finwise_onboarding_seen', 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="size-7 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
              <Sparkles className="size-4" />
            </div>
            <DialogTitle className="text-lg">Welcome to FinWise AI</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Personalize your AI copilot and baseline financial metrics in 30 seconds. All fields are optional.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Estimated Monthly Income (₹)</label>
              <Input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="e.g. 85000"
              />
              <span className="text-[10px] text-muted-foreground">Salary, freelancing, or business income.</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Typical Monthly Expenses (₹)</label>
              <Input
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="e.g. 48000"
              />
              <span className="text-[10px] text-muted-foreground">Rent, food, EMI, utilities, and lifestyle.</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">What is your primary financial goal?</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Emergency Fund',
                  'Retirement / FIRE',
                  'Debt Payoff',
                  'Home Downpayment',
                  'Stock Portfolio',
                  'Higher Education',
                ].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setPrimaryGoal(g)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      primaryGoal === g
                        ? 'border-accent bg-accent/15 text-accent font-semibold'
                        : 'border-border/60 hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Current Liquid Savings (₹)</label>
              <Input
                type="number"
                value={liquidSavings}
                onChange={(e) => setLiquidSavings(e.target.value)}
                placeholder="e.g. 120000"
              />
              <span className="text-[10px] text-muted-foreground">Emergency buffer held in bank accounts.</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40">
          <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
          <span>Your data is stored locally / in your private Firestore sandbox. Never sold or shared.</span>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between w-full pt-2">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs h-8 text-muted-foreground">
            Skip for Now
          </Button>

          <div className="flex items-center gap-2">
            {step === 1 ? (
              <Button size="sm" onClick={() => setStep(2)} className="text-xs h-8 gap-1">
                Next <ArrowRight className="size-3" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleFinish} className="text-xs h-8 gap-1 bg-accent text-accent-foreground">
                <CheckCircle2 className="size-3" /> Start Exploring
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
