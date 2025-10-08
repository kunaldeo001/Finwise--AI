
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { generateChatResponse } from '@/app/assistant/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Zap, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const initialState = {
  success: false,
  message: '',
  response: null,
  query: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
      Send
    </Button>
  );
}

export function Chatbot() {
  const [state, formAction] = useActionState(generateChatResponse, initialState);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message && !state.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
    if (state.success) {
        formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <div className="flex flex-col gap-4">
      {state.response && (
         <Card>
            <CardHeader className="flex flex-row items-start gap-3">
                <Bot className="size-6 text-primary" />
                <div>
                    <CardTitle>AI Response</CardTitle>
                    <CardDescription>to: &quot;{state.query}&quot;</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{state.response}</p>
            </CardContent>
         </Card>
      )}

      <form
        ref={formRef}
        action={formAction}
        className="flex items-center gap-2"
      >
        {/* These fields are hidden but passed to the action */}
        <input type="hidden" name="userData" value="User has a portfolio of ₹5,57,467 with a mix of stocks and crypto. Recent spending is on track with budget." />
        <input type="hidden" name="marketTrends" value="Tech stocks are bullish, crypto market is volatile. Real estate is showing slow but steady growth." />
        
        <Input
            name="query"
            placeholder="e.g., Should I invest more in tech stocks?"
            required
        />
        <SubmitButton />
      </form>
    </div>
  );
}
