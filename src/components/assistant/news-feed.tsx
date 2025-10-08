
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { generateNewsFeed } from '@/app/assistant/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Newspaper, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

const initialState = {
  success: false,
  message: '',
  data: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
      Generate News Feed
    </Button>
  );
}

export function NewsFeed() {
  const [state, formAction] = useFormState(generateNewsFeed, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && !state.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    } else if (state.message && state.success) {
      toast({
        title: 'Success',
        description: state.message,
      })
    }
  }, [state, toast]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-1">
        <form action={formAction}>
          <CardHeader>
            <CardTitle>Personalize Your Feed</CardTitle>
            <CardDescription>Enter your interests and portfolio to get curated news.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interests">Financial Interests</Label>
              <Input id="interests" name="interests" placeholder="e.g., tech stocks, crypto, real estate" defaultValue="tech stocks, AI, green energy" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investmentPortfolio">Investment Portfolio</Label>
              <Input id="investmentPortfolio" name="investmentPortfolio" placeholder="e.g., AAPL, GOOGL, BTC" defaultValue="AAPL, TSLA, NVDA" />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper />
              Your Financial News
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.data?.newsFeed.length === 0 && <p className="text-muted-foreground text-center">Your news feed is empty. Generate one to get started.</p>}
            
            {(state.data?.newsFeed || []).map((item, index) => (
              <div key={index}>
                <div className="flex flex-col gap-2">
                  <Link href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    <h3 className="font-semibold">{item.title}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground">{item.summary}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.relevanceScore > 0.8 ? 'default' : 'secondary'}>
                      Relevance: {(item.relevanceScore * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                {index < state.data!.newsFeed.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
            
            {useFormStatus().pending && (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                            <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
                            <div className="h-3 bg-muted rounded w-5/6 animate-pulse"></div>
                        </div>
                    ))}
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
