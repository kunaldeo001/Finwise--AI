
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { generateGoalSuggestion } from '@/app/goals/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const initialState = {
  success: false,
  message: '',
  data: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Zap className="mr-2 h-4 w-4" />
      )}
      Generate AI Plan
    </Button>
  );
}

export function GoalForm() {
  const [state, formAction] = useActionState(generateGoalSuggestion, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && !state.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card>
        <form action={formAction}>
          <CardHeader>
            <CardTitle>Define Your Goal</CardTitle>
            <CardDescription>Tell us what you&apos;re aiming for, and our AI will create a plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="goal">Financial Goal</Label>
              <Input id="goal" name="goal" placeholder="e.g., Down payment for a house" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentSavings">Current Savings (₹)</Label>
                <Input id="currentSavings" name="currentSavings" type="number" placeholder="5000" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyContribution">Monthly Contribution (₹)</Label>
                <Input id="monthlyContribution" name="monthlyContribution" type="number" placeholder="500" required />
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="timeHorizon">Time Horizon (Years)</Label>
                <Input id="timeHorizon" name="timeHorizon" type="number" placeholder="5" required />
            </div>
            <div className="space-y-3">
              <Label>Risk Tolerance</Label>
              <RadioGroup name="riskTolerance" defaultValue="medium" className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low">Low</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high">High</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>

      {state.data && (
        <Card className="bg-primary/5 border-primary/20 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-primary">Your AI-Powered Goal Plan</CardTitle>
            <CardDescription>Here&apos;s a personalized strategy to achieve your goal of {state.data.goal}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Est. Savings Required</span>
              <span className="font-semibold">₹{state.data.estimatedSavingsRequired.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Est. Time to Goal</span>
              <span className="font-semibold">{state.data.estimatedTimeToGoal} years</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Recommended Strategy</h4>
              <p className="text-muted-foreground">{state.data.recommendedInvestmentStrategy}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Progress & Recommendations</h4>
              <p className="text-muted-foreground">{state.data.progressTracking}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
